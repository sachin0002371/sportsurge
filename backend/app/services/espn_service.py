"""
ESPN Hidden API Service
Fetches live scores, schedules, standings, and news from ESPN's public API.
No API key required. Rate limit: be respectful (~1 req/sec).
"""
import httpx
import logging
from datetime import datetime, timezone
from typing import Optional

logger = logging.getLogger(__name__)

# ESPN sport/league mapping
ESPN_SPORT_MAPPING = {
    "nba": {"sport": "basketball", "league": "nba"},
    "nfl": {"sport": "football", "league": "nfl"},
    "mlb": {"sport": "baseball", "league": "mlb"},
    "nhl": {"sport": "hockey", "league": "nhl"},
    "ncaaf": {"sport": "football", "league": "college-football"},
    "ncaab": {"sport": "basketball", "league": "mens-college-basketball"},
    "cricket": {"sport": "cricket", "league": ["8039", "8048"]},
    "f1": {"sport": "racing", "league": "f1"},
    "mma": {"sport": "mma", "league": "ufc"},
}

ESPN_BASE_URL = "http://site.api.espn.com/apis/site/v2/sports"


def map_espn_status(state: str) -> str:
    """Map ESPN status state to our internal status."""
    mapping = {"in": "live", "pre": "upcoming", "post": "finished"}
    return mapping.get(state, "upcoming")


def get_team_logo(team_data: dict) -> Optional[str]:
    """Extract the best logo URL from ESPN team data."""
    logos = team_data.get("logos", [])
    if logos:
        # Sort by width descending to get highest quality
        sorted_logos = sorted(logos, key=lambda x: x.get("width", 0), reverse=True)
        return sorted_logos[0].get("href")
    return team_data.get("logo")


def get_logo_with_fallback(team_data: dict) -> str:
    """Get team logo with fallback to generated avatar."""
    logo = get_team_logo(team_data)
    if logo:
        if "espncdn" in logo and "/api/logo" not in logo:
            import urllib.parse
            return f"/api/logo?url={urllib.parse.quote(logo)}"
        return logo
    abbr = team_data.get("abbreviation", "TM")
    color = team_data.get("color", "666666").replace("#", "")
    avatar_url = f"https://ui-avatars.com/api/?name={abbr}&background={color}&color=fff&size=80&bold=true"
    import urllib.parse
    return f"/api/logo?url={urllib.parse.quote(avatar_url)}"


async def fetch_scoreboard(sport_slug: str) -> Optional[dict]:
    """
    Fetch scoreboard data from ESPN API for a given sport.
    Returns raw ESPN API response or None on error.
    """
    mapping = ESPN_SPORT_MAPPING.get(sport_slug)
    if not mapping:
        logger.warning(f"No ESPN mapping for sport: {sport_slug}")
        return None

    leagues = mapping['league'] if isinstance(mapping['league'], list) else [mapping['league']]
    combined_data = None
    all_events = []

    async with httpx.AsyncClient(timeout=15.0) as client:
        for l in leagues:
            url = f"{ESPN_BASE_URL}/{mapping['sport']}/{l}/scoreboard"
            try:
                response = await client.get(url, headers={
                    "User-Agent": "SportSurge/1.0",
                    "Accept": "application/json",
                })
                response.raise_for_status()
                data = response.json()
                if not combined_data:
                    combined_data = data
                if data and data.get("events"):
                    all_events.extend(data["events"])
            except httpx.HTTPError as e:
                logger.error(f"ESPN API error for {sport_slug} (league {l}): {e}")

    if combined_data:
        combined_data["events"] = all_events
        return combined_data

    return None


async def fetch_all_scoreboards() -> dict:
    """Fetch scoreboards for all supported sports."""
    results = {}
    for sport_slug in ESPN_SPORT_MAPPING:
        data = await fetch_scoreboard(sport_slug)
        if data and data.get("events"):
            results[sport_slug] = data
    return results


async def fetch_standings(sport_slug: str) -> Optional[dict]:
    """
    Fetch standings from ESPN API.
    ESPN provides standings at:
    http://site.api.espn.com/apis/site/v2/sports/{sport}/{league}/standings
    """
    mapping = ESPN_SPORT_MAPPING.get(sport_slug)
    if not mapping:
        return None

    leagues = mapping['league'] if isinstance(mapping['league'], list) else [mapping['league']]
    if sport_slug == "cricket" and "8048" in leagues:
        leagues = ["8048", "8039"]

    async with httpx.AsyncClient(timeout=15.0) as client:
        for l in leagues:
            url = f"https://site.api.espn.com/apis/v2/sports/{mapping['sport']}/{l}/standings"
            try:
                response = await client.get(url, headers={
                    "User-Agent": "SportSurge/1.0",
                    "Accept": "application/json",
                })
                response.raise_for_status()
                data = response.json()
                if data and data.get("children"):
                    return data
            except httpx.HTTPError as e:
                logger.error(f"ESPN standings error for {sport_slug} (league {l}): {e}")

    return None


async def fetch_news(sport_slug: str) -> Optional[dict]:
    """Fetch news articles from ESPN API."""
    mapping = ESPN_SPORT_MAPPING.get(sport_slug)
    if not mapping:
        return None

    leagues = mapping['league'] if isinstance(mapping['league'], list) else [mapping['league']]
    combined_data = None
    all_articles = []

    async with httpx.AsyncClient(timeout=15.0) as client:
        for l in leagues:
            url = f"{ESPN_BASE_URL}/{mapping['sport']}/{l}/news"
            try:
                response = await client.get(url, headers={
                    "User-Agent": "SportSurge/1.0",
                    "Accept": "application/json",
                })
                response.raise_for_status()
                data = response.json()
                if not combined_data:
                    combined_data = data
                if data and data.get("articles"):
                    all_articles.extend(data["articles"])
            except httpx.HTTPError as e:
                logger.error(f"ESPN news error for {sport_slug} (league {l}): {e}")

    if combined_data:
        combined_data["articles"] = all_articles
        return combined_data

    return None


async def fetch_match_detail(sport_slug: str, event_id: str) -> Optional[dict]:
    """
    Fetch detailed match data from ESPN API.
    http://site.api.espn.com/apis/site/v2/sports/{sport}/{league}/summary?event={event_id}
    """
    mapping = ESPN_SPORT_MAPPING.get(sport_slug)
    if not mapping:
        return None

    leagues = mapping['league'] if isinstance(mapping['league'], list) else [mapping['league']]

    async with httpx.AsyncClient(timeout=15.0) as client:
        for l in leagues:
            url = f"{ESPN_BASE_URL}/{mapping['sport']}/{l}/summary"
            params = {"event": event_id}
            try:
                response = await client.get(url, params=params, headers={
                    "User-Agent": "SportSurge/1.0",
                    "Accept": "application/json",
                })
                response.raise_for_status()
                return response.json()
            except httpx.HTTPError as e:
                logger.debug(f"ESPN match detail not found in league {l}: {e}")

    return None


def parse_score_to_int(score_val: any) -> Optional[int]:
    """Parse score string to integer, handling cricket score strings like '241/4'."""
    if not score_val:
        return None
    try:
        return int(score_val)
    except (ValueError, TypeError):
        s = str(score_val).strip()
        import re
        match = re.search(r'\d+', s)
        if match:
            return int(match.group(0))
        return None


def parse_espn_event(event: dict) -> dict:
    """Parse an ESPN event into our internal match format."""
    competition = event.get("competitions", [{}])[0]
    competitors = competition.get("competitors", [])

    home = next((c for c in competitors if c.get("homeAway") == "home"), None)
    away = next((c for c in competitors if c.get("homeAway") == "away"), None)

    if not home or not away:
        return {}

    home_team_data = home.get("team", {})
    away_team_data = away.get("team", {})

    match_date = datetime.fromisoformat(event["date"].replace("Z", "+00:00")) if event.get("date") else datetime.now(timezone.utc)
    date_str = match_date.strftime("%Y-%m-%d")

    home_slug = home_team_data.get("displayName", "home").lower().replace(" ", "-").replace(".", "")
    away_slug = away_team_data.get("displayName", "away").lower().replace(" ", "-").replace(".", "")
    match_slug = f"{home_slug}-vs-{away_slug}-{date_str}"

    broadcasts = []
    for b in competition.get("broadcasts", []):
        broadcasts.extend(b.get("names", []))

    notes = competition.get("notes", [])
    summary_text = notes[0].get("headline") if notes else ""
    if not summary_text and home.get("score") and not str(home.get("score")).isdigit():
        summary_text = f"{home_team_data.get('abbreviation', 'Home')}: {home.get('score')} | {away_team_data.get('abbreviation', 'Away')}: {away.get('score')}"

    status_state = event.get("status", {}).get("type", {}).get("state", "pre")
    status_detail = event.get("status", {}).get("type", {}).get("detail", "")
    status_desc = event.get("status", {}).get("type", {}).get("description", "")

    # ESPN API often keeps state='in' (live) for cricket matches even after they are fully completed.
    # Check status detail, description, and headline/summary for completion keywords.
    if status_state == "in":
        combined_status_text = f"{status_detail} {status_desc} {summary_text}".lower()
        if any(kw in combined_status_text for kw in ["won by", "won the match", "completed", "final", "full time", "match over", "abandoned", "no result", "tied"]):
            status_state = "post"

    return {
        "external_id": event.get("id"),
        "slug": match_slug,
        "home_team": {
            "external_id": home_team_data.get("id"),
            "name": home_team_data.get("displayName", ""),
            "abbreviation": home_team_data.get("abbreviation", ""),
            "slug": home_slug,
            "short_name": home_team_data.get("shortDisplayName", ""),
            "logo": get_logo_with_fallback(home_team_data),
            "color": f"#{home_team_data.get('color', '666666')}",
        },
        "away_team": {
            "external_id": away_team_data.get("id"),
            "name": away_team_data.get("displayName", ""),
            "abbreviation": away_team_data.get("abbreviation", ""),
            "slug": away_slug,
            "short_name": away_team_data.get("shortDisplayName", ""),
            "logo": get_logo_with_fallback(away_team_data),
            "color": f"#{away_team_data.get('color', '666666')}",
        },
        "home_score": parse_score_to_int(home.get("score")),
        "away_score": parse_score_to_int(away.get("score")),
        "status": map_espn_status(status_state),
        "match_date": match_date,
        "venue": competition.get("venue", {}).get("fullName"),
        "broadcast_info": {
            "channels": broadcasts,
            "streaming": ["ESPN+"],
            "period": event.get("status", {}).get("period", 0),
            "clock": event.get("status", {}).get("displayClock", ""),
            "home_score_str": str(home.get("score", "")) if home.get("score") is not None else "",
            "away_score_str": str(away.get("score", "")) if away.get("score") is not None else "",
            "headline": notes[0].get("headline") if notes else "",
            "status_detail": event.get("status", {}).get("type", {}).get("detail", ""),
        },
        "period": event.get("status", {}).get("period", 0),
        "clock": event.get("status", {}).get("displayClock", ""),
        "match_summary": summary_text,
    }
