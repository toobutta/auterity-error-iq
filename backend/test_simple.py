#!/usr/bin/env python3
"""Simple test to isolate import issues."""

import sys
from pathlib import Path

# Add the backend directory to Python path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

print("Testing basic imports...")

try:
    from app.models.auterity_expansion import TriageRule
    print("✅ Models imported successfully")
except Exception as e:
    print(f"❌ Model import failed: {e}")

try:
    from app.schemas.auterity_expansion import TriageRuleCreate
    print("✅ Schemas imported successfully")
except Exception as e:
    print(f"❌ Schema import failed: {e}")

try:
    from app.services.smart_triage_service_mock import MockSmartTriageService
    print("✅ Mock services imported successfully")
except Exception as e:
    print(f"❌ Mock service import failed: {e}")

try:
    from app.api.auterity_expansion import router
    print("✅ API router imported successfully")
except Exception as e:
    print(f"❌ API router import failed: {e}")

print("Import test completed.")
