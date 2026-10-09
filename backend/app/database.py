"""
Database setup with SQLAlchemy async engine
Supports SQLite (development) and PostgreSQL (production)
"""
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy.pool import NullPool
from app.config import settings


from sqlalchemy import event

connect_args = {}
if "sqlite" in settings.DATABASE_URL:
    connect_args["check_same_thread"] = False
    engine = create_async_engine(
        settings.DATABASE_URL,
        echo=False,  # Disable SQL logging for performance
        connect_args=connect_args,
        pool_pre_ping=True,
        pool_recycle=300,
    )

    @event.listens_for(engine.sync_engine, "connect")
    def set_sqlite_pragma(dbapi_connection, connection_record):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA journal_mode=WAL")
        cursor.execute("PRAGMA synchronous=NORMAL")
        cursor.execute("PRAGMA busy_timeout=5000")
        cursor.close()
else:
    connect_args["ssl"] = "require"
    engine = create_async_engine(
        settings.DATABASE_URL,
        echo=False,
        connect_args=connect_args,
        poolclass=NullPool,
    )

async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


async def get_db() -> AsyncSession:
    """Dependency for getting async database sessions."""
    async with async_session() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def init_db():
    """Create all tables."""
    import app.models.models  # Ensure models are registered with Base.metadata
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
