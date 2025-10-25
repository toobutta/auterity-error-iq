"""Billing service for SaaS subscription management and Stripe integration."""

import logging
from datetime import datetime, timedelta
from decimal import Decimal
from typing import Dict, Optional, Tuple
from uuid import UUID

import stripe
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.tenant import BillingRecord, SubscriptionPlan, Tenant, UsageLog

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
            tenant = (
                self.db.query(Tenant).filter(Tenant.id == tenant_id).first()
            )
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
                "payment_settings": {
                    "save_default_payment_method": "on_subscription"
                },
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
                tenant.trial_end = datetime.fromtimestamp(
                    subscription.trial_end
                )

            # Update plan limits
            self._update_tenant_plan_limits(tenant, plan)

            self.db.commit()

            return (
                tenant,
                subscription.latest_invoice.payment_intent.client_secret,
            )

        except Exception as e:
            logger.error(f"Failed to create subscription: {str(e)}")
            self.db.rollback()
            raise

    async def update_subscription(
        self, tenant_id: UUID, new_plan: SubscriptionPlan
    ) -> Tenant:
        """Update tenant subscription plan."""
        try:
            tenant = (
                self.db.query(Tenant).filter(Tenant.id == tenant_id).first()
            )
            if not tenant or not tenant.stripe_subscription_id:
                raise ValueError(
                    f"Tenant {tenant_id} has no active subscription"
                )

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
            tenant = (
                self.db.query(Tenant).filter(Tenant.id == tenant_id).first()
            )
            if not tenant or not tenant.stripe_subscription_id:
                raise ValueError(
                    f"Tenant {tenant_id} has no active subscription"
                )

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

    # API Cost Tracking
    async def track_api_cost(
        self,
        tenant_id: UUID,
        endpoint: str,
        model_id: str,
        cost: Decimal,
        tokens_used: Optional[int] = None,
        processing_time: Optional[float] = None,
        request_type: str = "ai_inference",
        user_id: Optional[UUID] = None,
        metadata: Optional[Dict] = None,
    ) -> UsageLog:
        """Track API costs with detailed breakdown."""
        try:
            # Get tenant to check limits
            tenant = (
                self.db.query(Tenant).filter(Tenant.id == tenant_id).first()
            )
            if not tenant:
                raise ValueError(f"Tenant {tenant_id} not found")

            # Check cost limits before processing
            await self._check_api_cost_limits(tenant, cost, request_type)

            # Create detailed usage log
            usage_log = UsageLog(
                tenant_id=tenant_id,
                resource_type=f"api_{request_type}",
                quantity=1,
                cost=cost,
                user_id=user_id,
                metadata={
                    **(metadata or {}),
                    "endpoint": endpoint,
                    "model_id": model_id,
                    "tokens_used": tokens_used,
                    "processing_time": processing_time,
                    "request_type": request_type,
                    "cost_breakdown": {
                        "base_cost": str(cost),
                        "model_cost": str(cost * Decimal("0.8")),
                        "infrastructure_cost": str(cost * Decimal("0.2"))
                    }
                }
            )
            self.db.add(usage_log)

            # Update tenant API usage counters
            await self._update_tenant_api_usage(tenant, request_type, cost, tokens_used)

            # Update cost analytics
            await self._update_cost_analytics(tenant_id, endpoint, model_id, cost)

            self.db.commit()
            return usage_log

        except Exception as e:
            logger.error(f"Failed to track API cost: {str(e)}")
            self.db.rollback()
            raise

    async def _check_api_cost_limits(self, tenant: Tenant, cost: Decimal, request_type: str):
        """Check if API cost is within tenant limits."""
        plan_features = tenant.get_plan_features()
        api_limits = plan_features.get("api_cost_limits", {})

        # Check monthly budget
        monthly_budget = api_limits.get("monthly_api_budget", Decimal("100.00"))
        if tenant.current_month_api_cost + cost > monthly_budget:
            raise ValueError("Monthly API budget exceeded")

        # Check per-request limit
        max_cost_per_request = api_limits.get("max_cost_per_request", Decimal("1.00"))
        if cost > max_cost_per_request:
            raise ValueError(f"Cost per request exceeds limit: ${max_cost_per_request}")

        # Check request-type specific limits
        request_limits = {
            "ai_inference": api_limits.get("ai_inference_requests", 10000),
            "ai_streaming": api_limits.get("ai_streaming_requests", 1000),
            "ai_batch": api_limits.get("ai_batch_requests", 500),
            "smart_inference": api_limits.get("smart_inference_requests", 1000),
            "model_optimization": api_limits.get("model_optimization_requests", 100),
            "batch_job": api_limits.get("batch_job_requests", 50),
            "fine_tune": api_limits.get("fine_tune_jobs", 10),
            "ab_test": api_limits.get("ab_test_runs", 20)
        }

        limit = request_limits.get(request_type, 1000)
        current_usage = getattr(tenant, f"current_month_{request_type}_requests", 0)

        if current_usage >= limit:
            raise ValueError(f"{request_type} request limit exceeded: {limit}")

    async def _update_tenant_api_usage(self, tenant: Tenant, request_type: str, cost: Decimal, tokens_used: Optional[int]):
        """Update tenant API usage counters."""
        # Update monthly cost
        tenant.current_month_api_cost = (tenant.current_month_api_cost or Decimal("0.00")) + cost

        # Update request counters
        counter_attr = f"current_month_{request_type}_requests"
        current_count = getattr(tenant, counter_attr, 0) or 0
        setattr(tenant, counter_attr, current_count + 1)

        # Update tokens used if provided
        if tokens_used:
            tenant.current_month_tokens_used = (tenant.current_month_tokens_used or 0) + tokens_used

        # Update cost by endpoint/model tracking
        if not hasattr(tenant, 'api_cost_breakdown'):
            tenant.api_cost_breakdown = {}

        # This would be stored as JSON in the database
        cost_breakdown = tenant.api_cost_breakdown or {}
        # Implementation would update cost breakdown here

    async def _update_cost_analytics(self, tenant_id: UUID, endpoint: str, model_id: str, cost: Decimal):
        """Update cost analytics for reporting."""
        # This would update Redis-based analytics
        # Implementation would store cost analytics here
        pass

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
            tenant = (
                self.db.query(Tenant).filter(Tenant.id == tenant_id).first()
            )
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
            query = self.db.query(UsageLog).filter(
                UsageLog.tenant_id == tenant_id
            )

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
                summary["resource_breakdown"][log.resource_type][
                    "cost"
                ] += log.cost

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
        self,
        billing_record_id: UUID,
        stripe_payment_intent_id: Optional[str] = None,
    ) -> BillingRecord:
        """Mark a billing record as paid."""
        try:
            billing_record = (
                self.db.query(BillingRecord)
                .filter(BillingRecord.id == billing_record_id)
                .first()
            )
            if not billing_record:
                raise ValueError(
                    f"Billing record {billing_record_id} not found"
                )

            billing_record.status = "paid"
            billing_record.paid_at = datetime.utcnow()
            if stripe_payment_intent_id:
                billing_record.stripe_payment_intent_id = (
                    stripe_payment_intent_id
                )

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

    def _update_tenant_plan_limits(
        self, tenant: Tenant, plan: SubscriptionPlan
    ):
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
            billing_period_start=datetime.fromtimestamp(
                invoice.get("period_start", 0)
            ),
            billing_period_end=datetime.fromtimestamp(
                invoice.get("period_end", 0)
            ),
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
    async def get_api_cost_analytics(self, tenant_id: UUID, days: int = 30) -> Dict:
        """Get comprehensive API cost analytics for a tenant."""
        try:
            # Calculate date range
            end_date = datetime.utcnow()
            start_date = end_date - timedelta(days=days)

            # Get API usage logs
            api_usage = (
                self.db.query(UsageLog)
                .filter(
                    UsageLog.tenant_id == tenant_id,
                    UsageLog.resource_type.like("api_%"),
                    UsageLog.timestamp >= start_date,
                    UsageLog.timestamp <= end_date
                )
                .all()
            )

            # Analyze costs by endpoint
            cost_by_endpoint = {}
            cost_by_model = {}
            cost_by_request_type = {}
            daily_costs = {}

            total_cost = Decimal("0.00")
            total_requests = 0
            total_tokens = 0

            for log in api_usage:
                total_cost += log.cost
                total_requests += log.quantity

                # Extract metadata
                metadata = log.metadata or {}
                endpoint = metadata.get("endpoint", "unknown")
                model_id = metadata.get("model_id", "unknown")
                request_type = metadata.get("request_type", "unknown")
                tokens_used = metadata.get("tokens_used", 0)

                total_tokens += tokens_used

                # Cost by endpoint
                if endpoint not in cost_by_endpoint:
                    cost_by_endpoint[endpoint] = {"cost": Decimal("0.00"), "requests": 0}
                cost_by_endpoint[endpoint]["cost"] += log.cost
                cost_by_endpoint[endpoint]["requests"] += log.quantity

                # Cost by model
                if model_id not in cost_by_model:
                    cost_by_model[model_id] = {"cost": Decimal("0.00"), "requests": 0}
                cost_by_model[model_id]["cost"] += log.cost
                cost_by_model[model_id]["requests"] += log.quantity

                # Cost by request type
                if request_type not in cost_by_request_type:
                    cost_by_request_type[request_type] = {"cost": Decimal("0.00"), "requests": 0}
                cost_by_request_type[request_type]["cost"] += log.cost
                cost_by_request_type[request_type]["requests"] += log.quantity

                # Daily costs
                date_key = log.timestamp.date().isoformat()
                if date_key not in daily_costs:
                    daily_costs[date_key] = {"cost": Decimal("0.00"), "requests": 0}
                daily_costs[date_key]["cost"] += log.cost
                daily_costs[date_key]["requests"] += log.quantity

            # Calculate averages
            avg_cost_per_request = total_cost / max(total_requests, 1)
            avg_cost_per_token = total_cost / max(total_tokens, 1)

            # Get tenant for budget comparison
            tenant = (
                self.db.query(Tenant).filter(Tenant.id == tenant_id).first()
            )
            plan_features = tenant.get_plan_features() if tenant else {}
            api_limits = plan_features.get("api_cost_limits", {})
            monthly_budget = api_limits.get("monthly_api_budget", Decimal("100.00"))

            # Generate recommendations
            recommendations = []
            budget_utilization = (total_cost / monthly_budget) * 100 if monthly_budget > 0 else 0

            if budget_utilization > 80:
                recommendations.append("Consider upgrading your plan or optimizing usage to stay within budget")

            if avg_cost_per_request > Decimal("0.05"):
                recommendations.append("Your average cost per request is high - consider using smaller models or batch processing")

            # Find most expensive endpoint
            most_expensive_endpoint = max(cost_by_endpoint.items(), key=lambda x: x[1]["cost"]) if cost_by_endpoint else None
            if most_expensive_endpoint and most_expensive_endpoint[1]["cost"] > total_cost * Decimal("0.5"):
                recommendations.append(f"Optimize usage of {most_expensive_endpoint[0]} - it accounts for 50% of costs")

            return {
                "period": {
                    "start_date": start_date,
                    "end_date": end_date,
                    "days": days
                },
                "summary": {
                    "total_cost": total_cost,
                    "total_requests": total_requests,
                    "total_tokens": total_tokens,
                    "avg_cost_per_request": avg_cost_per_request,
                    "avg_cost_per_token": avg_cost_per_token,
                    "budget_utilization": budget_utilization,
                    "monthly_budget": monthly_budget
                },
                "breakdown": {
                    "by_endpoint": cost_by_endpoint,
                    "by_model": cost_by_model,
                    "by_request_type": cost_by_request_type,
                    "daily_costs": daily_costs
                },
                "insights": {
                    "most_expensive_endpoint": most_expensive_endpoint[0] if most_expensive_endpoint else None,
                    "most_used_model": max(cost_by_model.items(), key=lambda x: x[1]["requests"])[0] if cost_by_model else None,
                    "cost_trend": list(daily_costs.values())
                },
                "recommendations": recommendations
            }

        except Exception as e:
            logger.error(f"Failed to get API cost analytics: {str(e)}")
            raise

    async def get_tenant_billing_info(self, tenant_id: UUID) -> Dict:
        """Get comprehensive billing information for a tenant."""
        try:
            tenant = (
                self.db.query(Tenant).filter(Tenant.id == tenant_id).first()
            )
            if not tenant:
                raise ValueError(f"Tenant {tenant_id} not found")

            # Get current month usage
            start_of_month = datetime.utcnow().replace(
                day=1, hour=0, minute=0, second=0, microsecond=0
            )
            usage_summary = await self.get_usage_summary(
                tenant_id, start_of_month
            )

            # Get API cost analytics
            api_cost_analytics = await self.get_api_cost_analytics(tenant_id, 30)

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
                "api_costs": api_cost_analytics,
                "billing": {
                    "monthly_budget": tenant.monthly_budget,
                    "current_month_api_cost": tenant.current_month_api_cost,
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
