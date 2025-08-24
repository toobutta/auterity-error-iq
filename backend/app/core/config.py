"""
App settings for DB and environment config.
"""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    SQLALCHEMY_DATABASE_URL: str = (
        "postgresql+psycopg2://user:password@localhost:5432/auterity"
    )
    # Add more settings as needed


settings = Settings()


def get_settings():
    return settings
