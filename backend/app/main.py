"""
SportSurge Python Backend v3.0 - Main Application
FastAPI application with all routes, CORS, and scheduler.
Scheduler is ENABLED by default in v3.0.
"""
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.database import init_db
from app.api.routes import router
from app.scheduler.sse import router as sse_router
from app.scheduler.tasks import start_scheduler, stop_scheduler

# Configure logging
logging.basicConfig(
    level=logging.DEBUG if settings.DEBUG else logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan: startup and shutdown events."""
    # Startup
    logger.info("Starting SportSurge Python Backend v3.0...")
    
    # Mask database password for logging
    db_url = settings.DATABASE_URL
    if "@" in db_url:
        try:
            prefix, rest = db_url.split("@", 1)
            scheme, auth = prefix.split("://", 1)
            user = auth.split(":", 1)[0]
            masked_url = f"{scheme}://{user}:*****@{rest}"
        except Exception:
            masked_url = "[Masked PostgreSQL URL]"
    else:
        masked_url = db_url
        
    logger.info(f"Connecting to database: {masked_url}")
    await init_db()
    logger.info("Database initialized")

    # Seed default data
    from app.database import async_session
    from app.services.data_service import ensure_sports, ensure_authors, ensure_initial_articles
    async with async_session() as db:
        await ensure_sports(db)
        await ensure_authors(db)
        await ensure_initial_articles(db)
        logger.info("Default sports, authors, and initial articles verified/seeded")

    # Start scheduler (ENABLED by default in v3.0)
    try:
        start_scheduler()
        logger.info("Scheduler started - v3.0 multi-layer pipeline active")
    except Exception as e:
        logger.warning(f"Scheduler failed to start: {e}")

    yield

    # Shutdown
    stop_scheduler()
    logger.info("SportSurge Python Backend v3.0 stopped")


# Create FastAPI app
app = FastAPI(
    title="SportSurge API",
    description="Python backend for SportSurge v3.0 - Live scores, multi-layer AI articles, trending topics, and sports data",
    version="3.0.0",
    lifespan=lifespan,
)

# CORS middleware - allow frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global exception handler - return JSON for all unhandled exceptions
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Return JSON error response instead of plain text 'Internal Server Error'."""
    logger.error(f"Unhandled exception on {request.method} {request.url.path}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "detail": f"Internal server error: {str(exc)}",
            "path": request.url.path,
            "method": request.method,
        },
    )


# Include API routes
app.include_router(router, prefix="/api/v1", tags=["SportSurge API v3.0"])
app.include_router(sse_router, prefix="/api/v1", tags=["Real-time Events"])


@app.get("/")
async def root():
    """Root endpoint with API info."""
    return {
        "service": "SportSurge Python Backend",
        "version": "3.0.0",
        "docs": "/docs",
        "api": "/api/v1",
        "health": "/api/v1/health",
        "new_endpoints": {
            "generate_article_v3": "POST /api/v1/generate-article-v3",
            "generate_summaries": "POST /api/v1/generate-summaries",
            "trending": "GET /api/v1/trending",
            "process_image": "POST /api/v1/process-image",
            "check_rate_limits": "GET /api/v1/check-rate-limits",
            "extract_embeds": "POST /api/v1/extract-embeds",
        },
    }


# For direct execution
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
    )
