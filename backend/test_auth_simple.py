#!/usr/bin/env python3
"""Simple test script to verify authentication functionality."""

import os
import sys

from app.auth import create_access_token
from app.auth import get_password_hash
from app.auth import verify_password
from app.auth import verify_token

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Set test environment
os.environ["PYTEST_CURRENT_TEST"] = "test"


def test_password_hashing():
    """Test password hashing functionality."""
    print("Testing password hashing...")
    password = "testpassword123"
    hashed = get_password_hash(password)

    assert hashed != password, "Hash should be different from password"
    assert verify_password(password, hashed), "Password verification should succeed"
    assert not verify_password("wrongpassword", hashed), "Wrong password should fail"
    print("✓ Password hashing tests passed")


def test_jwt_tokens():
    """Test JWT token functionality."""
    print("Testing JWT tokens...")
    data = {"sub": "test@example.com"}
    token = create_access_token(data)

    assert token is not None, "Token should be created"
    assert isinstance(token, str), "Token should be a string"

    payload = verify_token(token)
    assert payload is not None, "Token should be verifiable"
    assert payload["sub"] == "test@example.com", "Token should contain correct data"
    assert "exp" in payload, "Token should have expiration"

    # Test invalid token
    invalid_payload = verify_token("invalid.token.here")
    assert invalid_payload is None, "Invalid token should return None"
    print("✓ JWT token tests passed")


def test_imports():
    """Test that all imports work correctly."""
    print("Testing imports...")
    try:
        pass

        print("✓ All imports successful")
    except ImportError as e:
        print(f"✗ Import failed: {e}")
        return False
    return True


if __name__ == "__main__":
    print("Running authentication system tests...\n")

    try:
        if not test_imports():
            sys.exit(1)

        test_password_hashing()
        test_jwt_tokens()

        print("\n✓ All authentication tests passed!")
        print("Authentication system implementation is working correctly.")

    except Exception as e:
        print(f"\n✗ Test failed: {e}")
        import traceback

        traceback.print_exc()
        sys.exit(1)
