"""
Start script for the SportSurge Python Backend
Handles dependency check, DB init, and server startup.
"""
import sys
import os
import asyncio

# Change to backend directory
os.chdir(os.path.dirname(os.path.abspath(__file__)))


def check_dependencies():
    """Check if required packages are installed."""
    required = [
        ("fastapi", "fastapi"),
        ("uvicorn", "uvicorn"),
        ("sqlalchemy", "sqlalchemy"),
        ("aiosqlite", "aiosqlite"),
        ("httpx", "httpx"),
        ("pydantic", "pydantic"),
        ("pydantic_settings", "pydantic-settings"),
        ("slugify", "python-slugify"),
        ("dotenv", "python-dotenv"),
    ]
    missing = []
    for module, package in required:
        try:
            __import__(module)
        except ImportError:
            missing.append(package)

    if missing:
        print(f"❌ Missing packages: {', '.join(missing)}")
        print(f"Run: pip install {' '.join(missing)}")
        return False
    return True


def ensure_env():
    """Ensure .env file exists."""
    if not os.path.exists(".env"):
        if os.path.exists(".env.example"):
            import shutil
            shutil.copy(".env.example", ".env")
            print("✅ Created .env from .env.example")
        else:
            print("⚠️  No .env file found. Using defaults.")


def main():
    print("🏆 SportSurge Python Backend")
    print("=" * 40)

    # Log environment variables (masked) to debug Dokploy injection
    import os
    print("📋 System Environment Variables:")
    for key, value in os.environ.items():
        if "KEY" in key or "PASSWORD" in key or "SECRET" in key or "URL" in key:
            # Mask sensitive values
            masked_val = value[:15] + "..." if len(value) > 15 else "..."
            print(f"  - {key}: {masked_val}")
        else:
            print(f"  - {key}: {value}")
    print("=" * 40)

    if not check_dependencies():
        sys.exit(1)

    ensure_env()

    # Set Windows selector event loop policy to avoid "Event loop is closed" errors with SSL
    import platform
    if platform.system() == "Windows":
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

    # Start server
    print("\n🚀 Starting server...")
    print("📍 API: http://localhost:3000")
    print("📖 Docs: http://localhost:3000/docs")
    print("🔑 Endpoints: /api/v1/*")
    print("")

    import uvicorn
    from app.config import settings
    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=False,
        timeout_keep_alive=60,
        log_level="info",
    )


if __name__ == "__main__":
    main()
