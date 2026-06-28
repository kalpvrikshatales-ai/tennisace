from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
import httpx, os

router = APIRouter()

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_ANON_KEY", "")

def _ready() -> bool:
    return bool(SUPABASE_URL and SUPABASE_KEY)

def _headers() -> dict:
    return {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates",
    }

class VoteRequest(BaseModel):
    match_id: str
    browser_id: str
    vote: int  # 1 or 2

class VoteStats(BaseModel):
    player1_votes: int
    player2_votes: int
    total_votes: int
    user_vote: Optional[int] = None

@router.post("/cast")
async def cast_vote(vote: VoteRequest):
    if vote.vote not in [1, 2] or not vote.match_id or not vote.browser_id:
        return {"success": False, "error": "Invalid input"}

    if not _ready():
        # No DB configured — return success so frontend doesn't break
        return {"success": True, "local_only": True}

    try:
        async with httpx.AsyncClient() as c:
            await c.post(
                f"{SUPABASE_URL}/rest/v1/match_votes",
                headers=_headers(),
                json={"match_id": vote.match_id, "browser_id": vote.browser_id, "vote": vote.vote},
                timeout=5,
            )
        return {"success": True}
    except Exception:
        return {"success": True, "local_only": True}

@router.get("/match/{match_id}")
async def get_votes(match_id: str, browser_id: Optional[str] = None):
    if not _ready():
        return {"player1_votes": 0, "player2_votes": 0, "total_votes": 0, "user_vote": None}

    try:
        async with httpx.AsyncClient() as c:
            r = await c.get(
                f"{SUPABASE_URL}/rest/v1/match_votes",
                headers={**_headers(), "Prefer": ""},
                params={"match_id": f"eq.{match_id}", "select": "vote,browser_id"},
                timeout=5,
            )
            rows = r.json() if r.status_code == 200 and isinstance(r.json(), list) else []

        p1 = sum(1 for v in rows if v.get("vote") == 1)
        p2 = sum(1 for v in rows if v.get("vote") == 2)
        user_vote = None
        if browser_id:
            user_vote = next((v["vote"] for v in rows if v.get("browser_id") == browser_id), None)

        return {"player1_votes": p1, "player2_votes": p2, "total_votes": len(rows), "user_vote": user_vote}
    except Exception:
        return {"player1_votes": 0, "player2_votes": 0, "total_votes": 0, "user_vote": None}
