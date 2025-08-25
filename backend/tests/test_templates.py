"""Tests for template management functionality."""

import json
import uuid
from unittest.mock import patch

import pytest
from app.main import app
from app.models import Template, TemplateParameter, User
from app.services.template_engine import TemplateEngine
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session


class TestTemplateEngine:
    """Test cases for TemplateEngine service."""

    @pytest.fixture
    def template_engine(self, db_session: Session):
        """Create a TemplateEngine instance for testing."""
        return TemplateEngine(db_session)

    @pytest.fixture
    def sample_template_data(self):
        """Sample template data for testing."""
        return {
            "name": "Test Template",
            "description": "A test template",
            "category": "sales",
            "definition": {
                "nodes": [
                    {
                        "id": "start",
                        "type": "start",
                        "position": {"x": 100, "y": 100},
                        "data": {"label": "Start"},
                    },
                    {
                        "id": "process",
                        "type": "ai_process",
                        "position": {"x": 300, "y": 100},
                        "data": {
                            "label": "Process",
                            "prompt": "Process this: {{input_text}}",
                            "output_key": "result",
                        },
                    },
                    {
                        "id": "end",
                        "type": "end",
                        "position": {"x": 500, "y": 100},
                        "data": {"label": "End"},
                    },
                ],
                "edges": [
                    {"id": "e1", "source": "start", "target": "process"},
                    {"id": "e2", "source": "process", "target": "end"},
                ],
            },
            "parameters": [
                {
                    "name": "input_text",
                    "description": "Text to process",
                    "parameter_type": "string",
                    "is_required": True,
                    "validation_rules": {"min_length": 1, "max_length": 1000},
                },
                {
                    "name": "optional_param",
                    "description": "Optional parameter",
                    "parameter_type": "string",
                    "is_required": False,
                    "default_value": "default_value",
                },
            ],
        }

    async def test_create_template(
        self, template_engine: TemplateEngine, sample_template_data
    ):
        """Test creating a new template."""
        template = await template_engine.create_template(
            name=sample_template_data["name"],
            description=sample_template_data["description"],
            category=sample_template_data["category"],
            definition=sample_template_data["definition"],
            parameters=sample_template_data["parameters"],
        )

        assert template.name == sample_template_data["name"]
        assert template.description == sample_template_data["description"]
        assert template.category == sample_template_data["category"]
        assert template.definition == sample_template_data["definition"]
        assert template.is_active is True
        assert len(template.parameters) == 2

        # Check parameters
        param_names = [p.name for p in template.parameters]
        assert "input_text" in param_names
        assert "optional_param" in param_names

    async def test_get_templates(
        self, template_engine: TemplateEngine, sample_template_data
    ):
        """Test retrieving templates."""
        # Create a template first
        await template_engine.create_template(
            name=sample_template_data["name"],
            description=sample_template_data["description"],
            category=sample_template_data["category"],
            definition=sample_template_data["definition"],
            parameters=sample_template_data["parameters"],
        )

        # Get all templates
        templates = await template_engine.get_templates()
        assert len(templates) >= 1
        assert any(t.name == sample_template_data["name"] for t in templates)

        # Get templates by category
        sales_templates = await template_engine.get_templates(category="sales")
        assert len(sales_templates) >= 1
        assert all(t.category == "sales" for t in sales_templates)

    async def test_get_template_by_id(
        self, template_engine: TemplateEngine, sample_template_data
    ):
        """Test retrieving a specific template by ID."""
        # Create a template first
        template = await template_engine.create_template(
            name=sample_template_data["name"],
            description=sample_template_data["description"],
            category=sample_template_data["category"],
            definition=sample_template_data["definition"],
            parameters=sample_template_data["parameters"],
        )

        # Retrieve by ID
        retrieved_template = await template_engine.get_template(template.id)
        assert retrieved_template is not None
        assert retrieved_template.id == template.id
        assert retrieved_template.name == template.name

        # Test with non-existent ID
        non_existent_template = await template_engine.get_template(uuid.uuid4())
        assert non_existent_template is None

    async def test_instantiate_template(
        self, template_engine: TemplateEngine, sample_template_data, test_user: User
    ):
        """Test instantiating a workflow from a template."""
        # Create a template first
        template = await template_engine.create_template(
            name=sample_template_data["name"],
            description=sample_template_data["description"],
            category=sample_template_data["category"],
            definition=sample_template_data["definition"],
            parameters=sample_template_data["parameters"],
        )

        # Instantiate the template
        parameter_values = {
            "input_text": "Hello, world!",
            "optional_param": "custom_value",
        }

        workflow = await template_engine.instantiate_template(
            template_id=template.id,
            name="Test Workflow",
            parameter_values=parameter_values,
            user_id=test_user.id,
            description="Test workflow from template",
        )

        assert workflow.name == "Test Workflow"
        assert workflow.user_id == test_user.id
        assert workflow.is_active is True

        # Check that parameters were substituted
        definition_str = json.dumps(workflow.definition)
        assert "Hello, world!" in definition_str
        assert "custom_value" in definition_str
        assert "{{input_text}}" not in definition_str

    async def test_instantiate_template_with_defaults(
        self, template_engine: TemplateEngine, sample_template_data, test_user: User
    ):
        """Test instantiating a template using default parameter values."""
        # Create a template first
        template = await template_engine.create_template(
            name=sample_template_data["name"],
            description=sample_template_data["description"],
            category=sample_template_data["category"],
            definition=sample_template_data["definition"],
            parameters=sample_template_data["parameters"],
        )

        # Instantiate with only required parameters
        parameter_values = {"input_text": "Required text"}

        workflow = await template_engine.instantiate_template(
            template_id=template.id,
            name="Test Workflow",
            parameter_values=parameter_values,
            user_id=test_user.id,
        )

        # Check that default value was used
        definition_str = json.dumps(workflow.definition)
        assert "default_value" in definition_str

    async def test_instantiate_template_validation_errors(
        self, template_engine: TemplateEngine, sample_template_data, test_user: User
    ):
        """Test template instantiation validation errors."""
        # Create a template first
        template = await template_engine.create_template(
            name=sample_template_data["name"],
            description=sample_template_data["description"],
            category=sample_template_data["category"],
            definition=sample_template_data["definition"],
            parameters=sample_template_data["parameters"],
        )

        # Test missing required parameter
        with pytest.raises(
            ValueError, match="Required parameter 'input_text' is missing"
        ):
            await template_engine.instantiate_template(
                template_id=template.id,
                name="Test Workflow",
                parameter_values={},
                user_id=test_user.id,
            )

        # Test parameter type validation
        with pytest.raises(ValueError, match="Parameter 'input_text' must be a string"):
            await template_engine.instantiate_template(
                template_id=template.id,
                name="Test Workflow",
                parameter_values={"input_text": 123},
                user_id=test_user.id,
            )

        # Test parameter length validation
        with pytest.raises(ValueError, match="must be at least 1 characters long"):
            await template_engine.instantiate_template(
                template_id=template.id,
                name="Test Workflow",
                parameter_values={"input_text": ""},
                user_id=test_user.id,
            )

    async def test_parameter_type_validation(self, template_engine: TemplateEngine):
        """Test parameter type validation."""
        from app.models import TemplateParameter

        # Test string validation
        param = TemplateParameter(name="test", parameter_type="string")
        assert template_engine._validate_parameter_type(param, "valid string") is None
        assert template_engine._validate_parameter_type(param, 123) is not None

        # Test number validation
        param = TemplateParameter(name="test", parameter_type="number")
        assert template_engine._validate_parameter_type(param, 123) is None
        assert template_engine._validate_parameter_type(param, 123.45) is None
        assert (
            template_engine._validate_parameter_type(param, "not a number") is not None
        )

        # Test boolean validation
        param = TemplateParameter(name="test", parameter_type="boolean")
        assert template_engine._validate_parameter_type(param, True) is None
        assert template_engine._validate_parameter_type(param, False) is None
        assert template_engine._validate_parameter_type(param, "true") is not None

        # Test array validation
        param = TemplateParameter(name="test", parameter_type="array")
        assert template_engine._validate_parameter_type(param, [1, 2, 3]) is None
        assert (
            template_engine._validate_parameter_type(param, "not an array") is not None
        )

        # Test object validation
        param = TemplateParameter(name="test", parameter_type="object")
        assert template_engine._validate_parameter_type(param, {"key": "value"}) is None
        assert (
            template_engine._validate_parameter_type(param, "not an object") is not None
        )

    async def test_parameter_rules_validation(self, template_engine: TemplateEngine):
        """Test parameter validation rules."""
        from app.models import TemplateParameter

        # Test string length rules
        param = TemplateParameter(
            name="test",
            parameter_type="string",
            validation_rules={"min_length": 5, "max_length": 10},
        )
        assert template_engine._validate_parameter_rules(param, "valid") is None
        assert template_engine._validate_parameter_rules(param, "too") is not None
        assert (
            template_engine._validate_parameter_rules(param, "way too long string")
            is not None
        )

        # Test number range rules
        param = TemplateParameter(
            name="test",
            parameter_type="number",
            validation_rules={"min_value": 0, "max_value": 100},
        )
        assert template_engine._validate_parameter_rules(param, 50) is None
        assert template_engine._validate_parameter_rules(param, -1) is not None
        assert template_engine._validate_parameter_rules(param, 101) is not None

        # Test array length rules
        param = TemplateParameter(
            name="test",
            parameter_type="array",
            validation_rules={"min_items": 1, "max_items": 3},
        )
        assert template_engine._validate_parameter_rules(param, [1, 2]) is None
        assert template_engine._validate_parameter_rules(param, []) is not None
        assert (
            template_engine._validate_parameter_rules(param, [1, 2, 3, 4]) is not None
        )


class TestTemplateAPI:
    """Test cases for template API endpoints."""

    @pytest.fixture
    def client(self):
        """Create a test client."""
        return TestClient(app)

    @pytest.fixture
    def auth_headers(self, test_user: User):
        """Create authentication headers for testing."""
        # Mock JWT token for testing
        with patch("app.auth.get_current_user", return_value=test_user):
            return {"Authorization": "Bearer test_token"}

    async def test_list_templates(
        self, client: TestClient, auth_headers, db_session: Session
    ):
        """Test listing templates endpoint."""
        # Create a test template
        template = Template(
            name="Test Template",
            description="Test description",
            category="sales",
            definition={"nodes": [], "edges": []},
            is_active=True,
        )
        db_session.add(template)
        db_session.commit()

        with patch("app.auth.get_current_user"):
            response = client.get("/api/templates/", headers=auth_headers)

        assert response.status_code == 200
        data = response.json()
        assert "templates" in data
        assert "total" in data
        assert data["total"] >= 1

    async def test_get_template(
        self, client: TestClient, auth_headers, db_session: Session
    ):
        """Test getting a specific template."""
        # Create a test template
        template = Template(
            name="Test Template",
            description="Test description",
            category="sales",
            definition={"nodes": [], "edges": []},
            is_active=True,
        )
        db_session.add(template)
        db_session.commit()

        with patch("app.auth.get_current_user"):
            response = client.get(f"/api/templates/{template.id}", headers=auth_headers)

        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Test Template"
        assert data["category"] == "sales"

    async def test_create_template(self, client: TestClient, auth_headers):
        """Test creating a new template."""
        template_data = {
            "name": "New Template",
            "description": "A new template",
            "category": "sales",
            "definition": {"nodes": [{"id": "start", "type": "start"}], "edges": []},
            "parameters": [
                {
                    "name": "test_param",
                    "description": "Test parameter",
                    "parameter_type": "string",
                    "is_required": True,
                }
            ],
        }

        with patch("app.auth.get_current_user"):
            response = client.post(
                "/api/templates/", json=template_data, headers=auth_headers
            )

        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "New Template"
        assert len(data["parameters"]) == 1

    async def test_instantiate_template(
        self, client: TestClient, auth_headers, db_session: Session, test_user: User
    ):
        """Test instantiating a workflow from a template."""
        # Create a test template with parameters
        template = Template(
            name="Test Template",
            description="Test description",
            category="sales",
            definition={
                "nodes": [
                    {
                        "id": "start",
                        "type": "start",
                        "data": {"label": "Start: {{param1}}"},
                    }
                ],
                "edges": [],
            },
            is_active=True,
        )
        db_session.add(template)
        db_session.flush()

        # Add a parameter
        param = TemplateParameter(
            template_id=template.id,
            name="param1",
            description="Test parameter",
            parameter_type="string",
            is_required=True,
        )
        db_session.add(param)
        db_session.commit()

        instantiate_data = {
            "name": "New Workflow",
            "description": "Workflow from template",
            "parameter_values": {"param1": "test_value"},
        }

        with patch("app.auth.get_current_user", return_value=test_user):
            response = client.post(
                f"/api/templates/{template.id}/instantiate",
                json=instantiate_data,
                headers=auth_headers,
            )

        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "New Workflow"
        assert "test_value" in json.dumps(data["definition"])

    async def test_list_categories(
        self, client: TestClient, auth_headers, db_session: Session
    ):
        """Test listing template categories."""
        # Create templates with different categories
        categories = ["sales", "service", "parts"]
        for category in categories:
            template = Template(
                name=f"Template {category}",
                description="Test",
                category=category,
                definition={"nodes": [], "edges": []},
                is_active=True,
            )
            db_session.add(template)
        db_session.commit()

        with patch("app.auth.get_current_user"):
            response = client.get(
                "/api/templates/categories/list", headers=auth_headers
            )

        assert response.status_code == 200
        data = response.json()
        assert "categories" in data
        assert len(data["categories"]) >= 3
