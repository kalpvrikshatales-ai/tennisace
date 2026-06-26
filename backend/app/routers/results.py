from fastapi import APIRouter
import httpx, os, asyncio
from dotenv import load_dotenv
from datetime import date, timedelta

load_dotenv()

router = APIRouter()
API_KEY = os.getenv("TENNIS_API_KEY", "")
BASE = "https://api.api-tennis.com/tennis/"

# All event types with CORRECT API capitalization
RESULT_TYPES = [
    "Atp Singles", "Wta Singles",
    "Grand Slam Men Singles", "Grand Slam Women Singles",
    "Challenger Men Singles", "Challenger Women Singles",
    "Itf Men Singles", "Itf Women Singles",
    "Boys Singles", "Girls Singles",
]

FIXTURE_TYPES = [
    "Atp Singles", "Wta Singles",
    "Grand Slam Men Singles", "Grand Slam Women Singles",
    "Challenger Men Singles", "Challenger Women Singles",
    "Itf Men Singles", "Itf Women Singles",
]


def _norm(raw: dict) -> dict:
    scores = raw.get("scores", [])
    set_score = ", ".join(
        f"{s.get('score_first', '')}-{s.get('score_second', '')}"
        for s in scores if s.get("score_first") not in ("", None)
    )
    return {
        "match_id":    str(raw.get("event_key", "")),
        "player1":     raw.get("event_first_player", ""),
        "player2":     raw.get("event_second_player", ""),
        "player1_key": raw.get("first_player_key"),
        "player2_key": raw.get("second_player_key"),
        "player1_img": raw.get("event_first_player_logo"),
        "player2_img": raw.get("event_second_player_logo"),
        "score":       set_score or raw.get("event_final_result", ""),
        "status":      raw.get("event_status", "Finished"),
        "winner":      raw.get("event_winner"),
        "tournament":  raw.get("tournament_name", ""),
        "round":       raw.get("tournament_round", ""),
        "type":        raw.get("event_type_type", ""),
        "date":        raw.get("event_date", ""),
    }


async def _fetch_events(c: httpx.AsyncClient, etype: str, date_start: str, date_stop: str) -> list:
    try:
        r = await c.get(BASE, params={
            "method": "get_events", "APIkey": API_KEY,
            "date_start": date_start, "date_stop": date_stop,
            "event_type": etype,
        }, timeout=12)
        raw = r.json().get("result", [])
        if isinstance(raw, list):
            return [_norm(m) for m in raw
                    if m.get("event_status") in ("Finished", "After Penalties", "After Extra Time", "Walkover")]
    except Exception:
        pass
    return []


async def _fetch_fixtures(c: httpx.AsyncClient, etype: str, date_start: str, date_stop: str) -> list:
    try:
        r = await c.get(BASE, params={
            "method": "get_fixtures", "APIkey": API_KEY,
            "date_start": date_start, "date_stop": date_stop,
            "event_type": etype,
        }, timeout=12)
        raw = r.json().get("result", [])
        if isinstance(raw, list):
            return [_norm(m) for m in raw if not m.get("event_live")]
    except Exception:
        pass
    return []


@router.get("/results")
async def results(days: int = 7):
    stop = date.today()
    start = stop - timedelta(days=days)
    s, e = str(start), str(stop)

    async with httpx.AsyncClient() as c:
        tasks = [_fetch_events(c, t, s, e) for t in RESULT_TYPES]
        batches = await asyncio.gather(*tasks)

    all_matches = [m for batch in batches for m in batch]
    all_matches.sort(key=lambda m: m.get("date", ""), reverse=True)
    return {"results": all_matches[:100], "count": len(all_matches[:100])}


@router.get("/fixtures")
async def fixtures(days: int = 5):
    start = date.today()
    stop = start + timedelta(days=days)
    s, e = str(start), str(stop)

    async with httpx.AsyncClient() as c:
        tasks = [_fetch_fixtures(c, t, s, e) for t in FIXTURE_TYPES]
        batches = await asyncio.gather(*tasks)

    all_fixtures = [m for batch in batches for m in batch]
    all_fixtures.sort(key=lambda m: m.get("date", ""))
    return {"fixtures": all_fixtures[:100], "count": len(all_fixtures[:100])}
