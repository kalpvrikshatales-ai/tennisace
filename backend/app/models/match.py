from pydantic import BaseModel
from typing import Optional

class Match(BaseModel):
    match_id: str
    player1: str
    player2: str
    score: Optional[str] = None
    status: str
    tournament: Optional[str] = None
