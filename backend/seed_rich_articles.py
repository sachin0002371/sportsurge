import asyncio
import logging
from datetime import datetime, timedelta
from uuid import uuid4
from slugify import slugify

from app.database import async_session, init_db
from app.services.data_service import ensure_sports, ensure_authors
from app.models.models import Article, Sport, Author
from sqlalchemy import select

logger = logging.getLogger(__name__)

INITIAL_ARTICLES = [
    {
        "title": "2026 NBA Championship Race: Tactical Evolution and Key Contenders",
        "sport_slug": "nba",
        "category": "analysis",
        "author_slug": "marcus-hayes",
        "featured_image": "https://images.pexels.com/photos/1752757/pexels-photo-1752757.jpeg?auto=compress&cs=tinysrgb&w=1200",
        "content": """The 2026 NBA season is witnessing an unprecedented evolution in tactical execution. Teams are prioritizing positionless basketball, spacing, and transition efficiency over traditional isolation sets.

As playoff contenders jockey for position in the Eastern and Western conferences, defensive versatility has emerged as the ultimate differentiator. Coaches are deploying switch-heavy schemes designed to neutralize elite pick-and-roll ballhandlers.

Key championship contenders have bolstered their perimeter shooting, creating wider driving lanes for primary playmakers. As the postseason approaches, health, bench depth, and half-court execution in clutch minutes will decide who hoists the Larry O'Brien Trophy.""",
    },
    {
        "title": "NFL Defense Breakdown: How Modern Schemes Are Countering High-Powered Offenses",
        "sport_slug": "nfl",
        "category": "analysis",
        "author_slug": "derek-vance",
        "featured_image": "https://images.pexels.com/photos/1618269/pexels-photo-1618269.jpeg?auto=compress&cs=tinysrgb&w=1200",
        "content": """NFL defensive coordinators have innovated rapidly to counter explosive spread offenses. The widespread adoption of split-safety coverages and disguised two-high shells has forced quarterbacks into patient, underneath checkdowns.

Pass-rush rotations are now deeper than ever, allowing front sevens to maintain unrelenting pressure in the fourth quarter. Edge rushers with inside-outside versatility are disrupting pocket integrity before deep routes can develop.

With explosive play rates dropping across the league, offensive play-callers must embrace efficient run schemes and intermediate crossing routes to sustain scoring drives.""",
    },
    {
        "title": "MLB Postseason Pitching Mastery: The Impact of High-Leverage Bullpens",
        "sport_slug": "mlb",
        "category": "analysis",
        "author_slug": "elena-rostova",
        "featured_image": "https://images.pexels.com/photos/209977/pexels-photo-209977.jpeg?auto=compress&cs=tinysrgb&w=1200",
        "content": """Modern Major League Baseball postseason success is defined by bullpen usage. Starters are rarely asked to navigate a lineup three times, placing immense responsibility on high-leverage relief corps.

Relievers throwing triple-digit four-seamers and devastating sweepers dominate late innings. Managers are deploying their best arms in crucial mid-game moments rather than strictly preserving them for traditional ninth-inning saves.

Offenses that generate traffic via walks and timely power have the best odds of breaking through elite pitching rotations under October pressure.""",
    },
    {
        "title": "NHL Stanley Cup Outlook: Speed, Transition and Goaltending Dominance",
        "sport_slug": "nhl",
        "category": "preview",
        "author_slug": "alex-chen",
        "featured_image": "https://images.pexels.com/photos/3621104/pexels-photo-3621104.jpeg?auto=compress&cs=tinysrgb&w=1200",
        "content": """The NHL pace of play is faster than at any point in modern hockey history. Defensemen who can skate out of trouble and trigger transition offenses are in high demand across the league.

Special teams efficiency remains the ultimate predictor of playoff advancement. Power-play units utilizing bumper plays and one-timer setups are punishing undisciplined opponents, while penalty-kill aggression creates shorthanded breakaways.

Elite goaltending remains the great equalizer. Netminders with top-tier high-danger save percentages can single-handedly carry underdog teams deep into the Stanley Cup playoffs.""",
    },
    {
        "title": "ICC T20 World Cup Strategy: Death Overs Hitting and Mystery Spin",
        "sport_slug": "cricket",
        "category": "analysis",
        "author_slug": "tariq-mansoor",
        "featured_image": "https://images.pexels.com/photos/3628912/pexels-photo-3628912.jpeg?auto=compress&cs=tinysrgb&w=1200",
        "content": """International T20 cricket is reaching new statistical peaks with aggressive powerplay scoring and calculated death overs acceleration. Teams that maintain a 10+ run rate across the middle overs are consistently setting winning totals.

Mystery spinners and wrist-spinners who turn the ball both ways without discernible change of action are proving vital in choking run flow. Field placements utilizing deep boundary riders on the leg side force batters into risky aerial strokes.

All-rounders who contribute four economical overs and provide explosive lower-order finishing remain the most coveted assets in world cricket today.""",
    },
    {
        "title": "Formula 1 Aerodynamic Battle: Key Upgrades Reshaping the Podium",
        "sport_slug": "f1",
        "category": "news",
        "author_slug": "alex-chen",
        "featured_image": "https://images.pexels.com/photos/12795/pexels-photo-12795.jpeg?auto=compress&cs=tinysrgb&w=1200",
        "content": """The 2026 Formula 1 championship battle is intensifying as top constructors bring comprehensive aerodynamic upgrade packages. Floor modifications and revised sidepod inlets have tightened qualifying margins to under a tenth of a second.

Tire degradation management across stints is defining race day strategy. Drivers who can preserve the soft and medium compounds while maintaining competitive lap times are capturing crucial undercut advantages during pit stops.

With high-speed circuits on the horizon, top-speed efficiency and DRS effectiveness will decide who commands the championship lead.""",
    },
    {
        "title": "UFC Championship Clashes: Wrestling Control vs Striking Precision",
        "sport_slug": "mma",
        "category": "preview",
        "author_slug": "marcus-hayes",
        "featured_image": "https://images.pexels.com/photos/4761792/pexels-photo-4761792.jpeg?auto=compress&cs=tinysrgb&w=1200",
        "content": """Mixed Martial Arts title fights in 2026 continue to pit elite grappling styles against precision counter-strikers. Chain-wrestling and cage pressure remain the most dominant pathway to controlling championship rounds.

However, elite strikers with disciplined takedown defense and brutal calf kicks are finding success neutralizing wrestlers before they close distance. Championship endurance over five rounds separates contenders from champions.

Fans can expect high-stakes technical battles as the undisputed belts change hands in upcoming pay-per-view spectacles.""",
    },
    {
        "title": "College Football Playoff Race: Powerhouse Programs Collide in Crucial Week",
        "sport_slug": "ncaaf",
        "category": "preview",
        "author_slug": "derek-vance",
        "featured_image": "https://images.pexels.com/photos/2570139/pexels-photo-2570139.jpeg?auto=compress&cs=tinysrgb&w=1200",
        "content": """The expanded 12-team College Football Playoff format has elevated the stakes of every conference matchup. Programs across the SEC, Big Ten, Big 12, and ACC are fighting for first-round byes and home playoff seeds.

Dynamic dual-threat quarterbacks who extend plays outside the pocket are stressing defensive secondaries. Red zone execution and turnover margin will separate the true national title contenders from pretenders in this thrilling season.""",
    },
]

async def seed_articles():
    await init_db()
    async with async_session() as db:
        sports = await ensure_sports(db)
        authors = await ensure_authors(db)

        count = 0
        for art in INITIAL_ARTICLES:
            sport = sports.get(art["sport_slug"])
            author = authors.get(art["author_slug"]) or list(authors.values())[0]
            if not sport:
                continue

            slug = slugify(art["title"])[:100]
            existing = (await db.execute(select(Article).where(Article.slug == slug))).scalar_one_or_none()

            if not existing:
                article = Article(
                    id=str(uuid4()),
                    sport_id=sport.id,
                    author_id=author.id,
                    title=art["title"],
                    slug=slug,
                    excerpt=art["content"][:160] + "...",
                    content=art["content"],
                    featured_image=art["featured_image"],
                    category=art["category"],
                    tags=art["sport_slug"],
                    is_published=True,
                    published_at=datetime.utcnow() - timedelta(hours=count * 3),
                    meta_title=art["title"][:60],
                    meta_description=art["content"][:150],
                    meta_tags=art["sport_slug"],
                )
                db.add(article)
                count += 1

        await db.commit()
        print(f"✅ Seeded {count} high quality sports articles into SQLite!")

if __name__ == "__main__":
    asyncio.run(seed_articles())
