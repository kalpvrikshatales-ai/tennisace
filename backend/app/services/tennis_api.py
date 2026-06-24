import httpx, os
from dotenv import load_dotenv
from app.services.db import upsert_match, get_live_from_db, get_tournaments_from_db

load_dotenv()

API_KEY = os.getenv("TENNIS_API_KEY")
BASE_URL = "https://api.api-tennis.com/tennis/"


async def get_live_matches():
    if not API_KEY:
        db_matches = await get_live_from_db()
        if db_matches is not None:
            return db_matches
        return _mock_matches()

    async with httpx.AsyncClient() as c:
        try:
            r = await c.get(BASE_URL, params={"method": "get_livescore", "APIkey": API_KEY}, timeout=10)
            matches = r.json().get("result", [])
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
            r = await c.get(BASE_URL, params={"method": "get_tournaments", "APIkey": API_KEY}, timeout=10)
            return r.json().get("result", [])
        except Exception:
            return _mock_tournaments()


def _mock_matches():
    return [
        {"match_id": "1", "player1": "Novak Djokovic", "player2": "Carlos Alcaraz",
         "score": "6-4, 3-2", "status": "In Progress", "tournament": "Wimbledon 2025"},
        {"match_id": "2", "player1": "Iga Swiatek", "player2": "Aryna Sabalenka",
         "score": "7-5, 1-0", "status": "In Progress", "tournament": "Wimbledon 2025"},
    ]


def _mock_tournaments():
    return [
        {"id": "1", "name": "Wimbledon",       "surface": "Grass", "country": "UK"},
        {"id": "2", "name": "US Open",          "surface": "Hard",  "country": "USA"},
        {"id": "3", "name": "Roland Garros",    "surface": "Clay",  "country": "France"},
        {"id": "4", "name": "Australian Open",  "surface": "Hard",  "country": "Australia"},
    ]
