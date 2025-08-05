"""Unit tests for database operations."""

import os
from unittest.mock import MagicMock, patch

import pytest
from sqlalchemy.exc import SQLAlchemyError

# Set test environment before importing models
os.environ["DATABASE_URL"] = "sqlite:///:memory:"

from app.database import (
    check_database_connection,
    create_tables,
    drop_tables,
    get_db,
    get_db_session,
)


class TestDatabaseUtilities:
    """Test cases for database utility functions."""

    def test_get_db_dependency(self):
        """Test the get_db dependency function."""
        # This test would require a real database connection
        # For now, we'll test that it returns a generator
        db_gen = get_db()
        assert hasattr(db_gen, "__next__")

    @patch("app.database.SessionLocal")
    def test_get_db_session_success(self, mock_session_local):
        """Test successful database session context manager."""
        mock_session = MagicMock()
        mock_session_local.return_value = mock_session

        with get_db_session() as db:
            assert db == mock_session

        mock_session.commit.assert_called_once()
        mock_session.close.assert_called_once()

    @patch("app.database.SessionLocal")
    def test_get_db_session_exception(self, mock_session_local):
        """Test database session context manager with exception."""
        mock_session = MagicMock()
        mock_session_local.return_value = mock_session

        with pytest.raises(Exception):
            with get_db_session() as db:
                raise Exception("Test exception")

        mock_session.rollback.assert_called_once()
        mock_session.close.assert_called_once()

    @patch("app.database.Base.metadata.create_all")
    @patch("app.database.logger")
    def test_create_tables_success(self, mock_logger, mock_create_all):
        """Test successful table creation."""
        create_tables()

        mock_create_all.assert_called_once()
        mock_logger.info.assert_called_with("Database tables created successfully")

    @patch("app.database.Base.metadata.create_all")
    @patch("app.database.logger")
    def test_create_tables_exception(self, mock_logger, mock_create_all):
        """Test table creation with exception."""
        mock_create_all.side_effect = SQLAlchemyError("Database error")

        with pytest.raises(SQLAlchemyError):
            create_tables()

        mock_logger.error.assert_called()

    @patch("app.database.Base.metadata.drop_all")
    @patch("app.database.logger")
    def test_drop_tables_success(self, mock_logger, mock_drop_all):
        """Test successful table dropping."""
        drop_tables()

        mock_drop_all.assert_called_once()
        mock_logger.info.assert_called_with("Database tables dropped successfully")

    @patch("app.database.engine.connect")
    @patch("app.database.logger")
    def test_check_database_connection_success(self, mock_logger, mock_connect):
        """Test successful database connection check."""
        mock_connection = MagicMock()
        mock_connect.return_value.__enter__.return_value = mock_connection

        result = check_database_connection()

        assert result is True
        mock_connection.execute.assert_called_with("SELECT 1")
        mock_logger.info.assert_called_with("Database connection successful")

    @patch("app.database.engine.connect")
    @patch("app.database.logger")
    def test_check_database_connection_failure(self, mock_logger, mock_connect):
        """Test failed database connection check."""
        mock_connect.side_effect = SQLAlchemyError("Connection failed")

        result = check_database_connection()

        assert result is False
        mock_logger.error.assert_called()


class TestDatabaseInitialization:
    """Test cases for database initialization."""

    @patch("app.init_db.create_seed_templates")
    @patch("app.init_db.create_seed_users")
    @patch("app.init_db.create_tables")
    @patch("app.init_db.check_database_connection")
    @patch("app.init_db.logger")
    def test_init_database_success(
        self,
        mock_logger,
        mock_check_conn,
        mock_create_tables,
        mock_seed_users,
        mock_seed_templates,
    ):
        """Test successful database initialization."""
        from app.init_db import init_database

        mock_check_conn.return_value = True

        result = init_database()

        assert result is True
        mock_create_tables.assert_called_once()
        mock_seed_users.assert_called_once()
        mock_seed_templates.assert_called_once()
        mock_logger.info.assert_called_with(
            "Database initialization completed successfully"
        )

    @patch("app.init_db.check_database_connection")
    @patch("app.init_db.logger")
    def test_init_database_connection_failure(self, mock_logger, mock_check_conn):
        """Test database initialization with connection failure."""
        from app.init_db import init_database

        mock_check_conn.return_value = False

        result = init_database()

        assert result is False
        mock_logger.error.assert_called_with(
            "Database connection failed. Cannot initialize database."
        )

    @patch("app.init_db.create_tables")
    @patch("app.init_db.check_database_connection")
    @patch("app.init_db.logger")
    def test_init_database_exception(
        self, mock_logger, mock_check_conn, mock_create_tables
    ):
        """Test database initialization with exception."""
        from app.init_db import init_database

        mock_check_conn.return_value = True
        mock_create_tables.side_effect = Exception("Database error")

        result = init_database()

        assert result is False
        mock_logger.error.assert_called()


class TestPasswordHashing:
    """Test cases for password hashing utilities."""

    def test_hash_password(self):
        """Test password hashing function."""
        from app.init_db import hash_password

        password = "test_password_123"
        hashed = hash_password(password)

        assert hashed != password
        assert len(hashed) > 0
        assert hashed.startswith("$2b$")  # bcrypt hash format

    def test_hash_password_different_results(self):
        """Test that same password produces different hashes (due to salt)."""
        from app.init_db import hash_password

        password = "test_password"
        hash1 = hash_password(password)
        hash2 = hash_password(password)

        assert hash1 != hash2  # Different due to random salt
