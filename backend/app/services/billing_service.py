"""Billing service for SaaS subscription management and Stripe integration."""

import logging
from datetime import datetime, timedelta
from decimal import Decimal
from typing import Dict, Optional, Tuple
from uuid import UUID

import stripe
from app.core.config import settings
from app.models.tenant import BillingRecord, SubscriptionPlan, Tenant, UsageLog
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)

# Initialize Stripe
stripe.api_key = settings.STRIPE_SECRET_KEY


class BillingService:
    """Service for managing billing, subscriptions, and usage tracking."""

    def __init__(self, db: Session):
        self.db = db
        self.stripe = stripe

    # Subscription Management
    async def create_subscription(
        self,
        tenant_id: UUID,
        plan: SubscriptionPlan,
        payment_method_id: str,
        trial_days: int = 14,
    ) -> Tuple[Tenant, str]:
        """Create a new subscription for a tenant."""
        try:
            tenant = self.db.query(Tenant).filter(Tenant.id == tenant_id).first()
            if not tenant:
                raise ValueError(f"Tenant {tenant_id} not found")

            # Create or get Stripe customer
            if not tenant.stripe_customer_id:
                customer = self.stripe.Customer.create(
                    email=tenant.users[0].email if tenant.users else None,
                    metadata={"tenant_id": str(tenant_id)},
                )
                tenant.stripe_customer_id = customer.id

            # Create subscription
            subscription_data = {
                "customer": tenant.stripe_customer_id,
                "items": [{"price": self._get_stripe_price_id(plan)}],
                "payment_behavior": "default_incomplete",
                "payment_settings": {"save_default_payment_method": "on_subscription"},
                "expand": ["latest_invoice.payment_intent"],
            }

            if trial_days > 0:
                subscription_data["trial_period_days"] = trial_days

            subscription = self.stripe.Subscription.create(**subscription_data)

            # Update tenant
            tenant.subscription_plan = plan
            tenant.stripe_subscription_id = subscription.id
            tenant.status = "trial" if trial_days > 0 else "active"
            tenant.current_period_start = datetime.fromtimestamp(
                subscription.current_period_start
            )
            tenant.current_period_end = datetime.fromtimestamp(
                subscription.current_period_end
            )
            if trial_days > 0:
                tenant.trial_end = datetime.fromtimestamp(subscription.trial_end)

            # Update plan limits
            self._update_tenant_plan_limits(tenant, plan)

            self.db.commit()

            return tenant, subscription.latest_invoice.payment_intent.client_secret

        except Exception as e:
            logger.error(f"Failed to create subscription: {str(e)}")
            self.db.rollback()
            raise

    async def update_subscription(
        self, tenant_id: UUID, new_plan: SubscriptionPlan
    ) -> Tenant:
        """Update tenant subscription plan."""
        try:
            tenant = self.db.query(Tenant).filter(Tenant.id == tenant_id).first()
            if not tenant or not tenant.stripe_subscription_id:
                raise ValueError(f"Tenant {tenant_id} has no active subscription")

            # Update Stripe subscription
            subscription = self.stripe.Subscription.retrieve(
                tenant.stripe_subscription_id
            )
            self.stripe.Subscription.modify(
                tenant.stripe_subscription_id,
                items=[
                    {
                        "id": subscription["items"]["data"][0].id,
                        "price": self._get_stripe_price_id(new_plan),
                    }
                ],
                proration_behavior="create_prorations",
            )

            # Update tenant
            tenant.subscription_plan = new_plan
            self._update_tenant_plan_limits(tenant, new_plan)
            tenant.updated_at = datetime.utcnow()

            self.db.commit()
            return tenant

        except Exception as e:
            logger.error(f"Failed to update subscription: {str(e)}")
            self.db.rollback()
            raise

    async def cancel_subscription(self, tenant_id: UUID) -> Tenant:
        """Cancel tenant subscription."""
        try:
            tenant = self.db.query(Tenant).filter(Tenant.id == tenant_id).first()
            if not tenant or not tenant.stripe_subscription_id:
                raise ValueError(f"Tenant {tenant_id} has no active subscription")

            # Cancel Stripe subscription
            self.stripe.Subscription.modify(
                tenant.stripe_subscription_id, cancel_at_period_end=True
            )

            # Update tenant status
            tenant.status = "suspended"
            tenant.updated_at = datetime.utcnow()

            self.db.commit()
            return tenant

        except Exception as e:
            logger.error(f"Failed to cancel subscription: {str(e)}")
            self.db.rollback()
            raise

    # Usage Tracking
    async def track_usage(
        self,
        tenant_id: UUID,
        resource_type: str,
        quantity: int = 1,
        cost: Decimal = Decimal("0.00"),
        user_id: Optional[UUID] = None,
        workflow_id: Optional[UUID] = None,
        metadata: Optional[Dict] = None,
    ) -> UsageLog:
        """Track resource usage for billing purposes."""
        try:
            # Create usage log
            usage_log = UsageLog(
                tenant_id=tenant_id,
                resource_type=resource_type,
                quantity=quantity,
                cost=cost,
                user_id=user_id,
                workflow_id=workflow_id,
                metadata=metadata or {},
            )
            self.db.add(usage_log)

            # Update tenant usage counters
            tenant = self.db.query(Tenant).filter(Tenant.id == tenant_id).first()
            if tenant and resource_type == "ai_request":
                tenant.current_month_ai_requests += quantity

            self.db.commit()
            return usage_log

        except Exception as e:
            logger.error(f"Failed to track usage: {str(e)}")
            self.db.rollback()
            raise

    async def get_usage_summary(
        self,
        tenant_id: UUID,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
    ) -> Dict:
        """Get usage summary for a tenant."""
        try:
            query = self.db.query(UsageLog).filter(UsageLog.tenant_id == tenant_id)

            if start_date:
                query = query.filter(UsageLog.timestamp >= start_date)
            if end_date:
                query = query.filter(UsageLog.timestamp <= end_date)

            usage_logs = query.all()

            summary = {
                "total_cost": sum(log.cost for log in usage_logs),
                "total_ai_requests": sum(
                    log.quantity
                    for log in usage_logs
                    if log.resource_type == "ai_request"
                ),
                "total_workflow_executions": sum(
                    log.quantity
                    for log in usage_logs
                    if log.resource_type == "workflow_execution"
                ),
                "resource_breakdown": {},
            }

            # Group by resource type
            for log in usage_logs:
                if log.resource_type not in summary["resource_breakdown"]:
                    summary["resource_breakdown"][log.resource_type] = {
                        "count": 0,
                        "cost": Decimal("0.00"),
                    }
                summary["resource_breakdown"][log.resource_type][
                    "count"
                ] += log.quantity
                summary["resource_breakdown"][log.resource_type]["cost"] += log.cost

            return summary

        except Exception as e:
            logger.error(f"Failed to get usage summary: {str(e)}")
            raise

    # Billing Records
    async def create_billing_record(
        self,
        tenant_id: UUID,
        amount: Decimal,
        description: str,
        stripe_invoice_id: Optional[str] = None,
        stripe_payment_intent_id: Optional[str] = None,
        billing_period_start: Optional[datetime] = None,
        billing_period_end: Optional[datetime] = None,
        metadata: Optional[Dict] = None,
    ) -> BillingRecord:
        """Create a billing record for a tenant."""
        try:
            billing_record = BillingRecord(
                tenant_id=tenant_id,
                amount=amount,
                currency="USD",
                description=description,
                stripe_invoice_id=stripe_invoice_id,
                stripe_payment_intent_id=stripe_payment_intent_id,
                billing_period_start=billing_period_start or datetime.utcnow(),
                billing_period_end=billing_period_end
                or (datetime.utcnow() + timedelta(days=30)),
                status="pending",
                metadata=metadata or {},
            )
            self.db.add(billing_record)
            self.db.commit()
            return billing_record

        except Exception as e:
            logger.error(f"Failed to create billing record: {str(e)}")
            self.db.rollback()
            raise

    async def mark_billing_record_paid(
        self, billing_record_id: UUID, stripe_payment_intent_id: Optional[str] = None
    ) -> BillingRecord:
        """Mark a billing record as paid."""
        try:
            billing_record = (
                self.db.query(BillingRecord)
                .filter(BillingRecord.id == billing_record_id)
                .first()
            )
            if not billing_record:
                raise ValueError(f"Billing record {billing_record_id} not found")

            billing_record.status = "paid"
            billing_record.paid_at = datetime.utcnow()
            if stripe_payment_intent_id:
                billing_record.stripe_payment_intent_id = stripe_payment_intent_id

            self.db.commit()
            return billing_record

        except Exception as e:
            logger.error(f"Failed to mark billing record as paid: {str(e)}")
            self.db.rollback()
            raise

    # Plan Management
    def _get_stripe_price_id(self, plan: SubscriptionPlan) -> str:
        """Get Stripe price ID for a subscription plan."""
        price_ids = {
            SubscriptionPlan.STARTER: settings.STRIPE_PRICE_ID_STARTER,
            SubscriptionPlan.PROFESSIONAL: settings.STRIPE_PRICE_ID_PROFESSIONAL,
            SubscriptionPlan.ENTERPRISE: settings.STRIPE_PRICE_ID_ENTERPRISE,
            SubscriptionPlan.WHITE_LABEL_STARTER: settings.STRIPE_PRICE_ID_WHITE_LABEL_STARTER,
            SubscriptionPlan.WHITE_LABEL_ENTERPRISE: settings.STRIPE_PRICE_ID_WHITE_LABEL_ENTERPRISE,
        }
        return price_ids.get(plan, settings.STRIPE_PRICE_ID_STARTER)

    def _update_tenant_plan_limits(self, tenant: Tenant, plan: SubscriptionPlan):
        """Update tenant limits based on subscription plan."""
        plan_features = tenant.get_plan_features()
        tenant.max_users = plan_features.get("max_users", 5)
        tenant.max_workflows = plan_features.get("max_workflows", 100)
        tenant.max_ai_requests_per_month = plan_features.get(
            "max_ai_requests_per_month", 10000
        )

        # Update monthly budget based on plan
        plan_pricing = {
            SubscriptionPlan.STARTER: Decimal("99.00"),
            SubscriptionPlan.PROFESSIONAL: Decimal("299.00"),
            SubscriptionPlan.ENTERPRISE: Decimal("999.00"),
            SubscriptionPlan.WHITE_LABEL_STARTER: Decimal("499.00"),
            SubscriptionPlan.WHITE_LABEL_ENTERPRISE: Decimal("1999.00"),
        }
        tenant.monthly_budget = plan_pricing.get(plan, Decimal("99.00"))

    # Webhook Handling
    async def handle_stripe_webhook(self, event_data: Dict) -> bool:
        """Handle Stripe webhook events."""
        try:
            event_type = event_data.get("type")

            if event_type == "invoice.payment_succeeded":
                await self._handle_payment_succeeded(event_data)
            elif event_type == "invoice.payment_failed":
                await self._handle_payment_failed(event_data)
            elif event_type == "customer.subscription.updated":
                await self._handle_subscription_updated(event_data)
            elif event_type == "customer.subscription.deleted":
                await self._handle_subscription_deleted(event_data)

            return True

        except Exception as e:
            logger.error(f"Failed to handle Stripe webhook: {str(e)}")
            return False

    async def _handle_payment_succeeded(self, event_data: Dict):
        """Handle successful payment webhook."""
        invoice = event_data.get("data", {}).get("object", {})
        customer_id = invoice.get("customer")

        tenant = (
            self.db.query(Tenant)
            .filter(Tenant.stripe_customer_id == customer_id)
            .first()
        )
        if not tenant:
            return

        # Update tenant status
        tenant.status = "active"
        tenant.updated_at = datetime.utcnow()

        # Create billing record
        await self.create_billing_record(
            tenant_id=tenant.id,
            amount=Decimal(
                str(invoice.get("amount_paid", 0)) / 100
            ),  # Convert from cents
            description=f"Subscription payment for {tenant.subscription_plan} plan",
            stripe_invoice_id=invoice.get("id"),
            billing_period_start=datetime.fromtimestamp(invoice.get("period_start", 0)),
            billing_period_end=datetime.fromtimestamp(invoice.get("period_end", 0)),
        )

        self.db.commit()

    async def _handle_payment_failed(self, event_data: Dict):
        """Handle failed payment webhook."""
        invoice = event_data.get("data", {}).get("object", {})
        customer_id = invoice.get("customer")

        tenant = (
            self.db.query(Tenant)
            .filter(Tenant.stripe_customer_id == customer_id)
            .first()
        )
        if not tenant:
            return

        tenant.status = "payment_failed"
        tenant.updated_at = datetime.utcnow()
        self.db.commit()

    async def _handle_subscription_updated(self, event_data: Dict):
        """Handle subscription update webhook."""
        subscription = event_data.get("data", {}).get("object", {})
        customer_id = subscription.get("customer")

        tenant = (
            self.db.query(Tenant)
            .filter(Tenant.stripe_customer_id == customer_id)
            .first()
        )
        if not tenant:
            return

        # Update subscription period
        tenant.current_period_start = datetime.fromtimestamp(
            subscription.get("current_period_start", 0)
        )
        tenant.current_period_end = datetime.fromtimestamp(
            subscription.get("current_period_end", 0)
        )
        tenant.updated_at = datetime.utcnow()

        self.db.commit()

    async def _handle_subscription_deleted(self, event_data: Dict):
        """Handle subscription deletion webhook."""
        subscription = event_data.get("data", {}).get("object", {})
        customer_id = subscription.get("customer")

        tenant = (
            self.db.query(Tenant)
            .filter(Tenant.stripe_customer_id == customer_id)
            .first()
        )
        if not tenant:
            return

        tenant.status = "suspended"
        tenant.updated_at = datetime.utcnow()
        self.db.commit()

    # Utility Methods
    async def get_tenant_billing_info(self, tenant_id: UUID) -> Dict:
        """Get comprehensive billing information for a tenant."""
        try:
            tenant = self.db.query(Tenant).filter(Tenant.id == tenant_id).first()
            if not tenant:
                raise ValueError(f"Tenant {tenant_id} not found")

            # Get current month usage
            start_of_month = datetime.utcnow().replace(
                day=1, hour=0, minute=0, second=0, microsecond=0
            )
            usage_summary = await self.get_usage_summary(tenant_id, start_of_month)

            # Get recent billing records
            recent_billing = (
                self.db.query(BillingRecord)
                .filter(BillingRecord.tenant_id == tenant_id)
                .order_by(BillingRecord.created_at.desc())
                .limit(5)
                .all()
            )

            return {
                "tenant": {
                    "id": str(tenant.id),
                    "name": tenant.name,
                    "subscription_plan": tenant.subscription_plan,
                    "status": tenant.status,
                    "current_period_start": tenant.current_period_start,
                    "current_period_end": tenant.current_period_end,
                    "trial_end": tenant.trial_end,
                    "plan_features": tenant.get_plan_features(),
                },
                "usage": {
                    "current_month": usage_summary,
                    "limits": {
                        "max_users": tenant.max_users,
                        "max_workflows": tenant.max_workflows,
                        "max_ai_requests_per_month": tenant.max_ai_requests_per_month,
                        "current_month_ai_requests": tenant.current_month_ai_requests,
                    },
                },
                "billing": {
                    "monthly_budget": tenant.monthly_budget,
                    "recent_records": [
                        {
                            "id": str(record.id),
                            "amount": record.amount,
                            "status": record.status,
                            "description": record.description,
                            "created_at": record.created_at,
                        }
                        for record in recent_billing
                    ],
                },
            }

        except Exception as e:
            logger.error(f"Failed to get tenant billing info: {str(e)}")
            raise
