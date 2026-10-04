"""
Trending Topics Service v3.0
============================
Fetches trending sports topics from multiple sources:
- Google Trends via pytrends
- RSS feeds from ESPN, BBC Sports
Returns list of trending topics with sport slug and relevance score.
"""
import logging
import re
from datetime import datetime
from typing import Optional
from xml.etree import ElementTree

import httpx

from app.config import settings

logger = logging.getLogger(__name__)

# Sport keyword mapping for categorizing trending topics
SPORT_KEYWORDS = {
    "nba": [
        "nba", "basketball", "lakers", "warriors", "celtics", "bucks",
        "playoffs", "dunk", "three-pointer", "lebron", "curry",
        "jokic", "giannis", "tatum", "durant", "nbaplayoffs",
    ],
    "nfl": [
        "nfl", "football", "super bowl", "touchdown", "quarterback",
        "chiefs", "49ers", "mahomes", "cowboys", "eagles",
        "draft", "combine", "nflplayoffs",
    ],
    "mlb": [
        "mlb", "baseball", "world series", "home run", "pitcher",
        "yankees", "dodgers", "astros", "braves", "batting",
    ],
    "nhl": [
        "nhl", "hockey", "stanley cup", "ice hockey", "puck",
        "oilers", "avalanche", "rangers", "maple leafs",
    ],
    "f1": [
        "f1", "formula 1", "formula one", "grand prix", "verstappen",
        "hamilton", "ferrari", "red bull racing", "mercedes", "mclaren",
        "qualifying", "sprint race",
    ],
    "mma": [
        "mma", "ufc", "ufc fight", "octagon", "submission",
        "knockout", "champion", "title fight", "pound-for-pound",
    ],
    "boxing": [
        "boxing", "boxer", "heavyweight", "title bout", "knockout",
        "canelo", "crawford", "tyson fury", "pay-per-view",
    ],
    "cricket": [
        "cricket", "ipl", "test match", "t20", "odi",
        "world cup cricket", "wickets", "century", "batsman",
        "bowl", "india cricket", "australia cricket", "england cricket",
    ],
    "ncaaf": [
        "ncaaf", "college football", "cfp", "bowl game",
        "heisman", "alabama", "georgia", "ohio state", "michigan",
    ],
    "ncaab": [
        "ncaab", "march madness", "college basketball", "final four",
        "duke", "kansas", "kentucky", "unc", "ncaa tournament",
    ],
}

# RSS feed URLs for sports news
RSS_FEEDS = [
    {
        "name": "ESPN Top News",
        "url": "https://www.espn.com/espn/rss/news",
        "category": "general",
    },
    {
        "name": "ESPN NBA",
        "url": "https://www.espn.com/espn/rss/nba/news",
        "category": "nba",
    },
    {
        "name": "ESPN NFL",
        "url": "https://www.espn.com/espn/rss/nfl/news",
        "category": "nfl",
    },
    {
        "name": "ESPN MLB",
        "url": "https://www.espn.com/espn/rss/mlb/news",
        "category": "mlb",
    },
    {
        "name": "BBC Sport",
        "url": "http://feeds.bbci.co.uk/sport/rss.xml",
        "category": "general",
    },
]


def categorize_topic(topic: str) -> str:
    """
    Determine which sport a trending topic belongs to.
    Returns the sport slug or 'general' if no match.
    """
    topic_lower = topic.lower()

    best_match = "general"
    best_score = 0

    for sport_slug, keywords in SPORT_KEYWORDS.items():
        score = 0
        for keyword in keywords:
            if keyword in topic_lower:
                score += 1
        if score > best_score:
            best_score = score
            best_match = sport_slug

    return best_match


def calculate_relevance_score(topic: str, source: str, sport_slug: str) -> float:
    """
    Calculate a relevance score (0-10) for a trending topic.
    Higher score = more relevant for article generation.
    """
    score = 5.0  # Base score

    # Source weighting
    if source == "google_trends":
        score += 2.0  # Trending searches are hot topics
    elif source == "espn_rss":
        score += 1.5  # ESPN is authoritative
    elif source == "bbc_rss":
        score += 1.0  # BBC is good but less US-centric

    # Sport-specific boost
    if sport_slug != "general":
        score += 1.0  # Categorized topics are more actionable

    # Recency indicators (topics with "breaking", "live", "just" are hotter)
    topic_lower = topic.lower()
    recency_words = ["breaking", "live", "just", "update", "confirmed", "official"]
    for word in recency_words:
        if word in topic_lower:
            score += 0.5

    # Championship/playoff keywords boost
    big_event_words = ["final", "championship", "playoff", "super bowl", "world cup", "title"]
    for word in big_event_words:
        if word in topic_lower:
            score += 1.0

    return min(score, 10.0)


# ============================================================
# Google Trends via pytrends
# ============================================================

async def fetch_google_trends() -> list[dict]:
    """
    Fetch trending sports searches from Google Trends.
    Uses pytrends library (runs in executor to avoid blocking).
    """
    topics = []

    try:
        from pytrends.request import TrendReq
        import asyncio

        def _fetch_trends():
            """Blocking pytrends call - run in executor."""
            pytrend = TrendReq()
            # Get trending searches (daily trends)
            try:
                trending_searches = pytrend.trending_searches(pn="united_states")
                if trending_searches is not None and not trending_searches.empty:
                    return trending_searches[0].tolist()
            except Exception:
                pass

            # Fallback: search for sports-related topics
            try:
                pytrend.build_payload(kw_list=["NBA", "NFL", "MLB", "NHL", "F1", "UFC", "Cricket"], geo="US")
                related = pytrend.related_queries()
                results = []
                for keyword, data in related.items():
                    if data and data.get("rising") is not None:
                        rising = data["rising"]
                        if not rising.empty:
                            results.extend(rising["query"].tolist()[:5])
                return results
            except Exception:
                pass

            return []

        loop = asyncio.get_event_loop()
        trending_list = await loop.run_in_executor(None, _fetch_trends)

        for topic_text in trending_list[:20]:
            sport_slug = categorize_topic(topic_text)
            relevance = calculate_relevance_score(topic_text, "google_trends", sport_slug)
            topics.append({
                "topic": topic_text,
                "sport_slug": sport_slug,
                "relevance_score": relevance,
                "source": "google_trends",
                "fetched_at": datetime.utcnow().isoformat(),
            })

    except ImportError:
        logger.warning("pytrends not installed, skipping Google Trends")
    except Exception as e:
        logger.error(f"Google Trends fetch error: {e}")

    return topics


# ============================================================
# RSS Feed Parsing
# ============================================================

async def fetch_rss_feed(feed_config: dict) -> list[dict]:
    """Fetch and parse a single RSS feed."""
    topics = []

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.get(
                feed_config["url"],
                headers={"User-Agent": "SportSurge/3.0 RSS Reader"},
            )
            response.raise_for_status()

            root = ElementTree.fromstring(response.content)

            # Find items (RSS 2.0 format)
            items = root.findall(".//item")
            if not items:
                # Try Atom format
                items = root.findall(".//{http://www.w3.org/2005/Atom}entry")

            for item in items[:10]:
                # Extract title
                title_el = item.find("title")
                if title_el is None:
                    title_el = item.find("{http://www.w3.org/2005/Atom}title")
                title = title_el.text if title_el is not None and title_el.text else ""

                if not title:
                    continue

                # Clean up HTML entities
                title = re.sub(r'<[^>]+>', '', title).strip()

                sport_slug = feed_config.get("category", "general")
                if sport_slug == "general":
                    sport_slug = categorize_topic(title)

                relevance = calculate_relevance_score(title, "espn_rss" if "espn" in feed_config["name"].lower() else "bbc_rss", sport_slug)

                topics.append({
                    "topic": title,
                    "sport_slug": sport_slug,
                    "relevance_score": relevance,
                    "source": feed_config["name"],
                    "fetched_at": datetime.utcnow().isoformat(),
                })

    except Exception as e:
        logger.error(f"RSS feed error ({feed_config['name']}): {e}")

    return topics


async def fetch_all_rss_feeds() -> list[dict]:
    """Fetch and parse all configured RSS feeds."""
    all_topics = []

    for feed_config in RSS_FEEDS:
        topics = await fetch_rss_feed(feed_config)
        all_topics.extend(topics)

    return all_topics


# ============================================================
# Fallback Topics - Used when external sources fail
# ============================================================

# Season-aware fallback topics for each sport.
# These ensure the article pipeline NEVER stops even if
# Google Trends, ESPN RSS, and BBC RSS all fail simultaneously.
# Topics rotate based on day-of-week and month for variety.

FALLBACK_TOPICS = {
    "nba": [
        "NBA Playoff Race Intensifies as Teams Battle for Positioning",
        "Top MVP Candidates Making Their Case This Season",
        "NBA Trade Deadline Shake-Up Changes the Landscape",
        "Rookie Sensations Making Waves Across the League",
        "Defensive Masterclass Leads to Stunning Upset Victory",
        "Three-Point Revolution Continues to Transform the Game",
        "Injury Report Impact on Playoff Contenders",
        "Second-Half Season Predictions and Analysis",
        "Coaching Strategies Evolving in the Modern NBA",
        "Home Court Advantage Statistics and Trends",
    ],
    "nfl": [
        "NFL Playoff Picture Taking Shape After Key Week",
        "Quarterback Duel Defines This Week's Marquee Matchup",
        "Draft Class Impact Players Changing Team Fortunes",
        "Defensive Coordinators Innovating With New Schemes",
        "Super Bowl Contenders Emerging From the Pack",
        "Trade Deadline Moves That Could Shift the Balance",
        "Running Back by Committee Trend Sweeping the League",
        "Special Teams Play Making the Difference in Close Games",
        "Injury Updates on Key Players for Upcoming Games",
        "Division Rivalries Heating Up Down the Stretch",
    ],
    "mlb": [
        "MLB Standings Shake-Up as Season Enters Critical Phase",
        "Pitching Dominance Leads to Historic Performance",
        "Home Run Race Heating Up Among League Leaders",
        "Trade Deadline Deals Reshaping Team Rosters",
        "Rookie Call-Ups Making Immediate Impact",
        "Bullpen Strategy Evolving Across the League",
        "Defensive Gems Highlighting the Week's Best Plays",
        "Batting Average vs OPS Debate Continues",
        "Postseason Prediction Models Update After Latest Results",
        "Managerial Decisions Under Scrutiny in Close Games",
    ],
    "nhl": [
        "NHL Playoff Push Intensifies as Teams Fight for Spots",
        "Goaltending Brilliance Defines This Week's Top Performances",
        "Power Play Strategies Evolving Across the League",
        "Trade Deadline Moves Shifting the Competitive Balance",
        "Rookie Forwards Making Their Mark on the Ice",
        "Defensive Systems Adaptation in the Modern NHL",
        "Overtime Thrillers Keeping Fans on the Edge",
        "Corsi and Advanced Metrics Revealing Hidden Trends",
        "Division Leaders Separating From the Pack",
        "Injury Impact on Stanley Cup Contenders",
    ],
    "ncaaf": [
        "College Football Playoff Rankings Shake-Up After Latest Results",
        "Heisman Trophy Candidates Making Their Final Push",
        "Bowl Game Projections Update After Conference Championships",
        "Recruiting Class Impact on Next Season's Contenders",
        "Upset Alert: Underdogs Challenging the Established Order",
        "Quarterback Battles Defining Conference Races",
        "Defensive Schemes Stopping Top Offenses",
        "Transfer Portal Impact on Team Depth Charts",
        "Rivalry Week Preview and Historical Context",
        "Coaching Carousel Rumors and Predictions",
    ],
    "ncaab": [
        "March Madness Bracket Predictions After Latest Upsets",
        "Final Four Contenders Emerging From Conference Play",
        "Freshman Stars Dominating the College Basketball Scene",
        "Conference Tournament Implications for Seeding",
        "Defensive Efficiency Rankings Revealing Tournament Threats",
        "Transfer Portal Reshaping Team Dynamics",
        "Bubble Watch: Teams Fighting for Tournament Spots",
        "Three-Point Shooting Trends in College Basketball",
        "Coaching Legends and Their Tournament Pedigree",
        "Player of the Year Candidates Statistical Breakdown",
    ],
    "f1": [
        "Formula 1 Championship Battle Intensifies After Latest Grand Prix",
        "Qualifying Drama Sets Up Thrilling Race Day",
        "Team Strategy Innovations Pushing Performance Boundaries",
        "Driver Rivalries Reaching Boiling Point on Track",
        "Technical Regulations Impact on Car Development",
        "Sprint Race Format Continuing to Divide Opinion",
        "Circuit Analysis: What Makes This Track Unique",
        "Mid-Season Driver Market Rumors and Predictions",
        "Aerodynamic Upgrades Yielding Measurable Results",
        "Constructor Championship Standings Update",
    ],
    "mma": [
        "UFC Title Fight Preview and Breakdown",
        "Pound-for-Pound Rankings Update After Latest Event",
        "Submission Specialists Making Their Mark in the Octagon",
        "Knockout Power Defining This Week's Main Event",
        "Fight Camp Insights: Training Regimens of Top Fighters",
        "Weight Class Shake-Up After Recent Results",
        "Prospect Watch: Rising Stars in the MMA World",
        "Coaching Corner: Strategy Behind the Biggest Wins",
        "Fight Night Predictions and Expert Analysis",
        "Legacy on the Line: Veteran Fighters Defining Their Careers",
    ],
    "boxing": [
        "Heavyweight Division Drama Continues With Title Implications",
        "Championship Bout Preview and Tactical Breakdown",
        "Knockout Artists Lighting Up the Boxing World",
        "Promotional Battles Impacting the Fight Calendar",
        "Technical Boxing Mastery in the Latest Title Fight",
        "Undisputed Championship Dreams and Reality",
        "Prospect Pipeline: Next Generation of Boxing Stars",
        "Trainer-Fighter Dynamics Behind Championship Runs",
        "Weight Class Consolidation Trend in Modern Boxing",
        "Historical Parallels to Current Boxing Landscape",
    ],
    "cricket": [
        "Test Match Drama as Series Reaches Decisive Moment",
        "T20 League Excitement With Record-Breaking Performances",
        "World Cup Qualification Scenarios Getting Complex",
        "Batting Masterclass Defines the Latest Innings",
        "Bowling Strategy Evolution in Modern Cricket",
        "All-Rounder Impact on Team Balance and Results",
        "Pitch Conditions and Their Effect on Match Outcomes",
        "Cricket Analytics Revolutionizing Player Selection",
        "Rivalry Renewed: Historic Context for Latest Series",
        "Domestic Cricket Talent Pipeline Feeding International Teams",
    ],
}


def generate_fallback_topics() -> list[dict]:
    """
    Generate fallback topics when external sources (Google Trends, RSS) fail.
    Uses day-of-week and month rotation to ensure variety across days.
    Returns topics for ALL sports with varied relevance scores.
    """
    now = datetime.utcnow()
    day_offset = now.weekday()  # 0=Monday, 6=Sunday
    month = now.month

    topics = []
    for sport_slug, topic_list in FALLBACK_TOPICS.items():
        # Rotate which topics are picked based on day + month
        # This ensures different topics appear on different days
        start_idx = (day_offset + month) % len(topic_list)
        # Pick 3 topics per sport, rotated by day
        for i in range(3):
            idx = (start_idx + i) % len(topic_list)
            topic_text = topic_list[idx]

            # Vary relevance score based on sport priority and rotation
            # Higher-priority sports (NBA, NFL) get higher scores
            sport_priority = {
                "nba": 8.5, "nfl": 8.3, "mlb": 7.8, "nhl": 7.5,
                "ncaaf": 7.2, "ncaab": 7.0, "f1": 7.6, "mma": 7.4,
                "boxing": 6.8, "cricket": 7.0,
            }
            base_score = sport_priority.get(sport_slug, 7.0)
            # Add small variation based on day rotation
            score = base_score + (i * 0.3) - (day_offset * 0.1)
            score = max(5.0, min(10.0, score))

            topics.append({
                "topic": topic_text,
                "sport_slug": sport_slug,
                "relevance_score": round(score, 1),
                "source": "fallback",
                "fetched_at": now.isoformat(),
            })

    # Sort by relevance score
    topics.sort(key=lambda x: x["relevance_score"], reverse=True)
    return topics


# ============================================================
# Combined Trending Topics
# ============================================================

# In-memory cache for trending topics
_trending_cache: list[dict] = []
_trending_cache_time: Optional[datetime] = None
_CACHE_TTL_MINUTES = 30


async def get_trending_topics(force_refresh: bool = False) -> list[dict]:
    """
    Get current trending sports topics from all sources.
    Results are cached for 30 minutes.
    Returns list of topics sorted by relevance score (highest first).
    FALLBACK: If external sources return 0 topics, uses built-in fallback
    topics to ensure the article pipeline NEVER stops.
    """
    global _trending_cache, _trending_cache_time

    # Check cache
    if not force_refresh and _trending_cache and _trending_cache_time:
        age_minutes = (datetime.utcnow() - _trending_cache_time).total_seconds() / 60
        if age_minutes < _CACHE_TTL_MINUTES:
            logger.info(f"Returning cached trending topics ({len(_trending_cache)} items, {age_minutes:.0f}min old)")
            return _trending_cache

    logger.info("Fetching fresh trending topics...")

    all_topics = []

    # Google Trends
    try:
        trends = await fetch_google_trends()
        all_topics.extend(trends)
        logger.info(f"Google Trends returned {len(trends)} topics")
    except Exception as e:
        logger.error(f"Google Trends error: {e}")

    # RSS Feeds
    try:
        rss_topics = await fetch_all_rss_feeds()
        all_topics.extend(rss_topics)
        logger.info(f"RSS feeds returned {len(rss_topics)} topics")
    except Exception as e:
        logger.error(f"RSS feed error: {e}")

    # CRITICAL FIX: If external sources returned 0 topics, use fallback
    if not all_topics:
        logger.warning("External trending sources returned 0 topics - using fallback topics to keep pipeline running")
        fallback = generate_fallback_topics()
        all_topics.extend(fallback)
        logger.info(f"Added {len(fallback)} fallback topics")

    # Deduplicate by similar topic text
    seen_topics = set()
    unique_topics = []
    for topic in all_topics:
        # Normalize: lowercase, remove extra spaces
        normalized = re.sub(r'\s+', ' ', topic["topic"].lower().strip())
        # Simple dedup: check if we've seen a very similar topic
        is_dup = False
        for seen in seen_topics:
            if normalized in seen or seen in normalized:
                is_dup = True
                break
        if not is_dup:
            seen_topics.add(normalized)
            unique_topics.append(topic)

    # Sort by relevance score (highest first)
    unique_topics.sort(key=lambda x: x["relevance_score"], reverse=True)

    # Cache the results
    _trending_cache = unique_topics
    _trending_cache_time = datetime.utcnow()

    logger.info(f"Fetched {len(unique_topics)} trending topics (sources: {set(t['source'] for t in unique_topics)})")
    return unique_topics


async def get_trending_for_sport(sport_slug: str, limit: int = 5) -> list[dict]:
    """Get trending topics for a specific sport."""
    all_topics = await get_trending_topics()
    sport_topics = [t for t in all_topics if t["sport_slug"] == sport_slug]
    return sport_topics[:limit]
