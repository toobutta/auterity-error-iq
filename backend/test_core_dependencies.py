#!/usr/bin/env python3
"""
Core dependency test - focuses on essential imports only
"""

import sys
import traceback

def test_core_imports():
    """Test only the most critical core imports"""
    print("🔍 Testing core imports...")
    
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
    
    return failed_imports

if __name__ == "__main__":
    print("🚀 Running core dependency validation tests...\n")
    
    # Test imports
    failed_imports = test_core_imports()
    
    # Summary
    print(f"\n📊 Summary:")
    if failed_imports:
        print(f"❌ {len(failed_imports)} import failures found:")
        for failure in failed_imports:
            print(f"   - {failure}")
        sys.exit(1)
    else:
        print("✅ All critical core dependencies resolved successfully!")
        sys.exit(0)
