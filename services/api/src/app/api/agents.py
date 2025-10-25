"""
Agent API Router for Auterity

This module provides REST API endpoints for agent orchestration, RAG queries,
and compliance management across the Auterity platform.
"""

import logging
import time
import traceback
from datetime import datetime
from threading import Lock
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel, Field

from ..core.config import get_settings
from ..core.rate_limiter import rate_limiter

# Import agent service classes
from ..services.agents.compliance_layer import ComplianceLayer
from ..services.agents.orchestrator import AgentOrchestrator
from ..services.agents.rag_engine import RAGEngine
from ..services.agents.security_manager import SecurityManager

# Enhanced monitoring and caching
try:
    from backend.app.core.cache import (
        cache_manager,
        cached_response,
        invalidate_cache_on_mutation,
    )
    from backend.app.metrics.agent_metrics import AgentMetricsCollector

    METRICS_AVAILABLE = True
    CACHE_AVAILABLE = True
except ImportError:
    # Graceful fallback if dependencies aren't installed
    METRICS_AVAILABLE = False
    CACHE_AVAILABLE = False

    # Create no-op decorators
    def cached_response(*args, **kwargs):
        def decorator(func):
            return func

        return decorator

    def invalidate_cache_on_mutation(*args, **kwargs):
        def decorator(func):
            return func

        return decorator

    class AgentMetricsCollector:
        @staticmethod
        def record_request(*args, **kwargs):
            pass

        @staticmethod
        def record_workflow_execution(*args, **kwargs):
            pass

        @staticmethod
        def record_rag_query(*args, **kwargs):
            pass

        @staticmethod
        def record_compliance_validation(*args, **kwargs):
            pass

        @staticmethod
        def record_error(*args, **kwargs):
            pass


logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/agents", tags=["agents"])
security = HTTPBearer()


# Pydantic models for request/response
class AgentRegistrationRequest(BaseModel):
    agent_id: str = Field(
        ...,
        description="Unique identifier for the agent",
        min_length=3,
        max_length=50,
        pattern=r"^[a-zA-Z0-9_-]+$",
    )
    agent_type: str = Field(
        ...,
        description="Type of agent (autmatrix, relaycore, neuroweaver)",
        pattern=r"^(autmatrix|relaycore|neuroweaver)$",
    )
    llm_config: Dict[str, Any] = Field(
        ..., description="LLM configuration for the agent"
    )
    tools: List[str] = Field(
        default=[],
        description="List of tool names for the agent",
        max_items=20,
    )

    class Config:
        schema_extra = {
            "example": {
                "agent_id": "agent_001",
                "agent_type": "autmatrix",
                "llm_config": {"model": "gpt-4", "temperature": 0.7},
                "tools": ["web_search", "calculator"],
            }
        }


class WorkflowExecutionRequest(BaseModel):
    workflow_id: str = Field(..., description="Workflow identifier")
    input_data: Dict[str, Any] = Field(
        ..., description="Input data for the workflow"
    )
    coordination_strategy: Optional[str] = Field(
        default="sequential", description="Agent coordination strategy"
    )
    agent_ids: Optional[List[str]] = Field(
        default=None, description="Specific agents to use"
    )


class RAGQueryRequest(BaseModel):
    query: str = Field(
        ...,
        description="Query text",
        max_length=1000,  # Prevent extremely long queries
    )
    domain: Optional[str] = Field(
        default=None,
        description="Domain-specific index to query",
        max_length=50,
    )
    top_k: int = Field(
        default=5,
        description="Number of results to return",
        ge=1,  # Greater than or equal to 1
        le=50,  # Less than or equal to 50
    )
    use_qa: bool = Field(
        default=True, description="Use question-answering vs retrieval only"
    )


class DocumentIndexRequest(BaseModel):
    documents: List[Dict[str, Any]] = Field(
        ...,
        description="Documents to index",
        max_items=100,  # Limit to prevent large payloads
    )
    domain: str = Field(
        default="general",
        description="Domain classification for documents",
        max_length=50,
    )


class ComplianceValidationRequest(BaseModel):
    operation: str = Field(..., description="Operation to validate")
    data: Dict[str, Any] = Field(
        ..., description="Data involved in the operation"
    )
    context: Optional[Dict[str, Any]] = Field(
        default=None, description="Additional context"
    )


# Standardized response models
class APIResponse(BaseModel):
    """Base response model for all API endpoints"""

    status: str = Field(
        ..., description="Response status: success|error|warning"
    )
    message: str = Field(..., description="Human-readable message")
    data: Optional[Dict[str, Any]] = Field(
        default=None, description="Response data"
    )
    metadata: Dict[str, Any] = Field(
        default_factory=lambda: {
            "timestamp": datetime.now().isoformat(),
            "api_version": "v1",
        }
    )


class AgentRegistrationResponse(APIResponse):
    """Response model for agent registration"""

    data: Optional[Dict[str, Any]] = Field(
        default=None, description="Agent registration details"
    )


class WorkflowExecutionResponse(APIResponse):
    """Response model for workflow execution"""

    data: Optional[Dict[str, Any]] = Field(
        default=None, description="Workflow execution results"
    )


class RAGQueryResponse(APIResponse):
    """Response model for RAG queries"""

    data: Optional[Dict[str, Any]] = Field(
        default=None, description="RAG query results"
    )


class DocumentIndexResponse(APIResponse):
    """Response model for document indexing"""

    data: Optional[Dict[str, Any]] = Field(
        default=None, description="Document indexing status"
    )


class ComplianceValidationResponse(APIResponse):
    """Response model for compliance validation"""

    data: Optional[Dict[str, Any]] = Field(
        default=None, description="Compliance validation results"
    )


class AgentStatusResponse(APIResponse):
    """Response model for agent status"""

    data: Optional[Dict[str, Any]] = Field(
        default=None, description="Agent service status information"
    )


# Service instances (using FastAPI's built-in dependency caching)

_service_lock = Lock()
_services = {}


def handle_service_error(
    operation: str, error: Exception, user_id: Optional[str] = None
) -> HTTPException:
    """Centralized error handling with proper logging and user-friendly messages"""
    error_id = f"{operation}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"

    logger.error(
        f"Operation '{operation}' failed [Error ID: {error_id}] "
        f"User: {user_id or 'anonymous'} "
        f"Error: {str(error)} "
        f"Traceback: {traceback.format_exc()}"
    )

    # Map specific errors to user-friendly messages
    if isinstance(error, ValueError):
        return HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"error": "Invalid input data", "error_id": error_id},
        )
    elif isinstance(error, PermissionError):
        return HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"error": "Insufficient permissions", "error_id": error_id},
        )
    elif isinstance(error, ConnectionError):
        return HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={
                "error": "Service temporarily unavailable",
                "error_id": error_id,
            },
        )
    else:
        return HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error": "Internal server error", "error_id": error_id},
        )


def get_agent_orchestrator() -> AgentOrchestrator:
    """Dependency injection for agent orchestrator"""
    with _service_lock:
        if "agent_orchestrator" not in _services:
            settings = get_settings()
            config = {
                "llm_provider": getattr(settings, "LLM_PROVIDER", "openai"),
                "memory_type": getattr(settings, "MEMORY_TYPE", "buffer"),
                "max_iterations": getattr(settings, "MAX_ITERATIONS", 10),
            }
            _services["agent_orchestrator"] = AgentOrchestrator(config)
        return _services["agent_orchestrator"]


def get_rag_engine() -> RAGEngine:
    """Dependency injection for RAG engine"""
    with _service_lock:
        if "rag_engine" not in _services:
            settings = get_settings()
            config = {
                "document_store": getattr(
                    settings, "DOCUMENT_STORE", "inmemory"
                ),
                "use_gpu": getattr(settings, "USE_GPU", False),
                "openai_api_key": getattr(settings, "OPENAI_API_KEY", None),
            }
            _services["rag_engine"] = RAGEngine(config)
        return _services["rag_engine"]


def get_compliance_layer() -> ComplianceLayer:
    """Dependency injection for compliance layer"""
    with _service_lock:
        if "compliance_layer" not in _services:
            settings = get_settings()
            config = {
                "compliance_level": getattr(
                    settings, "COMPLIANCE_LEVEL", "gdpr"
                ),
                "audit_retention_days": getattr(
                    settings, "AUDIT_RETENTION_DAYS", 365
                ),
            }
            _services["compliance_layer"] = ComplianceLayer(config)
        return _services["compliance_layer"]


def get_security_manager() -> SecurityManager:
    """Dependency injection for security manager"""
    with _service_lock:
        if "security_manager" not in _services:
            settings = get_settings()
            config = {
                "jwt_secret": getattr(settings, "SECRET_KEY", None),
                "encryption_password": getattr(
                    settings, "ENCRYPTION_KEY", None
                ),
            }
            _services["security_manager"] = SecurityManager(config)
        return _services["security_manager"]


async def verify_token(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    security_mgr: SecurityManager = Depends(get_security_manager),
) -> Dict[str, Any]:
    """Verify JWT token and return user info"""

    auth_result = await security_mgr.authenticate_request(
        credentials.credentials
    )

    if not auth_result["authenticated"]:
        raise HTTPException(
            status_code=401,
            detail=auth_result.get("error", "Authentication failed"),
        )

    return auth_result


@router.post("/register", response_model=AgentRegistrationResponse)
async def register_agent(
    request: AgentRegistrationRequest,
    user_info: Dict[str, Any] = Depends(verify_token),
    orchestrator: AgentOrchestrator = Depends(get_agent_orchestrator),
):
    """Register a new agent in the orchestration system"""

    logger.info(
        f"Agent registration request from user {user_info.get('user_id')} for agent {request.agent_id}"
    )

    try:
        # For now, create empty tools list (would be populated with actual tools)
        tools = []

        success = await orchestrator.register_agent(
            agent_id=request.agent_id,
            agent_type=request.agent_type,
            tools=tools,
            llm_config=request.llm_config,
        )

        if success:
            response_data = {
                "agent_id": request.agent_id,
                "agent_type": request.agent_type,
                "tools_count": len(request.tools),
                "registered_at": datetime.now().isoformat(),
            }

            logger.info(f"Successfully registered agent {request.agent_id}")

            return AgentRegistrationResponse(
                status="success",
                message=f"Agent {request.agent_id} registered successfully",
                data=response_data,
            )
        else:
            raise ValueError(f"Failed to register agent {request.agent_id}")

    except Exception as e:
        raise handle_service_error(
            "agent_registration", e, user_info.get("user_id")
        )


@router.post("/execute", response_model=WorkflowExecutionResponse)
@invalidate_cache_on_mutation(["agent_status", "service_metrics"])
async def execute_workflow(
    request: WorkflowExecutionRequest,
    background_tasks: BackgroundTasks,
    http_request: Request,
    user_info: Dict[str, Any] = Depends(verify_token),
    orchestrator: AgentOrchestrator = Depends(get_agent_orchestrator),
    compliance: ComplianceLayer = Depends(get_compliance_layer),
    _rate_limit: None = Depends(
        lambda req: rate_limiter.check_rate_limit(req, limit=10, window=60)
    ),
):
    """Execute a workflow using registered agents (Rate limited: 10 requests/minute)"""

    start_time = time.time()
    logger.info(
        f"Workflow execution request from user {user_info.get('user_id')} for workflow {request.workflow_id}"
    )

    try:
        # Validate compliance before execution
        validation = await compliance.validate_operation(
            operation="workflow_execution",
            data=request.input_data,
            user_id=user_info["user_id"],
            tenant_id=user_info["tenant_id"],
            context={"workflow_id": request.workflow_id},
        )

        if not validation["allowed"]:
            # Record compliance failure
            if METRICS_AVAILABLE:
                AgentMetricsCollector.record_compliance_validation(
                    operation="workflow_execution",
                    result="denied",
                    tenant_id=user_info["tenant_id"],
                )
            raise PermissionError(
                f"Compliance violation: {validation['violations']}"
            )

        # Record compliance success
        if METRICS_AVAILABLE:
            AgentMetricsCollector.record_compliance_validation(
                operation="workflow_execution",
                result="allowed",
                tenant_id=user_info["tenant_id"],
            )

        if request.agent_ids and len(request.agent_ids) > 1:
            # Multi-agent coordination
            result = await orchestrator.coordinate_agents(
                agent_ids=request.agent_ids,
                coordination_strategy=request.coordination_strategy,
                shared_context=request.input_data,
            )
        else:
            # Single agent execution
            result = await orchestrator.execute_workflow(
                workflow_id=request.workflow_id,
                input_data=request.input_data,
                tenant_id=user_info["tenant_id"],
                user_id=user_info["user_id"],
            )

        duration = time.time() - start_time

        # Record workflow metrics
        if METRICS_AVAILABLE:
            AgentMetricsCollector.record_workflow_execution(
                workflow_id=request.workflow_id,
                status="success",
                duration=duration,
                coordination_strategy=request.coordination_strategy,
                tenant_id=user_info["tenant_id"],
            )

        response_data = {
            "workflow_id": request.workflow_id,
            "result": result,
            "compliance_audit_id": validation["audit_id"],
            "execution_time": datetime.now().isoformat(),
            "agent_count": len(request.agent_ids) if request.agent_ids else 1,
            "duration_seconds": round(duration, 3),
        }

        logger.info(
            f"Successfully executed workflow {request.workflow_id} in {duration:.3f}s"
        )

        return WorkflowExecutionResponse(
            status="success",
            message=f"Workflow {request.workflow_id} executed successfully",
            data=response_data,
        )

    except PermissionError as e:
        if METRICS_AVAILABLE:
            AgentMetricsCollector.record_error(
                "permission_denied", "/execute", user_info.get("tenant_id")
            )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail=str(e)
        )
    except Exception as e:
        if METRICS_AVAILABLE:
            duration = time.time() - start_time
            AgentMetricsCollector.record_workflow_execution(
                workflow_id=request.workflow_id,
                status="failed",
                duration=duration,
                coordination_strategy=request.coordination_strategy,
                tenant_id=user_info["tenant_id"],
            )
            AgentMetricsCollector.record_error(
                "execution_failed", "/execute", user_info.get("tenant_id")
            )
        raise handle_service_error(
            "workflow_execution", e, user_info.get("user_id")
        )


@router.post("/rag/query", response_model=RAGQueryResponse)
async def query_rag(
    request: RAGQueryRequest,
    user_info: Dict[str, Any] = Depends(verify_token),
    rag: RAGEngine = Depends(get_rag_engine),
    security_mgr: SecurityManager = Depends(get_security_manager),
):
    """Query the RAG engine for information retrieval"""

    logger.info(
        f"RAG query request from user {user_info.get('user_id')}: {request.query[:100]}..."
    )

    try:
        # Detect potential threats in query
        threat_result = await security_mgr.detect_threats(
            input_data={"query": request.query}
        )

        if threat_result["threats_detected"]:
            logger.warning(
                f"Threats detected in RAG query: {threat_result['threats']}"
            )
            if threat_result["action_required"]:
                raise ValueError("Query contains potential security threats")

        # Execute RAG query
        result = await rag.query(
            query=request.query,
            domain=request.domain,
            tenant_id=user_info["tenant_id"],
            top_k=request.top_k,
            use_qa=request.use_qa,
        )

        response_data = {
            "query": request.query,
            "domain": request.domain,
            "top_k": request.top_k,
            "results": result,
            "query_time": datetime.now().isoformat(),
        }

        logger.info(
            f"Successfully processed RAG query for user {user_info.get('user_id')}"
        )

        return RAGQueryResponse(
            status="success",
            message="RAG query processed successfully",
            data=response_data,
        )

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=str(e)
        )
    except Exception as e:
        raise handle_service_error("rag_query", e, user_info.get("user_id"))


@router.post("/rag/index", response_model=DocumentIndexResponse)
async def index_documents(
    request: DocumentIndexRequest,
    background_tasks: BackgroundTasks,
    user_info: Dict[str, Any] = Depends(verify_token),
    rag: RAGEngine = Depends(get_rag_engine),
    compliance: ComplianceLayer = Depends(get_compliance_layer),
):
    """Index documents for RAG retrieval"""

    logger.info(
        f"Document indexing request from user {user_info.get('user_id')}: {len(request.documents)} documents"
    )

    try:
        # Validate compliance for document indexing
        validation = await compliance.validate_operation(
            operation="document_indexing",
            data={
                "document_count": len(request.documents),
                "domain": request.domain,
            },
            user_id=user_info["user_id"],
            tenant_id=user_info["tenant_id"],
        )

        if not validation["allowed"]:
            raise PermissionError(
                f"Compliance violation: {validation['violations']}"
            )

        # Execute indexing in background
        background_tasks.add_task(
            rag.index_documents,
            documents=request.documents,
            domain=request.domain,
            tenant_id=user_info["tenant_id"],
        )

        response_data = {
            "document_count": len(request.documents),
            "domain": request.domain,
            "compliance_audit_id": validation["audit_id"],
            "indexing_started_at": datetime.now().isoformat(),
        }

        logger.info(
            f"Successfully started document indexing for user {user_info.get('user_id')}"
        )

        return DocumentIndexResponse(
            status="success",
            message="Document indexing started",
            data=response_data,
        )

    except PermissionError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail=str(e)
        )
    except Exception as e:
        raise handle_service_error(
            "document_indexing", e, user_info.get("user_id")
        )


@router.post(
    "/compliance/validate", response_model=ComplianceValidationResponse
)
async def validate_compliance(
    request: ComplianceValidationRequest,
    user_info: Dict[str, Any] = Depends(verify_token),
    compliance: ComplianceLayer = Depends(get_compliance_layer),
):
    """Validate operation against compliance requirements"""

    logger.info(
        f"Compliance validation request from user {user_info.get('user_id')} for operation: {request.operation}"
    )

    try:
        result = await compliance.validate_operation(
            operation=request.operation,
            data=request.data,
            user_id=user_info["user_id"],
            tenant_id=user_info["tenant_id"],
            context=request.context,
        )

        response_data = {
            "operation": request.operation,
            "validation_result": result,
            "validated_at": datetime.now().isoformat(),
        }

        logger.info(
            f"Compliance validation completed for user {user_info.get('user_id')}"
        )

        return ComplianceValidationResponse(
            status="success",
            message="Compliance validation completed",
            data=response_data,
        )

    except Exception as e:
        raise handle_service_error(
            "compliance_validation", e, user_info.get("user_id")
        )


@router.get("/status", response_model=AgentStatusResponse)
@cached_response("agent_status", ttl=60, vary_by=["tenant_id"])
async def get_agent_status(
    user_info: Dict[str, Any] = Depends(verify_token),
    orchestrator: AgentOrchestrator = Depends(get_agent_orchestrator),
    rag: RAGEngine = Depends(get_rag_engine),
    compliance: ComplianceLayer = Depends(get_compliance_layer),
    security_mgr: SecurityManager = Depends(get_security_manager),
):
    """Get status of all agent services (Cached for 1 minute)"""

    start_time = time.time()
    logger.info(f"Agent status request from user {user_info.get('user_id')}")

    try:
        agent_status = orchestrator.get_agent_status()
        rag_stats = rag.get_index_stats()
        compliance_status = compliance.get_compliance_status()
        security_metrics = await security_mgr.get_security_metrics()

        response_data = {
            "tenant_id": user_info["tenant_id"],
            "services": {
                "agent_orchestrator": {"status": "active", **agent_status},
                "rag_engine": {"status": "active", **rag_stats},
                "compliance_layer": {"status": "active", **compliance_status},
                "security_manager": {"status": "active", **security_metrics},
            },
            "status_checked_at": datetime.now().isoformat(),
            "cache_info": {
                "cache_available": CACHE_AVAILABLE,
                "metrics_available": METRICS_AVAILABLE,
            },
        }

        # Record metrics
        if METRICS_AVAILABLE:
            duration = time.time() - start_time
            AgentMetricsCollector.record_request(
                endpoint="/status",
                method="GET",
                status_code=200,
                duration=duration,
                tenant_id=user_info["tenant_id"],
            )

        logger.info(
            f"Agent status retrieved for user {user_info.get('user_id')}"
        )

        return AgentStatusResponse(
            status="success",
            message="Agent services status retrieved",
            data=response_data,
        )

    except Exception as e:
        if METRICS_AVAILABLE:
            AgentMetricsCollector.record_error(
                "status_check", "/status", user_info.get("tenant_id")
            )
        raise handle_service_error("status_check", e, user_info.get("user_id"))


@router.get("/health")
async def health_check():
    """Health check endpoint for monitoring"""

    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "service": "auterity-agents",
    }


@router.get("/metrics", response_model=Dict[str, Any])
async def get_metrics(user_info: Dict[str, Any] = Depends(verify_token)):
    """Get system metrics and cache statistics (Admin only)"""

    # Basic permission check (enhance as needed)
    if not user_info.get("is_admin", False):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )

    metrics_data = {
        "timestamp": datetime.now().isoformat(),
        "system": {
            "metrics_available": METRICS_AVAILABLE,
            "cache_available": CACHE_AVAILABLE,
        },
    }

    # Add cache statistics if available
    if CACHE_AVAILABLE:
        try:
            cache_stats = cache_manager.get_stats()
            metrics_data["cache"] = cache_stats
        except Exception:
            metrics_data["cache"] = {"error": "Cache stats unavailable"}

    # Add rate limiter statistics
    try:
        rate_limit_stats = {
            "requests_tracked": len(rate_limiter.requests),
            "total_requests": sum(
                len(reqs) for reqs in rate_limiter.requests.values()
            ),
        }
        metrics_data["rate_limiting"] = rate_limit_stats
    except Exception:
        metrics_data["rate_limiting"] = {
            "error": "Rate limit stats unavailable"
        }

    return metrics_data
