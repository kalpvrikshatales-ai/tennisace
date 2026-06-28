import redis.asyncio as redis
import json
import os
from typing import Any, Optional

REDIS_URL = os.getenv("REDIS_URL") or os.getenv("UPSTASH_REDIS_URL")

_redis_client: Optional[redis.Redis] = None


async def get_redis() -> Optional[redis.Redis]:
    global _redis_client
    if _redis_client is None and REDIS_URL:
        try:
            _redis_client = await redis.from_url(REDIS_URL, decode_responses=True)
            await _redis_client.ping()
        except Exception:
            _redis_client = None
    return _redis_client


async def get_cached(key: str) -> Optional[Any]:
    """Get value from cache."""
    client = await get_redis()
    if not client:
        return None
    try:
        value = await client.get(key)
        if value:
            return json.loads(value)
    except Exception:
        pass
    return None


async def set_cached(key: str, value: Any, ttl: int = 21600) -> bool:
    """Set value in cache with TTL in seconds."""
    client = await get_redis()
    if not client:
        return False
    try:
        await client.setex(key, ttl, json.dumps(value))
        return True
    except Exception:
        return False


async def delete_cached(key: str) -> bool:
    """Delete value from cache."""
    client = await get_redis()
    if not client:
        return False
    try:
        await client.delete(key)
        return True
    except Exception:
        return False


async def flush_pattern(pattern: str) -> bool:
    """Delete all keys matching pattern."""
    client = await get_redis()
    if not client:
        return False
    try:
        keys = await client.keys(pattern)
        if keys:
            await client.delete(*keys)
        return True
    except Exception:
        return False
