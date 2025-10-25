"""Multi-Tenant AI Service Isolation for Week 3."""

import asyncio
import time
from typing import Dict, List, Optional, Any, Tuple
from datetime import datetime, timedelta
from dataclasses import dataclass
import logging
from contextvars import ContextVar
import json

from app.database import get_db_session
from app.monitoring.performance import performance_monitor

logger = logging.getLogger(__name__)

# Context variable for current tenant
current_tenant: ContextVar[Optional[str]] = ContextVar('current_tenant', default=None)


@dataclass
class TenantAIConfig:
    """Tenant AI configuration."""
    tenant_id: str
    name: str
    domain: str
    status: str  # active, suspended, inactive
    plan: str  # starter, professional, enterprise
    created_at: datetime
    updated_at: datetime
    ai_settings: Dict[str, Any]


@dataclass
class TenantAIQuota:
    """Tenant AI resource quotas."""
    tenant_id: str
    max_requests_per_hour: int
    max_requests_per_day: int
    max_concurrent_requests: int
    max_storage_gb: float
    max_models: int
    max_fine_tuning_jobs: int
    current_requests_hour: int = 0
    current_requests_day: int = 0
    current_concurrent: int = 0
    current_storage_gb: float = 0.0
    current_models: int = 0
    current_fine_tuning_jobs: int = 0


@dataclass
class TenantAIIsolation:
    """Tenant AI isolation context."""
    tenant_id: str
    database_schema: str
    storage_prefix: str
    cache_namespace: str
    queue_prefix: str
    allowed_providers: List[str]
    custom_ai_configs: Dict[str, Any]
    model_registry_prefix: str
    fine_tuning_workspace: str


class MultiTenantAIService:
    """Multi-tenant AI service isolation."""

    def __init__(self):
        self.tenants: Dict[str, TenantAIConfig] = {}
        self.quotas: Dict[str, TenantAIQuota] = {}
        self.isolation_configs: Dict[str, TenantAIIsolation] = {}
        self.usage_tracking: Dict[str, Dict[str, Any]] = {}

    async def initialize(self):
        """Initialize multi-tenant AI service."""
        await self._load_tenant_configs()
        await self._load_ai_quotas()
        await self._setup_ai_isolation()
        await self._start_ai_usage_monitoring()

        logger.info(f"Multi-Tenant AI Service initialized for {len(self.tenants)} tenants")

    async def _load_tenant_configs(self):
        """Load tenant AI configurations."""
        try:
            async with get_db_session() as session:
                tenants = await session.execute(
                    "SELECT tenant_id, name, domain, status, plan, created_at, updated_at, ai_settings FROM tenant_ai_configs WHERE status = 'active'"
                )
                for tenant in tenants:
                    self.tenants[tenant.tenant_id] = TenantAIConfig(
                        tenant_id=tenant.tenant_id,
                        name=tenant.name,
                        domain=tenant.domain,
                        status=tenant.status,
                        plan=tenant.plan,
                        created_at=tenant.created_at,
                        updated_at=tenant.updated_at,
                        ai_settings=json.loads(tenant.ai_settings) if tenant.ai_settings else {}
                    )
        except Exception as e:
            logger.error(f"Failed to load tenant AI configs: {e}")

    async def _load_ai_quotas(self):
        """Load tenant AI quotas."""
        try:
            async with get_db_session() as session:
                quotas = await session.execute(
                    "SELECT * FROM tenant_ai_quotas"
                )
                for quota in quotas:
                    self.quotas[quota.tenant_id] = TenantAIQuota(
                        tenant_id=quota.tenant_id,
                        max_requests_per_hour=quota.max_requests_per_hour,
                        max_requests_per_day=quota.max_requests_per_day,
                        max_concurrent_requests=quota.max_concurrent_requests,
                        max_storage_gb=quota.max_storage_gb,
                        max_models=quota.max_models,
                        max_fine_tuning_jobs=quota.max_fine_tuning_jobs,
                        current_requests_hour=quota.current_requests_hour,
                        current_requests_day=quota.current_requests_day,
                        current_concurrent=quota.current_concurrent,
                        current_storage_gb=quota.current_storage_gb,
                        current_models=quota.current_models,
                        current_fine_tuning_jobs=quota.current_fine_tuning_jobs
                    )
        except Exception as e:
            logger.error(f"Failed to load AI quotas: {e}")

    async def _setup_ai_isolation(self):
        """Setup tenant AI isolation configurations."""
        for tenant_id, tenant in self.tenants.items():
            self.isolation_configs[tenant_id] = TenantAIIsolation(
                tenant_id=tenant_id,
                database_schema=f"tenant_{tenant_id}",
                storage_prefix=f"tenant_{tenant_id}/ai/",
                cache_namespace=f"tenant:{tenant_id}:ai",
                queue_prefix=f"tenant_{tenant_id}_ai_",
                allowed_providers=self._get_allowed_ai_providers(tenant.plan),
                custom_ai_configs=tenant.ai_settings.get('custom_configs', {}),
                model_registry_prefix=f"tenant_{tenant_id}_models/",
                fine_tuning_workspace=f"tenant_{tenant_id}_ft/"
            )

    def _get_allowed_ai_providers(self, plan: str) -> List[str]:
        """Get allowed AI providers based on plan."""
        plan_providers = {
            'starter': ['gpt-3.5-turbo', 'claude-3-haiku'],
            'professional': ['gpt-4', 'gpt-3.5-turbo', 'claude-3-opus', 'claude-3-haiku'],
            'enterprise': ['gpt-4-turbo', 'gpt-4', 'claude-3-opus', 'claude-3-haiku', 'custom-models']
        }
        return plan_providers.get(plan, ['gpt-3.5-turbo'])

    async def _start_ai_usage_monitoring(self):
        """Start background AI usage monitoring."""
        asyncio.create_task(self._ai_usage_monitoring_loop())

    async def _ai_usage_monitoring_loop(self):
        """Background AI usage monitoring."""
        while True:
            try:
                await self._reset_ai_hourly_usage()
                await self._check_ai_quota_limits()
                await asyncio.sleep(3600)  # Check every hour
            except Exception as e:
                logger.error(f"AI usage monitoring error: {e}")
                await asyncio.sleep(300)

    async def _reset_ai_hourly_usage(self):
        """Reset hourly AI usage counters."""
        now = datetime.utcnow()
        if now.minute == 0:  # Reset at the top of each hour
            for quota in self.quotas.values():
                quota.current_requests_hour = 0
                quota.current_concurrent = 0

    async def _check_ai_quota_limits(self):
        """Check and enforce AI quota limits."""
        for tenant_id, quota in self.quotas.items():
            if quota.current_requests_day >= quota.max_requests_per_day:
                await self._enforce_ai_quota_limit(tenant_id, "daily_requests", quota.max_requests_per_day)

            if quota.current_requests_hour >= quota.max_requests_per_hour:
                await self._enforce_ai_quota_limit(tenant_id, "hourly_requests", quota.max_requests_per_hour)

            if quota.current_fine_tuning_jobs >= quota.max_fine_tuning_jobs:
                await self._enforce_ai_quota_limit(tenant_id, "fine_tuning_jobs", quota.max_fine_tuning_jobs)

    async def _enforce_ai_quota_limit(self, tenant_id: str, limit_type: str, limit_value: int):
        """Enforce AI quota limit for tenant."""
        logger.warning(f"Enforcing {limit_type} AI quota limit of {limit_value} for tenant {tenant_id}")

    async def get_tenant_ai_context(self, tenant_id: str) -> Optional[TenantAIIsolation]:
        """Get tenant AI isolation context."""
        return self.isolation_configs.get(tenant_id)

    async def validate_tenant_ai_access(self, tenant_id: str, user_id: str, resource: str = "ai_service") -> bool:
        """Validate if user has access to tenant AI resources."""
        try:
            async with get_db_session() as session:
                # Check if user belongs to tenant and has AI access
                user_access = await session.execute(
                    "SELECT role FROM tenant_user_roles WHERE user_id = :user_id AND tenant_id = :tenant_id",
                    {"user_id": user_id, "tenant_id": tenant_id}
                )
                result = user_access.fetchone()
                if not result:
                    return False

                # Check if role has AI access
                ai_roles = ['admin', 'ai_admin', 'ai_user']
                return result.role in ai_roles
        except Exception as e:
            logger.error(f"Tenant AI access validation failed: {e}")
            return False

    async def check_ai_quota(self, tenant_id: str, request_type: str = "ai_call") -> Tuple[bool, str]:
        """Check if tenant is within AI quota limits."""
        if tenant_id not in self.quotas:
            return False, "Tenant AI configuration not found"

        quota = self.quotas[tenant_id]

        # Check concurrent requests
        if quota.current_concurrent >= quota.max_concurrent_requests:
            return False, f"Concurrent AI request limit exceeded ({quota.max_concurrent_requests})"

        # Check daily requests
        if quota.current_requests_day >= quota.max_requests_per_day:
            return False, f"Daily AI request limit exceeded ({quota.max_requests_per_day})"

        # Check hourly requests
        if quota.current_requests_hour >= quota.max_requests_per_hour:
            return False, f"Hourly AI request limit exceeded ({quota.max_requests_per_hour})"

        # Check storage
        if quota.current_storage_gb >= quota.max_storage_gb:
            return False, f"Storage limit exceeded ({quota.max_storage_gb}GB)"

        # Check models
        if quota.current_models >= quota.max_models:
            return False, f"Model limit exceeded ({quota.max_models})"

        # Check fine-tuning jobs
        if request_type == "fine_tuning" and quota.current_fine_tuning_jobs >= quota.max_fine_tuning_jobs:
            return False, f"Fine-tuning job limit exceeded ({quota.max_fine_tuning_jobs})"

        return True, "Within AI quota"

    async def record_ai_usage(self, tenant_id: str, usage_type: str, amount: float = 1.0):
        """Record tenant AI usage."""
        if tenant_id not in self.quotas:
            return

        quota = self.quotas[tenant_id]

        if usage_type == "ai_call":
            quota.current_requests_hour += int(amount)
            quota.current_requests_day += int(amount)
            quota.current_concurrent += int(amount)

        elif usage_type == "storage":
            quota.current_storage_gb += amount

        elif usage_type == "model":
            quota.current_models += int(amount)

        elif usage_type == "fine_tuning_job":
            quota.current_fine_tuning_jobs += int(amount)

        # Update usage tracking
        if tenant_id not in self.usage_tracking:
            self.usage_tracking[tenant_id] = {}

        tracking = self.usage_tracking[tenant_id]
        current_hour = datetime.utcnow().strftime("%Y-%m-%d-%H")

        if current_hour not in tracking:
            tracking[current_hour] = {
                'ai_calls': 0,
                'storage': 0.0,
                'models': 0,
                'fine_tuning_jobs': 0
            }

        if usage_type == "ai_call":
            tracking[current_hour]['ai_calls'] += int(amount)
        elif usage_type == "storage":
            tracking[current_hour]['storage'] += amount
        elif usage_type == "model":
            tracking[current_hour]['models'] += int(amount)
        elif usage_type == "fine_tuning_job":
            tracking[current_hour]['fine_tuning_jobs'] += int(amount)

    async def get_tenant_ai_usage(self, tenant_id: str, period: str = "24h") -> Dict[str, Any]:
        """Get tenant AI usage statistics."""
        if tenant_id not in self.usage_tracking:
            return {
                'ai_calls': 0,
                'storage_gb': 0.0,
                'models': 0,
                'fine_tuning_jobs': 0
            }

        tracking = self.usage_tracking[tenant_id]
        now = datetime.utcnow()

        # Filter by period
        cutoff_hours = 24 if period == "24h" else 168 if period == "7d" else 720  # 30 days

        filtered_usage = {}
        for hour_key, usage in tracking.items():
            hour_dt = datetime.strptime(hour_key, "%Y-%m-%d-%H")
            if (now - hour_dt).total_seconds() <= (cutoff_hours * 3600):
                filtered_usage[hour_key] = usage

        # Aggregate usage
        total_ai_calls = sum(u['ai_calls'] for u in filtered_usage.values())
        total_storage = sum(u['storage'] for u in filtered_usage.values())
        total_models = sum(u['models'] for u in filtered_usage.values())
        total_ft_jobs = sum(u['fine_tuning_jobs'] for u in filtered_usage.values())

        return {
            'ai_calls': total_ai_calls,
            'storage_gb': total_storage,
            'models': total_models,
            'fine_tuning_jobs': total_ft_jobs,
            'period': period
        }

    async def create_tenant_ai_config(self, tenant_data: Dict[str, Any]) -> Optional[str]:
        """Create a new tenant AI configuration."""
        try:
            tenant_id = f"tenant_{int(time.time())}"

            tenant_config = TenantAIConfig(
                tenant_id=tenant_id,
                name=tenant_data['name'],
                domain=tenant_data['domain'],
                status='active',
                plan=tenant_data.get('plan', 'starter'),
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow(),
                ai_settings=tenant_data.get('ai_settings', {})
            )

            # Save to database (would be implemented)
            self.tenants[tenant_id] = tenant_config

            # Setup default AI quota
            quota = TenantAIQuota(
                tenant_id=tenant_id,
                max_requests_per_hour=1000,
                max_requests_per_day=10000,
                max_concurrent_requests=10,
                max_storage_gb=10.0,
                max_models=5,
                max_fine_tuning_jobs=2
            )
            self.quotas[tenant_id] = quota

            # Setup AI isolation config
            await self._setup_ai_isolation()

            logger.info(f"Created new tenant AI config: {tenant_id}")
            return tenant_id

        except Exception as e:
            logger.error(f"Failed to create tenant AI config: {e}")
            return None

    async def update_tenant_ai_settings(self, tenant_id: str, ai_updates: Dict[str, Any]):
        """Update tenant AI settings."""
        if tenant_id not in self.tenants:
            raise ValueError(f"Tenant AI config {tenant_id} not found")

        tenant = self.tenants[tenant_id]
        tenant.ai_settings.update(ai_updates)
        tenant.updated_at = datetime.utcnow()

        # Update isolation config if needed
        if 'custom_configs' in ai_updates:
            self.isolation_configs[tenant_id].custom_ai_configs.update(ai_updates['custom_configs'])

        logger.info(f"Updated tenant AI settings: {tenant_id}")

    async def isolate_tenant_request(self, tenant_id: str, request_data: Dict[str, Any]) -> Dict[str, Any]:
        """Isolate and process tenant AI request."""
        # Set tenant context
        await set_tenant_context(tenant_id)

        try:
            # Validate access and quotas
            isolation = await self.get_tenant_ai_context(tenant_id)
            if not isolation:
                raise ValueError(f"No AI isolation config for tenant {tenant_id}")

            # Apply tenant-specific configurations
            tenant_request = self._apply_tenant_configurations(request_data, isolation)

            # Record usage
            await self.record_ai_usage(tenant_id, "ai_call")

            return tenant_request

        except Exception as e:
            logger.error(f"Tenant AI request isolation failed: {e}")
            raise
        finally:
            # Clear tenant context
            current_tenant.set(None)

    def _apply_tenant_configurations(self, request: Dict[str, Any], isolation: TenantAIIsolation) -> Dict[str, Any]:
        """Apply tenant-specific configurations to request."""
        tenant_request = request.copy()

        # Apply custom AI configs
        if isolation.custom_ai_configs:
            tenant_request.update(isolation.custom_ai_configs)

        # Ensure only allowed providers
        if 'model' in tenant_request:
            provider = self._extract_provider_from_model(tenant_request['model'])
            if provider not in isolation.allowed_providers:
                # Fallback to first allowed provider
                tenant_request['model'] = f"{isolation.allowed_providers[0]}-default"

        return tenant_request

    def _extract_provider_from_model(self, model: str) -> str:
        """Extract provider from model name."""
        if model.startswith('gpt'):
            return 'openai'
        elif model.startswith('claude'):
            return 'anthropic'
        else:
            return 'custom'

    async def get_tenant_ai_status(self, tenant_id: str) -> Dict[str, Any]:
        """Get comprehensive tenant AI status."""
        if tenant_id not in self.tenants:
            return {'status': 'not_found'}

        tenant = self.tenants[tenant_id]
        quota = self.quotas.get(tenant_id)
        isolation = self.isolation_configs.get(tenant_id)
        usage = await self.get_tenant_ai_usage(tenant_id, "24h")

        return {
            'tenant_id': tenant_id,
            'name': tenant.name,
            'status': tenant.status,
            'plan': tenant.plan,
            'quota': {
                'current_requests_day': quota.current_requests_day if quota else 0,
                'max_requests_per_day': quota.max_requests_per_day if quota else 0,
                'current_storage_gb': quota.current_storage_gb if quota else 0.0,
                'max_storage_gb': quota.max_storage_gb if quota else 0.0,
                'current_models': quota.current_models if quota else 0,
                'max_models': quota.max_models if quota else 0
            } if quota else None,
            'usage_24h': usage,
            'isolation': {
                'allowed_providers': isolation.allowed_providers if isolation else [],
                'storage_prefix': isolation.storage_prefix if isolation else '',
                'model_registry_prefix': isolation.model_registry_prefix if isolation else ''
            } if isolation else None,
            'last_updated': tenant.updated_at.isoformat()
        }


# Global multi-tenant AI service instance
multi_tenant_ai_service = MultiTenantAIService()


async def get_multi_tenant_ai_service() -> MultiTenantAIService:
    """Get the global multi-tenant AI service instance."""
    if not multi_tenant_ai_service.tenants:  # Check if initialized
        await multi_tenant_ai_service.initialize()
    return multi_tenant_ai_service


# Tenant context management for AI
async def set_tenant_context(tenant_id: str):
    """Set the current tenant context for AI operations."""
    current_tenant.set(tenant_id)


async def get_current_tenant() -> Optional[str]:
    """Get the current tenant from AI context."""
    return current_tenant.get()


async def require_tenant_context():
    """Require that a tenant context is set for AI operations."""
    tenant_id = current_tenant.get()
    if not tenant_id:
        raise ValueError("No tenant context set for AI operations")
    return tenant_id
