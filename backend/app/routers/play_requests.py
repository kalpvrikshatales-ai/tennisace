from fastapi import APIRouter, HTTPException, Query
from typing import Optional
import httpx
import resend
import os
from datetime import datetime, date, timezone
from app.services.db import _headers, _ready, SUPABASE_URL

resend.api_key = os.getenv("RESEND_API_KEY", "")
FROM_ADDR = "TennisAce <noreply@tennisace.live>"

router = APIRouter()
BASE = f"{SUPABASE_URL}/rest/v1" if SUPABASE_URL else ""


async def _get(table: str, params: dict) -> list:
    if not _ready():
        return []
    async with httpx.AsyncClient() as c:
        r = await c.get(f"{BASE}/{table}", headers=_headers(), params=params, timeout=10)
        if r.status_code != 200:
            return []
        data = r.json()
        return data if isinstance(data, list) else []


async def _post(table: str, body: dict) -> dict:
    if not _ready():
        raise HTTPException(503, "Database unavailable")
    async with httpx.AsyncClient() as c:
        r = await c.post(
            f"{BASE}/{table}",
            headers={**_headers(), "Prefer": "return=representation"},
            json=body,
            timeout=10,
        )
        if r.status_code not in (200, 201):
            raise HTTPException(r.status_code, r.text)
        data = r.json()
        return data[0] if isinstance(data, list) and data else {}


async def _set_status(request_id: str, status: str) -> None:
    if not _ready():
        return
    async with httpx.AsyncClient() as c:
        await c.patch(
            f"{BASE}/play_requests",
            headers={**_headers(), "Prefer": "return=minimal"},
            params={"id": f"eq.{request_id}"},
            json={"status": status},
            timeout=10,
        )


def _send(to: str | None, subject: str, html: str) -> None:
    try:
        if not resend.api_key or not to:
            return
        resend.Emails.send({"from": FROM_ADDR, "to": to, "subject": subject, "html": html})
    except Exception:
        pass


def _fmt_date(d: str) -> str:
    try:
        return datetime.strptime(d, "%Y-%m-%d").strftime("%A, %b %-d")
    except Exception:
        return d


# ── GET /play-requests ────────────────────────────────────────────────────────

@router.get("")
async def list_play_requests(city: Optional[str] = Query(None)):
    now_iso = datetime.now(timezone.utc).isoformat()

    params: dict = {
        "select":     "*",
        "order":      "date.asc,created_at.asc",
        "status":     "eq.open",
        "expires_at": f"gte.{now_iso}",
        "limit":      "50",
    }
    if city:
        params["city"] = f"ilike.*{city}*"

    requests = await _get("play_requests", params)
    if not requests:
        return {"requests": []}

    # Batch-fetch creator profiles
    profile_ids = list({r["profile_id"] for r in requests if r.get("profile_id")})
    if profile_ids:
        profiles = await _get("sparring_profiles", {
            "id":     f"in.({','.join(profile_ids)})",
            "select": "id,name,photo_url,founding_number",
        })
        profile_map = {p["id"]: p for p in profiles}
    else:
        profile_map = {}

    # Batch-fetch join counts
    req_ids_csv = ",".join(r["id"] for r in requests)
    joins = await _get("play_request_joins", {
        "request_id": f"in.({req_ids_csv})",
        "select":     "request_id",
    })
    join_map: dict[str, int] = {}
    for j in joins:
        join_map[j["request_id"]] = join_map.get(j["request_id"], 0) + 1

    for r in requests:
        r["creator"]    = profile_map.get(r.get("profile_id") or "", {})
        join_count      = join_map.get(r["id"], 0)
        r["join_count"] = join_count
        r["spots_left"] = max(0, (r.get("players_needed") or 1) - join_count)

    return {"requests": requests}


# ── POST /play-requests ───────────────────────────────────────────────────────

@router.post("", status_code=201)
async def create_play_request(body: dict):
    profile_id = body.get("profile_id")
    req_date   = body.get("date")

    if not profile_id or not req_date:
        raise HTTPException(422, "profile_id and date are required")

    try:
        d = date.fromisoformat(str(req_date))
        expires_at = datetime(d.year, d.month, d.day, 23, 59, 59, tzinfo=timezone.utc).isoformat()
    except ValueError:
        raise HTTPException(422, "date must be YYYY-MM-DD")

    city    = (body.get("city")    or "").strip()
    country = (body.get("country") or "").strip()
    if not city or not country:
        raise HTTPException(422, "city and country are required")

    row = {
        "profile_id":     profile_id,
        "city":           city,
        "country":        country,
        "date":           req_date,
        "time_slot":      body.get("time_slot") or "Any time",
        "players_needed": int(body.get("players_needed") or 1),
        "level":          body.get("level")         or None,
        "surface":        body.get("surface")        or None,
        "format":         body.get("format")         or None,
        "location_name":  (body.get("location_name") or "").strip() or None,
        "notes":          (body.get("notes")         or "").strip() or None,
        "expires_at":     expires_at,
    }

    result = await _post("play_requests", row)
    result["creator"]    = {}
    result["join_count"] = 0
    result["spots_left"] = row["players_needed"]
    return result


# ── POST /play-requests/{id}/join ─────────────────────────────────────────────

@router.post("/{request_id}/join", status_code=201)
async def join_play_request(request_id: str, body: dict):
    joiner_id = body.get("profile_id")
    if not joiner_id:
        raise HTTPException(422, "profile_id is required")

    req_rows = await _get("play_requests", {
        "id": f"eq.{request_id}", "select": "*", "limit": "1",
    })
    if not req_rows:
        raise HTTPException(404, "Request not found")
    req = req_rows[0]

    if req.get("status") != "open":
        raise HTTPException(400, "This request is no longer open")
    if req.get("profile_id") == joiner_id:
        raise HTTPException(400, "You cannot join your own request")

    # Check duplicate
    existing = await _get("play_request_joins", {
        "request_id": f"eq.{request_id}",
        "profile_id": f"eq.{joiner_id}",
        "select": "id", "limit": "1",
    })
    if existing:
        raise HTTPException(409, "You already joined this request")

    # Check capacity
    all_joins = await _get("play_request_joins", {
        "request_id": f"eq.{request_id}", "select": "id",
    })
    if len(all_joins) >= (req.get("players_needed") or 1):
        raise HTTPException(400, "This game is already full")

    join_row = await _post("play_request_joins", {
        "request_id": request_id,
        "profile_id": joiner_id,
    })

    # Mark full if now at capacity
    if len(all_joins) + 1 >= (req.get("players_needed") or 1):
        await _set_status(request_id, "full")

    # Fetch both profiles
    joiner_rows = await _get("sparring_profiles", {
        "id": f"eq.{joiner_id}", "select": "name,phone", "limit": "1",
    })
    joiner = joiner_rows[0] if joiner_rows else {}
    joiner_name  = joiner.get("name", "Someone")
    joiner_phone = joiner.get("phone")

    creator_rows = await _get("sparring_profiles", {
        "id": f"eq.{req['profile_id']}", "select": "name,email,phone", "limit": "1",
    })
    creator = creator_rows[0] if creator_rows else {}
    creator_email = creator.get("email")
    creator_phone = creator.get("phone")

    req_date   = req.get("date", "")
    time_slot  = req.get("time_slot", "")
    location   = req.get("location_name", "")
    fmt_date   = _fmt_date(req_date)

    wa_joiner = (
        f"https://wa.me/{joiner_phone.lstrip('+').replace(' ', '')}"
        if joiner_phone else None
    )

    def _phone_html(phone: str | None, wa: str | None) -> str:
        if not phone:
            return "<p style='color:#555'>No phone provided.</p>"
        link = f'<a href="{wa}" style="color:#39FF14">WhatsApp →</a>' if wa else ""
        return f"<p style='font-size:18px;font-weight:800;color:#000;margin:0 0 4px'>{phone}</p>{link}"

    _send(
        to=creator_email,
        subject=f"{joiner_name} wants to play with you on {fmt_date} 🎾",
        html=f"""
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#f9f9f9;border-radius:8px">
          <h2 style="margin:0 0 8px;color:#000">You have a player! 🎾</h2>
          <p style="color:#444;margin:0 0 20px">
            <strong>{joiner_name}</strong> wants to play with you on
            <strong>{fmt_date}</strong>{f" ({time_slot})" if time_slot else ""}
            {f"at {location}" if location else ""}.
          </p>
          <p style="color:#555;font-size:13px;margin:0 0 6px">Their contact:</p>
          {_phone_html(joiner_phone, wa_joiner)}
          <a href="https://tennisace.live/play"
             style="display:inline-block;margin-top:24px;background:#39FF14;color:#000;
                    font-weight:800;padding:12px 24px;border-radius:6px;text-decoration:none">
            View request →
          </a>
          <p style="color:#999;font-size:12px;margin:24px 0 0">TennisAce · Play Requests</p>
        </div>
        """,
    )

    join_row["creator_phone"] = creator_phone
    join_row["joiner_phone"]  = joiner_phone
    return join_row


# ── DELETE /play-requests/{id} ────────────────────────────────────────────────

@router.delete("/{request_id}")
async def cancel_play_request(request_id: str, profile_id: str = Query(...)):
    req_rows = await _get("play_requests", {
        "id": f"eq.{request_id}", "select": "id,profile_id", "limit": "1",
    })
    if not req_rows:
        raise HTTPException(404, "Request not found")
    if req_rows[0].get("profile_id") != profile_id:
        raise HTTPException(403, "You can only cancel your own requests")

    await _set_status(request_id, "cancelled")
    return {"cancelled": True}
