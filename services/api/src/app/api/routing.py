"""Routing Policy Management API."""

from typing import List, Optional, Dict, Any
from datetime import datetime
from uuid import uuid4

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.database import get_db
from app.auth.dependencies import get_current_user
from app.models.user import User
from app.services.intelligent_router import get_intelligent_router

router = APIRouter()


# Pydantic Models
class ProviderConfig(BaseModel):
    """AI provider configuration."""
    id: str
    name: str
    type: str  # openai, anthropic, etc.
    cost_per_token: float
    avg_response_time: float
    capacity: int
    status: str = "healthy"  # healthy, degraded, unhealthy
    region: Optional[str] = None
    api_key_configured: bool = False


class RoutingCondition(BaseModel):
    """Routing policy condition."""
    user_tier: Optional[str] = None
    service_type: Optional[str] = None  # chat, completion, embedding
    model_type: Optional[str] = None  # gpt-4, claude-3, etc.
    cost_threshold: Optional[float] = None
    performance_requirement: Optional[str] = None  # high, medium, low
    geographic_region: Optional[str] = None
    time_window: Optional[str] = None  # business_hours, off_hours


class RoutingAction(BaseModel):
    """Routing policy action."""
    primary_provider: str
    fallback_providers: List[str] = []
    cost_optimization: bool = True
    caching_enabled: bool = True
    timeout_ms: int = 30000
    retry_attempts: int = 2
    load_balancing: bool = False


class RoutingPolicyCreate(BaseModel):
    """Create routing policy request."""
    name: str
    description: str
    priority: int = 1
    conditions: RoutingCondition
    actions: RoutingAction
    status: str = "draft"  # draft, active, inactive
    template: Optional[str] = None  # template name to use as base


class RoutingPolicyResponse(BaseModel):
    """Routing policy response."""
    id: str
    name: str
    description: str
    priority: int
    conditions: RoutingCondition
    actions: RoutingAction
    status: str
    created_at: datetime
    updated_at: datetime
    created_by: str
    usage_stats: Optional[Dict[str, Any]] = None


class RoutingAnalytics(BaseModel):
    """Routing analytics response."""
    total_requests: int
    total_cost: float
    avg_response_time: float
    success_rate: float
    provider_usage: Dict[str, int]
    cost_savings: float
    period: str  # daily, weekly, monthly


# In-memory storage for development (replace with database in production)
_routing_policies = {}
_providers = {}


@router.post("/policies", response_model=RoutingPolicyResponse)
async def create_routing_policy(
    policy: RoutingPolicyCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new routing policy."""
    policy_id = str(uuid4())

    # Apply template if specified
    if policy.template:
        template_data = await _load_policy_template(policy.template)
        if template_data:
            # Merge template with customizations
            policy_data = template_data.copy()
            policy_data.update(policy.dict(exclude_unset=True))
        else:
            raise HTTPException(status_code=400, detail=f"Template '{policy.template}' not found")
    else:
        policy_data = policy.dict()

    policy_data.update({
        "id": policy_id,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
        "created_by": current_user.id,
        "usage_stats": {
            "total_requests": 0,
            "total_cost": 0.0,
            "avg_response_time": 0.0,
            "success_rate": 0.0
        }
    })

    _routing_policies[policy_id] = policy_data

    return RoutingPolicyResponse(**policy_data)


@router.get("/policies", response_model=List[RoutingPolicyResponse])
async def list_routing_policies(
    status: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    """List all routing policies."""
    policies = list(_routing_policies.values())

    if status:
        policies = [p for p in policies if p["status"] == status]

    # Sort by priority (highest first)
    policies.sort(key=lambda x: x["priority"], reverse=True)

    return [RoutingPolicyResponse(**p) for p in policies]


@router.get("/policies/{policy_id}", response_model=RoutingPolicyResponse)
async def get_routing_policy(
    policy_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get a specific routing policy."""
    if policy_id not in _routing_policies:
        raise HTTPException(status_code=404, detail="Routing policy not found")

    return RoutingPolicyResponse(**_routing_policies[policy_id])


@router.put("/policies/{policy_id}", response_model=RoutingPolicyResponse)
async def update_routing_policy(
    policy_id: str,
    updates: Dict[str, Any],
    current_user: User = Depends(get_current_user)
):
    """Update a routing policy."""
    if policy_id not in _routing_policies:
        raise HTTPException(status_code=404, detail="Routing policy not found")

    policy = _routing_policies[policy_id]

    # Update allowed fields
    allowed_updates = ["name", "description", "priority", "conditions", "actions", "status"]
    for key, value in updates.items():
        if key in allowed_updates:
            policy[key] = value

    policy["updated_at"] = datetime.utcnow()

    return RoutingPolicyResponse(**policy)


@router.delete("/policies/{policy_id}")
async def delete_routing_policy(
    policy_id: str,
    current_user: User = Depends(get_current_user)
):
    """Delete a routing policy."""
    if policy_id not in _routing_policies:
        raise HTTPException(status_code=404, detail="Routing policy not found")

    del _routing_policies[policy_id]
    return {"message": "Routing policy deleted successfully"}


@router.post("/policies/{policy_id}/activate")
async def activate_routing_policy(
    policy_id: str,
    current_user: User = Depends(get_current_user)
):
    """Activate a routing policy."""
    if policy_id not in _routing_policies:
        raise HTTPException(status_code=404, detail="Routing policy not found")

    _routing_policies[policy_id]["status"] = "active"
    _routing_policies[policy_id]["updated_at"] = datetime.utcnow()

    return {"message": "Routing policy activated successfully"}


@router.post("/policies/{policy_id}/deactivate")
async def deactivate_routing_policy(
    policy_id: str,
    current_user: User = Depends(get_current_user)
):
    """Deactivate a routing policy."""
    if policy_id not in _routing_policies:
        raise HTTPException(status_code=404, detail="Routing policy not found")

    _routing_policies[policy_id]["status"] = "inactive"
    _routing_policies[policy_id]["updated_at"] = datetime.utcnow()

    return {"message": "Routing policy deactivated successfully"}


@router.get("/providers", response_model=List[ProviderConfig])
async def list_providers(current_user: User = Depends(get_current_user)):
    """List all configured AI providers."""
    return [ProviderConfig(**p) for p in _providers.values()]


@router.get("/providers/{provider_id}", response_model=ProviderConfig)
async def get_provider(provider_id: str, current_user: User = Depends(get_current_user)):
    """Get provider configuration."""
    if provider_id not in _providers:
        raise HTTPException(status_code=404, detail="Provider not found")

    return ProviderConfig(**_providers[provider_id])


@router.put("/providers/{provider_id}")
async def update_provider_config(
    provider_id: str,
    config: Dict[str, Any],
    current_user: User = Depends(get_current_user)
):
    """Update provider configuration."""
    if provider_id not in _providers:
        raise HTTPException(status_code=404, detail="Provider not found")

    # Update allowed fields
    allowed_updates = ["cost_per_token", "avg_response_time", "capacity", "status", "region"]
    for key, value in config.items():
        if key in allowed_updates:
            _providers[provider_id][key] = value

    return {"message": "Provider configuration updated successfully"}


@router.get("/analytics", response_model=RoutingAnalytics)
async def get_routing_analytics(
    period: str = "daily",
    current_user: User = Depends(get_current_user)
):
    """Get routing analytics and performance metrics."""
    # Mock analytics data - replace with real implementation
    return RoutingAnalytics(
        total_requests=1250,
        total_cost=45.67,
        avg_response_time=2.3,
        success_rate=98.7,
        provider_usage={
            "gpt-4-turbo": 450,
            "claude-3-opus": 380,
            "gpt-3.5-turbo": 420
        },
        cost_savings=15.5,
        period=period
    )


@router.post("/test-policy")
async def test_routing_policy(
    policy_id: str,
    test_input: Dict[str, Any],
    current_user: User = Depends(get_current_user)
):
    """Test a routing policy with sample input."""
    if policy_id not in _routing_policies:
        raise HTTPException(status_code=404, detail="Routing policy not found")

    policy = _routing_policies[policy_id]

    # Simulate policy evaluation
    result = {
        "policy_id": policy_id,
        "selected_provider": policy["actions"]["primary_provider"],
        "evaluation_result": "success",
        "test_input": test_input,
        "timestamp": datetime.utcnow()
    }

    return result


@router.post("/route")
async def route_ai_request(
    request: Dict[str, Any],
    current_user: User = Depends(get_current_user)
):
    """Route an AI request using intelligent routing."""
    try:
        router = await get_intelligent_router()
        decision = await router.route_request(request)

        return {
            "success": True,
            "routing_decision": {
                "provider_id": decision.provider_id,
                "provider_name": decision.provider_name,
                "model": decision.model,
                "strategy": decision.strategy.value,
                "cost_estimate": decision.cost_estimate,
                "performance_score": decision.performance_score,
                "reasoning": decision.reasoning,
                "policy_applied": decision.policy_applied,
                "cost_savings": decision.cost_savings
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Routing failed: {str(e)}")


@router.get("/router/health")
async def get_router_health(current_user: User = Depends(get_current_user)):
    """Get intelligent router health status."""
    try:
        router = await get_intelligent_router()

        provider_status = {}
        for provider_id, health in router.provider_health.items():
            provider_status[provider_id] = {
                "status": health.status,
                "response_time": health.response_time,
                "error_rate": health.error_rate,
                "capacity": health.capacity,
                "last_check": health.last_check.isoformat()
            }

        return {
            "router_status": "healthy",
            "providers_loaded": len(router.providers),
            "policies_loaded": len(router.policies),
            "cache_size": len(router.cache),
            "provider_health": provider_status
        }
    except Exception as e:
        return {
            "router_status": "unhealthy",
            "error": str(e)
        }


@router.get("/router/analytics")
async def get_router_analytics(
    time_range: str = "1h",
    current_user: User = Depends(get_current_user)
):
    """Get intelligent router analytics."""
    try:
        router = await get_intelligent_router()
        analytics = await router.get_routing_analytics(time_range)

        return {
            "success": True,
            "analytics": analytics
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analytics retrieval failed: {str(e)}")


@router.get("/templates")
async def list_policy_templates(current_user: User = Depends(get_current_user)):
    """List available routing policy templates."""
    templates = [
        {
            "id": "enterprise-high-priority",
            "name": "Enterprise High Priority",
            "description": "Optimized routing for enterprise users with high performance requirements",
            "category": "enterprise"
        },
        {
            "id": "cost-optimized-standard",
            "name": "Cost Optimized Standard",
            "description": "Balance cost and performance for standard tier users",
            "category": "standard"
        },
        {
            "id": "performance-critical",
            "name": "Performance Critical",
            "description": "Sub-second response times for critical applications",
            "category": "performance"
        },
        {
            "id": "geographic-routing",
            "name": "Geographic Routing",
            "description": "Route to geographically closer providers for latency optimization",
            "category": "geographic"
        }
    ]

    return {"templates": templates}


async def _load_policy_template(template_name: str) -> Optional[Dict[str, Any]]:
    """Load a routing policy template."""
    templates = {
        "enterprise-high-priority": {
            "name": "Enterprise High Priority",
            "description": "Optimized routing for enterprise users",
            "priority": 1,
            "conditions": {
                "user_tier": "enterprise",
                "performance_requirement": "high"
            },
            "actions": {
                "primary_provider": "gpt-4-turbo",
                "fallback_providers": ["claude-3-opus", "gpt-4"],
                "cost_optimization": False,
                "caching_enabled": True,
                "timeout_ms": 30000,
                "retry_attempts": 2
            },
            "status": "draft"
        },
        "cost-optimized-standard": {
            "name": "Cost Optimized Standard",
            "description": "Balance cost and performance",
            "priority": 2,
            "conditions": {
                "user_tier": "standard",
                "cost_threshold": 0.01
            },
            "actions": {
                "primary_provider": "gpt-3.5-turbo",
                "fallback_providers": ["claude-3-haiku", "gpt-4"],
                "cost_optimization": True,
                "caching_enabled": True,
                "timeout_ms": 45000,
                "retry_attempts": 3
            },
            "status": "draft"
        }
    }

    return templates.get(template_name)


# Initialize with some sample providers
_providers.update({
    "gpt-4-turbo": {
        "id": "gpt-4-turbo",
        "name": "GPT-4 Turbo",
        "type": "openai",
        "cost_per_token": 0.03,
        "avg_response_time": 2.1,
        "capacity": 95,
        "status": "healthy",
        "region": "us-east",
        "api_key_configured": True
    },
    "claude-3-opus": {
        "id": "claude-3-opus",
        "name": "Claude 3 Opus",
        "type": "anthropic",
        "cost_per_token": 0.015,
        "avg_response_time": 2.8,
        "capacity": 88,
        "status": "healthy",
        "region": "us-west",
        "api_key_configured": True
    },
    "gpt-3.5-turbo": {
        "id": "gpt-3.5-turbo",
        "name": "GPT-3.5 Turbo",
        "type": "openai",
        "cost_per_token": 0.002,
        "avg_response_time": 1.5,
        "capacity": 100,
        "status": "healthy",
        "region": "global",
        "api_key_configured": True
    }
})
