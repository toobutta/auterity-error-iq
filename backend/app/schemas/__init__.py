"""Pydantic schemas package."""

from .workflow import (
    ExecutionLogResponse,
    ExecutionResultResponse,
    ExecutionStatusResponse,
    WorkflowCreate,
    WorkflowExecuteRequest,
    WorkflowListResponse,
    WorkflowResponse,
    WorkflowUpdate,
)

from .auth import (
    CrossSystemTokenRequest,
    CrossSystemTokenResponse,
    PermissionResponse,
    RoleCreate,
    RoleResponse,
    Token,
    UserLogin,
    UserRegister,
    UserResponse,
    UserRoleAssignment,
)

from .template import (
    TemplateCreate,
    TemplateUpdate,
    TemplateResponse,
    TemplateListResponse,
    TemplateInstantiateRequest,
)

from .auterity_expansion import (
    # Triage schemas
    TriageRuleCreate, TriageRuleUpdate, TriageRuleResponse,
    TriageRequest, TriageResponse, TriageResultCreate, TriageResultResponse,
    
    # Vector and similarity schemas
    VectorEmbeddingCreate, VectorEmbeddingResponse, SimilarityResult,
    SimilaritySearchRequest, SimilaritySearchResponse,
    
    # Integration schemas
    IntegrationCreate, IntegrationUpdate, IntegrationResponse,
    IntegrationWebhookCreate, IntegrationWebhookResponse,
    IntegrationSyncRequest, IntegrationSyncResponse,
    
    # Channel trigger schemas
    ChannelTriggerCreate, ChannelTriggerUpdate, ChannelTriggerResponse,
    ChannelTriggerRequest, ChannelTriggerResponse,
    
    # Custom model schemas
    CustomModelCreate, CustomModelUpdate, CustomModelResponse,
    CustomModelHealthCheck,
    
    # Agent and execution schemas
    AgentMemoryCreate, AgentMemoryResponse, ExecutionMetricCreate, ExecutionMetricResponse,
    AgentDeployRequest, AgentDeployResponse, LiveInsightsRequest, LiveInsightsResponse
)

__all__ = [
    "WorkflowCreate",
    "WorkflowUpdate",
    "WorkflowResponse",
    "WorkflowListResponse",
    "WorkflowExecuteRequest",
    "ExecutionStatusResponse",
    "ExecutionLogResponse",
    "ExecutionResultResponse",
    "UserRoleAssignment",
    "UserResponse",
    "UserRegister",
    "UserLogin",
    "Token",
    "RoleResponse",
    "RoleCreate",
    "PermissionResponse",
    "CrossSystemTokenResponse",
    "CrossSystemTokenRequest",
    "TemplateCreate",
    "TemplateUpdate",
    "TemplateResponse",
    "TemplateListResponse",
    "TemplateInstantiateRequest",
    # Auterity Expansion Schemas
    "TriageRuleCreate", "TriageRuleUpdate", "TriageRuleResponse",
    "TriageRequest", "TriageResponse", "TriageResultCreate", "TriageResultResponse",
    "VectorEmbeddingCreate", "VectorEmbeddingResponse", "SimilarityResult",
    "SimilaritySearchRequest", "SimilaritySearchResponse",
    "IntegrationCreate", "IntegrationUpdate", "IntegrationResponse",
    "IntegrationWebhookCreate", "IntegrationWebhookResponse",
    "IntegrationSyncRequest", "IntegrationSyncResponse",
    "ChannelTriggerCreate", "ChannelTriggerUpdate", "ChannelTriggerResponse",
    "ChannelTriggerRequest", "ChannelTriggerResponse",
    "CustomModelCreate", "CustomModelUpdate", "CustomModelResponse",
    "CustomModelHealthCheck",
    "AgentMemoryCreate", "AgentMemoryResponse", "ExecutionMetricCreate", "ExecutionMetricResponse",
    "AgentDeployRequest", "AgentDeployResponse", "LiveInsightsRequest", "LiveInsightsResponse"
]
