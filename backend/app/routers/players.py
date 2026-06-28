from fastapi import APIRouter, Response
import httpx, os, asyncio
from dotenv import load_dotenv
from app.services.db import _headers, _ready, SUPABASE_URL
from app.services.redis_cache import get_cached, set_cached
from app.data.player_enrichment import get_player_enrichment, get_surface
from datetime import datetime, timezone, date, timedelta

load_dotenv()

router = APIRouter()
API_KEY = os.getenv("TENNIS_API_KEY", "")
BASE = "https://api.api-tennis.com/tennis/"

CACHE_TTL_HOURS = 6


async def _get_rankings_cached(league: str) -> list:
    cache_key = f"rankings:{league}"
    cached = await get_cached(cache_key)
    if cached:
        return cached

    async with httpx.AsyncClient() as c:
        r = await c.get(BASE, params={"method": "get_standings", "APIkey": API_KEY, "event_type": league}, timeout=10)
        data = r.json().get("result", [])
        now = datetime.now(timezone.utc)

        if data:
            await set_cached(cache_key, data, ttl=CACHE_TTL_HOURS * 3600)
            if _ready():
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
async def rankings(type: str = "ATP", limit: int = 100, offset: int = 0, response: Response = None):
    try:
        data = await _get_rankings_cached(type)
        if response:
            response.headers["Cache-Control"] = "public, max-age=21600"
        total = len(data)
        paginated = data[offset:offset + limit]
        return {"rankings": paginated, "type": type, "total": total, "count": len(paginated), "offset": offset, "limit": limit}
    except Exception:
        if _ready():
            try:
                async with httpx.AsyncClient() as c:
                    r = await c.get(f"{SUPABASE_URL}/rest/v1/rankings_cache",
                        headers=_headers(), params={"league": f"eq.{type}", "select": "data"}, timeout=5)
                    rows = r.json()
                    if rows:
                        if response:
                            response.headers["Cache-Control"] = "public, max-age=21600"
                        data = rows[0]["data"]
                        total = len(data)
                        paginated = data[offset:offset + limit]
                        return {"rankings": paginated, "type": type, "total": total, "count": len(paginated), "cached": True, "offset": offset, "limit": limit}
            except Exception:
                pass
        return {"rankings": [], "type": type, "total": 0, "count": 0, "offset": offset, "limit": limit}


def _calc_age(bday: str):
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
async def player_profile(player_key: str, response: Response):
    key_int = int(player_key) if player_key.isdigit() else 0
    response.headers["Cache-Control"] = "public, max-age=3600"

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


@router.get("/aita-rankings")
async def aita_rankings():
    """Scrape AITA rankings from aitatennis.com — cached in Supabase."""
    import re

    # Try Supabase cache first
    if _ready():
        try:
            async with httpx.AsyncClient() as c:
                r = await c.get(
                    f"{SUPABASE_URL}/rest/v1/rankings_cache",
                    headers=_headers(),
                    params={"league": "eq.AITA", "select": "data,cached_at"},
                    timeout=5,
                )
                rows = r.json()
                if rows:
                    from datetime import datetime, timezone
                    cached_at = datetime.fromisoformat(rows[0]["cached_at"].replace("Z", "+00:00"))
                    age_hours = (datetime.now(timezone.utc) - cached_at).total_seconds() / 3600
                    if age_hours < 24:
                        return {"rankings": rows[0]["data"], "source": "cache", "cached": True}
        except Exception:
            pass

    # Scrape AITA website
    headers_req = {
        "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15",
        "Accept": "text/html,application/xhtml+xml",
    }
    rankings_data = []
    try:
        async with httpx.AsyncClient() as c:
            r = await c.get("https://aitatennis.com/rankings/", headers=headers_req, timeout=15, follow_redirects=True)
            html = r.text

            # Parse table rows
            rows = re.findall(r'<tr[^>]*>(.*?)</tr>', html, re.DOTALL | re.IGNORECASE)
            for row in rows:
                cells = re.findall(r'<td[^>]*>(.*?)</td>', row, re.DOTALL | re.IGNORECASE)
                clean = [re.sub(r'<[^>]+>', '', c).strip() for c in cells]
                clean = [c for c in clean if c]
                if len(clean) >= 2 and clean[0].isdigit():
                    rankings_data.append({
                        "place": clean[0],
                        "player": clean[1] if len(clean) > 1 else "",
                        "country": "India",
                        "points": clean[2] if len(clean) > 2 else "",
                        "league": "AITA",
                    })
    except Exception:
        pass

    # Store in Supabase if we got data
    if rankings_data and _ready():
        try:
            from datetime import datetime, timezone
            async with httpx.AsyncClient() as c:
                await c.post(
                    f"{SUPABASE_URL}/rest/v1/rankings_cache",
                    headers={**_headers(), "Prefer": "resolution=merge-duplicates"},
                    json={"league": "AITA", "data": rankings_data, "cached_at": datetime.now(timezone.utc).isoformat()},
                    timeout=5,
                )
        except Exception:
            pass

    return {"rankings": rankings_data, "source": "live" if rankings_data else "unavailable"}
