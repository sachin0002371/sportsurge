"""
TheSportsDB Service
Fetches team logos, player images, and team details from TheSportsDB.
Free tier: https://www.thesportsdb.com/api.php
No API key needed for basic searches.
"""
import httpx
import logging
from typing import Optional
from app.config import settings

logger = logging.getLogger(__name__)

THESPORTSDB_BASE = "https://www.thesportsdb.com/api/v1/json"


async def search_team(name: str) -> Optional[dict]:
    """
    Search for a team by name.
    Returns team data with logo, badge, and other details.
    Free endpoint: /searchteams.php?t={name}
    """
    api_key = settings.THESPORTSDB_API_KEY or "3"
    url = f"{THESPORTSDB_BASE}/{api_key}/searchteams.php"
    params = {"t": name}

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(url, params=params)
            response.raise_for_status()
            data = response.json()
            teams = data.get("teams")
            if teams and len(teams) > 0:
                return teams[0]
            return None
    except httpx.HTTPError as e:
        logger.error(f"TheSportsDB search error for '{name}': {e}")
        return None


async def get_team_logo(name: str) -> Optional[str]:
    """Get just the logo/badge URL for a team."""
    team = await search_team(name)
    if team:
        # TheSportsDB provides: strTeamBadge, strTeamLogo, strTeamJersey
        return team.get("strTeamBadge") or team.get("strTeamLogo")
    return None


async def get_team_details(name: str) -> Optional[dict]:
    """Get full team details from TheSportsDB."""
    team = await search_team(name)
    if not team:
        return None

    return {
        "name": team.get("strTeam"),
        "short_name": team.get("strTeamShort"),
        "abbreviation": team.get("strTeamShort", "")[:3].upper(),
        "badge": team.get("strTeamBadge"),  # Main logo (SVG/PNG)
        "logo": team.get("strTeamLogo"),
        "jersey": team.get("strTeamJersey"),
        "stadium": team.get("strStadium"),
        "stadium_thumb": team.get("strStadiumThumb"),
        "city": team.get("strStadiumLocation"),
        "color_primary": team.get("strColour1"),
        "color_secondary": team.get("strColour2"),
        "color_third": team.get("strColour3"),
        "league": team.get("strLeague"),
        "description": team.get("strDescriptionEN"),
        "formed_year": team.get("intFormedYear"),
        "website": team.get("strWebsite"),
        "facebook": team.get("strFacebook"),
        "twitter": team.get("strTwitter"),
        "instagram": team.get("strInstagram"),
    }


async def search_player(name: str) -> Optional[dict]:
    """
    Search for a player by name.
    Free endpoint: /searchplayers.php?p={name}
    """
    api_key = settings.THESPORTSDB_API_KEY or "3"
    url = f"{THESPORTSDB_BASE}/{api_key}/searchplayers.php"
    params = {"p": name}

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(url, params=params)
            response.raise_for_status()
            data = response.json()
            players = data.get("player")
            if players and len(players) > 0:
                return players[0]
            return None
    except httpx.HTTPError as e:
        logger.error(f"TheSportsDB player search error for '{name}': {e}")
        return None


async def get_player_image(name: str) -> Optional[str]:
    """Get player image/cutout URL."""
    player = await search_player(name)
    if player:
        return player.get("strCutout") or player.get("strThumb")
    return None


async def get_league_teams(league_name: str) -> list[dict]:
    """
    Get all teams in a league.
    Free endpoint: /lookup_all_teams.php?id={league_id}
    """
    api_key = settings.THESPORTSDB_API_KEY or "3"
    # Common league IDs
    LEAGUE_IDS = {
        "NBA": "4387",
        "NFL": "4391",
        "MLB": "4424",
        "NHL": "4380",
        "NCAAF": "4459",
        "NCAAB": "4422",
        "Formula 1": "4492",
        "Premier League": "4328",
        "La Liga": "4335",
        "Serie A": "4332",
        "Bundesliga": "4331",
        "IPL": "4426",
    }

    league_id = LEAGUE_IDS.get(league_name)
    if not league_id:
        return []

    url = f"{THESPORTSDB_BASE}/{api_key}/lookup_all_teams.php"
    params = {"id": league_id}

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.get(url, params=params)
            response.raise_for_status()
            data = response.json()
            teams = data.get("teams", [])
            return [
                {
                    "name": t.get("strTeam"),
                    "badge": t.get("strTeamBadge"),
                    "logo": t.get("strTeamLogo"),
                    "short_name": t.get("strTeamShort"),
                }
                for t in teams
            ]
    except httpx.HTTPError as e:
        logger.error(f"TheSportsDB league teams error: {e}")
        return []


async def batch_update_team_logos(teams: list[dict]) -> dict:
    """
    Fetch and update logos for multiple teams.
    Returns mapping of team name -> logo URL.
    """
    logo_map = {}
    for team in teams:
        name = team.get("name", "")
        if name:
            logo = await get_team_logo(name)
            if logo:
                logo_map[name] = logo
    return logo_map
