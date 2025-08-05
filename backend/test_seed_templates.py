#!/usr/bin/env python3
"""Test script for seed templates functionality."""

import asyncio
import os
import sys

from app.database import SessionLocal
from app.models import Template
from seed_templates import seed_templates

# Add the app directory to the Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "app"))


async def test_seed_templates():
    """Test the seed templates functionality."""
    print("🌱 Testing Seed Templates...")

    db = SessionLocal()

    try:
        # Get initial count
        initial_count = db.query(Template).count()
        print(f"Initial template count: {initial_count}")

        # Run seed templates
        await seed_templates()

        # Get final count
        final_count = db.query(Template).count()
        print(f"Final template count: {final_count}")

        # Check if templates were created
        if final_count > initial_count:
            print(
                f"✅ Successfully created "
                f"{final_count - initial_count} new templates"
            )
        else:
            print("ℹ️ No new templates created (may already exist)")

        # List all templates
        templates = db.query(Template).all()
        print("\nAll templates in database:")
        for template in templates:
            param_count = len(template.parameters)
            print(
                f"  - {template.name} ({template.category}) - "
                f"{param_count} parameters"
            )

        return True

    except Exception as e:
        print(f"❌ Seed templates test failed: {e}")
        import traceback

        traceback.print_exc()
        return False
    finally:
        db.close()


if __name__ == "__main__":
    success = asyncio.run(test_seed_templates())
    sys.exit(0 if success else 1)
