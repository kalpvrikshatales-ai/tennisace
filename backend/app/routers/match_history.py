from fastapi import APIRouter, HTTPException, Query
from typing import Optional
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


# ── POST /match-history ───────────────────────────────────────────────────────

@router.post("", status_code=201)
async def log_match(body: dict):
    p1 = body.get("player1_profile_id")
    p2 = body.get("player2_profile_id")
    if not p1 or not p2:
        raise HTTPException(422, "player1_profile_id and player2_profile_id are required")
    if p1 == p2:
        raise HTTPException(422, "Players must be different")

    winner = body.get("winner_profile_id")
    if winner and winner not in (p1, p2, "draw"):
        raise HTTPException(422, "winner_profile_id must be one of the two players or omitted")
    if winner == "draw":
        winner = None

    row = {
        "player1_profile_id": p1,
        "player2_profile_id": p2,
        "play_request_id":    body.get("play_request_id") or None,
        "winner_profile_id":  winner,
        "score":              (body.get("score") or "").strip() or None,
        "surface":            body.get("surface") or None,
        "format":             body.get("format") or None,
        "played_at":          body.get("played_at") or None,
        "notes":              (body.get("notes") or "").strip() or None,
    }
    return await _post("match_history", row)


# ── GET /match-history?profile_id={id} ───────────────────────────────────────

@router.get("")
async def get_match_history(profile_id: str = Query(...)):
    rows = await _get("match_history", {
        "or":     f"(player1_profile_id.eq.{profile_id},player2_profile_id.eq.{profile_id})",
        "select": "*",
        "order":  "played_at.desc,created_at.desc",
        "limit":  "100",
    })

    if not rows:
        return {"matches": [], "wins": 0, "losses": 0, "draws": 0}

    # Batch-load opponent profiles
    opp_ids = set()
    for r in rows:
        opp = r["player2_profile_id"] if r["player1_profile_id"] == profile_id else r["player1_profile_id"]
        if opp:
            opp_ids.add(opp)

    profiles: dict = {}
    if opp_ids:
        prows = await _get("sparring_profiles", {
            "id":     f"in.({','.join(opp_ids)})",
            "select": "id,name,photo_url,founding_number",
        })
        profiles = {p["id"]: p for p in prows}

    wins = losses = draws = 0
    enriched = []
    for r in rows:
        opp_id = r["player2_profile_id"] if r["player1_profile_id"] == profile_id else r["player1_profile_id"]
        r["opponent"] = profiles.get(opp_id or "", {})
        w = r.get("winner_profile_id")
        if w is None:
            result = "draw"; draws += 1
        elif w == profile_id:
            result = "win"; wins += 1
        else:
            result = "loss"; losses += 1
        r["result"] = result
        enriched.append(r)

    return {"matches": enriched, "wins": wins, "losses": losses, "draws": draws}


# ── GET /match-history/h2h?player1={id}&player2={id} ─────────────────────────

@router.get("/h2h")
async def get_h2h(player1: str = Query(...), player2: str = Query(...)):
    rows = await _get("match_history", {
        "or":     f"(and(player1_profile_id.eq.{player1},player2_profile_id.eq.{player2}),and(player1_profile_id.eq.{player2},player2_profile_id.eq.{player1}))",
        "select": "*",
        "order":  "played_at.desc",
        "limit":  "50",
    })

    p1_wins = p2_wins = draws = 0
    for r in rows:
        w = r.get("winner_profile_id")
        if w is None:
            draws += 1
        elif w == player1:
            p1_wins += 1
        else:
            p2_wins += 1

    return {
        "total":   len(rows),
        "player1_wins": p1_wins,
        "player2_wins": p2_wins,
        "draws":   draws,
        "matches": rows,
    }
