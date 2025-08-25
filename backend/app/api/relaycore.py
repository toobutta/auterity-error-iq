"""RelayCore integration API endpoints for AutoMatrix."""

from typing import Any, Dict, List, Optional

from app.auth import get_current_user
from app.models.user import User
from app.services.ai_service_relaycore import EnhancedAIService, get_enhanced_ai_service
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

router = APIRouter(prefix="/relaycore", tags=["relaycore"])


class ChatCompletionRequest(BaseModel):
    """Request model for chat completions via RelayCore."""

    messages: List[Dict[str, str]] = Field(..., description="List of chat messages")
    model: Optional[str] = Field(None, description="Preferred AI model")
    temperature: float = Field(0.7, ge=0.0, le=2.0, description="Sampling temperature")
    max_tokens: Optional[int] = Field(
        None, gt=0, description="Maximum tokens in response"
    )
    force_direct: bool = Field(False, description="Force direct OpenAI call")


class ChatCompletionResponse(BaseModel):
    """Response model for chat completions."""

    content: str
    model: str
    usage: Optional[Dict[str, Any]] = None
    finish_reason: Optional[str] = None
    cost: Optional[float] = None
    provider: Optional[str] = None
    source: str  # "relaycore" or "direct"


class TemplateProcessingRequest(BaseModel):
    """Request model for template-based processing."""

    template_name: str = Field(..., description="Name of the template to use")
    variables: Dict[str, Any] = Field(
        ..., description="Variables for template substitution"
    )
    context: Optional[Dict[str, Any]] = Field(None, description="Additional context")
    model: Optional[str] = Field(None, description="Preferred AI model")


class HealthCheckResponse(BaseModel):
    """Response model for health check."""

    relaycore: bool
    openai_direct: bool
    overall_status: str


class UsageMetricsResponse(BaseModel):
    """Response model for usage metrics."""

    total_requests: int = 0
    total_cost: float = 0.0
    average_cost_per_request: float = 0.0
    models_used: Dict[str, int] = {}
    providers_used: Dict[str, int] = {}


@router.post("/chat/completions", response_model=ChatCompletionResponse)
async def chat_completion(
    request: ChatCompletionRequest,
    current_user: User = Depends(get_current_user),
    ai_service: EnhancedAIService = Depends(get_enhanced_ai_service),
):
    """
    Create a chat completion using RelayCore with fallback support.

    This endpoint routes AI requests through RelayCore for cost optimization
    and intelligent model selection, with automatic fallback to direct OpenAI
    if RelayCore is unavailable.
    """
    try:
        response = await ai_service.process_text(
            prompt=request.messages[-1]["content"] if request.messages else "",
            model=request.model,
            temperature=request.temperature,
            max_tokens=request.max_tokens,
            user_id=str(current_user.id),
            force_direct=request.force_direct,
        )

        if not response.is_success:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"AI processing failed: {response.error}",
            )

        return ChatCompletionResponse(
            content=response.content,
            model=response.model,
            usage=response.usage,
            finish_reason=response.finish_reason,
            cost=response.cost,
            provider=response.provider,
            source=response.source,
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Chat completion failed: {str(e)}",
        )


@router.post("/templates/process", response_model=ChatCompletionResponse)
async def process_template(
    request: TemplateProcessingRequest,
    current_user: User = Depends(get_current_user),
    ai_service: EnhancedAIService = Depends(get_enhanced_ai_service),
):
    """
    Process text using a predefined template via RelayCore.

    This endpoint allows using predefined prompt templates for common
    automotive dealership workflows with RelayCore optimization.
    """
    try:
        response = await ai_service.process_with_template(
            template_name=request.template_name,
            variables=request.variables,
            context=request.context,
            model=request.model,
            user_id=str(current_user.id),
        )

        if not response.is_success:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Template processing failed: {response.error}",
            )

        return ChatCompletionResponse(
            content=response.content,
            model=response.model,
            usage=response.usage,
            finish_reason=response.finish_reason,
            cost=response.cost,
            provider=response.provider,
            source=response.source,
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Template processing failed: {str(e)}",
        )


@router.get("/templates", response_model=List[str])
async def get_available_templates(
    current_user: User = Depends(get_current_user),
    ai_service: EnhancedAIService = Depends(get_enhanced_ai_service),
):
    """Get list of available prompt templates."""
    return ai_service.get_available_templates()


@router.get("/models", response_model=List[Dict[str, Any]])
async def get_available_models(
    current_user: User = Depends(get_current_user),
    ai_service: EnhancedAIService = Depends(get_enhanced_ai_service),
):
    """Get list of available AI models from RelayCore."""
    try:
        models = await ai_service.get_available_models()
        return models
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get available models: {str(e)}",
        )


@router.get("/health", response_model=HealthCheckResponse)
async def health_check(
    ai_service: EnhancedAIService = Depends(get_enhanced_ai_service),
):
    """
    Check health status of RelayCore and direct OpenAI connections.

    This endpoint provides health status for both RelayCore and direct
    OpenAI fallback to help monitor service availability.
    """
    try:
        health_status = await ai_service.health_check()

        overall_status = "healthy"
        if not health_status["relaycore"] and not health_status["openai_direct"]:
            overall_status = "unhealthy"
        elif not health_status["relaycore"]:
            overall_status = "degraded"

        return HealthCheckResponse(
            relaycore=health_status["relaycore"],
            openai_direct=health_status["openai_direct"],
            overall_status=overall_status,
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Health check failed: {str(e)}",
        )


@router.get("/metrics", response_model=UsageMetricsResponse)
async def get_usage_metrics(
    current_user: User = Depends(get_current_user),
    ai_service: EnhancedAIService = Depends(get_enhanced_ai_service),
):
    """
    Get usage metrics for the current user from RelayCore.

    This endpoint provides cost and usage analytics for AI requests
    made through RelayCore.
    """
    try:
        metrics = await ai_service.get_usage_metrics(user_id=str(current_user.id))

        return UsageMetricsResponse(
            total_requests=metrics.get("total_requests", 0),
            total_cost=metrics.get("total_cost", 0.0),
            average_cost_per_request=metrics.get("average_cost_per_request", 0.0),
            models_used=metrics.get("models_used", {}),
            providers_used=metrics.get("providers_used", {}),
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get usage metrics: {str(e)}",
        )


@router.post("/test")
async def test_relaycore_integration(
    current_user: User = Depends(get_current_user),
    ai_service: EnhancedAIService = Depends(get_enhanced_ai_service),
):
    """
    Test RelayCore integration with a simple request.

    This endpoint is useful for testing the RelayCore integration
    and verifying that both RelayCore and fallback mechanisms work.
    """
    try:
        # Test RelayCore
        relaycore_response = await ai_service.process_text(
            prompt="Say 'RelayCore integration test successful'",
            user_id=str(current_user.id),
            force_direct=False,
        )

        # Test direct fallback
        direct_response = await ai_service.process_text(
            prompt="Say 'Direct OpenAI fallback test successful'",
            user_id=str(current_user.id),
            force_direct=True,
        )

        return {
            "relaycore_test": {
                "success": relaycore_response.is_success,
                "content": relaycore_response.content,
                "source": relaycore_response.source,
                "error": relaycore_response.error,
            },
            "direct_test": {
                "success": direct_response.is_success,
                "content": direct_response.content,
                "source": direct_response.source,
                "error": direct_response.error,
            },
        }

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Integration test failed: {str(e)}",
        )
