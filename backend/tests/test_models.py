"""Unit tests for data models."""

import os

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

# Set test environment before importing models
os.environ["DATABASE_URL"] = "sqlite:///:memory:"

from app.models import (
    Base,
    ExecutionLog,
    ExecutionStatus,
    Template,
    TemplateParameter,
    User,
    Workflow,
    WorkflowExecution,
)

# Test database setup
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture
def db_session():
    """Create a test database session."""
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)


class TestUserModel:
    """Test cases for User model."""

    def test_create_user(self, db_session):
        """Test creating a user."""
        user = User(
            email="test@example.com",
            name="Test User",
            hashed_password="hashed_password_123",
            is_active=True,
        )
        db_session.add(user)
        db_session.commit()

        assert user.id is not None
        assert user.email == "test@example.com"
        assert user.name == "Test User"
        assert user.is_active is True
        assert user.created_at is not None
        assert user.updated_at is not None

    def test_user_email_unique(self, db_session):
        """Test that user email must be unique."""
        user1 = User(
            email="test@example.com", name="Test User 1", hashed_password="password1"
        )
        user2 = User(
            email="test@example.com", name="Test User 2", hashed_password="password2"
        )

        db_session.add(user1)
        db_session.commit()

        db_session.add(user2)
        with pytest.raises(Exception):  # Should raise integrity error
            db_session.commit()

    def test_user_repr(self, db_session):
        """Test user string representation."""
        user = User(
            email="test@example.com", name="Test User", hashed_password="password"
        )
        db_session.add(user)
        db_session.commit()

        repr_str = repr(user)
        assert "User" in repr_str
        assert "test@example.com" in repr_str
        assert "Test User" in repr_str


class TestWorkflowModel:
    """Test cases for Workflow model."""

    def test_create_workflow(self, db_session):
        """Test creating a workflow."""
        # Create user first
        user = User(
            email="test@example.com", name="Test User", hashed_password="password"
        )
        db_session.add(user)
        db_session.commit()

        # Create workflow
        workflow_definition = {
            "steps": [{"id": "step1", "type": "ai_processing", "name": "Process Input"}]
        }

        workflow = Workflow(
            name="Test Workflow",
            description="A test workflow",
            user_id=user.id,
            definition=workflow_definition,
            is_active=True,
        )
        db_session.add(workflow)
        db_session.commit()

        assert workflow.id is not None
        assert workflow.name == "Test Workflow"
        assert workflow.description == "A test workflow"
        assert workflow.user_id == user.id
        assert workflow.definition == workflow_definition
        assert workflow.is_active is True
        assert workflow.created_at is not None

    def test_workflow_user_relationship(self, db_session):
        """Test workflow-user relationship."""
        user = User(
            email="test@example.com", name="Test User", hashed_password="password"
        )
        db_session.add(user)
        db_session.commit()

        workflow = Workflow(
            name="Test Workflow", user_id=user.id, definition={"steps": []}
        )
        db_session.add(workflow)
        db_session.commit()

        # Test relationship
        assert workflow.user == user
        assert workflow in user.workflows


class TestWorkflowExecutionModel:
    """Test cases for WorkflowExecution model."""

    def test_create_execution(self, db_session):
        """Test creating a workflow execution."""
        # Create user and workflow
        user = User(
            email="test@example.com", name="Test User", hashed_password="password"
        )
        db_session.add(user)
        db_session.commit()

        workflow = Workflow(
            name="Test Workflow", user_id=user.id, definition={"steps": []}
        )
        db_session.add(workflow)
        db_session.commit()

        # Create execution
        execution = WorkflowExecution(
            workflow_id=workflow.id,
            status=ExecutionStatus.PENDING,
            input_data={"input": "test"},
            output_data={"output": "result"},
        )
        db_session.add(execution)
        db_session.commit()

        assert execution.id is not None
        assert execution.workflow_id == workflow.id
        assert execution.status == ExecutionStatus.PENDING
        assert execution.input_data == {"input": "test"}
        assert execution.output_data == {"output": "result"}
        assert execution.started_at is not None

    def test_execution_status_enum(self, db_session):
        """Test execution status enumeration."""
        user = User(
            email="test@example.com", name="Test User", hashed_password="password"
        )
        db_session.add(user)
        db_session.commit()

        workflow = Workflow(name="Test", user_id=user.id, definition={})
        db_session.add(workflow)
        db_session.commit()

        execution = WorkflowExecution(
            workflow_id=workflow.id, status=ExecutionStatus.COMPLETED
        )
        db_session.add(execution)
        db_session.commit()

        assert execution.status == ExecutionStatus.COMPLETED
        assert execution.status.value == "completed"


class TestExecutionLogModel:
    """Test cases for ExecutionLog model."""

    def test_create_execution_log(self, db_session):
        """Test creating an execution log."""
        # Create user, workflow, and execution
        user = User(
            email="test@example.com", name="Test User", hashed_password="password"
        )
        db_session.add(user)
        db_session.commit()

        workflow = Workflow(name="Test", user_id=user.id, definition={})
        db_session.add(workflow)
        db_session.commit()

        execution = WorkflowExecution(
            workflow_id=workflow.id, status=ExecutionStatus.RUNNING
        )
        db_session.add(execution)
        db_session.commit()

        # Create log
        log = ExecutionLog(
            execution_id=execution.id,
            step_name="Test Step",
            step_type="ai_processing",
            input_data={"input": "data"},
            output_data={"output": "result"},
            duration_ms=1500,
        )
        db_session.add(log)
        db_session.commit()

        assert log.id is not None
        assert log.execution_id == execution.id
        assert log.step_name == "Test Step"
        assert log.step_type == "ai_processing"
        assert log.duration_ms == 1500
        assert log.timestamp is not None

    def test_execution_log_relationship(self, db_session):
        """Test execution log relationship with execution."""
        user = User(
            email="test@example.com", name="Test User", hashed_password="password"
        )
        db_session.add(user)
        db_session.commit()

        workflow = Workflow(name="Test", user_id=user.id, definition={})
        db_session.add(workflow)
        db_session.commit()

        execution = WorkflowExecution(
            workflow_id=workflow.id, status=ExecutionStatus.RUNNING
        )
        db_session.add(execution)
        db_session.commit()

        log = ExecutionLog(
            execution_id=execution.id, step_name="Test Step", step_type="test"
        )
        db_session.add(log)
        db_session.commit()

        # Test relationship
        assert log.execution == execution
        assert log in execution.logs


class TestTemplateModel:
    """Test cases for Template model."""

    def test_create_template(self, db_session):
        """Test creating a template."""
        template_definition = {
            "steps": [{"id": "step1", "type": "ai_processing", "name": "Process"}]
        }

        template = Template(
            name="Test Template",
            description="A test template",
            category="Sales",
            definition=template_definition,
            is_active=True,
        )
        db_session.add(template)
        db_session.commit()

        assert template.id is not None
        assert template.name == "Test Template"
        assert template.description == "A test template"
        assert template.category == "Sales"
        assert template.definition == template_definition
        assert template.is_active is True
        assert template.created_at is not None


class TestTemplateParameterModel:
    """Test cases for TemplateParameter model."""

    def test_create_template_parameter(self, db_session):
        """Test creating a template parameter."""
        template = Template(
            name="Test Template", category="Sales", definition={"steps": []}
        )
        db_session.add(template)
        db_session.commit()

        parameter = TemplateParameter(
            template_id=template.id,
            name="customer_name",
            description="Customer's name",
            parameter_type="string",
            is_required=True,
            default_value="John Doe",
            validation_rules={"min_length": 2},
        )
        db_session.add(parameter)
        db_session.commit()

        assert parameter.id is not None
        assert parameter.template_id == template.id
        assert parameter.name == "customer_name"
        assert parameter.parameter_type == "string"
        assert parameter.is_required is True
        assert parameter.default_value == "John Doe"
        assert parameter.validation_rules == {"min_length": 2}

    def test_template_parameter_relationship(self, db_session):
        """Test template-parameter relationship."""
        template = Template(name="Test", category="Sales", definition={})
        db_session.add(template)
        db_session.commit()

        parameter = TemplateParameter(
            template_id=template.id,
            name="test_param",
            parameter_type="string",
            is_required=False,
        )
        db_session.add(parameter)
        db_session.commit()

        # Test relationship
        assert parameter.template == template
        assert parameter in template.parameters
