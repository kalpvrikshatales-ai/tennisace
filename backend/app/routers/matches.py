from fastapi import APIRouter, HTTPException, Response
import httpx, os, logging
from dotenv import load_dotenv
from app.services.tennis_api import get_live_matches, _normalize_match
from app.services.redis_cache import get_cached, set_cached

load_dotenv()
log = logging.getLogger(__name__)
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
        log.error("[MATCHES] TENNIS_API_KEY is not set — match detail will always 404")
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
            if resp.get("error") == "1":
                err_msg = resp.get("result", [{}])[0].get("msg", "unknown") if resp.get("result") else "unknown"
                log.error("[MATCHES] API auth error on get_livescore for %s: %s. Check TENNIS_API_KEY.", match_id, err_msg)
                raw_list = []
            else:
                raw_list = resp.get("result", [])
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
        except Exception as exc:
            log.error("[MATCHES] Exception on get_livescore for %s: %s", match_id, exc)

        import asyncio
        from datetime import date, timedelta

        # ── 2. Check Redis cache for previously seen completed match ───────────
        cached_detail = await get_cached(f"match_detail:{match_id}")
        if cached_detail:
            response.headers["Cache-Control"] = "public, max-age=3600"
            return cached_detail

        today = date.today()

        async def _fetch_day(d: date) -> list:
            """Fetch all fixtures for a single day — the only range the API supports."""
            try:
                r = await c.get(BASE, params={
                    "method": "get_fixtures",
                    "APIkey": API_KEY,
                    "date_start": str(d), "date_stop": str(d),
                }, timeout=12)
                resp = r.json()
                if resp.get("error") == "1":
                    log.error("[MATCHES] API auth error on get_fixtures %s: %s", d,
                              (resp.get("result") or [{}])[0].get("msg", "?"))
                    return []
                raw = resp.get("result", [])
                return raw if isinstance(raw, list) else []
            except Exception as exc:
                log.error("[MATCHES] Exception fetching fixtures for %s: %s", d, exc)
                return []

        # ── 3. Search upcoming days (today + 7) concurrently ──────────────────
        upcoming_days = [today + timedelta(days=i) for i in range(8)]
        upcoming_results = await asyncio.gather(*[_fetch_day(d) for d in upcoming_days])
        for day_matches in upcoming_results:
            found = next((m for m in day_matches if str(m.get("event_key", "")) == match_id), None)
            if found:
                result = _normalize_match(found)
                result["point_by_point"] = []
                result["statistics"] = found.get("statistics", [])
                response.headers["Cache-Control"] = "public, max-age=300"
                return result

        # ── 4. Search past days (yesterday going back 7) concurrently ─────────
        past_days = [today - timedelta(days=i) for i in range(1, 8)]
        past_results = await asyncio.gather(*[_fetch_day(d) for d in past_days])
        for day_matches in past_results:
            found = next((m for m in day_matches if str(m.get("event_key", "")) == match_id), None)
            if found:
                result = _normalize_match(found)
                result["point_by_point"] = []
                # Statistics come from get_fixtures for completed matches
                result["statistics"] = found.get("statistics", [])
                # Cache for 1h so future requests skip the search
                await set_cached(f"match_detail:{match_id}", result, ttl=3600)
                response.headers["Cache-Control"] = "public, max-age=3600"
                return result

    log.warning("[MATCHES] Match %s not found in livescore, Redis cache, upcoming or past fixtures (all 4 paths exhausted)", match_id)
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
