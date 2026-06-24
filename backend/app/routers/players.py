from fastapi import APIRouter
router = APIRouter()

@router.get("/{player_id}")
async def player_profile(player_id: str):
    return {"player_id": player_id, "status": "coming_soon"}
