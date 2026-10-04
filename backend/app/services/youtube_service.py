"""
YouTube Highlights Service
Searches YouTube for match highlights and relevant videos.
Uses YouTube Data API v3 (requires API key) with fallback to scraping.
"""
import httpx
import logging
from typing import Optional
from app.config import settings

logger = logging.getLogger(__name__)

YOUTUBE_SEARCH_URL = "https://www.googleapis.com/youtube/v3/search"
YOUTUBE_VIDEOS_URL = "https://www.googleapis.com/youtube/v3/videos"


async def search_highlights(
    home_team: str,
    away_team: str,
    sport: str,
    max_results: int = 3,
) -> list[dict]:
    """
    Search YouTube for match highlights.
    Returns list of video data with id, title, thumbnail, etc.
    """
    if not settings.YOUTUBE_API_KEY:
        logger.warning("YouTube API key not configured, using fallback search")
        return await _fallback_search(home_team, away_team, sport)

    # Build search query
    query = f"{home_team} vs {away_team} {sport} highlights"

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(
                YOUTUBE_SEARCH_URL,
                params={
                    "part": "snippet",
                    "q": query,
                    "type": "video",
                    "maxResults": max_results,
                    "videoEmbeddable": "true",
                    "key": settings.YOUTUBE_API_KEY,
                },
            )
            response.raise_for_status()
            data = response.json()

            videos = []
            for item in data.get("items", []):
                video_id = item.get("id", {}).get("videoId")
                snippet = item.get("snippet", {})
                if not video_id:
                    continue

                thumbnails = snippet.get("thumbnails", {})
                # Get best quality thumbnail
                thumb = (
                    thumbnails.get("maxres")
                    or thumbnails.get("high")
                    or thumbnails.get("medium")
                    or thumbnails.get("default", {})
                )

                videos.append({
                    "video_id": video_id,
                    "title": snippet.get("title", ""),
                    "description": snippet.get("description", "")[:200],
                    "thumbnail": thumb.get("url", ""),
                    "channel": snippet.get("channelTitle", ""),
                    "published_at": snippet.get("publishedAt", ""),
                    "embed_url": f"https://www.youtube.com/embed/{video_id}",
                    "watch_url": f"https://www.youtube.com/watch?v={video_id}",
                })

            return videos

    except httpx.HTTPError as e:
        logger.error(f"YouTube search error: {e}")
        return await _fallback_search(home_team, away_team, sport)


async def get_video_details(video_ids: list[str]) -> list[dict]:
    """Get detailed info for specific YouTube videos."""
    if not settings.YOUTUBE_API_KEY or not video_ids:
        return []

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(
                YOUTUBE_VIDEOS_URL,
                params={
                    "part": "snippet,contentDetails,statistics",
                    "id": ",".join(video_ids),
                    "key": settings.YOUTUBE_API_KEY,
                },
            )
            response.raise_for_status()
            data = response.json()

            videos = []
            for item in data.get("items", []):
                snippet = item.get("snippet", {})
                stats = item.get("statistics", {})
                thumbnails = snippet.get("thumbnails", {})
                thumb = (
                    thumbnails.get("maxres")
                    or thumbnails.get("high")
                    or thumbnails.get("default", {})
                )

                videos.append({
                    "video_id": item.get("id"),
                    "title": snippet.get("title", ""),
                    "thumbnail": thumb.get("url", ""),
                    "views": stats.get("viewCount", "0"),
                    "likes": stats.get("likeCount", "0"),
                    "duration": item.get("contentDetails", {}).get("duration", ""),
                    "embed_url": f"https://www.youtube.com/embed/{item.get('id')}",
                })

            return videos

    except httpx.HTTPError as e:
        logger.error(f"YouTube video details error: {e}")
        return []


async def _fallback_search(home_team: str, away_team: str, sport: str) -> list[dict]:
    """
    Fallback: Generate YouTube search URLs when API key is not available.
    The frontend can use these to embed YouTube search results or show links.
    """
    query = f"{home_team} vs {away_team} {sport} highlights"
    encoded_query = httpx.URL(f"https://www.youtube.com/results?search_query={query}")

    return [{
        "video_id": None,
        "title": f"{home_team} vs {away_team} - Search Highlights on YouTube",
        "description": f"Watch {sport} highlights for {home_team} vs {away_team}",
        "thumbnail": "",
        "channel": "YouTube",
        "embed_url": None,
        "watch_url": f"https://www.youtube.com/results?search_query={home_team}+vs+{away_team}+{sport}+highlights",
        "is_fallback": True,
    }]


async def search_and_cache(
    home_team: str,
    away_team: str,
    sport: str,
) -> str:
    """
    Search YouTube and return comma-separated video IDs for caching in DB.
    """
    videos = await search_highlights(home_team, away_team, sport, max_results=2)
    video_ids = [v["video_id"] for v in videos if v.get("video_id")]
    return ",".join(video_ids) if video_ids else ""
