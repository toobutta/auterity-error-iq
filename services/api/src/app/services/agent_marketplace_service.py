"""White-Label AI Agent Marketplace Service.

Templates, revenue sharing, and custom agent training.
"""

import asyncio
import logging
import uuid
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from decimal import Decimal
from enum import Enum
from typing import Any, Dict, List, Optional
from uuid import UUID

from sqlalchemy import and_

from app.core.saas_config import SaaSConfig
from app.models.tenant import UsageLog

logger = logging.getLogger(__name__)


class AgentCategory(str, Enum):
    """AI agent categories."""

    CUSTOMER_SERVICE = "customer_service"
    SALES = "sales"
    MARKETING = "marketing"
    SUPPORT = "support"
    HR = "hr"
    FINANCE = "finance"
    LEGAL = "legal"
    OPERATIONS = "operations"
    ANALYTICS = "analytics"
    CUSTOM = "custom"


class AgentTier(str, Enum):
    """Agent subscription tiers."""

    BASIC = "basic"
    PROFESSIONAL = "professional"
    ENTERPRISE = "enterprise"
    CUSTOM = "custom"


class MarketplaceStatus(str, Enum):
    """Marketplace item status."""

    DRAFT = "draft"
    REVIEW = "review"
    PUBLISHED = "published"
    SUSPENDED = "suspended"
    DEPRECATED = "deprecated"


@dataclass
class AgentTemplate:
    """AI agent template."""

    id: str
    name: str
    description: str
    category: AgentCategory
    version: str = "1.0"
    status: MarketplaceStatus = MarketplaceStatus.DRAFT

    # Technical specifications
    base_model: str = "gpt-3.5-turbo"
    capabilities: List[str] = field(default_factory=list)
    required_integrations: List[str] = field(default_factory=list)
    configuration_schema: Dict[str, Any] = field(default_factory=dict)

    # Business model
    pricing_tiers: Dict[str, Dict[str, Any]] = field(default_factory=dict)
    revenue_share_percentage: float = 0.0
    creator_id: Optional[UUID] = None

    # Usage statistics
    total_downloads: int = 0
    total_deployments: int = 0
    average_rating: float = 0.0
    total_reviews: int = 0

    # Metadata
    tags: List[str] = field(default_factory=list)
    industries: List[str] = field(default_factory=list)
    created_at: datetime = field(default_factory=datetime.utcnow)
    updated_at: datetime = field(default_factory=datetime.utcnow)


@dataclass
class DeployedAgent:
    """Deployed AI agent instance."""

    id: str
    template_id: str
    tenant_id: UUID
    name: str
    configuration: Dict[str, Any] = field(default_factory=dict)
    status: str = "active"  # active, inactive, error, maintenance

    # Usage tracking
    total_requests: int = 0
    successful_requests: int = 0
    last_used: Optional[datetime] = None
    total_cost: Decimal = Decimal("0.00")

    # Performance metrics
    avg_response_time: float = 0.0
    success_rate: float = 0.0
    user_satisfaction_score: float = 0.0

    # Deployment info
    deployed_at: datetime = field(default_factory=datetime.utcnow)
    deployed_by: Optional[UUID] = None
    version: str = "1.0"
    updated_at: datetime = field(default_factory=datetime.utcnow)


@dataclass
class RevenueShare:
    """Revenue sharing record for agent marketplace."""

    id: str
    agent_id: str
    tenant_id: UUID
    template_id: str
    period_start: datetime
    period_end: datetime
    revenue_amount: Decimal
    share_percentage: float
    creator_revenue: Decimal
    platform_revenue: Decimal
    status: str = "pending"  # pending, paid, failed
    created_at: datetime = field(default_factory=datetime.utcnow)


@dataclass
class AgentReview:
    """User review for an agent template."""

    id: str
    template_id: str
    user_id: UUID
    tenant_id: UUID
    rating: int  # 1-5
    review_text: Optional[str] = None
    pros: List[str] = field(default_factory=list)
    cons: List[str] = field(default_factory=list)
    use_case: Optional[str] = None
    created_at: datetime = field(default_factory=datetime.utcnow)


@dataclass
class CustomTrainingJob:
    """Custom agent training job."""

    id: str
    tenant_id: UUID
    agent_id: str
    status: str = "pending"  # pending, training, completed, failed
    training_data: Dict[str, Any] = field(default_factory=dict)
    configuration: Dict[str, Any] = field(default_factory=dict)
    progress: float = 0.0
    estimated_completion: Optional[datetime] = None
    created_at: datetime = field(default_factory=datetime.utcnow)
    completed_at: Optional[datetime] = None


class AgentMarketplaceService:
    """White-Label AI Agent Marketplace Service.

    Templates, revenue sharing, and custom agent training.
    """

    def __init__(self, db_session):
        self.db = db_session
        # SaaSConfig uses Pydantic settings and reads from environment
        self.config = SaaSConfig()  # type: ignore

        # Marketplace storage
        self.templates: Dict[str, AgentTemplate] = {}
        self.deployed_agents: Dict[str, DeployedAgent] = {}
        self.reviews: Dict[str, AgentReview] = {}
        self.training_jobs: Dict[str, CustomTrainingJob] = {}

        # Revenue sharing
        self.revenue_shares: Dict[str, RevenueShare] = {}

        # Initialize default templates
        self._initialize_default_templates()

    def _initialize_default_templates(self):
        """Initialize default agent templates."""
        default_templates = [
            {
                "id": "customer_service_basic",
                "name": "Basic Customer Service Agent",
                "description": (
                    "Handles common customer inquiries "
                    "with predefined responses"
                ),
                "category": AgentCategory.CUSTOMER_SERVICE,
                "capabilities": [
                    "faq_responses",
                    "basic_routing",
                    "sentiment_analysis",
                ],
                "base_model": "gpt-3.5-turbo",
                "pricing_tiers": {
                    "basic": {"price": 99.00, "max_requests": 10000},
                    "professional": {"price": 299.00, "max_requests": 50000},
                    "enterprise": {"price": 999.00, "max_requests": -1},
                },
                "revenue_share_percentage": 0.15,
                "tags": ["customer-service", "basic", "faq"],
                "industries": ["retail", "ecommerce", "services"],
            },
            {
                "id": "sales_lead_qualifier",
                "name": "Sales Lead Qualifier",
                "description": (
                    "Qualifies leads and gathers prospect information"
                ),
                "category": AgentCategory.SALES,
                "capabilities": [
                    "lead_scoring",
                    "data_collection",
                    "followup_scheduling",
                ],
                "base_model": "gpt-4",
                "pricing_tiers": {
                    "basic": {"price": 199.00, "max_requests": 5000},
                    "professional": {"price": 499.00, "max_requests": 20000},
                    "enterprise": {"price": 1299.00, "max_requests": -1},
                },
                "revenue_share_percentage": 0.20,
                "tags": ["sales", "lead-generation", "qualification"],
                "industries": ["b2b", "saas", "consulting"],
            },
            {
                "id": "hr_policy_assistant",
                "name": "HR Policy Assistant",
                "description": (
                    "Provides instant answers to employee policy questions"
                ),
                "category": AgentCategory.HR,
                "capabilities": [
                    "policy_lookup",
                    "compliance_checking",
                    "document_search",
                ],
                "base_model": "gpt-4",
                "pricing_tiers": {
                    "basic": {"price": 149.00, "max_requests": 7500},
                    "professional": {"price": 399.00, "max_requests": 30000},
                    "enterprise": {"price": 1099.00, "max_requests": -1},
                },
                "revenue_share_percentage": 0.18,
                "tags": ["hr", "policy", "compliance"],
                "industries": ["technology", "finance", "healthcare"],
            },
            {
                "id": "marketing_content_creator",
                "name": "Marketing Content Creator",
                "description": (
                    "Generates marketing content and social media posts"
                ),
                "category": AgentCategory.MARKETING,
                "capabilities": [
                    "content_generation",
                    "social_media",
                    "brand_voice",
                ],
                "base_model": "gpt-4",
                "pricing_tiers": {
                    "basic": {"price": 179.00, "max_requests": 6000},
                    "professional": {"price": 449.00, "max_requests": 25000},
                    "enterprise": {"price": 1199.00, "max_requests": -1},
                },
                "revenue_share_percentage": 0.22,
                "tags": ["marketing", "content", "social-media"],
                "industries": ["marketing", "advertising", "media"],
            },
        ]

        for template_data in default_templates:
            template = AgentTemplate(**template_data)
            self.templates[template.id] = template

    async def get_marketplace_templates(
        self,
        category: Optional[AgentCategory] = None,
        search_query: Optional[str] = None,
        sort_by: str = "downloads",
        limit: int = 20,
    ) -> List[AgentTemplate]:
        """Get marketplace templates with filtering and sorting."""
        try:
            templates = list(self.templates.values())

            # Filter by category
            if category:
                templates = [t for t in templates if t.category == category]

            # Filter by search query
            if search_query:
                search_lower = search_query.lower()
                templates = [
                    t
                    for t in templates
                    if search_lower in t.name.lower()
                    or search_lower in t.description.lower()
                    or any(search_lower in tag.lower() for tag in t.tags)
                ]

            # Sort
            sort_functions = {
                "downloads": lambda x: x.total_downloads,
                "rating": lambda x: x.average_rating,
                "newest": lambda x: x.created_at,
                "price": lambda x: min(
                    tier.get("price", 0) for tier in x.pricing_tiers.values()
                ),
            }

            sort_func = sort_functions.get(
                sort_by, sort_functions["downloads"]
            )
            templates.sort(key=sort_func, reverse=(sort_by != "newest"))

            return templates[:limit]

        except Exception as e:
            logger.error(f"Marketplace template retrieval failed: {str(e)}")
            return []

    async def deploy_agent(
        self,
        tenant_id: UUID,
        template_id: str,
        agent_name: str,
        configuration: Dict[str, Any],
        deployed_by: Optional[UUID] = None,
    ) -> DeployedAgent:
        """Deploy an agent from a marketplace template."""
        try:
            if template_id not in self.templates:
                raise ValueError(f"Template {template_id} not found")

            template = self.templates[template_id]

            # Generate unique agent ID
            agent_id = f"agent_{uuid.uuid4().hex}"

            # Validate configuration against template schema
            await self._validate_agent_configuration(template, configuration)

            deployed_agent = DeployedAgent(
                id=agent_id,
                template_id=template_id,
                tenant_id=tenant_id,
                name=agent_name,
                configuration=configuration,
                deployed_by=deployed_by,
                version=template.version,
            )

            self.deployed_agents[agent_id] = deployed_agent

            # Update template statistics
            template.total_deployments += 1

            logger.info(
                f"Deployed agent: {agent_id} from template: {template_id}"
            )
            return deployed_agent

        except Exception as e:
            logger.error(f"Agent deployment failed: {str(e)}")
            raise

    async def _validate_agent_configuration(
        self, template: AgentTemplate, configuration: Dict[str, Any]
    ) -> bool:
        """Validate agent configuration against template schema."""
        if not template.configuration_schema:
            return True  # No schema to validate against

        # Basic validation - check required fields
        schema = template.configuration_schema
        required_fields = schema.get("required", [])

        for field_item in required_fields:
            if field_item not in configuration:
                raise ValueError(
                    f"Required configuration field_item missing: {field_item}"
                )

        # Validate field_item types and constraints
        for field_name, constraints in schema.get("properties", {}).items():
            if field_name in configuration:
                value = configuration[field_name]
                field_type = constraints.get("type")

                if field_type == "string" and not isinstance(value, str):
                    raise ValueError(f"Field {field} must be a string")
                elif field_type == "number" and not isinstance(
                    value, (int, float)
                ):
                    raise ValueError(f"Field {field} must be a number")
                elif field_type == "array" and not isinstance(value, list):
                    raise ValueError(f"Field {field} must be an array")

        return True

    async def customize_agent(
        self, agent_id: str, customizations: Dict[str, Any], tenant_id: UUID
    ) -> DeployedAgent:
        """Customize a deployed agent."""
        try:
            if agent_id not in self.deployed_agents:
                raise ValueError(f"Agent {agent_id} not found")

            agent = self.deployed_agents[agent_id]

            if agent.tenant_id != tenant_id:
                raise ValueError(
                    "Agent does not belong to the specified tenant"
                )

            # Update configuration
            agent.configuration.update(customizations)
            agent.updated_at = datetime.utcnow()

            logger.info(f"Customized agent: {agent_id}")
            return agent

        except Exception as e:
            logger.error(f"Agent customization failed: {str(e)}")
            raise

    async def start_custom_training(
        self,
        tenant_id: UUID,
        agent_id: str,
        training_data: Dict[str, Any],
        configuration: Dict[str, Any],
    ) -> CustomTrainingJob:
        """Start custom training for an agent."""
        try:
            if agent_id not in self.deployed_agents:
                raise ValueError(f"Agent {agent_id} not found")

            agent = self.deployed_agents[agent_id]

            if agent.tenant_id != tenant_id:
                raise ValueError(
                    "Agent does not belong to the specified tenant"
                )

            job_id = f"training_{uuid.uuid4().hex}"

            training_job = CustomTrainingJob(
                id=job_id,
                tenant_id=tenant_id,
                agent_id=agent_id,
                training_data=training_data,
                configuration=configuration,
                estimated_completion=datetime.utcnow()
                + timedelta(hours=4),  # Estimate 4 hours
            )

            self.training_jobs[job_id] = training_job

            # Simulate training start (in real implementation,
            # this would queue the job)
            asyncio.create_task(self._simulate_training_job(job_id))

            logger.info(f"Started custom training job: {job_id}")
            return training_job

        except Exception as e:
            logger.error(f"Custom training start failed: {str(e)}")
            raise

    async def _simulate_training_job(self, job_id: str):
        """Simulate training job execution."""
        try:
            if job_id not in self.training_jobs:
                return

            job = self.training_jobs[job_id]

            # Simulate training progress
            job.status = "training"

            for progress in range(0, 101, 10):
                await asyncio.sleep(0.5)  # Simulate training time
                job.progress = progress

            job.status = "completed"
            job.completed_at = datetime.utcnow()

            logger.info(f"Training job completed: {job_id}")

        except Exception as e:
            logger.error(f"Training job simulation failed: {str(e)}")
            if job_id in self.training_jobs:
                self.training_jobs[job_id].status = "failed"

    async def get_agent_analytics(
        self, agent_id: str, tenant_id: UUID, days: int = 30
    ) -> Dict[str, Any]:
        """Get analytics for a specific deployed agent."""
        try:
            if agent_id not in self.deployed_agents:
                return {"error": "Agent not found"}

            agent = self.deployed_agents[agent_id]

            if agent.tenant_id != tenant_id:
                return {
                    "error": "Agent does not belong to the specified tenant"
                }

            period_start = datetime.utcnow() - timedelta(days=days)

            # Get usage logs for this agent
            usage_logs = (
                self.db.query(UsageLog)
                .filter(
                    and_(
                        UsageLog.tenant_id == tenant_id,
                        UsageLog.created_at >= period_start,
                        UsageLog.metadata_json.contains(
                            {"agent_id": agent_id}
                        ),
                    )
                )
                .all()
            )

            # Calculate analytics
            total_requests = len(usage_logs)
            successful_requests = len(
                [log for log in usage_logs if log.status == "success"]
            )
            total_cost = sum(
                log.cost_amount or Decimal("0") for log in usage_logs
            )

            success_rate = (
                (successful_requests / total_requests * 100)
                if total_requests > 0
                else 0
            )
            avg_cost_per_request = (
                float(total_cost / total_requests) if total_requests > 0 else 0
            )

            # Calculate response times if available
            response_times = [
                log.execution_time_ms
                for log in usage_logs
                if log.execution_time_ms
            ]
            avg_response_time = (
                sum(response_times) / len(response_times)
                if response_times
                else 0
            )

            analytics = {
                "agent_id": agent_id,
                "agent_name": agent.name,
                "template_id": agent.template_id,
                "period_days": days,
                "usage": {
                    "total_requests": total_requests,
                    "successful_requests": successful_requests,
                    "success_rate": round(success_rate, 2),
                    "avg_response_time_ms": round(avg_response_time, 2),
                },
                "cost": {
                    "total_cost": float(total_cost),
                    "avg_cost_per_request": round(avg_cost_per_request, 4),
                },
                "performance": {
                    "status": agent.status,
                    "last_used": (
                        agent.last_used.isoformat()
                        if agent.last_used
                        else None
                    ),
                    "total_uptime": (
                        datetime.utcnow() - agent.deployed_at
                    ).days,
                },
            }

            return analytics

        except Exception as e:
            logger.error(f"Agent analytics retrieval failed: {str(e)}")
            return {"error": str(e)}

    async def submit_agent_review(
        self,
        template_id: str,
        user_id: UUID,
        tenant_id: UUID,
        rating: int,
        review_text: Optional[str] = None,
        pros: Optional[List[str]] = None,
        cons: Optional[List[str]] = None,
        use_case: Optional[str] = None,
    ) -> AgentReview:
        """Submit a review for an agent template."""
        try:
            if template_id not in self.templates:
                raise ValueError(f"Template {template_id} not found")

            if not 1 <= rating <= 5:
                raise ValueError("Rating must be between 1 and 5")

            review_id = f"review_{uuid.uuid4().hex}"

            review = AgentReview(
                id=review_id,
                template_id=template_id,
                user_id=user_id,
                tenant_id=tenant_id,
                rating=rating,
                review_text=review_text,
                pros=pros or [],
                cons=cons or [],
                use_case=use_case,
            )

            self.reviews[review_id] = review

            # Update template rating
            await self._update_template_rating(template_id)

            logger.info(
                f"Submitted review: {review_id} for template: {template_id}"
            )
            return review

        except Exception as e:
            logger.error(f"Review submission failed: {str(e)}")
            raise

    async def _update_template_rating(self, template_id: str):
        """Update template rating based on reviews."""
        try:
            if template_id not in self.templates:
                return

            template = self.templates[template_id]

            # Get all reviews for this template
            template_reviews = [
                r
                for r in self.reviews.values()
                if r.template_id == template_id
            ]

            if not template_reviews:
                return

            # Calculate average rating
            total_rating = sum(review.rating for review in template_reviews)
            average_rating = total_rating / len(template_reviews)

            template.average_rating = round(average_rating, 2)
            template.total_reviews = len(template_reviews)

        except Exception as e:
            logger.error(f"Template rating update failed: {str(e)}")

    async def get_template_reviews(
        self, template_id: str, limit: int = 10, sort_by: str = "newest"
    ) -> List[AgentReview]:
        """Get reviews for a template."""
        try:
            if template_id not in self.templates:
                return []

            reviews = [
                r
                for r in self.reviews.values()
                if r.template_id == template_id
            ]

            # Sort reviews
            if sort_by == "newest":
                reviews.sort(key=lambda x: x.created_at, reverse=True)
            elif sort_by == "rating":
                reviews.sort(key=lambda x: x.rating, reverse=True)
            elif sort_by == "oldest":
                reviews.sort(key=lambda x: x.created_at)

            return reviews[:limit]

        except Exception as e:
            logger.error(f"Review retrieval failed: {str(e)}")
            return []

    async def calculate_revenue_share(
        self, agent_id: str, period_start: datetime, period_end: datetime
    ) -> List[RevenueShare]:
        """Calculate revenue sharing for an agent."""
        try:
            if agent_id not in self.deployed_agents:
                return []

            agent = self.deployed_agents[agent_id]
            template = self.templates.get(agent.template_id)

            if not template:
                return []

            # Get usage data for the period
            usage_logs = (
                self.db.query(UsageLog)
                .filter(
                    and_(
                        UsageLog.tenant_id == agent.tenant_id,
                        UsageLog.created_at >= period_start,
                        UsageLog.created_at < period_end,
                        UsageLog.metadata_json.contains(
                            {"agent_id": agent_id}
                        ),
                    )
                )
                .all()
            )

            total_revenue = Decimal(str(sum(
                log.cost_amount or Decimal("0") for log in usage_logs
            )))

            if total_revenue > 0 and template.revenue_share_percentage > 0:
                creator_revenue = total_revenue * Decimal(
                    str(template.revenue_share_percentage)
                )
                platform_revenue = total_revenue - creator_revenue

                revenue_share = RevenueShare(
                    id=f"rs_{uuid.uuid4().hex}",
                    agent_id=agent_id,
                    tenant_id=agent.tenant_id,
                    template_id=agent.template_id,
                    period_start=period_start,
                    period_end=period_end,
                    revenue_amount=total_revenue,
                    share_percentage=template.revenue_share_percentage,
                    creator_revenue=creator_revenue,
                    platform_revenue=platform_revenue,
                )

                self.revenue_shares[revenue_share.id] = revenue_share
                return [revenue_share]

            return []

        except Exception as e:
            logger.error(f"Revenue share calculation failed: {str(e)}")
            return []

    async def get_marketplace_analytics(
        self, days: int = 30
    ) -> Dict[str, Any]:
        """Get marketplace-wide analytics."""
        try:
            _ = datetime.utcnow() - timedelta(days=days)

            analytics = {
                "period_days": days,
                "templates": {
                    "total": len(self.templates),
                    "published": len(
                        [
                            t
                            for t in self.templates.values()
                            if t.status == MarketplaceStatus.PUBLISHED
                        ]
                    ),
                    "categories": {},
                },
                "deployments": {
                    "total": len(self.deployed_agents),
                    "active": len(
                        [
                            a
                            for a in self.deployed_agents.values()
                            if a.status == "active"
                        ]
                    ),
                },
                "usage": {
                    "total_requests": sum(
                        a.total_requests for a in self.deployed_agents.values()
                    ),
                    "total_revenue": sum(
                        float(a.total_cost)
                        for a in self.deployed_agents.values()
                    ),
                },
                "reviews": {
                    "total_reviews": len(self.reviews),
                    "average_rating": 0.0,
                },
            }

            # Category breakdown
            for template in self.templates.values():
                category = template.category.value
                if category not in analytics["templates"]["categories"]:
                    analytics["templates"]["categories"][category] = {
                        "count": 0,
                        "downloads": 0,
                        "avg_rating": 0.0,
                    }

                analytics["templates"]["categories"][category]["count"] += 1
                analytics["templates"]["categories"][category][
                    "downloads"
                ] += template.total_downloads

                if template.average_rating > 0:
                    analytics["templates"]["categories"][category][
                        "avg_rating"
                    ] = template.average_rating

            # Overall average rating
            if analytics["reviews"]["total_reviews"] > 0:
                total_rating = sum(
                    review.rating for review in self.reviews.values()
                )
                analytics["reviews"]["average_rating"] = (
                    total_rating / analytics["reviews"]["total_reviews"]
                )

            return analytics

        except Exception as e:
            logger.error(f"Marketplace analytics retrieval failed: {str(e)}")
            return {"error": str(e)}

    async def create_custom_template(
        self, creator_id: UUID, template_data: Dict[str, Any]
    ) -> AgentTemplate:
        """Create a custom agent template."""
        try:
            template_id = f"custom_{uuid.uuid4().hex}"

            template = AgentTemplate(
                id=template_id, creator_id=creator_id, **template_data
            )

            self.templates[template_id] = template

            logger.info(f"Created custom template: {template_id}")
            return template

        except Exception as e:
            logger.error(f"Custom template creation failed: {str(e)}")
            raise

    async def get_tenant_agents(self, tenant_id: UUID) -> List[DeployedAgent]:
        """Get all agents deployed by a tenant."""
        try:
            return [
                agent
                for agent in self.deployed_agents.values()
                if agent.tenant_id == tenant_id
            ]

        except Exception as e:
            logger.error(f"Tenant agent retrieval failed: {str(e)}")
            return []

    async def health_check(self) -> Dict[str, Any]:
        """Perform health check on agent marketplace service."""
        try:
            health_status = {
                "status": "healthy",
                "templates_count": len(self.templates),
                "published_templates": len(
                    [
                        t
                        for t in self.templates.values()
                        if t.status == MarketplaceStatus.PUBLISHED
                    ]
                ),
                "deployed_agents_count": len(self.deployed_agents),
                "active_agents": len(
                    [
                        a
                        for a in self.deployed_agents.values()
                        if a.status == "active"
                    ]
                ),
                "reviews_count": len(self.reviews),
                "training_jobs_count": len(self.training_jobs),
                "revenue_shares_count": len(self.revenue_shares),
                "categories_supported": len(AgentCategory),
            }

            return health_status

        except Exception as e:
            return {"status": "unhealthy", "error": str(e)}
