from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import os
from supabase import create_client, Client

router = APIRouter()

url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_KEY")
supabase: Client = create_client(url, key) if url and key else None

class VoteRequest(BaseModel):
  match_id: str
  browser_id: str
  vote: int  # 1 or 2

class VoteStats(BaseModel):
  player1_votes: int
  player2_votes: int
  total_votes: int
  user_vote: int | None

@router.post("/cast", response_model=dict)
async def cast_vote(vote: VoteRequest):
  if not supabase:
    raise HTTPException(status_code=500, detail="Database not configured")
  if vote.vote not in [1, 2]:
    raise HTTPException(status_code=400, detail="Vote must be 1 or 2")
  if not vote.match_id or not vote.browser_id:
    raise HTTPException(status_code=400, detail="Missing match_id or browser_id")

  try:
    result = supabase.table("match_votes").upsert(
      {
        "match_id": vote.match_id,
        "browser_id": vote.browser_id,
        "vote": vote.vote
      },
      on_conflict="match_id,browser_id"
    ).execute()
    return {"success": True, "vote_id": result.data[0]["id"] if result.data else None}
  except Exception as e:
    raise HTTPException(status_code=500, detail=str(e))

@router.get("/match/{match_id}", response_model=VoteStats)
async def get_votes(match_id: str, browser_id: str = None):
  if not supabase:
    raise HTTPException(status_code=500, detail="Database not configured")

  try:
    votes = supabase.table("match_votes").select("vote").eq("match_id", match_id).execute()
    vote_data = votes.data or []

    player1_votes = sum(1 for v in vote_data if v["vote"] == 1)
    player2_votes = sum(1 for v in vote_data if v["vote"] == 2)
    total_votes = len(vote_data)

    user_vote = None
    if browser_id:
      user_votes = supabase.table("match_votes").select("vote").eq("match_id", match_id).eq("browser_id", browser_id).execute()
      if user_votes.data:
        user_vote = user_votes.data[0]["vote"]

    return VoteStats(
      player1_votes=player1_votes,
      player2_votes=player2_votes,
      total_votes=total_votes,
      user_vote=user_vote
    )
  except Exception as e:
    raise HTTPException(status_code=500, detail=str(e))
