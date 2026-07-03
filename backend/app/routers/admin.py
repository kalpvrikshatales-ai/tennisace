from fastapi import APIRouter, HTTPException
import httpx, os
from app.services.db import _headers, _ready, SUPABASE_URL
from app.services.redis_cache import get_cached, set_cached, flush_pattern

router = APIRouter()

ADMIN_KEY = os.getenv("ADMIN_KEY", "")


def _check_key(key: str):
    if not ADMIN_KEY or key != ADMIN_KEY:
        raise HTTPException(status_code=401, detail="Unauthorized")


@router.get("/stats")
async def admin_stats(key: str = ""):
    _check_key(key)

    cached = await get_cached("admin:stats")
    if cached:
        return cached

    stats = {
        "votes": {"total": 0, "unique_matches": 0, "unique_browsers": 0, "top_matches": []},
        "app": {"live_matches": 0, "rankings_cached": False},
        "error": None,
    }

    if _ready():
        try:
            async with httpx.AsyncClient() as c:
                # Total votes + unique stats
                r = await c.get(
                    f"{SUPABASE_URL}/rest/v1/match_votes",
                    headers={**_headers(), "Prefer": ""},
                    params={"select": "match_id,browser_id,vote", "limit": "5000"},
                    timeout=8,
                )
                rows = r.json() if r.status_code == 200 and isinstance(r.json(), list) else []

                stats["votes"]["total"] = len(rows)
                stats["votes"]["unique_matches"] = len(set(v["match_id"] for v in rows))
                stats["votes"]["unique_browsers"] = len(set(v["browser_id"] for v in rows))

                # Top 5 most voted matches
                from collections import Counter
                match_counts = Counter(v["match_id"] for v in rows)
                top = match_counts.most_common(5)

                # For each top match get vote breakdown
                top_matches = []
                for match_id, count in top:
                    match_rows = [v for v in rows if v["match_id"] == match_id]
                    p1 = sum(1 for v in match_rows if v["vote"] == 1)
                    p2 = sum(1 for v in match_rows if v["vote"] == 2)
                    top_matches.append({
                        "match_id": match_id,
                        "total": count,
                        "player1_votes": p1,
                        "player2_votes": p2,
                    })
                stats["votes"]["top_matches"] = top_matches

        except Exception as e:
            stats["error"] = str(e)

    # Live match count from in-memory cache
    try:
        from app.services.tennis_api import _live_matches_cache
        cached_live = _live_matches_cache.get("data") or []
        stats["app"]["live_matches"] = len(cached_live)
    except Exception:
        pass

    await set_cached("admin:stats", stats, ttl=60)  # cache 1 minute
    return stats


@router.post("/flush-cache")
async def flush_cache(key: str = "", pattern: str = "*"):
    """Flush Redis cache keys matching pattern. Requires admin key."""
    _check_key(key)
    await flush_pattern(pattern)
    return {"flushed": True, "pattern": pattern}
