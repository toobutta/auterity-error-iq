"""Partner Ecosystem & Integration Framework Service.

Provides API marketplace and partner integrations.
"""

import json
import logging
import uuid
from dataclasses import dataclass, field
from datetime import datetime
from decimal import Decimal
from enum import Enum
from typing import Any, Dict, List, Optional
from uuid import UUID

import aiohttp
import jwt
from cryptography.fernet import Fernet

logger = logging.getLogger(__name__)


class IntegrationType(str, Enum):
    """Types of partner integrations."""

    API = "api"
    WEBHOOK = "webhook"
    OAUTH = "oauth"
    EMBEDDED = "embedded"
    DATABASE = "database"
    FILE_SYSTEM = "file_system"


class PartnerStatus(str, Enum):
    """Partner status in the ecosystem."""

    ACTIVE = "active"
    INACTIVE = "inactive"
    SUSPENDED = "suspended"
    PENDING = "pending"


class IntegrationStatus(str, Enum):
    """Integration status."""

    ACTIVE = "active"
    INACTIVE = "inactive"
    ERROR = "error"
    MAINTENANCE = "maintenance"


class MarketplaceCategory(str, Enum):
    """API marketplace categories."""

    AI_MODELS = "ai_models"
    BUSINESS_TOOLS = "business_tools"
    COMMUNICATION = "communication"
    ANALYTICS = "analytics"
    STORAGE = "storage"
    PAYMENT = "payment"
    CRM = "crm"
    ERP = "erp"
    OTHER = "other"


@dataclass
class Partner:
    """Partner organization in the ecosystem."""

    id: str
    name: str
    description: str
    website: Optional[str] = None
    logo_url: Optional[str] = None
    status: PartnerStatus = PartnerStatus.PENDING
    created_at: datetime = field(default_factory=datetime.utcnow)
    updated_at: datetime = field(default_factory=datetime.utcnow)

    # Business information
    industry: Optional[str] = None
    company_size: Optional[str] = None
    headquarters: Optional[str] = None

    # Integration capabilities
    supported_integrations: List[IntegrationType] = field(default_factory=list)
    api_endpoints: List[str] = field(default_factory=list)

    # Financial
    revenue_share_percentage: float = 0.0
    monthly_fee: Decimal = Decimal("0.00")

    # Technical
    api_key: Optional[str] = None
    webhook_secret: Optional[str] = None

    # Metadata
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class Integration:
    """Integration between tenant and partner."""

    id: str
    tenant_id: UUID
    partner_id: str
    type: IntegrationType
    status: IntegrationStatus = IntegrationStatus.INACTIVE
    created_at: datetime = field(default_factory=datetime.utcnow)
    last_used: Optional[datetime] = None

    # Configuration
    config: Dict[str, Any] = field(default_factory=dict)
    credentials: Dict[str, Any] = field(default_factory=dict)  # Encrypted

    # Usage tracking
    total_requests: int = 0
    successful_requests: int = 0
    total_cost: Decimal = Decimal("0.00")
    monthly_quota: int = 1000
    current_month_usage: int = 0

    # Error handling
    error_count: int = 0
    last_error: Optional[str] = None
    last_error_at: Optional[datetime] = None


@dataclass
class MarketplaceListing:
    """API marketplace listing."""

    id: str
    partner_id: str
    name: str
    description: str
    category: MarketplaceCategory
    price_per_call: Decimal
    endpoint_url: str
    monthly_fee: Decimal = Decimal("0.00")
    free_tier_limit: int = 100

    # Technical specs
    documentation_url: Optional[str] = None
    api_specification: Dict[str, Any] = field(default_factory=dict)

    # Business
    popularity_score: float = 0.0
    total_subscribers: int = 0
    average_rating: float = 0.0

    # Status
    status: str = "active"
    tags: List[str] = field(default_factory=list)
    created_at: datetime = field(default_factory=datetime.utcnow)


@dataclass
class RevenueShare:
    """Revenue sharing record."""

    id: str
    partner_id: str
    tenant_id: UUID
    integration_id: str
    amount: Decimal
    share_percentage: float
    period_start: datetime
    period_end: datetime
    status: str = "pending"  # pending, paid, failed
    created_at: datetime = field(default_factory=datetime.utcnow)


@dataclass
class WebhookEvent:
    """Webhook event for partner integration."""

    id: str
    integration_id: str
    event_type: str
    payload: Dict[str, Any]
    status: str = "pending"  # pending, delivered, failed
    created_at: datetime = field(default_factory=datetime.utcnow)
    delivered_at: Optional[datetime] = None
    response_status: Optional[int] = None


class PartnerEcosystemService:
    """Partner Ecosystem & Integration Framework Service.

    Provides API marketplace and partner integrations.
    """

    def __init__(self, db_session):
        self.db = db_session
        # Skip SaaSConfig initialization to avoid parameter issues
        self.config = None

        # Partner and integration storage
        self.partners: Dict[str, Partner] = {}
        self.integrations: Dict[str, Integration] = {}
        self.marketplace_listings: Dict[str, MarketplaceListing] = {}

        # Encryption for sensitive data - generate a key if not available
        self.encryption_key = Fernet(Fernet.generate_key())

        # HTTP client for API calls
        self.http_client = None

        # Revenue sharing
        self.revenue_shares: Dict[str, RevenueShare] = {}

        # Webhook management
        self.webhook_events: Dict[str, WebhookEvent] = {}

        # Initialize default partners
        self._initialize_default_partners()

    def _initialize_default_partners(self):
        """Initialize default partner integrations."""
        default_partners = [
            {
                "id": "stripe",
                "name": "Stripe",
                "description": "Payment processing and billing",
                "website": "https://stripe.com",
                "category": "payment",
                "revenue_share_percentage": 0.029,  # 2.9% per transaction
                "supported_integrations": [
                    IntegrationType.API,
                    IntegrationType.WEBHOOK,
                ],
            },
            {
                "id": "slack",
                "name": "Slack",
                "description": "Team communication and collaboration",
                "website": "https://slack.com",
                "category": "communication",
                "revenue_share_percentage": 0.0,  # Free integration
                "supported_integrations": [
                    IntegrationType.OAUTH,
                    IntegrationType.WEBHOOK,
                ],
            },
            {
                "id": "google_workspace",
                "name": "Google Workspace",
                "description": "Productivity and collaboration tools",
                "website": "https://workspace.google.com",
                "category": "business_tools",
                "revenue_share_percentage": 0.0,
                "supported_integrations": [
                    IntegrationType.OAUTH,
                    IntegrationType.API,
                ],
            },
            {
                "id": "salesforce",
                "name": "Salesforce",
                "description": "CRM and sales automation",
                "website": "https://salesforce.com",
                "category": "crm",
                "revenue_share_percentage": 0.15,
                "supported_integrations": [
                    IntegrationType.API,
                    IntegrationType.WEBHOOK,
                ],
            },
            {
                "id": "hubspot",
                "name": "HubSpot",
                "description": "Marketing, sales, and service hub",
                "website": "https://hubspot.com",
                "category": "crm",
                "revenue_share_percentage": 0.1,
                "supported_integrations": [
                    IntegrationType.API,
                    IntegrationType.WEBHOOK,
                ],
            },
        ]

        for partner_data in default_partners:
            partner = Partner(**partner_data)
            self.partners[partner.id] = partner

    async def initialize(self):
        """Initialize the partner ecosystem service."""
        try:
            # Initialize HTTP client
            self.http_client = aiohttp.ClientSession(
                timeout=aiohttp.ClientTimeout(total=30)
            )

            logger.info("Partner ecosystem service initialized")
        except Exception as e:
            logger.error(f"Failed to initialize partner ecosystem: {str(e)}")
            raise

    async def register_partner(
        self, partner_data: Dict[str, Any], tenant_id: Optional[UUID] = None
    ) -> Partner:
        """Register a new partner in the ecosystem."""
        try:
            partner_id = partner_data.get(
                "id", f"partner_{uuid.uuid4().hex[:8]}"
            )

            # Generate API credentials
            api_key = f"pk_{uuid.uuid4().hex}"
            webhook_secret = f"wh_{uuid.uuid4().hex}"

            partner = Partner(
                id=partner_id,
                name=partner_data["name"],
                description=partner_data["description"],
                website=partner_data.get("website"),
                logo_url=partner_data.get("logo_url"),
                industry=partner_data.get("industry"),
                company_size=partner_data.get("company_size"),
                headquarters=partner_data.get("headquarters"),
                supported_integrations=partner_data.get(
                    "supported_integrations", []
                ),
                api_endpoints=partner_data.get("api_endpoints", []),
                revenue_share_percentage=partner_data.get(
                    "revenue_share_percentage", 0.0
                ),
                monthly_fee=Decimal(
                    str(partner_data.get("monthly_fee", 0.00))
                ),
                api_key=api_key,
                webhook_secret=webhook_secret,
                metadata=partner_data.get("metadata", {}),
            )

            self.partners[partner_id] = partner

            # Create marketplace listings if provided
            if "marketplace_listings" in partner_data:
                for listing_data in partner_data["marketplace_listings"]:
                    await self.create_marketplace_listing(
                        partner_id, listing_data
                    )

            logger.info(f"Registered partner: {partner_id}")
            return partner

        except Exception as e:
            logger.error(f"Partner registration failed: {str(e)}")
            raise

    async def create_integration(
        self,
        tenant_id: UUID,
        partner_id: str,
        integration_type: IntegrationType,
        config: Dict[str, Any],
    ) -> Integration:
        """Create a new integration between tenant and partner."""
        try:
            if partner_id not in self.partners:
                raise ValueError(f"Partner {partner_id} not found")

            integration_id = f"int_{uuid.uuid4().hex}"

            # Encrypt sensitive credentials
            credentials = config.get("credentials", {})
            if credentials:
                encrypted_credentials = self._encrypt_data(credentials)
            else:
                encrypted_credentials = {}

            integration = Integration(
                id=integration_id,
                tenant_id=tenant_id,
                partner_id=partner_id,
                type=integration_type,
                config=config,
                credentials=encrypted_credentials,
            )

            self.integrations[integration_id] = integration

            logger.info(
                f"Created integration: {integration_id} for tenant {tenant_id}"
            )
            return integration

        except Exception as e:
            logger.error(f"Integration creation failed: {str(e)}")
            raise

    async def execute_integration(
        self, integration_id: str, action: str, data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Execute an integration action."""
        try:
            if integration_id not in self.integrations:
                raise ValueError(f"Integration {integration_id} not found")

            integration = self.integrations[integration_id]

            if integration.status != IntegrationStatus.ACTIVE:
                raise ValueError(f"Integration {integration_id} is not active")

            # Check monthly quota
            if integration.current_month_usage >= integration.monthly_quota:
                raise ValueError(
                    f"Monthly quota exceeded for integration {integration_id}"
                )

            # Decrypt credentials
            credentials = (
                self._decrypt_data(integration.credentials)
                if integration.credentials
                else {}
            )

            # Execute based on integration type
            if integration.type == IntegrationType.API:
                result = await self._execute_api_integration(
                    integration, action, data, credentials
                )
            elif integration.type == IntegrationType.WEBHOOK:
                result = await self._execute_webhook_integration(
                    integration, action, data, credentials
                )
            else:
                raise ValueError(
                    f"Integration type {integration.type} not supported"
                )

            # Update usage statistics
            integration.total_requests += 1
            integration.current_month_usage += 1
            integration.last_used = datetime.utcnow()

            if result.get("success"):
                integration.successful_requests += 1
                # Calculate cost based on partner pricing
                cost = await self._calculate_integration_cost(
                    integration, result
                )
                integration.total_cost += cost
            else:
                integration.error_count += 1
                integration.last_error = result.get("error", "Unknown error")
                integration.last_error_at = datetime.utcnow()

            return result

        except Exception as e:
            logger.error(f"Integration execution failed: {str(e)}")
            # Update error statistics
            integration = self.integrations[integration_id]
            integration.error_count += 1
            integration.last_error = str(e)
            integration.last_error_at = datetime.utcnow()
            raise

    async def _execute_api_integration(
        self,
        integration: Integration,
        action: str,
        data: Dict[str, Any],
        credentials: Dict[str, Any],
    ) -> Dict[str, Any]:
        """Execute API-based integration."""
        try:
            partner = self.partners[integration.partner_id]

            # Find the appropriate endpoint
            endpoint_config = None
            for endpoint in partner.api_endpoints:
                if (
                    isinstance(endpoint, dict)
                    and endpoint.get("action") == action
                ):
                    endpoint_config = endpoint
                    break

            if not endpoint_config:
                raise ValueError(
                    f"Action {action} not supported by partner {partner.id}"
                )

            # Ensure endpoint_config is treated as a dict
            endpoint_dict = (
                endpoint_config if isinstance(endpoint_config, dict) else {}
            )
            url = endpoint_dict.get("url", "")
            method = endpoint_dict.get("method", "POST")
            headers = endpoint_dict.get("headers", {})

            # Add authentication
            if credentials:
                if "api_key" in credentials:
                    if endpoint_dict.get("auth_type") == "header":
                        headers[
                            "Authorization"
                        ] = f"Bearer {credentials['api_key']}"
                    elif endpoint_dict.get("auth_type") == "query":
                        url += f"?api_key={credentials['api_key']}"

            # Make the API call
            if self.http_client is None:
                raise ValueError("HTTP client not initialized")

            async with self.http_client.request(
                method=method,
                url=url,
                headers=headers,
                json=data if method in ["POST", "PUT", "PATCH"] else None,
                params=data if method == "GET" else None,
            ) as response:
                result = {
                    "success": response.status < 400,
                    "status_code": response.status,
                    "data": (
                        await response.json()
                        if response.headers.get("content-type", "").startswith(
                            "application/json"
                        )
                        else await response.text()
                    ),
                }

                return result

        except Exception as e:
            return {"success": False, "error": str(e)}

    async def _execute_webhook_integration(
        self,
        integration: Integration,
        action: str,
        data: Dict[str, Any],
        credentials: Dict[str, Any],
    ) -> Dict[str, Any]:
        """Execute webhook-based integration."""
        try:
            # Create webhook event
            event_id = f"evt_{uuid.uuid4().hex}"
            event = WebhookEvent(
                id=event_id,
                integration_id=integration.id,
                event_type=action,
                payload=data,
            )

            self.webhook_events[event_id] = event

            # In a real implementation, this would queue the webhook
            # for delivery
            # For now, we'll simulate immediate delivery

            webhook_url = integration.config.get("webhook_url")
            if not webhook_url:
                raise ValueError("Webhook URL not configured")

            # Prepare webhook payload
            payload = {
                "event_type": action,
                "timestamp": datetime.utcnow().isoformat(),
                "data": data,
                "integration_id": integration.id,
            }

            # Add signature if webhook secret is available
            if credentials.get("webhook_secret"):
                signature = self._generate_webhook_signature(
                    payload, credentials["webhook_secret"]
                )
                headers = {"X-Signature": signature}
            else:
                headers = {}

            # Send webhook (simulated)
            if self.http_client is None:
                raise ValueError("HTTP client not initialized")

            async with self.http_client.post(
                webhook_url, json=payload, headers=headers
            ) as response:
                event.status = (
                    "delivered" if response.status < 400 else "failed"
                )
                event.delivered_at = datetime.utcnow()
                event.response_status = response.status

                return {
                    "success": response.status < 400,
                    "status_code": response.status,
                    "event_id": event_id,
                }

        except Exception as e:
            return {"success": False, "error": str(e)}

    async def create_marketplace_listing(
        self, partner_id: str, listing_data: Dict[str, Any]
    ) -> MarketplaceListing:
        """Create a marketplace listing for a partner."""
        try:
            if partner_id not in self.partners:
                raise ValueError(f"Partner {partner_id} not found")

            listing_id = f"listing_{uuid.uuid4().hex}"

            listing = MarketplaceListing(
                id=listing_id,
                partner_id=partner_id,
                name=listing_data["name"],
                description=listing_data["description"],
                category=MarketplaceCategory(listing_data["category"]),
                price_per_call=Decimal(str(listing_data["price_per_call"])),
                monthly_fee=Decimal(
                    str(listing_data.get("monthly_fee", 0.00))
                ),
                free_tier_limit=listing_data.get("free_tier_limit", 100),
                endpoint_url=listing_data["endpoint_url"],
                documentation_url=listing_data.get("documentation_url"),
                api_specification=listing_data.get("api_specification", {}),
                tags=listing_data.get("tags", []),
            )

            self.marketplace_listings[listing_id] = listing

            logger.info(f"Created marketplace listing: {listing_id}")
            return listing

        except Exception as e:
            logger.error(f"Marketplace listing creation failed: {str(e)}")
            raise

    async def get_marketplace_listings(
        self,
        category: Optional[MarketplaceCategory] = None,
        search_query: Optional[str] = None,
        limit: int = 50,
    ) -> List[MarketplaceListing]:
        """Get marketplace listings with filtering."""
        try:
            listings = list(self.marketplace_listings.values())

            # Filter by category
            if category:
                listings = [
                    list_item
                    for list_item in listings
                    if list_item.category == category
                ]

            # Filter by search query
            if search_query:
                search_lower = search_query.lower()
                listings = [
                    list_item
                    for list_item in listings
                    if search_lower in list_item.name.lower()
                    or search_lower in list_item.description.lower()
                    or any(
                        search_lower in tag.lower() for tag in list_item.tags
                    )
                ]

            # Sort by popularity and limit
            listings.sort(key=lambda x: x.popularity_score, reverse=True)
            return listings[:limit]

        except Exception as e:
            logger.error(f"Marketplace listings retrieval failed: {str(e)}")
            return []

    async def subscribe_to_listing(
        self, tenant_id: UUID, listing_id: str, tier: str = "basic"
    ) -> Dict[str, Any]:
        """Subscribe tenant to a marketplace listing."""
        try:
            if listing_id not in self.marketplace_listings:
                raise ValueError(f"Listing {listing_id} not found")

            listing = self.marketplace_listings[listing_id]

            # Create integration for the listing
            integration_config = {
                "listing_id": listing_id,
                "tier": tier,
                "endpoint_url": listing.endpoint_url,
                "price_per_call": float(listing.price_per_call),
                "monthly_fee": float(listing.monthly_fee),
            }

            integration = await self.create_integration(
                tenant_id=tenant_id,
                partner_id=listing.partner_id,
                integration_type=IntegrationType.API,
                config=integration_config,
            )

            # Update listing popularity
            listing.total_subscribers += 1
            listing.popularity_score = min(
                100.0, listing.popularity_score + 1.0
            )

            return {
                "integration_id": integration.id,
                "listing": {
                    "id": listing.id,
                    "name": listing.name,
                    "category": listing.category.value,
                },
                "status": "subscribed",
            }

        except Exception as e:
            logger.error(f"Marketplace subscription failed: {str(e)}")
            raise

    async def get_integration_analytics(
        self, integration_id: str, days: int = 30
    ) -> Dict[str, Any]:
        """Get analytics for a specific integration."""
        try:
            if integration_id not in self.integrations:
                return {"error": "Integration not found"}

            integration = self.integrations[integration_id]

            analytics = {
                "integration_id": integration_id,
                "partner_id": integration.partner_id,
                "type": integration.type.value,
                "status": integration.status.value,
                "period_days": days,
                "usage": {
                    "total_requests": integration.total_requests,
                    "successful_requests": integration.successful_requests,
                    "success_rate": (
                        (
                            integration.successful_requests
                            / integration.total_requests
                            * 100
                        )
                        if integration.total_requests > 0
                        else 0
                    ),
                    "current_month_usage": integration.current_month_usage,
                    "monthly_quota": integration.monthly_quota,
                    "quota_utilization": (
                        (
                            integration.current_month_usage
                            / integration.monthly_quota
                            * 100
                        )
                        if integration.monthly_quota > 0
                        else 0
                    ),
                },
                "cost": {
                    "total_cost": float(integration.total_cost),
                    "avg_cost_per_request": (
                        float(
                            integration.total_cost / integration.total_requests
                        )
                        if integration.total_requests > 0
                        else 0
                    ),
                },
                "errors": {
                    "error_count": integration.error_count,
                    "last_error": integration.last_error,
                    "last_error_at": (
                        integration.last_error_at.isoformat()
                        if integration.last_error_at
                        else None
                    ),
                },
                "last_used": (
                    integration.last_used.isoformat()
                    if integration.last_used
                    else None
                ),
            }

            return analytics

        except Exception as e:
            logger.error(f"Integration analytics retrieval failed: {str(e)}")
            return {"error": str(e)}

    async def process_revenue_share(
        self,
        partner_id: str,
        tenant_id: UUID,
        integration_id: str,
        transaction_amount: Decimal,
        period_start: datetime,
        period_end: datetime,
    ) -> RevenueShare:
        """Process revenue sharing for a partner."""
        try:
            if partner_id not in self.partners:
                raise ValueError(f"Partner {partner_id} not found")

            partner = self.partners[partner_id]
            share_amount = transaction_amount * Decimal(
                str(partner.revenue_share_percentage)
            )

            revenue_share = RevenueShare(
                id=f"rs_{uuid.uuid4().hex}",
                partner_id=partner_id,
                tenant_id=tenant_id,
                integration_id=integration_id,
                amount=share_amount,
                share_percentage=partner.revenue_share_percentage,
                period_start=period_start,
                period_end=period_end,
            )

            self.revenue_shares[revenue_share.id] = revenue_share

            logger.info(
                f"Processed revenue share: ${share_amount} for "
                f"partner {partner_id}"
            )
            return revenue_share

        except Exception as e:
            logger.error(f"Revenue share processing failed: {str(e)}")
            raise

    def _encrypt_data(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Encrypt sensitive data."""
        json_data = json.dumps(data)
        encrypted_data = self.encryption_key.encrypt(json_data.encode())
        return {"encrypted": True, "data": encrypted_data.decode()}

    def _decrypt_data(self, encrypted_data: Dict[str, Any]) -> Dict[str, Any]:
        """Decrypt sensitive data."""
        if not encrypted_data.get("encrypted"):
            return encrypted_data

        decrypted_data = self.encryption_key.decrypt(
            encrypted_data["data"].encode()
        )
        return json.loads(decrypted_data.decode())

    def _generate_webhook_signature(
        self, payload: Dict[str, Any], secret: str
    ) -> str:
        """Generate webhook signature."""
        payload_str = json.dumps(payload, sort_keys=True)
        signature = jwt.encode(
            {"data": payload_str}, secret, algorithm="HS256"
        )
        return signature

    async def _calculate_integration_cost(
        self, integration: Integration, result: Dict[str, Any]
    ) -> Decimal:
        """Calculate cost for integration execution."""
        # This would implement partner-specific pricing logic
        # For now, return a simple cost based on the integration type
        base_costs = {
            IntegrationType.API: Decimal("0.01"),
            IntegrationType.WEBHOOK: Decimal("0.005"),
            IntegrationType.OAUTH: Decimal("0.02"),
        }

        return base_costs.get(integration.type, Decimal("0.01"))

    async def get_partner_analytics(
        self, partner_id: str, days: int = 30
    ) -> Dict[str, Any]:
        """Get analytics for a partner."""
        try:
            if partner_id not in self.partners:
                return {"error": "Partner not found"}

            partner = self.partners[partner_id]

            # Get all integrations for this partner
            partner_integrations = [
                integration
                for integration in self.integrations.values()
                if integration.partner_id == partner_id
            ]

            # Get marketplace listings for this partner
            partner_listings = [
                listing
                for listing in self.marketplace_listings.values()
                if listing.partner_id == partner_id
            ]

            # Calculate analytics
            total_integrations = len(partner_integrations)
            active_integrations = len(
                [
                    i
                    for i in partner_integrations
                    if i.status == IntegrationStatus.ACTIVE
                ]
            )
            total_requests = sum(
                i.total_requests for i in partner_integrations
            )
            total_revenue = sum(
                float(i.total_cost) for i in partner_integrations
            )

            # Revenue sharing analytics
            revenue_shares = [
                rs
                for rs in self.revenue_shares.values()
                if rs.partner_id == partner_id
            ]
            total_shared_revenue = sum(
                float(rs.amount) for rs in revenue_shares
            )

            analytics = {
                "partner_id": partner_id,
                "partner_name": partner.name,
                "period_days": days,
                "integrations": {
                    "total": total_integrations,
                    "active": active_integrations,
                    "activation_rate": (
                        (active_integrations / total_integrations * 100)
                        if total_integrations > 0
                        else 0
                    ),
                },
                "usage": {
                    "total_requests": total_requests,
                    "avg_requests_per_integration": (
                        total_requests / total_integrations
                        if total_integrations > 0
                        else 0
                    ),
                },
                "revenue": {
                    "total_revenue": total_revenue,
                    "shared_revenue": total_shared_revenue,
                    "revenue_share_percentage": (
                        partner.revenue_share_percentage
                    ),
                },
                "marketplace": {
                    "total_listings": len(partner_listings),
                    "total_subscribers": sum(
                        list_item.total_subscribers
                        for list_item in partner_listings
                    ),
                    "avg_rating": (
                        sum(
                            list_item.average_rating
                            for list_item in partner_listings
                        )
                        / len(partner_listings)
                        if partner_listings
                        else 0
                    ),
                },
            }

            return analytics

        except Exception as e:
            logger.error(f"Partner analytics retrieval failed: {str(e)}")
            return {"error": str(e)}

    async def health_check(self) -> Dict[str, Any]:
        """Perform health check on partner ecosystem service."""
        try:
            health_status = {
                "status": "healthy",
                "partners_registered": len(self.partners),
                "active_partners": len(
                    [
                        p
                        for p in self.partners.values()
                        if p.status == PartnerStatus.ACTIVE
                    ]
                ),
                "total_integrations": len(self.integrations),
                "active_integrations": len(
                    [
                        i
                        for i in self.integrations.values()
                        if i.status == IntegrationStatus.ACTIVE
                    ]
                ),
                "marketplace_listings": len(self.marketplace_listings),
                "pending_webhook_events": len(
                    [
                        e
                        for e in self.webhook_events.values()
                        if e.status == "pending"
                    ]
                ),
                "http_client_status": (
                    "connected" if self.http_client else "disconnected"
                ),
            }

            return health_status

        except Exception as e:
            return {"status": "unhealthy", "error": str(e)}
