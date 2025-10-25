"""
Dependency utilities for FastAPI (DB session, etc).
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.config import settings

SQLALCHEMY_DATABASE_URL = settings.SQLALCHEMY_DATABASE_URL
engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# Placeholder for current user dependency
async def get_current_user():
    # This would normally validate JWT and return user
    # For now, return a mock user to prevent import errors
    return {"id": 1, "email": "admin@example.com", "is_active": True}
