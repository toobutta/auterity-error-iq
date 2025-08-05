"""Tests for authentication functionality."""

from datetime import datetime, timedelta

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.auth import (
    authenticate_user,
    create_access_token,
    get_password_hash,
    verify_password,
    verify_token,
)
from app.database import get_db
from app.main import app
from app.models.user import User
from tests.conftest import override_get_db

client = TestClient(app)


class TestPasswordHashing:
    """Test password hashing functionality."""

    def test_password_hashing(self):
        """Test password hashing and verification."""
        password = "testpassword123"
        hashed = get_password_hash(password)

        assert hashed != password
        assert verify_password(password, hashed) is True
        assert verify_password("wrongpassword", hashed) is False

    def test_different_passwords_different_hashes(self):
        """Test that different passwords produce different hashes."""
        password1 = "password1"
        password2 = "password2"

        hash1 = get_password_hash(password1)
        hash2 = get_password_hash(password2)

        assert hash1 != hash2


class TestJWTTokens:
    """Test JWT token functionality."""

    def test_create_and_verify_token(self):
        """Test token creation and verification."""
        data = {"sub": "test@example.com"}
        token = create_access_token(data)

        assert token is not None
        assert isinstance(token, str)

        payload = verify_token(token)
        assert payload is not None
        assert payload["sub"] == "test@example.com"
        assert "exp" in payload

    def test_token_with_custom_expiry(self):
        """Test token creation with custom expiry."""
        data = {"sub": "test@example.com"}
        expires_delta = timedelta(minutes=60)
        token = create_access_token(data, expires_delta)

        payload = verify_token(token)
        assert payload is not None

        # Check that expiry is approximately 60 minutes from now
        exp_timestamp = payload["exp"]
        expected_exp = datetime.utcnow() + expires_delta
        actual_exp = datetime.utcfromtimestamp(exp_timestamp)

        # Allow 1 minute tolerance
        assert abs((actual_exp - expected_exp).total_seconds()) < 60

    def test_invalid_token(self):
        """Test verification of invalid token."""
        invalid_token = "invalid.token.here"
        payload = verify_token(invalid_token)
        assert payload is None


class TestUserAuthentication:
    """Test user authentication functionality."""

    @pytest.fixture(autouse=True)
    def setup_db(self):
        """Set up test database with override."""
        app.dependency_overrides[get_db] = override_get_db
        yield
        app.dependency_overrides.clear()

    def test_authenticate_valid_user(self, test_db: Session):
        """Test authentication with valid credentials."""
        # Create test user
        hashed_password = get_password_hash("testpass123")
        user = User(
            email="test@example.com",
            name="Test User",
            hashed_password=hashed_password,
            is_active=True,
        )
        test_db.add(user)
        test_db.commit()

        # Test authentication
        authenticated_user = authenticate_user(
            test_db, "test@example.com", "testpass123"
        )
        assert authenticated_user is not None
        assert authenticated_user.email == "test@example.com"
        assert authenticated_user.name == "Test User"

    def test_authenticate_invalid_email(self, test_db: Session):
        """Test authentication with invalid email."""
        authenticated_user = authenticate_user(
            test_db, "nonexistent@example.com", "password"
        )
        assert authenticated_user is None

    def test_authenticate_invalid_password(self, test_db: Session):
        """Test authentication with invalid password."""
        # Create test user
        hashed_password = get_password_hash("correctpass")
        user = User(
            email="test@example.com",
            name="Test User",
            hashed_password=hashed_password,
            is_active=True,
        )
        test_db.add(user)
        test_db.commit()

        # Test with wrong password
        authenticated_user = authenticate_user(test_db, "test@example.com", "wrongpass")
        assert authenticated_user is None


class TestAuthEndpoints:
    """Test authentication API endpoints."""

    @pytest.fixture(autouse=True)
    def setup_db(self):
        """Set up test database with override."""
        app.dependency_overrides[get_db] = override_get_db
        yield
        app.dependency_overrides.clear()

    def test_register_user(self):
        """Test user registration endpoint."""
        user_data = {
            "email": "newuser@example.com",
            "name": "New User",
            "password": "newpassword123",
        }

        response = client.post("/api/auth/register", json=user_data)
        assert response.status_code == 201

        data = response.json()
        assert data["email"] == user_data["email"]
        assert data["name"] == user_data["name"]
        assert data["is_active"] is True
        assert "id" in data
        assert "created_at" in data
        assert "password" not in data  # Password should not be returned

    def test_register_duplicate_email(self, test_db: Session):
        """Test registration with duplicate email."""
        # Create existing user
        existing_user = User(
            email="existing@example.com",
            name="Existing User",
            hashed_password=get_password_hash("password"),
            is_active=True,
        )
        test_db.add(existing_user)
        test_db.commit()

        # Try to register with same email
        user_data = {
            "email": "existing@example.com",
            "name": "Another User",
            "password": "password123",
        }

        response = client.post("/api/auth/register", json=user_data)
        assert response.status_code == 400
        assert "Email already registered" in response.json()["detail"]

    def test_login_valid_credentials(self, test_db: Session):
        """Test login with valid credentials."""
        # Create test user
        hashed_password = get_password_hash("testpass123")
        user = User(
            email="login@example.com",
            name="Login User",
            hashed_password=hashed_password,
            is_active=True,
        )
        test_db.add(user)
        test_db.commit()

        # Test login
        login_data = {"email": "login@example.com", "password": "testpass123"}

        response = client.post("/api/auth/login", json=login_data)
        assert response.status_code == 200

        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"

        # Verify token is valid
        token = data["access_token"]
        payload = verify_token(token)
        assert payload is not None
        assert payload["sub"] == "login@example.com"

    def test_login_invalid_credentials(self):
        """Test login with invalid credentials."""
        login_data = {"email": "nonexistent@example.com", "password": "wrongpassword"}

        response = client.post("/api/auth/login", json=login_data)
        assert response.status_code == 401
        assert "Incorrect email or password" in response.json()["detail"]

    def test_login_inactive_user(self, test_db: Session):
        """Test login with inactive user."""
        # Create inactive user
        hashed_password = get_password_hash("testpass123")
        user = User(
            email="inactive@example.com",
            name="Inactive User",
            hashed_password=hashed_password,
            is_active=False,
        )
        test_db.add(user)
        test_db.commit()

        # Test login
        login_data = {"email": "inactive@example.com", "password": "testpass123"}

        response = client.post("/api/auth/login", json=login_data)
        assert response.status_code == 400
        assert "Inactive user account" in response.json()["detail"]

    def test_get_current_user(self, test_db: Session):
        """Test getting current user information."""
        # Create test user
        hashed_password = get_password_hash("testpass123")
        user = User(
            email="current@example.com",
            name="Current User",
            hashed_password=hashed_password,
            is_active=True,
        )
        test_db.add(user)
        test_db.commit()

        # Login to get token
        login_data = {"email": "current@example.com", "password": "testpass123"}

        login_response = client.post("/api/auth/login", json=login_data)
        token = login_response.json()["access_token"]

        # Get current user info
        headers = {"Authorization": f"Bearer {token}"}
        response = client.get("/api/auth/me", headers=headers)

        assert response.status_code == 200
        data = response.json()
        assert data["email"] == "current@example.com"
        assert data["name"] == "Current User"
        assert data["is_active"] is True

    def test_get_current_user_invalid_token(self):
        """Test getting current user with invalid token."""
        headers = {"Authorization": "Bearer invalid_token"}
        response = client.get("/api/auth/me", headers=headers)

        assert response.status_code == 401
        assert "Could not validate credentials" in response.json()["detail"]

    def test_get_current_user_no_token(self):
        """Test getting current user without token."""
        response = client.get("/api/auth/me")
        assert response.status_code == 403  # No authorization header

    def test_refresh_token(self, test_db: Session):
        """Test token refresh endpoint."""
        # Create test user
        hashed_password = get_password_hash("testpass123")
        user = User(
            email="refresh@example.com",
            name="Refresh User",
            hashed_password=hashed_password,
            is_active=True,
        )
        test_db.add(user)
        test_db.commit()

        # Login to get token
        login_data = {"email": "refresh@example.com", "password": "testpass123"}

        login_response = client.post("/api/auth/login", json=login_data)
        old_token = login_response.json()["access_token"]

        # Refresh token
        headers = {"Authorization": f"Bearer {old_token}"}
        response = client.post("/api/auth/refresh", headers=headers)

        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"

        # New token should be different from old token
        new_token = data["access_token"]
        assert new_token != old_token

        # Both tokens should be valid
        old_payload = verify_token(old_token)
        new_payload = verify_token(new_token)
        assert old_payload is not None
        assert new_payload is not None
        assert old_payload["sub"] == new_payload["sub"]

    def test_logout(self):
        """Test logout endpoint."""
        response = client.post("/api/auth/logout")
        assert response.status_code == 200
        assert "Successfully logged out" in response.json()["message"]
