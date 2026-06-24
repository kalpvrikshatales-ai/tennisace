from pydantic import BaseModel
from typing import Optional

class Player(BaseModel):
    player_id: str
    name: str
    country: Optional[str] = None
    ranking: Optional[int] = None
