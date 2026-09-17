from fastapi import APIRouter, HTTPException, Query
import httpx
from app.services.db import _headers, _ready, SUPABASE_URL

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


# ── POST /social/follow ───────────────────────────────────────────────────────

@router.post("/follow", status_code=201)
async def follow(body: dict):
    follower_id  = body.get("follower_id")
    following_id = body.get("following_id")
    if not follower_id or not following_id:
        raise HTTPException(422, "follower_id and following_id are required")
    if follower_id == following_id:
        raise HTTPException(422, "Cannot follow yourself")
    if not _ready():
        raise HTTPException(503, "Database unavailable")

    async with httpx.AsyncClient() as c:
        r = await c.post(
            f"{BASE}/follows",
            headers={**_headers(), "Prefer": "resolution=merge-duplicates,return=minimal"},
            json={"follower_id": follower_id, "following_id": following_id},
            timeout=10,
        )
        if r.status_code not in (200, 201, 204):
            raise HTTPException(r.status_code, r.text)
    return {"ok": True}


# ── POST /social/unfollow ─────────────────────────────────────────────────────

@router.post("/unfollow")
async def unfollow(body: dict):
    follower_id  = body.get("follower_id")
    following_id = body.get("following_id")
    if not follower_id or not following_id:
        raise HTTPException(422, "follower_id and following_id are required")
    if not _ready():
        raise HTTPException(503, "Database unavailable")

    async with httpx.AsyncClient() as c:
        r = await c.delete(
            f"{BASE}/follows",
            headers={**_headers(), "Prefer": "return=minimal"},
            params={"follower_id": f"eq.{follower_id}", "following_id": f"eq.{following_id}"},
            timeout=10,
        )
        if r.status_code not in (200, 204):
            raise HTTPException(r.status_code, r.text)
    return {"ok": True}


# ── GET /social/status ─────────────────────────────────────────────────────────

@router.get("/status")
async def follow_status(follower_id: str = Query(...), following_id: str = Query(...)):
    rows = await _get("follows", {
        "follower_id":  f"eq.{follower_id}",
        "following_id": f"eq.{following_id}",
        "select":       "follower_id",
        "limit":        1,
    })
    return {"following": len(rows) > 0}


# ── GET /social/counts/{profile_id} ────────────────────────────────────────────

@router.get("/counts/{profile_id}")
async def follow_counts(profile_id: str):
    followers = await _get("follows", {"following_id": f"eq.{profile_id}", "select": "follower_id"})
    following = await _get("follows", {"follower_id": f"eq.{profile_id}", "select": "following_id"})
    return {"followers": len(followers), "following": len(following)}


# ── GET /social/followers/{profile_id} ─────────────────────────────────────────

@router.get("/followers/{profile_id}")
async def list_followers(profile_id: str):
    rows = await _get("follows", {"following_id": f"eq.{profile_id}", "select": "follower_id"})
    ids = [r["follower_id"] for r in rows]
    if not ids:
        return {"profiles": []}
    profiles = await _get("sparring_profiles", {
        "id":     f"in.({','.join(ids)})",
        "select": "id,name,photo_url,city,founding_number",
    })
    return {"profiles": profiles}


# ── GET /social/following/{profile_id} ─────────────────────────────────────────

@router.get("/following/{profile_id}")
async def list_following(profile_id: str):
    rows = await _get("follows", {"follower_id": f"eq.{profile_id}", "select": "following_id"})
    ids = [r["following_id"] for r in rows]
    if not ids:
        return {"profiles": []}
    profiles = await _get("sparring_profiles", {
        "id":     f"in.({','.join(ids)})",
        "select": "id,name,photo_url,city,founding_number",
    })
    return {"profiles": profiles}
