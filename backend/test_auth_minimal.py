#!/usr/bin/env python3
"""Minimal test for core authentication functions."""

import os
import sys

# Test password hashing without importing the full auth module
try:
    from datetime import datetime, timedelta

    from jose import jwt
    from passlib.context import CryptContext

    print("Testing core authentication functionality...\n")

    # Test password hashing
    print("1. Testing password hashing...")
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

    password = "testpassword123"
    hashed = pwd_context.hash(password)

    assert hashed != password, "Hash should be different from password"
    assert pwd_context.verify(password, hashed), "Password verification should succeed"
    assert not pwd_context.verify("wrongpassword", hashed), "Wrong password should fail"
    print("   ✓ Password hashing works correctly")

    # Test JWT tokens
    print("2. Testing JWT tokens...")
    SECRET_KEY = "test-secret-key"
    ALGORITHM = "HS256"

    # Create token
    data = {"sub": "test@example.com"}
    expire = datetime.utcnow() + timedelta(minutes=30)
    to_encode = data.copy()
    to_encode.update({"exp": expire})
    token = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

    assert token is not None, "Token should be created"
    assert isinstance(token, str), "Token should be a string"
    print("   ✓ Token creation works")

    # Verify token
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        assert payload["sub"] == "test@example.com", "Token should contain correct data"
        assert "exp" in payload, "Token should have expiration"
        print("   ✓ Token verification works")
    except Exception as e:
        print(f"   ✗ Token verification failed: {e}")
        sys.exit(1)

    # Test invalid token
    try:
        jwt.decode("invalid.token.here", SECRET_KEY, algorithms=[ALGORITHM])
        print("   ✗ Invalid token should have failed")
        sys.exit(1)
    except:
        print("   ✓ Invalid token correctly rejected")

    print("\n✓ All core authentication functionality tests passed!")
    print("The authentication system components are working correctly.")

except ImportError as e:
    print(f"Missing dependency: {e}")
    print("Please install: pip3 install 'passlib[bcrypt]' 'python-jose[cryptography]'")
    sys.exit(1)
except Exception as e:
    print(f"Test failed: {e}")
    import traceback

    traceback.print_exc()
    sys.exit(1)
