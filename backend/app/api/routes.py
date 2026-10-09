"""
SportSurge API Routes v3.0
All REST API endpoints including new v3.0 endpoints.
"""
import io
import logging
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.services.data_service import (
    fetch_and_store_matches,
    fetch_and_store_standings,
    fetch_all_sports_data,
    fetch_team_logos_from_thesportsdb,
    update_youtube_videos,
    ensure_sports,
    ensure_authors,
    ensure_initial_articles,
    get_matches,
    get_match_by_slug,
    get_articles,
    get_article_by_slug,
    get_standings,
    record_vote,
)
from app.services.ai_service import generate_article, generate_article_v3, generate_match_summary, AUTHOR_PROFILES, extract_embed_urls
from app.services.espn_service import ESPN_SPORT_MAPPING
from app.services.rate_limiter import rate_limiter
from app.config import settings

logger = logging.getLogger(__name__)

router = APIRouter()


# ==================== Health & Info ====================

@router.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "ok",
        "service": "SportSurge Python Backend",
        "version": "3.0.0",
        "ai_provider": settings.ai_provider,
        "youtube_available": settings.youtube_available,
        "pexels_available": settings.pexels_available,
        "espn_sports": list(ESPN_SPORT_MAPPING.keys()),
    }


# ==================== Data Fetching ====================

@router.api_route("/fetch-data", methods=["GET", "POST"])
async def fetch_data(
    sport: Optional[str] = Query(None, description="Specific sport slug to fetch"),
    db: AsyncSession = Depends(get_db),
):
    """
    Fetch latest data from ESPN API and store in database.
    If sport is specified, only fetch that sport.
    Otherwise, fetch all supported sports.
    """
    if sport:
        if sport not in ESPN_SPORT_MAPPING:
            raise HTTPException(400, f"Sport '{sport}' not supported by ESPN API")
        result = await fetch_and_store_matches(db, sport)
        return {"success": True, "results": {sport: result}}

    results = await fetch_all_sports_data(db)
    total_matches = sum(r.get("matches", 0) for r in results.values())
    return {
        "success": True,
        "results": results,
        "total_matches": total_matches,
    }


@router.post("/fetch-standings/{sport_slug}")
async def fetch_standings_endpoint(
    sport_slug: str,
    db: AsyncSession = Depends(get_db),
):
    """Fetch and store standings for a specific sport."""
    result = await fetch_and_store_standings(db, sport_slug)
    return {"success": True, "result": result}


@router.post("/update-logos/{sport_slug}")
async def update_logos(
    sport_slug: str,
    db: AsyncSession = Depends(get_db),
):
    """Update team logos from TheSportsDB for better quality images."""
    count = await fetch_team_logos_from_thesportsdb(db, sport_slug)
    return {"success": True, "sport": sport_slug, "logos_updated": count}


@router.post("/update-youtube/{match_id}")
async def update_youtube(
    match_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Search and cache YouTube video IDs for a specific match."""
    video_ids = await update_youtube_videos(db, match_id)
    if video_ids is None:
        raise HTTPException(404, "Match not found")
    return {"success": True, "match_id": match_id, "video_ids": video_ids}


# ==================== Matches ====================

@router.get("/matches")
async def list_matches(
    sport: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=200),
    page: int = Query(1, ge=1),
    db: AsyncSession = Depends(get_db),
):
    """Get matches with optional filtering."""
    return await get_matches(db, sport, status, limit, page)


@router.get("/matches/{slug}")
async def get_match(
    slug: str,
    db: AsyncSession = Depends(get_db),
):
    """Get a single match by slug."""
    match = await get_match_by_slug(db, slug)
    if not match:
        raise HTTPException(404, "Match not found")
    return match


@router.get("/live")
async def get_live_matches(
    db: AsyncSession = Depends(get_db),
):
    """Get all currently live matches across all sports."""
    return await get_matches(db, status="live", limit=50)


@router.get("/upcoming")
async def get_upcoming_matches(
    sport: Optional[str] = Query(None),
    limit: int = Query(20),
    db: AsyncSession = Depends(get_db),
):
    """Get upcoming matches."""
    return await get_matches(db, sport=sport, status="upcoming", limit=limit)


@router.get("/finished")
async def get_finished_matches(
    sport: Optional[str] = Query(None),
    limit: int = Query(20),
    db: AsyncSession = Depends(get_db),
):
    """Get finished/recently completed matches."""
    return await get_matches(db, sport=sport, status="finished", limit=limit)


# ==================== Standings ====================

@router.get("/standings/{sport_slug}")
async def get_sport_standings(
    sport_slug: str,
    db: AsyncSession = Depends(get_db),
):
    """Get standings for a specific sport."""
    standings = await get_standings(db, sport_slug)
    return {"standings": standings, "sport": sport_slug}


# ==================== Articles ====================

@router.get("/articles")
async def list_articles(
    sport: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    limit: int = Query(12, ge=1, le=100),
    page: int = Query(1, ge=1),
    db: AsyncSession = Depends(get_db),
):
    """Get published articles."""
    return await get_articles(db, sport, limit, page)


@router.get("/articles/{slug}")
async def get_article(
    slug: str,
    db: AsyncSession = Depends(get_db),
):
    """Get a single article by slug."""
    article = await get_article_by_slug(db, slug)
    if not article:
        raise HTTPException(404, "Article not found")
    return article


@router.api_route("/seed-articles", methods=["GET", "POST"])
async def seed_articles_endpoint(
    db: AsyncSession = Depends(get_db),
):
    """Seed initial high-quality sports articles across all sports."""
    count = await ensure_initial_articles(db)
    return {"success": True, "articles_seeded": count}


@router.post("/generate-article")
async def generate_article_endpoint(
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """
    Generate an AI article for a given sport and topic (v2 compat).
    Body: { "sport": "nba", "topic": "Lakers vs Warriors preview", "category": "preview" }
    """
    body = await request.json()
    sport_slug = body.get("sport")
    topic = body.get("topic")
    category = body.get("category")

    if not sport_slug or not topic:
        raise HTTPException(400, "sport and topic are required")

    authors = await ensure_authors(db)
    sports = await ensure_sports(db)
    sport = sports.get(sport_slug)
    if not sport:
        raise HTTPException(404, f"Sport '{sport_slug}' not found")

    result = await generate_article(topic, sport.name, category)

    author_slug = result["author"]["slug"]
    from app.models.models import Author as AuthorModel
    from sqlalchemy import select
    author = (await db.execute(
        select(AuthorModel).where(AuthorModel.slug == author_slug)
    )).scalar_one_or_none()

    if not author:
        raise HTTPException(500, "Author not found in database")

    from app.models.models import Article as ArticleModel
    from slugify import slugify
    from uuid import uuid4
    from datetime import datetime

    article_slug = slugify(topic)[:100]
    existing = (await db.execute(
        select(ArticleModel).where(ArticleModel.slug == article_slug)
    )).scalar_one_or_none()
    if existing:
        article_slug = f"{article_slug}-{int(datetime.now().timestamp())}"

    article = ArticleModel(
        id=str(uuid4()),
        sport_id=sport.id,
        author_id=author.id,
        title=topic[:200],
        slug=article_slug,
        excerpt=result["content"][:160] + "...",
        content=result["content"],
        featured_image=f"https://picsum.photos/seed/{article_slug}/1200/630",
        category=result["category"],
        tags=sport_slug,
        is_published=True,
        published_at=datetime.utcnow(),
        meta_title=result.get("meta_title", topic[:60]),
        meta_description=result.get("meta_description", ""),
        meta_tags=result.get("meta_tags", sport_slug),
    )
    db.add(article)
    await db.commit()

    return {
        "success": True,
        "article": {
            "id": article.id,
            "slug": article.slug,
            "title": article.title,
            "category": article.category,
            "author": result["author"]["name"],
            "provider": result["provider_used"],
            "pipeline_version": result.get("pipeline_version", "2.0"),
        },
    }


# ==================== v3.0: Generate Article with Multi-Layer Pipeline ====================

@router.post("/generate-article-v3")
async def generate_article_v3_endpoint(
    request: Request,
):
    """
    Generate an AI article using the v3.0 multi-layer pipeline.
    Body: { "sport": "nba", "topic": "Lakers vs Warriors preview", "category": "preview" }

    Pipeline layers:
    1. Router - Assign writer persona
    2. Architect - Write 700-word draft
    3. Humanizer - Split & humanize chunks
    4. Polisher - Grammar & flow check
    5. SEO - Generate meta title, description, tags
    """
    try:
        body = await request.json()
    except Exception:
        raise HTTPException(400, "Invalid JSON body")

    sport_slug = body.get("sport")
    topic = body.get("topic")
    category = body.get("category")

    if not sport_slug or not topic:
        raise HTTPException(400, "sport and topic are required")

    if not settings.GEMINI_API_KEY:
        raise HTTPException(400, "GEMINI_API_KEY required for v3 pipeline")

    try:
        from app.database import async_session
        from app.models.models import Author as AuthorModel, Article as ArticleModel
        from sqlalchemy import select
        from slugify import slugify
        from uuid import uuid4
        from datetime import datetime

        # Step 1: Quickly get sport and author info, then close DB session so it doesn't stay open during 85s AI generation
        async with async_session() as db:
            authors = await ensure_authors(db)
            sports = await ensure_sports(db)
            sport = sports.get(sport_slug)
            if not sport:
                raise HTTPException(404, f"Sport '{sport_slug}' not found")
            sport_name = sport.name
            sport_id = sport.id

        # Step 2: Pre-compute the article slug so internal linking can exclude the current article
        article_slug = slugify(topic)[:100]

        # Step 3: Run v3 pipeline — internal linking queries the DB for related articles
        logger.info(f"Starting v3 pipeline for sport={sport_slug}, topic={topic}")
        async with async_session() as link_db:
            result = await generate_article_v3(
                topic, sport_name, category,
                sport_slug=sport_slug,
                article_slug=article_slug,
                db=link_db,
            )
        author_slug = result["author"]["slug"]

        # Step 4: Open a fresh DB transaction to insert the article safely
        async with async_session() as fresh_db:
            author = (await fresh_db.execute(
                select(AuthorModel).where(AuthorModel.slug == author_slug)
            )).scalar_one_or_none()

            if not author:
                raise HTTPException(500, f"Author '{author_slug}' not found in database")

            existing = (await fresh_db.execute(
                select(ArticleModel).where(ArticleModel.slug == article_slug)
            )).scalar_one_or_none()
            if existing:
                article_slug = f"{article_slug}-{int(datetime.now().timestamp())}"

            from app.services.image_service import find_best_image_url_for_topic
            import urllib.parse
            best_image_url = await find_best_image_url_for_topic(topic, sport_slug)
            seo_filename = f"{slugify(topic[:60])}.webp"
            encoded_title = urllib.parse.quote(topic[:60])
            if best_image_url:
                encoded_url = urllib.parse.quote(best_image_url)
                featured_img = f"{settings.BACKEND_URL}/api/v1/article-image/{seo_filename}?url={encoded_url}&sport={sport_slug}&title={encoded_title}"
            else:
                featured_img = f"{settings.BACKEND_URL}/api/v1/article-image/{seo_filename}?sport={sport_slug}&title={encoded_title}"

            article = ArticleModel(
                id=str(uuid4()),
                sport_id=sport_id,
                author_id=author.id,
                title=topic[:200],
                slug=article_slug,
                excerpt=result["content"][:160] + "...",
                content=result["content"],
                featured_image=featured_img,
                category=result["category"],
                tags=sport_slug,
                is_published=True,
                published_at=datetime.utcnow(),
                meta_title=result.get("meta_title", topic[:60]),
                meta_description=result.get("meta_description", ""),
                meta_tags=result.get("meta_tags", sport_slug),
            )
            fresh_db.add(article)
            await fresh_db.commit()

        logger.info(f"Article generated successfully: {article.slug} ({result.get('word_count', 0)} words)")

        return {
            "success": True,
            "article": {
                "id": article.id,
                "slug": article.slug,
                "title": article.title,
                "category": article.category,
                "author": result["author"]["name"],
                "author_persona": result["author"]["persona_name"],
                "provider": result["provider_used"],
                "pipeline_version": result.get("pipeline_version", "3.0"),
                "word_count": result.get("word_count", 0),
                "meta_title": result.get("meta_title", ""),
                "meta_description": result.get("meta_description", ""),
                "meta_tags": result.get("meta_tags", ""),
            },
        }
    except HTTPException:
        raise  # Re-raise HTTPExceptions as-is
    except Exception as e:
        logger.error(f"generate-article-v3 endpoint error: {e}", exc_info=True)
        raise HTTPException(500, f"Article generation failed: {str(e)}")


# ==================== v3.0: Generate Match Summaries ====================

@router.api_route("/generate-summaries", methods=["GET", "POST"])
async def generate_summaries_endpoint(
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """
    Generate AI summaries for last-24h finished matches.
    Uses Gemini 3.1 Flash Lite (abundant quota).
    Rate limit: max 50 summaries/day.
    """
    from app.models.models import Match
    from sqlalchemy import select
    from sqlalchemy.orm import selectinload
    from datetime import datetime, timedelta

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
        return {
            "success": True,
            "message": "No finished matches in last 24 hours",
            "summaries_generated": 0,
        }

    summaries_generated = 0
    errors = 0

    for match in matches:
        # Skip if already has a good summary
        if match.match_summary and len(match.match_summary) > 50:
            continue

        home_name = match.home_team.name if match.home_team else "Home"
        away_name = match.away_team.name if match.away_team else "Away"
        sport_name = match.sport.name if match.sport else "Sports"

        summary = await generate_match_summary(
            home_team=home_name,
            away_team=away_name,
            sport_name=sport_name,
            home_score=match.home_score or 0,
            away_score=match.away_score or 0,
            venue=match.venue or "",
            match_date=match.match_date.strftime("%B %d, %Y") if match.match_date else "",
        )

        if summary:
            match.match_summary = summary
            summaries_generated += 1
        else:
            errors += 1

    await db.commit()

    return {
        "success": True,
        "matches_checked": len(matches),
        "summaries_generated": summaries_generated,
        "errors": errors,
    }


# ==================== v3.0: Trending Topics ====================

@router.get("/trending")
async def get_trending_endpoint(
    sport: Optional[str] = Query(None, description="Filter by sport slug"),
    limit: int = Query(20, ge=1, le=100),
    force_refresh: bool = Query(False, description="Force refresh from sources"),
):
    """
    Get current trending sports topics.
    Sources: Google Trends, ESPN RSS, BBC Sport RSS.
    Results cached for 30 minutes.
    """
    from app.services.trending_service import get_trending_topics, get_trending_for_sport

    if sport:
        topics = await get_trending_for_sport(sport, limit)
    else:
        topics = await get_trending_topics(force_refresh=force_refresh)
        topics = topics[:limit]

    return {
        "success": True,
        "topics": topics,
        "count": len(topics),
        "sport_filter": sport,
    }


# ==================== v3.0: Process Image ====================

@router.post("/process-image")
async def process_image_endpoint(
    request: Request,
):
    """
    Process an image: resize to 1200x675, convert to WebP, add matte overlay.
    Body: { "image_url": "...", "title": "Match Title", "subtitle": "Sport Name" }
    OR Body: { "sport": "nba", "title": "Lakers vs Warriors" } (uses Pexels fallback)
    Returns WebP image bytes.
    """
    from app.services.image_service import process_image_from_url, get_processed_sport_image

    body = await request.json()
    image_url = body.get("image_url")
    sport_slug = body.get("sport", "")
    title = body.get("title", "")
    subtitle = body.get("subtitle", "")

    processed_bytes = None

    if image_url:
        # Process from URL
        processed_bytes = await process_image_from_url(image_url, title, subtitle)
    elif sport_slug:
        # Get Pexels fallback image for sport
        processed_bytes = await get_processed_sport_image(sport_slug, title)

    if not processed_bytes:
        raise HTTPException(400, "Failed to process image. Provide image_url or sport slug.")

    return StreamingResponse(
        io.BytesIO(processed_bytes),
        media_type="image/webp",
        headers={
            "Content-Disposition": "inline; filename=processed.webp",
            "Cache-Control": "public, max-age=86400",
        },
    )


@router.get("/article-image/{filename}")
@router.get("/article-image")
async def get_article_image_endpoint(
    filename: Optional[str] = None,
    url: Optional[str] = Query(None, description="Image URL to process"),
    sport: Optional[str] = Query(None, description="Sport slug for fallback"),
    title: Optional[str] = Query("", description="Title overlay"),
    subtitle: Optional[str] = Query("", description="Subtitle overlay"),
):
    """
    GET endpoint to serve processed WebP images directly to frontend <img src="..." /> tags.
    """
    from app.services.image_service import process_image_from_url, get_processed_sport_image

    processed_bytes = None

    if url:
        processed_bytes = await process_image_from_url(url, title, subtitle)
    elif sport:
        processed_bytes = await get_processed_sport_image(sport, title)

    if not processed_bytes:
        if sport:
            processed_bytes = await get_processed_sport_image(sport, title)
        if not processed_bytes:
            raise HTTPException(400, "Failed to process image")

    disp_filename = filename if filename else "processed.webp"

    return StreamingResponse(
        io.BytesIO(processed_bytes),
        media_type="image/webp",
        headers={
            "Content-Disposition": f'inline; filename="{disp_filename}"',
            "Cache-Control": "public, max-age=86400",
        },
    )



# ==================== v3.0: Check Rate Limits ====================

@router.get("/check-rate-limits")
async def check_rate_limits():
    """
    Check remaining API quotas for all models.
    Returns current usage and remaining calls per model per day.
    """
    limits = rate_limiter.get_all_limits()
    return {
        "success": True,
        "rate_limits": limits,
        "gemini_configured": bool(settings.GEMINI_API_KEY),
        "pexels_configured": bool(settings.PEXELS_API_KEY),
    }


# ==================== v3.0: Extract Embed URLs ====================

@router.post("/extract-embeds")
async def extract_embeds_endpoint(
    request: Request,
):
    """
    Extract tweet/Instagram URLs from HTML content.
    Filters for verified/big accounts only (ESPN, Shams, etc.)
    Body: { "html": "<html>..." }
    """
    body = await request.json()
    html_content = body.get("html", "")

    if not html_content:
        raise HTTPException(400, "html content is required")

    embeds = extract_embed_urls(html_content)

    return {
        "success": True,
        "embeds": embeds,
        "count": len(embeds),
    }


# ==================== Votes ====================

@router.post("/vote")
async def vote_endpoint(
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """Record a vote for a match team."""
    body = await request.json()
    match_id = body.get("matchId")
    team_id = body.get("teamId")

    if not match_id or not team_id:
        raise HTTPException(400, "matchId and teamId are required")

    forwarded = request.headers.get("x-forwarded-for")
    ip = forwarded.split(",")[0] if forwarded else request.client.host if request.client else "unknown"

    result = await record_vote(db, match_id, team_id, ip)
    if "error" in result:
        raise HTTPException(404, result["error"])

    return result


# ==================== Sports ====================

@router.get("/sports")
async def list_sports(db: AsyncSession = Depends(get_db)):
    """Get all active sports."""
    sports = await ensure_sports(db)
    return {
        "sports": [
            {
                "id": s.id,
                "slug": s.slug,
                "name": s.name,
                "icon": s.icon,
                "color": s.color,
                "isActive": s.is_active,
                "sortOrder": s.sort_order,
            }
            for s in sports.values()
        ]
    }


# ==================== Authors ====================

@router.get("/authors")
async def list_authors(db: AsyncSession = Depends(get_db)):
    """Get all author profiles."""
    authors = await ensure_authors(db)
    return {
        "authors": [
            {
                "id": a.id,
                "name": a.name,
                "slug": a.slug,
                "avatar": a.avatar,
                "title": a.title,
                "bio": a.bio,
                "specialty": a.specialty,
                "socialTwitter": a.social_twitter,
                "socialLinkedin": a.social_linkedin,
            }
            for a in authors.values()
        ]
    }


# ==================== SEO Content ====================

@router.post("/generate-seo/{match_id}")
async def generate_seo_for_match(
    match_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Generate and store SEO content for a match page."""
    from app.models.models import Match as MatchModel
    from sqlalchemy.orm import selectinload
    from sqlalchemy import select

    stmt = select(MatchModel).where(MatchModel.id == match_id).options(
        selectinload(MatchModel.home_team),
        selectinload(MatchModel.away_team),
        selectinload(MatchModel.sport),
    )
    match = (await db.execute(stmt)).scalar_one_or_none()
    if not match:
        raise HTTPException(404, "Match not found")

    from app.services.data_service import generate_match_seo_content

    seo = await generate_match_seo_content(
        home_team={"name": match.home_team.name, "city": match.home_team.city},
        away_team={"name": match.away_team.name, "city": match.away_team.city},
        sport={"name": match.sport.name},
        venue=match.venue,
        match_date=match.match_date,
        status=match.status,
        home_score=match.home_score or 0,
        away_score=match.away_score or 0,
    )

    match.seo_content = seo
    await db.commit()

    return {"success": True, "seo_content": seo, "word_count": len(seo.split())}


# ==================== Bulk Operations ====================

@router.post("/seed-database")
async def seed_database(db: AsyncSession = Depends(get_db)):
    """Seed the database with initial sports, authors, and sample data."""
    from scripts.seed import seed_database as _seed
    await _seed(db)
    return {"success": True, "message": "Database seeded successfully"}


@router.post("/batch-youtube")
async def batch_update_youtube(
    sport: Optional[str] = Query(None),
    limit: int = Query(10),
    db: AsyncSession = Depends(get_db),
):
    """Search and cache YouTube videos for multiple matches."""
    from app.models.models import Match as MatchModel
    from sqlalchemy import select

    stmt = select(MatchModel)
    if sport:
        sports = await ensure_sports(db)
        s = sports.get(sport)
        if s:
            stmt = stmt.where(MatchModel.sport_id == s.id)
    stmt = stmt.where(MatchModel.youtube_video_ids == None).limit(limit)

    matches = (await db.execute(stmt)).scalars().all()
    updated = 0

    for match in matches:
        try:
            video_ids = await update_youtube_videos(db, match.id)
            if video_ids:
                updated += 1
        except Exception as e:
            logger.error(f"YouTube update error for match {match.id}: {e}")

    return {"success": True, "matches_checked": len(matches), "videos_updated": updated}


# Need datetime import for article generation
from datetime import datetime
