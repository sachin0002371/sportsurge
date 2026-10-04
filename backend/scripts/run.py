#!/usr/bin/env python3
"""
SportSurge Backend - Quick Start Script
Sets up the environment, installs dependencies, seeds database, and runs the server.
"""
import subprocess
import sys
import os

def install_dependencies():
    """Install Python dependencies."""
    print("📦 Installing Python dependencies...")
    subprocess.check_call([
        sys.executable, "-m", "pip", "install", "-r", "requirements.txt", "-q"
    ])
    print("✅ Dependencies installed")


def copy_env_file():
    """Copy .env.example to .env if .env doesn't exist."""
    if not os.path.exists(".env"):
        if os.path.exists(".env.example"):
            import shutil
            shutil.copy(".env.example", ".env")
            print("✅ Created .env file from .env.example")
            print("⚠️  Please edit .env with your API keys before running the server")
        else:
            print("⚠️  No .env.example found, creating empty .env")
            with open(".env", "w") as f:
                f.write("# SportSurge Backend Environment\n")
                f.write("HOST=0.0.0.0\n")
                f.write("PORT=8000\n")
                f.write("DEBUG=true\n")
                f.write("CORS_ORIGINS=http://localhost:3000\n")
                f.write("DATABASE_URL=sqlite+aiosqlite:///./sportsurge.db\n")
    else:
        print("✅ .env file already exists")


def seed_database():
    """Seed the database with initial data."""
    print("🌱 Seeding database...")
    from scripts.seed import seed_database
    import asyncio
    asyncio.run(seed_database())
    print("✅ Database seeded")


def run_server():
    """Start the FastAPI server."""
    print("🚀 Starting SportSurge Python Backend...")
    print("📍 API: http://localhost:8000")
    print("📖 Docs: http://localhost:8000/docs")
    print("")

    import uvicorn
    from app.config import settings
    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
    )


if __name__ == "__main__":
    os.chdir(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    copy_env_file()
    install_dependencies()

    # Initialize DB and seed
    from app.database import init_db
    import asyncio
    asyncio.run(init_db())

    try:
        seed_database()
    except Exception as e:
        print(f"⚠️  Seed warning: {e}")
        print("Continuing with server startup...")

    run_server()
