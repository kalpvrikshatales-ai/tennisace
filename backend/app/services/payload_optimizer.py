"""Payload optimization utilities to reduce data transfer."""

def slim_match(match: dict) -> dict:
    """Return only essential fields for a match."""
    return {
        "match_id": match.get("match_id"),
        "player1": match.get("player1"),
        "player2": match.get("player2"),
        "player1_key": match.get("player1_key"),
        "player2_key": match.get("player2_key"),
        "score": match.get("score"),
        "status": match.get("status"),
        "tournament": match.get("tournament"),
        "round": match.get("round"),
        "serve": match.get("serve"),
        "date": match.get("date"),
        "time": match.get("time"),
    }

def full_match(match: dict) -> dict:
    """Return all available fields for a match."""
    return match
