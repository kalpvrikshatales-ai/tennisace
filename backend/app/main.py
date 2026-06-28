from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.gzip import GZIPMiddleware
from contextlib import asynccontextmanager
from app.routers import matches, players, tournaments, results, push, news, votes
from app.services.notifier import start_notifier
import asyncio
import os
import time
import logging
import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration
from sentry_sdk.integrations.starlette import StarletteIntegration

logger = logging.getLogger("tennisace")

sentry_dsn = os.getenv("SENTRY_DSN")
if sentry_dsn:
    sentry_sdk.init(
        dsn=sentry_dsn,
        environment=os.getenv("ENVIRONMENT", "development"),
        integrations=[
            FastApiIntegration(),
            StarletteIntegration(),
        ],
        traces_sample_rate=0.05,
        # profiles_sample_rate removed — profiling uses too much memory on free tier
    )

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Notifier disabled — was spawning DB write tasks every 5 min causing OOM on free tier
    yield

app = FastAPI(title="TennisAce API", description="tennisace.live", version="1.0.0", lifespan=lifespan)

@app.middleware("http")
async def timing_middleware(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    if process_time > 0.5:  # Log slow requests (> 500ms)
        logger.warning(f"{request.method} {request.url.path} took {process_time:.2f}s")
    response.headers["X-Process-Time"] = str(process_time)
    return response

app.add_middleware(GZIPMiddleware, minimum_size=1000)
app.add_middleware(CORSMiddleware, allow_origins=["http://localhost:3000","https://tennisace.live","https://www.tennisace.live","https://tennisace.vercel.app"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

app.include_router(matches.router, prefix="/matches", tags=["matches"])
app.include_router(players.router, prefix="/players", tags=["players"])
app.include_router(tournaments.router, prefix="/tournaments", tags=["tournaments"])
app.include_router(results.router, prefix="/feed", tags=["feed"])
app.include_router(push.router, prefix="/push", tags=["push"])
app.include_router(news.router, prefix="/feed", tags=["news"])
app.include_router(votes.router, prefix="/votes", tags=["votes"])

@app.get("/")
def root(): return {"app":"TennisAce","domain":"tennisace.live","status":"live"}

@app.get("/health")
def health(): return {"status":"ok"}
