from fastapi import APIRouter, HTTPException, Response
import httpx, os
from dotenv import load_dotenv
from app.services.tennis_api import get_live_matches, _normalize_match

load_dotenv()
router = APIRouter()
API_KEY = os.getenv("TENNIS_API_KEY", "")
BASE = "https://api.api-tennis.com/tennis/"


@router.get("/live")
async def live_matches(response: Response):
    matches = await get_live_matches()
    response.headers["Cache-Control"] = "public, max-age=30"
    return {"matches": matches, "count": len(matches)}


@router.get("/{match_id}")
async def match_detail(match_id: str, response: Response):
    """Full match detail — tries live first, then fetches from API directly."""
    if not API_KEY:
        raise HTTPException(status_code=404, detail="No API key configured")
    response.headers["Cache-Control"] = "public, max-age=300"

    async with httpx.AsyncClient() as c:
        # Fetch from livescore API directly (works for both live and recent)
        try:
            r = await c.get(BASE, params={
                "method": "get_livescore",
                "APIkey": API_KEY,
                "event_key": match_id,
            }, timeout=12)
            raw_list = r.json().get("result", [])
            if raw_list:
                raw = raw_list[0]
                result = _normalize_match(raw)
                result["point_by_point"] = raw.get("pointbypoint", [])
                result["scores_raw"] = raw.get("scores", [])
                return result
        except Exception:
            pass

        # Fallback: try fixtures (for upcoming matches)
        try:
            from datetime import date, timedelta
            stop = date.today() + timedelta(days=30)
            start = date.today() - timedelta(days=30)
            r2 = await c.get(BASE, params={
                "method": "get_fixtures",
                "APIkey": API_KEY,
                "date_start": str(start), "date_stop": str(stop),
            }, timeout=10)
            raw_list2 = r2.json().get("result", [])
            if isinstance(raw_list2, list):
                found = next((m for m in raw_list2 if str(m.get("event_key", "")) == match_id), None)
                if found:
                    result = _normalize_match(found)
                    result["point_by_point"] = []
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
