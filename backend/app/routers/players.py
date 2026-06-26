from fastapi import APIRouter
import httpx, os, asyncio
from dotenv import load_dotenv
from app.services.db import _headers, _ready, SUPABASE_URL
from app.data.player_enrichment import get_player_enrichment, get_surface
from datetime import datetime, timezone, date, timedelta

load_dotenv()

router = APIRouter()
API_KEY = os.getenv("TENNIS_API_KEY", "")
BASE = "https://api.api-tennis.com/tennis/"

_rankings_cache: dict = {}
CACHE_TTL_HOURS = 6


async def _get_rankings_cached(league: str) -> list:
    cached = _rankings_cache.get(league)
    now = datetime.now(timezone.utc)
    if cached and (now - cached[1]).total_seconds() < CACHE_TTL_HOURS * 3600:
        return cached[0]
    async with httpx.AsyncClient() as c:
        r = await c.get(BASE, params={"method": "get_standings", "APIkey": API_KEY, "event_type": league}, timeout=10)
        data = r.json().get("result", [])
        _rankings_cache[league] = (data, now)
        if _ready() and data:
            try:
                await c.post(
                    f"{SUPABASE_URL}/rest/v1/rankings_cache",
                    headers={**_headers(), "Prefer": "resolution=merge-duplicates"},
                    json={"league": league, "data": data, "cached_at": now.isoformat()},
                    timeout=5,
                )
            except Exception:
                pass
        return data


@router.get("/rankings")
async def rankings(type: str = "ATP"):
    try:
        data = await _get_rankings_cached(type)
        return {"rankings": data, "type": type}
    except Exception:
        if _ready():
            try:
                async with httpx.AsyncClient() as c:
                    r = await c.get(f"{SUPABASE_URL}/rest/v1/rankings_cache",
                        headers=_headers(), params={"league": f"eq.{type}", "select": "data"}, timeout=5)
                    rows = r.json()
                    if rows: return {"rankings": rows[0]["data"], "type": type, "cached": True}
            except Exception:
                pass
        return {"rankings": [], "type": type}


def _calc_age(bday: str) -> int | None:
    """Calculate age from birthday string like '16.08.2001'."""
    try:
        parts = bday.split(".")
        if len(parts) == 3:
            bd = date(int(parts[2]), int(parts[1]), int(parts[0]))
            today = date.today()
            return today.year - bd.year - ((today.month, today.day) < (bd.month, bd.day))
    except Exception:
        pass
    return None


def _norm_recent(m: dict) -> dict:
    scores = m.get("scores", [])
    set_score = ", ".join(
        f"{s.get('score_first','')}-{s.get('score_second','')}"
        for s in scores if s.get("score_first") not in ("", None, "0") or s.get("score_second") not in ("", None, "0")
    )
    return {
        "match_id":   str(m.get("event_key", "")),
        "player1":    m.get("event_first_player", ""),
        "player2":    m.get("event_second_player", ""),
        "player1_key": m.get("first_player_key"),
        "player2_key": m.get("second_player_key"),
        "player1_img": m.get("event_first_player_logo"),
        "player2_img": m.get("event_second_player_logo"),
        "score":      set_score or m.get("event_final_result", ""),
        "status":     m.get("event_status", ""),
        "winner":     m.get("event_winner"),
        "tournament": m.get("tournament_name", ""),
        "surface":    get_surface(m.get("tournament_name", ""), m.get("event_type_type", "")),
        "round":      m.get("tournament_round", "").split(" - ")[-1],
        "date":       m.get("event_date", ""),
    }


@router.get("/{player_key}")
async def player_profile(player_key: str):
    key_int = int(player_key) if player_key.isdigit() else 0

    async with httpx.AsyncClient() as c:
        # Fetch profile + recent results in parallel
        stop = date.today()
        start = stop - timedelta(days=60)

        profile_task = c.get(BASE, params={"method": "get_players", "APIkey": API_KEY, "player_key": player_key}, timeout=12)
        recent_task  = c.get(BASE, params={
            "method": "get_events", "APIkey": API_KEY,
            "date_start": str(start), "date_stop": str(stop),
            "player_key": player_key,
        }, timeout=12)
        upcoming_task = c.get(BASE, params={
            "method": "get_fixtures", "APIkey": API_KEY,
            "date_start": str(stop), "date_stop": str(stop + timedelta(days=30)),
            "player_key": player_key,
        }, timeout=12)

        profile_r, recent_r, upcoming_r = await asyncio.gather(
            profile_task, recent_task, upcoming_task,
            return_exceptions=True,
        )

    # Parse profile
    player = {}
    if not isinstance(profile_r, Exception):
        result = profile_r.json().get("result", [])
        player = result[0] if result else {}

    # Parse recent results
    recent = []
    if not isinstance(recent_r, Exception):
        raw_recent = recent_r.json().get("result", [])
        if isinstance(raw_recent, list):
            finished = [_norm_recent(m) for m in raw_recent
                        if m.get("event_status") in ("Finished", "After Penalties")]
            recent = sorted(finished, key=lambda m: m.get("date", ""), reverse=True)[:15]

    # Parse upcoming
    upcoming = []
    if not isinstance(upcoming_r, Exception):
        raw_upcoming = upcoming_r.json().get("result", [])
        if isinstance(raw_upcoming, list):
            upcoming = [_norm_recent(m) for m in raw_upcoming[:6]]

    # Enrich with local data
    enrichment = get_player_enrichment(key_int)

    # Calculate age
    age = _calc_age(player.get("player_bday", ""))

    # Current ranking from stats
    stats = player.get("stats", [])
    current_stats = next(
        (s for s in stats if s.get("season") == "2026" and s.get("type") == "singles"), None
    ) or next((s for s in sorted(stats, key=lambda x: x.get("season", ""), reverse=True)
               if s.get("type") == "singles"), None)

    return {
        **player,
        # Computed
        "age": age,
        "current_rank": current_stats.get("rank") if current_stats else None,
        "ytd_titles":   current_stats.get("titles", "0") if current_stats else "0",
        "ytd_wins":     current_stats.get("matches_won", "0") if current_stats else "0",
        "ytd_losses":   current_stats.get("matches_lost", "0") if current_stats else "0",
        # Enriched (from local data)
        "height_cm":    enrichment.get("height_cm"),
        "weight_kg":    enrichment.get("weight_kg"),
        "hand":         enrichment.get("hand"),
        "backhand":     enrichment.get("backhand"),
        "coach":        enrichment.get("coach"),
        "turned_pro":   enrichment.get("turned_pro"),
        "career_high":  enrichment.get("career_high"),
        "prize_money":  enrichment.get("prize_money_usd"),
        "grand_slams":  enrichment.get("grand_slams", 0),
        "atp_titles":   enrichment.get("atp_titles") or enrichment.get("wta_titles"),
        # Matches
        "recent_matches":   recent,
        "upcoming_matches": upcoming,
    }


@router.get("/{player_key}/h2h/{opponent_key}")
async def head_to_head(player_key: str, opponent_key: str):
    async with httpx.AsyncClient() as c:
        r = await c.get(BASE, params={
            "method": "get_H2H", "APIkey": API_KEY,
            "first_player_key": player_key, "second_player_key": opponent_key,
        }, timeout=10)
        return r.json().get("result", {})
