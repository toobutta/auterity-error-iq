#!/usr/bin/env python3
"""
Database Setup Script for Auterity AI Platform
This script sets up the database connection and tests the models.
"""

import os
import sys
from pathlib import Path

# Add the backend directory to Python path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

try:
    from sqlalchemy import create_engine, text
    from sqlalchemy.exc import OperationalError

    from app.models import Base
except ImportError as e:
    print(f"Import error: {e}")
    print("Please ensure all dependencies are installed:")
    print("pip install -r requirements.txt")
    sys.exit(1)


def test_database_connection():
    """Test database connection and create tables."""

    # Try to get settings from environment
    database_url = os.getenv(
        "DATABASE_URL",
        "postgresql://postgres:password@localhost:5432/workflow_engine",
    )

    print(f"Attempting to connect to database: {database_url}")

    try:
        # Create engine
        engine = create_engine(database_url, echo=True)

        # Test connection
        with engine.connect() as conn:
            result = conn.execute(text("SELECT version()"))
            version = result.fetchone()[0]
            print("✅ Database connection successful!")
            print(f"PostgreSQL version: {version}")

            # Check if pgvector extension is available
            try:
                result = conn.execute(
                    text("SELECT * FROM pg_extension WHERE extname = 'vector'")
                )
                if result.fetchone():
                    print("✅ pgvector extension is available")
                else:
                    print(
                        "⚠️  pgvector extension not found - attempting to create..."
                    )
                    conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
                    conn.commit()
                    print("✅ pgvector extension created successfully")
            except Exception as e:
                print(f"⚠️  Could not create pgvector extension: {e}")
                print("This may require superuser privileges")

            return engine

    except OperationalError as e:
        print(f"❌ Database connection failed: {e}")
        print("\nTroubleshooting steps:")
        print("1. Ensure PostgreSQL is running")
        print("2. Check database credentials")
        print("3. Verify database exists")
        print("4. Check if port 5432 is accessible")
        return None
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return None


def create_tables(engine):
    """Create all tables from models."""
    try:
        print("\nCreating database tables...")
        Base.metadata.create_all(bind=engine)
        print("✅ All tables created successfully!")
        return True
    except Exception as e:
        print(f"❌ Error creating tables: {e}")
        return False


def test_models():
    """Test that models can be imported and used."""
    try:
        from app.models.auterity_expansion import (
            Integration,
            TriageRule,
            VectorEmbedding,
        )

        print("✅ Auterity expansion models imported successfully")

        # Test model attributes
        TriageRule()
        print("✅ TriageRule model instantiated")

        VectorEmbedding()
        print("✅ VectorEmbedding model instantiated")

        Integration()
        print("✅ Integration model instantiated")

        return True
    except Exception as e:
        print(f"❌ Error testing models: {e}")
        return False


def main():
    """Main setup function."""
    print("🚀 Auterity AI Platform - Database Setup")
    print("=" * 50)

    # Test database connection
    engine = test_database_connection()
    if not engine:
        print("\n❌ Setup failed - cannot connect to database")
        sys.exit(1)

    # Test models
    if not test_models():
        print("\n❌ Setup failed - model issues detected")
        sys.exit(1)

    # Create tables
    if not create_tables(engine):
        print("\n❌ Setup failed - table creation failed")
        sys.exit(1)

    print("\n🎉 Database setup completed successfully!")
    print("\nNext steps:")
    print("1. Run Alembic migrations: alembic upgrade head")
    print("2. Start the application: python -m uvicorn app.main:app --reload")
    print("3. Test the API endpoints")


if __name__ == "__main__":
    main()
