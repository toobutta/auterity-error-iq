"""SaaS management API endpoints for subscription, billing, and white-label features."""

import logging
from datetime import datetime
from typing import Dict, List, Optional
from uuid import UUID

import stripe
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_tenant, get_current_user, get_db
from app.core.config import settings
from app.models.tenant import Tenant
from app.models.user import User
from app.schemas.saas import (
    BillingInfo,
    BrandingPreview,
    BrandingUpdate,
    ComplianceReport,
    Request,
    SubscriptionCreate,
    SubscriptionUpdate,
    UsageSummary,
)
from app.services.billing_service import BillingService
from app.services.branding_service import BrandingService

logger = logging.getLogger(__name__)

router = APIRouter()


# Subscription Management Endpoints
@router.post("/subscriptions", response_model=Dict)
async def create_subscription(
    subscription_data: SubscriptionCreate,
    current_user: User = Depends(get_current_user),
    current_tenant: Tenant = Depends(get_current_tenant),
    db: Session = Depends(get_db),
):
    """Create a new subscription for the current tenant."""
    try:
        billing_service = BillingService(db)

        # Check if user has permission to manage subscriptions
        if not current_user.has_permission("tenant:admin"):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions to manage subscriptions",
            )

        # Create subscription
        tenant, client_secret = await billing_service.create_subscription(
            tenant_id=current_tenant.id,
            plan=subscription_data.plan,
            payment_method_id=subscription_data.payment_method_id,
            trial_days=subscription_data.trial_days or 14,
        )

        return {
            "message": "Subscription created successfully",
            "tenant_id": str(tenant.id),
            "plan": tenant.subscription_plan,
            "status": tenant.status,
            "client_secret": client_secret,
            "trial_end": tenant.trial_end,
        }

    except Exception as e:
        logger.error(f"Failed to create subscription: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create subscription: {str(e)}",
        )


@router.put("/subscriptions", response_model=Dict)
async def update_subscription(
    subscription_data: SubscriptionUpdate,
    current_user: User = Depends(get_current_user),
    current_tenant: Tenant = Depends(get_current_tenant),
    db: Session = Depends(get_db),
):
    """Update tenant subscription plan."""
    try:
        billing_service = BillingService(db)

        # Check if user has permission to manage subscriptions
        if not current_user.has_permission("tenant:admin"):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions to manage subscriptions",
            )

        # Update subscription
        tenant = await billing_service.update_subscription(
            tenant_id=current_tenant.id, new_plan=subscription_data.plan
        )

        return {
            "message": "Subscription updated successfully",
            "tenant_id": str(tenant.id),
            "plan": tenant.subscription_plan,
            "status": tenant.status,
            "updated_at": tenant.updated_at,
        }

    except Exception as e:
        logger.error(f"Failed to update subscription: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update subscription: {str(e)}",
        )


@router.delete("/subscriptions", response_model=Dict)
async def cancel_subscription(
    current_user: User = Depends(get_current_user),
    current_tenant: Tenant = Depends(get_current_tenant),
    db: Session = Depends(get_db),
):
    """Cancel tenant subscription."""
    try:
        billing_service = BillingService(db)

        # Check if user has permission to manage subscriptions
        if not current_user.has_permission("tenant:admin"):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions to manage subscriptions",
            )

        # Cancel subscription
        tenant = await billing_service.cancel_subscription(
            tenant_id=current_tenant.id
        )

        return {
            "message": "Subscription cancelled successfully",
            "tenant_id": str(tenant.id),
            "status": tenant.status,
            "cancelled_at": tenant.updated_at,
        }

    except Exception as e:
        logger.error(f"Failed to cancel subscription: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to cancel subscription: {str(e)}",
        )


# Billing Information Endpoints
@router.get("/billing", response_model=BillingInfo)
async def get_billing_info(
    current_user: User = Depends(get_current_user),
    current_tenant: Tenant = Depends(get_current_tenant),
    db: Session = Depends(get_db),
):
    """Get comprehensive billing information for the current tenant."""
    try:
        billing_service = BillingService(db)

        billing_info = await billing_service.get_tenant_billing_info(
            tenant_id=current_tenant.id
        )

        return billing_info

    except Exception as e:
        logger.error(f"Failed to get billing info: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get billing info: {str(e)}",
        )


@router.get("/billing/plans", response_model=List[Dict])
async def get_available_plans():
    """Get available subscription plans and their features."""
    plans = [
        {
            "id": "starter",
            "name": "Starter Plan",
            "price": 99.00,
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
            },
            "description": "Perfect for small teams getting started with automation",
        },
        {
            "id": "professional",
            "name": "Professional Plan",
            "price": 299.00,
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
            },
            "description": "Ideal for growing businesses with advanced needs",
        },
        {
            "id": "enterprise",
            "name": "Enterprise Plan",
            "price": 999.00,
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
            },
            "description": "For large organizations with enterprise requirements",
        },
        {
            "id": "white_label_starter",
            "name": "White-Label Starter",
            "price": 499.00,
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
            },
            "description": "Start building your own branded automation platform",
        },
        {
            "id": "white_label_enterprise",
            "name": "White-Label Enterprise",
            "price": 1999.00,
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
            },
            "description": "Full white-label solution for enterprise partners",
        },
    ]

    return plans


# Usage Tracking Endpoints
@router.get("/usage", response_model=UsageSummary)
async def get_usage_summary(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    current_tenant: Tenant = Depends(get_current_tenant),
    db: Session = Depends(get_db),
):
    """Get usage summary for the current tenant."""
    try:
        billing_service = BillingService(db)

        # Parse dates if provided
        from datetime import datetime

        parsed_start = None
        parsed_end = None

        if start_date:
            parsed_start = datetime.fromisoformat(
                start_date.replace("Z", "+00:00")
            )
        if end_date:
            parsed_end = datetime.fromisoformat(
                end_date.replace("Z", "+00:00")
            )

        usage_summary = await billing_service.get_usage_summary(
            tenant_id=current_tenant.id,
            start_date=parsed_start,
            end_date=parsed_end,
        )

        return usage_summary

    except Exception as e:
        logger.error(f"Failed to get usage summary: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get usage summary: {str(e)}",
        )


@router.post("/usage/track", response_model=Dict)
async def track_usage(
    resource_type: str = Form(...),
    quantity: int = Form(1),
    cost: float = Form(0.00),
    workflow_id: Optional[str] = Form(None),
    metadata: Optional[str] = Form(None),
    current_user: User = Depends(get_current_user),
    current_tenant: Tenant = Depends(get_current_tenant),
    db: Session = Depends(get_db),
):
    """Track resource usage for billing purposes."""
    try:
        billing_service = BillingService(db)

        # Parse metadata if provided
        import json

        parsed_metadata = None
        if metadata:
            try:
                parsed_metadata = json.loads(metadata)
            except json.JSONDecodeError:
                parsed_metadata = {"raw_metadata": metadata}

        # Parse workflow_id if provided
        parsed_workflow_id = None
        if workflow_id:
            try:
                parsed_workflow_id = UUID(workflow_id)
            except ValueError:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid workflow ID format",
                )

        # Track usage
        from decimal import Decimal

        usage_log = await billing_service.track_usage(
            tenant_id=current_tenant.id,
            resource_type=resource_type,
            quantity=quantity,
            cost=Decimal(str(cost)),
            user_id=current_user.id,
            workflow_id=parsed_workflow_id,
            metadata=parsed_metadata,
        )

        return {
            "message": "Usage tracked successfully",
            "usage_id": str(usage_log.id),
            "resource_type": usage_log.resource_type,
            "quantity": usage_log.quantity,
            "cost": float(usage_log.cost),
            "timestamp": usage_log.timestamp,
        }

    except Exception as e:
        logger.error(f"Failed to track usage: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to track usage: {str(e)}",
        )


# White-Label Branding Endpoints
@router.get("/branding", response_model=Dict)
async def get_branding_config(
    current_user: User = Depends(get_current_user),
    current_tenant: Tenant = Depends(get_current_tenant),
    db: Session = Depends(get_db),
):
    """Get current branding configuration for the tenant."""
    try:
        branding_service = BrandingService(db)

        theme = await branding_service.get_tenant_theme(
            tenant_id=current_tenant.id
        )

        return theme

    except Exception as e:
        logger.error(f"Failed to get branding config: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get branding config: {str(e)}",
        )


@router.put("/branding", response_model=Dict)
async def update_branding(
    branding_data: BrandingUpdate,
    current_user: User = Depends(get_current_user),
    current_tenant: Tenant = Depends(get_current_tenant),
    db: Session = Depends(get_db),
):
    """Update tenant branding configuration."""
    try:
        branding_service = BrandingService(db)

        # Check if user has permission to manage branding
        if not current_user.has_permission("tenant:admin"):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions to manage branding",
            )

        # Update branding
        tenant = await branding_service.update_tenant_branding(
            tenant_id=current_tenant.id,
            branding_data=branding_data.dict(exclude_unset=True),
        )

        return {
            "message": "Branding updated successfully",
            "tenant_id": str(tenant.id),
            "updated_at": tenant.updated_at,
        }

    except Exception as e:
        logger.error(f"Failed to update branding: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update branding: {str(e)}",
        )


@router.post("/branding/logo", response_model=Dict)
async def upload_logo(
    logo_file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    current_tenant: Tenant = Depends(get_current_tenant),
    db: Session = Depends(get_db),
):
    """Upload tenant logo for white-label branding."""
    try:
        branding_service = BrandingService(db)

        # Check if user has permission to manage branding
        if not current_user.has_permission("tenant:admin"):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions to manage branding",
            )

        # Read file content
        file_content = await logo_file.read()

        # Upload logo
        logo_url = await branding_service.upload_logo(
            tenant_id=current_tenant.id,
            logo_file=file_content,
            filename=logo_file.filename,
        )

        return {
            "message": "Logo uploaded successfully",
            "logo_url": logo_url,
            "filename": logo_file.filename,
        }

    except Exception as e:
        logger.error(f"Failed to upload logo: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload logo: {str(e)}",
        )


@router.get("/branding/preview", response_model=BrandingPreview)
async def get_branding_preview(
    current_user: User = Depends(get_current_user),
    current_tenant: Tenant = Depends(get_current_tenant),
    db: Session = Depends(get_db),
):
    """Get branding preview with sample elements."""
    try:
        branding_service = BrandingService(db)

        preview = await branding_service.get_branding_preview(
            tenant_id=current_tenant.id
        )

        return preview

    except Exception as e:
        logger.error(f"Failed to get branding preview: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get branding preview: {str(e)}",
        )


@router.get("/branding/compliance", response_model=ComplianceReport)
async def get_branding_compliance(
    current_user: User = Depends(get_current_user),
    current_tenant: Tenant = Depends(get_current_tenant),
    db: Session = Depends(get_db),
):
    """Get branding compliance report."""
    try:
        branding_service = BrandingService(db)

        compliance_report = (
            await branding_service.validate_branding_compliance(
                tenant_id=current_tenant.id
            )
        )

        return compliance_report

    except Exception as e:
        logger.error(f"Failed to get branding compliance: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get branding compliance: {str(e)}",
        )


@router.get("/branding/css", response_model=Dict)
async def get_custom_css(
    current_user: User = Depends(get_current_user),
    current_tenant: Tenant = Depends(get_current_tenant),
    db: Session = Depends(get_db),
):
    """Get custom CSS for tenant branding."""
    try:
        branding_service = BrandingService(db)

        custom_css = await branding_service.generate_custom_css(
            tenant_id=current_tenant.id
        )

        return {"css": custom_css, "content_type": "text/css"}

    except Exception as e:
        logger.error(f"Failed to get custom CSS: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get custom CSS: {str(e)}",
        )


# Stripe Webhook Endpoint
@router.post("/webhooks/stripe")
async def stripe_webhook(request: Request, db: Session = Depends(get_db)):
    """Handle Stripe webhook events."""
    try:
        # Get the webhook payload
        payload = await request.body()
        sig_header = request.headers.get("stripe-signature")

        # Verify webhook signature
        try:
            event = stripe.Webhook.construct_event(
                payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
            )
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid payload",
            )
        except stripe.error.SignatureVerificationError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid signature",
            )

        # Handle the webhook
        billing_service = BillingService(db)
        success = await billing_service.handle_stripe_webhook(event)

        if success:
            return {"status": "success"}
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to process webhook",
            )

    except Exception as e:
        logger.error(f"Failed to process Stripe webhook: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process webhook: {str(e)}",
        )


# Health Check Endpoint
@router.get("/health")
async def health_check():
    """Health check endpoint for SaaS services."""
    return {
        "status": "healthy",
        "service": "saas-management",
        "timestamp": datetime.utcnow().isoformat(),
    }
