from fastapi import APIRouter, Response
from app.services.tennis_api import get_tournaments
router = APIRouter()

@router.get("/")
async def list_tournaments(response: Response = None):
    if response:
        response.headers["Cache-Control"] = "public, max-age=86400"
    return {"tournaments": await get_tournaments()}
