"""
SportSurge v3.0 Backend Configuration
Loads from .env file with sensible defaults.
Includes multi-layer AI pipeline model configs and rate limit settings.
"""
import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env from backend directory ONLY (don't inherit from parent project)
env_path = Path(__file__).parent.parent / ".env"
load_dotenv(dotenv_path=env_path, override=False)


class Settings:
    """Application settings loaded from environment variables."""

    # Server
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "3000"))
    DEBUG: bool = os.getenv("DEBUG", "true").lower() == "true"

    # CORS
    CORS_ORIGINS: list[str] = [
        origin.strip()
        for origin in os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
    ]

    # Database
    _raw_db_url = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./sportsurge.db")
    if _raw_db_url.startswith("postgresql://") or _raw_db_url.startswith("postgres://"):
        url = _raw_db_url
        if url.startswith("postgresql://"):
            url = url.replace("postgresql://", "postgresql+asyncpg://", 1)
        elif url.startswith("postgres://"):
            url = url.replace("postgres://", "postgresql+asyncpg://", 1)
        
        # asyncpg does not support channel_binding or sslmode query parameters
        from urllib.parse import urlparse, parse_qs, urlencode, urlunparse
        parsed = urlparse(url)
        if parsed.query:
            query_params = parse_qs(parsed.query)
            query_params.pop("channel_binding", None)
            query_params.pop("sslmode", None)
            new_query = urlencode(query_params, doseq=True)
            parsed = parsed._replace(query=new_query)
            DATABASE_URL = urlunparse(parsed)
        else:
            DATABASE_URL = url
    elif _raw_db_url.startswith("sqlite://") and not _raw_db_url.startswith("sqlite+aiosqlite://"):
        DATABASE_URL = _raw_db_url.replace("sqlite://", "sqlite+aiosqlite://", 1)
    else:
        DATABASE_URL = _raw_db_url

    # AI / LLM - Primary Gemini key used for all models
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")

    # Legacy AI providers (still supported for backward compat)
    OPENROUTER_API_KEY: str = os.getenv("OPENROUTER_API_KEY", "")
    OPENROUTER_MODEL: str = os.getenv("OPENROUTER_MODEL", "google/gemini-2.0-flash-001")
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    OPENAI_MODEL: str = os.getenv("OPENAI_MODEL", "gpt-4o-mini")

    # Pexels API (free tier for fallback images)
    PEXELS_API_KEY: str = os.getenv("PEXELS_API_KEY", "")

    # YouTube
    YOUTUBE_API_KEY: str = os.getenv("YOUTUBE_API_KEY", "")

    # TheSportsDB
    THESPORTSDB_API_KEY: str = os.getenv("THESPORTSDB_API_KEY", "3")

    # Scheduler
    FETCH_INTERVAL_MINUTES: int = int(os.getenv("FETCH_INTERVAL_MINUTES", "5"))
    ARTICLE_GENERATION_HOUR: int = int(os.getenv("ARTICLE_GENERATION_HOUR", "7"))
    DAILY_ARTICLE_COUNT: int = int(os.getenv("DAILY_ARTICLE_COUNT", "15"))

    # v3.0 Article Publishing Schedule
    ARTICLE_PUBLISH_FIXED_HOURS: list[int] = [
        int(h.strip())
        for h in os.getenv("ARTICLE_PUBLISH_FIXED_HOURS", "7,9,11,13,15,17,19,21,23,1").split(",")
        if h.strip()
    ]
    ARTICLE_PUBLISH_RANDOM_COUNT: int = int(os.getenv("ARTICLE_PUBLISH_RANDOM_COUNT", "5"))

    # Frontend
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:3000")
    BACKEND_URL: str = os.getenv("BACKEND_URL", "https://backend.sportsurgeplay.com")

    # ============================================================
    # v3.0 3-Layer AI Pipeline - Model Configuration
    # ============================================================
    # Pipeline: Router -> Architect (+ SEO) -> Humanizer
    # Removed: Layer 4 (Polisher) and Layer 5 (SEO) - now in Layer 2

    # Gemini model IDs for the REST API
    MODEL_ROUTER: str = "gemma-4-31b-it"               # Layer 1: Router (1500 req/day)
    MODEL_ARCHITECT: str = "gemini-2.5-flash"           # Layer 2: Architect/Draft + SEO (20 req/day)
    MODEL_HUMANIZER: str = "gemini-3.1-flash-lite"      # Layer 3: Humanizer (500 req/day)
    MODEL_MATCH_SUMMARY: str = "gemini-3.1-flash-lite"  # Match summaries (500 req/day)

    # Rate limit model keys (for rate_limiter.py tracking)
    RATE_LIMIT_MODELS = {
        "gemini-2.5-flash": 20,         # 20/day - most constrained (Layer 2: Architect)
        "gemini-3.1-flash-lite": 450,    # 500/day minus buffer (Layer 3: Humanizer + Match Summary)
        "gemma-4-31b-it": 1400,          # 1500/day minus buffer (Layer 1: Router)
        "match_summary": 50,             # Match summary specific limit
        "trending_boost": 3,             # Max trending boost articles per day
    }

    # Gemini API base URL
    GEMINI_API_BASE: str = "https://generativelanguage.googleapis.com/v1beta/models"

    # Pexels API base URL
    PEXELS_API_BASE: str = "https://api.pexels.com/v1"

    @property
    def ai_provider(self) -> str:
        """Determine which AI provider to use based on available keys."""
        if self.GEMINI_API_KEY:
            return "gemini"
        if self.OPENROUTER_API_KEY:
            return "openrouter"
        if self.OPENAI_API_KEY:
            return "openai"
        return "fallback"

    @property
    def youtube_available(self) -> bool:
        return bool(self.YOUTUBE_API_KEY)

    @property
    def pexels_available(self) -> bool:
        return bool(self.PEXELS_API_KEY)


settings = Settings()
