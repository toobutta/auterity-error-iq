#!/usr/bin/env python3
"""Test script to verify database initialization works."""

import logging
import os

from app.database import get_db_session
from app.init_db import init_database
from app.models import Template
from app.models import User

# Set up logging
logging.basicConfig(level=logging.INFO)

# Use SQLite for testing
os.environ["DATABASE_URL"] = "sqlite:///test_workflow_engine.db"


def test_initialization():
    """Test database initialization."""
    print("Testing database initialization...")

    # Initialize database
    success = init_database()
    if not success:
        print("❌ Database initialization failed")
        return False

    print("✅ Database initialization successful")

    # Test that data was created
    with get_db_session() as db:
        # Check users
        user_count = db.query(User).count()
        print(f"✅ Created {user_count} users")

        # Check templates
        template_count = db.query(Template).count()
        print(f"✅ Created {template_count} templates")

        # Show some sample data
        first_user = db.query(User).first()
        if first_user:
            print(f"✅ Sample user: {first_user.email}")

        first_template = db.query(Template).first()
        if first_template:
            print(f"✅ Sample template: {first_template.name}")

    print("✅ All tests passed!")
    return True


if __name__ == "__main__":
    test_initialization()

    # Clean up test database
    if os.path.exists("test_workflow_engine.db"):
        os.remove("test_workflow_engine.db")
        print("🧹 Cleaned up test database")
