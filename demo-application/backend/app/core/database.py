"""Database engine and session management.

Supports SQLAlchemy with a graceful fallback for lightweight tests.
"""

import logging
from typing import Generator

from app.core.config import settings

logger = logging.getLogger("sentinel.core.database")

_sqlalchemy_available = False
engine = None
SessionLocal = None

try:
    from sqlalchemy import create_engine, text
    from sqlalchemy.orm import declarative_base, sessionmaker

    # Configure database connection.
    connect_args = {}

    if settings.DATABASE_URL.startswith("sqlite"):
        connect_args["check_same_thread"] = False

    engine = create_engine(
        settings.DATABASE_URL,
        connect_args=connect_args,
        echo=settings.DEBUG,
        future=True,
        pool_pre_ping=True,
    )

    # Create session factory.
    SessionLocal = sessionmaker(
        autocommit=False,
        autoflush=False,
        bind=engine,
    )

    # Base class for database models.
    Base = declarative_base()

    _sqlalchemy_available = True

    logger.info("SQLAlchemy database engine initialized successfully.")

except ImportError:
    logger.warning(
        "SQLAlchemy is not installed. "
        "Database functionality is unavailable."
    )

    class _MetadataMock:
        """Fallback metadata implementation for lightweight tests."""

        def create_all(self, bind=None):
            logger.debug("Mock create_all called.")

        def drop_all(self, bind=None):
            logger.debug("Mock drop_all called.")

    class Base:
        """Fallback Base class when SQLAlchemy is unavailable."""

        metadata = _MetadataMock()


def get_db() -> Generator:
    """Provide a database session for each API request.

    Always closes the session after the request finishes.
    """

    if not _sqlalchemy_available or SessionLocal is None:
        raise RuntimeError(
            "Database unavailable: SQLAlchemy is not installed."
        )

    db = SessionLocal()

    try:
        yield db

    except Exception:
        db.rollback()
        raise

    finally:
        db.close()


def check_database_connection() -> bool:
    """Check whether the database connection is working."""

    if not _sqlalchemy_available or engine is None:
        return False

    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))

        return True

    except Exception:
        logger.exception("Database connection health check failed.")
        return False


def init_db():
    """Create database tables from registered models."""

    if not _sqlalchemy_available or engine is None:
        raise RuntimeError("Cannot initialize database: SQLAlchemy unavailable.")

    Base.metadata.create_all(bind=engine)
    logger.info("Database tables initialized successfully.")


def close_db():
    """Dispose of database connections during application shutdown."""

    if engine is not None:
        engine.dispose()
        logger.info("Database connections closed.")