"""
Background notifier — runs every 5 min, sends push when:
1. New live matches appear (Wimbledon, ATP, WTA)
2. Wimbledon day 1 opens (June 30)
"""
import asyncio, os, logging
from datetime import datetime, timezone, date
from app.services.tennis_api import get_live_matches
from app.routers.push import broadcast_push

log = logging.getLogger("notifier")

_seen_match_ids: set = set()
_wimbledon_notified = False

WIMBLEDON_START = date(2026, 6, 30)
GRAND_SLAMS = {"wimbledon", "us open", "roland garros", "australian open"}


def _is_grand_slam(tournament: str) -> bool:
    t = (tournament or "").lower()
    return any(gs in t for gs in GRAND_SLAMS)


async def check_and_notify():
    global _seen_match_ids, _wimbledon_notified

    try:
        matches = await get_live_matches()
        if not isinstance(matches, list):
            return

        today = date.today()
        new_ids = {m.get("match_id") for m in matches if m.get("match_id")}

        # Wimbledon Day 1 special notification
        if today >= WIMBLEDON_START and not _wimbledon_notified:
            wimbledon_matches = [m for m in matches if "wimbledon" in (m.get("tournament") or "").lower()]
            if wimbledon_matches:
                m = wimbledon_matches[0]
                await broadcast_push(
                    title="🌿 Wimbledon 2026 is LIVE!",
                    body=f"{m['player1']} vs {m['player2']} — Centre Court is open",
                    url="https://tennisace.live",
                )
                _wimbledon_notified = True
                log.info("Sent Wimbledon opening notification")

        # New match notifications (only Grand Slams to avoid spam)
        if _seen_match_ids:  # skip first run
            new_matches = [
                m for m in matches
                if m.get("match_id") not in _seen_match_ids
                and _is_grand_slam(m.get("tournament", ""))
            ]
            for m in new_matches[:3]:  # max 3 notifications at once
                await broadcast_push(
                    title=f"🎾 {m.get('tournament', 'Grand Slam')} — Match Started",
                    body=f"{m['player1']} vs {m['player2']}",
                    url="https://tennisace.live",
                )
                log.info(f"Notified: {m['player1']} vs {m['player2']}")

        _seen_match_ids = new_ids

    except Exception as e:
        log.error(f"Notifier error: {e}")


async def start_notifier():
    """Runs forever, checking every 5 minutes."""
    log.info("Notifier started — checking every 5 min")
    while True:
        await check_and_notify()
        await asyncio.sleep(300)  # 5 minutes
