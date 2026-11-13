"""Database engine and session management.

Supports SQLAlchemy when installed, with graceful mock fallback for zero-dependency test.
"""

import logging
from app.core.config import settings

logger = logging.getLogger("sentinel.core.database")

try:
    from sqlalchemy import create_engine
    from sqlalchemy.orm import declarative_base, sessionmaker

    connect_args = {}
    if settings.DATABASE_URL.startswith("sqlite"):
        connect_args["check_same_thread"] = False

    engine = create_engine(
        settings.DATABASE_URL,
        connect_args=connect_args,
        echo=settings.DEBUG,
        future=True,
    )
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    Base = declarative_base()
    _sqlalchemy_available = True

except ImportError:
    logger.warning("SQLAlchemy not installed yet. Running with in-memory metadata mock.")
    engine = None
    SessionLocal = None

    class Base:
        metadata = type("MetadataMock", (), {"create_all": lambda bind: None})()

    _sqlalchemy_available = False


def get_db():
    """Dependency for providing database sessions per request."""
    if not _sqlalchemy_available or SessionLocal is None:
        yield None
        return
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
