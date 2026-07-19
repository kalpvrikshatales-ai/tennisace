from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import RedirectResponse
import httpx
import secrets
import string
from app.services.db import _headers, _ready, SUPABASE_URL

router = APIRouter()
redirect_router = APIRouter()
BASE = f"{SUPABASE_URL}/rest/v1" if SUPABASE_URL else ""


async def _get(table: str, params: dict) -> list:
    if not _ready():
        return []
    async with httpx.AsyncClient() as c:
        r = await c.get(f"{BASE}/{table}", headers=_headers(), params=params, timeout=10)
        if r.status_code != 200:
            return []
        data = r.json()
        return data if isinstance(data, list) else []


async def _post(table: str, body: dict) -> dict:
    if not _ready():
        raise HTTPException(503, "Database unavailable")
    async with httpx.AsyncClient() as c:
        r = await c.post(
            f"{BASE}/{table}",
            headers={**_headers(), "Prefer": "return=representation"},
            json=body,
            timeout=10,
        )
        if r.status_code not in (200, 201):
            raise HTTPException(r.status_code, r.text)
        data = r.json()
        return data[0] if isinstance(data, list) and data else {}


async def _rpc(func: str, params: dict) -> dict:
    if not _ready():
        return {}
    async with httpx.AsyncClient() as c:
        r = await c.post(
            f"{SUPABASE_URL}/rest/v1/rpc/{func}",
            headers=_headers(),
            json=params,
            timeout=10,
        )
        return r.json() if r.status_code == 200 else {}


def _gen_code(length: int = 8) -> str:
    alphabet = string.ascii_lowercase + string.digits
    return ''.join(secrets.choice(alphabet) for _ in range(length))


# ── GET /referrals/my-link?profile_id={id} ───────────────────────────────────

@router.get("/my-link")
async def get_or_create_referral_link(profile_id: str = Query(...)):
    existing = await _get("referrals", {
        "referrer_profile_id": f"eq.{profile_id}",
        "select": "*",
        "limit": "1",
        "order": "created_at.asc",
    })
    if existing:
        return existing[0]

    # Fetch profile city
    profile_rows = await _get("sparring_profiles", {
        "id": f"eq.{profile_id}", "select": "city", "limit": "1",
    })
    city = (profile_rows[0].get("city") or "Barcelona") if profile_rows else "Barcelona"

    # Generate unique code
    for _ in range(10):
        code = _gen_code()
        taken = await _get("referrals", {"referral_code": f"eq.{code}", "select": "id", "limit": "1"})
        if not taken:
            break

    return await _post("referrals", {
        "referrer_profile_id": profile_id,
        "city":                city,
        "referral_code":       code,
        "clicked":             0,
        "converted":           0,
    })


# ── GET /r/{code} — track click + redirect ───────────────────────────────────

@redirect_router.get("/{code}")
async def track_referral_click(code: str):
    rows = await _get("referrals", {
        "referral_code": f"eq.{code.lower()}",
        "select":        "*",
        "limit":         "1",
    })
    if not rows:
        return RedirectResponse(url="https://tennisace.live/sparring/create", status_code=302)

    ref = rows[0]
    city = ref.get("city", "Barcelona")

    # Increment clicks via patch
    if _ready():
        async with httpx.AsyncClient() as c:
            await c.patch(
                f"{BASE}/referrals",
                headers={**_headers(), "Prefer": "return=minimal"},
                params={"referral_code": f"eq.{code.lower()}"},
                json={"clicked": ref.get("clicked", 0) + 1},
                timeout=10,
            )

    redirect_url = f"https://tennisace.live/sparring/create?ref={code}&city={city}"
    return RedirectResponse(url=redirect_url, status_code=302)


# ── POST /referrals/convert ───────────────────────────────────────────────────

@router.post("/convert")
async def convert_referral(body: dict):
    code               = (body.get("referral_code") or "").lower().strip()
    referred_id        = body.get("referred_profile_id")

    if not code:
        raise HTTPException(422, "referral_code is required")

    rows = await _get("referrals", {
        "referral_code": f"eq.{code}",
        "select":        "*",
        "limit":         "1",
    })
    if not rows:
        raise HTTPException(404, "Referral code not found")

    ref = rows[0]

    update: dict = {"converted": ref.get("converted", 0) + 1}
    if referred_id:
        update["referred_profile_id"] = referred_id

    async with httpx.AsyncClient() as c:
        await c.patch(
            f"{BASE}/referrals",
            headers={**_headers(), "Prefer": "return=minimal"},
            params={"referral_code": f"eq.{code}"},
            json=update,
            timeout=10,
        )

    return {"converted": True}
