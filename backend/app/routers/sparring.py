from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from pydantic import BaseModel
import uuid
import re
import os
import httpx
import resend
from app.services.db import _headers, _ready, SUPABASE_URL

resend.api_key = os.getenv("RESEND_API_KEY", "")
FROM = "TennisAce <noreply@tennisace.live>"

router = APIRouter()

BASE = f"{SUPABASE_URL}/rest/v1" if SUPABASE_URL else ""


# ── helpers ──────────────────────────────────────────────────────────────────

async def _get(table: str, params: dict) -> list:
    if not _ready():
        return []
    async with httpx.AsyncClient() as c:
        r = await c.get(f"{BASE}/{table}", headers=_headers(), params=params, timeout=10)
        if r.status_code != 200:
            return []
        data = r.json()
        return data if isinstance(data, list) else []


async def _post(table: str, body: dict, prefer: str = "return=representation") -> dict:
    if not _ready():
        raise HTTPException(503, "Database unavailable")
    async with httpx.AsyncClient() as c:
        r = await c.post(
            f"{BASE}/{table}",
            headers={**_headers(), "Prefer": prefer},
            json=body,
            timeout=10,
        )
        if r.status_code not in (200, 201):
            raise HTTPException(r.status_code, r.text)
        data = r.json()
        return data[0] if isinstance(data, list) and data else {}


async def _patch(table: str, row_id: str, body: dict) -> dict:
    if not _ready():
        raise HTTPException(503, "Database unavailable")
    async with httpx.AsyncClient() as c:
        r = await c.patch(
            f"{BASE}/{table}",
            headers={**_headers(), "Prefer": "return=representation"},
            params={"id": f"eq.{row_id}"},
            json=body,
            timeout=10,
        )
        if r.status_code not in (200, 201):
            raise HTTPException(r.status_code, r.text)
        data = r.json()
        return data[0] if isinstance(data, list) and data else {}


# ── GET /sparring/profiles ────────────────────────────────────────────────────

@router.get("/profiles")
async def list_profiles(
    city:      Optional[str] = Query(None),
    level:     Optional[str] = Query(None),
    surface:   Optional[str] = Query(None),
    day:       Optional[str] = Query(None),
    time_slot: Optional[str] = Query(None),
    limit:     int = Query(50, le=100),
    offset:    int = Query(0),
):
    profile_id_filter: Optional[set] = None
    if day or time_slot:
        avail_params: dict = {"select": "profile_id"}
        if day:
            avail_params["day_of_week"] = f"eq.{day}"
        if time_slot:
            avail_params["time_slot"] = f"eq.{time_slot}"
        rows = await _get("sparring_availability", avail_params)
        ids = {r["profile_id"] for r in rows if r.get("profile_id")}
        profile_id_filter = ids
        if not ids:
            return {"profiles": [], "total": 0}

    # email and phone intentionally excluded from public listing
    params: dict = {
        "select": "id,name,photo_url,city,country,level,surface,play_type,bio,role,profile_type,founding_number,favorite_players,coaching_level,coaching_fee,created_at",
        "order":  "created_at.desc",
        "limit":  limit,
        "offset": offset,
    }
    if city:
        params["city"] = f"ilike.*{city}*"
    if level:
        params["level"] = f"eq.{level}"
    if surface:
        params["surface"] = f"cs.{{{surface}}}"
    if profile_id_filter is not None:
        params["id"] = f"in.({','.join(profile_id_filter)})"

    profiles = await _get("sparring_profiles", params)

    if profiles:
        ids_csv = ",".join(p["id"] for p in profiles)
        avail_rows = await _get("sparring_availability", {
            "profile_id": f"in.({ids_csv})",
            "select":     "profile_id,day_of_week,time_slot",
        })
        avail_map: dict = {}
        for a in avail_rows:
            avail_map.setdefault(a["profile_id"], []).append({
                "day":  a["day_of_week"],
                "time": a["time_slot"],
            })
        for p in profiles:
            p["availability"] = avail_map.get(p["id"], [])

    return {"profiles": profiles, "total": len(profiles)}


# ── GET /sparring/profiles/by-email ──────────────────────────────────────────

@router.get("/profiles/by-email")
async def get_profile_by_email(email: str = Query(...)):
    rows = await _get("sparring_profiles", {
        "email":  f"eq.{email.lower().strip()}",
        "select": "id,name,photo_url,city,country,level,role,created_at",
        "limit":  1,
    })
    if not rows:
        raise HTTPException(404, "No profile found for this email")
    return rows[0]


# ── GET /sparring/profiles/by-handle?handle={handle} ─────────────────────────

@router.get("/profiles/by-handle")
async def get_profile_by_handle(handle: str = Query(...)):
    rows = await _get("sparring_profiles", {
        "handle": f"eq.{handle.lower().strip()}",
        "select": "*",
        "limit":  1,
    })
    if not rows:
        raise HTTPException(404, "Profile not found")
    profile = rows[0]
    profile.pop("phone",          None)
    profile.pop("email",          None)
    profile.pop("email_verified", None)
    avail = await _get("sparring_availability", {
        "profile_id": f"eq.{profile['id']}",
        "select":     "day_of_week,time_slot",
    })
    profile["availability"] = [{"day": a["day_of_week"], "time": a["time_slot"]} for a in avail]
    return profile


# ── GET /sparring/members/count ───────────────────────────────────────────────

@router.get("/members/count")
async def get_members_count():
    rows = await _get("sparring_profiles", {"select": "id"})
    return {"count": len(rows)}


# ── GET /sparring/profiles/{id} ───────────────────────────────────────────────

@router.get("/profiles/{profile_id}")
async def get_profile(profile_id: str):
    rows = await _get("sparring_profiles", {
        "id":     f"eq.{profile_id}",
        "select": "*",
        "limit":  1,
    })
    if not rows:
        raise HTTPException(404, "Profile not found")
    profile = rows[0]
    profile.pop("phone",          None)  # never expose phone publicly
    profile.pop("email",          None)  # never expose email publicly
    profile.pop("email_verified", None)

    avail = await _get("sparring_availability", {
        "profile_id": f"eq.{profile_id}",
        "select":     "day_of_week,time_slot",
    })
    profile["availability"] = [{"day": a["day_of_week"], "time": a["time_slot"]} for a in avail]
    return profile


# ── POST /sparring/profiles ───────────────────────────────────────────────────

@router.post("/profiles", status_code=201)
async def create_profile(body: dict):
    availability: list = body.pop("availability", [])

    profile_type = body.get("profile_type") or body.get("role") or "player"
    # role must remain 'player'|'coach' for backward compat; organizer maps to player
    role = "coach" if profile_type == "coach" else "player"

    # Generate a unique handle from the name
    raw_name = body.get("name", "").strip()
    base_handle = re.sub(r"[^a-z0-9]", "", raw_name.lower()) or "player"
    handle = base_handle
    suffix = 2
    while True:
        taken = await _get("sparring_profiles", {"handle": f"eq.{handle}", "select": "id", "limit": 1})
        if not taken:
            break
        handle = f"{base_handle}{suffix}"
        suffix += 1

    profile_body = {
        "name":            raw_name,
        "photo_url":       body.get("photo_url"),
        "city":            body.get("city", "").strip(),
        "country":         body.get("country", "").strip(),
        "level":           body.get("level"),
        "surface":         body.get("surface", []),
        "play_type":       body.get("play_type") or None,
        "bio":             body.get("bio", "").strip() or None,
        "role":            role,
        "profile_type":    profile_type,
        "favorite_players":body.get("favorite_players", "").strip() or None,
        "coaching_level":  body.get("coaching_level", "").strip() or None,
        "coaching_fee":    body.get("coaching_fee", "").strip() or None,
        "email":           body.get("email") or None,
        "email_verified":  body.get("email_verified", False),
        "phone":           body.get("phone") or None,
        "handle":          handle,
    }
    if not all([profile_body["name"], profile_body["city"], profile_body["country"], profile_body["level"]]):
        raise HTTPException(422, "name, city, country, level are required")

    if profile_body.get("email"):
        existing = await _get("sparring_profiles", {
            "email": f"eq.{profile_body['email']}",
            "select": "id",
            "limit": 1,
        })
        if existing:
            raise HTTPException(409, "A profile already exists for this email. Sign in instead.")

    profile = await _post("sparring_profiles", profile_body)
    profile_id = profile.get("id")

    if profile_id and availability:
        slots = [
            {"profile_id": profile_id, "day_of_week": slot["day"], "time_slot": slot["time"]}
            for slot in availability
            if slot.get("day") and slot.get("time")
        ]
        if slots:
            async with httpx.AsyncClient() as c:
                await c.post(
                    f"{BASE}/sparring_availability",
                    headers={**_headers(), "Prefer": "return=minimal"},
                    json=slots,
                    timeout=10,
                )

    profile.pop("phone",          None)
    profile.pop("email",          None)
    profile.pop("email_verified", None)
    profile["availability"] = availability
    return profile


# ── PUT /sparring/profiles/{id} ───────────────────────────────────────────────

@router.put("/profiles/{profile_id}")
async def update_profile(profile_id: str, body: dict):
    availability: list = body.pop("availability", None)

    update_fields = {k: v for k, v in body.items()
                     if k in ("name", "photo_url", "cover_url", "city", "country", "level",
                              "surface", "play_type", "bio", "role",
                              "favorite_players", "coaching_level", "coaching_fee",
                              "email", "email_verified", "phone",
                              "dominant_hand", "backhand", "play_style", "years_playing")}
    if not update_fields and availability is None:
        raise HTTPException(422, "Nothing to update")

    profile = {}
    if update_fields:
        profile = await _patch("sparring_profiles", profile_id, update_fields)

    if availability is not None:
        async with httpx.AsyncClient() as c:
            await c.delete(
                f"{BASE}/sparring_availability",
                headers=_headers(),
                params={"profile_id": f"eq.{profile_id}"},
                timeout=10,
            )
            if availability:
                slots = [
                    {"profile_id": profile_id, "day_of_week": slot["day"], "time_slot": slot["time"]}
                    for slot in availability
                    if slot.get("day") and slot.get("time")
                ]
                if slots:
                    await c.post(
                        f"{BASE}/sparring_availability",
                        headers={**_headers(), "Prefer": "return=minimal"},
                        json=slots,
                        timeout=10,
                    )
        profile["availability"] = availability

    profile.pop("phone",          None)
    profile.pop("email",          None)
    profile.pop("email_verified", None)
    return profile


# ── email helpers ─────────────────────────────────────────────────────────────

def _send(to: str, subject: str, html: str) -> None:
    """Fire-and-forget email. Fails silently."""
    try:
        if not resend.api_key or not to:
            return
        resend.Emails.send({"from": FROM, "to": to, "subject": subject, "html": html})
    except Exception:
        pass


# ── POST /sparring/requests ───────────────────────────────────────────────────

class SparringRequestCreate(BaseModel):
    to_profile_id:   uuid.UUID
    from_profile_id: Optional[uuid.UUID] = None
    requester_name:  str
    requester_city:  str
    from_email:      Optional[str] = None
    from_phone:      Optional[str] = None

@router.post("/requests", status_code=201)
async def create_request(body: SparringRequestCreate):
    requester_name = body.requester_name.strip()
    requester_city = body.requester_city.strip()
    if not requester_name or not requester_city:
        raise HTTPException(422, "requester_name and requester_city are required")

    result = await _post("sparring_requests", {
        "to_profile_id":   str(body.to_profile_id),
        "from_profile_id": str(body.from_profile_id) if body.from_profile_id else None,
        "requester_name":  requester_name,
        "requester_city":  requester_city,
        "from_email":      body.from_email or None,
        "from_phone":      body.from_phone or None,
    })

    # Notify profile owner — fetch their email then send
    owner_rows = await _get("sparring_profiles", {
        "id":     f"eq.{body.to_profile_id}",
        "select": "email",
        "limit":  1,
    })
    owner_email = owner_rows[0].get("email") if owner_rows else None
    _send(
        to=owner_email,
        subject="Someone wants to play tennis with you 🎾",
        html=f"""
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#f9f9f9;border-radius:8px">
          <h2 style="margin:0 0 8px;color:#000">New sparring request</h2>
          <p style="color:#444;margin:0 0 20px">
            <strong>{requester_name}</strong> from <strong>{requester_city}</strong>
            wants to hit with you on TennisAce.
          </p>
          <a href="https://tennisace.live/sparring/my-requests"
             style="display:inline-block;background:#39FF14;color:#000;font-weight:800;
                    padding:12px 24px;border-radius:6px;text-decoration:none;font-size:15px">
            See request &amp; respond →
          </a>
          <p style="color:#999;font-size:12px;margin:24px 0 0">TennisAce Sparring</p>
        </div>
        """,
    )

    return result


# ── GET /sparring/requests/received ──────────────────────────────────────────

@router.get("/requests/received")
async def get_received_requests(email: str = Query(...)):
    # Find all profiles owned by this email address
    profile_rows = await _get("sparring_profiles", {
        "email":  f"eq.{email}",
        "select": "id,phone",
    })
    if not profile_rows:
        return {"requests": []}

    profile_ids = [p["id"] for p in profile_rows]
    ids_csv = ",".join(profile_ids)

    requests = await _get("sparring_requests", {
        "to_profile_id": f"in.({ids_csv})",
        "select":        "id,to_profile_id,requester_name,requester_city,from_phone,status,created_at",
        "order":         "created_at.desc",
    })

    # Strip from_phone on non-accepted requests
    for req in requests:
        if req.get("status") != "accepted":
            req.pop("from_phone", None)

    # Attach profile name/city for context
    profiles_detail = await _get("sparring_profiles", {
        "id":     f"in.({ids_csv})",
        "select": "id,name,city",
    })
    profile_detail_map = {p["id"]: p for p in profiles_detail}
    for req in requests:
        req["to_profile"] = profile_detail_map.get(req.get("to_profile_id"), {})

    return {"requests": requests}


# ── GET /sparring/requests/sent ───────────────────────────────────────────────

@router.get("/requests/sent")
async def get_sent_requests(email: str = Query(...)):
    requests = await _get("sparring_requests", {
        "from_email": f"eq.{email}",
        "select":     "id,to_profile_id,requester_name,requester_city,status,created_at",
        "order":      "created_at.desc",
    })

    if requests:
        profile_ids = ",".join(set(r["to_profile_id"] for r in requests if r.get("to_profile_id")))
        if profile_ids:
            profile_rows = await _get("sparring_profiles", {
                "id":     f"in.({profile_ids})",
                "select": "id,name,city,country,phone",
            })
            profile_map = {p["id"]: p for p in profile_rows}
            for req in requests:
                p = profile_map.get(req.get("to_profile_id"), {})
                req["to_profile"] = {
                    "id":      p.get("id"),
                    "name":    p.get("name"),
                    "city":    p.get("city"),
                    "country": p.get("country"),
                    # only expose phone if request was accepted
                    "phone":   p.get("phone") if req.get("status") == "accepted" else None,
                }

    return {"requests": requests}


# ── PUT /sparring/requests/{id} ───────────────────────────────────────────────

@router.put("/requests/{request_id}")
async def update_request(request_id: str, body: dict):
    status = body.get("status")
    if status not in ("accepted", "declined"):
        raise HTTPException(422, "status must be 'accepted' or 'declined'")

    # Fetch request before patching so we have profile id, from_phone, from_email
    req_rows = await _get("sparring_requests", {
        "id":     f"eq.{request_id}",
        "select": "to_profile_id,from_phone,from_email,requester_name",
        "limit":  1,
    })

    updated = await _patch("sparring_requests", request_id, {"status": status})

    if status == "accepted" and req_rows:
        req = req_rows[0]
        # Fetch profile owner name + phone for mutual reveal
        profile_rows = await _get("sparring_profiles", {
            "id":     f"eq.{req['to_profile_id']}",
            "select": "name,phone",
            "limit":  1,
        })
        owner        = profile_rows[0] if profile_rows else {}
        to_phone     = owner.get("phone")
        from_phone   = req.get("from_phone")
        from_email   = req.get("from_email")
        requester_name = updated.get("requester_name") or req.get("requester_name", "Your partner")
        owner_name   = owner.get("name", "Your partner")

        updated["to_phone"]   = to_phone
        updated["from_phone"] = from_phone

        # Re-fetch request for requester_name if not on updated
        if not requester_name:
            req_detail = await _get("sparring_requests", {
                "id": f"eq.{request_id}", "select": "requester_name", "limit": 1,
            })
            requester_name = req_detail[0].get("requester_name", "Your partner") if req_detail else "Your partner"

        wa_from = f"https://wa.me/{from_phone.lstrip('+').replace(' ', '')}" if from_phone else None
        wa_to   = f"https://wa.me/{to_phone.lstrip('+').replace(' ', '')}"   if to_phone   else None

        def _phone_line(phone: str | None, wa: str | None) -> str:
            if not phone:
                return "<p style='color:#555'>No phone number provided.</p>"
            link = f'<a href="{wa}" style="color:#39FF14">Message on WhatsApp →</a>' if wa else ""
            return f"<p style='color:#000;font-size:18px;font-weight:800'>{phone}</p>{link}"

        # Email to profile owner
        owner_email_rows = await _get("sparring_profiles", {
            "id": f"eq.{req['to_profile_id']}", "select": "email", "limit": 1,
        })
        owner_email = owner_email_rows[0].get("email") if owner_email_rows else None
        _send(
            to=owner_email,
            subject=f"You accepted {requester_name}'s request 🎾",
            html=f"""
            <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#f9f9f9;border-radius:8px">
              <h2 style="margin:0 0 8px;color:#000">You're on! 🎾</h2>
              <p style="color:#444;margin:0 0 16px">
                You accepted <strong>{requester_name}</strong>'s request.
                Here's their contact:
              </p>
              {_phone_line(from_phone, wa_from)}
              <p style="color:#999;font-size:12px;margin:24px 0 0">TennisAce Sparring</p>
            </div>
            """,
        )

        # Email to requester
        _send(
            to=from_email,
            subject=f"{owner_name} accepted your request! 🎾",
            html=f"""
            <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#f9f9f9;border-radius:8px">
              <h2 style="margin:0 0 8px;color:#000">Your request was accepted! 🎾</h2>
              <p style="color:#444;margin:0 0 16px">
                <strong>{owner_name}</strong> accepted your sparring request.
                Here's their contact:
              </p>
              {_phone_line(to_phone, wa_to)}
              <p style="color:#999;font-size:12px;margin:24px 0 0">TennisAce Sparring</p>
            </div>
            """,
        )

    return updated


# ── GET /sparring/city-progress/{city} ───────────────────────────────────────

@router.get("/city-progress/{city}")
async def get_city_progress(city: str):
    # Get city_progress row
    cp_rows = await _get("city_progress", {
        "city": f"ilike.{city.strip()}",
        "limit": 1,
    })

    # Aggregate counts directly from profiles (authoritative)
    profile_rows = await _get("sparring_profiles", {
        "select": "id,name,photo_url,city,country,profile_type,founding_number,created_at",
        "order":  "founding_number.asc",
        "city":   f"ilike.*{city.strip()}*",
        "limit":  200,
    })

    player_count = sum(1 for p in profile_rows if p.get("profile_type") in ("player", "organizer", None, ""))
    coach_count  = sum(1 for p in profile_rows if p.get("profile_type") == "coach")
    next_number  = len(profile_rows) + 1

    cp = cp_rows[0] if cp_rows else {
        "city": city, "country": "India", "player_target": 500, "coach_target": 50, "status": "building"
    }

    # Determine status milestone
    total = player_count + coach_count
    if total >= 200:
        status = "community_launch"
    elif total >= 50:
        status = "early_access"
    else:
        status = "building"

    # First 20 founding members for avatar grid
    founding_members = [
        {
            "id":              p["id"],
            "name":            p["name"],
            "photo_url":       p.get("photo_url"),
            "founding_number": p.get("founding_number"),
            "profile_type":    p.get("profile_type") or "player",
        }
        for p in profile_rows[:20]
    ]

    return {
        "city":             cp.get("city", city),
        "country":          cp.get("country", "India"),
        "player_count":     player_count,
        "coach_count":      coach_count,
        "player_target":    cp.get("player_target", 500),
        "coach_target":     cp.get("coach_target", 50),
        "status":           status,
        "next_number":      next_number,
        "founding_members": founding_members,
    }
