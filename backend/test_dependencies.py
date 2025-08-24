#!/usr/bin/env python3
"""
Test script to validate all critical imports and dependencies
"""

import sys
import traceback

def test_imports():
    """Test all critical imports"""
    print("🔍 Testing critical imports...")
    
    failed_imports = []
    
    # Test database imports
    try:
        from app.database import SessionLocal, Base, engine, get_db
        print("✅ Database imports: SUCCESS")
    except Exception as e:
        failed_imports.append(f"Database imports: {e}")
        print(f"❌ Database imports: {e}")
    
    # Test config imports
    try:
        from app.core.config import settings, get_settings
        print("✅ Config imports: SUCCESS")
    except Exception as e:
        failed_imports.append(f"Config imports: {e}")
        print(f"❌ Config imports: {e}")
    
    # Test startup imports
    try:
        from app.startup.ai_ecosystem_startup import ecosystem_manager, startup_event, shutdown_event
        print("✅ Startup imports: SUCCESS")
    except Exception as e:
        failed_imports.append(f"Startup imports: {e}")
        print(f"❌ Startup imports: {e}")
    
    # Test middleware imports
    try:
        from app.middleware.tenant_middleware import AuditLoggingMiddleware, TenantIsolationMiddleware
        print("✅ Middleware imports: SUCCESS")
    except Exception as e:
        failed_imports.append(f"Middleware imports: {e}")
        print(f"❌ Middleware imports: {e}")
    
    # Test main app imports
    try:
        from app.main import app
        print("✅ Main app imports: SUCCESS")
    except Exception as e:
        failed_imports.append(f"Main app imports: {e}")
        print(f"❌ Main app imports: {e}")
        traceback.print_exc()
    
    return failed_imports

def test_database_connection():
    """Test database connection"""
    print("\n🔍 Testing database connection...")
    
    try:
        from app.database import check_database_connection
        if check_database_connection():
            print("✅ Database connection: SUCCESS")
            return True
        else:
            print("❌ Database connection: FAILED")
            return False
    except Exception as e:
        print(f"❌ Database connection test error: {e}")
        return False

if __name__ == "__main__":
    print("🚀 Running dependency validation tests...\n")
    
    # Test imports
    failed_imports = test_imports()
    
    # Test database (only if imports work)
    if not failed_imports:
        test_database_connection()
    
    # Summary
    print(f"\n📊 Summary:")
    if failed_imports:
        print(f"❌ {len(failed_imports)} import failures found:")
        for failure in failed_imports:
            print(f"   - {failure}")
        sys.exit(1)
    else:
        print("✅ All critical dependencies resolved successfully!")
        sys.exit(0)
