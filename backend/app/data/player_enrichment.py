"""
Enriched player data for top ATP/WTA players.
Fields not available in API-Tennis free tier.
Key = player_key from API-Tennis.
"""

PLAYERS: dict = {
    # ATP Top Players
    2072: {  # Jannik Sinner
        "height_cm": 188, "weight_kg": 76, "hand": "Right",
        "backhand": "Two-handed", "coach": "Simone Vagnozzi",
        "turned_pro": 2018, "career_high": 1, "prize_money_usd": 23_000_000,
        "grand_slams": 3, "atp_titles": 24,
    },
    2382: {  # Carlos Alcaraz
        "height_cm": 185, "weight_kg": 80, "hand": "Right",
        "backhand": "Two-handed", "coach": "Juan Carlos Ferrero",
        "turned_pro": 2018, "career_high": 1, "prize_money_usd": 27_000_000,
        "grand_slams": 4, "atp_titles": 18,
    },
    1980: {  # Alexander Zverev
        "height_cm": 198, "weight_kg": 90, "hand": "Right",
        "backhand": "One-handed", "coach": "David Ferrer",
        "turned_pro": 2013, "career_high": 2, "prize_money_usd": 32_000_000,
        "grand_slams": 0, "atp_titles": 23,
    },
    1905: {  # Novak Djokovic
        "height_cm": 188, "weight_kg": 77, "hand": "Right",
        "backhand": "Two-handed", "coach": "Andy Murray",
        "turned_pro": 2003, "career_high": 1, "prize_money_usd": 180_000_000,
        "grand_slams": 24, "atp_titles": 99,
    },
    2073: {  # Felix Auger-Aliassime
        "height_cm": 193, "weight_kg": 85, "hand": "Right",
        "backhand": "Two-handed", "coach": "Frédéric Fontang",
        "turned_pro": 2017, "career_high": 6, "prize_money_usd": 14_000_000,
        "grand_slams": 0, "atp_titles": 9,
    },
    2973: {  # Ben Shelton
        "height_cm": 193, "weight_kg": 86, "hand": "Left",
        "backhand": "Two-handed", "coach": "Brian Shelton",
        "turned_pro": 2022, "career_high": 5, "prize_money_usd": 6_000_000,
        "grand_slams": 0, "atp_titles": 3,
    },
    1106: {  # Alex De Minaur
        "height_cm": 183, "weight_kg": 72, "hand": "Right",
        "backhand": "Two-handed", "coach": "Lleyton Hewitt",
        "turned_pro": 2015, "career_high": 6, "prize_money_usd": 15_000_000,
        "grand_slams": 0, "atp_titles": 12,
    },
    2832: {  # Taylor Fritz
        "height_cm": 196, "weight_kg": 89, "hand": "Right",
        "backhand": "Two-handed", "coach": "Michael Russell",
        "turned_pro": 2015, "career_high": 4, "prize_money_usd": 17_000_000,
        "grand_slams": 0, "atp_titles": 7,
    },
    # WTA Top Players
    1989: {  # Aryna Sabalenka
        "height_cm": 182, "weight_kg": 72, "hand": "Right",
        "backhand": "Two-handed", "coach": "Anton Dubrov",
        "turned_pro": 2015, "career_high": 1, "prize_money_usd": 28_000_000,
        "grand_slams": 4, "wta_titles": 22,
    },
    2172: {  # Elena Rybakina
        "height_cm": 184, "weight_kg": 74, "hand": "Right",
        "backhand": "Two-handed", "coach": "Stefano Vukov",
        "turned_pro": 2014, "career_high": 2, "prize_money_usd": 12_000_000,
        "grand_slams": 1, "wta_titles": 15,
    },
    1682: {  # Iga Swiatek
        "height_cm": 175, "weight_kg": 60, "hand": "Right",
        "backhand": "Two-handed", "coach": "Wim Fissette",
        "turned_pro": 2016, "career_high": 1, "prize_money_usd": 35_000_000,
        "grand_slams": 5, "wta_titles": 23,
    },
    2039: {  # Coco Gauff
        "height_cm": 180, "weight_kg": 70, "hand": "Right",
        "backhand": "Two-handed", "coach": "Pere Riba",
        "turned_pro": 2019, "career_high": 2, "prize_money_usd": 14_000_000,
        "grand_slams": 1, "wta_titles": 12,
    },
}


def get_player_enrichment(player_key: int) -> dict:
    """Returns enriched data for a player, empty dict if not found."""
    return PLAYERS.get(player_key, {})


# Surface mapping by tournament name keywords
SURFACE_MAP = {
    "wimbledon": "Grass",
    "queen": "Grass",
    "halle": "Grass",
    "s-hertogenbosch": "Grass",
    "eastbourne": "Grass",
    "roland garros": "Clay",
    "monte carlo": "Clay",
    "madrid": "Clay",
    "rome": "Clay",
    "barcelona": "Clay",
    "hamburg": "Clay",
    "lyon": "Clay",
    "florence": "Clay",
    "estoril": "Clay",
    "bucharest": "Clay",
    "bastad": "Clay",
    "gstaad": "Clay",
    "kitzbuhel": "Clay",
    "us open": "Hard",
    "australian open": "Hard",
    "indian wells": "Hard",
    "miami": "Hard",
    "canada": "Hard",
    "cincinnati": "Hard",
    "shanghai": "Hard",
    "paris": "Hard",
    "rotterdam": "Hard",
    "dubai": "Hard",
    "doha": "Hard",
    "abu dhabi": "Hard",
    "singapore": "Hard",
    "beijing": "Hard",
    "tokyo": "Hard",
    "vienna": "Hard",
    "nitto": "Hard",
    "piracicaba": "Clay",
    "santa fe": "Clay",
}


def get_surface(tournament_name: str, event_type: str = "") -> str:
    """Detect surface from tournament name."""
    lower = tournament_name.lower()
    for keyword, surface in SURFACE_MAP.items():
        if keyword in lower:
            return surface
    # Fallback by event type
    if "challenger" in event_type.lower():
        return "Hard"  # Most challengers are Hard
    return "Hard"  # Default
