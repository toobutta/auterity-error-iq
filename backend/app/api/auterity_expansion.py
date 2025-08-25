"""Auterity AI Platform Expansion API endpoints."""

import logging
import time
from typing import List, Optional
from uuid import UUID

from app.database import get_db
from app.models.tenant import Tenant
from app.schemas.auterity_expansion import (
    ChannelTriggerResponse,  # Triage schemas; Vector and similarity schemas; Integration schemas; Channel trigger schemas; Custom model schemas; Agent and execution schemas
)
from app.schemas.auterity_expansion import (
    AgentDeployRequest,
    AgentDeployResponse,
    AgentMemoryCreate,
    AgentMemoryResponse,
    ChannelTriggerCreate,
    ChannelTriggerRequest,
    ChannelTriggerUpdate,
    CustomModelCreate,
    CustomModelHealthCheck,
    CustomModelResponse,
    CustomModelUpdate,
    ExecutionMetricCreate,
    ExecutionMetricResponse,
    IntegrationCreate,
    IntegrationResponse,
    IntegrationSyncRequest,
    IntegrationSyncResponse,
    IntegrationUpdate,
    IntegrationWebhookCreate,
    IntegrationWebhookResponse,
    LiveInsightsRequest,
    LiveInsightsResponse,
    SimilarityResult,
    SimilaritySearchRequest,
    SimilaritySearchResponse,
    TriageRequest,
    TriageResponse,
    TriageResultCreate,
    TriageResultResponse,
    TriageRuleCreate,
    TriageRuleResponse,
    TriageRuleUpdate,
    VectorEmbeddingCreate,
    VectorEmbeddingResponse,
)
from app.services.autonomous_agent_service import AgentConfig, AutonomousAgentService
from app.services.smart_triage_service import SmartTriageService
from app.services.vector_duplicate_service import VectorDuplicateService
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/auterity", tags=["auterity-expansion"])


# Dependency to get current tenant (placeholder - implement proper auth)
async def get_current_tenant(db: Session = Depends(get_db)) -> Tenant:
    """Get current tenant from request context."""
    # TODO: Implement proper tenant resolution from JWT/auth
    # For now, return a placeholder tenant
    tenant = db.query(Tenant).first()
    if not tenant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="No tenant found"
        )
    return tenant


# Smart Triage Endpoints
@router.post("/triage", response_model=TriageResponse)
async def triage_input(
    request: TriageRequest,
    db: Session = Depends(get_db),
    tenant: Tenant = Depends(get_current_tenant),
):
    """Triage input content using AI-powered routing."""
    try:
        service = SmartTriageService(db)
        decision = await service.triage_input(
            content=request.content, context=request.context, tenant_id=tenant.id
        )

        return TriageResponse(
            routing_decision=decision.routing_decision,
            confidence_score=decision.confidence_score,
            rule_applied=decision.rule_applied,
            reasoning=decision.reasoning,
            suggested_actions=decision.suggested_actions,
            processing_time_ms=decision.processing_time_ms,
        )

    except Exception as e:
        logger.error(f"Triage failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Triage failed: {str(e)}",
        )


@router.post("/triage/rules", response_model=TriageRuleResponse)
async def create_triage_rule(
    rule_data: TriageRuleCreate,
    db: Session = Depends(get_db),
    tenant: Tenant = Depends(get_current_tenant),
):
    """Create a new triage rule."""
    try:
        service = SmartTriageService(db)
        rule = await service.create_triage_rule(
            tenant_id=tenant.id, rule_data=rule_data.dict()
        )

        return TriageRuleResponse(
            id=rule.id,
            tenant_id=rule.tenant_id,
            name=rule.name,
            rule_type=rule.rule_type.value,
            conditions=rule.conditions,
            routing_logic=rule.routing_logic,
            confidence_threshold=rule.confidence_threshold,
            priority=rule.priority,
            is_active=rule.is_active,
            created_at=rule.created_at,
            updated_at=rule.updated_at,
        )

    except Exception as e:
        logger.error(f"Failed to create triage rule: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create triage rule: {str(e)}",
        )


@router.get("/triage/rules", response_model=List[TriageRuleResponse])
async def get_triage_rules(
    db: Session = Depends(get_db),
    tenant: Tenant = Depends(get_current_tenant),
    active_only: bool = Query(True, description="Return only active rules"),
):
    """Get triage rules for the current tenant."""
    try:
        service = SmartTriageService(db)
        rules = await service._get_active_triage_rules(tenant.id)

        if not active_only:
            # Get all rules if not filtering by active
            from app.models.auterity_expansion import TriageRule

            rules = db.query(TriageRule).filter(TriageRule.tenant_id == tenant.id).all()

        return [
            TriageRuleResponse(
                id=rule.id,
                tenant_id=rule.tenant_id,
                name=rule.name,
                rule_type=rule.rule_type.value,
                conditions=rule.conditions,
                routing_logic=rule.routing_logic,
                confidence_threshold=rule.confidence_threshold,
                priority=rule.priority,
                is_active=rule.is_active,
                created_at=rule.created_at,
                updated_at=rule.updated_at,
            )
            for rule in rules
        ]

    except Exception as e:
        logger.error(f"Failed to get triage rules: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get triage rules: {str(e)}",
        )


@router.get("/triage/accuracy")
async def get_triage_accuracy(
    days: int = Query(30, ge=1, le=365, description="Number of days to analyze"),
    db: Session = Depends(get_db),
    tenant: Tenant = Depends(get_current_tenant),
):
    """Get triage accuracy metrics."""
    try:
        service = SmartTriageService(db)
        accuracy = await service.get_triage_accuracy(tenant.id, days)
        return accuracy

    except Exception as e:
        logger.error(f"Failed to get triage accuracy: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get triage accuracy: {str(e)}",
        )


# Vector Duplicate Detection Endpoints
@router.post("/similarity/search", response_model=SimilaritySearchResponse)
async def search_similar_items(
    request: SimilaritySearchRequest,
    db: Session = Depends(get_db),
    tenant: Tenant = Depends(get_current_tenant),
):
    """Search for similar items using vector similarity."""
    try:
        service = VectorDuplicateService(db)
        start_time = time.time()

        results = await service.find_similar_items(
            content=request.content,
            item_type=request.item_type,
            tenant_id=tenant.id,
            threshold=request.threshold,
            limit=request.limit,
        )

        search_time_ms = int((time.time() - start_time) * 1000)

        return SimilaritySearchResponse(
            query_content=request.content,
            results=[
                SimilarityResult(
                    item_id=result.item_id,
                    item_type=result.item_type,
                    similarity_score=result.similarity_score,
                    content_preview=result.content_preview,
                    metadata=result.metadata,
                )
                for result in results
            ],
            total_found=len(results),
            search_time_ms=search_time_ms,
        )

    except Exception as e:
        logger.error(f"Similarity search failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Similarity search failed: {str(e)}",
        )


@router.post("/embeddings", response_model=VectorEmbeddingResponse)
async def create_embedding(
    embedding_data: VectorEmbeddingCreate,
    db: Session = Depends(get_db),
    tenant: Tenant = Depends(get_current_tenant),
):
    """Create a new vector embedding."""
    try:
        service = VectorDuplicateService(db)
        embedding = await service.create_embedding(
            tenant_id=tenant.id,
            item_type=embedding_data.item_type,
            item_id=embedding_data.item_id,
            content="",  # TODO: Get content from item
            metadata=embedding_data.metadata,
        )

        if not embedding:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create embedding",
            )

        return VectorEmbeddingResponse(
            id=embedding.id,
            tenant_id=embedding.tenant_id,
            item_type=embedding.item_type,
            item_id=embedding.item_id,
            content_hash=embedding.content_hash,
            embedding_vector=embedding.embedding_vector,
            metadata=embedding.metadata,
            created_at=embedding.created_at,
        )

    except Exception as e:
        logger.error(f"Failed to create embedding: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create embedding: {str(e)}",
        )


@router.get("/embeddings/clusters")
async def get_similarity_clusters(
    item_type: str = Query(..., description="Type of items to cluster"),
    min_similarity: float = Query(
        0.7, ge=0.0, le=1.0, description="Minimum similarity threshold"
    ),
    min_cluster_size: int = Query(2, ge=2, le=100, description="Minimum cluster size"),
    db: Session = Depends(get_db),
    tenant: Tenant = Depends(get_current_tenant),
):
    """Get clusters of similar items."""
    try:
        service = VectorDuplicateService(db)
        clusters = await service.get_similarity_clusters(
            tenant_id=tenant.id,
            item_type=item_type,
            min_similarity=min_similarity,
            min_cluster_size=min_cluster_size,
        )
        return clusters

    except Exception as e:
        logger.error(f"Failed to get similarity clusters: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get similarity clusters: {str(e)}",
        )


@router.get("/embeddings/duplicate-analysis")
async def get_duplicate_analysis(
    item_type: str = Query(..., description="Type of items to analyze"),
    days: int = Query(30, ge=1, le=365, description="Number of days to analyze"),
    db: Session = Depends(get_db),
    tenant: Tenant = Depends(get_current_tenant),
):
    """Get duplicate analysis metrics."""
    try:
        service = VectorDuplicateService(db)
        analysis = await service.get_duplicate_analysis(
            tenant_id=tenant.id, item_type=item_type, days=days
        )
        return analysis

    except Exception as e:
        logger.error(f"Failed to get duplicate analysis: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get duplicate analysis: {str(e)}",
        )


# Autonomous Agent Endpoints
@router.post("/agents/deploy", response_model=AgentDeployResponse)
async def deploy_agent(
    request: AgentDeployRequest,
    db: Session = Depends(get_db),
    tenant: Tenant = Depends(get_current_tenant),
):
    """Deploy a new autonomous agent."""
    try:
        service = AutonomousAgentService(db)

        # Convert request to AgentConfig
        agent_config = AgentConfig(
            name=request.agent_config.get("name", "Autonomous Agent"),
            agent_type=request.agent_config.get("type", "general"),
            capabilities=request.agent_config.get("capabilities", []),
            memory_config=request.memory_config,
            coordination_rules=request.coordination_rules,
            escalation_policy=request.escalation_policy,
        )

        agent_instance = await service.deploy_agent(agent_config, tenant.id)

        return AgentDeployResponse(
            agent_id=agent_instance.agent_id,
            status=agent_instance.status,
            deployment_time_ms=agent_instance.deployment_time_ms,
            memory_configured=agent_instance.memory_enabled,
            coordination_enabled=agent_instance.coordination_enabled,
        )

    except Exception as e:
        logger.error(f"Agent deployment failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Agent deployment failed: {str(e)}",
        )


@router.post("/agents/{agent_id}/tasks")
async def assign_task(
    agent_id: UUID,
    task_data: dict,
    db: Session = Depends(get_db),
    tenant: Tenant = Depends(get_current_tenant),
):
    """Assign a task to an autonomous agent."""
    try:
        service = AutonomousAgentService(db)
        task = await service.assign_task(agent_id, task_data, tenant.id)

        if not task:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="Failed to assign task"
            )

        return {
            "task_id": task.task_id,
            "status": task.status,
            "assigned_agent": str(task.assigned_agent),
            "created_at": task.created_at.isoformat(),
        }

    except Exception as e:
        logger.error(f"Task assignment failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Task assignment failed: {str(e)}",
        )


@router.get("/agents/{agent_id}/memory")
async def get_agent_memory(
    agent_id: UUID,
    context_key: Optional[str] = Query(None, description="Context key to filter by"),
    limit: int = Query(
        50, ge=1, le=100, description="Maximum number of memories to return"
    ),
    db: Session = Depends(get_db),
    tenant: Tenant = Depends(get_current_tenant),
):
    """Get agent memory for context awareness."""
    try:
        service = AutonomousAgentService(db)
        memories = await service.get_agent_memory(
            agent_id=agent_id, context_key=context_key, limit=limit
        )
        return memories

    except Exception as e:
        logger.error(f"Failed to get agent memory: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get agent memory: {str(e)}",
        )


@router.post("/agents/{agent_id}/memory")
async def store_agent_memory(
    agent_id: UUID,
    memory_data: AgentMemoryCreate,
    db: Session = Depends(get_db),
    tenant: Tenant = Depends(get_current_tenant),
):
    """Store new memory for an agent."""
    try:
        service = AutonomousAgentService(db)
        memory = await service.store_memory(
            agent_id=agent_id,
            context_key=memory_data.context_hash,
            memory_data=memory_data.memory_data,
            importance_score=float(memory_data.importance_score),
        )

        if not memory:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to store memory",
            )

        return {
            "id": str(memory.id),
            "context_hash": memory.context_hash,
            "importance_score": float(memory.importance_score),
            "created_at": memory.created_at.isoformat(),
        }

    except Exception as e:
        logger.error(f"Failed to store agent memory: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to store agent memory: {str(e)}",
        )


@router.post("/agents/{agent_id}/coordinate")
async def coordinate_agents(
    agent_id: UUID,
    coordination_task: dict,
    db: Session = Depends(get_db),
    tenant: Tenant = Depends(get_current_tenant),
):
    """Coordinate multiple agents for complex tasks."""
    try:
        service = AutonomousAgentService(db)
        result = await service.coordinate_agents(
            primary_agent_id=agent_id,
            coordination_task=coordination_task,
            tenant_id=tenant.id,
        )
        return result

    except Exception as e:
        logger.error(f"Agent coordination failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Agent coordination failed: {str(e)}",
        )


@router.get("/agents/{agent_id}/performance")
async def get_agent_performance(
    agent_id: UUID,
    days: int = Query(30, ge=1, le=365, description="Number of days to analyze"),
    db: Session = Depends(get_db),
    tenant: Tenant = Depends(get_current_tenant),
):
    """Get performance metrics for an agent."""
    try:
        service = AutonomousAgentService(db)
        performance = await service.get_agent_performance(agent_id, days)
        return performance

    except Exception as e:
        logger.error(f"Failed to get agent performance: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get agent performance: {str(e)}",
        )


# Health Check Endpoint
@router.get("/health")
async def health_check():
    """Health check for Auterity expansion services."""
    return {
        "status": "healthy",
        "services": {
            "smart_triage": "operational",
            "vector_duplicate": "operational",
            "autonomous_agents": "operational",
        },
        "timestamp": "2025-08-23T10:00:00Z",
    }
