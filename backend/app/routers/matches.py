from fastapi import APIRouter, HTTPException, Response
import httpx, os
from dotenv import load_dotenv
from app.services.tennis_api import get_live_matches, _normalize_match
from app.services.redis_cache import get_cached, set_cached

load_dotenv()
router = APIRouter()
API_KEY = os.getenv("TENNIS_API_KEY", "")
BASE = "https://api.api-tennis.com/tennis/"


GRAND_SLAM_NAMES = {'wimbledon', 'us open', 'australian open', 'roland garros', 'french open'}

def _match_priority(m: dict) -> int:
    """Sort key: Grand Slams first, then others. Higher = more important."""
    t = (m.get('tournament') or '').lower()
    if any(gs in t for gs in GRAND_SLAM_NAMES):
        return 0   # Grand Slams first
    if 'atp' in t or 'wta' in t:
        return 1   # ATP/WTA next
    return 2       # Challengers/ITF last

@router.get("/live")
async def live_matches(response: Response, limit: int = 50):
    matches = await get_live_matches()
    response.headers["Cache-Control"] = "public, max-age=30"
    # Sort Grand Slams first before slicing — ensures Wimbledon isn't cut off
    sorted_matches = sorted(matches, key=_match_priority)
    return {"matches": sorted_matches[:limit], "count": len(sorted_matches[:limit]), "total": len(matches)}


@router.get("/{match_id}")
async def match_detail(match_id: str, response: Response):
    """Full match detail — tries live first, then fetches from API directly."""
    if not API_KEY:
        raise HTTPException(status_code=404, detail="No API key configured")

    async with httpx.AsyncClient() as c:
        # ── 1. Try livescore (live and very recently finished matches) ──────────
        try:
            r = await c.get(BASE, params={
                "method": "get_livescore",
                "APIkey": API_KEY,
                "event_key": match_id,
            }, timeout=12)
            resp = r.json()
            raw_list = [] if resp.get("error") == "1" else resp.get("result", [])
            if raw_list:
                raw = raw_list[0]
                result = _normalize_match(raw)
                result["point_by_point"] = raw.get("pointbypoint", [])
                result["scores_raw"] = raw.get("scores", [])
                # Cache stats separately so completed-match requests can use them later
                if result.get("statistics"):
                    await set_cached(f"match_stats:{match_id}", result["statistics"], ttl=172800)
                response.headers["Cache-Control"] = "public, max-age=30"
                return result
        except Exception:
            pass

        from datetime import date, timedelta

        # ── 2. Check Redis cache for previously seen completed match ───────────
        cached_detail = await get_cached(f"match_detail:{match_id}")
        if cached_detail:
            response.headers["Cache-Control"] = "public, max-age=3600"
            return cached_detail

        # ── 3. Upcoming fixtures (next 14 days) ────────────────────────────────
        try:
            stop = date.today() + timedelta(days=14)
            start = date.today()
            r2 = await c.get(BASE, params={
                "method": "get_fixtures",
                "APIkey": API_KEY,
                "date_start": str(start), "date_stop": str(stop),
            }, timeout=12)
            resp2 = r2.json()
            raw_list2 = [] if resp2.get("error") == "1" else resp2.get("result", [])
            if isinstance(raw_list2, list):
                found = next((m for m in raw_list2 if str(m.get("event_key", "")) == match_id), None)
                if found:
                    result = _normalize_match(found)
                    result["point_by_point"] = []
                    response.headers["Cache-Control"] = "public, max-age=300"
                    return result
        except Exception:
            pass

        # ── 4. Recent results (last 14 days — finished matches) ────────────────
        try:
            stop = date.today()
            start = stop - timedelta(days=14)
            r3 = await c.get(BASE, params={
                "method": "get_fixtures",
                "APIkey": API_KEY,
                "date_start": str(start), "date_stop": str(stop),
            }, timeout=20)
            resp3 = r3.json()
            raw_list3 = [] if resp3.get("error") == "1" else resp3.get("result", [])
            if isinstance(raw_list3, list):
                found = next((m for m in raw_list3 if str(m.get("event_key", "")) == match_id), None)
                if found:
                    result = _normalize_match(found)
                    result["point_by_point"] = []
                    # Merge cached statistics from when the match was live
                    cached_stats = await get_cached(f"match_stats:{match_id}")
                    if cached_stats:
                        result["statistics"] = cached_stats
                    # Cache this completed match detail for 1h so future requests skip the 14-day search
                    await set_cached(f"match_detail:{match_id}", result, ttl=3600)
                    response.headers["Cache-Control"] = "public, max-age=3600"
                    return result
        except Exception:
            pass

    raise HTTPException(status_code=404, detail="Match not found")


def _mock_pbp():
    """Mock point-by-point for testing when no live matches."""
    return [
        {
            "set_number": "Set 1",
            "number_game": "1",
            "player_served": "First Player",
            "serve_winner": "First Player",
            "score": "1 - 0",
            "points": [
                {"number_point": "1", "score": "15 - 0", "break_point": None, "set_point": None, "match_point": None},
                {"number_point": "2", "score": "30 - 0", "break_point": None, "set_point": None, "match_point": None},
                {"number_point": "3", "score": "30 - 15", "break_point": None, "set_point": None, "match_point": None},
                {"number_point": "4", "score": "40 - 15", "break_point": None, "set_point": None, "match_point": None},
                {"number_point": "5", "score": "Game", "break_point": None, "set_point": None, "match_point": None},
            ]
        },
        {
            "set_number": "Set 1",
            "number_game": "2",
            "player_served": "Second Player",
            "serve_winner": "First Player",
            "score": "2 - 0",
            "points": [
                {"number_point": "1", "score": "0 - 15", "break_point": None, "set_point": None, "match_point": None},
                {"number_point": "2", "score": "15 - 15", "break_point": None, "set_point": None, "match_point": None},
                {"number_point": "3", "score": "30 - 15", "break_point": "Yes", "set_point": None, "match_point": None},
                {"number_point": "4", "score": "30 - 30", "break_point": "Yes", "set_point": None, "match_point": None},
                {"number_point": "5", "score": "40 - 30", "break_point": "Yes", "set_point": None, "match_point": None},
                {"number_point": "6", "score": "Game", "break_point": None, "set_point": None, "match_point": None},
            ]
        },
    ]
