"""Integration test configuration and fixtures."""

import os
from typing import AsyncGenerator, Generator

import pytest
import pytest_asyncio
from fastapi.testclient import TestClient
from httpx import AsyncClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

# Set test environment before importing models
os.environ["PYTEST_CURRENT_TEST"] = "true"

from app.auth import create_access_token, get_password_hash
from app.database import get_db
from app.main import app
from app.models.base import Base
from app.models.template import Template
from app.models.user import User
from app.models.workflow import Workflow

# Create in-memory SQLite database for integration testing
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)

TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    """Override database dependency for integration testing."""
    # Create tables
    Base.metadata.create_all(bind=engine)

    # Create session
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture(scope="function")
def db_session():
    """Create a fresh database session for each test."""
    # Create tables
    Base.metadata.create_all(bind=engine)

    # Create session
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        # Drop tables after test
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(autouse=True)
def override_db_dependency():
    """Override the database dependency for all integration tests."""
    app.dependency_overrides[get_db] = override_get_db
    yield
    app.dependency_overrides.clear()


@pytest.fixture
def client() -> Generator[TestClient, None, None]:
    """Create a test client for synchronous requests."""
    with TestClient(app) as test_client:
        yield test_client


@pytest_asyncio.fixture
async def async_client() -> AsyncGenerator[AsyncClient, None]:
    """Create an async test client for asynchronous requests."""
    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac


@pytest.fixture
def test_user(db_session):
    """Create a test user."""
    user = User(
        email="test@example.com",
        name="Test User",
        hashed_password=get_password_hash("testpassword123"),
        is_active=True,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def test_user_token(test_user):
    """Create an access token for the test user."""
    return create_access_token(data={"sub": test_user.email})


@pytest.fixture
def authenticated_headers(test_user_token):
    """Create headers with authentication token."""
    return {"Authorization": f"Bearer {test_user_token}"}


@pytest.fixture
def test_workflow_definition():
    """Sample workflow definition for testing."""
    return {
        "nodes": [
            {
                "id": "start-1",
                "type": "start",
                "position": {"x": 100, "y": 100},
                "data": {"label": "Start"},
            },
            {
                "id": "ai-1",
                "type": "ai-process",
                "position": {"x": 300, "y": 100},
                "data": {
                    "label": "AI Process",
                    "prompt": "Process customer inquiry: {input}",
                    "model": "gpt-4",
                },
            },
            {
                "id": "end-1",
                "type": "end",
                "position": {"x": 500, "y": 100},
                "data": {"label": "End"},
            },
        ],
        "edges": [
            {"id": "e1-2", "source": "start-1", "target": "ai-1"},
            {"id": "e2-3", "source": "ai-1", "target": "end-1"},
        ],
    }


@pytest.fixture
def test_template_definition():
    """Sample template definition for testing."""
    return {
        "nodes": [
            {
                "id": "start-1",
                "type": "start",
                "position": {"x": 100, "y": 100},
                "data": {"label": "Start"},
            },
            {
                "id": "ai-1",
                "type": "ai-process",
                "position": {"x": 300, "y": 100},
                "data": {
                    "label": "Customer Service Response",
                    "prompt": "Respond to customer inquiry about {inquiry_type}: {customer_message}",
                    "model": "gpt-4",
                },
            },
            {
                "id": "end-1",
                "type": "end",
                "position": {"x": 500, "y": 100},
                "data": {"label": "End"},
            },
        ],
        "edges": [
            {"id": "e1-2", "source": "start-1", "target": "ai-1"},
            {"id": "e2-3", "source": "ai-1", "target": "end-1"},
        ],
    }


@pytest.fixture
def sample_template(db_session, test_template_definition):
    """Create a sample template for testing."""
    template = Template(
        name="Customer Service Response",
        description="Template for responding to customer service inquiries",
        category="Customer Service",
        definition=test_template_definition,
        parameters=[
            {
                "name": "inquiry_type",
                "type": "select",
                "label": "Inquiry Type",
                "description": "Type of customer inquiry",
                "isRequired": True,
                "options": ["billing", "technical", "general"],
                "defaultValue": "general",
            },
            {
                "name": "response_tone",
                "type": "select",
                "label": "Response Tone",
                "description": "Tone of the response",
                "isRequired": False,
                "options": ["professional", "friendly", "formal"],
                "defaultValue": "professional",
            },
        ],
    )
    db_session.add(template)
    db_session.commit()
    db_session.refresh(template)
    return template


@pytest.fixture
def sample_workflow(db_session, test_user, test_workflow_definition):
    """Create a sample workflow for testing."""
    workflow = Workflow(
        name="Test Customer Inquiry Workflow",
        description="A test workflow for processing customer inquiries",
        user_id=test_user.id,
        definition=test_workflow_definition,
        is_active=True,
    )
    db_session.add(workflow)
    db_session.commit()
    db_session.refresh(workflow)
    return workflow


@pytest.fixture
def mock_openai_response():
    """Mock OpenAI API response for testing."""
    return {
        "id": "chatcmpl-test123",
        "object": "chat.completion",
        "created": 1677652288,
        "model": "gpt-4",
        "choices": [
            {
                "index": 0,
                "message": {
                    "role": "assistant",
                    "content": "Thank you for your inquiry. I understand you're asking about billing. Let me help you with that.",
                },
                "finish_reason": "stop",
            }
        ],
        "usage": {"prompt_tokens": 50, "completion_tokens": 25, "total_tokens": 75},
    }
