"""
Agent API Router for Auterity

This module provides REST API endpoints for agent orchestration, RAG queries,
and compliance management across the Auterity platform.
"""

from fastapi import APIRouter, Depends, HTTPException, Request, BackgroundTasks
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Dict, List, Any, Optional
from pydantic import BaseModel, Field
from datetime import datetime
import logging

from app.services.agents import AgentOrchestrator, RAGEngine, ComplianceLayer, SecurityManager

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/agents", tags=["agents"])
security = HTTPBearer()


# Pydantic models for request/response
class AgentRegistrationRequest(BaseModel):
    agent_id: str = Field(..., description="Unique identifier for the agent")
    agent_type: str = Field(..., description="Type of agent (autmatrix, relaycore, neuroweaver)")
    llm_config: Dict[str, Any] = Field(..., description="LLM configuration for the agent")
    tools: List[str] = Field(default=[], description="List of tool names for the agent")


class WorkflowExecutionRequest(BaseModel):
    workflow_id: str = Field(..., description="Workflow identifier")
    input_data: Dict[str, Any] = Field(..., description="Input data for the workflow")
    coordination_strategy: Optional[str] = Field(default="sequential", description="Agent coordination strategy")
    agent_ids: Optional[List[str]] = Field(default=None, description="Specific agents to use")


class RAGQueryRequest(BaseModel):
    query: str = Field(..., description="Query text")
    domain: Optional[str] = Field(default=None, description="Domain-specific index to query")
    top_k: int = Field(default=5, description="Number of results to return")
    use_qa: bool = Field(default=True, description="Use question-answering vs retrieval only")


class DocumentIndexRequest(BaseModel):
    documents: List[Dict[str, Any]] = Field(..., description="Documents to index")
    domain: str = Field(default="general", description="Domain classification for documents")


class ComplianceValidationRequest(BaseModel):
    operation: str = Field(..., description="Operation to validate")
    data: Dict[str, Any] = Field(..., description="Data involved in the operation")
    context: Optional[Dict[str, Any]] = Field(default=None, description="Additional context")


# Initialize services (these would be dependency injected in production)
agent_orchestrator = None
rag_engine = None
compliance_layer = None
security_manager = None


def get_agent_orchestrator() -> AgentOrchestrator:
    """Dependency injection for agent orchestrator"""
    global agent_orchestrator
    if not agent_orchestrator:
        config = {
            "llm_provider": "openai",
            "memory_type": "buffer",
            "max_iterations": 10
        }
        agent_orchestrator = AgentOrchestrator(config)
    return agent_orchestrator


def get_rag_engine() -> RAGEngine:
    """Dependency injection for RAG engine"""
    global rag_engine
    if not rag_engine:
        config = {
            "document_store": "inmemory",
            "use_gpu": False,
            "openai_api_key": "your-openai-key"  # Would come from environment
        }
        rag_engine = RAGEngine(config)
    return rag_engine


def get_compliance_layer() -> ComplianceLayer:
    """Dependency injection for compliance layer"""
    global compliance_layer
    if not compliance_layer:
        config = {
            "compliance_level": "gdpr",
            "audit_retention_days": 365
        }
        compliance_layer = ComplianceLayer(config)
    return compliance_layer


def get_security_manager() -> SecurityManager:
    """Dependency injection for security manager"""
    global security_manager
    if not security_manager:
        config = {
            "jwt_secret": "your-jwt-secret",  # Would come from environment
            "encryption_password": "your-encryption-key"
        }
        security_manager = SecurityManager(config)
    return security_manager


async def verify_token(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    security_mgr: SecurityManager = Depends(get_security_manager)
) -> Dict[str, Any]:
    """Verify JWT token and return user info"""
    
    auth_result = await security_mgr.authenticate_request(credentials.credentials)
    
    if not auth_result["authenticated"]:
        raise HTTPException(
            status_code=401,
            detail=auth_result.get("error", "Authentication failed")
        )
    
    return auth_result


@router.post("/register", response_model=Dict[str, Any])
async def register_agent(
    request: AgentRegistrationRequest,
    user_info: Dict[str, Any] = Depends(verify_token),
    orchestrator: AgentOrchestrator = Depends(get_agent_orchestrator)
):
    """Register a new agent in the orchestration system"""
    
    try:
        # For now, create empty tools list (would be populated with actual tools)
        tools = []
        
        success = await orchestrator.register_agent(
            agent_id=request.agent_id,
            agent_type=request.agent_type,
            tools=tools,
            llm_config=request.llm_config
        )
        
        if success:
            return {
                "status": "success",
                "message": f"Agent {request.agent_id} registered successfully",
                "agent_id": request.agent_id,
                "agent_type": request.agent_type
            }
        else:
            raise HTTPException(
                status_code=400,
                detail=f"Failed to register agent {request.agent_id}"
            )
            
    except Exception as e:
        logger.error(f"Agent registration failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/execute", response_model=Dict[str, Any])
async def execute_workflow(
    request: WorkflowExecutionRequest,
    background_tasks: BackgroundTasks,
    user_info: Dict[str, Any] = Depends(verify_token),
    orchestrator: AgentOrchestrator = Depends(get_agent_orchestrator),
    compliance: ComplianceLayer = Depends(get_compliance_layer)
):
    """Execute a workflow using registered agents"""
    
    try:
        # Validate compliance before execution
        validation = await compliance.validate_operation(
            operation="workflow_execution",
            data=request.input_data,
            user_id=user_info["user_id"],
            tenant_id=user_info["tenant_id"],
            context={"workflow_id": request.workflow_id}
        )
        
        if not validation["allowed"]:
            raise HTTPException(
                status_code=403,
                detail=f"Compliance violation: {validation['violations']}"
            )
        
        if request.agent_ids and len(request.agent_ids) > 1:
            # Multi-agent coordination
            result = await orchestrator.coordinate_agents(
                agent_ids=request.agent_ids,
                coordination_strategy=request.coordination_strategy,
                shared_context=request.input_data
            )
        else:
            # Single agent execution
            result = await orchestrator.execute_workflow(
                workflow_id=request.workflow_id,
                input_data=request.input_data,
                tenant_id=user_info["tenant_id"],
                user_id=user_info["user_id"]
            )
        
        return {
            "status": "success",
            "workflow_id": request.workflow_id,
            "result": result,
            "compliance_audit_id": validation["audit_id"]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Workflow execution failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/rag/query", response_model=Dict[str, Any])
async def query_rag(
    request: RAGQueryRequest,
    user_info: Dict[str, Any] = Depends(verify_token),
    rag: RAGEngine = Depends(get_rag_engine),
    security_mgr: SecurityManager = Depends(get_security_manager)
):
    """Query the RAG engine for information retrieval"""
    
    try:
        # Detect potential threats in query
        threat_result = await security_mgr.detect_threats(
            input_data={"query": request.query}
        )
        
        if threat_result["threats_detected"]:
            logger.warning(f"Threats detected in RAG query: {threat_result['threats']}")
            if threat_result["action_required"]:
                raise HTTPException(
                    status_code=400,
                    detail="Query contains potential security threats"
                )
        
        # Execute RAG query
        result = await rag.query(
            query=request.query,
            domain=request.domain,
            tenant_id=user_info["tenant_id"],
            top_k=request.top_k,
            use_qa=request.use_qa
        )
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"RAG query failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/rag/index", response_model=Dict[str, Any])
async def index_documents(
    request: DocumentIndexRequest,
    background_tasks: BackgroundTasks,
    user_info: Dict[str, Any] = Depends(verify_token),
    rag: RAGEngine = Depends(get_rag_engine),
    compliance: ComplianceLayer = Depends(get_compliance_layer)
):
    """Index documents for RAG retrieval"""
    
    try:
        # Validate compliance for document indexing
        validation = await compliance.validate_operation(
            operation="document_indexing",
            data={"document_count": len(request.documents), "domain": request.domain},
            user_id=user_info["user_id"],
            tenant_id=user_info["tenant_id"]
        )
        
        if not validation["allowed"]:
            raise HTTPException(
                status_code=403,
                detail=f"Compliance violation: {validation['violations']}"
            )
        
        # Execute indexing in background
        background_tasks.add_task(
            rag.index_documents,
            documents=request.documents,
            domain=request.domain,
            tenant_id=user_info["tenant_id"]
        )
        
        return {
            "status": "success",
            "message": "Document indexing started",
            "document_count": len(request.documents),
            "domain": request.domain,
            "compliance_audit_id": validation["audit_id"]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Document indexing failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/compliance/validate", response_model=Dict[str, Any])
async def validate_compliance(
    request: ComplianceValidationRequest,
    user_info: Dict[str, Any] = Depends(verify_token),
    compliance: ComplianceLayer = Depends(get_compliance_layer)
):
    """Validate operation against compliance requirements"""
    
    try:
        result = await compliance.validate_operation(
            operation=request.operation,
            data=request.data,
            user_id=user_info["user_id"],
            tenant_id=user_info["tenant_id"],
            context=request.context
        )
        
        return result
        
    except Exception as e:
        logger.error(f"Compliance validation failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/status", response_model=Dict[str, Any])
async def get_agent_status(
    user_info: Dict[str, Any] = Depends(verify_token),
    orchestrator: AgentOrchestrator = Depends(get_agent_orchestrator),
    rag: RAGEngine = Depends(get_rag_engine),
    compliance: ComplianceLayer = Depends(get_compliance_layer),
    security_mgr: SecurityManager = Depends(get_security_manager)
):
    """Get status of all agent services"""
    
    try:
        agent_status = orchestrator.get_agent_status()
        rag_stats = rag.get_index_stats()
        compliance_status = compliance.get_compliance_status()
        security_metrics = await security_mgr.get_security_metrics()
        
        return {
            "timestamp": datetime.now().isoformat(),
            "tenant_id": user_info["tenant_id"],
            "services": {
                "agent_orchestrator": {
                    "status": "active",
                    **agent_status
                },
                "rag_engine": {
                    "status": "active",
                    **rag_stats
                },
                "compliance_layer": {
                    "status": "active",
                    **compliance_status
                },
                "security_manager": {
                    "status": "active",
                    **security_metrics
                }
            }
        }
        
    except Exception as e:
        logger.error(f"Status check failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/health")
async def health_check():
    """Health check endpoint for monitoring"""
    
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "service": "auterity-agents"
    }
