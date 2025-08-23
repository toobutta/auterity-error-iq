"""SaaS configuration settings for subscription management and billing."""

import os
from typing import Dict, List
from decimal import Decimal

from pydantic import BaseSettings, Field


class SaaSConfig(BaseSettings):
    """SaaS configuration settings."""
    
    # Stripe Configuration
    STRIPE_SECRET_KEY: str = Field(..., env="STRIPE_SECRET_KEY")
    STRIPE_PUBLISHABLE_KEY: str = Field(..., env="STRIPE_PUBLISHABLE_KEY")
    STRIPE_WEBHOOK_SECRET: str = Field(..., env="STRIPE_WEBHOOK_SECRET")
    
    # Stripe Price IDs for different plans
    STRIPE_PRICE_ID_STARTER: str = Field(..., env="STRIPE_PRICE_ID_STARTER")
    STRIPE_PRICE_ID_PROFESSIONAL: str = Field(..., env="STRIPE_PRICE_ID_PROFESSIONAL")
    STRIPE_PRICE_ID_ENTERPRISE: str = Field(..., env="STRIPE_PRICE_ID_ENTERPRISE")
    STRIPE_PRICE_ID_WHITE_LABEL_STARTER: str = Field(..., env="STRIPE_PRICE_ID_WHITE_LABEL_STARTER")
    STRIPE_PRICE_ID_WHITE_LABEL_ENTERPRISE: str = Field(..., env="STRIPE_PRICE_ID_WHITE_LABEL_ENTERPRISE")
    
    # Subscription Plans Configuration
    SUBSCRIPTION_PLANS: Dict[str, Dict] = {
        "starter": {
            "name": "Starter Plan",
            "price": Decimal("99.00"),
            "currency": "USD",
            "billing_cycle": "monthly",
            "features": {
                "max_users": 5,
                "max_workflows": 100,
                "max_ai_requests_per_month": 10000,
                "custom_branding": False,
                "sso_support": False,
                "white_label": False,
                "support": "Community",
                "storage_limit_gb": 10,
                "api_rate_limit": "1000/hour",
                "backup_frequency": "daily"
            },
            "description": "Perfect for small teams getting started with automation",
            "stripe_price_id": None  # Will be set from environment
        },
        "professional": {
            "name": "Professional Plan",
            "price": Decimal("299.00"),
            "currency": "USD",
            "billing_cycle": "monthly",
            "features": {
                "max_users": 25,
                "max_workflows": -1,  # Unlimited
                "max_ai_requests_per_month": 50000,
                "custom_branding": True,
                "sso_support": True,
                "white_label": False,
                "support": "Priority",
                "storage_limit_gb": 100,
                "api_rate_limit": "5000/hour",
                "backup_frequency": "hourly"
            },
            "description": "Ideal for growing businesses with advanced needs",
            "stripe_price_id": None  # Will be set from environment
        },
        "enterprise": {
            "name": "Enterprise Plan",
            "price": Decimal("999.00"),
            "currency": "USD",
            "billing_cycle": "monthly",
            "features": {
                "max_users": -1,  # Unlimited
                "max_workflows": -1,  # Unlimited
                "max_ai_requests_per_month": 200000,
                "custom_branding": True,
                "sso_support": True,
                "white_label": False,
                "support": "Dedicated",
                "storage_limit_gb": 1000,
                "api_rate_limit": "10000/hour",
                "backup_frequency": "real-time"
            },
            "description": "For large organizations with enterprise requirements",
            "stripe_price_id": None  # Will be set from environment
        },
        "white_label_starter": {
            "name": "White-Label Starter",
            "price": Decimal("499.00"),
            "currency": "USD",
            "billing_cycle": "monthly",
            "features": {
                "max_users": 25,
                "max_workflows": -1,
                "max_ai_requests_per_month": 50000,
                "custom_branding": True,
                "sso_support": True,
                "white_label": True,
                "support": "Priority",
                "storage_limit_gb": 100,
                "api_rate_limit": "5000/hour",
                "backup_frequency": "hourly"
            },
            "description": "Start building your own branded automation platform",
            "stripe_price_id": None  # Will be set from environment
        },
        "white_label_enterprise": {
            "name": "White-Label Enterprise",
            "price": Decimal("1999.00"),
            "currency": "USD",
            "billing_cycle": "monthly",
            "features": {
                "max_users": -1,
                "max_workflows": -1,
                "max_ai_requests_per_month": 200000,
                "custom_branding": True,
                "sso_support": True,
                "white_label": True,
                "support": "Dedicated",
                "storage_limit_gb": 1000,
                "api_rate_limit": "10000/hour",
                "backup_frequency": "real-time"
            },
            "description": "Full white-label solution for enterprise partners",
            "stripe_price_id": None  # Will be set from environment
        }
    }
    
    # Trial Configuration
    DEFAULT_TRIAL_DAYS: int = Field(14, env="DEFAULT_TRIAL_DAYS")
    MAX_TRIAL_DAYS: int = Field(30, env="MAX_TRIAL_DAYS")
    
    # Billing Configuration
    AUTO_SUSPEND_DAYS: int = Field(7, env="AUTO_SUSPEND_DAYS")
    GRACE_PERIOD_DAYS: int = Field(3, env="GRACE_PERIOD_DAYS")
    INVOICE_DUE_DAYS: int = Field(15, env="INVOICE_DUE_DAYS")
    
    # Usage Tracking Configuration
    USAGE_TRACKING_ENABLED: bool = Field(True, env="USAGE_TRACKING_ENABLED")
    USAGE_RESET_DAY: int = Field(1, env="USAGE_RESET_DAY")  # Day of month to reset usage
    USAGE_ALERT_THRESHOLD: float = Field(0.8, env="USAGE_ALERT_THRESHOLD")  # 80% of limit
    
    # AI Request Pricing (per 1000 tokens)
    AI_REQUEST_PRICING: Dict[str, Decimal] = {
        "gpt-4": Decimal("0.03"),
        "gpt-3.5-turbo": Decimal("0.002"),
        "claude-3-opus": Decimal("0.015"),
        "claude-3-sonnet": Decimal("0.003"),
        "claude-3-haiku": Decimal("0.00025"),
        "gemini-pro": Decimal("0.0005"),
        "llama-2-70b": Decimal("0.0007"),
        "custom-model": Decimal("0.001")
    }
    
    # Workflow Execution Pricing
    WORKFLOW_EXECUTION_PRICING: Dict[str, Decimal] = {
        "basic": Decimal("0.01"),
        "standard": Decimal("0.05"),
        "complex": Decimal("0.10"),
        "enterprise": Decimal("0.25")
    }
    
    # Storage Pricing (per GB per month)
    STORAGE_PRICING: Decimal = Field(Decimal("0.10"), env="STORAGE_PRICING")
    
    # White-Label Configuration
    WHITE_LABEL_ENABLED: bool = Field(True, env="WHITE_LABEL_ENABLED")
    CUSTOM_DOMAIN_ENABLED: bool = Field(True, env="CUSTOM_DOMAIN_ENABLED")
    BRANDING_CUSTOMIZATION_ENABLED: bool = Field(True, env="BRANDING_CUSTOMIZATION_ENABLED")
    
    # Industry Profiles
    AVAILABLE_INDUSTRY_PROFILES: List[str] = [
        "automotive",
        "healthcare",
        "finance",
        "retail",
        "manufacturing",
        "technology",
        "education",
        "government",
        "nonprofit",
        "general"
    ]
    
    # Compliance Configuration
    COMPLIANCE_CHECKS_ENABLED: bool = Field(True, env="COMPLIANCE_CHECKS_ENABLED")
    GDPR_COMPLIANCE_ENABLED: bool = Field(True, env="GDPR_COMPLIANCE_ENABLED")
    SOC2_COMPLIANCE_ENABLED: bool = Field(True, env="SOC2_COMPLIANCE_ENABLED")
    HIPAA_COMPLIANCE_ENABLED: bool = Field(False, env="HIPAA_COMPLIANCE_ENABLED")
    
    # Security Configuration
    API_RATE_LIMITING_ENABLED: bool = Field(True, env="API_RATE_LIMITING_ENABLED")
    DEFAULT_RATE_LIMIT: int = Field(1000, env="DEFAULT_RATE_LIMIT")  # requests per hour
    MAX_RATE_LIMIT: int = Field(10000, env="MAX_RATE_LIMIT")  # maximum requests per hour
    
    # Monitoring Configuration
    USAGE_MONITORING_ENABLED: bool = Field(True, env="USAGE_MONITORING_ENABLED")
    BILLING_MONITORING_ENABLED: bool = Field(True, env="BILLING_MONITORING_ENABLED")
    PERFORMANCE_MONITORING_ENABLED: bool = Field(True, env="PERFORMANCE_MONITORING_ENABLED")
    
    # Notification Configuration
    EMAIL_NOTIFICATIONS_ENABLED: bool = Field(True, env="EMAIL_NOTIFICATIONS_ENABLED")
    SLACK_NOTIFICATIONS_ENABLED: bool = Field(False, env="SLACK_NOTIFICATIONS_ENABLED")
    WEBHOOK_NOTIFICATIONS_ENABLED: bool = Field(True, env="WEBHOOK_NOTIFICATIONS_ENABLED")
    
    # Analytics Configuration
    USAGE_ANALYTICS_ENABLED: bool = Field(True, env="USAGE_ANALYTICS_ENABLED")
    BILLING_ANALYTICS_ENABLED: bool = Field(True, env="BILLING_ANALYTICS_ENABLED")
    USER_ANALYTICS_ENABLED: bool = Field(True, env="USER_ANALYTICS_ENABLED")
    
    # Integration Configuration
    STRIPE_INTEGRATION_ENABLED: bool = Field(True, env="STRIPE_INTEGRATION_ENABLED")
    PAYPAL_INTEGRATION_ENABLED: bool = Field(False, env="PAYPAL_INTEGRATION_ENABLED")
    QUICKBOOKS_INTEGRATION_ENABLED: bool = Field(False, env="QUICKBOOKS_INTEGRATION_ENABLED")
    
    # Development/Testing Configuration
    TEST_MODE: bool = Field(False, env="TEST_MODE")
    MOCK_BILLING_ENABLED: bool = Field(False, env="MOCK_BILLING_ENABLED")
    MOCK_PAYMENTS_ENABLED: bool = Field(False, env="MOCK_PAYMENTS_ENABLED")
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self._update_stripe_price_ids()
    
    def _update_stripe_price_ids(self):
        """Update Stripe price IDs in subscription plans."""
        price_id_mapping = {
            "starter": self.STRIPE_PRICE_ID_STARTER,
            "professional": self.STRIPE_PRICE_ID_PROFESSIONAL,
            "enterprise": self.STRIPE_PRICE_ID_ENTERPRISE,
            "white_label_starter": self.STRIPE_PRICE_ID_WHITE_LABEL_STARTER,
            "white_label_enterprise": self.STRIPE_PRICE_ID_WHITE_LABEL_ENTERPRISE
        }
        
        for plan_id, price_id in price_id_mapping.items():
            if plan_id in self.SUBSCRIPTION_PLANS:
                self.SUBSCRIPTION_PLANS[plan_id]["stripe_price_id"] = price_id
    
    def get_plan_features(self, plan_id: str) -> Dict:
        """Get features for a specific plan."""
        if plan_id not in self.SUBSCRIPTION_PLANS:
            raise ValueError(f"Invalid plan ID: {plan_id}")
        return self.SUBSCRIPTION_PLANS[plan_id]["features"]
    
    def get_plan_price(self, plan_id: str) -> Decimal:
        """Get price for a specific plan."""
        if plan_id not in self.SUBSCRIPTION_PLANS:
            raise ValueError(f"Invalid plan ID: {plan_id}")
        return self.SUBSCRIPTION_PLANS[plan_id]["price"]
    
    def get_ai_request_cost(self, model: str, token_count: int) -> Decimal:
        """Calculate cost for AI request based on model and token count."""
        base_price = self.AI_REQUEST_PRICING.get(model, self.AI_REQUEST_PRICING["custom-model"])
        return (base_price * token_count) / 1000  # Price per 1000 tokens
    
    def get_workflow_execution_cost(self, complexity: str) -> Decimal:
        """Get cost for workflow execution based on complexity."""
        return self.WORKFLOW_EXECUTION_PRICING.get(complexity, self.WORKFLOW_EXECUTION_PRICING["basic"])
    
    def get_storage_cost(self, gb_used: float) -> Decimal:
        """Calculate storage cost based on GB used."""
        return self.STORAGE_PRICING * Decimal(str(gb_used))
    
    def is_plan_feature_enabled(self, plan_id: str, feature: str) -> bool:
        """Check if a specific feature is enabled for a plan."""
        features = self.get_plan_features(plan_id)
        return features.get(feature, False)
    
    def get_plan_limits(self, plan_id: str) -> Dict[str, int]:
        """Get usage limits for a specific plan."""
        features = self.get_plan_features(plan_id)
        return {
            "max_users": features.get("max_users", 5),
            "max_workflows": features.get("max_workflows", 100),
            "max_ai_requests_per_month": features.get("max_ai_requests_per_month", 10000),
            "storage_limit_gb": features.get("storage_limit_gb", 10),
            "api_rate_limit": features.get("api_rate_limit", 1000)
        }
    
    def validate_plan_upgrade(self, current_plan: str, new_plan: str) -> bool:
        """Validate if plan upgrade is allowed."""
        plan_order = ["starter", "professional", "enterprise", "white_label_starter", "white_label_enterprise"]
        
        try:
            current_index = plan_order.index(current_plan)
            new_index = plan_order.index(new_plan)
            return new_index >= current_index
        except ValueError:
            return False
    
    def get_available_plans_for_tenant(self, current_plan: str) -> List[str]:
        """Get available plans for upgrade/downgrade."""
        plan_order = ["starter", "professional", "enterprise", "white_label_starter", "white_label_enterprise"]
        
        try:
            current_index = plan_order.index(current_plan)
            return plan_order[current_index:]
        except ValueError:
            return plan_order
    
    def get_compliance_requirements(self, plan_id: str) -> Dict[str, bool]:
        """Get compliance requirements for a specific plan."""
        base_compliance = {
            "gdpr": self.GDPR_COMPLIANCE_ENABLED,
            "soc2": self.SOC2_COMPLIANCE_ENABLED,
            "hipaa": self.HIPAA_COMPLIANCE_ENABLED
        }
        
        # Enterprise plans get additional compliance
        if "enterprise" in plan_id:
            base_compliance.update({
                "iso27001": True,
                "pci_dss": True,
                "fedramp": False  # US government only
            })
        
        return base_compliance


# Global SaaS configuration instance
saas_config = SaaSConfig()


# Environment variable template for reference
ENV_TEMPLATE = """
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Stripe Price IDs (create these in your Stripe dashboard)
STRIPE_PRICE_ID_STARTER=price_...
STRIPE_PRICE_ID_PROFESSIONAL=price_...
STRIPE_PRICE_ID_ENTERPRISE=price_...
STRIPE_PRICE_ID_WHITE_LABEL_STARTER=price_...
STRIPE_PRICE_ID_WHITE_LABEL_ENTERPRISE=price_...

# Trial Configuration
DEFAULT_TRIAL_DAYS=14
MAX_TRIAL_DAYS=30

# Billing Configuration
AUTO_SUSPEND_DAYS=7
GRACE_PERIOD_DAYS=3
INVOICE_DUE_DAYS=15

# Usage Tracking
USAGE_TRACKING_ENABLED=true
USAGE_RESET_DAY=1
USAGE_ALERT_THRESHOLD=0.8

# White-Label Features
WHITE_LABEL_ENABLED=true
CUSTOM_DOMAIN_ENABLED=true
BRANDING_CUSTOMIZATION_ENABLED=true

# Compliance
COMPLIANCE_CHECKS_ENABLED=true
GDPR_COMPLIANCE_ENABLED=true
SOC2_COMPLIANCE_ENABLED=true
HIPAA_COMPLIANCE_ENABLED=false

# Security
API_RATE_LIMITING_ENABLED=true
DEFAULT_RATE_LIMIT=1000
MAX_RATE_LIMIT=10000

# Monitoring
USAGE_MONITORING_ENABLED=true
BILLING_MONITORING_ENABLED=true
PERFORMANCE_MONITORING_ENABLED=true

# Notifications
EMAIL_NOTIFICATIONS_ENABLED=true
SLACK_NOTIFICATIONS_ENABLED=false
WEBHOOK_NOTIFICATIONS_ENABLED=true

# Analytics
USAGE_ANALYTICS_ENABLED=true
BILLING_ANALYTICS_ENABLED=true
USER_ANALYTICS_ENABLED=true

# Integrations
STRIPE_INTEGRATION_ENABLED=true
PAYPAL_INTEGRATION_ENABLED=false
QUICKBOOKS_INTEGRATION_ENABLED=false

# Development/Testing
TEST_MODE=false
MOCK_BILLING_ENABLED=false
MOCK_PAYMENTS_ENABLED=false
"""
