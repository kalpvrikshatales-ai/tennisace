import os
from dotenv import load_dotenv

load_dotenv()

_client = None

def get_supabase():
    global _client
    if _client is not None:
        return _client

    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

    if not url or not key:
        return None

    try:
        from supabase import create_client
        _client = create_client(url, key)
        return _client
    except Exception:
        return None


async def upsert_match(match: dict) -> None:
    db = get_supabase()
    if not db:
        return
    db.table("matches").upsert({
        "external_id":    str(match.get("match_id", "")),
        "player1_name":   match.get("player1", ""),
        "player2_name":   match.get("player2", ""),
        "score":          match.get("score"),
        "status":         match.get("status", "In Progress"),
        "tournament_name": match.get("tournament"),
    }, on_conflict="external_id").execute()


async def get_live_from_db():
    db = get_supabase()
    if not db:
        return None
    try:
        res = db.table("matches").select("*").eq("status", "In Progress").order("updated_at", desc=True).execute()
        rows = res.data or []
        return [
            {
                "match_id":   r["external_id"] or r["id"],
                "player1":    r["player1_name"],
                "player2":    r["player2_name"],
                "score":      r.get("score"),
                "status":     r["status"],
                "tournament": r.get("tournament_name"),
            }
            for r in rows
        ]
    except Exception:
        return None


async def get_tournaments_from_db():
    db = get_supabase()
    if not db:
        return None
    try:
        res = db.table("tournaments").select("id,name,surface,country").execute()
        return [
            {"id": r["id"], "name": r["name"], "surface": r["surface"], "country": r["country"]}
            for r in (res.data or [])
        ]
    except Exception:
        return None
