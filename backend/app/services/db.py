import os, httpx
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")


def _headers():
    return {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
    }


def _ready() -> bool:
    return bool(SUPABASE_URL and SUPABASE_KEY)


async def upsert_match(match: dict) -> None:
    if not _ready():
        return
    try:
        async with httpx.AsyncClient() as c:
            await c.post(
                f"{SUPABASE_URL}/rest/v1/matches",
                headers={**_headers(), "Prefer": "resolution=merge-duplicates"},
                json={
                    "external_id":    str(match.get("match_id", "")),
                    "player1_name":   match.get("player1", ""),
                    "player2_name":   match.get("player2", ""),
                    "score":          match.get("score"),
                    "status":         match.get("status", "In Progress"),
                    "tournament_name": match.get("tournament"),
                },
                timeout=5,
            )
    except Exception:
        pass


async def get_live_from_db():
    if not _ready():
        return None
    try:
        async with httpx.AsyncClient() as c:
            r = await c.get(
                f"{SUPABASE_URL}/rest/v1/matches",
                headers=_headers(),
                params={"status": "eq.In Progress", "order": "updated_at.desc"},
                timeout=5,
            )
            rows = r.json() if r.status_code == 200 else []
            if not isinstance(rows, list) or len(rows) == 0:
                return None
            return [
                {
                    "match_id":   r.get("external_id") or r.get("id"),
                    "player1":    r.get("player1_name", ""),
                    "player2":    r.get("player2_name", ""),
                    "score":      r.get("score"),
                    "status":     r.get("status", "In Progress"),
                    "tournament": r.get("tournament_name"),
                }
                for r in rows
            ]
    except Exception:
        return None


async def get_tournaments_from_db():
    if not _ready():
        return None
    try:
        async with httpx.AsyncClient() as c:
            r = await c.get(
                f"{SUPABASE_URL}/rest/v1/tournaments",
                headers=_headers(),
                params={"select": "id,name,surface,country"},
                timeout=5,
            )
            rows = r.json() if r.status_code == 200 else []
            if not isinstance(rows, list) or len(rows) == 0:
                return None
            return rows
    except Exception:
        return None
