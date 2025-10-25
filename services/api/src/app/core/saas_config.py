"""SaaS configuration settings - Pydantic v2 Compatible."""

from decimal import Decimal
from typing import Any, Dict, List

from pydantic import Field
from pydantic_settings import BaseSettings


class SaaSConfig(BaseSettings):
    """SaaS configuration settings."""

    model_config = {
        "env_prefix": "",
        "case_sensitive": True,
        "env_file": ".env",
        "env_file_encoding": "utf-8",
    }

    # Stripe Configuration
    STRIPE_SECRET_KEY: str = Field(
        default="", validation_alias="STRIPE_SECRET_KEY"
    )
    STRIPE_PUBLISHABLE_KEY: str = Field(
        default="", validation_alias="STRIPE_PUBLISHABLE_KEY"
    )
    STRIPE_WEBHOOK_SECRET: str = Field(
        default="", validation_alias="STRIPE_WEBHOOK_SECRET"
    )

    # Stripe Price IDs for different plans
    STRIPE_PRICE_ID_STARTER: str = Field(
        default="", validation_alias="STRIPE_PRICE_ID_STARTER"
    )
    STRIPE_PRICE_ID_PROFESSIONAL: str = Field(
        default="", validation_alias="STRIPE_PRICE_ID_PROFESSIONAL"
    )
    STRIPE_PRICE_ID_ENTERPRISE: str = Field(
        default="", validation_alias="STRIPE_PRICE_ID_ENTERPRISE"
    )
    STRIPE_PRICE_ID_WHITE_LABEL_STARTER: str = Field(
        default="", validation_alias="STRIPE_PRICE_ID_WHITE_LABEL_STARTER"
    )
    STRIPE_PRICE_ID_WHITE_LABEL_ENTERPRISE: str = Field(
        default="", validation_alias="STRIPE_PRICE_ID_WHITE_LABEL_ENTERPRISE"
    )

    # Subscription Plan Definitions
    @property
    def subscription_plans(self) -> Dict[str, Dict]:
        """Get subscription plan definitions."""
        return {
            "starter": {
                "name": "Starter",
                "price": Decimal("29.99"),
                "currency": "USD",
                "interval": "month",
                "features": [
                    "Up to 5 automations",
                    "Basic templates",
                    "Email support",
                    "Standard integrations",
                ],
                "limits": {
                    "automations": 5,
                    "executions_per_month": 1000,
                    "storage_gb": 1,
                    "users": 3,
                },
                "description": (
                    "Perfect for small teams getting started "
                    "with automation"
                ),
                "stripe_price_id": self.STRIPE_PRICE_ID_STARTER,
            },
            "professional": {
                "name": "Professional",
                "price": Decimal("99.99"),
                "currency": "USD",
                "interval": "month",
                "features": [
                    "Unlimited automations",
                    "Advanced templates",
                    "Priority support",
                    "All integrations",
                    "Custom workflows",
                    "Analytics dashboard",
                ],
                "limits": {
                    "automations": -1,  # unlimited
                    "executions_per_month": 10000,
                    "storage_gb": 10,
                    "users": 10,
                },
                "description": (
                    "For growing teams that need advanced "
                    "automation capabilities"
                ),
                "stripe_price_id": self.STRIPE_PRICE_ID_PROFESSIONAL,
            },
            "enterprise": {
                "name": "Enterprise",
                "price": Decimal("299.99"),
                "currency": "USD",
                "interval": "month",
                "features": [
                    "Everything in Professional",
                    "White-label options",
                    "Custom integrations",
                    "SLA guarantees",
                    "Dedicated support",
                    "Advanced security",
                ],
                "limits": {
                    "automations": -1,  # unlimited
                    "executions_per_month": 100000,
                    "storage_gb": 100,
                    "users": -1,  # unlimited
                },
                "description": (
                    "For large organizations with enterprise " "requirements"
                ),
                "stripe_price_id": self.STRIPE_PRICE_ID_ENTERPRISE,
            },
            "white_label_starter": {
                "name": "White Label Starter",
                "price": Decimal("199.99"),
                "currency": "USD",
                "interval": "month",
                "features": [
                    "White-label platform",
                    "Custom branding",
                    "Basic features",
                    "Email support",
                ],
                "limits": {
                    "automations": 50,
                    "executions_per_month": 5000,
                    "storage_gb": 10,
                    "users": 25,
                },
                "description": (
                    "Start building your own branded " "automation platform"
                ),
                "stripe_price_id": self.STRIPE_PRICE_ID_WHITE_LABEL_STARTER,
            },
            "white_label_enterprise": {
                "name": "White Label Enterprise",
                "price": Decimal("999.99"),
                "currency": "USD",
                "interval": "month",
                "features": [
                    "Full white-label platform",
                    "Complete customization",
                    "All features included",
                    "Dedicated support",
                    "Custom integrations",
                ],
                "limits": {
                    "automations": -1,  # unlimited
                    "executions_per_month": -1,  # unlimited
                    "storage_gb": -1,  # unlimited
                    "users": -1,  # unlimited
                },
                "description": (
                    "Complete white-label solution for " "enterprise partners"
                ),
                "stripe_price_id": self.STRIPE_PRICE_ID_WHITE_LABEL_ENTERPRISE,
            },
        }

    # Trial Configuration
    DEFAULT_TRIAL_DAYS: int = Field(14, validation_alias="DEFAULT_TRIAL_DAYS")
    MAX_TRIAL_DAYS: int = Field(30, validation_alias="MAX_TRIAL_DAYS")

    # Billing Configuration
    AUTO_SUSPEND_DAYS: int = Field(7, validation_alias="AUTO_SUSPEND_DAYS")
    GRACE_PERIOD_DAYS: int = Field(3, validation_alias="GRACE_PERIOD_DAYS")
    INVOICE_DUE_DAYS: int = Field(15, validation_alias="INVOICE_DUE_DAYS")

    # Usage Tracking
    USAGE_TRACKING_ENABLED: bool = Field(
        True, validation_alias="USAGE_TRACKING_ENABLED"
    )
    USAGE_RESET_DAY: int = Field(1, validation_alias="USAGE_RESET_DAY")
    USAGE_ALERT_THRESHOLD: float = Field(
        0.8, validation_alias="USAGE_ALERT_THRESHOLD"
    )

    # Pricing Configuration
    STORAGE_PRICING: Decimal = Field(
        Decimal("0.10"), validation_alias="STORAGE_PRICING"
    )

    # White Label Configuration
    WHITE_LABEL_ENABLED: bool = Field(
        True, validation_alias="WHITE_LABEL_ENABLED"
    )
    CUSTOM_DOMAIN_ENABLED: bool = Field(
        True, validation_alias="CUSTOM_DOMAIN_ENABLED"
    )
    BRANDING_CUSTOMIZATION_ENABLED: bool = Field(
        True, validation_alias="BRANDING_CUSTOMIZATION_ENABLED"
    )

    # Compliance Configuration
    COMPLIANCE_CHECKS_ENABLED: bool = Field(
        True, validation_alias="COMPLIANCE_CHECKS_ENABLED"
    )
    GDPR_COMPLIANCE_ENABLED: bool = Field(
        True, validation_alias="GDPR_COMPLIANCE_ENABLED"
    )
    SOC2_COMPLIANCE_ENABLED: bool = Field(
        True, validation_alias="SOC2_COMPLIANCE_ENABLED"
    )
    HIPAA_COMPLIANCE_ENABLED: bool = Field(
        False, validation_alias="HIPAA_COMPLIANCE_ENABLED"
    )

    # Rate Limiting Configuration
    API_RATE_LIMITING_ENABLED: bool = Field(
        True, validation_alias="API_RATE_LIMITING_ENABLED"
    )
    DEFAULT_RATE_LIMIT: int = Field(
        1000, validation_alias="DEFAULT_RATE_LIMIT"
    )
    MAX_RATE_LIMIT: int = Field(10000, validation_alias="MAX_RATE_LIMIT")

    # Monitoring Configuration
    USAGE_MONITORING_ENABLED: bool = Field(
        True, validation_alias="USAGE_MONITORING_ENABLED"
    )
    BILLING_MONITORING_ENABLED: bool = Field(
        True, validation_alias="BILLING_MONITORING_ENABLED"
    )
    PERFORMANCE_MONITORING_ENABLED: bool = Field(
        True, validation_alias="PERFORMANCE_MONITORING_ENABLED"
    )

    # Notification Configuration
    EMAIL_NOTIFICATIONS_ENABLED: bool = Field(
        True, validation_alias="EMAIL_NOTIFICATIONS_ENABLED"
    )
    SLACK_NOTIFICATIONS_ENABLED: bool = Field(
        False, validation_alias="SLACK_NOTIFICATIONS_ENABLED"
    )
    WEBHOOK_NOTIFICATIONS_ENABLED: bool = Field(
        True, validation_alias="WEBHOOK_NOTIFICATIONS_ENABLED"
    )

    # Analytics Configuration
    USAGE_ANALYTICS_ENABLED: bool = Field(
        True, validation_alias="USAGE_ANALYTICS_ENABLED"
    )
    BILLING_ANALYTICS_ENABLED: bool = Field(
        True, validation_alias="BILLING_ANALYTICS_ENABLED"
    )
    USER_ANALYTICS_ENABLED: bool = Field(
        True, validation_alias="USER_ANALYTICS_ENABLED"
    )

    # Integration Configuration
    STRIPE_INTEGRATION_ENABLED: bool = Field(
        True, validation_alias="STRIPE_INTEGRATION_ENABLED"
    )
    PAYPAL_INTEGRATION_ENABLED: bool = Field(
        False, validation_alias="PAYPAL_INTEGRATION_ENABLED"
    )
    QUICKBOOKS_INTEGRATION_ENABLED: bool = Field(
        False, validation_alias="QUICKBOOKS_INTEGRATION_ENABLED"
    )

    # Development Configuration
    TEST_MODE: bool = Field(False, validation_alias="TEST_MODE")
    MOCK_BILLING_ENABLED: bool = Field(
        False, validation_alias="MOCK_BILLING_ENABLED"
    )
    MOCK_PAYMENTS_ENABLED: bool = Field(
        False, validation_alias="MOCK_PAYMENTS_ENABLED"
    )

    @property
    def stripe_price_ids(self) -> Dict[str, str]:
        """Get all Stripe price IDs."""
        return {
            "starter": self.STRIPE_PRICE_ID_STARTER,
            "professional": self.STRIPE_PRICE_ID_PROFESSIONAL,
            "enterprise": self.STRIPE_PRICE_ID_ENTERPRISE,
            "white_label_starter": self.STRIPE_PRICE_ID_WHITE_LABEL_STARTER,
            "white_label_enterprise": (
                self.STRIPE_PRICE_ID_WHITE_LABEL_ENTERPRISE
            ),
        }

    @property
    def enabled_features(self) -> List[str]:
        """Get list of enabled features."""
        features = []
        if self.USAGE_TRACKING_ENABLED:
            features.append("usage_tracking")
        if self.WHITE_LABEL_ENABLED:
            features.append("white_label")
        if self.CUSTOM_DOMAIN_ENABLED:
            features.append("custom_domain")
        if self.BRANDING_CUSTOMIZATION_ENABLED:
            features.append("branding_customization")
        if self.API_RATE_LIMITING_ENABLED:
            features.append("api_rate_limiting")
        if self.USAGE_MONITORING_ENABLED:
            features.append("usage_monitoring")
        if self.BILLING_MONITORING_ENABLED:
            features.append("billing_monitoring")
        if self.PERFORMANCE_MONITORING_ENABLED:
            features.append("performance_monitoring")
        if self.EMAIL_NOTIFICATIONS_ENABLED:
            features.append("email_notifications")
        if self.SLACK_NOTIFICATIONS_ENABLED:
            features.append("slack_notifications")
        if self.WEBHOOK_NOTIFICATIONS_ENABLED:
            features.append("webhook_notifications")
        if self.USAGE_ANALYTICS_ENABLED:
            features.append("usage_analytics")
        if self.BILLING_ANALYTICS_ENABLED:
            features.append("billing_analytics")
        if self.USER_ANALYTICS_ENABLED:
            features.append("user_analytics")
        if self.STRIPE_INTEGRATION_ENABLED:
            features.append("stripe_integration")
        if self.PAYPAL_INTEGRATION_ENABLED:
            features.append("paypal_integration")
        if self.QUICKBOOKS_INTEGRATION_ENABLED:
            features.append("quickbooks_integration")
        return features

    @property
    def compliance_features(self) -> List[str]:
        """Get list of enabled compliance features."""
        features = []
        if self.GDPR_COMPLIANCE_ENABLED:
            features.append("gdpr")
        if self.SOC2_COMPLIANCE_ENABLED:
            features.append("soc2")
        if self.HIPAA_COMPLIANCE_ENABLED:
            features.append("hipaa")
        return features

    def get_plan_by_price_id(self, price_id: str) -> Dict | None:
        """Get subscription plan by Stripe price ID."""
        for plan_name, plan_data in self.subscription_plans.items():
            if plan_data.get("stripe_price_id") == price_id:
                return {"name": plan_name, **plan_data}
        return None

    def validate_plan_limits(
        self, plan_name: str, usage: Dict[str, int]
    ) -> Dict[str, Any]:
        """Validate usage against plan limits."""
        plan = self.subscription_plans.get(plan_name)
        if not plan:
            return {"valid": False, "reason": "Invalid plan"}

        limits = plan.get("limits", {})
        violations = {}

        for limit_name, limit_value in limits.items():
            if limit_value == -1:  # unlimited
                continue

            current_usage = usage.get(limit_name, 0)
            if current_usage > limit_value:
                violations[limit_name] = {
                    "current": current_usage,
                    "limit": limit_value,
                    "exceeded": True,
                }

        return {
            "valid": len(violations) == 0,
            "violations": violations,
        }


# Global configuration instance
# saas_config = SaaSConfig()  # Will be initialized when imported
