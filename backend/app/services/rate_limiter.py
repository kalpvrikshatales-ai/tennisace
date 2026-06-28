from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from fastapi import Request
import os

RATE_LIMIT_ENABLED = os.getenv("RATE_LIMIT_ENABLED", "true").lower() == "true"

limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["100/minute"] if RATE_LIMIT_ENABLED else [],
)

async def rate_limit_error_handler(request: Request, exc: RateLimitExceeded):
    return {
        "detail": "Rate limit exceeded. Please try again later.",
        "retry_after": exc.detail.split("retry after ")[1] if "retry after" in exc.detail else "60s",
    }
