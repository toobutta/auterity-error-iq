"""Integration tests for SaaS functionality."""

from datetime import datetime, timedelta
from decimal import Decimal
from unittest.mock import Mock, patch
from uuid import uuid4

import pytest
from app.core.saas_config import saas_config
from app.models.tenant import SubscriptionPlan, Tenant, TenantStatus
from app.models.user import User
from app.services.billing_service import BillingService
from app.services.branding_service import BrandingService
from sqlalchemy.orm import Session


class TestBillingService:
    """Test cases for BillingService."""

    @pytest.fixture
    def mock_db(self):
        """Mock database session."""
        return Mock(spec=Session)

    @pytest.fixture
    def mock_tenant(self):
        """Mock tenant for testing."""
        tenant = Mock(spec=Tenant)
        tenant.id = uuid4()
        tenant.name = "Test Company"
        tenant.subscription_plan = SubscriptionPlan.STARTER
        tenant.status = TenantStatus.ACTIVE
        tenant.max_users = 5
        tenant.max_workflows = 100
        tenant.max_ai_requests_per_month = 10000
        tenant.current_month_ai_requests = 0
        tenant.monthly_budget = Decimal("99.00")
        tenant.users = []
        tenant.workflows = []
        return tenant

    @pytest.fixture
    def mock_user(self):
        """Mock user for testing."""
        user = Mock(spec=User)
        user.id = uuid4()
        user.email = "test@example.com"
        user.name = "Test User"
        user.tenant_id = uuid4()
        return user

    @pytest.fixture
    def billing_service(self, mock_db):
        """BillingService instance for testing."""
        return BillingService(mock_db)

    @pytest.mark.asyncio
    async def test_create_subscription_success(
        self, billing_service, mock_tenant, mock_db
    ):
        """Test successful subscription creation."""
        # Mock Stripe customer creation
        mock_customer = Mock()
        mock_customer.id = "cus_test123"

        # Mock Stripe subscription
        mock_subscription = Mock()
        mock_subscription.id = "sub_test123"
        mock_subscription.current_period_start = int(datetime.utcnow().timestamp())
        mock_subscription.current_period_end = int(
            (datetime.utcnow() + timedelta(days=30)).timestamp()
        )
        mock_subscription.trial_end = None

        # Mock payment intent
        mock_payment_intent = Mock()
        mock_payment_intent.client_secret = "pi_test_secret"

        mock_subscription.latest_invoice.payment_intent = mock_payment_intent

        with (
            patch("stripe.Customer.create", return_value=mock_customer),
            patch("stripe.Subscription.create", return_value=mock_subscription),
        ):
            # Mock database queries
            mock_db.query.return_value.filter.return_value.first.return_value = (
                mock_tenant
            )

            result_tenant, client_secret = await billing_service.create_subscription(
                tenant_id=mock_tenant.id,
                plan=SubscriptionPlan.PROFESSIONAL,
                payment_method_id="pm_test123",
                trial_days=0,
            )

            assert result_tenant == mock_tenant
            assert client_secret == "pi_test_secret"
            assert mock_tenant.subscription_plan == SubscriptionPlan.PROFESSIONAL
            assert mock_tenant.stripe_customer_id == "cus_test123"
            assert mock_tenant.stripe_subscription_id == "sub_test123"

    @pytest.mark.asyncio
    async def test_create_subscription_with_trial(
        self, billing_service, mock_tenant, mock_db
    ):
        """Test subscription creation with trial period."""
        # Mock Stripe customer creation
        mock_customer = Mock()
        mock_customer.id = "cus_test123"

        # Mock Stripe subscription with trial
        mock_subscription = Mock()
        mock_subscription.id = "sub_test123"
        mock_subscription.current_period_start = int(datetime.utcnow().timestamp())
        mock_subscription.current_period_end = int(
            (datetime.utcnow() + timedelta(days=30)).timestamp()
        )
        mock_subscription.trial_end = int(
            (datetime.utcnow() + timedelta(days=14)).timestamp()
        )

        # Mock payment intent
        mock_payment_intent = Mock()
        mock_payment_intent.client_secret = "pi_test_secret"

        mock_subscription.latest_invoice.payment_intent = mock_payment_intent

        with (
            patch("stripe.Customer.create", return_value=mock_customer),
            patch("stripe.Subscription.create", return_value=mock_subscription),
        ):
            # Mock database queries
            mock_db.query.return_value.filter.return_value.first.return_value = (
                mock_tenant
            )

            result_tenant, client_secret = await billing_service.create_subscription(
                tenant_id=mock_tenant.id,
                plan=SubscriptionPlan.STARTER,
                payment_method_id="pm_test123",
                trial_days=14,
            )

            assert result_tenant.status == "trial"
            assert result_tenant.trial_end is not None

    @pytest.mark.asyncio
    async def test_update_subscription_success(
        self, billing_service, mock_tenant, mock_db
    ):
        """Test successful subscription update."""
        # Mock existing Stripe subscription
        mock_subscription = Mock()
        mock_subscription.id = "sub_test123"
        mock_subscription["items"] = {"data": [Mock(id="si_test123")]}

        with (
            patch("stripe.Subscription.retrieve", return_value=mock_subscription),
            patch("stripe.Subscription.modify") as mock_modify,
        ):
            # Mock database queries
            mock_db.query.return_value.filter.return_value.first.return_value = (
                mock_tenant
            )

            result_tenant = await billing_service.update_subscription(
                tenant_id=mock_tenant.id, new_plan=SubscriptionPlan.ENTERPRISE
            )

            assert result_tenant.subscription_plan == SubscriptionPlan.ENTERPRISE
            mock_modify.assert_called_once()

    @pytest.mark.asyncio
    async def test_cancel_subscription_success(
        self, billing_service, mock_tenant, mock_db
    ):
        """Test successful subscription cancellation."""
        with patch("stripe.Subscription.modify") as mock_modify:
            # Mock database queries
            mock_db.query.return_value.filter.return_value.first.return_value = (
                mock_tenant
            )

            result_tenant = await billing_service.cancel_subscription(
                tenant_id=mock_tenant.id
            )

            assert result_tenant.status == "suspended"
            mock_modify.assert_called_once_with(
                mock_tenant.stripe_subscription_id, cancel_at_period_end=True
            )

    @pytest.mark.asyncio
    async def test_track_usage_success(self, billing_service, mock_tenant, mock_db):
        """Test successful usage tracking."""
        # Mock database queries
        mock_db.query.return_value.filter.return_value.first.return_value = mock_tenant

        usage_log = await billing_service.track_usage(
            tenant_id=mock_tenant.id,
            resource_type="ai_request",
            quantity=1,
            cost=Decimal("0.002"),
            user_id=uuid4(),
        )

        assert usage_log.resource_type == "ai_request"
        assert usage_log.quantity == 1
        assert usage_log.cost == Decimal("0.002")
        assert mock_tenant.current_month_ai_requests == 1

    @pytest.mark.asyncio
    async def test_get_usage_summary(self, billing_service, mock_tenant, mock_db):
        """Test usage summary retrieval."""
        # Mock usage logs
        mock_usage_logs = [
            Mock(resource_type="ai_request", quantity=10, cost=Decimal("0.02")),
            Mock(resource_type="workflow_execution", quantity=5, cost=Decimal("0.25")),
        ]

        # Mock database queries
        mock_db.query.return_value.filter.return_value.all.return_value = (
            mock_usage_logs
        )

        summary = await billing_service.get_usage_summary(tenant_id=mock_tenant.id)

        assert summary["total_cost"] == Decimal("0.27")
        assert summary["total_ai_requests"] == 10
        assert summary["total_workflow_executions"] == 5
        assert "ai_request" in summary["resource_breakdown"]
        assert "workflow_execution" in summary["resource_breakdown"]

    @pytest.mark.asyncio
    async def test_handle_stripe_webhook_payment_succeeded(
        self, billing_service, mock_db
    ):
        """Test Stripe webhook handling for successful payment."""
        # Mock webhook event data
        event_data = {
            "type": "invoice.payment_succeeded",
            "data": {
                "object": {
                    "id": "in_test123",
                    "customer": "cus_test123",
                    "amount_paid": 29900,  # $299.00 in cents
                    "period_start": int(datetime.utcnow().timestamp()),
                    "period_end": int(
                        (datetime.utcnow() + timedelta(days=30)).timestamp()
                    ),
                }
            },
        }

        # Mock tenant lookup
        mock_tenant = Mock()
        mock_tenant.id = uuid4()
        mock_tenant.subscription_plan = "professional"

        mock_db.query.return_value.filter.return_value.first.return_value = mock_tenant

        success = await billing_service.handle_stripe_webhook(event_data)

        assert success is True
        assert mock_tenant.status == "active"
        mock_db.commit.assert_called()


class TestBrandingService:
    """Test cases for BrandingService."""

    @pytest.fixture
    def mock_db(self):
        """Mock database session."""
        return Mock(spec=Session)

    @pytest.fixture
    def mock_tenant(self):
        """Mock tenant for testing."""
        tenant = Mock(spec=Tenant)
        tenant.id = uuid4()
        tenant.name = "Test Company"
        tenant.primary_color = "#3B82F6"
        tenant.secondary_color = "#10B981"
        tenant.logo_url = "/static/default-logo.png"
        tenant.company_name = "Test Company"
        tenant.custom_css = None
        tenant.remove_auterity_branding = False
        tenant.custom_domain = None
        tenant.industry_profile = "automotive"
        return tenant

    @pytest.fixture
    def branding_service(self, mock_db):
        """BrandingService instance for testing."""
        return BrandingService(mock_db)

    @pytest.mark.asyncio
    async def test_get_tenant_theme(self, branding_service, mock_tenant, mock_db):
        """Test tenant theme retrieval."""
        # Mock database queries
        mock_db.query.return_value.filter.return_value.first.return_value = mock_tenant

        theme = await branding_service.get_tenant_theme(mock_tenant.id)

        assert theme["primary_color"] == "#3B82F6"
        assert theme["secondary_color"] == "#10B981"
        assert theme["logo_url"] == "/static/default-logo.png"
        assert theme["company_name"] == "Test Company"
        assert theme["industry_profile"] == "automotive"
        assert "accent_color" in theme  # From industry theme

    @pytest.mark.asyncio
    async def test_update_tenant_branding(self, branding_service, mock_tenant, mock_db):
        """Test tenant branding update."""
        # Mock database queries
        mock_db.query.return_value.filter.return_value.first.return_value = mock_tenant

        branding_data = {
            "primary_color": "#FF0000",
            "company_name": "Updated Company",
            "remove_auterity_branding": True,
        }

        result_tenant = await branding_service.update_tenant_branding(
            tenant_id=mock_tenant.id, branding_data=branding_data
        )

        assert result_tenant.primary_color == "#FF0000"
        assert result_tenant.company_name == "Updated Company"
        assert result_tenant.remove_auterity_branding is True
        mock_db.commit.assert_called()

    @pytest.mark.asyncio
    async def test_generate_custom_css(self, branding_service, mock_tenant, mock_db):
        """Test custom CSS generation."""
        # Mock database queries
        mock_db.query.return_value.filter.return_value.first.return_value = mock_tenant

        css = await branding_service.generate_custom_css(mock_tenant.id)

        assert ":root {" in css
        assert "--primary-color: #3B82F6" in css
        assert "--secondary-color: #10B981" in css
        assert ".automotive-header" in css  # Industry-specific CSS

    @pytest.mark.asyncio
    async def test_validate_color_valid_hex(self, branding_service):
        """Test color validation with valid hex colors."""
        valid_colors = ["#FF0000", "#00FF00", "#0000FF", "#FFF", "#000"]

        for color in valid_colors:
            validated = branding_service._validate_color(color)
            assert validated == color.upper()

    @pytest.mark.asyncio
    async def test_validate_color_invalid_hex(self, branding_service):
        """Test color validation with invalid hex colors."""
        invalid_colors = ["#GG0000", "red", "invalid", "#12345"]

        for color in invalid_colors:
            validated = branding_service._validate_color(color)
            assert validated == branding_service.default_colors["primary"]

    @pytest.mark.asyncio
    async def test_validate_logo_url_valid(self, branding_service):
        """Test logo URL validation with valid URLs."""
        valid_urls = [
            "https://example.com/logo.png",
            "http://example.com/logo.jpg",
            "/static/logo.svg",
            "/media/logo.gif",
        ]

        for url in valid_urls:
            validated = branding_service._validate_logo_url(url)
            assert validated == url

    @pytest.mark.asyncio
    async def test_validate_logo_url_invalid(self, branding_service):
        """Test logo URL validation with invalid URLs."""
        invalid_urls = ["invalid", "ftp://example.com/logo.png"]

        for url in invalid_urls:
            validated = branding_service._validate_logo_url(url)
            assert validated == "/static/default-logo.png"

    @pytest.mark.asyncio
    async def test_get_industry_theme(self, branding_service):
        """Test industry-specific theme retrieval."""
        automotive_theme = branding_service._get_industry_theme("automotive")
        healthcare_theme = branding_service._get_industry_theme("healthcare")

        assert automotive_theme["primary_color"] == "#1F2937"
        assert automotive_theme["secondary_color"] == "#DC2626"
        assert healthcare_theme["primary_color"] == "#059669"
        assert healthcare_theme["secondary_color"] == "#3B82F6"

    @pytest.mark.asyncio
    async def test_get_industry_css(self, branding_service):
        """Test industry-specific CSS retrieval."""
        automotive_css = branding_service._get_industry_css("automotive")
        healthcare_css = branding_service._get_industry_css("healthcare")

        assert ".automotive-header" in automotive_css
        assert ".automotive-button" in automotive_css
        assert ".healthcare-header" in healthcare_css
        assert ".healthcare-button" in healthcare_css

    @pytest.mark.asyncio
    async def test_validate_branding_compliance(
        self, branding_service, mock_tenant, mock_db
    ):
        """Test branding compliance validation."""
        # Mock database queries
        mock_db.query.return_value.filter.return_value.first.return_value = mock_tenant

        compliance_report = await branding_service.validate_branding_compliance(
            mock_tenant.id
        )

        assert "logo" in compliance_report
        assert "colors" in compliance_report
        assert "css" in compliance_report
        assert "domain" in compliance_report
        assert "overall_score" in compliance_report
        assert compliance_report["overall_score"] >= 0
        assert compliance_report["overall_score"] <= 100


class TestSaaSIntegration:
    """Integration tests for SaaS functionality."""

    @pytest.fixture
    def mock_db(self):
        """Mock database session."""
        return Mock(spec=Session)

    @pytest.fixture
    def mock_tenant(self):
        """Mock tenant for testing."""
        tenant = Mock(spec=Tenant)
        tenant.id = uuid4()
        tenant.name = "Test Company"
        tenant.subscription_plan = SubscriptionPlan.PROFESSIONAL
        tenant.status = TenantStatus.ACTIVE
        tenant.max_users = 25
        tenant.max_workflows = -1  # Unlimited
        tenant.max_ai_requests_per_month = 50000
        tenant.current_month_ai_requests = 1000
        tenant.monthly_budget = Decimal("299.00")
        tenant.primary_color = "#3B82F6"
        tenant.secondary_color = "#10B981"
        tenant.logo_url = "/static/logo.png"
        tenant.company_name = "Test Company"
        tenant.custom_css = None
        tenant.remove_auterity_branding = True
        tenant.custom_domain = "test.example.com"
        tenant.industry_profile = "automotive"
        return tenant

    @pytest.fixture
    def mock_user(self):
        """Mock user for testing."""
        user = Mock(spec=User)
        user.id = uuid4()
        user.email = "test@example.com"
        user.name = "Test User"
        user.tenant_id = uuid4()
        user.has_permission = Mock(return_value=True)
        return user

    @pytest.mark.asyncio
    async def test_tenant_subscription_validation(self, mock_tenant):
        """Test tenant subscription validation methods."""
        # Test subscription status
        assert mock_tenant.is_subscription_active() is True

        # Test user limits
        mock_tenant.users.count = Mock(return_value=10)
        assert mock_tenant.can_add_user() is True

        # Test workflow limits
        mock_tenant.workflows.count = Mock(return_value=50)
        assert mock_tenant.can_create_workflow() is True

        # Test AI request limits
        assert mock_tenant.can_make_ai_request() is True

    @pytest.mark.asyncio
    async def test_plan_features_retrieval(self, mock_tenant):
        """Test subscription plan features retrieval."""
        features = mock_tenant.get_plan_features()

        assert features["max_users"] == 25
        assert features["max_workflows"] == -1  # Unlimited
        assert features["max_ai_requests_per_month"] == 50000
        assert features["custom_branding"] is True
        assert features["sso_support"] is True
        assert features["white_label"] is False

    @pytest.mark.asyncio
    async def test_saas_config_plan_management(self):
        """Test SaaS configuration plan management."""
        # Test plan features
        starter_features = saas_config.get_plan_features("starter")
        assert starter_features["max_users"] == 5
        assert starter_features["max_workflows"] == 100

        # Test plan pricing
        starter_price = saas_config.get_plan_price("starter")
        assert starter_price == Decimal("99.00")

        # Test plan validation
        assert saas_config.validate_plan_upgrade("starter", "professional") is True
        assert saas_config.validate_plan_upgrade("enterprise", "starter") is False

        # Test available plans
        available_plans = saas_config.get_available_plans_for_tenant("professional")
        assert "professional" in available_plans
        assert "enterprise" in available_plans
        assert "starter" not in available_plans

    @pytest.mark.asyncio
    async def test_saas_config_pricing_calculations(self):
        """Test SaaS configuration pricing calculations."""
        # Test AI request pricing
        gpt4_cost = saas_config.get_ai_request_cost("gpt-4", 1000)
        assert gpt4_cost == Decimal("0.03")

        # Test workflow execution pricing
        basic_cost = saas_config.get_workflow_execution_cost("basic")
        assert basic_cost == Decimal("0.01")

        # Test storage pricing
        storage_cost = saas_config.get_storage_cost(100.0)  # 100 GB
        assert storage_cost == Decimal("10.00")

    @pytest.mark.asyncio
    async def test_saas_config_compliance_requirements(self):
        """Test SaaS configuration compliance requirements."""
        # Test starter plan compliance
        starter_compliance = saas_config.get_compliance_requirements("starter")
        assert starter_compliance["gdpr"] == saas_config.GDPR_COMPLIANCE_ENABLED
        assert starter_compliance["soc2"] == saas_config.SOC2_COMPLIANCE_ENABLED

        # Test enterprise plan compliance
        enterprise_compliance = saas_config.get_compliance_requirements("enterprise")
        assert enterprise_compliance["iso27001"] is True
        assert enterprise_compliance["pci_dss"] is True
        assert enterprise_compliance["fedramp"] is False

    @pytest.mark.asyncio
    async def test_end_to_end_subscription_flow(self, mock_db, mock_tenant, mock_user):
        """Test end-to-end subscription flow."""
        # Initialize services
        billing_service = BillingService(mock_db)
        branding_service = BrandingService(mock_db)

        # Mock Stripe operations
        with (
            patch("stripe.Customer.create") as mock_customer_create,
            patch("stripe.Subscription.create") as mock_subscription_create,
        ):
            # Mock Stripe responses
            mock_customer = Mock()
            mock_customer.id = "cus_test123"
            mock_customer_create.return_value = mock_customer

            mock_subscription = Mock()
            mock_subscription.id = "sub_test123"
            mock_subscription.current_period_start = int(datetime.utcnow().timestamp())
            mock_subscription.current_period_end = int(
                (datetime.utcnow() + timedelta(days=30)).timestamp()
            )
            mock_subscription.trial_end = None

            mock_payment_intent = Mock()
            mock_payment_intent.client_secret = "pi_test_secret"
            mock_subscription.latest_invoice.payment_intent = mock_payment_intent

            mock_subscription_create.return_value = mock_subscription

            # Mock database queries
            mock_db.query.return_value.filter.return_value.first.return_value = (
                mock_tenant
            )

            # 1. Create subscription
            tenant, client_secret = await billing_service.create_subscription(
                tenant_id=mock_tenant.id,
                plan=SubscriptionPlan.PROFESSIONAL,
                payment_method_id="pm_test123",
                trial_days=0,
            )

            assert tenant.subscription_plan == SubscriptionPlan.PROFESSIONAL
            assert tenant.stripe_customer_id == "cus_test123"
            assert client_secret == "pi_test_secret"

            # 2. Update branding
            branding_data = {
                "primary_color": "#FF0000",
                "company_name": "Updated Company",
                "remove_auterity_branding": True,
            }

            updated_tenant = await branding_service.update_tenant_branding(
                tenant_id=mock_tenant.id, branding_data=branding_data
            )

            assert updated_tenant.primary_color == "#FF0000"
            assert updated_tenant.company_name == "Updated Company"
            assert updated_tenant.remove_auterity_branding is True

            # 3. Track usage
            usage_log = await billing_service.track_usage(
                tenant_id=mock_tenant.id,
                resource_type="ai_request",
                quantity=1,
                cost=Decimal("0.002"),
            )

            assert usage_log.resource_type == "ai_request"
            assert usage_log.quantity == 1
            assert usage_log.cost == Decimal("0.002")

            # 4. Get billing info
            billing_info = await billing_service.get_tenant_billing_info(mock_tenant.id)

            assert billing_info["tenant"]["subscription_plan"] == "professional"
            assert billing_info["tenant"]["status"] == "active"
            assert "usage" in billing_info
            assert "billing" in billing_info


# Test configuration
pytest_plugins = ["pytest_asyncio"]


def pytest_configure(config):
    """Configure pytest for async testing."""
    config.addinivalue_line("markers", "asyncio: mark test as async")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
