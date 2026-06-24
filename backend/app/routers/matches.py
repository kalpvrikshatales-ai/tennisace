from fastapi import APIRouter, HTTPException
from app.services.tennis_api import get_live_matches, get_match_by_id

router = APIRouter()

@router.get("/live")
async def live_matches():
    matches = await get_live_matches()
    return {"matches": matches, "count": len(matches)}

@router.get("/{match_id}")
async def match_detail(match_id: str):
    match = await get_match_by_id(match_id)
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")
    return match
