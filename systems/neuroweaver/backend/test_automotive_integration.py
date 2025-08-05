"""
NeuroWeaver Automotive Integration Tests
Tests for automotive templates, training pipeline, and API endpoints
"""

import pytest
import asyncio
import json
from httpx import AsyncClient
from datetime import datetime

from app.main import app
from app.core.config import settings
from app.services.automotive_templates import AutomotiveTemplateService
from app.services.training_pipeline import TrainingPipelineService


@pytest.fixture
async def client():
    """Create test client"""
    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac


@pytest.fixture
async def auth_headers():
    """Create authentication headers for testing"""
    # In a real implementation, you would create a valid JWT token
    return {"Authorization": "Bearer test-token"}


@pytest.fixture
async def template_service():
    """Create template service instance"""
    return AutomotiveTemplateService()


@pytest.fixture
async def training_service():
    """Create training service instance"""
    return TrainingPipelineService()


class TestAutomotiveTemplates:
    """Test automotive template functionality"""
    
    async def test_get_templates(self, client: AsyncClient, auth_headers: dict):
        """Test getting automotive templates"""
        response = await client.get("/api/v1/automotive/templates", headers=auth_headers)
        assert response.status_code == 200
        
        templates = response.json()
        assert isinstance(templates, list)
        
        # Check that default templates exist
        template_names = [t["name"] for t in templates]
        assert "Service Advisor Assistant" in template_names
        assert "Sales Assistant" in template_names
    
    async def test_get_template_by_id(self, client: AsyncClient, auth_headers: dict):
        """Test getting specific template"""
        template_id = "dealership_service_advisor"
        response = await client.get(f"/api/v1/automotive/templates/{template_id}", headers=auth_headers)
        assert response.status_code == 200
        
        template = response.json()
        assert template["id"] == template_id
        assert template["category"] == "service"
        assert template["specialization"] == "service_advisor"
    
    async def test_template_instantiation(self, client: AsyncClient, auth_headers: dict):
        """Test template instantiation"""
        instantiation_request = {
            "template_id": "dealership_service_advisor",
            "inputs": {
                "make": "Toyota",
                "model": "Camry",
                "year": "2020",
                "mileage": "45000",
                "last_service_date": "6 months ago",
                "customer_concern": "Strange noise when braking"
            }
        }
        
        response = await client.post(
            "/api/v1/automotive/templates/instantiate",
            json=instantiation_request,
            headers=auth_headers
        )
        assert response.status_code == 200
        
        result = response.json()
        assert result["template_id"] == "dealership_service_advisor"
        assert "result" in result
        assert len(result["result"]) > 0
        assert result["processing_time_ms"] > 0
    
    async def test_filter_templates_by_category(self, client: AsyncClient, auth_headers: dict):
        """Test filtering templates by category"""
        response = await client.get("/api/v1/automotive/templates?category=service", headers=auth_headers)
        assert response.status_code == 200
        
        templates = response.json()
        for template in templates:
            assert template["category"] == "service"
    
    async def test_filter_templates_by_specialization(self, client: AsyncClient, auth_headers: dict):
        """Test filtering templates by specialization"""
        response = await client.get("/api/v1/automotive/templates?specialization=sales_assistant", headers=auth_headers)
        assert response.status_code == 200
        
        templates = response.json()
        for template in templates:
            assert template["specialization"] == "sales_assistant"


class TestAutomotiveDatasets:
    """Test automotive dataset functionality"""
    
    async def test_get_datasets(self, client: AsyncClient, auth_headers: dict):
        """Test getting automotive datasets"""
        response = await client.get("/api/v1/automotive/datasets", headers=auth_headers)
        assert response.status_code == 200
        
        datasets = response.json()
        assert isinstance(datasets, list)
        
        # Check that default datasets exist
        dataset_names = [d["name"] for d in datasets]
        assert "Comprehensive Dealership Q&A" in dataset_names
        assert "2024 Vehicle Specifications Database" in dataset_names
    
    async def test_get_dataset_by_id(self, client: AsyncClient, auth_headers: dict):
        """Test getting specific dataset"""
        dataset_id = "dealership_qa_comprehensive"
        response = await client.get(f"/api/v1/automotive/datasets/{dataset_id}", headers=auth_headers)
        assert response.status_code == 200
        
        dataset = response.json()
        assert dataset["id"] == dataset_id
        assert dataset["category"] == "general"
        assert dataset["format"] == "jsonl"
    
    async def test_filter_datasets_by_category(self, client: AsyncClient, auth_headers: dict):
        """Test filtering datasets by category"""
        response = await client.get("/api/v1/automotive/datasets?category=service", headers=auth_headers)
        assert response.status_code == 200
        
        datasets = response.json()
        for dataset in datasets:
            assert dataset["category"] == "service"


class TestTrainingPipeline:
    """Test training pipeline functionality"""
    
    async def test_start_training_pipeline(self, client: AsyncClient, auth_headers: dict):
        """Test starting training pipeline"""
        training_request = {
            "model_name": "test-service-advisor",
            "base_model": "gpt-3.5-turbo",
            "specialization": "service_advisor",
            "dataset_id": "service_procedures_manual",
            "epochs": 1,
            "batch_size": 4,
            "learning_rate": 2e-4,
            "enable_rlaif": False
        }
        
        response = await client.post(
            "/api/v1/automotive/training/start",
            json=training_request,
            headers=auth_headers
        )
        assert response.status_code == 200
        
        result = response.json()
        assert "job_id" in result
        assert "model_id" in result
        assert result["status"] == "training"
    
    async def test_get_training_status(self, client: AsyncClient, auth_headers: dict):
        """Test getting training status"""
        # First start a training job
        training_request = {
            "model_name": "test-status-check",
            "base_model": "gpt-3.5-turbo",
            "specialization": "service_advisor",
            "dataset_id": "service_procedures_manual",
            "epochs": 1
        }
        
        start_response = await client.post(
            "/api/v1/automotive/training/start",
            json=training_request,
            headers=auth_headers
        )
        job_id = start_response.json()["job_id"]
        
        # Check training status
        response = await client.get(f"/api/v1/automotive/training/{job_id}/status", headers=auth_headers)
        assert response.status_code == 200
        
        status = response.json()
        assert status["job_id"] == job_id
        assert "status" in status
        assert "progress_percent" in status
    
    async def test_cancel_training(self, client: AsyncClient, auth_headers: dict):
        """Test cancelling training job"""
        # First start a training job
        training_request = {
            "model_name": "test-cancel",
            "base_model": "gpt-3.5-turbo",
            "specialization": "service_advisor",
            "dataset_id": "service_procedures_manual",
            "epochs": 1
        }
        
        start_response = await client.post(
            "/api/v1/automotive/training/start",
            json=training_request,
            headers=auth_headers
        )
        job_id = start_response.json()["job_id"]
        
        # Cancel the job
        response = await client.post(f"/api/v1/automotive/training/{job_id}/cancel", headers=auth_headers)
        assert response.status_code == 200
        
        result = response.json()
        assert "message" in result


class TestSpecializationInfo:
    """Test specialization and category info endpoints"""
    
    async def test_get_specializations(self, client: AsyncClient, auth_headers: dict):
        """Test getting available specializations"""
        response = await client.get("/api/v1/automotive/info/specializations", headers=auth_headers)
        assert response.status_code == 200
        
        result = response.json()
        assert "specializations" in result
        
        specializations = result["specializations"]
        assert len(specializations) >= 4
        
        # Check required specializations exist
        spec_names = [s["name"] for s in specializations]
        assert "service_advisor" in spec_names
        assert "sales_assistant" in spec_names
        assert "parts_inventory" in spec_names
        assert "finance_advisor" in spec_names
    
    async def test_get_categories(self, client: AsyncClient, auth_headers: dict):
        """Test getting available categories"""
        response = await client.get("/api/v1/automotive/info/categories", headers=auth_headers)
        assert response.status_code == 200
        
        result = response.json()
        assert "categories" in result
        
        categories = result["categories"]
        assert len(categories) >= 4
        
        # Check required categories exist
        category_names = [c["name"] for c in categories]
        assert "service" in category_names
        assert "sales" in category_names
        assert "parts" in category_names
        assert "finance" in category_names


class TestTemplateService:
    """Test template service directly"""
    
    async def test_template_service_initialization(self, template_service: AutomotiveTemplateService):
        """Test template service initialization"""
        templates = await template_service.get_templates()
        assert len(templates) > 0
        
        datasets = await template_service.get_datasets()
        assert len(datasets) > 0
    
    async def test_create_custom_template(self, template_service: AutomotiveTemplateService):
        """Test creating custom template"""
        template_data = {
            "id": "test_custom_template",
            "name": "Test Custom Template",
            "description": "A test template for unit testing",
            "category": "test",
            "specialization": "test_specialist",
            "prompt_template": "Test prompt: {input}",
            "example_inputs": [{"input": "test input"}],
            "expected_outputs": ["test output"],
            "parameters": {"max_tokens": 100}
        }
        
        template = await template_service.create_custom_template(template_data)
        assert template.id == "test_custom_template"
        assert template.name == "Test Custom Template"
        
        # Verify it can be retrieved
        retrieved = await template_service.get_template("test_custom_template")
        assert retrieved is not None
        assert retrieved.name == "Test Custom Template"
    
    async def test_update_template(self, template_service: AutomotiveTemplateService):
        """Test updating existing template"""
        # First create a template
        template_data = {
            "id": "test_update_template",
            "name": "Original Name",
            "description": "Original description",
            "category": "test",
            "specialization": "test_specialist",
            "prompt_template": "Original prompt",
            "example_inputs": [],
            "expected_outputs": [],
            "parameters": {}
        }
        
        await template_service.create_custom_template(template_data)
        
        # Update the template
        updates = {
            "name": "Updated Name",
            "description": "Updated description"
        }
        
        updated = await template_service.update_template("test_update_template", updates)
        assert updated is not None
        assert updated.name == "Updated Name"
        assert updated.description == "Updated description"
    
    async def test_delete_template(self, template_service: AutomotiveTemplateService):
        """Test deleting template"""
        # First create a template
        template_data = {
            "id": "test_delete_template",
            "name": "To Be Deleted",
            "description": "This template will be deleted",
            "category": "test",
            "specialization": "test_specialist",
            "prompt_template": "Delete me",
            "example_inputs": [],
            "expected_outputs": [],
            "parameters": {}
        }
        
        await template_service.create_custom_template(template_data)
        
        # Verify it exists
        template = await template_service.get_template("test_delete_template")
        assert template is not None
        
        # Delete it
        success = await template_service.delete_template("test_delete_template")
        assert success is True
        
        # Verify it's gone
        template = await template_service.get_template("test_delete_template")
        assert template is None


class TestTrainingService:
    """Test training service directly"""
    
    async def test_training_service_initialization(self, training_service: TrainingPipelineService):
        """Test training service initialization"""
        # Test getting training progress for non-existent job
        progress = await training_service.get_training_progress("non-existent-job")
        assert "job_id" in progress
        assert progress["job_id"] == "non-existent-job"
    
    async def test_cancel_non_existent_training(self, training_service: TrainingPipelineService):
        """Test cancelling non-existent training job"""
        success = await training_service.cancel_training("non-existent-job")
        assert success is True  # Service returns True even for non-existent jobs


# Integration test for full workflow
class TestFullWorkflow:
    """Test complete automotive AI workflow"""
    
    async def test_complete_workflow(self, client: AsyncClient, auth_headers: dict):
        """Test complete workflow from template to training"""
        # 1. Get available templates
        templates_response = await client.get("/api/v1/automotive/templates", headers=auth_headers)
        assert templates_response.status_code == 200
        templates = templates_response.json()
        assert len(templates) > 0
        
        # 2. Get available datasets
        datasets_response = await client.get("/api/v1/automotive/datasets", headers=auth_headers)
        assert datasets_response.status_code == 200
        datasets = datasets_response.json()
        assert len(datasets) > 0
        
        # 3. Instantiate a template
        service_template = next((t for t in templates if t["specialization"] == "service_advisor"), None)
        assert service_template is not None
        
        instantiation_request = {
            "template_id": service_template["id"],
            "inputs": service_template["example_inputs"][0] if service_template["example_inputs"] else {}
        }
        
        instantiation_response = await client.post(
            "/api/v1/automotive/templates/instantiate",
            json=instantiation_request,
            headers=auth_headers
        )
        assert instantiation_response.status_code == 200
        
        # 4. Start training with the dataset
        service_dataset = next((d for d in datasets if "service" in d["specializations"]), None)
        assert service_dataset is not None
        
        training_request = {
            "model_name": "integration-test-model",
            "base_model": "gpt-3.5-turbo",
            "specialization": "service_advisor",
            "dataset_id": service_dataset["id"],
            "template_ids": [service_template["id"]],
            "epochs": 1,
            "enable_rlaif": False
        }
        
        training_response = await client.post(
            "/api/v1/automotive/training/start",
            json=training_request,
            headers=auth_headers
        )
        assert training_response.status_code == 200
        
        training_result = training_response.json()
        job_id = training_result["job_id"]
        
        # 5. Check training status
        status_response = await client.get(f"/api/v1/automotive/training/{job_id}/status", headers=auth_headers)
        assert status_response.status_code == 200
        
        status = status_response.json()
        assert status["job_id"] == job_id
        
        # 6. Cancel training (to clean up)
        cancel_response = await client.post(f"/api/v1/automotive/training/{job_id}/cancel", headers=auth_headers)
        assert cancel_response.status_code == 200


if __name__ == "__main__":
    pytest.main([__file__, "-v"])