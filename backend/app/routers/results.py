from fastapi import APIRouter, Response
import httpx, os, asyncio
from dotenv import load_dotenv
from datetime import date, timedelta
from app.data.player_enrichment import get_surface
from app.services.redis_cache import get_cached, set_cached

load_dotenv()

router = APIRouter()
API_KEY = os.getenv("TENNIS_API_KEY", "")
BASE = "https://api.api-tennis.com/tennis/"

# get_fixtures returns both finished + upcoming — filter by status
# event_status='Finished' → result  |  event_status='' → upcoming

# API-Tennis get_fixtures IGNORES event_type — returns ALL matches
# Single call gets everything; we filter client-side
SINGLES_TYPES = {
    "Atp Singles", "Wta Singles",
    "Grand Slam Men Singles", "Grand Slam Women Singles",
    "Challenger Men Singles", "Challenger Women Singles",
    "Itf Men Singles", "Itf Women Singles",
}

ROUND_MAP = {
    '1/64-finals': 'R1', '1/32-finals': 'R2', '1/16-finals': 'R3',
    '1/8-finals': 'R4', '1/4-finals': 'QF', '1/2-finals': 'SF',
    'Final': 'F',
}


def _validate_match(raw: dict) -> bool:
    """Validate match has two different players."""
    p1 = (raw.get("event_first_player") or "").strip()
    p2 = (raw.get("event_second_player") or "").strip()

    # Both players must exist and be different
    if not p1 or not p2:
        return False
    if p1.lower() == p2.lower():
        return False  # Same player twice

    return True

def _norm(raw: dict) -> dict:
    scores = raw.get("scores", [])
    set_score = ", ".join(
        f"{s.get('score_first','')}-{s.get('score_second','')}"
        for s in scores
        if s.get("score_first") not in ("", None, "0") or s.get("score_second") not in ("", None, "0")
    )
    tournament = raw.get("tournament_name", "")
    event_type = raw.get("event_type_type", "")
    raw_round = (raw.get("tournament_round") or "").split(" - ")[-1]
    clean_round = ROUND_MAP.get(raw_round.lower().replace("1/", "1/"), raw_round)
    return {
        "match_id":    str(raw.get("event_key", "")),
        "player1":     raw.get("event_first_player", ""),
        "player2":     raw.get("event_second_player", ""),
        "player1_key": raw.get("first_player_key"),
        "player2_key": raw.get("second_player_key"),
        "player1_img": raw.get("event_first_player_logo"),
        "player2_img": raw.get("event_second_player_logo"),
        "score":       set_score or raw.get("event_final_result", ""),
        "status":      raw.get("event_status", ""),
        "winner":      raw.get("event_winner"),
        "tournament":  tournament,
        "surface":     get_surface(tournament, event_type),
        "round":       clean_round,
        "type":        event_type,
        "date":        raw.get("event_date", ""),
        "time":        raw.get("event_time", ""),
    }


async def _fetch_all(c: httpx.AsyncClient, start: str, stop: str) -> list:
    """Single call — API returns ALL match types regardless of event_type param."""
    try:
        r = await c.get(BASE, params={
            "method": "get_fixtures",
            "APIkey": API_KEY,
            "date_start": start,
            "date_stop": stop,
        }, timeout=15)
        raw = r.json().get("result", [])
        return raw if isinstance(raw, list) else []
    except Exception:
        return []


@router.get("/results")
async def results(response: Response, days: int = 7, limit: int = 50, offset: int = 0):
    """Completed matches from the last N days — singles only."""
    cache_key = f"results_v2:{days}:{offset}:{limit}"
    cached = await get_cached(cache_key)
    if cached:
        response.headers["Cache-Control"] = "public, max-age=3600"
        return cached

    stop  = date.today()
    start = stop - timedelta(days=days)
    async with httpx.AsyncClient() as c:
        raw = await _fetch_all(c, str(start), str(stop))

    finished = [
        _norm(m) for m in raw
        if (m.get("event_status") == "Finished" or m.get("event_winner"))
        and m.get("event_type_type", "") in SINGLES_TYPES
        and _validate_match(m)  # Only valid matches with two different players
    ]
    finished.sort(key=lambda m: m.get("date", ""), reverse=True)
    response.headers["Cache-Control"] = "public, max-age=300"  # 5 min HTTP cache

    total = len(finished)
    paginated = finished[offset:offset + limit]
    result = {"results": paginated, "count": len(paginated), "total": total, "offset": offset, "limit": limit}
    await set_cached(cache_key, result, ttl=300)  # 5 min Redis cache
    return result


@router.get("/fixtures")
async def fixtures(response: Response, days: int = 7, limit: int = 50, offset: int = 0):
    """Upcoming matches for the next N days — sorted Grand Slams first."""
    cache_key = f"fixtures_v2:{days}:{offset}:{limit}"
    cached = await get_cached(cache_key)
    if cached:
        response.headers["Cache-Control"] = "public, max-age=1800"
        return cached

    start = date.today()
    stop  = start + timedelta(days=days)
    async with httpx.AsyncClient() as c:
        raw = await _fetch_all(c, str(start), str(stop))

    PRIORITY = {
        "Grand Slam Men Singles": 0, "Grand Slam Women Singles": 0,
        "Atp Singles": 1, "Wta Singles": 1,
        "Challenger Men Singles": 2, "Challenger Women Singles": 2,
        "Itf Men Singles": 3, "Itf Women Singles": 3,
    }
    upcoming = [
        _norm(m) for m in raw
        if not m.get("event_winner") and m.get("event_status") != "Finished"
        and m.get("event_type_type", "") in SINGLES_TYPES
        and _validate_match(m)  # Only valid matches with two different players
    ]
    upcoming.sort(key=lambda m: (
        m.get("date", ""),
        PRIORITY.get(m.get("type", ""), 4),
        m.get("time", ""),
    ))
    response.headers["Cache-Control"] = "public, max-age=1800"

    total = len(upcoming)
    paginated = upcoming[offset:offset + limit]
    result = {"fixtures": paginated, "count": len(paginated), "total": total, "offset": offset, "limit": limit}
    await set_cached(cache_key, result, ttl=1800)  # 30 minute cache
    return result


# News endpoint
@router.get("/news")
async def get_news(response: Response):
    """BBC Sport tennis RSS feed."""
    cache_key = "news"
    cached = await get_cached(cache_key)
    if cached:
        response.headers["Cache-Control"] = "public, max-age=1800"
        return cached

    RSS = "https://feeds.bbci.co.uk/sport/tennis/rss.xml"
    import re
    response.headers["Cache-Control"] = "public, max-age=1800"
    try:
        async with httpx.AsyncClient() as c:
            r = await c.get(RSS, timeout=8, headers={"User-Agent": "TennisAce/1.0"})
        xml = r.text
        items = re.findall(r'<item>(.*?)</item>', xml, re.DOTALL)
        articles = []
        for item in items[:15]:
            def g(tag: str) -> str:
                m = re.search(rf'<{tag}><!\[CDATA\[(.*?)\]\]>', item, re.DOTALL)
                if not m: m = re.search(rf'<{tag}>(.*?)</{tag}>', item, re.DOTALL)
                return m.group(1).strip() if m else ""
            img = ""
            mi = re.search(r'media:thumbnail[^>]*url="([^"]+)"', item)
            if mi: img = mi.group(1)
            articles.append({
                "title":       g("title"),
                "link":        g("link") or g("guid"),
                "description": re.sub(r'<[^>]+>', '', g("description"))[:200],
                "published":   g("pubDate"),
                "image":       img,
                "source":      "BBC Sport",
            })
        result = {"articles": [a for a in articles if a["title"]], "count": len(articles)}
        await set_cached(cache_key, result, ttl=1800)
        return result
    except Exception as ex:
        return {"articles": [], "count": 0, "error": str(ex)}


# Wimbledon draw endpoint
ROUND_MAP_FULL = {
    '1/64-finals': 'R1', '1/32-finals': 'R2', '1/16-finals': 'R3',
    '1/8-finals': 'R4', '1/4-finals': 'QF', '1/2-finals': 'SF',
    'Final': 'F',
}
ROUND_ORDER = ['R1', 'R2', 'R3', 'R4', 'QF', 'SF', 'F']


@router.get("/wimbledon")
async def wimbledon_draw(gender: str = "men"):
    event_type = "Grand Slam Men Singles" if gender == "men" else "Grand Slam Women Singles"
    async with httpx.AsyncClient() as c:
        try:
            r = await c.get(BASE, params={
                "method": "get_fixtures", "APIkey": API_KEY,
                "date_start": "2026-06-29", "date_stop": "2026-07-14",
                "event_type": event_type,
            }, timeout=15)
            raw = r.json().get("result", [])
        except Exception:
            return {"rounds": {}, "total": 0}

    if not isinstance(raw, list):
        return {"rounds": {}, "total": 0}

    by_round: dict = {}
    for m in raw:
        # Validate before adding (same check as results/fixtures)
        if not _validate_match(m):
            continue

        raw_round = m.get("tournament_round", "").split(" - ")[-1]
        rnd = ROUND_MAP_FULL.get(raw_round, raw_round)
        if rnd not in by_round:
            by_round[rnd] = []
        by_round[rnd].append({
            "match_id":    str(m.get("event_key", "")),
            "player1":     m.get("event_first_player", ""),
            "player2":     m.get("event_second_player", ""),
            "player1_key": m.get("first_player_key"),
            "player2_key": m.get("second_player_key"),
            "player1_img": m.get("event_first_player_logo"),
            "player2_img": m.get("event_second_player_logo"),
            "score":       m.get("event_final_result", ""),
            "winner":      m.get("event_winner"),
            "status":      m.get("event_status", ""),
            "tournament":  "Wimbledon",
            "round":       rnd,
            "date":        m.get("event_date", ""),
            "time":        m.get("event_time", ""),
        })

    ordered = {rnd: by_round[rnd] for rnd in ROUND_ORDER if rnd in by_round}
    return {"rounds": ordered, "total": sum(len(v) for v in ordered.values())}
