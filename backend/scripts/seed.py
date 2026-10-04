"""
Seed script - Populates database with initial sample data.
Run with: python -m scripts.seed
"""
import asyncio
import logging
from datetime import datetime, timedelta
from uuid import uuid4
from slugify import slugify

from app.database import async_session, init_db
from app.services.data_service import ensure_sports, ensure_authors
from app.models.models import Team, Match, Standing, Article

logger = logging.getLogger(__name__)

# Sample teams for each sport
TEAMS_BY_SPORT = {
    "nba": [
        {"name": "Los Angeles Lakers", "abbreviation": "LAL", "city": "Los Angeles", "color": "#552583"},
        {"name": "Golden State Warriors", "abbreviation": "GSW", "city": "San Francisco", "color": "#1D428A"},
        {"name": "Boston Celtics", "abbreviation": "BOS", "city": "Boston", "color": "#007A33"},
        {"name": "Miami Heat", "abbreviation": "MIA", "city": "Miami", "color": "#98002E"},
        {"name": "Denver Nuggets", "abbreviation": "DEN", "city": "Denver", "color": "#0E2240"},
        {"name": "Milwaukee Bucks", "abbreviation": "MIL", "city": "Milwaukee", "color": "#00471B"},
        {"name": "Philadelphia 76ers", "abbreviation": "PHI", "city": "Philadelphia", "color": "#006BB6"},
        {"name": "Phoenix Suns", "abbreviation": "PHX", "city": "Phoenix", "color": "#1D1160"},
        {"name": "Dallas Mavericks", "abbreviation": "DAL", "city": "Dallas", "color": "#00538C"},
        {"name": "New York Knicks", "abbreviation": "NYK", "city": "New York", "color": "#006BB6"},
    ],
    "nfl": [
        {"name": "Kansas City Chiefs", "abbreviation": "KC", "city": "Kansas City", "color": "#E31837"},
        {"name": "San Francisco 49ers", "abbreviation": "SF", "city": "San Francisco", "color": "#AA0000"},
        {"name": "Baltimore Ravens", "abbreviation": "BAL", "city": "Baltimore", "color": "#241773"},
        {"name": "Buffalo Bills", "abbreviation": "BUF", "city": "Buffalo", "color": "#00338D"},
        {"name": "Dallas Cowboys", "abbreviation": "DAL", "city": "Dallas", "color": "#003594"},
        {"name": "Philadelphia Eagles", "abbreviation": "PHI", "city": "Philadelphia", "color": "#004C54"},
        {"name": "Green Bay Packers", "abbreviation": "GB", "city": "Green Bay", "color": "#203731"},
        {"name": "Miami Dolphins", "abbreviation": "MIA", "city": "Miami", "color": "#008E97"},
    ],
    "mlb": [
        {"name": "New York Yankees", "abbreviation": "NYY", "city": "New York", "color": "#003087"},
        {"name": "Los Angeles Dodgers", "abbreviation": "LAD", "city": "Los Angeles", "color": "#005A9C"},
        {"name": "Houston Astros", "abbreviation": "HOU", "city": "Houston", "color": "#002D62"},
        {"name": "Atlanta Braves", "abbreviation": "ATL", "city": "Atlanta", "color": "#CE1141"},
        {"name": "Chicago Cubs", "abbreviation": "CHC", "city": "Chicago", "color": "#0E3386"},
        {"name": "Boston Red Sox", "abbreviation": "BOS", "city": "Boston", "color": "#BD3039"},
    ],
    "nhl": [
        {"name": "Colorado Avalanche", "abbreviation": "COL", "city": "Denver", "color": "#6F263D"},
        {"name": "Tampa Bay Lightning", "abbreviation": "TBL", "city": "Tampa Bay", "color": "#002868"},
        {"name": "Vegas Golden Knights", "abbreviation": "VGK", "city": "Las Vegas", "color": "#B4975A"},
        {"name": "Toronto Maple Leafs", "abbreviation": "TOR", "city": "Toronto", "color": "#00205B"},
        {"name": "Boston Bruins", "abbreviation": "BOS", "city": "Boston", "color": "#FFB81C"},
        {"name": "Edmonton Oilers", "abbreviation": "EDM", "city": "Edmonton", "color": "#041E42"},
    ],
    "ncaaf": [
        {"name": "Alabama Crimson Tide", "abbreviation": "ALA", "city": "Tuscaloosa", "color": "#9E1B32"},
        {"name": "Georgia Bulldogs", "abbreviation": "UGA", "city": "Athens", "color": "#BA0C2F"},
        {"name": "Ohio State Buckeyes", "abbreviation": "OSU", "city": "Columbus", "color": "#BB0000"},
        {"name": "Michigan Wolverines", "abbreviation": "MICH", "city": "Ann Arbor", "color": "#00274C"},
        {"name": "Texas Longhorns", "abbreviation": "TEX", "city": "Austin", "color": "#BF5700"},
        {"name": "Oregon Ducks", "abbreviation": "ORE", "city": "Eugene", "color": "#154733"},
    ],
    "ncaab": [
        {"name": "Duke Blue Devils", "abbreviation": "DUKE", "city": "Durham", "color": "#003087"},
        {"name": "North Carolina Tar Heels", "abbreviation": "UNC", "city": "Chapel Hill", "color": "#7BAFD4"},
        {"name": "Kansas Jayhawks", "abbreviation": "KU", "city": "Lawrence", "color": "#0022B4"},
        {"name": "Kentucky Wildcats", "abbreviation": "UK", "city": "Lexington", "color": "#0033A0"},
        {"name": "UConn Huskies", "abbreviation": "UCONN", "city": "Storrs", "color": "#000E2F"},
        {"name": "Houston Cougars", "abbreviation": "UH", "city": "Houston", "color": "#C8102E"},
    ],
    "f1": [
        {"name": "Red Bull Racing", "abbreviation": "RBR", "city": "Milton Keynes", "color": "#3671C6"},
        {"name": "Mercedes", "abbreviation": "MER", "city": "Brackley", "color": "#27F4D2"},
        {"name": "Ferrari", "abbreviation": "FER", "city": "Maranello", "color": "#E8002D"},
        {"name": "McLaren", "abbreviation": "MCL", "city": "Woking", "color": "#FF8000"},
        {"name": "Aston Martin", "abbreviation": "AMR", "city": "Silverstone", "color": "#229971"},
        {"name": "Williams", "abbreviation": "WIL", "city": "Grove", "color": "#64C4FF"},
    ],
    "mma": [
        {"name": "Islam Makhachev", "abbreviation": "MAK", "city": "Makhachkala", "color": "#D20A0A"},
        {"name": "Alex Pereira", "abbreviation": "PER", "city": "Sao Paulo", "color": "#1A1A2E"},
        {"name": "Jon Jones", "abbreviation": "JON", "city": "Albuquerque", "color": "#16213E"},
        {"name": "Ilia Topuria", "abbreviation": "TOP", "city": "Alicante", "color": "#E94560"},
        {"name": "Sean O'Malley", "abbreviation": "SOM", "city": "Glendale", "color": "#FF6B6B"},
        {"name": "Israel Adesanya", "abbreviation": "ADE", "city": "Auckland", "color": "#4ECDC4"},
    ],
    "boxing": [
        {"name": "Canelo Alvarez", "abbreviation": "CAN", "city": "Guadalajara", "color": "#8B0000"},
        {"name": "Terence Crawford", "abbreviation": "CRA", "city": "Omaha", "color": "#2D1B69"},
        {"name": "Tyson Fury", "abbreviation": "FUR", "city": "Manchester", "color": "#B8860B"},
        {"name": "Oleksandr Usyk", "abbreviation": "USY", "city": "Kyiv", "color": "#0057B7"},
        {"name": "Naoya Inoue", "abbreviation": "INO", "city": "Zama", "color": "#BC002D"},
        {"name": "Gervonta Davis", "abbreviation": "DAV", "city": "Baltimore", "color": "#4A0E0E"},
    ],
    "cricket": [
        {"name": "India", "abbreviation": "IND", "city": "Mumbai", "color": "#0066B3"},
        {"name": "Australia", "abbreviation": "AUS", "city": "Melbourne", "color": "#FFD700"},
        {"name": "England", "abbreviation": "ENG", "city": "London", "color": "#1C2C5B"},
        {"name": "South Africa", "abbreviation": "SA", "city": "Cape Town", "color": "#007749"},
        {"name": "New Zealand", "abbreviation": "NZ", "city": "Wellington", "color": "#000000"},
        {"name": "Pakistan", "abbreviation": "PAK", "city": "Lahore", "color": "#006A4E"},
        {"name": "Chennai Super Kings", "abbreviation": "CSK", "city": "Chennai", "color": "#FFFF3C"},
        {"name": "Mumbai Indians", "abbreviation": "MI", "city": "Mumbai", "color": "#004B87"},
        {"name": "Royal Challengers Bengaluru", "abbreviation": "RCB", "city": "Bengaluru", "color": "#EC1C24"},
        {"name": "Kolkata Knight Riders", "abbreviation": "KKR", "city": "Kolkata", "color": "#3A225D"},
    ],
}


async def seed_database(db=None):
    """Seed the database with sample data."""
    from sqlalchemy import select

    if db is None:
        from app.database import async_session
        async with async_session() as session:
            return await seed_database(session)

    logger.info("🌱 Seeding database...")

    # Ensure sports and authors exist
    sports = await ensure_sports(db)
    authors = await ensure_authors(db)

    # Create teams for each sport
    team_records = {}
    for sport_slug, teams_list in TEAMS_BY_SPORT.items():
        sport = sports.get(sport_slug)
        if not sport:
            continue

        team_records[sport_slug] = []
        for team_data in teams_list:
            slug = slugify(team_data["name"])
            # Check if team exists
            existing = (await db.execute(
                select(Team).where(Team.sport_id == sport.id, Team.slug == slug)
            )).scalar_one_or_none()

            if existing:
                team_records[sport_slug].append(existing)
                continue

            color = team_data.get("color", "#666666").replace("#", "")
            team = Team(
                id=str(uuid4()),
                sport_id=sport.id,
                name=team_data["name"],
                abbreviation=team_data.get("abbreviation", ""),
                slug=slug,
                city=team_data.get("city"),
                logo=f"https://ui-avatars.com/api/?name={team_data.get('abbreviation', 'TM')}&background={color}&color=fff&size=80&bold=true",
                color=team_data.get("color"),
            )
            db.add(team)
            team_records[sport_slug].append(team)

    await db.flush()

    # Create sample matches
    import random
    match_count = 0
    for sport_slug, teams in team_records.items():
        if len(teams) < 2:
            continue

        sport = sports[sport_slug]

        # Create a live match
        home = teams[0]
        away = teams[1]
        slug = f"{home.slug}-vs-{away.slug}-2026-05-16"
        existing = (await db.execute(
            select(Match).where(Match.sport_id == sport.id, Match.slug == slug)
        )).scalar_one_or_none()

        if not existing:
            match = Match(
                id=str(uuid4()),
                sport_id=sport.id,
                slug=slug,
                home_team_id=home.id,
                away_team_id=away.id,
                home_score=random.randint(70, 110),
                away_score=random.randint(65, 105),
                status="live",
                match_date=datetime.utcnow(),
                venue=f"{home.city} Arena",
                broadcast_info='{"channels": ["ESPN", "ABC"], "streaming": ["ESPN+", "fuboTV"]}',
                home_votes=random.randint(100, 500),
                away_votes=random.randint(80, 400),
            )
            db.add(match)
            match_count += 1

        # Create upcoming matches
        for i in range(min(3, len(teams) - 1)):
            home = teams[i]
            away = teams[i + 1]
            future_date = datetime.utcnow() + timedelta(days=i + 1, hours=random.randint(15, 21))
            date_str = future_date.strftime("%Y-%m-%d")
            slug = f"{home.slug}-vs-{away.slug}-{date_str}"

            existing = (await db.execute(
                select(Match).where(Match.sport_id == sport.id, Match.slug == slug)
            )).scalar_one_or_none()

            if not existing:
                match = Match(
                    id=str(uuid4()),
                    sport_id=sport.id,
                    slug=slug,
                    home_team_id=home.id,
                    away_team_id=away.id,
                    status="upcoming",
                    match_date=future_date,
                    venue=f"{home.city} Stadium",
                    broadcast_info='{"channels": ["ESPN", "TNT"], "streaming": ["ESPN+", "Sling TV"]}',
                    home_votes=random.randint(50, 200),
                    away_votes=random.randint(30, 180),
                )
                db.add(match)
                match_count += 1

        # Create finished matches
        for i in range(min(2, len(teams) - 3)):
            home = teams[i + 2]
            away = teams[i + 3] if i + 3 < len(teams) else teams[0]
            past_date = datetime.utcnow() - timedelta(days=i + 1, hours=random.randint(2, 5))
            date_str = past_date.strftime("%Y-%m-%d")
            slug = f"{home.slug}-vs-{away.slug}-{date_str}"

            existing = (await db.execute(
                select(Match).where(Match.sport_id == sport.id, Match.slug == slug)
            )).scalar_one_or_none()

            if not existing:
                home_score = random.randint(70, 120)
                away_score = random.randint(65, 115)
                match = Match(
                    id=str(uuid4()),
                    sport_id=sport.id,
                    slug=slug,
                    home_team_id=home.id,
                    away_team_id=away.id,
                    home_score=home_score,
                    away_score=away_score,
                    status="finished",
                    match_date=past_date,
                    venue=f"{home.city} Arena",
                    broadcast_info='{"channels": ["ESPN"], "streaming": ["ESPN+"]}',
                    match_summary=f"In a {'dominant' if abs(home_score - away_score) > 15 else 'hard-fought'} performance, the {home.name if home_score > away_score else away.name} defeated the {away.name if home_score > away_score else home.name}.",
                    home_votes=random.randint(200, 800),
                    away_votes=random.randint(150, 700),
                )
                db.add(match)
                match_count += 1

        if sport_slug == "cricket" and len(teams) >= 10:
            # CSK vs MI (Finished IPL Match)
            csk = teams[6]
            mi = teams[7]
            slug = f"{csk.slug}-vs-{mi.slug}-ipl-2026"
            existing = (await db.execute(select(Match).where(Match.sport_id == sport.id, Match.slug == slug))).scalar_one_or_none()
            if not existing:
                match = Match(
                    id=str(uuid4()),
                    sport_id=sport.id,
                    slug=slug,
                    home_team_id=csk.id,
                    away_team_id=mi.id,
                    home_score=210,
                    away_score=198,
                    status="finished",
                    match_date=datetime.utcnow() - timedelta(days=2),
                    venue="M.A. Chidambaram Stadium",
                    broadcast_info='{"channels": ["Star Sports"], "streaming": ["JioCinema"]}',
                    match_summary="In a high-octane IPL El Clasico, Chennai Super Kings defended 210 successfully against Mumbai Indians at Chepauk.",
                    home_votes=650,
                    away_votes=580,
                )
                db.add(match)
                match_count += 1

            # RCB vs KKR (Upcoming IPL Match)
            rcb = teams[8]
            kkr = teams[9]
            slug = f"{rcb.slug}-vs-{kkr.slug}-ipl-upcoming"
            existing = (await db.execute(select(Match).where(Match.sport_id == sport.id, Match.slug == slug))).scalar_one_or_none()
            if not existing:
                match = Match(
                    id=str(uuid4()),
                    sport_id=sport.id,
                    slug=slug,
                    home_team_id=rcb.id,
                    away_team_id=kkr.id,
                    status="upcoming",
                    match_date=datetime.utcnow() + timedelta(days=1, hours=18),
                    venue="M. Chinnaswamy Stadium",
                    broadcast_info='{"channels": ["Star Sports"], "streaming": ["JioCinema"]}',
                    home_votes=720,
                    away_votes=490,
                )
                db.add(match)
                match_count += 1

    # Create sample standings
    for sport_slug in ["nba", "nfl", "mlb", "nhl"]:
        teams = team_records.get(sport_slug, [])
        sport = sports[sport_slug]

        for i, team in enumerate(teams):
            wins = random.randint(20, 55)
            losses = random.randint(15, 45)
            existing = (await db.execute(
                select(Standing).where(Standing.sport_id == sport.id, Standing.team_id == team.id)
            )).scalar_one_or_none()

            if not existing:
                standing = Standing(
                    id=str(uuid4()),
                    sport_id=sport.id,
                    team_id=team.id,
                    position=i + 1,
                    wins=wins,
                    losses=losses,
                    draws=sport_slug == "nhl" and random.randint(0, 10) or 0,
                    percentage=round(wins / (wins + losses), 3) if (wins + losses) > 0 else 0,
                    streak=f"W{random.randint(1, 8)}" if random.random() > 0.5 else f"L{random.randint(1, 5)}",
                )
                db.add(standing)

    await db.commit()
    logger.info(f"✅ Seeding complete! Created {match_count} matches")


if __name__ == "__main__":
    # First create tables
    from app.database import init_db
    asyncio.run(init_db())
    print("✅ Tables created")
    # Then seed
    asyncio.run(seed_database())
