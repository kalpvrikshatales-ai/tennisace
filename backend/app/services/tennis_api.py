import httpx, os
from dotenv import load_dotenv
from app.services.db import upsert_match, get_live_from_db, get_tournaments_from_db

load_dotenv()

API_KEY = os.getenv("TENNIS_API_KEY")
BASE_URL = "https://api.api-tennis.com/tennis/"


def _normalize_match(raw: dict) -> dict:
    """Normalize API-Tennis livescore fields to our internal shape."""
    # API-Tennis returns: event_key, event_first_player, event_second_player,
    # event_final_result, event_status, tournament_name, event_serve, etc.
    score = raw.get("event_final_result") or raw.get("score") or ""
    return {
        "match_id":   str(raw.get("event_key") or raw.get("match_id", "")),
        "player1":    raw.get("event_first_player")  or raw.get("player1", ""),
        "player2":    raw.get("event_second_player") or raw.get("player2", ""),
        "score":      score,
        "status":     raw.get("event_status") or raw.get("status", "In Progress"),
        "tournament": raw.get("tournament_name") or raw.get("tournament", ""),
        "serve":      raw.get("event_serve"),
        "round":      raw.get("round_name"),
        "game_score": raw.get("event_game_result"),  # e.g. "30-15"
    }


async def get_live_matches():
    if not API_KEY:
        db_matches = await get_live_from_db()
        if db_matches:
            return db_matches
        return _mock_matches()

    async with httpx.AsyncClient() as c:
        try:
            r = await c.get(
                BASE_URL,
                params={"method": "get_livescore", "APIkey": API_KEY},
                timeout=10,
            )
            raw_matches = r.json().get("result", [])
            if not isinstance(raw_matches, list):
                raw_matches = []
            matches = [_normalize_match(m) for m in raw_matches]
            for m in matches:
                await upsert_match(m)
            return matches
        except Exception:
            db_matches = await get_live_from_db()
            return db_matches if db_matches is not None else _mock_matches()


async def get_match_by_id(match_id: str):
    return {"match_id": match_id, "status": "in_progress"}


async def get_tournaments():
    db_t = await get_tournaments_from_db()
    if db_t is not None and len(db_t) > 0:
        return db_t

    if not API_KEY:
        return _mock_tournaments()

    async with httpx.AsyncClient() as c:
        try:
            r = await c.get(
                BASE_URL,
                params={"method": "get_tournaments", "APIkey": API_KEY},
                timeout=10,
            )
            return r.json().get("result", [])
        except Exception:
            return _mock_tournaments()


def _mock_matches():
    return [
        {"match_id": "1", "player1": "Novak Djokovic", "player2": "Carlos Alcaraz",
         "score": "6-4, 3-2", "status": "In Progress", "tournament": "Wimbledon 2025",
         "serve": "First Player", "round": "Quarter-Final", "game_score": "40-15"},
        {"match_id": "2", "player1": "Iga Swiatek", "player2": "Aryna Sabalenka",
         "score": "7-5, 1-0", "status": "In Progress", "tournament": "Wimbledon 2025",
         "serve": "Second Player", "round": "Quarter-Final", "game_score": "30-30"},
    ]


def _mock_tournaments():
    return [
        {"id": "1", "name": "Wimbledon",       "surface": "Grass", "country": "UK"},
        {"id": "2", "name": "US Open",          "surface": "Hard",  "country": "USA"},
        {"id": "3", "name": "Roland Garros",    "surface": "Clay",  "country": "France"},
        {"id": "4", "name": "Australian Open",  "surface": "Hard",  "country": "Australia"},
    ]
