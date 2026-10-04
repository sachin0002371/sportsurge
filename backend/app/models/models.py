"""
SQLAlchemy models for SportSurge v3.0
Mirrors the Prisma schema for compatibility with the Next.js frontend.
Updated with meta_title, meta_description, meta_tags for v3.0 SEO pipeline.
"""
from datetime import datetime, timezone
from sqlalchemy import (
    Column, String, Integer, Float, Boolean, DateTime, Text, ForeignKey, UniqueConstraint, TypeDecorator
)
from sqlalchemy.orm import relationship
from app.database import Base


class PrismaDateTimeField(TypeDecorator):
    """
    Custom SQLAlchemy TypeDecorator to store DateTimes as integer epoch milliseconds in SQLite,
    ensuring 100% flawless compatibility with Prisma ORM.
    Uses native DateTime for other databases (like PostgreSQL).
    """
    impl = Integer
    cache_ok = True

    def load_dialect_impl(self, dialect):
        if dialect.name == "sqlite":
            return dialect.type_descriptor(Integer)
        else:
            return dialect.type_descriptor(DateTime)

    def process_bind_param(self, value, dialect):
        if value is None:
            return None
        if isinstance(value, datetime):
            if dialect.name == "sqlite":
                return int(value.timestamp() * 1000)
            else:
                if value.tzinfo is not None:
                    return value.astimezone(timezone.utc).replace(tzinfo=None)
                return value
        if dialect.name == "sqlite" and isinstance(value, (int, float)):
            return int(value)
        return value

    def process_result_value(self, value, dialect):
        if value is None:
            return None
        if dialect.name == "sqlite":
            return datetime.fromtimestamp(value / 1000.0)
        return value


class Sport(Base):
    __tablename__ = "sports"

    id = Column(String, primary_key=True)
    slug = Column(String, unique=True, nullable=False, index=True)
    name = Column(String, nullable=False)
    icon = Column(String, default="")
    color = Column(String, default="#333333")
    is_active = Column(Boolean, default=True)
    sort_order = Column(Integer, default=0)

    teams = relationship("Team", back_populates="sport")
    matches = relationship("Match", back_populates="sport")
    articles = relationship("Article", back_populates="sport")
    standings = relationship("Standing", back_populates="sport")


class Team(Base):
    __tablename__ = "teams"

    id = Column(String, primary_key=True)
    sport_id = Column(String, ForeignKey("sports.id"), nullable=False, index=True)
    external_id = Column(String, nullable=True)
    name = Column(String, nullable=False)
    abbreviation = Column(String, nullable=False)
    slug = Column(String, nullable=False)
    city = Column(String, nullable=True)
    logo = Column(String, nullable=True)
    color = Column(String, nullable=True)
    created_at = Column(PrismaDateTimeField, default=datetime.utcnow)
    updated_at = Column(PrismaDateTimeField, default=datetime.utcnow, onupdate=datetime.utcnow)

    sport = relationship("Sport", back_populates="teams")
    home_matches = relationship("Match", foreign_keys="Match.home_team_id", back_populates="home_team")
    away_matches = relationship("Match", foreign_keys="Match.away_team_id", back_populates="away_team")
    standings = relationship("Standing", back_populates="team")

    __table_args__ = (UniqueConstraint("sport_id", "slug", name="uq_team_sport_slug"),)


class Match(Base):
    __tablename__ = "matches"

    id = Column(String, primary_key=True)
    sport_id = Column(String, ForeignKey("sports.id"), nullable=False, index=True)
    external_id = Column(String, nullable=True)
    slug = Column(String, nullable=False)
    home_team_id = Column(String, ForeignKey("teams.id"), nullable=False)
    away_team_id = Column(String, ForeignKey("teams.id"), nullable=False)
    home_score = Column(Integer, nullable=True)
    away_score = Column(Integer, nullable=True)
    status = Column(String, default="upcoming")  # upcoming, live, finished
    match_date = Column(PrismaDateTimeField, nullable=False, index=True)
    venue = Column(String, nullable=True)
    broadcast_info = Column(Text, nullable=True)  # JSON string
    match_summary = Column(Text, nullable=True)
    home_votes = Column(Integer, default=0)
    away_votes = Column(Integer, default=0)
    youtube_video_ids = Column(Text, nullable=True)  # Comma-separated YouTube IDs
    seo_content = Column(Text, nullable=True)
    created_at = Column(PrismaDateTimeField, default=datetime.utcnow)
    updated_at = Column(PrismaDateTimeField, default=datetime.utcnow, onupdate=datetime.utcnow)

    sport = relationship("Sport", back_populates="matches")
    home_team = relationship("Team", foreign_keys=[home_team_id], back_populates="home_matches")
    away_team = relationship("Team", foreign_keys=[away_team_id], back_populates="away_matches")
    votes = relationship("Vote", back_populates="match")

    __table_args__ = (UniqueConstraint("sport_id", "slug", name="uq_match_sport_slug"),)


class Standing(Base):
    __tablename__ = "standings"

    id = Column(String, primary_key=True)
    sport_id = Column(String, ForeignKey("sports.id"), nullable=False, index=True)
    team_id = Column(String, ForeignKey("teams.id"), nullable=False)
    wins = Column(Integer, default=0)
    losses = Column(Integer, default=0)
    draws = Column(Integer, default=0)
    position = Column(Integer, default=0)
    percentage = Column(Float, nullable=True)
    streak = Column(String, nullable=True)
    created_at = Column(PrismaDateTimeField, default=datetime.utcnow)
    updated_at = Column(PrismaDateTimeField, default=datetime.utcnow, onupdate=datetime.utcnow)

    sport = relationship("Sport", back_populates="standings")
    team = relationship("Team", back_populates="standings")


class Article(Base):
    __tablename__ = "articles"

    id = Column(String, primary_key=True)
    sport_id = Column(String, ForeignKey("sports.id"), nullable=True, index=True)
    author_id = Column(String, ForeignKey("authors.id"), nullable=False)
    title = Column(String, nullable=False)
    slug = Column(String, unique=True, nullable=False, index=True)
    excerpt = Column(Text, nullable=True)
    content = Column(Text, nullable=False)
    featured_image = Column(String, nullable=True)
    category = Column(String, default="analysis")
    tags = Column(String, nullable=True)
    is_published = Column(Boolean, default=False)
    published_at = Column(PrismaDateTimeField, nullable=True)
    created_at = Column(PrismaDateTimeField, default=datetime.utcnow)
    updated_at = Column(PrismaDateTimeField, default=datetime.utcnow, onupdate=datetime.utcnow)

    # v3.0 SEO metadata fields
    meta_title = Column(String, nullable=True)           # Max 60 chars
    meta_description = Column(String, nullable=True)      # Max 150 chars
    meta_tags = Column(String, nullable=True)              # Comma-separated tags

    sport = relationship("Sport", back_populates="articles")
    author = relationship("Author", back_populates="articles")


class Author(Base):
    __tablename__ = "authors"

    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    slug = Column(String, unique=True, nullable=False, index=True)
    avatar = Column(String, nullable=True)
    title = Column(String, nullable=False)
    bio = Column(Text, nullable=False)
    specialty = Column(String, nullable=False)
    social_twitter = Column(String, nullable=True)
    social_linkedin = Column(String, nullable=True)
    created_at = Column(PrismaDateTimeField, default=datetime.utcnow)
    updated_at = Column(PrismaDateTimeField, default=datetime.utcnow, onupdate=datetime.utcnow)

    articles = relationship("Article", back_populates="author")


class Vote(Base):
    __tablename__ = "votes"

    id = Column(String, primary_key=True)
    match_id = Column(String, ForeignKey("matches.id"), nullable=False, index=True)
    team_id = Column(String, nullable=False)
    ip_address = Column(String, nullable=True)
    created_at = Column(PrismaDateTimeField, default=datetime.utcnow)

    match = relationship("Match", back_populates="votes")

    __table_args__ = (UniqueConstraint("match_id", "ip_address", name="uq_vote_match_ip"),)
