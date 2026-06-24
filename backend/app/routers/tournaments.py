from fastapi import APIRouter
from app.services.tennis_api import get_tournaments
router = APIRouter()

@router.get("/")
async def list_tournaments():
    return {"tournaments": await get_tournaments()}
