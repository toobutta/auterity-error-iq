#!/usr/bin/env python3
"""
SQLite Development Setup Script for Auterity AI Platform
This script sets up a SQLite database for development and testing.
"""

import sys
from pathlib import Path

# Add the backend directory to Python path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

try:
    from app.models import Base
    from sqlalchemy import create_engine, text
except ImportError as e:
    print(f"Import error: {e}")
    print("Please ensure all dependencies are installed:")
    print("pip install -r requirements.txt")
    sys.exit(1)


def setup_sqlite_database():
    """Set up SQLite database for development."""

    # Use SQLite for development
    database_url = "sqlite:///./auterity_dev.db"

    print(f"Setting up SQLite database: {database_url}")

    try:
        # Create engine
        engine = create_engine(
            database_url, echo=True, connect_args={"check_same_thread": False}
        )

        # Test connection
        with engine.connect() as conn:
            result = conn.execute(text("SELECT sqlite_version()"))
            version = result.fetchone()[0]
            print(f"✅ SQLite database connection successful!")
            print(f"SQLite version: {version}")

            return engine

    except Exception as e:
        print(f"❌ Database setup failed: {e}")
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
        triage_rule = TriageRule()
        print("✅ TriageRule model instantiated")

        vector_embedding = VectorEmbedding()
        print("✅ VectorEmbedding model instantiated")

        integration = Integration()
        print("✅ Integration model instantiated")

        return True
    except Exception as e:
        print(f"❌ Error testing models: {e}")
        return False


def test_api_endpoints():
    """Test that API endpoints can be imported."""
    try:
        from app.api.auterity_expansion import router

        print("✅ Auterity expansion API router imported successfully")

        # Check router endpoints
        routes = [route.path for route in router.routes]
        print(f"✅ Found {len(routes)} API endpoints:")
        for route in routes[:5]:  # Show first 5
            print(f"   - {route}")
        if len(routes) > 5:
            print(f"   ... and {len(routes) - 5} more")

        return True
    except Exception as e:
        print(f"❌ Error testing API endpoints: {e}")
        return False


def test_services():
    """Test that services can be imported."""
    try:
        from app.services.autonomous_agent_service import AutonomousAgentService
        from app.services.smart_triage_service import SmartTriageService
        from app.services.vector_duplicate_service import VectorDuplicateService

        print("✅ All Auterity expansion services imported successfully")

        # Test service instantiation
        triage_service = SmartTriageService()
        print("✅ SmartTriageService instantiated")

        vector_service = VectorDuplicateService()
        print("✅ VectorDuplicateService instantiated")

        agent_service = AutonomousAgentService()
        print("✅ AutonomousAgentService instantiated")

        return True
    except Exception as e:
        print(f"❌ Error testing services: {e}")
        return False


def main():
    """Main setup function."""
    print("🚀 Auterity AI Platform - SQLite Development Setup")
    print("=" * 55)

    # Test models first
    if not test_models():
        print("\n❌ Setup failed - model issues detected")
        sys.exit(1)

    # Test API endpoints
    if not test_api_endpoints():
        print("\n❌ Setup failed - API endpoint issues detected")
        sys.exit(1)

    # Test services
    if not test_services():
        print("\n❌ Setup failed - service issues detected")
        sys.exit(1)

    # Set up SQLite database
    engine = setup_sqlite_database()
    if not engine:
        print("\n❌ Setup failed - cannot create database")
        sys.exit(1)

    # Create tables
    if not create_tables(engine):
        print("\n❌ Setup failed - table creation failed")
        sys.exit(1)

    print("\n🎉 Development setup completed successfully!")
    print("\nNext steps:")
    print("1. Start the application: python -m uvicorn app.main:app --reload")
    print("2. Test the API endpoints at http://localhost:8000/docs")
    print(
        "3. Access the Auterity Expansion page at http://localhost:3000/auterity-expansion"
    )
    print(
        "\nNote: SQLite is used for development. For production, use PostgreSQL with pgvector."
    )


if __name__ == "__main__":
    main()
