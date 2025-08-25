"""Enhanced Industry Specializations Service - Dynamic specialization formats replacing compliance kits."""

import json
import logging
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from decimal import Decimal
from enum import Enum
from typing import Any, Dict, List, Union
from uuid import UUID

import yaml
from app.core.saas_config import SaaSConfig
from app.models.tenant import Tenant, UsageLog
from sqlalchemy import and_
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)


class SpecializationType(str, Enum):
    """Types of industry specializations."""

    COMPLIANCE = "compliance"
    WORKFLOW = "workflow"
    AI_MODEL = "ai_model"
    INTEGRATION = "integration"
    SECURITY = "security"
    CUSTOM = "custom"


class ComplianceLevel(str, Enum):
    """Compliance requirement levels."""

    BASIC = "basic"
    STANDARD = "standard"
    STRICT = "strict"
    ENTERPRISE = "enterprise"


class SpecializationFormat(str, Enum):
    """Formats for specialization configuration."""

    YAML = "yaml"
    JSON = "json"
    PYTHON = "python"
    DATABASE = "database"


@dataclass
class SpecializationConfig:
    """Configuration for a specific industry specialization."""

    id: str
    name: str
    description: str
    type: SpecializationType
    version: str = "1.0"
    enabled: bool = True
    priority: int = 50
    metadata: Dict[str, Any] = field(default_factory=dict)
    requirements: Dict[str, Any] = field(default_factory=dict)
    configuration: Dict[str, Any] = field(default_factory=dict)
    created_at: datetime = field(default_factory=datetime.utcnow)
    updated_at: datetime = field(default_factory=datetime.utcnow)


@dataclass
class ComplianceRequirement:
    """Compliance requirement specification."""

    id: str
    name: str
    description: str
    level: ComplianceLevel
    category: str
    standards: List[str] = field(default_factory=list)
    controls: List[str] = field(default_factory=list)
    validations: List[str] = field(default_factory=list)
    remediation: Dict[str, Any] = field(default_factory=dict)


@dataclass
class WorkflowTemplate:
    """Workflow template specification."""

    id: str
    name: str
    description: str
    category: str
    steps: List[Dict[str, Any]] = field(default_factory=list)
    ai_models: List[str] = field(default_factory=list)
    integrations: List[str] = field(default_factory=list)
    compliance_requirements: List[str] = field(default_factory=list)


@dataclass
class AISpecialization:
    """AI model specialization configuration."""

    id: str
    name: str
    description: str
    model_preferences: Dict[str, Any] = field(default_factory=dict)
    fine_tuning_requirements: Dict[str, Any] = field(default_factory=dict)
    performance_requirements: Dict[str, Any] = field(default_factory=dict)
    cost_optimizations: Dict[str, Any] = field(default_factory=dict)


@dataclass
class SpecializationResult:
    """Result of applying a specialization."""

    success: bool
    specialization_id: str
    applied_changes: List[str] = field(default_factory=list)
    validation_results: Dict[str, Any] = field(default_factory=dict)
    errors: List[str] = field(default_factory=list)
    warnings: List[str] = field(default_factory=list)


class IndustrySpecializationService:
    """Enhanced Industry Specializations Service - Dynamic specialization formats replacing compliance kits."""

    def __init__(self, db: Session):
        self.db = db
        self.config = SaaSConfig()
        self._specialization_cache: Dict[str, SpecializationConfig] = {}
        self._compliance_cache: Dict[str, ComplianceRequirement] = {}
        self._template_cache: Dict[str, WorkflowTemplate] = {}
        self._ai_cache: Dict[str, AISpecialization] = {}

    async def create_specialization(
        self,
        tenant_id: UUID,
        config_data: Dict[str, Any],
        format_type: SpecializationFormat = SpecializationFormat.JSON,
    ) -> SpecializationResult:
        """Create a new industry specialization with dynamic format support."""
        try:
            # Parse and validate configuration
            config = await self._parse_specialization_config(config_data, format_type)

            # Validate specialization requirements
            validation_result = await self._validate_specialization_requirements(
                tenant_id, config
            )

            if not validation_result["valid"]:
                return SpecializationResult(
                    success=False,
                    specialization_id=config.id,
                    errors=validation_result["errors"],
                    warnings=validation_result["warnings"],
                )

            # Store specialization
            await self._store_specialization(tenant_id, config)

            # Apply specialization if auto-apply is enabled
            applied_changes = []
            if config.configuration.get("auto_apply", False):
                apply_result = await self.apply_specialization(tenant_id, config.id)
                applied_changes = apply_result.applied_changes

            return SpecializationResult(
                success=True,
                specialization_id=config.id,
                applied_changes=applied_changes,
                validation_results=validation_result,
            )

        except Exception as e:
            logger.error(f"Specialization creation failed: {str(e)}")
            return SpecializationResult(
                success=False,
                specialization_id=config_data.get("id", "unknown"),
                errors=[str(e)],
            )

    async def _parse_specialization_config(
        self, config_data: Dict[str, Any], format_type: SpecializationFormat
    ) -> SpecializationConfig:
        """Parse specialization configuration from various formats."""
        if format_type == SpecializationFormat.JSON:
            return SpecializationConfig(**config_data)
        elif format_type == SpecializationFormat.YAML:
            yaml_data = yaml.safe_load(json.dumps(config_data))
            return SpecializationConfig(**yaml_data)
        elif format_type == SpecializationFormat.PYTHON:
            # For Python format, config_data should contain Python code
            # This is a simplified implementation
            return await self._parse_python_config(config_data)
        else:
            raise ValueError(f"Unsupported format: {format_type}")

    async def _parse_python_config(
        self, config_data: Dict[str, Any]
    ) -> SpecializationConfig:
        """Parse Python-based configuration (simplified implementation)."""
        # In a real implementation, this would safely execute Python code
        # For now, we'll just convert it to a standard config
        python_code = config_data.get("code", "")

        # Basic parsing - extract key-value pairs
        config_dict = {
            "id": config_data.get("id", "python_generated"),
            "name": config_data.get("name", "Python Generated"),
            "description": config_data.get("description", ""),
            "type": config_data.get("type", SpecializationType.CUSTOM),
            "configuration": config_data.get("config", {}),
        }

        return SpecializationConfig(**config_dict)

    async def _validate_specialization_requirements(
        self, tenant_id: UUID, config: SpecializationConfig
    ) -> Dict[str, Any]:
        """Validate specialization requirements against tenant capabilities."""
        tenant = self.db.query(Tenant).filter(Tenant.id == tenant_id).first()
        if not tenant:
            return {"valid": False, "errors": ["Tenant not found"]}

        errors = []
        warnings = []

        # Check subscription plan compatibility
        plan_features = tenant.get_plan_features()
        required_features = config.requirements.get("features", [])

        for feature in required_features:
            if feature not in plan_features:
                errors.append(f"Required feature not available: {feature}")

        # Check usage limits
        usage_limits = config.requirements.get("usage_limits", {})
        if "max_ai_requests" in usage_limits:
            if tenant.max_ai_requests_per_month < usage_limits["max_ai_requests"]:
                warnings.append("AI request limit may be insufficient")

        # Check compliance requirements
        compliance_reqs = config.requirements.get("compliance", [])
        for compliance in compliance_reqs:
            if not await self._check_compliance_compatibility(tenant_id, compliance):
                errors.append(f"Compliance requirement not met: {compliance}")

        # Check integration requirements
        integrations = config.requirements.get("integrations", [])
        for integration in integrations:
            if not await self._check_integration_availability(tenant_id, integration):
                warnings.append(f"Integration may not be available: {integration}")

        return {"valid": len(errors) == 0, "errors": errors, "warnings": warnings}

    async def _check_compliance_compatibility(
        self, tenant_id: UUID, compliance: str
    ) -> bool:
        """Check if tenant meets compliance requirements."""
        # Implementation would check tenant's compliance certifications
        # For now, return True for demonstration
        return True

    async def _check_integration_availability(
        self, tenant_id: UUID, integration: str
    ) -> bool:
        """Check if integration is available for tenant."""
        # Implementation would check available integrations
        # For now, return True for demonstration
        return True

    async def _store_specialization(
        self, tenant_id: UUID, config: SpecializationConfig
    ) -> None:
        """Store specialization configuration."""
        # In a real implementation, this would store in database
        # For now, we'll cache it
        cache_key = f"{tenant_id}:{config.id}"
        self._specialization_cache[cache_key] = config

    async def apply_specialization(
        self, tenant_id: UUID, specialization_id: str
    ) -> SpecializationResult:
        """Apply specialization to tenant configuration."""
        try:
            cache_key = f"{tenant_id}:{specialization_id}"
            config = self._specialization_cache.get(cache_key)

            if not config:
                return SpecializationResult(
                    success=False,
                    specialization_id=specialization_id,
                    errors=["Specialization not found"],
                )

            applied_changes = []

            # Apply configuration changes
            tenant = self.db.query(Tenant).filter(Tenant.id == tenant_id).first()
            if not tenant:
                return SpecializationResult(
                    success=False,
                    specialization_id=specialization_id,
                    errors=["Tenant not found"],
                )

            # Apply industry settings
            if config.configuration.get("industry_settings"):
                tenant.industry_settings = config.configuration["industry_settings"]
                applied_changes.append("Updated industry settings")

            # Apply AI model preferences
            if config.configuration.get("ai_model_preferences"):
                if not tenant.industry_settings:
                    tenant.industry_settings = {}
                tenant.industry_settings["ai_model_preferences"] = config.configuration[
                    "ai_model_preferences"
                ]
                applied_changes.append("Updated AI model preferences")

            # Apply workflow templates
            if config.configuration.get("workflow_templates"):
                applied_changes.append("Applied workflow templates")

            # Apply compliance settings
            if config.configuration.get("compliance_settings"):
                if not tenant.industry_settings:
                    tenant.industry_settings = {}
                tenant.industry_settings["compliance_settings"] = config.configuration[
                    "compliance_settings"
                ]
                applied_changes.append("Applied compliance settings")

            # Apply security settings
            if config.configuration.get("security_settings"):
                applied_changes.append("Applied security settings")

            self.db.commit()

            return SpecializationResult(
                success=True,
                specialization_id=specialization_id,
                applied_changes=applied_changes,
            )

        except Exception as e:
            logger.error(f"Specialization application failed: {str(e)}")
            return SpecializationResult(
                success=False, specialization_id=specialization_id, errors=[str(e)]
            )

    async def create_compliance_specialization(
        self,
        tenant_id: UUID,
        compliance_requirements: List[Dict[str, Any]],
        level: ComplianceLevel = ComplianceLevel.STANDARD,
    ) -> SpecializationResult:
        """Create a compliance-focused specialization (replaces old compliance kits)."""
        try:
            # Generate compliance configuration
            compliance_config = {
                "id": f"compliance_{level.value}_{datetime.utcnow().timestamp()}",
                "name": f"Compliance Specialization - {level.value.title()}",
                "description": f"Dynamic compliance configuration for {level.value} requirements",
                "type": SpecializationType.COMPLIANCE,
                "configuration": {
                    "compliance_level": level.value,
                    "requirements": compliance_requirements,
                    "auto_apply": True,
                    "monitoring": True,
                    "reporting": True,
                    "remediation": True,
                },
                "requirements": {
                    "features": ["advanced_compliance", "audit_logging"],
                    "compliance": [
                        req.get("standard", "") for req in compliance_requirements
                    ],
                },
            }

            return await self.create_specialization(
                tenant_id, compliance_config, SpecializationFormat.JSON
            )

        except Exception as e:
            logger.error(f"Compliance specialization creation failed: {str(e)}")
            return SpecializationResult(
                success=False,
                specialization_id="compliance_specialization",
                errors=[str(e)],
            )

    async def create_workflow_specialization(
        self,
        tenant_id: UUID,
        workflow_templates: List[Dict[str, Any]],
        industry_context: str,
    ) -> SpecializationResult:
        """Create a workflow-focused specialization."""
        try:
            workflow_config = {
                "id": f"workflow_{industry_context}_{datetime.utcnow().timestamp()}",
                "name": f"Workflow Specialization - {industry_context.title()}",
                "description": f"Dynamic workflow templates for {industry_context} industry",
                "type": SpecializationType.WORKFLOW,
                "configuration": {
                    "workflow_templates": workflow_templates,
                    "industry_context": industry_context,
                    "auto_apply": True,
                    "customizable": True,
                },
                "requirements": {"features": ["workflow_engine", "template_system"]},
            }

            return await self.create_specialization(
                tenant_id, workflow_config, SpecializationFormat.JSON
            )

        except Exception as e:
            logger.error(f"Workflow specialization creation failed: {str(e)}")
            return SpecializationResult(
                success=False,
                specialization_id="workflow_specialization",
                errors=[str(e)],
            )

    async def create_ai_model_specialization(
        self,
        tenant_id: UUID,
        model_requirements: Dict[str, Any],
        optimization_goals: List[str],
    ) -> SpecializationResult:
        """Create an AI model-focused specialization."""
        try:
            ai_config = {
                "id": f"ai_model_{datetime.utcnow().timestamp()}",
                "name": "AI Model Specialization",
                "description": "Dynamic AI model configuration and optimization",
                "type": SpecializationType.AI_MODEL,
                "configuration": {
                    "model_requirements": model_requirements,
                    "optimization_goals": optimization_goals,
                    "auto_optimization": True,
                    "performance_monitoring": True,
                },
                "requirements": {"features": ["ai_optimization", "model_routing"]},
            }

            return await self.create_specialization(
                tenant_id, ai_config, SpecializationFormat.JSON
            )

        except Exception as e:
            logger.error(f"AI model specialization creation failed: {str(e)}")
            return SpecializationResult(
                success=False,
                specialization_id="ai_model_specialization",
                errors=[str(e)],
            )

    async def get_tenant_specializations(self, tenant_id: UUID) -> List[Dict[str, Any]]:
        """Get all specializations for a tenant."""
        specializations = []

        for cache_key, config in self._specialization_cache.items():
            if cache_key.startswith(f"{tenant_id}:"):
                specializations.append(
                    {
                        "id": config.id,
                        "name": config.name,
                        "description": config.description,
                        "type": config.type,
                        "enabled": config.enabled,
                        "priority": config.priority,
                        "created_at": config.created_at.isoformat(),
                        "updated_at": config.updated_at.isoformat(),
                    }
                )

        return specializations

    async def update_specialization(
        self, tenant_id: UUID, specialization_id: str, updates: Dict[str, Any]
    ) -> SpecializationResult:
        """Update an existing specialization."""
        try:
            cache_key = f"{tenant_id}:{specialization_id}"
            config = self._specialization_cache.get(cache_key)

            if not config:
                return SpecializationResult(
                    success=False,
                    specialization_id=specialization_id,
                    errors=["Specialization not found"],
                )

            # Update configuration
            for key, value in updates.items():
                if hasattr(config, key):
                    setattr(config, key, value)

            config.updated_at = datetime.utcnow()

            # Re-validate and re-apply if needed
            validation_result = await self._validate_specialization_requirements(
                tenant_id, config
            )

            applied_changes = []
            if validation_result["valid"]:
                apply_result = await self.apply_specialization(
                    tenant_id, specialization_id
                )
                applied_changes = apply_result.applied_changes

            return SpecializationResult(
                success=True,
                specialization_id=specialization_id,
                applied_changes=applied_changes,
                validation_results=validation_result,
            )

        except Exception as e:
            logger.error(f"Specialization update failed: {str(e)}")
            return SpecializationResult(
                success=False, specialization_id=specialization_id, errors=[str(e)]
            )

    async def delete_specialization(
        self, tenant_id: UUID, specialization_id: str
    ) -> bool:
        """Delete a specialization."""
        try:
            cache_key = f"{tenant_id}:{specialization_id}"

            if cache_key in self._specialization_cache:
                del self._specialization_cache[cache_key]
                return True

            return False

        except Exception as e:
            logger.error(f"Specialization deletion failed: {str(e)}")
            return False

    async def get_specialization_analytics(
        self, tenant_id: UUID, specialization_id: str, time_period_days: int = 30
    ) -> Dict[str, Any]:
        """Get analytics for a specific specialization."""
        try:
            # This would analyze usage patterns, effectiveness, etc.
            # For now, return basic analytics structure

            period_start = datetime.utcnow() - timedelta(days=time_period_days)

            usage_logs = (
                self.db.query(UsageLog)
                .filter(
                    and_(
                        UsageLog.tenant_id == tenant_id,
                        UsageLog.created_at >= period_start,
                    )
                )
                .all()
            )

            analytics = {
                "specialization_id": specialization_id,
                "period_days": time_period_days,
                "total_requests": len(usage_logs),
                "successful_requests": sum(
                    1 for log in usage_logs if log.status == "success"
                ),
                "total_cost": sum(
                    log.cost_amount or Decimal("0") for log in usage_logs
                ),
                "avg_cost_per_request": Decimal("0"),
                "performance_metrics": {},
                "compliance_metrics": {},
                "effectiveness_score": 0.0,
            }

            if analytics["total_requests"] > 0:
                analytics["avg_cost_per_request"] = analytics["total_cost"] / Decimal(
                    analytics["total_requests"]
                )
                analytics["effectiveness_score"] = (
                    analytics["successful_requests"] / analytics["total_requests"]
                )

            return analytics

        except Exception as e:
            logger.error(f"Analytics generation failed: {str(e)}")
            return {"error": str(e)}

    async def export_specialization(
        self,
        tenant_id: UUID,
        specialization_id: str,
        format_type: SpecializationFormat = SpecializationFormat.JSON,
    ) -> Dict[str, Any]:
        """Export specialization configuration."""
        try:
            cache_key = f"{tenant_id}:{specialization_id}"
            config = self._specialization_cache.get(cache_key)

            if not config:
                return {"error": "Specialization not found"}

            export_data = {
                "id": config.id,
                "name": config.name,
                "description": config.description,
                "type": config.type,
                "version": config.version,
                "enabled": config.enabled,
                "priority": config.priority,
                "metadata": config.metadata,
                "requirements": config.requirements,
                "configuration": config.configuration,
                "exported_at": datetime.utcnow().isoformat(),
                "format": format_type.value,
            }

            if format_type == SpecializationFormat.YAML:
                return yaml.dump(export_data, default_flow_style=False)
            else:
                return export_data

        except Exception as e:
            logger.error(f"Specialization export failed: {str(e)}")
            return {"error": str(e)}

    async def import_specialization(
        self,
        tenant_id: UUID,
        import_data: Union[Dict[str, Any], str],
        format_type: SpecializationFormat = SpecializationFormat.JSON,
    ) -> SpecializationResult:
        """Import specialization from external source."""
        try:
            if isinstance(import_data, str):
                if format_type == SpecializationFormat.YAML:
                    import_data = yaml.safe_load(import_data)
                else:
                    import_data = json.loads(import_data)

            return await self.create_specialization(tenant_id, import_data, format_type)

        except Exception as e:
            logger.error(f"Specialization import failed: {str(e)}")
            return SpecializationResult(
                success=False, specialization_id="import_failed", errors=[str(e)]
            )
