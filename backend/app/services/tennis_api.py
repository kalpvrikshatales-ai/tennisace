import httpx, os, asyncio, time
from dotenv import load_dotenv
from app.services.db import upsert_match, get_live_from_db, get_tournaments_from_db
from app.data.player_enrichment import get_surface
from app.services.redis_cache import set_cached

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
    # Always prefer per-set scores from scores[] array over sets-won count
    set_scores = raw.get("scores", [])
    if set_scores:
        parts = []
        for s in set_scores:
            sf = str(s.get("score_first") or "0")
            ss = str(s.get("score_second") or "0")
            parts.append(f"{sf}-{ss}")
        if parts:
            score = ", ".join(parts)
    elif score and " - " in score:
        score = score.replace(" - ", "-")

    # Build structured sets list for easy frontend rendering
    # e.g. [{"p1": "6", "p2": "4"}, {"p1": "3", "p2": "2"}]
    sets_data = [
        {"p1": str(s.get("score_first") or "0"), "p2": str(s.get("score_second") or "0")}
        for s in set_scores
    ]

    # Split game score into per-player values
    # game_score looks like "40 - 15" or "AD" or "0 - 0"
    raw_game = raw.get("event_game_result") or ""
    game_p1, game_p2 = "", ""
    if " - " in raw_game:
        parts_g = raw_game.split(" - ", 1)
        game_p1, game_p2 = parts_g[0].strip(), parts_g[1].strip()
    elif raw_game:
        game_p1 = raw_game

    return {
        "match_id":    str(raw.get("event_key") or raw.get("match_id", "")),
        "player1":     raw.get("event_first_player")  or raw.get("player1", ""),
        "player2":     raw.get("event_second_player") or raw.get("player2", ""),
        "player1_key": raw.get("first_player_key"),
        "player2_key": raw.get("second_player_key"),
        "score":       score,
        "sets":        sets_data,       # per-set game scores
        "game_p1":     game_p1,         # current game score player 1
        "game_p2":     game_p2,         # current game score player 2
        "status":      raw.get("event_status") or raw.get("status", "In Progress"),
        "tournament":  tournament,
        "surface":     get_surface(tournament, event_type),
        "event_type":  event_type,
        "serve":       raw.get("event_serve"),
        "round":       _parse_round(raw_round),
        "round_raw":   raw_round,
        "game_score":  raw_game,
        "player1_img":     raw.get("event_first_player_logo"),
        "player2_img":     raw.get("event_second_player_logo"),
        "player1_country": raw.get("event_first_player_country") or raw.get("first_player_country"),
        "player2_country": raw.get("event_second_player_country") or raw.get("second_player_country"),
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
            resp_json = r.json()
            if resp_json.get("error") == "1":
                raw_matches = []
            else:
                raw_matches = resp_json.get("result", [])
                if not isinstance(raw_matches, list):
                    raw_matches = []
            matches = [
                _normalize_match(m) for m in raw_matches
                if (m.get("event_first_player") or "").strip()
                and (m.get("event_second_player") or "").strip()
                and (m.get("event_key") or m.get("match_id") or "")
            ]

            # Cache statistics in Redis for each live match (48h TTL)
            # so completed-match detail pages can still show stats after the match ends
            for raw_m in raw_matches:
                stats = raw_m.get("statistics", [])
                mid = str(raw_m.get("event_key") or raw_m.get("match_id") or "")
                if stats and mid:
                    asyncio.create_task(set_cached(f"match_stats:{mid}", stats, ttl=172800))

            # Cache the results in memory
            _live_matches_cache["data"] = matches
            _live_matches_cache["timestamp"] = time.time()

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
