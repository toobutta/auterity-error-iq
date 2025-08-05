"""
Training API for NeuroWeaver backend
Handles model training requests and monitoring
"""

from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from typing import List, Optional, Dict
from pydantic import BaseModel
from datetime import datetime
import uuid

from app.core.auth import get_current_user, User
from app.core.logging import logger
from app.services.model_registry import ModelRegistry

router = APIRouter()

class TrainingRequest(BaseModel):
    """Training request model"""
    model_name: str
    base_model: str
    specialization: str
    training_data_path: str
    validation_data_path: Optional[str] = None
    hyperparameters: Optional[Dict] = None
    auto_deploy: bool = False

class TrainingJobResponse(BaseModel):
    """Training job response model"""
    job_id: str
    model_id: str
    status: str
    created_at: datetime
    estimated_completion: Optional[datetime] = None

class TrainingStatus(BaseModel):
    """Training status model"""
    job_id: str
    model_id: str
    status: str
    progress_percent: float
    current_epoch: Optional[int] = None
    total_epochs: Optional[int] = None
    loss: Optional[float] = None
    accuracy: Optional[float] = None
    estimated_time_remaining: Optional[int] = None  # seconds

# Initialize services
model_registry = ModelRegistry()

@router.post("/start", response_model=TrainingJobResponse)
async def start_training(
    request: TrainingRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user)
):
    """Start a new training job"""
    try:
        # Generate IDs
        job_id = str(uuid.uuid4())
        model_id = str(uuid.uuid4())
        
        # Create model record
        from app.services.model_registry import ModelInfo
        model_info = ModelInfo(
            id=model_id,
            name=request.model_name,
            description=f"Training job {job_id}",
            specialization=request.specialization,
            base_model=request.base_model,
            status="training",
            version="1.0.0",
            created_by=current_user.username,
            training_config={
                "job_id": job_id,
                "training_data_path": request.training_data_path,
                "validation_data_path": request.validation_data_path,
                "hyperparameters": request.hyperparameters or {},
                "auto_deploy": request.auto_deploy
            }
        )
        
        # Register model
        await model_registry.register_model(model_info)
        
        # Start training in background
        background_tasks.add_task(
            run_training_job,
            job_id,
            model_id,
            request.training_data_path,
            request.hyperparameters or {},
            current_user.username
        )
        
        logger.info(f"Training job {job_id} started for model {model_id} by {current_user.username}")
        
        return TrainingJobResponse(
            job_id=job_id,
            model_id=model_id,
            status="training",
            created_at=datetime.utcnow()
        )
        
    except Exception as e:
        logger.error(f"Failed to start training job: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to start training: {str(e)}")

@router.get("/jobs", response_model=List[TrainingJobResponse])
async def list_training_jobs(
    status: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    """List training jobs"""
    try:
        # Get models with training status
        models = await model_registry.list_models(status=status)
        
        jobs = []
        for model in models:
            if model.training_config and "job_id" in model.training_config:
                jobs.append(TrainingJobResponse(
                    job_id=model.training_config["job_id"],
                    model_id=model.id,
                    status=model.status,
                    created_at=model.created_at
                ))
        
        return jobs
        
    except Exception as e:
        logger.error(f"Failed to list training jobs: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve training jobs")

@router.get("/jobs/{job_id}/status", response_model=TrainingStatus)
async def get_training_status(
    job_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get training job status"""
    try:
        # Find model by job_id
        models = await model_registry.list_models()
        model = None
        
        for m in models:
            if m.training_config and m.training_config.get("job_id") == job_id:
                model = m
                break
        
        if not model:
            raise HTTPException(status_code=404, detail="Training job not found")
        
        # Get training progress (placeholder implementation)
        progress_data = await get_training_progress(job_id)
        
        return TrainingStatus(
            job_id=job_id,
            model_id=model.id,
            status=model.status,
            progress_percent=progress_data.get("progress_percent", 0.0),
            current_epoch=progress_data.get("current_epoch"),
            total_epochs=progress_data.get("total_epochs"),
            loss=progress_data.get("loss"),
            accuracy=progress_data.get("accuracy"),
            estimated_time_remaining=progress_data.get("estimated_time_remaining")
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get training status for job {job_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve training status")

@router.post("/jobs/{job_id}/cancel")
async def cancel_training_job(
    job_id: str,
    current_user: User = Depends(get_current_user)
):
    """Cancel a training job"""
    try:
        # Find model by job_id
        models = await model_registry.list_models()
        model = None
        
        for m in models:
            if m.training_config and m.training_config.get("job_id") == job_id:
                model = m
                break
        
        if not model:
            raise HTTPException(status_code=404, detail="Training job not found")
        
        if model.status not in ["training", "queued"]:
            raise HTTPException(
                status_code=400, 
                detail=f"Cannot cancel job in status: {model.status}"
            )
        
        # Cancel training (placeholder implementation)
        await cancel_training_process(job_id)
        
        # Update model status
        model.status = "cancelled"
        await model_registry.update_model(model)
        
        logger.info(f"Training job {job_id} cancelled by {current_user.username}")
        
        return {"message": "Training job cancelled successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to cancel training job {job_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to cancel training job")

@router.get("/jobs/{job_id}/logs")
async def get_training_logs(
    job_id: str,
    lines: int = 100,
    current_user: User = Depends(get_current_user)
):
    """Get training job logs"""
    try:
        # Find model by job_id
        models = await model_registry.list_models()
        model = None
        
        for m in models:
            if m.training_config and m.training_config.get("job_id") == job_id:
                model = m
                break
        
        if not model:
            raise HTTPException(status_code=404, detail="Training job not found")
        
        # Get logs (placeholder implementation)
        logs = await get_training_job_logs(job_id, lines)
        
        return {
            "job_id": job_id,
            "model_id": model.id,
            "logs": logs,
            "total_lines": len(logs)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get training logs for job {job_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve training logs")

# Background tasks and helper functions

async def run_training_job(
    job_id: str, 
    model_id: str, 
    training_data_path: str, 
    hyperparameters: Dict,
    username: str
):
    """Background task to run training job"""
    try:
        logger.info(f"Starting training job {job_id} for model {model_id}")
        
        # Simulate training process
        # In real implementation, this would:
        # 1. Load training data
        # 2. Initialize model
        # 3. Run training loop
        # 4. Save model checkpoints
        # 5. Evaluate on validation set
        
        import asyncio
        
        # Simulate training epochs
        total_epochs = hyperparameters.get("epochs", 10)
        for epoch in range(total_epochs):
            # Simulate epoch training
            await asyncio.sleep(2)  # Simulate training time
            
            # Update progress
            progress = (epoch + 1) / total_epochs * 100
            await update_training_progress(job_id, {
                "progress_percent": progress,
                "current_epoch": epoch + 1,
                "total_epochs": total_epochs,
                "loss": 0.5 - (epoch * 0.05),  # Simulated decreasing loss
                "accuracy": 0.7 + (epoch * 0.02)  # Simulated increasing accuracy
            })
        
        # Mark training as completed
        model = await model_registry.get_model(model_id)
        if model:
            model.status = "trained"
            model.performance_metrics = {
                "final_loss": 0.1,
                "final_accuracy": 0.9,
                "training_time_minutes": total_epochs * 2 / 60
            }
            await model_registry.update_model(model)
        
        logger.info(f"Training job {job_id} completed successfully")
        
    except Exception as e:
        logger.error(f"Training job {job_id} failed: {e}")
        
        # Mark training as failed
        model = await model_registry.get_model(model_id)
        if model:
            model.status = "training_failed"
            await model_registry.update_model(model)

async def get_training_progress(job_id: str) -> Dict:
    """Get training progress for a job"""
    # Placeholder implementation
    # In real implementation, this would read from training logs or database
    return {
        "progress_percent": 75.0,
        "current_epoch": 8,
        "total_epochs": 10,
        "loss": 0.15,
        "accuracy": 0.85,
        "estimated_time_remaining": 300
    }

async def update_training_progress(job_id: str, progress_data: Dict):
    """Update training progress"""
    # Placeholder implementation
    # In real implementation, this would store progress in database or cache
    logger.info(f"Training progress for job {job_id}: {progress_data}")

async def cancel_training_process(job_id: str):
    """Cancel training process"""
    # Placeholder implementation
    # In real implementation, this would stop the training process
    logger.info(f"Cancelling training job {job_id}")

async def get_training_job_logs(job_id: str, lines: int) -> List[str]:
    """Get training job logs"""
    # Placeholder implementation
    # In real implementation, this would read from log files
    return [
        f"[{datetime.utcnow().isoformat()}] Training job {job_id} started",
        f"[{datetime.utcnow().isoformat()}] Loading training data...",
        f"[{datetime.utcnow().isoformat()}] Initializing model...",
        f"[{datetime.utcnow().isoformat()}] Starting training loop...",
        f"[{datetime.utcnow().isoformat()}] Epoch 1/10 - Loss: 0.45, Accuracy: 0.72"
    ]