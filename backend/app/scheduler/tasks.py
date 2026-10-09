"""
Scheduler Service v3.0
======================
New scheduling logic:
- 10 articles at fixed hours (7AM, 9AM, 11AM, 1PM, 3PM, 5PM, 7PM, 9PM, 11PM, 1AM)
- 10 articles at random times between fixed hours
- Trending boost: If a trending topic appears, immediately generate 1 article (max 3/day extra)
- Match summary generation: every 6 hours, summarize last-24h finished matches
- ESPN data fetch: every 5 minutes
- YouTube video update: every 30 minutes
"""
import logging
import random
from datetime import datetime, timedelta
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger
from apscheduler.triggers.cron import CronTrigger

from app.config import settings
from app.services.rate_limiter import rate_limiter

logger = logging.getLogger(__name__)

scheduler = AsyncIOScheduler()

# Track trending boost articles generated today
_trending_boost_count = 0
_trending_boost_date = None


# ============================================================
# Task: Fetch Live Data from ESPN
# ============================================================

async def fetch_live_data_task():
    """Fetch latest data from ESPN for all sports (runs every 5 minutes)."""
    logger.info("Scheduled task: Fetching live data from ESPN...")
    try:
        from app.database import async_session
        from app.services.data_service import fetch_all_sports_data

        async with async_session() as db:
            results = await fetch_all_sports_data(db)
            total = sum(r.get("matches", 0) for r in results.values())
            logger.info(f"Fetched {total} matches across all sports")
    except Exception as e:
        logger.error(f"Scheduled fetch error: {e}")


# ============================================================
# Task: Generate Article at Fixed Hour
# ============================================================

async def generate_fixed_hour_article_task():
    """
    Generate a single article at each fixed hour based on trending topics.
    Scheduled for each hour in ARTICLE_PUBLISH_FIXED_HOURS.
    """
    logger.info("Scheduled task: Generating fixed-hour article from trending topics...")
    try:
        from app.database import async_session
        from app.services.data_service import ensure_sports, ensure_authors
        from app.services.trending_service import get_trending_topics
        from app.services.ai_service import generate_article_v3
        from app.services.image_service import find_best_image_url_for_topic
        from app.models.models import Article
        from slugify import slugify
        from uuid import uuid4
        from sqlalchemy import select
        import urllib.parse

        topics = await get_trending_topics()
        if not topics:
            logger.info("No trending topics available for fixed-hour article")
            return

        async with async_session() as db:
            sports = await ensure_sports(db)
            authors = await ensure_authors(db)

            article_created = False
            for t in topics:
                topic_text = t["topic"]
                sport_slug = t["sport_slug"]
                article_slug = slugify(topic_text)[:100]

                existing = (await db.execute(
                    select(Article).where(
                        (Article.slug.like(f"{article_slug}%")) |
                        (Article.title == topic_text[:200])
                    )
                )).scalars().first()

                if existing:
                    logger.info(f"Topic '{topic_text}' already covered, checking next topic...")
                    continue

                sport = sports.get(sport_slug)
                if not sport:
                    sport = list(sports.values())[0] if sports else None
                if not sport:
                    continue

                result = await generate_article_v3(
                    topic_text, sport.name, "news",
                    sport_slug=sport_slug,
                    article_slug=article_slug,
                    db=db,
                )
                author_slug = result["author"]["slug"]
                author = authors.get(author_slug) if authors else None

                best_img = await find_best_image_url_for_topic(topic_text, sport_slug)
                seo_filename = f"{slugify(topic_text[:60])}.webp"
                encoded_title = urllib.parse.quote(topic_text[:60])
                if best_img:
                    encoded_url = urllib.parse.quote(best_img)
                    featured_img = f"{settings.BACKEND_URL}/api/v1/article-image/{seo_filename}?url={encoded_url}&sport={sport_slug}&title={encoded_title}"
                else:
                    featured_img = f"{settings.BACKEND_URL}/api/v1/article-image/{seo_filename}?sport={sport_slug}&title={encoded_title}"

                article = Article(
                    id=str(uuid4()),
                    sport_id=sport.id,
                    author_id=author.id if author else list(authors.values())[0].id,
                    title=topic_text[:200],
                    slug=article_slug,
                    excerpt=result["content"][:160] + "...",
                    content=result["content"],
                    featured_image=featured_img,
                    category=result["category"],
                    tags=sport_slug,
                    is_published=True,
                    published_at=datetime.utcnow(),
                    meta_title=result.get("meta_title", topic_text[:60]),
                    meta_description=result.get("meta_description", ""),
                    meta_tags=result.get("meta_tags", sport_slug),
                )
                db.add(article)
                article_created = True
                break

            await db.commit()
            if article_created:
                logger.info("Fixed-hour trending article generated successfully")
            else:
                logger.info("No fixed-hour article generated (all trending topics already covered)")

    except Exception as e:
        logger.error(f"Fixed-hour article generation error: {e}")


# ============================================================
# Task: Generate Random-Time Articles
# ============================================================

async def generate_random_article_task():
    """
    Generate a random-time article based on trending topics.
    Approximately 10 random articles spread across the day.
    """
    logger.info("Scheduled task: Checking for random article slot from trending topics...")
    try:
        from app.database import async_session
        from app.services.data_service import ensure_sports, ensure_authors
        from app.services.trending_service import get_trending_topics
        from app.services.ai_service import generate_article_v3
        from app.services.image_service import find_best_image_url_for_topic
        from app.models.models import Article
        from slugify import slugify
        from uuid import uuid4
        from sqlalchemy import select
        import urllib.parse

        topics = await get_trending_topics()
        if not topics:
            return

        async with async_session() as db:
            sports = await ensure_sports(db)
            authors = await ensure_authors(db)

            shuffled_topics = list(topics)
            random.shuffle(shuffled_topics)

            article_created = False
            for t in shuffled_topics:
                topic_text = t["topic"]
                sport_slug = t["sport_slug"]
                article_slug = slugify(topic_text)[:100]

                existing = (await db.execute(
                    select(Article).where(
                        (Article.slug.like(f"{article_slug}%")) |
                        (Article.title == topic_text[:200])
                    )
                )).scalars().first()

                if existing:
                    logger.info(f"Topic '{topic_text}' already covered, checking next topic...")
                    continue

                sport = sports.get(sport_slug)
                if not sport:
                    sport = list(sports.values())[0] if sports else None
                if not sport:
                    continue

                categories = ["analysis", "opinion", "feature", "power_rankings", "news"]
                category = random.choice(categories)

                result = await generate_article_v3(
                    topic_text, sport.name, category,
                    sport_slug=sport_slug,
                    article_slug=article_slug,
                    db=db,
                )
                author_slug = result["author"]["slug"]
                author = authors.get(author_slug) if authors else None

                best_img = await find_best_image_url_for_topic(topic_text, sport_slug)
                seo_filename = f"{slugify(topic_text[:60])}.webp"
                encoded_title = urllib.parse.quote(topic_text[:60])
                if best_img:
                    encoded_url = urllib.parse.quote(best_img)
                    featured_img = f"{settings.BACKEND_URL}/api/v1/article-image/{seo_filename}?url={encoded_url}&sport={sport_slug}&title={encoded_title}"
                else:
                    featured_img = f"{settings.BACKEND_URL}/api/v1/article-image/{seo_filename}?sport={sport_slug}&title={encoded_title}"

                article = Article(
                    id=str(uuid4()),
                    sport_id=sport.id,
                    author_id=author.id if author else list(authors.values())[0].id,
                    title=topic_text[:200],
                    slug=article_slug,
                    excerpt=result["content"][:160] + "...",
                    content=result["content"],
                    featured_image=featured_img,
                    category=result["category"],
                    tags=sport_slug,
                    is_published=True,
                    published_at=datetime.utcnow(),
                    meta_title=result.get("meta_title", topic_text[:60]),
                    meta_description=result.get("meta_description", ""),
                    meta_tags=result.get("meta_tags", sport_slug),
                )
                db.add(article)
                article_created = True
                break

            await db.commit()
            if article_created:
                logger.info("Random trending article generated successfully")

    except Exception as e:
        logger.error(f"Random article generation error: {e}")


# ============================================================
# Task: Trending Boost Article
# ============================================================

async def check_trending_and_boost_task():
    """
    Check for trending topics and generate a boost article if warranted.
    Max 3 trending boost articles per day.
    """
    global _trending_boost_count, _trending_boost_date

    today = datetime.utcnow().strftime("%Y-%m-%d")
    if _trending_boost_date != today:
        _trending_boost_count = 0
        _trending_boost_date = today

    if _trending_boost_count >= 3:
        logger.info("Trending boost limit reached (3/day)")
        return

    if not rate_limiter.check_limit("trending_boost"):
        logger.info("Trending boost rate limit reached")
        return

    logger.info("Scheduled task: Checking trending topics for boost...")
    try:
        from app.services.trending_service import get_trending_topics
        from app.database import async_session
        from app.services.data_service import ensure_sports, ensure_authors
        from app.services.ai_service import generate_article_v3
        from app.services.image_service import find_best_image_url_for_topic
        from app.models.models import Article
        from slugify import slugify
        from uuid import uuid4
        from sqlalchemy import select
        import urllib.parse

        topics = await get_trending_topics()
        hot_topics = [t for t in topics if t["relevance_score"] >= 7.0]

        if not hot_topics:
            logger.info("No high-relevance trending topics found")
            return

        async with async_session() as db:
            sports = await ensure_sports(db)
            authors = await ensure_authors(db)

            article_created = False
            for hot_topic in hot_topics:
                topic_text = hot_topic["topic"]
                sport_slug = hot_topic["sport_slug"]
                article_slug = slugify(topic_text)[:100]

                existing = (await db.execute(
                    select(Article).where(
                        (Article.slug.like(f"{article_slug}%")) |
                        (Article.title == topic_text[:200])
                    )
                )).scalars().first()

                if existing:
                    logger.info(f"Topic '{topic_text}' already covered, checking next topic...")
                    continue

                sport = sports.get(sport_slug)
                if not sport:
                    sport = list(sports.values())[0] if sports else None
                if not sport:
                    continue

                logger.info(f"Trending boost: '{topic_text}' (score={hot_topic['relevance_score']:.1f})")

                result = await generate_article_v3(
                    topic_text, sport.name, "news",
                    sport_slug=sport_slug,
                    article_slug=article_slug,
                    db=db,
                )
                author_slug = result["author"]["slug"]
                author = authors.get(author_slug) if authors else None

                best_img = await find_best_image_url_for_topic(topic_text, sport_slug)
                seo_filename = f"{slugify(topic_text[:60])}.webp"
                encoded_title = urllib.parse.quote(topic_text[:60])
                if best_img:
                    encoded_url = urllib.parse.quote(best_img)
                    featured_img = f"{settings.BACKEND_URL}/api/v1/article-image/{seo_filename}?url={encoded_url}&sport={sport_slug}&title={encoded_title}"
                else:
                    featured_img = f"{settings.BACKEND_URL}/api/v1/article-image/{seo_filename}?sport={sport_slug}&title={encoded_title}"

                article = Article(
                    id=str(uuid4()),
                    sport_id=sport.id,
                    author_id=author.id if author else list(authors.values())[0].id,
                    title=topic_text[:200],
                    slug=article_slug,
                    excerpt=result["content"][:160] + "...",
                    content=result["content"],
                    featured_image=featured_img,
                    category=result["category"],
                    tags=sport_slug,
                    is_published=True,
                    published_at=datetime.utcnow(),
                    meta_title=result.get("meta_title", topic_text[:60]),
                    meta_description=result.get("meta_description", ""),
                    meta_tags=result.get("meta_tags", sport_slug),
                )
                db.add(article)
                await db.commit()

                try:
                    rate_limiter.record_call("trending_boost")
                except RuntimeError:
                    pass
                _trending_boost_count += 1

                logger.info(f"Trending boost article created: '{topic_text}' (boost #{_trending_boost_count})")
                article_created = True
                break

            if not article_created:
                logger.info("No trending boost article created (all hot topics already covered)")

    except Exception as e:
        logger.error(f"Trending boost error: {e}")



# ============================================================
# Task: Generate Match Summaries
# ============================================================

async def generate_match_summaries_task():
    """
    Generate AI summaries for recently finished matches (last 24 hours ONLY).
    Runs every 6 hours. Max 50 summaries/day.
    """
    logger.info("Scheduled task: Generating match summaries...")
    try:
        from app.database import async_session
        from app.models.models import Match
        from app.services.ai_service import generate_match_summary
        from sqlalchemy import select
        from sqlalchemy.orm import selectinload

        async with async_session() as db:
            # Find finished matches from the last 24 hours without summaries
            cutoff = datetime.utcnow() - timedelta(hours=24)
            stmt = (
                select(Match)
                .where(
                    Match.status == "finished",
                    Match.match_date >= cutoff,
                )
                .options(
                    selectinload(Match.home_team),
                    selectinload(Match.away_team),
                    selectinload(Match.sport),
                )
            )

            matches = (await db.execute(stmt)).scalars().all()

            if not matches:
                logger.info("No finished matches in last 24 hours need summaries")
                return

            summary_count = 0
            for match in matches:
                # Skip if already has a summary
                if match.match_summary and len(match.match_summary) > 50:
                    continue

                home_name = match.home_team.name if match.home_team else "Home"
                away_name = match.away_team.name if match.away_team else "Away"
                sport_name = match.sport.name if match.sport else "Sports"
                venue = match.venue or ""
                date_str = match.match_date.strftime("%B %d, %Y") if match.match_date else ""

                summary = await generate_match_summary(
                    home_team=home_name,
                    away_team=away_name,
                    sport_name=sport_name,
                    home_score=match.home_score or 0,
                    away_score=match.away_score or 0,
                    venue=venue,
                    match_date=date_str,
                )

                if summary:
                    match.match_summary = summary
                    summary_count += 1

            await db.commit()
            logger.info(f"Generated {summary_count} match summaries")

    except Exception as e:
        logger.error(f"Match summary generation error: {e}")


# ============================================================
# Task: Update YouTube Videos
# ============================================================

async def update_youtube_videos_task():
    """Search and cache YouTube videos for recent matches."""
    logger.info("Scheduled task: Updating YouTube videos...")
    try:
        from app.database import async_session
        from app.services.data_service import update_youtube_videos
        from app.models.models import Match
        from sqlalchemy import select

        async with async_session() as db:
            stmt = select(Match).where(Match.youtube_video_ids == None).limit(20)
            matches = (await db.execute(stmt)).scalars().all()

            updated = 0
            for match in matches:
                try:
                    video_ids = await update_youtube_videos(db, match.id)
                    if video_ids:
                        updated += 1
                except Exception as e:
                    logger.error(f"YouTube error for match {match.id}: {e}")

            await db.commit()
            logger.info(f"Updated YouTube videos for {updated} matches")

    except Exception as e:
        logger.error(f"YouTube update error: {e}")


# ============================================================
# Task: Daily Article Generation (Legacy - v2 compat)
# ============================================================

async def generate_daily_articles_task():
    """
    Generate daily articles at the configured hour (default: 7 AM) from trending topics.
    """
    logger.info("Scheduled task: Generating daily articles from trending topics (v2 compat)...")
    try:
        from app.database import async_session
        from app.services.data_service import ensure_sports, ensure_authors
        from app.services.trending_service import get_trending_topics
        from app.services.ai_service import generate_article_v3
        from app.services.image_service import find_best_image_url_for_topic
        from app.models.models import Article
        from slugify import slugify
        from uuid import uuid4
        from sqlalchemy import select
        import urllib.parse

        topics = await get_trending_topics()
        if not topics:
            return

        async with async_session() as db:
            sports = await ensure_sports(db)
            authors = await ensure_authors(db)

            article_count = 0
            for t in topics:
                topic_text = t["topic"]
                sport_slug = t["sport_slug"]
                article_slug = slugify(topic_text)[:100]

                existing = (await db.execute(
                    select(Article).where(Article.slug == article_slug)
                )).scalar_one_or_none()

                if existing:
                    # Append date suffix to make slug unique instead of skipping
                    article_slug = f"{article_slug}-{datetime.utcnow().strftime('%m%d%H%M')}"

                sport = sports.get(sport_slug)
                if not sport:
                    sport = list(sports.values())[0] if sports else None
                if not sport:
                    continue

                categories = ["preview", "analysis", "news", "opinion"]
                category = random.choice(categories)

                result = await generate_article_v3(
                    topic_text, sport.name, category,
                    sport_slug=sport_slug,
                    article_slug=article_slug,
                    db=db,
                )
                author_slug = result["author"]["slug"]
                author = authors.get(author_slug) if authors else None

                best_img = await find_best_image_url_for_topic(topic_text, sport_slug)
                seo_filename = f"{slugify(topic_text[:60])}.webp"
                encoded_title = urllib.parse.quote(topic_text[:60])
                if best_img:
                    encoded_url = urllib.parse.quote(best_img)
                    featured_img = f"{settings.BACKEND_URL}/api/v1/article-image/{seo_filename}?url={encoded_url}&sport={sport_slug}&title={encoded_title}"
                else:
                    featured_img = f"{settings.BACKEND_URL}/api/v1/article-image/{seo_filename}?sport={sport_slug}&title={encoded_title}"

                article = Article(
                    id=str(uuid4()),
                    sport_id=sport.id,
                    author_id=author.id if author else list(authors.values())[0].id,
                    title=topic_text[:200],
                    slug=article_slug,
                    excerpt=result["content"][:160] + "...",
                    content=result["content"],
                    featured_image=featured_img,
                    category=result["category"],
                    tags=sport_slug,
                    is_published=True,
                    published_at=datetime.utcnow(),
                    meta_title=result.get("meta_title", topic_text[:60]),
                    meta_description=result.get("meta_description", ""),
                    meta_tags=result.get("meta_tags", sport_slug),
                )
                db.add(article)
                article_count += 1

                if article_count >= settings.DAILY_ARTICLE_COUNT:
                    break

            await db.commit()
            logger.info(f"Generated {article_count} daily trending articles")

    except Exception as e:
        logger.error(f"Article generation error: {e}")



# ============================================================
# Scheduler Setup
# ============================================================

def setup_scheduler():
    """Configure and start the scheduler with v3.0 scheduling logic."""
    # 1. Fetch ESPN data every 5 minutes
    scheduler.add_job(
        fetch_live_data_task,
        IntervalTrigger(minutes=settings.FETCH_INTERVAL_MINUTES),
        id="fetch_live_data",
        name="Fetch Live Data from ESPN",
        replace_existing=True,
    )

    # 2. Fixed-hour articles - one article at each fixed hour
    for hour in settings.ARTICLE_PUBLISH_FIXED_HOURS:
        scheduler.add_job(
            generate_fixed_hour_article_task,
            CronTrigger(hour=hour, minute=random.randint(0, 30)),
            id=f"fixed_article_{hour}",
            name=f"Fixed-Hour Article at {hour}:00",
            replace_existing=True,
        )

    # 3. Random-time articles - spread throughout the day
    # Generate approximately 10 random articles by running every ~2.4 hours
    # with a 42% chance of actually generating (10/24 * 1 probability)
    scheduler.add_job(
        generate_random_article_task,
        IntervalTrigger(minutes=144),  # ~2.4 hours = 144 minutes
        id="random_article",
        name="Random-Time Article Generator",
        replace_existing=True,
    )

    # 4. Trending boost - check every 2 hours
    scheduler.add_job(
        check_trending_and_boost_task,
        IntervalTrigger(hours=2),
        id="trending_boost",
        name="Trending Topic Boost",
        replace_existing=True,
    )

    # 5. Match summaries - every 6 hours
    scheduler.add_job(
        generate_match_summaries_task,
        IntervalTrigger(hours=6),
        id="match_summaries",
        name="Generate Match Summaries",
        replace_existing=True,
    )

    # 6. YouTube video updates - every 30 minutes
    scheduler.add_job(
        update_youtube_videos_task,
        IntervalTrigger(minutes=30),
        id="update_youtube_videos",
        name="Update YouTube Videos",
        replace_existing=True,
    )

    # 7. Legacy daily articles (v2 compat)
    scheduler.add_job(
        generate_daily_articles_task,
        CronTrigger(hour=settings.ARTICLE_GENERATION_HOUR, minute=0),
        id="generate_daily_articles",
        name="Generate Daily Articles (v2 compat)",
        replace_existing=True,
    )

    fixed_hours_str = ", ".join(f"{h}:00" for h in settings.ARTICLE_PUBLISH_FIXED_HOURS)
    logger.info(
        f"Scheduler configured: "
        f"data every {settings.FETCH_INTERVAL_MINUTES}min, "
        f"fixed articles at {fixed_hours_str}, "
        f"{settings.ARTICLE_PUBLISH_RANDOM_COUNT} random articles/day, "
        f"trending boost every 2h (max 3/day), "
        f"match summaries every 6h, "
        f"YouTube every 30min"
    )


def start_scheduler():
    """Start the scheduler."""
    if not scheduler.running:
        setup_scheduler()
        scheduler.start()
        logger.info("Scheduler started")


def stop_scheduler():
    """Stop the scheduler."""
    if scheduler.running:
        scheduler.shutdown()
        logger.info("Scheduler stopped")
