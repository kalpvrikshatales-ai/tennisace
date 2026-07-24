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


def _is_upstream_error(item) -> bool:
    """api-tennis.com returns {"cod": ..., "msg": ..., "param": ...} instead of
    real data when the account hits a billing/plan gate. Detect that shape so
    we never cache or serve it as if it were real player/ranking data."""
    return isinstance(item, dict) and "cod" in item and "msg" in item


async def _get_rankings_cached(league: str) -> list:
    cache_key = f"rankings:{league}"
    cached = await get_cached(cache_key)
    if cached:
        return cached

    async with httpx.AsyncClient() as c:
        r = await c.get(BASE, params={"method": "get_standings", "APIkey": API_KEY, "event_type": league}, timeout=10)
        data = r.json().get("result", [])
        now = datetime.now(timezone.utc)

        if data and _is_upstream_error(data[0]):
            # Upstream account error (e.g. payment lapsed) — never cache this,
            # raise so the caller's Supabase-backed fallback kicks in.
            raise RuntimeError(f"api-tennis.com error: {data[0].get('msg')}")

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
async def rankings(response: Response, type: str = "ATP", limit: int = 100, offset: int = 0):
    try:
        data = await _get_rankings_cached(type)
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


def _norm_match(m: dict) -> dict:
    scores = m.get("scores", [])
    set_score = ", ".join(
        f"{s.get('score_first','')}-{s.get('score_second','')}"
        for s in scores if s.get("score_first") not in ("", None, "0") or s.get("score_second") not in ("", None, "0")
    )
    return {
        "match_id":    str(m.get("event_key", "")),
        "player1":     m.get("event_first_player", ""),
        "player2":     m.get("event_second_player", ""),
        "player1_key": m.get("first_player_key"),
        "player2_key": m.get("second_player_key"),
        "player1_img": m.get("event_first_player_logo"),
        "player2_img": m.get("event_second_player_logo"),
        "score":       set_score or m.get("event_final_result", ""),
        "status":      m.get("event_status", ""),
        "winner":      m.get("event_winner"),
        "tournament":  m.get("tournament_name", ""),
        "surface":     get_surface(m.get("tournament_name", ""), m.get("event_type_type", "")),
        "round":       m.get("tournament_round", "").split(" - ")[-1],
        "date":        m.get("event_date", ""),
        "time":        m.get("event_time", ""),
    }

_norm_recent = _norm_match  # alias — used by H2H code path


def _did_win(m: dict, key_int: int) -> bool:
    p1k = m.get("player1_key")
    try:
        is_p1 = int(p1k) == key_int
    except (TypeError, ValueError):
        is_p1 = True
    w = m.get("winner", "")
    return (w == "First Player" and is_p1) or (w == "Second Player" and not is_p1)


def _compute_form(recent: list, key_int: int) -> dict:
    last10 = recent[:10]
    streak = ["W" if _did_win(m, key_int) else "L" for m in last10]
    wins = streak.count("W")
    return {
        "streak": streak,
        "wins": wins,
        "losses": len(streak) - wins,
        "win_pct": round(wins / len(streak) * 100) if streak else 0,
    }


def _compute_prediction(upcoming: list, recent: list, key_int: int):
    if not upcoming or not recent:
        return None
    next_m = upcoming[0]
    surface = next_m.get("surface", "Hard")
    last10 = recent[:10]

    overall_wins = sum(1 for m in last10 if _did_win(m, key_int))
    base_prob = overall_wins / len(last10) if last10 else 0.5

    surf_matches = [m for m in last10 if m.get("surface") == surface]
    if surf_matches:
        surf_wins = sum(1 for m in surf_matches if _did_win(m, key_int))
        weight = min(len(surf_matches) / 5.0, 1.0)
        prob = (surf_wins / len(surf_matches)) * weight + base_prob * (1 - weight)
        surface_record = f"{surf_wins}W {len(surf_matches) - surf_wins}L"
    else:
        prob = base_prob
        surface_record = None

    p1k = next_m.get("player1_key")
    try:
        is_p1 = int(p1k) == key_int
    except (TypeError, ValueError):
        is_p1 = True
    opp_side = "player2" if is_p1 else "player1"
    opp_key_side = "player2_key" if is_p1 else "player1_key"

    confidence = "high" if len(last10) >= 8 else "medium" if len(last10) >= 5 else "low"
    return {
        "win_probability": round(prob * 100),
        "opponent": next_m.get(opp_side, "Opponent"),
        "opponent_key": next_m.get(opp_key_side),
        "surface": surface,
        "tournament": next_m.get("tournament", ""),
        "form_record": f"{overall_wins}W {len(last10) - overall_wins}L",
        "surface_record": f"{surface_record} on {surface}" if surface_record else None,
        "confidence": confidence,
        "match_id": next_m.get("match_id"),
        "date": next_m.get("date", ""),
        "time": next_m.get("time", ""),
    }


@router.get("/{player_key}")
async def player_profile(player_key: str, response: Response):
    key_int = int(player_key) if player_key.isdigit() else 0
    response.headers["Cache-Control"] = "public, max-age=3600"

    # Redis cache for full profile (1 hour) — avoids 35 concurrent API calls on every page view
    cache_key = f"player_profile_v3:{player_key}"
    cached = await get_cached(cache_key)
    if cached:
        return cached

    today = date.today()

    async with httpx.AsyncClient() as c:
        # 1. Profile fetch
        profile_coro = c.get(BASE, params={
            "method": "get_players", "APIkey": API_KEY, "player_key": player_key,
        }, timeout=12)

        # 2. Per-day recent: last 21 days — API only returns data for single-day date_start==date_stop
        past_days = [today - timedelta(days=i) for i in range(21)]
        recent_coros = [
            c.get(BASE, params={
                "method": "get_fixtures", "APIkey": API_KEY,
                "date_start": str(d), "date_stop": str(d),
                "player_key": player_key,
            }, timeout=12) for d in past_days
        ]

        # 3. Per-day upcoming: next 14 days
        future_days = [today + timedelta(days=i) for i in range(1, 15)]
        upcoming_coros = [
            c.get(BASE, params={
                "method": "get_fixtures", "APIkey": API_KEY,
                "date_start": str(d), "date_stop": str(d),
                "player_key": player_key,
            }, timeout=12) for d in future_days
        ]

        all_results = await asyncio.gather(
            profile_coro, *recent_coros, *upcoming_coros,
            return_exceptions=True,
        )

    # Separate results
    profile_r = all_results[0]
    recent_rs = all_results[1:22]    # 21 day results
    upcoming_rs = all_results[22:]   # 14 day results

    # Parse profile
    player = {}
    profile_unavailable = False
    if not isinstance(profile_r, Exception):
        try:
            result = profile_r.json().get("result", [])
            candidate = result[0] if result else {}
            if _is_upstream_error(candidate):
                profile_unavailable = True  # e.g. billing/plan gate — never trust as real profile
            else:
                player = candidate
        except Exception:
            pass

    # Collect + deduplicate recent (finished) matches across days
    recent_raw = []
    for r in recent_rs:
        if not isinstance(r, Exception):
            try:
                data = r.json().get("result", [])
                if isinstance(data, list):
                    recent_raw.extend(data)
            except Exception:
                pass

    seen: set = set()
    recent: list = []
    for m in sorted(
        [_norm_match(m) for m in recent_raw
         if m.get("event_status") in ("Finished", "After Penalties") or m.get("event_winner")],
        key=lambda m: m.get("date", ""), reverse=True,
    ):
        if m["match_id"] and m["match_id"] not in seen:
            seen.add(m["match_id"])
            recent.append(m)
        if len(recent) >= 15:
            break

    # Collect + deduplicate upcoming matches across days
    upcoming_raw = []
    for r in upcoming_rs:
        if not isinstance(r, Exception):
            try:
                data = r.json().get("result", [])
                if isinstance(data, list):
                    upcoming_raw.extend(data)
            except Exception:
                pass

    seen2: set = set()
    upcoming: list = []
    for m in sorted(upcoming_raw, key=lambda m: (m.get("event_date", ""), m.get("event_time", ""))):
        mid = str(m.get("event_key", ""))
        status = m.get("event_status", "")
        winner = m.get("event_winner")
        if mid and mid not in seen2 and not winner and status not in ("Finished", "After Penalties"):
            seen2.add(mid)
            upcoming.append(_norm_match(m))
        if len(upcoming) >= 6:
            break

    # Compute form streak and prediction
    form = _compute_form(recent, key_int)
    prediction = _compute_prediction(upcoming, recent, key_int)

    # Enrich with local data
    enrichment = get_player_enrichment(key_int)
    age = _calc_age(player.get("player_bday", ""))

    stats = player.get("stats", [])
    current_stats = next(
        (s for s in stats if s.get("season") == "2026" and s.get("type") == "singles"), None
    ) or next((s for s in sorted(stats, key=lambda x: x.get("season", ""), reverse=True)
               if s.get("type") == "singles"), None)

    result_data = {
        **player,
        "age": age,
        "current_rank": current_stats.get("rank") if current_stats else None,
        "ytd_titles":   current_stats.get("titles", "0") if current_stats else "0",
        "ytd_wins":     current_stats.get("matches_won", "0") if current_stats else "0",
        "ytd_losses":   current_stats.get("matches_lost", "0") if current_stats else "0",
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
        "recent_matches":   recent,
        "upcoming_matches": upcoming,
        "form":             form,
        "prediction":       prediction,
        "profile_unavailable": profile_unavailable,
    }

    # Don't lock in a broken/empty profile for an hour — only cache real data.
    if not profile_unavailable:
        await set_cached(cache_key, result_data, ttl=3600)
    return result_data


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
