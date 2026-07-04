import httpx, os, asyncio, time, logging
from dotenv import load_dotenv
from app.services.db import upsert_match, get_live_from_db, get_tournaments_from_db
from app.data.player_enrichment import get_surface
from app.services.redis_cache import get_cached, set_cached

load_dotenv()
log = logging.getLogger(__name__)

API_KEY = os.getenv("TENNIS_API_KEY")
BASE_URL = "https://api.api-tennis.com/tennis/"

# In-memory cache: stores last known-good live matches (10s TTL for freshness)
# None = never fetched.  [] = fetched and confirmed 0 live matches.
_live_matches_cache: dict = {"data": None, "timestamp": 0, "source": "none"}
_CACHE_TTL = 10

# Redis key for cross-restart fallback (5 min TTL)
_REDIS_LIVE_KEY = "live_matches:latest"


def _parse_round(raw_round: str) -> str:
    MAP = {
        "1/64-finals": "R1", "1/32-finals": "R2", "1/16-finals": "R3",
        "1/8-finals": "R4", "1/4-finals": "QF", "1/2-finals": "SF",
        "final": "Final",
    }
    clean = raw_round.split(" - ")[-1].lower().strip() if raw_round else ""
    return MAP.get(clean, raw_round.split(" - ")[-1] if raw_round else "")


def _normalize_match(raw: dict) -> dict:
    """Normalize API-Tennis livescore/fixture fields to our internal shape."""
    score = raw.get("event_final_result") or raw.get("score") or ""
    tournament = raw.get("tournament_name") or raw.get("tournament", "")
    event_type = raw.get("event_type_type", "")
    raw_round = raw.get("tournament_round", "")

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

    sets_data = [
        {"p1": str(s.get("score_first") or "0"), "p2": str(s.get("score_second") or "0")}
        for s in set_scores
    ]

    raw_game = raw.get("event_game_result") or ""
    game_p1, game_p2 = "", ""
    if " - " in raw_game:
        parts_g = raw_game.split(" - ", 1)
        game_p1, game_p2 = parts_g[0].strip(), parts_g[1].strip()
    elif raw_game:
        game_p1 = raw_game

    return {
        "match_id":        str(raw.get("event_key") or raw.get("match_id", "")),
        "player1":         raw.get("event_first_player")  or raw.get("player1", ""),
        "player2":         raw.get("event_second_player") or raw.get("player2", ""),
        "player1_key":     raw.get("first_player_key"),
        "player2_key":     raw.get("second_player_key"),
        "score":           score,
        "sets":            sets_data,
        "game_p1":         game_p1,
        "game_p2":         game_p2,
        "status":          raw.get("event_status") or raw.get("status", "In Progress"),
        "tournament":      tournament,
        "surface":         get_surface(tournament, event_type),
        "event_type":      event_type,
        "serve":           raw.get("event_serve"),
        "round":           _parse_round(raw_round),
        "round_raw":       raw_round,
        "game_score":      raw_game,
        "player1_img":     raw.get("event_first_player_logo"),
        "player2_img":     raw.get("event_second_player_logo"),
        "player1_country": raw.get("event_first_player_country") or raw.get("first_player_country"),
        "player2_country": raw.get("event_second_player_country") or raw.get("second_player_country"),
        "statistics":      raw.get("statistics", []),
        "date":            raw.get("event_date", ""),
        "time":            raw.get("event_time", ""),
    }


async def get_live_matches() -> list:
    """
    Fetch live matches with layered fallback:
      1. In-memory cache (10s TTL) — fastest
      2. api-tennis.com livescore — fresh data
      3. Redis cache (5 min TTL) — survives Render restarts and API errors
      4. Empty list — never mock data
    On auth/API error: always serve last known-good data, never poison cache.
    """
    global _live_matches_cache

    # ── Layer 1: In-memory cache (still fresh) ───────────────────────────────
    if _live_matches_cache["data"] is not None and \
            time.time() - _live_matches_cache["timestamp"] < _CACHE_TTL:
        return _live_matches_cache["data"]

    # ── No API key — serve Redis fallback or empty ────────────────────────────
    if not API_KEY:
        log.error("[LIVE] TENNIS_API_KEY not set — cannot fetch live matches")
        redis_data = await get_cached(_REDIS_LIVE_KEY)
        if redis_data:
            log.warning("[LIVE] Serving Redis cache (no API key configured)")
            return redis_data
        return []

    masked_key = f"{API_KEY[:8]}...{API_KEY[-4:]}" if len(API_KEY) > 12 else "???"

    async with httpx.AsyncClient() as c:
        try:
            r = await c.get(
                BASE_URL,
                params={"method": "get_livescore", "APIkey": API_KEY},
                timeout=10,
            )

            log.debug("[LIVE] API HTTP %s from %s", r.status_code, BASE_URL)

            if r.status_code != 200:
                log.error("[LIVE] Non-200 status %s from livescore API (key=%s)",
                          r.status_code, masked_key)
                return await _stale_or_redis_fallback()

            resp_json = r.json()

            # ── Auth / API error ─────────────────────────────────────────────
            if resp_json.get("error") == "1":
                result_list = resp_json.get("result") or [{}]
                err_msg = result_list[0].get("msg", "unknown")
                err_cod = result_list[0].get("cod", "?")
                log.error(
                    "[LIVE] API auth error: '%s' (cod=%s) — key=%s. "
                    "Check TENNIS_API_KEY in Render dashboard.",
                    err_msg, err_cod, masked_key
                )
                # DO NOT update cache — return last known-good data
                return await _stale_or_redis_fallback()

            # ── Success path ─────────────────────────────────────────────────
            raw_matches = resp_json.get("result", [])
            if not isinstance(raw_matches, list):
                log.error("[LIVE] Unexpected result type: %s — full resp: %s",
                          type(raw_matches).__name__, str(resp_json)[:200])
                raw_matches = []

            # Valid live statuses from api-tennis.com
            LIVE_STATUSES = {
                "In Progress", "in_progress", "live", "inplay",
                "Set 1", "Set 2", "Set 3", "Set 4", "Set 5",
                "1st Set", "2nd Set", "3rd Set", "4th Set", "5th Set",
                "ongoing", "1",
            }

            matches = []
            for m in raw_matches:
                p1 = (m.get("event_first_player") or "").strip()
                p2 = (m.get("event_second_player") or "").strip()
                mid = m.get("event_key") or m.get("match_id") or ""
                status = m.get("event_status", "")

                if not p1 or not p2 or not mid:
                    log.debug("[LIVE] Skipping match with missing fields: p1=%r p2=%r id=%r", p1, p2, mid)
                    continue

                # Include if status is a known live status OR starts with "Set"
                if status not in LIVE_STATUSES and not status.startswith("Set"):
                    log.debug("[LIVE] Skipping match with non-live status %r: %s vs %s", status, p1, p2)
                    continue

                matches.append(_normalize_match(m))

            log.info("[LIVE] Fetched %d live matches (raw=%d, key=%s)",
                     len(matches), len(raw_matches), masked_key)

            # Cache stats per match for 48h so completed-match pages can show them
            for raw_m in raw_matches:
                stats = raw_m.get("statistics", [])
                mid = str(raw_m.get("event_key") or raw_m.get("match_id") or "")
                if stats and mid:
                    asyncio.create_task(set_cached(f"match_stats:{mid}", stats, ttl=172800))

            # Update in-memory cache
            _live_matches_cache["data"] = matches
            _live_matches_cache["timestamp"] = time.time()
            _live_matches_cache["source"] = "api"

            # Persist to Redis (5-min TTL) so Render restarts don't lose live data
            if matches:
                asyncio.create_task(set_cached(_REDIS_LIVE_KEY, matches, ttl=300))

            return matches

        except Exception as exc:
            log.error("[LIVE] Exception during get_livescore (key=%s): %s", masked_key, exc)
            return await _stale_or_redis_fallback()


async def _stale_or_redis_fallback() -> list:
    """Return last known-good live data from in-memory or Redis. Never empty mock data."""
    # Stale in-memory cache (even if expired)
    if _live_matches_cache["data"] is not None:
        age = time.time() - _live_matches_cache["timestamp"]
        log.warning("[LIVE] Serving stale in-memory cache (age=%.0fs, count=%d)",
                    age, len(_live_matches_cache["data"]))
        return _live_matches_cache["data"]

    # Redis cross-restart fallback
    redis_data = await get_cached(_REDIS_LIVE_KEY)
    if redis_data:
        log.warning("[LIVE] Serving Redis cache fallback (count=%d)", len(redis_data))
        return redis_data

    log.error("[LIVE] No fallback data available — returning empty list")
    return []


async def get_match_by_id(match_id: str):
    return {"match_id": match_id, "status": "in_progress"}


async def get_tournaments():
    db_t = await get_tournaments_from_db()
    if db_t is not None and len(db_t) > 0:
        return db_t

    if not API_KEY:
        return []

    async with httpx.AsyncClient() as c:
        try:
            r = await c.get(
                BASE_URL,
                params={"method": "get_tournaments", "APIkey": API_KEY},
                timeout=10,
            )
            return r.json().get("result", [])
        except Exception as exc:
            log.error("[LIVE] Exception fetching tournaments: %s", exc)
            return []
