from fastapi import APIRouter
import httpx, os
from dotenv import load_dotenv

load_dotenv()

router = APIRouter()
API_KEY = os.getenv("TENNIS_API_KEY", "")
BASE = "https://api.api-tennis.com/tennis/"


@router.get("/rankings")
async def rankings(type: str = "ATP"):
    async with httpx.AsyncClient() as c:
        r = await c.get(BASE, params={"method": "get_standings", "APIkey": API_KEY, "event_type": type}, timeout=10)
        return {"rankings": r.json().get("result", []), "type": type}


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
