"""
NeuroWeaver Model Management API
Handles model registration, deployment, and lifecycle management
"""

from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from typing import List, Optional
from pydantic import BaseModel
import uuid
from datetime import datetime

from app.core.auth import get_current_user
from app.core.logging import logger
from app.services.model_registry import ModelRegistry, ModelInfo
from app.services.model_deployer import ModelDeployer
from app.services.relaycore_connector import RelayCoreConnector

router = APIRouter()

# Pydantic models for API
class ModelRegistrationRequest(BaseModel):
    name: str
    description: str
    specialization: str
    base_model: str
    training_data_path: Optional[str] = None
    hyperparameters: Optional[dict] = None
    auto_deploy: bool = False

class ModelDeploymentRequest(BaseModel):
    model_id: str
    deployment_config: Optional[dict] = None
    register_with_relaycore: bool = True

class ModelUpdateRequest(BaseModel):
    description: Optional[str] = None
    status: Optional[str] = None
    performance_metrics: Optional[dict] = None

class ModelResponse(BaseModel):
    id: str
    name: str
    description: str
    specialization: str
    status: str
    version: str
    created_at: datetime
    updated_at: datetime
    performance_metrics: Optional[dict] = None
    deployment_info: Optional[dict] = None

# Initialize services
model_registry = ModelRegistry()
model_deployer = ModelDeployer()
relaycore_connector = RelayCoreConnector()

@router.get("/", response_model=List[ModelResponse])
async def list_models(
    specialization: Optional[str] = None,
    status: Optional[str] = None,
    current_user = Depends(get_current_user)
):
    """List all registered models with optional filtering"""
    try:
        models = await model_registry.list_models(
            specialization=specialization,
            status=status
        )
        
        return [
            ModelResponse(
                id=model.id,
                name=model.name,
                description=model.description,
                specialization=model.specialization,
                status=model.status,
                version=model.version,
                created_at=model.created_at,
                updated_at=model.updated_at,
                performance_metrics=model.performance_metrics,
                deployment_info=model.deployment_info
            )
            for model in models
        ]
    except Exception as e:
        logger.error(f"Failed to list models: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve models")

@router.post("/register", response_model=ModelResponse)
async def register_model(
    request: ModelRegistrationRequest,
    background_tasks: BackgroundTasks,
    current_user = Depends(get_current_user)
):
    """Register a new model for training or deployment"""
    try:
        model_id = str(uuid.uuid4())
        
        model_info = ModelInfo(
            id=model_id,
            name=request.name,
            description=request.description,
            specialization=request.specialization,
            base_model=request.base_model,
            status="registered",
            version="1.0.0",
            created_by=current_user.username,
            training_config={
                "training_data_path": request.training_data_path,
                "hyperparameters": request.hyperparameters or {},
                "auto_deploy": request.auto_deploy
            }
        )
        
        # Register model in database
        registered_model = await model_registry.register_model(model_info)
        
        # Start training if training data is provided
        if request.training_data_path:
            background_tasks.add_task(
                start_model_training,
                model_id,
                request.training_data_path,
                request.hyperparameters or {}
            )
        
        logger.info(f"Model {model_id} registered successfully by {current_user.username}")
        
        return ModelResponse(
            id=registered_model.id,
            name=registered_model.name,
            description=registered_model.description,
            specialization=registered_model.specialization,
            status=registered_model.status,
            version=registered_model.version,
            created_at=registered_model.created_at,
            updated_at=registered_model.updated_at,
            performance_metrics=registered_model.performance_metrics,
            deployment_info=registered_model.deployment_info
        )
        
    except Exception as e:
        logger.error(f"Failed to register model: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to register model: {str(e)}")

@router.get("/{model_id}", response_model=ModelResponse)
async def get_model(
    model_id: str,
    current_user = Depends(get_current_user)
):
    """Get detailed information about a specific model"""
    try:
        model = await model_registry.get_model(model_id)
        if not model:
            raise HTTPException(status_code=404, detail="Model not found")
        
        return ModelResponse(
            id=model.id,
            name=model.name,
            description=model.description,
            specialization=model.specialization,
            status=model.status,
            version=model.version,
            created_at=model.created_at,
            updated_at=model.updated_at,
            performance_metrics=model.performance_metrics,
            deployment_info=model.deployment_info
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get model {model_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve model")

@router.put("/{model_id}", response_model=ModelResponse)
async def update_model(
    model_id: str,
    request: ModelUpdateRequest,
    current_user = Depends(get_current_user)
):
    """Update model information"""
    try:
        model = await model_registry.get_model(model_id)
        if not model:
            raise HTTPException(status_code=404, detail="Model not found")
        
        # Update fields
        if request.description:
            model.description = request.description
        if request.status:
            model.status = request.status
        if request.performance_metrics:
            model.performance_metrics = request.performance_metrics
        
        updated_model = await model_registry.update_model(model)
        
        logger.info(f"Model {model_id} updated by {current_user.username}")
        
        return ModelResponse(
            id=updated_model.id,
            name=updated_model.name,
            description=updated_model.description,
            specialization=updated_model.specialization,
            status=updated_model.status,
            version=updated_model.version,
            created_at=updated_model.created_at,
            updated_at=updated_model.updated_at,
            performance_metrics=updated_model.performance_metrics,
            deployment_info=updated_model.deployment_info
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to update model {model_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to update model")

@router.post("/{model_id}/deploy")
async def deploy_model(
    model_id: str,
    request: ModelDeploymentRequest,
    background_tasks: BackgroundTasks,
    current_user = Depends(get_current_user)
):
    """Deploy a trained model for inference"""
    try:
        model = await model_registry.get_model(model_id)
        if not model:
            raise HTTPException(status_code=404, detail="Model not found")
        
        if model.status != "trained":
            raise HTTPException(
                status_code=400, 
                detail=f"Model must be trained before deployment. Current status: {model.status}"
            )
        
        # Start deployment process
        background_tasks.add_task(
            deploy_model_task,
            model_id,
            request.deployment_config or {},
            request.register_with_relaycore,
            current_user.username
        )
        
        # Update model status
        model.status = "deploying"
        await model_registry.update_model(model)
        
        logger.info(f"Model {model_id} deployment started by {current_user.username}")
        
        return {
            "message": "Model deployment started",
            "model_id": model_id,
            "status": "deploying"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to deploy model {model_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to start model deployment")

@router.delete("/{model_id}")
async def delete_model(
    model_id: str,
    current_user = Depends(get_current_user)
):
    """Delete a model and its associated resources"""
    try:
        model = await model_registry.get_model(model_id)
        if not model:
            raise HTTPException(status_code=404, detail="Model not found")
        
        # Undeploy if deployed
        if model.status == "deployed":
            await model_deployer.undeploy_model(model_id)
        
        # Delete from registry
        await model_registry.delete_model(model_id)
        
        logger.info(f"Model {model_id} deleted by {current_user.username}")
        
        return {"message": "Model deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to delete model {model_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete model")

# Background tasks
async def start_model_training(model_id: str, training_data_path: str, hyperparameters: dict):
    """Background task to start model training"""
    try:
        # Update status to training
        model = await model_registry.get_model(model_id)
        model.status = "training"
        await model_registry.update_model(model)
        
        # Start training process (placeholder - implement actual training logic)
        logger.info(f"Starting training for model {model_id}")
        
        # Simulate training completion
        # In real implementation, this would trigger actual training pipeline
        
    except Exception as e:
        logger.error(f"Training failed for model {model_id}: {e}")
        # Update status to failed
        model = await model_registry.get_model(model_id)
        if model:
            model.status = "training_failed"
            await model_registry.update_model(model)

async def deploy_model_task(model_id: str, deployment_config: dict, register_with_relaycore: bool, username: str):
    """Background task to deploy model"""
    try:
        # Deploy model
        deployment_info = await model_deployer.deploy_model(model_id, deployment_config)
        
        # Update model status and deployment info
        model = await model_registry.get_model(model_id)
        model.status = "deployed"
        model.deployment_info = deployment_info
        await model_registry.update_model(model)
        
        # Register with RelayCore if requested
        if register_with_relaycore:
            await relaycore_connector.register_model(model)
        
        logger.info(f"Model {model_id} deployed successfully")
        
    except Exception as e:
        logger.error(f"Deployment failed for model {model_id}: {e}")
        # Update status to failed
        model = await model_registry.get_model(model_id)
        if model:
            model.status = "deployment_failed"
            await model_registry.update_model(model)