from fastapi import APIRouter
import httpx, os
from dotenv import load_dotenv
from datetime import date, timedelta

load_dotenv()

router = APIRouter()
API_KEY = os.getenv("TENNIS_API_KEY", "")
BASE = "https://api.api-tennis.com/tennis/"

MAIN_TYPES = ["ATP Singles", "WTA Singles", "Grand Slam Men Singles", "Grand Slam Women Singles",
              "Challenger Men Singles", "ITF Men", "ITF Women"]


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


@router.get("/results")
async def results(days: int = 3):
    stop = date.today()
    start = stop - timedelta(days=days)
    all_matches = []
    async with httpx.AsyncClient() as c:
        for etype in ["ATP Singles", "WTA Singles", "Grand Slam Men Singles", "Grand Slam Women Singles"]:
            try:
                r = await c.get(BASE, params={
                    "method": "get_events", "APIkey": API_KEY,
                    "date_start": str(start), "date_stop": str(stop),
                    "event_type": etype,
                }, timeout=10)
                raw = r.json().get("result", [])
                if isinstance(raw, list):
                    finished = [_norm(m) for m in raw if m.get("event_status") in ("Finished", "After Penalties", "After Extra Time")]
                    all_matches.extend(finished)
            except Exception:
                continue
    all_matches.sort(key=lambda m: m.get("date", ""), reverse=True)
    return {"results": all_matches[:50], "count": len(all_matches[:50])}


@router.get("/fixtures")
async def fixtures(days: int = 3):
    start = date.today()
    stop = start + timedelta(days=days)
    all_fixtures = []
    async with httpx.AsyncClient() as c:
        for etype in ["ATP Singles", "WTA Singles", "Grand Slam Men Singles", "Grand Slam Women Singles"]:
            try:
                r = await c.get(BASE, params={
                    "method": "get_fixtures", "APIkey": API_KEY,
                    "date_start": str(start), "date_stop": str(stop),
                    "event_type": etype,
                }, timeout=10)
                raw = r.json().get("result", [])
                if isinstance(raw, list):
                    upcoming = [_norm(m) for m in raw if not m.get("event_live")]
                    all_fixtures.extend(upcoming)
            except Exception:
                continue
    all_fixtures.sort(key=lambda m: m.get("date", ""))
    return {"fixtures": all_fixtures[:50], "count": len(all_fixtures[:50])}
