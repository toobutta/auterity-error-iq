"""
AI Models Configuration and Management API
Provides centralized access to AI model configurations and management
"""

import yaml
import json
from typing import List, Dict, Any, Optional
from pathlib import Path

from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.database import get_db
from app.models.user import User

router = APIRouter(prefix="/api/models", tags=["models"])

# Configuration endpoints (no auth required for basic info)
config_router = APIRouter(prefix="/models", tags=["model-config"])
router.include_router(config_router)


@config_router.get("/config")
async def get_model_configurations():
    """
    Get all AI model configurations from models.yaml
    """
    try:
        config_path = Path(__file__).parent.parent / "config" / "models.yaml"

        if not config_path.exists():
            # Return default configurations if file doesn't exist
            return get_default_configurations()

        with open(config_path, 'r') as file:
            config_data = yaml.safe_load(file)

        if not config_data or 'models' not in config_data:
            return get_default_configurations()

        return {
            "models": config_data['models'],
            "total_count": len(config_data['models']),
            "providers": list(set(model['provider'] for model in config_data['models'])),
            "capabilities": list(set(cap for model in config_data['models'] for cap in model['capabilities']))
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load model configurations: {str(e)}")


@config_router.get("/config/{provider}")
async def get_models_by_provider(provider: str):
    """
    Get models for a specific provider
    """
    try:
        config_path = Path(__file__).parent.parent / "config" / "models.yaml"

        if not config_path.exists():
            return {"models": [], "message": "Configuration file not found"}

        with open(config_path, 'r') as file:
            config_data = yaml.safe_load(file)

        if not config_data or 'models' not in config_data:
            return {"models": [], "message": "No models found"}

        provider_models = [
            model for model in config_data['models']
            if model['provider'].lower() == provider.lower() and model.get('is_available', True)
        ]

        return {
            "provider": provider,
            "models": provider_models,
            "count": len(provider_models)
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load provider models: {str(e)}")


@config_router.get("/config/capability/{capability}")
async def get_models_by_capability(capability: str):
    """
    Get models with a specific capability
    """
    try:
        config_path = Path(__file__).parent.parent / "config" / "models.yaml"

        if not config_path.exists():
            return {"models": [], "message": "Configuration file not found"}

        with open(config_path, 'r') as file:
            config_data = yaml.safe_load(file)

        if not config_data or 'models' not in config_data:
            return {"models": [], "message": "No models found"}

        capability_models = [
            model for model in config_data['models']
            if capability in model.get('capabilities', []) and model.get('is_available', True)
        ]

        return {
            "capability": capability,
            "models": capability_models,
            "count": len(capability_models)
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load capability models: {str(e)}")


@config_router.get("/stats")
async def get_model_statistics():
    """
    Get statistics about available models
    """
    try:
        config_path = Path(__file__).parent.parent / "config" / "models.yaml"

        if not config_path.exists():
            return get_default_statistics()

        with open(config_path, 'r') as file:
            config_data = yaml.safe_load(file)

        if not config_data or 'models' not in config_data:
            return get_default_statistics()

        models = config_data['models']
        available_models = [m for m in models if m.get('is_available', True)]

        # Provider distribution
        provider_counts = {}
        for model in available_models:
            provider = model['provider']
            provider_counts[provider] = provider_counts.get(provider, 0) + 1

        # Cost distribution
        free_models = len([m for m in available_models if m.get('cost_per_token', 0) == 0])
        low_cost = len([m for m in available_models if 0 < m.get('cost_per_token', 0) <= 0.001])
        medium_cost = len([m for m in available_models if 0.001 < m.get('cost_per_token', 0) <= 0.01])
        high_cost = len([m for m in available_models if m.get('cost_per_token', 0) > 0.01])

        # Capability distribution
        all_capabilities = set()
        for model in available_models:
            all_capabilities.update(model.get('capabilities', []))

        return {
            "total_models": len(models),
            "available_models": len(available_models),
            "providers": provider_counts,
            "cost_distribution": {
                "free": free_models,
                "low_cost": low_cost,
                "medium_cost": medium_cost,
                "high_cost": high_cost
            },
            "capabilities": list(all_capabilities),
            "local_models": len([m for m in available_models if 'local' in m.get('capabilities', []) or m.get('cost_per_token', 0) == 0])
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate statistics: {str(e)}")


# Authenticated endpoints for management
@router.get("/available")
async def get_available_models(
    current_user: User = Depends(get_current_user),
) -> List[Dict[str, Any]]:
    """Get list of available models with capabilities and costs."""
    try:
        config_path = Path(__file__).parent.parent / "config" / "models.yaml"

        if not config_path.exists():
            return get_default_configurations()['models']

        with open(config_path, 'r') as file:
            config_data = yaml.safe_load(file)

        if not config_data or 'models' not in config_data:
            return get_default_configurations()['models']

        return config_data['models']

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load models: {str(e)}")


@router.get("/usage")
async def get_model_usage(
    days: int = Query(7, ge=1, le=90),
    model: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    """Get model usage statistics and costs."""
    # TODO: Implement usage tracking from database
    return {
        "period_days": days,
        "model": model,
        "usage": {
            "total_requests": 0,
            "total_cost": 0.0,
            "average_cost_per_request": 0.0
        },
        "message": "Usage tracking to be implemented"
    }


@router.post("/health-check")
async def check_model_health(
    model: str, current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """Check health status of a specific model."""
    # TODO: Implement actual health checks
    return {
        "model": model,
        "status": "healthy",
        "response_time": 500,
        "last_checked": "2024-01-01T00:00:00Z",
        "message": "Health check to be implemented"
    }


@router.get("/health/{model_name}")
async def get_model_health(
    model_name: str,
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    """Get health status for a specific model."""
    try:
        # Import here to avoid circular dependencies
        import sys
        import os
        sys.path.append(os.path.join(os.path.dirname(__file__), '../../..'))

        # Try to import the model configuration service
        try:
            from src.services.modelConfigService import modelConfigurationService
            health_status = await modelConfigurationService.checkModelHealth(model_name)
            return {
                "model_name": health_status.model_name,
                "status": health_status.status,
                "response_time": health_status.response_time,
                "last_checked": health_status.last_checked.isoformat(),
                "message": health_status.message,
                "uptime_percentage": health_status.uptime_percentage,
                "total_requests": health_status.total_requests,
                "successful_requests": health_status.successful_requests,
                "cost_per_request": health_status.cost_per_request
            }
        except ImportError:
            # Fallback if service not available
            return {
                "model_name": model_name,
                "status": "unknown",
                "message": "Health monitoring service not available",
                "last_checked": "2024-01-01T00:00:00"
            }
    except Exception as e:
        return {
            "model_name": model_name,
            "status": "error",
            "message": f"Failed to check health: {str(e)}",
            "last_checked": "2024-01-01T00:00:00"
        }


@router.get("/health")
async def get_all_models_health(
    current_user: User = Depends(get_current_user),
) -> List[Dict[str, Any]]:
    """Get health status for all models."""
    try:
        # Import here to avoid circular dependencies
        import sys
        import os
        sys.path.append(os.path.join(os.path.dirname(__file__), '../../..'))

        try:
            from src.services.modelConfigService import modelConfigurationService
            health_statuses = modelConfigurationService.getAllModelHealth()
            return [{
                "model_name": status.model_name,
                "status": status.status,
                "response_time": status.response_time,
                "last_checked": status.last_checked.isoformat(),
                "message": status.message,
                "uptime_percentage": status.uptime_percentage,
                "total_requests": status.total_requests,
                "successful_requests": status.successful_requests,
                "cost_per_request": status.cost_per_request
            } for status in health_statuses]
        except ImportError:
            return []
    except Exception as e:
        return []


@router.post("/validate/{model_name}")
async def validate_model(
    model_name: str,
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    """Validate configuration for a specific model."""
    try:
        # Import here to avoid circular dependencies
        import sys
        import os
        sys.path.append(os.path.join(os.path.dirname(__file__), '../../..'))

        try:
            from src.services.modelConfigService import modelConfigurationService
            validation_result = await modelConfigurationService.validateModel(model_name)
            return {
                "model_name": validation_result.model_name,
                "is_valid": validation_result.is_valid,
                "errors": validation_result.errors,
                "warnings": validation_result.warnings,
                "performance_metrics": validation_result.performance_metrics,
                "cost_analysis": validation_result.cost_analysis
            }
        except ImportError:
            return {
                "model_name": model_name,
                "is_valid": False,
                "errors": ["Validation service not available"],
                "warnings": []
            }
    except Exception as e:
        return {
            "model_name": model_name,
            "is_valid": False,
            "errors": [f"Validation failed: {str(e)}"],
            "warnings": []
        }


@router.get("/validate")
async def validate_all_models(
    current_user: User = Depends(get_current_user),
) -> List[Dict[str, Any]]:
    """Validate configuration for all models."""
    try:
        # Import here to avoid circular dependencies
        import sys
        import os
        sys.path.append(os.path.join(os.path.dirname(__file__), '../../..'))

        try:
            from src.services.modelConfigService import modelConfigurationService
            validation_results = await modelConfigurationService.validateAllModels()
            return [{
                "model_name": result.model_name,
                "is_valid": result.is_valid,
                "errors": result.errors,
                "warnings": result.warnings,
                "performance_metrics": result.performance_metrics,
                "cost_analysis": result.cost_analysis
            } for result in validation_results]
        except ImportError:
            return []
    except Exception as e:
        return []


@router.get("/recommendations")
async def get_model_recommendations(
    task_type: str,
    context_length: int = 0,
    cost_preference: str = "balanced",
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    """Get model recommendations for specific task requirements."""
    try:
        config_path = Path(__file__).parent.parent / "config" / "models.yaml"

        if not config_path.exists():
            return {"recommendations": [], "message": "Configuration file not found"}

        with open(config_path, 'r') as file:
            config_data = yaml.safe_load(file)

        if not config_data or 'models' not in config_data:
            return {"recommendations": [], "message": "No models found"}

        models = config_data['models']
        available_models = [m for m in models if m.get('is_available', True)]

        # Simple recommendation logic based on task type
        recommendations = []

        if task_type.lower() in ['chat', 'conversation']:
            chat_models = [m for m in available_models if 'chat' in m.get('capabilities', [])]
            recommendations.extend(chat_models[:3])
        elif task_type.lower() in ['code', 'programming']:
            code_models = [m for m in available_models if 'code' in m.get('capabilities', [])]
            recommendations.extend(code_models[:3])
        elif task_type.lower() in ['analysis', 'reasoning']:
            reasoning_models = [m for m in available_models if 'reasoning' in m.get('capabilities', [])]
            recommendations.extend(reasoning_models[:3])
        elif task_type.lower() in ['vision', 'image']:
            vision_models = [m for m in available_models if 'vision' in m.get('capabilities', [])]
            recommendations.extend(vision_models[:3])

        # Add general models if no specific recommendations
        if not recommendations:
            recommendations = available_models[:3]

        return {
            "task_type": task_type,
            "context_length": context_length,
            "cost_preference": cost_preference,
            "recommendations": recommendations,
            "count": len(recommendations)
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate recommendations: {str(e)}")


def get_default_configurations():
    """
    Return default model configurations when file is not available
    """
    return {
        "models": [
            {
                "name": "gpt-4o",
                "provider": "openai",
                "model_family": "gpt-4",
                "max_tokens": 128000,
                "cost_per_token": 0.000005,
                "input_cost_per_token": 0.000005,
                "output_cost_per_token": 0.000015,
                "capabilities": ["text", "chat", "function_calling", "reasoning", "vision", "multimodal"],
                "context_window": 128000,
                "supports_streaming": True,
                "supports_function_calling": True,
                "is_available": True,
                "description": "Most advanced GPT-4 model with vision capabilities"
            },
            {
                "name": "claude-3-5-sonnet-20241022",
                "provider": "anthropic",
                "model_family": "claude-3",
                "max_tokens": 200000,
                "cost_per_token": 0.000003,
                "input_cost_per_token": 0.000003,
                "output_cost_per_token": 0.000015,
                "capabilities": ["text", "chat", "reasoning", "long_context", "vision", "multimodal"],
                "context_window": 200000,
                "supports_streaming": True,
                "supports_function_calling": True,
                "is_available": True,
                "description": "Most intelligent Claude model with vision"
            },
            {
                "name": "gemini-pro",
                "provider": "google",
                "model_family": "gemini",
                "max_tokens": 32768,
                "cost_per_token": 0.0000005,
                "input_cost_per_token": 0.0000005,
                "output_cost_per_token": 0.0000015,
                "capabilities": ["text", "chat", "reasoning", "multimodal", "vision"],
                "context_window": 32768,
                "supports_streaming": True,
                "supports_function_calling": True,
                "is_available": True,
                "description": "Gemini Pro multimodal model from Google"
            }
        ],
        "total_count": 3,
        "providers": ["openai", "anthropic", "google"],
        "capabilities": ["text", "chat", "function_calling", "reasoning", "vision", "multimodal", "long_context"]
    }


def get_default_statistics():
    """
    Return default statistics when configuration is not available
    """
    return {
        "total_models": 3,
        "available_models": 3,
        "providers": {
            "openai": 1,
            "anthropic": 1,
            "google": 1
        },
        "cost_distribution": {
            "free": 0,
            "low_cost": 2,
            "medium_cost": 1,
            "high_cost": 0
        },
        "capabilities": ["text", "chat", "function_calling", "reasoning", "vision", "multimodal"],
        "local_models": 0
    }
