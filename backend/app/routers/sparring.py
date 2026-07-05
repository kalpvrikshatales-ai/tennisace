from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from pydantic import BaseModel
import uuid
import httpx
from app.services.db import _headers, _ready, SUPABASE_URL

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
    city:     Optional[str] = Query(None),
    level:    Optional[str] = Query(None),
    surface:  Optional[str] = Query(None),
    day:      Optional[str] = Query(None),
    time_slot: Optional[str] = Query(None),
    limit:    int = Query(50, le=100),
    offset:   int = Query(0),
):
    # 1. If day/time filter — fetch matching profile IDs from availability first
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

    # 2. Fetch profiles with remaining filters
    params: dict = {
        "select": "id,name,photo_url,city,country,level,surface,play_type,bio,created_at",
        "order":  "created_at.desc",
        "limit":  limit,
        "offset": offset,
    }
    if city:
        params["city"] = f"ilike.*{city}*"
    if level:
        params["level"] = f"eq.{level}"
    if surface:
        # surface is a text[] column — use cs (contains) operator
        params["surface"] = f"cs.{{{surface}}}"
    if profile_id_filter is not None:
        params["id"] = f"in.({','.join(profile_id_filter)})"

    profiles = await _get("sparring_profiles", params)

    # 3. Fetch availability for each profile and attach
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

    # Insert profile — use profile_type field for future extensibility
    profile_body = {
        "name":       body.get("name", "").strip(),
        "photo_url":  body.get("photo_url"),
        "city":       body.get("city", "").strip(),
        "country":    body.get("country", "").strip(),
        "level":      body.get("level"),
        "surface":    body.get("surface", []),
        "play_type":  body.get("play_type"),
        "bio":        body.get("bio", "").strip() or None,
    }
    if not all([profile_body["name"], profile_body["city"], profile_body["country"],
                profile_body["level"], profile_body["play_type"]]):
        raise HTTPException(422, "name, city, country, level, play_type are required")

    profile = await _post("sparring_profiles", profile_body)
    profile_id = profile.get("id")

    # Insert availability slots
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

    profile["availability"] = availability
    return profile


# ── PUT /sparring/profiles/{id} ───────────────────────────────────────────────

@router.put("/profiles/{profile_id}")
async def update_profile(profile_id: str, body: dict):
    availability: list = body.pop("availability", None)

    update_fields = {k: v for k, v in body.items()
                     if k in ("name", "photo_url", "city", "country", "level",
                              "surface", "play_type", "bio")}
    if not update_fields and availability is None:
        raise HTTPException(422, "Nothing to update")

    profile = {}
    if update_fields:
        profile = await _patch("sparring_profiles", profile_id, update_fields)

    # Replace availability if provided
    if availability is not None:
        async with httpx.AsyncClient() as c:
            # Delete existing
            await c.delete(
                f"{BASE}/sparring_availability",
                headers=_headers(),
                params={"profile_id": f"eq.{profile_id}"},
                timeout=10,
            )
            # Insert new
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

    return profile


# ── POST /sparring/requests ───────────────────────────────────────────────────

class SparringRequestCreate(BaseModel):
    to_profile_id:   uuid.UUID
    from_profile_id: Optional[uuid.UUID] = None
    requester_name:  str
    requester_city:  str

@router.post("/requests", status_code=201)
async def create_request(body: SparringRequestCreate):
    requester_name = body.requester_name.strip()
    requester_city = body.requester_city.strip()
    if not requester_name or not requester_city:
        raise HTTPException(422, "requester_name and requester_city are required")
    return await _post("sparring_requests", {
        "to_profile_id":   str(body.to_profile_id),
        "from_profile_id": str(body.from_profile_id) if body.from_profile_id else None,
        "requester_name":  requester_name,
        "requester_city":  requester_city,
    })


# ── PUT /sparring/requests/{id} ───────────────────────────────────────────────

@router.put("/requests/{request_id}")
async def update_request(request_id: str, body: dict):
    status = body.get("status")
    if status not in ("accepted", "declined"):
        raise HTTPException(422, "status must be 'accepted' or 'declined'")
    return await _patch("sparring_requests", request_id, {"status": status})
