import httpx, os, asyncio, time
from dotenv import load_dotenv
from app.services.db import upsert_match, get_live_from_db, get_tournaments_from_db
from app.data.player_enrichment import get_surface

load_dotenv()

API_KEY = os.getenv("TENNIS_API_KEY")
BASE_URL = "https://api.api-tennis.com/tennis/"

# In-memory cache for live matches (10 second TTL)
_live_matches_cache = {"data": None, "timestamp": 0}
_CACHE_TTL = 10


def _parse_round(raw_round: str) -> str:
    """Convert '1/64-finals' style to clean label."""
    MAP = {
        "1/64-finals": "R1", "1/32-finals": "R2", "1/16-finals": "R3",
        "1/8-finals": "R4", "1/4-finals": "QF", "1/2-finals": "SF",
        "final": "Final",
    }
    clean = raw_round.split(" - ")[-1].lower().strip() if raw_round else ""
    return MAP.get(clean, raw_round.split(" - ")[-1] if raw_round else "")


def _normalize_match(raw: dict) -> dict:
    """Normalize API-Tennis livescore fields to our internal shape."""
    score = raw.get("event_final_result") or raw.get("score") or ""
    tournament = raw.get("tournament_name") or raw.get("tournament", "")
    event_type = raw.get("event_type_type", "")
    raw_round = raw.get("tournament_round", "")
    # Normalise scores: "0 - 1" → "0-1"
    if " - " in score:
        score = score.replace(" - ", "-")

    # Parse set scores from scores[] array if available
    set_scores = raw.get("scores", [])
    if set_scores and score in ("-", "0-0", ""):
        parts = [f"{s.get('score_first',0)}-{s.get('score_second',0)}"
                 for s in set_scores if s.get("score_first") not in (None, "0") or s.get("score_second") not in (None, "0")]
        if parts:
            score = ", ".join(parts)

    return {
        "match_id":    str(raw.get("event_key") or raw.get("match_id", "")),
        "player1":     raw.get("event_first_player")  or raw.get("player1", ""),
        "player2":     raw.get("event_second_player") or raw.get("player2", ""),
        "player1_key": raw.get("first_player_key"),
        "player2_key": raw.get("second_player_key"),
        "score":       score,
        "status":      raw.get("event_status") or raw.get("status", "In Progress"),
        "tournament":  tournament,
        "surface":     get_surface(tournament, event_type),
        "event_type":  event_type,
        "serve":       raw.get("event_serve"),
        "round":       _parse_round(raw_round),
        "round_raw":   raw_round,
        "game_score":  raw.get("event_game_result"),
        "player1_img": raw.get("event_first_player_logo"),
        "player2_img": raw.get("event_second_player_logo"),
        "statistics":  raw.get("statistics", []),
        "date":        raw.get("event_date", ""),
        "time":        raw.get("event_time", ""),
    }


async def get_live_matches():
    global _live_matches_cache

    # Return cached data if still fresh (< 10 seconds old)
    if _live_matches_cache["data"] and time.time() - _live_matches_cache["timestamp"] < _CACHE_TTL:
        return _live_matches_cache["data"]

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

            # Cache the results in memory
            _live_matches_cache["data"] = matches
            _live_matches_cache["timestamp"] = time.time()

            # Upsert to DB in background (don't wait for it)
            # This prevents the N+1 sequential writes from blocking the response
            if matches:
                asyncio.create_task(_upsert_matches_background(matches))

            return matches
        except Exception:
            db_matches = await get_live_from_db()
            return db_matches if db_matches is not None else _mock_matches()


async def _upsert_matches_background(matches: list) -> None:
    """Background task to upsert matches without blocking the response."""
    try:
        # Batch upsert in groups of 10 to avoid overloading
        for i in range(0, len(matches), 10):
            batch = matches[i:i+10]
            await asyncio.gather(*[upsert_match(m) for m in batch])
            await asyncio.sleep(0.1)  # Small delay between batches
    except Exception:
        pass  # Silent fail for background task


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
