"""
Data Service - Core business logic v3.0
Handles fetching ESPN data, processing it, and storing in the database.
Updated to support v3.0 SEO metadata fields on articles.
"""
import json
import logging
from datetime import datetime, timezone
from typing import Optional
from uuid import uuid4
from slugify import slugify

from sqlalchemy import select, update, and_, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.models import Sport, Team, Match, Standing, Article, Author, Vote
from app.services.espn_service import (
    fetch_scoreboard, fetch_standings, parse_espn_event, get_logo_with_fallback
)
from app.services.thesportsdb_service import get_team_logo as thesportsdb_logo
from app.services.youtube_service import search_and_cache
from app.services.ai_service import generate_article
from app.config import settings

logger = logging.getLogger(__name__)

# Default sports configuration
DEFAULT_SPORTS = [
    {"slug": "nba", "name": "NBA", "icon": "basketball", "color": "#C9082A", "sort_order": 1},
    {"slug": "nfl", "name": "NFL", "icon": "football", "color": "#013369", "sort_order": 2},
    {"slug": "mlb", "name": "MLB", "icon": "baseball", "color": "#041E42", "sort_order": 3},
    {"slug": "nhl", "name": "NHL", "icon": "hockey", "color": "#000000", "sort_order": 4},
    {"slug": "ncaaf", "name": "NCAAF", "icon": "football", "color": "#003B5C", "sort_order": 5},
    {"slug": "ncaab", "name": "NCAAB", "icon": "basketball", "color": "#C8102E", "sort_order": 6},
    {"slug": "f1", "name": "Formula 1", "icon": "racing", "color": "#E10600", "sort_order": 7},
    {"slug": "mma", "name": "MMA", "icon": "fight", "color": "#D20A0A", "sort_order": 8},
    {"slug": "boxing", "name": "Boxing", "icon": "boxing", "color": "#8B0000", "sort_order": 9},
    {"slug": "cricket", "name": "Cricket", "icon": "cricket", "color": "#004B23", "sort_order": 10},
]


async def ensure_sports(db: AsyncSession) -> dict[str, Sport]:
    """Ensure all sports exist in database, create if missing."""
    result = {}
    for sport_data in DEFAULT_SPORTS:
        stmt = select(Sport).where(Sport.slug == sport_data["slug"])
        existing = (await db.execute(stmt)).scalar_one_or_none()
        if existing:
            result[sport_data["slug"]] = existing
        else:
            sport = Sport(
                id=str(uuid4()),
                **sport_data,
                is_active=True,
            )
            db.add(sport)
            result[sport_data["slug"]] = sport
    await db.commit()
    return result


async def ensure_authors(db: AsyncSession) -> dict[str, Author]:
    """Ensure all author profiles exist in database."""
    from app.services.ai_service import AUTHOR_PROFILES

    result = {}
    for author_data in AUTHOR_PROFILES:
        stmt = select(Author).where(Author.slug == author_data["slug"])
        existing = (await db.execute(stmt)).scalar_one_or_none()
        if existing:
            result[author_data["slug"]] = existing
        else:
            author = Author(
                id=str(uuid4()),
                name=author_data["name"],
                slug=author_data["slug"],
                avatar=author_data["avatar"],
                title=author_data["title"],
                bio=author_data["bio"],
                specialty=author_data["specialty"],
                social_twitter=author_data["social_twitter"],
            )
            db.add(author)
            result[author_data["slug"]] = author
    await db.commit()
    return result


INITIAL_ARTICLES = [
    {
        "title": "2026 NBA Championship Race: Tactical Evolution and Key Contenders",
        "sport_slug": "nba",
        "category": "analysis",
        "author_slug": "marcus-johnson",
        "featured_image": "https://images.pexels.com/photos/1752757/pexels-photo-1752757.jpeg?auto=compress&cs=tinysrgb&w=1200",
        "content": """The 2026 NBA season is witnessing an unprecedented evolution in tactical execution. Teams are prioritizing positionless basketball, spacing, and transition efficiency over traditional isolation sets.

As playoff contenders jockey for position in the Eastern and Western conferences, defensive versatility has emerged as the ultimate differentiator. Coaches are deploying switch-heavy schemes designed to neutralize elite pick-and-roll ballhandlers.

Key championship contenders have bolstered their perimeter shooting, creating wider driving lanes for primary playmakers. As the postseason approaches, health, bench depth, and half-court execution in clutch minutes will decide who hoists the Larry O'Brien Trophy.""",
    },
    {
        "title": "NFL Defense Breakdown: How Modern Schemes Are Countering High-Powered Offenses",
        "sport_slug": "nfl",
        "category": "analysis",
        "author_slug": "sarah-mitchell",
        "featured_image": "https://images.pexels.com/photos/1618269/pexels-photo-1618269.jpeg?auto=compress&cs=tinysrgb&w=1200",
        "content": """NFL defensive coordinators have innovated rapidly to counter explosive spread offenses. The widespread adoption of split-safety coverages and disguised two-high shells has forced quarterbacks into patient, underneath checkdowns.

Pass-rush rotations are now deeper than ever, allowing front sevens to maintain unrelenting pressure in the fourth quarter. Edge rushers with inside-outside versatility are disrupting pocket integrity before deep routes can develop.

With explosive play rates dropping across the league, offensive play-callers must embrace efficient run schemes and intermediate crossing routes to sustain scoring drives.""",
    },
    {
        "title": "MLB Postseason Pitching Mastery: The Impact of High-Leverage Bullpens",
        "sport_slug": "mlb",
        "category": "analysis",
        "author_slug": "david-chen",
        "featured_image": "https://images.pexels.com/photos/209977/pexels-photo-209977.jpeg?auto=compress&cs=tinysrgb&w=1200",
        "content": """Modern Major League Baseball postseason success is defined by bullpen usage. Starters are rarely asked to navigate a lineup three times, placing immense responsibility on high-leverage relief corps.

Relievers throwing triple-digit four-seamers and devastating sweepers dominate late innings. Managers are deploying their best arms in crucial mid-game moments rather than strictly preserving them for traditional ninth-inning saves.

Offenses that generate traffic via walks and timely power have the best odds of breaking through elite pitching rotations under October pressure.""",
    },
    {
        "title": "NHL Stanley Cup Outlook: Speed, Transition and Goaltending Dominance",
        "sport_slug": "nhl",
        "category": "preview",
        "author_slug": "david-chen",
        "featured_image": "https://images.pexels.com/photos/3621104/pexels-photo-3621104.jpeg?auto=compress&cs=tinysrgb&w=1200",
        "content": """The NHL pace of play is faster than at any point in modern hockey history. Defensemen who can skate out of trouble and trigger transition offenses are in high demand across the league.

Special teams efficiency remains the ultimate predictor of playoff advancement. Power-play units utilizing bumper plays and one-timer setups are punishing undisciplined opponents, while penalty-kill aggression creates shorthanded breakaways.

Elite goaltending remains the great equalizer. Netminders with top-tier high-danger save percentages can single-handedly carry underdog teams deep into the Stanley Cup playoffs.""",
    },
    {
        "title": "ICC T20 World Cup Strategy: Death Overs Hitting and Mystery Spin",
        "sport_slug": "cricket",
        "category": "analysis",
        "author_slug": "priya-sharma",
        "featured_image": "https://images.pexels.com/photos/3628912/pexels-photo-3628912.jpeg?auto=compress&cs=tinysrgb&w=1200",
        "content": """International T20 cricket is reaching new statistical peaks with aggressive powerplay scoring and calculated death overs acceleration. Teams that maintain a 10+ run rate across the middle overs are consistently setting winning totals.

Mystery spinners and wrist-spinners who turn the ball both ways without discernible change of action are proving vital in choking run flow. Field placements utilizing deep boundary riders on the leg side force batters into risky aerial strokes.

All-rounders who contribute four economical overs and provide explosive lower-order finishing remain the most coveted assets in world cricket today.""",
    },
    {
        "title": "Formula 1 Aerodynamic Battle: Key Upgrades Reshaping the Podium",
        "sport_slug": "f1",
        "category": "news",
        "author_slug": "emily-rodriguez",
        "featured_image": "https://images.pexels.com/photos/12795/pexels-photo-12795.jpeg?auto=compress&cs=tinysrgb&w=1200",
        "content": """The 2026 Formula 1 championship battle is intensifying as top constructors bring comprehensive aerodynamic upgrade packages. Floor modifications and revised sidepod inlets have tightened qualifying margins to under a tenth of a second.

Tire degradation management across stints is defining race day strategy. Drivers who can preserve the soft and medium compounds while maintaining competitive lap times are capturing crucial undercut advantages during pit stops.

With high-speed circuits on the horizon, top-speed efficiency and DRS effectiveness will decide who commands the championship lead.""",
    },
    {
        "title": "UFC Championship Clashes: Wrestling Control vs Striking Precision",
        "sport_slug": "mma",
        "category": "preview",
        "author_slug": "james-obrien",
        "featured_image": "https://images.pexels.com/photos/4761792/pexels-photo-4761792.jpeg?auto=compress&cs=tinysrgb&w=1200",
        "content": """Mixed Martial Arts title fights in 2026 continue to pit elite grappling styles against precision counter-strikers. Chain-wrestling and cage pressure remain the most dominant pathway to controlling championship rounds.

However, elite strikers with disciplined takedown defense and brutal calf kicks are finding success neutralizing wrestlers before they close distance. Championship endurance over five rounds separates contenders from champions.

Fans can expect high-stakes technical battles as the undisputed belts change hands in upcoming pay-per-view spectacles.""",
    },
    {
        "title": "College Football Playoff Race: Powerhouse Programs Collide in Crucial Week",
        "sport_slug": "ncaaf",
        "category": "preview",
        "author_slug": "sarah-mitchell",
        "featured_image": "https://images.pexels.com/photos/1618269/pexels-photo-1618269.jpeg?auto=compress&cs=tinysrgb&w=1200",
        "content": """The expanded College Football Playoff format has amplified the drama of every single regular-season Saturday. Margin of victory, strength of schedule, and signature ranked wins are dictating committee evaluations.

Elite quarterback play and red-zone touchdown efficiency remain the gold standards for title hopefuls. Defenses capable of forcing multi-turnover games against top-tier conference rivals hold the inside track to playoff bye seeds.

With multiple top-ten showdowns scheduled this month, college football fans are set for one of the most unpredictable title races in collegiate athletics history.""",
    }
]


async def ensure_initial_articles(db: AsyncSession) -> int:
    """Ensure all 95+ rich articles exist across all sports."""
    import os
    sports = await ensure_sports(db)
    authors = await ensure_authors(db)

    articles_to_seed = []
    json_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "articles_data.json")
    if os.path.exists(json_path):
        try:
            with open(json_path, "r", encoding="utf-8") as f:
                articles_to_seed = json.load(f)
        except Exception as e:
            logger.warning(f"Failed to read articles_data.json: {e}")

    if not articles_to_seed:
        articles_to_seed = INITIAL_ARTICLES

    seeded = 0
    from datetime import timedelta
    now = datetime.utcnow()

    for idx, item in enumerate(articles_to_seed):
        slug = item.get("slug") or slugify(item["title"])
        stmt = select(Article).where(Article.slug == slug)
        existing = (await db.execute(stmt)).scalar_one_or_none()
        if existing:
            continue

        sport = sports.get(item.get("sport_slug", "nba"))
        author = authors.get(item.get("author_slug", "marcus-johnson")) or (list(authors.values())[0] if authors else None)

        if not sport or not author:
            continue

        pub_time = now - timedelta(hours=idx * 4)
        excerpt = item.get("excerpt") or (item["content"][:160] + "...")
        article = Article(
            id=str(uuid4()),
            sport_id=sport.id,
            author_id=author.id,
            title=item["title"],
            slug=slug,
            excerpt=excerpt,
            content=item["content"],
            featured_image=item.get("featured_image") or f"https://picsum.photos/seed/{slug}/1200/630",
            category=item.get("category", "analysis"),
            tags=item.get("tags") or item.get("sport_slug", "sports"),
            is_published=True,
            published_at=pub_time,
            created_at=pub_time,
            updated_at=pub_time,
            meta_title=item.get("meta_title") or f"{item['title']} | SportSurge",
            meta_description=item.get("meta_description") or excerpt[:155],
            meta_tags=item.get("meta_tags") or f"{item.get('sport_slug', 'sports')}, sports, analysis, sportsurge",
        )
        db.add(article)
        seeded += 1

    if seeded > 0:
        await db.commit()
        logger.info(f"Seeded {seeded} articles into database")

    return seeded


async def fetch_and_store_matches(db: AsyncSession, sport_slug: str) -> dict:
    """
    Fetch matches from ESPN API and store/update in database.
    Returns stats about what was processed.
    """
    from app.services.espn_service import ESPN_SPORT_MAPPING

    if sport_slug not in ESPN_SPORT_MAPPING:
        return {"sport": sport_slug, "error": "Sport not supported by ESPN API", "matches": 0}

    # Ensure sports exist
    sports = await ensure_sports(db)
    sport = sports.get(sport_slug)
    if not sport:
        return {"sport": sport_slug, "error": "Sport not found in database", "matches": 0}

    # Fetch from ESPN
    data = await fetch_scoreboard(sport_slug)
    if not data or not data.get("events"):
        return {"sport": sport_slug, "matches": 0, "message": "No events found"}

    match_count = 0
    errors = 0

    for event in data["events"]:
        try:
            parsed = parse_espn_event(event)
            if not parsed:
                continue

            # Upsert home team
            home_team = await _upsert_team(db, sport.id, parsed["home_team"])
            away_team = await _upsert_team(db, sport.id, parsed["away_team"])

            # Upsert match
            stmt = select(Match).where(
                and_(Match.sport_id == sport.id, or_(Match.external_id == parsed["external_id"], Match.slug == parsed["slug"]))
            )
            existing_match = (await db.execute(stmt)).scalar_one_or_none()

            match_data = {
                "external_id": parsed["external_id"],
                "home_team_id": home_team.id,
                "away_team_id": away_team.id,
                "home_score": parsed["home_score"],
                "away_score": parsed["away_score"],
                "status": parsed["status"],
                "match_date": parsed["match_date"],
                "venue": parsed["venue"],
                "broadcast_info": json.dumps(parsed["broadcast_info"]),
                "match_summary": parsed.get("match_summary", ""),
                "updated_at": datetime.utcnow(),
            }

            if existing_match:
                # Don't overwrite scores if match is finished
                if existing_match.status == "finished" and parsed["status"] == "finished":
                    # Only update scores if changed, but always update broadcast_info and match_summary
                    if existing_match.home_score != parsed["home_score"]:
                        existing_match.home_score = parsed["home_score"]
                        existing_match.away_score = parsed["away_score"]
                    existing_match.broadcast_info = match_data["broadcast_info"]
                    if match_data["match_summary"]:
                        existing_match.match_summary = match_data["match_summary"]
                    existing_match.updated_at = match_data["updated_at"]
                else:
                    for key, value in match_data.items():
                        setattr(existing_match, key, value)
            else:
                new_match = Match(
                    id=str(uuid4()),
                    sport_id=sport.id,
                    slug=parsed["slug"],
                    **match_data,
                )
                db.add(new_match)

            match_count += 1

        except Exception as e:
            logger.error(f"Error processing event: {e}")
            errors += 1
            continue

    # Auto-cleanup stale matches for this sport:
    # 1. Matches marked 'live' that are not in current ESPN live response and started > 4 hours ago -> finished
    # 2. Matches marked 'upcoming' whose match_date is in the past (> 12 hours ago) -> finished
    try:
        from datetime import timedelta, timezone
        now_utc = datetime.now(timezone.utc)
        four_hours_ago = now_utc - timedelta(hours=4)
        twelve_hours_ago = now_utc - timedelta(hours=12)
        
        current_event_ids = [str(e.get("id")) for e in data.get("events", []) if e.get("id")]
        
        # Cleanup past live matches
        if current_event_ids:
            await db.execute(
                update(Match)
                .where(
                    and_(
                        Match.sport_id == sport.id,
                        Match.status == "live",
                        Match.external_id.notin_(current_event_ids),
                        Match.match_date < four_hours_ago,
                    )
                )
                .values(status="finished", updated_at=datetime.utcnow())
            )
        else:
            await db.execute(
                update(Match)
                .where(
                    and_(
                        Match.sport_id == sport.id,
                        Match.status == "live",
                        Match.match_date < four_hours_ago,
                    )
                )
                .values(status="finished", updated_at=datetime.utcnow())
            )

        # Cleanup past upcoming matches
        await db.execute(
            update(Match)
            .where(
                and_(
                    Match.sport_id == sport.id,
                    Match.status == "upcoming",
                    Match.match_date < twelve_hours_ago,
                )
            )
            .values(status="finished", updated_at=datetime.utcnow())
        )
    except Exception as cleanup_err:
        logger.warning(f"Error during stale match cleanup for {sport_slug}: {cleanup_err}")

    await db.commit()
    invalidate_api_cache()

    return {
        "sport": sport_slug,
        "matches": match_count,
        "errors": errors,
    }


async def _upsert_team(db: AsyncSession, sport_id: str, team_data: dict) -> Team:
    """Create or update a team in the database."""
    slug = slugify(team_data["name"])

    stmt = select(Team).where(and_(Team.sport_id == sport_id, Team.slug == slug))
    existing = (await db.execute(stmt)).scalar_one_or_none()

    if existing:
        # Update logo if we have a real ESPN logo or existing is placeholder
        if team_data.get("logo"):
            if "espncdn" in team_data["logo"] or "flagcdn" in team_data["logo"] or not existing.logo or "ui-avatars" in existing.logo:
                logo_url = team_data["logo"]
                if ("espncdn" in logo_url or "ui-avatars" in logo_url) and "flagcdn" not in logo_url and "/api/logo" not in logo_url:
                    import urllib.parse
                    logo_url = f"/api/logo?url={urllib.parse.quote(logo_url)}&slug={slug}"
                elif "/api/logo" in logo_url and "&slug=" not in logo_url:
                    logo_url = f"{logo_url}&slug={slug}"
                existing.logo = logo_url
        existing.color = team_data.get("color", existing.color)
        existing.abbreviation = team_data.get("abbreviation", existing.abbreviation)
        return existing

    logo_url = team_data.get("logo")
    if logo_url:
        if ("espncdn" in logo_url or "ui-avatars" in logo_url) and "flagcdn" not in logo_url and "/api/logo" not in logo_url:
            import urllib.parse
            logo_url = f"/api/logo?url={urllib.parse.quote(logo_url)}&slug={slug}"
        elif "/api/logo" in logo_url and "&slug=" not in logo_url:
            logo_url = f"{logo_url}&slug={slug}"

    team = Team(
        id=str(uuid4()),
        sport_id=sport_id,
        external_id=team_data.get("external_id"),
        name=team_data["name"],
        abbreviation=team_data.get("abbreviation", ""),
        slug=slug,
        city=team_data.get("short_name"),
        logo=logo_url,
        color=team_data.get("color"),
    )
    db.add(team)
    await db.flush()
    return team


async def fetch_and_store_standings(db: AsyncSession, sport_slug: str) -> dict:
    """Fetch standings from ESPN and store in database."""
    data = await fetch_standings(sport_slug)
    if not data:
        return {"sport": sport_slug, "error": "Failed to fetch standings"}

    sports = await ensure_sports(db)
    sport = sports.get(sport_slug)
    if not sport:
        return {"sport": sport_slug, "error": "Sport not found"}

    entries = data.get("children", [])
    count = 0

    for entry in entries:
        for team_entry in entry.get("standings", {}).get("entries", []):
            team_data = team_entry.get("team", {})
            stats = {s["name"]: s.get("value", 0.0) for s in team_entry.get("stats", []) if "name" in s}

            team_name = team_data.get("displayName", "")
            team_slug = slugify(team_name)

            # Find or create team
            stmt = select(Team).where(and_(Team.sport_id == sport.id, Team.slug == team_slug))
            team = (await db.execute(stmt)).scalar_one_or_none()

            if not team:
                team = Team(
                    id=str(uuid4()),
                    sport_id=sport.id,
                    name=team_name,
                    abbreviation=team_data.get("abbreviation", ""),
                    slug=team_slug,
                    color=f"#{team_data.get('color', '666666')}",
                )
                db.add(team)
                await db.flush()

            # Upsert standing
            stmt2 = select(Standing).where(
                and_(Standing.sport_id == sport.id, Standing.team_id == team.id)
            )
            standing = (await db.execute(stmt2)).scalar_one_or_none()

            wins = int(stats.get("wins", 0))
            losses = int(stats.get("losses", 0))
            draws = int(stats.get("ties", 0))
            pct = float(stats.get("winPercent", 0))

            raw_streak = stats.get("streak")
            if raw_streak is not None:
                if isinstance(raw_streak, float) and raw_streak.is_integer():
                    streak_val = str(int(raw_streak))
                else:
                    streak_val = str(raw_streak)
            else:
                streak_val = ""

            if standing:
                standing.wins = wins
                standing.losses = losses
                standing.draws = draws
                standing.percentage = pct
                standing.streak = streak_val
            else:
                standing = Standing(
                    id=str(uuid4()),
                    sport_id=sport.id,
                    team_id=team.id,
                    wins=wins,
                    losses=losses,
                    draws=draws,
                    percentage=pct,
                    streak=streak_val,
                    position=count + 1,
                )
                db.add(standing)

            count += 1

    await db.commit()
    return {"sport": sport_slug, "standings": count}


async def fetch_all_sports_data(db: AsyncSession) -> dict:
    """Fetch data for all ESPN-supported sports."""
    from app.services.espn_service import ESPN_SPORT_MAPPING

    results = {}
    for sport_slug in ESPN_SPORT_MAPPING:
        match_result = await fetch_and_store_matches(db, sport_slug)
        results[sport_slug] = match_result

        # Also try to fetch standings
        try:
            standings_result = await fetch_and_store_standings(db, sport_slug)
            results[sport_slug]["standings"] = standings_result.get("standings", 0)
        except Exception as e:
            logger.error(f"Standings error for {sport_slug}: {e}")
            results[sport_slug]["standings_error"] = str(e)

    return results


async def fetch_team_logos_from_thesportsdb(db: AsyncSession, sport_slug: str) -> int:
    """Update team logos from TheSportsDB for better quality images."""
    sports = await ensure_sports(db)
    sport = sports.get(sport_slug)
    if not sport:
        return 0

    stmt = select(Team).where(Team.sport_id == sport.id)
    teams = (await db.execute(stmt)).scalars().all()

    updated = 0
    for team in teams:
        logo_url = await thesportsdb_logo(team.name)
        if logo_url:
            team.logo = logo_url
            updated += 1

    await db.commit()
    return updated


async def update_youtube_videos(db: AsyncSession, match_id: str) -> Optional[str]:
    """Search and cache YouTube video IDs for a match."""
    stmt = select(Match).where(Match.id == match_id).options(
        selectinload(Match.home_team), selectinload(Match.away_team), selectinload(Match.sport)
    )
    match = (await db.execute(stmt)).scalar_one_or_none()
    if not match:
        return None

    video_ids = await search_and_cache(
        match.home_team.name,
        match.away_team.name,
        match.sport.name,
    )
    match.youtube_video_ids = video_ids
    await db.commit()
    return video_ids


async def generate_match_seo_content(
    home_team: dict,
    away_team: dict,
    sport: dict,
    venue: str,
    match_date: datetime,
    status: str,
    home_score: int,
    away_score: int,
) -> str:
    """Generate 200-250 word SEO content for a match page."""
    date_str = match_date.strftime("%B %d, %Y")
    home_city = home_team.get("city") or home_team.get("name", "").split()[0]
    away_city = away_team.get("city") or away_team.get("name", "").split()[0]

    seo = f"The {sport.get('name', '')} matchup between the {home_team.get('name', '')} and the {away_team.get('name', '')} is one that fans circle on their calendars every season. "
    seo += f"This game, played{' at ' + venue if venue else ' in ' + home_city} on {date_str}, brings together two franchises with rich histories and passionate fanbases. "
    seo += f"The rivalry between these {home_city} and {away_city} teams has produced some of the most memorable moments in {sport.get('name', '')} history, with each encounter adding a new chapter to an already storied competition. "

    if status == "finished" and home_score is not None and away_score is not None:
        winner = home_team.get("name", "") if home_score > away_score else away_team.get("name", "")
        loser = away_team.get("name", "") if home_score > away_score else home_team.get("name", "")
        seo += f"In this contest, the {winner} emerged victorious with a final score of {max(home_score, away_score)}-{min(home_score, away_score)} over the {loser}. "
        seo += f"The result has significant implications for the standings and playoff positioning. Both teams showed the kind of intensity that defines this rivalry. "
    elif status == "live":
        seo += f"This game is currently in progress and the action has been thrilling. Both teams are leaving everything on the field in a contest that could go either way. Follow along for live score updates and key moments. "
    else:
        seo += f"As these two teams prepare to face off, anticipation is building among fans and analysts alike. Both squads have been performing well this season, and this matchup could have major implications for the playoff picture. "

    seo += f"SportSurge provides comprehensive coverage of every {sport.get('name', '')} game, including live scores, post-game analysis, highlight reels, and legal streaming options for fans worldwide."

    return seo


# ==================== Query Helpers ====================

# In-memory fast TTL Cache for zero-latency responses
import time
_API_CACHE = {}

def _get_cache(key: str, ttl: int = 30):
    entry = _API_CACHE.get(key)
    if entry and (time.time() - entry["time"]) < ttl:
        return entry["data"]
    return None

def _set_cache(key: str, data, max_entries: int = 300):
    if len(_API_CACHE) > max_entries:
        _API_CACHE.clear()
    _API_CACHE[key] = {"data": data, "time": time.time()}

def invalidate_api_cache():
    _API_CACHE.clear()


async def get_matches(
    db: AsyncSession,
    sport_slug: str = None,
    status: str = None,
    limit: int = 50,
    page: int = 1,
) -> dict:
    """Get matches with filtering and pagination (in-memory cached)."""
    cache_key = f"matches::{sport_slug}::{status}::{limit}::{page}"
    cached = _get_cache(cache_key, ttl=15)
    if cached:
        return cached

    stmt = select(Match).options(
        selectinload(Match.home_team),
        selectinload(Match.away_team),
        selectinload(Match.sport),
    )

    if sport_slug:
        sport_stmt = select(Sport).where(Sport.slug == sport_slug)
        sport = (await db.execute(sport_stmt)).scalar_one_or_none()
        if sport:
            stmt = stmt.where(Match.sport_id == sport.id)

    if status:
        stmt = stmt.where(Match.status == status)

    stmt = stmt.order_by(Match.match_date.asc()).offset((page - 1) * limit).limit(limit)
    matches = (await db.execute(stmt)).scalars().all()

    result = {
        "matches": [_match_to_dict(m) for m in matches],
        "total": len(matches),
        "page": page,
        "limit": limit,
        "total_pages": 1,
    }
    _set_cache(cache_key, result)
    return result


async def get_match_by_slug(db: AsyncSession, slug: str) -> Optional[dict]:
    """Get a single match by slug (in-memory cached)."""
    cache_key = f"match::{slug}"
    cached = _get_cache(cache_key, ttl=15)
    if cached:
        return cached

    stmt = select(Match).where(Match.slug == slug).options(
        selectinload(Match.home_team),
        selectinload(Match.away_team),
        selectinload(Match.sport),
    )
    match = (await db.execute(stmt)).scalar_one_or_none()
    if not match:
        return None
    res = _match_to_dict(match)
    _set_cache(cache_key, res)
    return res


async def get_articles(
    db: AsyncSession,
    sport_slug: str = None,
    limit: int = 12,
    page: int = 1,
) -> dict:
    """Get published articles (in-memory cached)."""
    cache_key = f"articles::{sport_slug}::{limit}::{page}"
    cached = _get_cache(cache_key, ttl=60)
    if cached:
        return cached

    stmt = select(Article).where(Article.is_published == True).options(
        selectinload(Article.author),
        selectinload(Article.sport),
    )

    if sport_slug:
        sport = (await db.execute(select(Sport).where(Sport.slug == sport_slug))).scalar_one_or_none()
        if sport:
            stmt = stmt.where(Article.sport_id == sport.id)

    stmt = stmt.order_by(Article.published_at.desc()).offset((page - 1) * limit).limit(limit)
    articles = (await db.execute(stmt)).scalars().all()

    result = {
        "articles": [_article_to_dict(a) for a in articles],
    }
    _set_cache(cache_key, result)
    return result


async def get_article_by_slug(db: AsyncSession, slug: str) -> Optional[dict]:
    """Get a single article by slug (in-memory cached)."""
    cache_key = f"article::{slug}"
    cached = _get_cache(cache_key, ttl=60)
    if cached:
        return cached

    stmt = select(Article).where(Article.slug == slug).options(
        selectinload(Article.author),
        selectinload(Article.sport),
    )
    article = (await db.execute(stmt)).scalar_one_or_none()
    if not article:
        return None
    res = _article_to_dict(article)
    _set_cache(cache_key, res)
    return res


async def get_standings(db: AsyncSession, sport_slug: str) -> list[dict]:
    """Get standings for a sport (in-memory cached)."""
    cache_key = f"standings::{sport_slug}"
    cached = _get_cache(cache_key, ttl=120)
    if cached:
        return cached

    sport = (await db.execute(select(Sport).where(Sport.slug == sport_slug))).scalar_one_or_none()
    if not sport:
        return []

    stmt = select(Standing).where(Standing.sport_id == sport.id).options(
        selectinload(Standing.team),
    ).order_by(Standing.position.asc()).limit(35)

    standings = (await db.execute(stmt)).scalars().all()
    res = [_standing_to_dict(s) for s in standings]
    _set_cache(cache_key, res)
    return res


async def record_vote(db: AsyncSession, match_id: str, team_id: str, ip_address: str) -> dict:
    """Record a vote for a match. One vote per IP per match."""
    match = (await db.execute(select(Match).where(Match.id == match_id))).scalar_one_or_none()
    if not match:
        return {"error": "Match not found"}

    # Check existing vote
    existing = (await db.execute(
        select(Vote).where(and_(Vote.match_id == match_id, Vote.ip_address == ip_address))
    )).scalar_one_or_none()

    if existing:
        total = match.home_votes + match.away_votes
        return {
            "message": "Already voted",
            "home_votes": match.home_votes,
            "away_votes": match.away_votes,
            "home_percentage": round((match.home_votes / total) * 100) if total > 0 else 50,
            "away_percentage": round((match.away_votes / total) * 100) if total > 0 else 50,
            "already_voted": True,
        }

    # Record vote
    vote = Vote(id=str(uuid4()), match_id=match_id, team_id=team_id, ip_address=ip_address)
    db.add(vote)

    is_home = team_id == match.home_team_id
    if is_home:
        match.home_votes += 1
    else:
        match.away_votes += 1

    await db.commit()

    total = match.home_votes + match.away_votes
    return {
        "success": True,
        "home_votes": match.home_votes,
        "away_votes": match.away_votes,
        "home_percentage": round((match.home_votes / total) * 100) if total > 0 else 50,
        "away_percentage": round((match.away_votes / total) * 100) if total > 0 else 50,
        "already_voted": False,
    }


# ==================== Serialization Helpers ====================

def _match_to_dict(match: Match) -> dict:
    """Convert a Match ORM object to a dict for API response."""
    broadcast_info = None
    if match.broadcast_info:
        try:
            broadcast_info = json.loads(match.broadcast_info)
        except:
            broadcast_info = match.broadcast_info

    youtube_videos = []
    if match.youtube_video_ids:
        for vid in match.youtube_video_ids.split(","):
            if vid.strip():
                youtube_videos.append({
                    "video_id": vid.strip(),
                    "embed_url": f"https://www.youtube.com/embed/{vid.strip()}",
                    "watch_url": f"https://www.youtube.com/watch?v={vid.strip()}",
                })

    return {
        "id": match.id,
        "slug": match.slug,
        "sportId": match.sport_id,
        "sport_id": match.sport_id,
        "homeTeamId": match.home_team_id,
        "home_team_id": match.home_team_id,
        "awayTeamId": match.away_team_id,
        "away_team_id": match.away_team_id,
        "status": match.status,
        "homeScore": match.home_score,
        "awayScore": match.away_score,
        "matchDate": match.match_date.isoformat() if match.match_date else None,
        "venue": match.venue,
        "broadcastInfo": broadcast_info,
        "matchSummary": match.match_summary,
        "homeVotes": match.home_votes,
        "awayVotes": match.away_votes,
        "seoContent": match.seo_content,
        "youtubeVideos": youtube_videos,
        "homeTeam": _team_to_dict(match.home_team) if match.home_team else None,
        "awayTeam": _team_to_dict(match.away_team) if match.away_team else None,
        "sport": _sport_to_dict(match.sport) if match.sport else None,
    }


def _team_to_dict(team: Team) -> dict:
    return {
        "id": team.id,
        "sportId": team.sport_id,
        "sport_id": team.sport_id,
        "name": team.name,
        "abbreviation": team.abbreviation,
        "slug": team.slug,
        "city": team.city,
        "logo": team.logo,
        "color": team.color,
    }


def _sport_to_dict(sport: Sport) -> dict:
    return {
        "id": sport.id,
        "slug": sport.slug,
        "name": sport.name,
        "icon": sport.icon,
        "color": sport.color,
    }


def _article_to_dict(article: Article) -> dict:
    return {
        "id": article.id,
        "sportId": article.sport_id,
        "sport_id": article.sport_id,
        "authorId": article.author_id,
        "author_id": article.author_id,
        "title": article.title,
        "slug": article.slug,
        "excerpt": article.excerpt,
        "content": article.content,
        "featuredImage": article.featured_image,
        "category": article.category,
        "tags": article.tags,
        "isPublished": article.is_published,
        "publishedAt": article.published_at.isoformat() if article.published_at else None,
        "metaTitle": article.meta_title,
        "metaDescription": article.meta_description,
        "metaTags": article.meta_tags,
        "author": {
            "id": article.author.id,
            "name": article.author.name,
            "slug": article.author.slug,
            "avatar": article.author.avatar,
            "title": article.author.title,
        } if article.author else None,
        "sport": _sport_to_dict(article.sport) if article.sport else None,
    }


def _standing_to_dict(standing: Standing) -> dict:
    return {
        "id": standing.id,
        "sportId": standing.sport_id,
        "sport_id": standing.sport_id,
        "teamId": standing.team_id,
        "team_id": standing.team_id,
        "wins": standing.wins,
        "losses": standing.losses,
        "draws": standing.draws,
        "position": standing.position,
        "percentage": standing.percentage,
        "streak": standing.streak,
        "team": _team_to_dict(standing.team) if standing.team else None,
    }
