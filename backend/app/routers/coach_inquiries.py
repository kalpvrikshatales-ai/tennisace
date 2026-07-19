from fastapi import APIRouter, HTTPException, Query
import httpx
import resend
import os
from app.services.db import _headers, _ready, SUPABASE_URL

resend.api_key = os.getenv("RESEND_API_KEY", "")
FROM_ADDR = "TennisAce <noreply@tennisace.live>"

router = APIRouter()
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


def _send(to: str | None, subject: str, html: str) -> None:
    try:
        if not resend.api_key or not to:
            return
        resend.Emails.send({"from": FROM_ADDR, "to": to, "subject": subject, "html": html})
    except Exception:
        pass


# ── POST /coach-inquiries ─────────────────────────────────────────────────────

@router.post("", status_code=201)
async def submit_inquiry(body: dict):
    coach_id = body.get("coach_profile_id")
    name     = (body.get("inquirer_name")  or "").strip()
    email    = (body.get("inquirer_email") or "").strip()

    if not coach_id or not name or not email:
        raise HTTPException(422, "coach_profile_id, inquirer_name and inquirer_email are required")

    # Fetch coach profile for email + name
    coach_rows = await _get("sparring_profiles", {
        "id": f"eq.{coach_id}", "select": "name,email", "limit": "1",
    })
    coach = coach_rows[0] if coach_rows else {}
    coach_email = coach.get("email")
    coach_name  = coach.get("name", "the coach")

    row = {
        "coach_profile_id": coach_id,
        "inquirer_name":    name,
        "inquirer_email":   email,
        "inquirer_phone":   (body.get("inquirer_phone") or "").strip() or None,
        "level":            body.get("level") or None,
        "goals":            (body.get("goals") or "").strip() or None,
        "availability":     body.get("availability") or None,
        "message":          (body.get("message") or "").strip() or None,
    }
    result = await _post("coach_inquiries", row)

    level_str = row["level"] or "Not specified"
    goals_str = row["goals"] or "Not specified"
    avail_str = row["availability"] or "Not specified"
    phone_str = row["inquirer_phone"] or "Not provided"
    msg_str   = row["message"] or ""

    _send(
        to=coach_email,
        subject=f"{name} wants coaching with you 🎾",
        html=f"""
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px;background:#f9f9f9;border-radius:8px">
          <h2 style="margin:0 0 6px;color:#000">New coaching inquiry 🎾</h2>
          <p style="color:#444;margin:0 0 24px">Someone wants to train with you on TennisAce.</p>

          <table style="width:100%;border-collapse:collapse;margin-bottom:24px">
            <tr><td style="padding:8px 0;color:#888;font-size:13px;width:120px">Name</td>
                <td style="padding:8px 0;color:#000;font-weight:700">{name}</td></tr>
            <tr><td style="padding:8px 0;color:#888;font-size:13px">Email</td>
                <td style="padding:8px 0;color:#000;font-weight:700"><a href="mailto:{email}" style="color:#39FF14">{email}</a></td></tr>
            <tr><td style="padding:8px 0;color:#888;font-size:13px">Phone</td>
                <td style="padding:8px 0;color:#000;font-weight:700">{phone_str}</td></tr>
            <tr><td style="padding:8px 0;color:#888;font-size:13px">Level</td>
                <td style="padding:8px 0;color:#000;font-weight:700">{level_str}</td></tr>
            <tr><td style="padding:8px 0;color:#888;font-size:13px">Goals</td>
                <td style="padding:8px 0;color:#000;font-weight:700">{goals_str}</td></tr>
            <tr><td style="padding:8px 0;color:#888;font-size:13px">Availability</td>
                <td style="padding:8px 0;color:#000;font-weight:700">{avail_str}</td></tr>
          </table>

          {f'<p style="color:#555;font-style:italic;margin:0 0 24px">"{msg_str}"</p>' if msg_str else ''}

          <a href="mailto:{email}"
             style="display:inline-block;background:#39FF14;color:#000;font-weight:800;
                    padding:12px 24px;border-radius:6px;text-decoration:none">
            Reply to {name} →
          </a>
          <p style="color:#999;font-size:12px;margin:24px 0 0">TennisAce · Coach Inquiries</p>
        </div>
        """,
    )

    return result


# ── GET /coach-inquiries?coach_profile_id={id} ───────────────────────────────

@router.get("")
async def get_coach_inquiries(coach_profile_id: str = Query(...)):
    rows = await _get("coach_inquiries", {
        "coach_profile_id": f"eq.{coach_profile_id}",
        "select":           "*",
        "order":            "created_at.desc",
        "limit":            "50",
    })
    return {"inquiries": rows}
