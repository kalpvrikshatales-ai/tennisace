from fastapi import APIRouter, BackgroundTasks
from pydantic import BaseModel
import httpx, os, json
from dotenv import load_dotenv
from app.services.db import _headers, _ready, SUPABASE_URL

load_dotenv()

router = APIRouter()

VAPID_PUBLIC  = os.getenv("VAPID_PUBLIC_KEY", "")
VAPID_PRIVATE = os.getenv("VAPID_PRIVATE_KEY", "")
VAPID_EMAIL   = os.getenv("VAPID_EMAIL", "mailto:admin@tennisace.live")


class PushSubscription(BaseModel):
    endpoint: str
    keys: dict
    expirationTime: float = None


@router.post("/test")
async def test_push():
    """Send a test push to all subscribers."""
    await broadcast_push(
        title="🎾 TennisAce Test",
        body="Push notifications are working! You'll get Wimbledon alerts on June 30.",
        url="https://tennisace.live",
    )
    return {"ok": True, "message": "Test push sent to all subscribers"}


@router.post("/subscribe")
async def subscribe(sub: PushSubscription):
    if not _ready():
        return {"ok": False, "reason": "db not configured"}
    try:
        async with httpx.AsyncClient() as c:
            await c.post(
                f"{SUPABASE_URL}/rest/v1/push_subscriptions",
                headers={**_headers(), "Prefer": "resolution=merge-duplicates"},
                json={"endpoint": sub.endpoint, "subscription": sub.dict()},
                timeout=5,
            )
        return {"ok": True}
    except Exception as e:
        return {"ok": False, "reason": str(e)}


async def send_push(endpoint: str, sub_data: dict, title: str, body: str, url: str = "/"):
    """Send a single push notification using pywebpush."""
    try:
        from pywebpush import webpush, WebPushException
        webpush(
            subscription_info=sub_data,
            data=json.dumps({"title": title, "body": body, "url": url}),
            vapid_private_key=VAPID_PRIVATE,
            vapid_claims={"sub": VAPID_EMAIL},
        )
    except Exception:
        pass


async def broadcast_push(title: str, body: str, url: str = "/"):
    """Send a push to all stored subscriptions."""
    if not _ready() or not VAPID_PRIVATE:
        return
    try:
        async with httpx.AsyncClient() as c:
            r = await c.get(
                f"{SUPABASE_URL}/rest/v1/push_subscriptions",
                headers=_headers(),
                params={"select": "subscription"},
                timeout=5,
            )
            subs = r.json() if r.status_code == 200 else []
            for s in subs:
                await send_push(
                    s["subscription"]["endpoint"],
                    s["subscription"],
                    title, body, url
                )
    except Exception:
        pass
