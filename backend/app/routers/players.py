from fastapi import APIRouter
import httpx, os
from dotenv import load_dotenv
from app.services.db import _headers, _ready, SUPABASE_URL
from datetime import datetime, timezone

load_dotenv()

router = APIRouter()
API_KEY = os.getenv("TENNIS_API_KEY", "")
BASE = "https://api.api-tennis.com/tennis/"

# In-memory cache: { "ATP": (data, timestamp), "WTA": (data, timestamp) }
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

        # Also persist to Supabase for offline fallback
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
        # Supabase fallback
        if _ready():
            try:
                async with httpx.AsyncClient() as c:
                    r = await c.get(
                        f"{SUPABASE_URL}/rest/v1/rankings_cache",
                        headers=_headers(),
                        params={"league": f"eq.{type}", "select": "data"},
                        timeout=5,
                    )
                    rows = r.json()
                    if rows:
                        return {"rankings": rows[0]["data"], "type": type, "cached": True}
            except Exception:
                pass
        return {"rankings": [], "type": type}


@router.get("/{player_key}")
async def player_profile(player_key: str):
    async with httpx.AsyncClient() as c:
        r = await c.get(BASE, params={"method": "get_players", "APIkey": API_KEY, "player_key": player_key}, timeout=10)
        result = r.json().get("result", [])
        return result[0] if result else {}


@router.get("/{player_key}/h2h/{opponent_key}")
async def head_to_head(player_key: str, opponent_key: str):
    async with httpx.AsyncClient() as c:
        r = await c.get(BASE, params={
            "method": "get_H2H", "APIkey": API_KEY,
            "first_player_key": player_key, "second_player_key": opponent_key,
        }, timeout=10)
        return r.json().get("result", {})
