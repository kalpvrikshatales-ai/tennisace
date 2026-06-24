import httpx, os
from dotenv import load_dotenv
load_dotenv()

API_KEY = os.getenv("TENNIS_API_KEY")
BASE_URL = "https://api.api-tennis.com/tennis/"

async def get_live_matches():
    if not API_KEY:
        return _mock_matches()
    async with httpx.AsyncClient() as c:
        try:
            r = await c.get(BASE_URL, params={"method":"get_livescore","APIkey":API_KEY}, timeout=10)
            return r.json().get("result", [])
        except:
            return _mock_matches()

async def get_match_by_id(match_id: str):
    return {"match_id": match_id, "status": "in_progress"}

async def get_tournaments():
    if not API_KEY:
        return _mock_tournaments()
    async with httpx.AsyncClient() as c:
        try:
            r = await c.get(BASE_URL, params={"method":"get_tournaments","APIkey":API_KEY}, timeout=10)
            return r.json().get("result", [])
        except:
            return _mock_tournaments()

def _mock_matches():
    return [
        {"match_id":"1","player1":"Novak Djokovic","player2":"Carlos Alcaraz","score":"6-4, 3-2","status":"In Progress","tournament":"Wimbledon 2025"},
        {"match_id":"2","player1":"Iga Swiatek","player2":"Aryna Sabalenka","score":"7-5, 1-0","status":"In Progress","tournament":"Wimbledon 2025"},
    ]

def _mock_tournaments():
    return [
        {"id":"1","name":"Wimbledon","surface":"Grass","country":"UK"},
        {"id":"2","name":"US Open","surface":"Hard","country":"USA"},
        {"id":"3","name":"Roland Garros","surface":"Clay","country":"France"},
        {"id":"4","name":"Australian Open","surface":"Hard","country":"Australia"},
    ]
