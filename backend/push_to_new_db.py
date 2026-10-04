import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy import select
from sqlalchemy.pool import NullPool
from app.database import Base
from app.models.models import Sport, Author, Team, Match, Standing, Article, Vote

# The new PostgreSQL URL provided by user
RAW_NEW_URL = "postgresql://neondb_owner:npg_b0dgB9izZeHx@ep-billowing-paper-asl1j3hb-pooler.c-4.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

# Format it for SQLAlchemy asyncpg
pg_url = RAW_NEW_URL.replace("postgresql://", "postgresql+asyncpg://").replace("postgres://", "postgresql+asyncpg://")

# Clean query params for asyncpg
if "?" in pg_url:
    base_part, query_part = pg_url.split("?", 1)
    # asyncpg requires ssl=require instead of sslmode=require, and doesn't support channel_binding
    pg_url = f"{base_part}?ssl=require"
else:
    pg_url = f"{pg_url}?ssl=require"

async def push_data():
    print(f"Connecting to source SQLite database: sqlite+aiosqlite:///./sportsurge.db")
    sqlite_engine = create_async_engine("sqlite+aiosqlite:///./sportsurge.db")
    
    print(f"Connecting to target PostgreSQL: {pg_url}")
    pg_engine = create_async_engine(
        pg_url,
        echo=False,
        connect_args={"ssl": "require"},
        poolclass=NullPool
    )
    
    # Initialize schema in new Postgres DB
    print("Creating tables in the new PostgreSQL database if they don't exist...")
    async with pg_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    sqlite_session_factory = async_sessionmaker(sqlite_engine, class_=AsyncSession, expire_on_commit=False)
    pg_session_factory = async_sessionmaker(pg_engine, class_=AsyncSession, expire_on_commit=False)
    
    # Models to sync
    models = [Sport, Author, Team, Match, Standing, Article, Vote]
    
    async with sqlite_session_factory() as sqlite_session:
        async with pg_session_factory() as pg_session:
            for model in models:
                print(f"Syncing model: {model.__name__}...")
                
                # Fetch all from SQLite
                result = await sqlite_session.execute(select(model))
                items = result.scalars().all()
                print(f"Fetched {len(items)} records from SQLite.")
                
                if not items:
                    continue
                
                # Upload to Postgres
                count = 0
                for item in items:
                    attrs = {col.name: getattr(item, col.name) for col in model.__table__.columns}
                    new_item = model(**attrs)
                    pg_session.add(new_item)
                    count += 1
                    
                    # Commit in chunks of 100 to prevent timeout/memory issues
                    if count % 100 == 0:
                        await pg_session.commit()
                        print(f"Uploaded {count}/{len(items)} records of {model.__name__}...")
                
                await pg_session.commit()
                print(f"Successfully pushed all {len(items)} records of {model.__name__} to new PostgreSQL database.")
                
    print("Data push completed successfully!")

if __name__ == "__main__":
    asyncio.run(push_data())
