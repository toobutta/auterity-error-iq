"""
Inference API for NeuroWeaver backend
Handles model inference requests
"""

from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional, Dict, Any
from pydantic import BaseModel
from datetime import datetime
import uuid

from app.core.auth import get_current_user, User
from app.core.logging import logger
from app.services.model_registry import ModelRegistry

router = APIRouter()

class InferenceRequest(BaseModel):
    """Inference request model"""
    prompt: str
    model_id: Optional[str] = None
    specialization: Optional[str] = None
    max_tokens: int = 1000
    temperature: float = 0.7
    top_p: float = 0.9
    context: Optional[Dict] = None

class InferenceResponse(BaseModel):
    """Inference response model"""
    request_id: str
    model_id: str
    model_name: str
    response: str
    tokens_used: int
    response_time_ms: int
    timestamp: datetime
    confidence_score: Optional[float] = None

class BatchInferenceRequest(BaseModel):
    """Batch inference request model"""
    requests: List[InferenceRequest]
    model_id: Optional[str] = None
    specialization: Optional[str] = None

class BatchInferenceResponse(BaseModel):
    """Batch inference response model"""
    batch_id: str
    responses: List[InferenceResponse]
    total_requests: int
    successful_requests: int
    failed_requests: int
    total_response_time_ms: int

# Initialize services
model_registry = ModelRegistry()

@router.post("/", response_model=InferenceResponse)
async def run_inference(
    request: InferenceRequest,
    current_user: User = Depends(get_current_user)
):
    """Run inference on a single request"""
    try:
        start_time = datetime.utcnow()
        request_id = str(uuid.uuid4())
        
        # Select model
        model = await select_model(request.model_id, request.specialization)
        if not model:
            raise HTTPException(
                status_code=404, 
                detail="No suitable model found for the request"
            )
        
        # Run inference
        response_text, confidence = await run_model_inference(
            model, 
            request.prompt, 
            request.max_tokens,
            request.temperature,
            request.top_p,
            request.context
        )
        
        # Calculate response time
        end_time = datetime.utcnow()
        response_time_ms = int((end_time - start_time).total_seconds() * 1000)
        
        # Count tokens (simplified)
        tokens_used = len(response_text.split()) + len(request.prompt.split())
        
        logger.info(f"Inference completed for request {request_id} using model {model.id}")
        
        return InferenceResponse(
            request_id=request_id,
            model_id=model.id,
            model_name=model.name,
            response=response_text,
            tokens_used=tokens_used,
            response_time_ms=response_time_ms,
            timestamp=end_time,
            confidence_score=confidence
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Inference failed: {e}")
        raise HTTPException(status_code=500, detail=f"Inference failed: {str(e)}")

@router.post("/batch", response_model=BatchInferenceResponse)
async def run_batch_inference(
    batch_request: BatchInferenceRequest,
    current_user: User = Depends(get_current_user)
):
    """Run inference on multiple requests"""
    try:
        start_time = datetime.utcnow()
        batch_id = str(uuid.uuid4())
        
        responses = []
        successful_count = 0
        failed_count = 0
        
        for req in batch_request.requests:
            try:
                # Use batch-level model selection if not specified per request
                model_id = req.model_id or batch_request.model_id
                specialization = req.specialization or batch_request.specialization
                
                # Create individual request
                individual_request = InferenceRequest(
                    prompt=req.prompt,
                    model_id=model_id,
                    specialization=specialization,
                    max_tokens=req.max_tokens,
                    temperature=req.temperature,
                    top_p=req.top_p,
                    context=req.context
                )
                
                # Run inference
                response = await run_inference(individual_request, current_user)
                responses.append(response)
                successful_count += 1
                
            except Exception as e:
                logger.error(f"Batch inference item failed: {e}")
                failed_count += 1
                # Continue with other requests
        
        end_time = datetime.utcnow()
        total_response_time_ms = int((end_time - start_time).total_seconds() * 1000)
        
        logger.info(f"Batch inference {batch_id} completed: {successful_count} successful, {failed_count} failed")
        
        return BatchInferenceResponse(
            batch_id=batch_id,
            responses=responses,
            total_requests=len(batch_request.requests),
            successful_requests=successful_count,
            failed_requests=failed_count,
            total_response_time_ms=total_response_time_ms
        )
        
    except Exception as e:
        logger.error(f"Batch inference failed: {e}")
        raise HTTPException(status_code=500, detail=f"Batch inference failed: {str(e)}")

@router.get("/models", response_model=List[Dict])
async def list_available_models(
    specialization: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    """List available models for inference"""
    try:
        models = await model_registry.list_models(
            specialization=specialization,
            status="deployed"
        )
        
        return [
            {
                "id": model.id,
                "name": model.name,
                "specialization": model.specialization,
                "version": model.version,
                "performance_metrics": model.performance_metrics,
                "endpoint": model.deployment_info.get("endpoint") if model.deployment_info else None
            }
            for model in models
        ]
        
    except Exception as e:
        logger.error(f"Failed to list available models: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve available models")

@router.get("/models/{model_id}/info")
async def get_model_info(
    model_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get detailed information about a specific model"""
    try:
        model = await model_registry.get_model(model_id)
        if not model:
            raise HTTPException(status_code=404, detail="Model not found")
        
        if model.status != "deployed":
            raise HTTPException(
                status_code=400, 
                detail=f"Model is not available for inference. Status: {model.status}"
            )
        
        return {
            "id": model.id,
            "name": model.name,
            "description": model.description,
            "specialization": model.specialization,
            "version": model.version,
            "status": model.status,
            "performance_metrics": model.performance_metrics,
            "deployment_info": model.deployment_info,
            "capabilities": [
                "text-generation",
                "conversation",
                f"{model.specialization}-specialized"
            ]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get model info for {model_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve model information")

@router.post("/models/{model_id}/test")
async def test_model(
    model_id: str,
    test_prompt: str = "Hello, how can you help me?",
    current_user: User = Depends(get_current_user)
):
    """Test a model with a simple prompt"""
    try:
        model = await model_registry.get_model(model_id)
        if not model:
            raise HTTPException(status_code=404, detail="Model not found")
        
        if model.status != "deployed":
            raise HTTPException(
                status_code=400, 
                detail=f"Model is not available for testing. Status: {model.status}"
            )
        
        # Run test inference
        request = InferenceRequest(
            prompt=test_prompt,
            model_id=model_id,
            max_tokens=100,
            temperature=0.7
        )
        
        response = await run_inference(request, current_user)
        
        return {
            "test_successful": True,
            "model_id": model_id,
            "model_name": model.name,
            "test_prompt": test_prompt,
            "response": response.response,
            "response_time_ms": response.response_time_ms,
            "confidence_score": response.confidence_score
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Model test failed for {model_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Model test failed: {str(e)}")

# Helper functions

async def select_model(model_id: Optional[str], specialization: Optional[str]):
    """Select the best model for the request"""
    if model_id:
        # Use specific model
        model = await model_registry.get_model(model_id)
        if model and model.status == "deployed":
            return model
        return None
    
    elif specialization:
        # Find best model for specialization
        models = await model_registry.get_models_by_specialization(specialization)
        if models:
            # Return the model with best performance metrics
            return max(models, key=lambda m: m.performance_metrics.get("accuracy", 0) if m.performance_metrics else 0)
        return None
    
    else:
        # Return any available model
        models = await model_registry.list_models(status="deployed", limit=1)
        return models[0] if models else None

async def run_model_inference(
    model, 
    prompt: str, 
    max_tokens: int,
    temperature: float,
    top_p: float,
    context: Optional[Dict]
) -> tuple[str, float]:
    """Run inference on the model"""
    # Placeholder implementation
    # In real implementation, this would:
    # 1. Send request to model endpoint
    # 2. Handle model-specific formatting
    # 3. Process response
    # 4. Calculate confidence score
    
    # Simulate specialized responses based on model specialization
    specialization_responses = {
        "automotive-sales": f"As an automotive sales specialist, I can help you with {prompt.lower()}. Let me provide you with detailed information about our vehicle options and financing solutions.",
        "service-advisor": f"As a service advisor, I understand your concern about {prompt.lower()}. Let me explain the maintenance requirements and service options available.",
        "parts-specialist": f"Regarding {prompt.lower()}, I can help you identify the correct parts and provide availability information for your vehicle.",
        "finance-advisor": f"For your financing needs related to {prompt.lower()}, I can explain our various loan options and help calculate payment plans."
    }
    
    # Generate response based on specialization
    if model.specialization in specialization_responses:
        response = specialization_responses[model.specialization]
    else:
        response = f"I can help you with {prompt}. Here's my response based on my training."
    
    # Simulate confidence score
    confidence = 0.85 + (hash(prompt) % 15) / 100  # Simulated confidence between 0.85-1.0
    
    return response, confidence