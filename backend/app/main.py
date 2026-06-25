from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import matches, players, tournaments, results

app = FastAPI(title="TennisAce API", description="tennisace.live", version="1.0.0")

app.add_middleware(CORSMiddleware, allow_origins=["http://localhost:3000","https://tennisace.live","https://www.tennisace.live","https://tennisace.vercel.app"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

app.include_router(matches.router, prefix="/matches", tags=["matches"])
app.include_router(players.router, prefix="/players", tags=["players"])
app.include_router(tournaments.router, prefix="/tournaments", tags=["tournaments"])
app.include_router(results.router, prefix="/feed", tags=["feed"])

@app.get("/")
def root(): return {"app":"TennisAce","domain":"tennisace.live","status":"live"}

@app.get("/health")
def health(): return {"status":"ok"}
