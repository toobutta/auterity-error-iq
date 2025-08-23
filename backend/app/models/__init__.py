"""Models package for the workflow engine."""

from .base import Base, SessionLocal, engine
from .execution import ExecutionLog, ExecutionStatus, WorkflowExecution
from .template import Template, TemplateParameter
from .tenant import AuditLog, SSOConfiguration, Tenant, TenantStatus, SSOProvider
from .user import Permission, Role, SystemPermission, User, UserRole
from .workflow import Workflow
from .agent import Agent, AgentType, AgentStatus, AgentCapability
from .auterity_expansion import (
    TriageRule, TriageRuleType, VectorEmbedding, Integration, IntegrationProvider,
    IntegrationStatus, IntegrationWebhook, ChannelTrigger, ChannelType,
    CustomModel, CustomModelType, CustomModelStatus, AgentMemory, ExecutionMetric,
    TriageResult
)

__all__ = [
    "Base",
    "engine",
    "SessionLocal",
    "User",
    "Role",
    "Permission",
    "UserRole",
    "SystemPermission",
    "Tenant",
    "TenantStatus",
    "SSOProvider",
    "SSOConfiguration",
    "AuditLog",
    "Workflow",
    "WorkflowExecution",
    "ExecutionLog",
    "ExecutionStatus",
    "Template",
    "TemplateParameter",
    # Agent Models
    "Agent", "AgentType", "AgentStatus", "AgentCapability",
    # Auterity Expansion Models
    "TriageRule", "TriageRuleType", "VectorEmbedding", "Integration", "IntegrationProvider",
    "IntegrationStatus", "IntegrationWebhook", "ChannelTrigger", "ChannelType",
    "CustomModel", "CustomModelType", "CustomModelStatus", "AgentMemory", "ExecutionMetric",
    "TriageResult"
]
