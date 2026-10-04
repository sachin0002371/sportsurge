import asyncio
import os
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy import select
from app.config import settings
from app.database import Base
from app.models.models import Sport, Author, Team, Match, Standing, Article, Vote

async def migrate():
    # Source (Postgres) engine
    from app.database import engine as pg_engine
    
    # Dest (SQLite) engine
    sqlite_url = "sqlite+aiosqlite:///./sportsurge.db"
    print(f"Creating local SQLite engine: {sqlite_url}")
    sqlite_engine = create_async_engine(sqlite_url)
    
    # Recreate tables in SQLite
    async with sqlite_engine.begin() as conn:
        print("Dropping existing tables in SQLite...")
        await conn.run_sync(Base.metadata.drop_all)
        print("Creating fresh tables in SQLite...")
        await conn.run_sync(Base.metadata.create_all)
        
    pg_session_factory = async_sessionmaker(pg_engine, class_=AsyncSession, expire_on_commit=False)
    sqlite_session_factory = async_sessionmaker(sqlite_engine, class_=AsyncSession, expire_on_commit=False)
    
    # List of models in dependency order
    models = [Sport, Author, Team, Match, Standing, Article, Vote]
    
    async with pg_session_factory() as pg_session:
        async with sqlite_session_factory() as sqlite_session:
            for model in models:
                print(f"Syncing model: {model.__name__}...")
                result = await pg_session.execute(select(model))
                items = result.scalars().all()
                print(f"Fetched {len(items)} records from Postgres.")
                
                # Copy attributes into new instances for SQLite
                for item in items:
                    attrs = {col.name: getattr(item, col.name) for col in model.__table__.columns}
                    new_item = model(**attrs)
                    sqlite_session.add(new_item)
                
                await sqlite_session.commit()
                print(f"Committed {len(items)} records of {model.__name__} to SQLite.")
                
    print("Migration complete!")

if __name__ == "__main__":
    asyncio.run(migrate())
