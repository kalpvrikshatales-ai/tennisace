import os
REDIS_URL = os.getenv("UPSTASH_REDIS_URL")

async def get_cached(key: str): return None
async def set_cached(key: str, value: str, ttl: int = 60): pass
