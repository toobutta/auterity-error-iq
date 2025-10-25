"""SSO authentication API endpoints."""

from typing import Optional

from fastapi import (
    APIRouter,
    Depends,
    Form,
    HTTPException,
    Query,
    Request,
    Response,
    status,
)
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas import SSOInitiateResponse, SSOLoginResponse
from app.services.audit_service import AuditService
from app.services.sso_service import SSOService

router = APIRouter(prefix="/sso", tags=["sso"])


@router.get("/saml/login/{tenant_slug}", response_model=SSOInitiateResponse)
async def initiate_saml_login(
    tenant_slug: str,
    relay_state: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    """Initiate SAML login flow for a tenant."""
    sso_service = SSOService(db)
    audit_service = AuditService(db)

    try:
        redirect_url = await sso_service.initiate_saml_login(
            tenant_slug, relay_state
        )

        # Log SSO initiation
        from app.models.tenant import Tenant

        tenant = db.query(Tenant).filter(Tenant.slug == tenant_slug).first()
        if tenant:
            audit_service.log_authentication(
                tenant_id=tenant.id,
                user=None,
                action="saml_login_initiated",
                metadata={"tenant_slug": tenant_slug},
            )

        return SSOInitiateResponse(
            redirect_url=redirect_url, provider="saml", tenant_slug=tenant_slug
        )

    except Exception as e:
        # Log failed SSO initiation
        from app.models.tenant import Tenant

        tenant = db.query(Tenant).filter(Tenant.slug == tenant_slug).first()
        if tenant:
            audit_service.log_authentication(
                tenant_id=tenant.id,
                user=None,
                action="saml_login_failed",
                status="failure",
                error_message=str(e),
                metadata={"tenant_slug": tenant_slug},
            )
        raise


@router.post("/saml/acs", response_model=SSOLoginResponse)
async def handle_saml_response(
    request: Request,
    SAMLResponse: str = Form(...),
    RelayState: Optional[str] = Form(None),
    db: Session = Depends(get_db),
):
    """Handle SAML Assertion Consumer Service (ACS) callback."""
    sso_service = SSOService(db)
    audit_service = AuditService(db)

    try:
        auth_result = await sso_service.handle_saml_response(
            SAMLResponse, RelayState
        )

        # Log successful SAML authentication
        from app.models.user import User

        user = (
            db.query(User).filter(User.id == auth_result["user"]["id"]).first()
        )
        if user:
            audit_service.log_authentication(
                tenant_id=user.tenant_id,
                user=user,
                action="saml_login_success",
                request=request,
                metadata={"provider": "saml"},
            )

        return SSOLoginResponse(**auth_result)

    except Exception as e:
        # Log failed SAML authentication
        audit_service.log_security_event(
            tenant_id=None,  # We don't have tenant context on failure
            event_type="authentication",
            action="saml_login_failed",
            request=request,
            status="failure",
            error_message=str(e),
        )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"SAML authentication failed: {str(e)}",
        )


@router.get("/oidc/login/{tenant_slug}", response_model=SSOInitiateResponse)
async def initiate_oidc_login(
    tenant_slug: str,
    state: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    """Initiate OIDC login flow for a tenant."""
    sso_service = SSOService(db)
    audit_service = AuditService(db)

    try:
        redirect_url = await sso_service.initiate_oidc_login(
            tenant_slug, state
        )

        # Log OIDC initiation
        from app.models.tenant import Tenant

        tenant = db.query(Tenant).filter(Tenant.slug == tenant_slug).first()
        if tenant:
            audit_service.log_authentication(
                tenant_id=tenant.id,
                user=None,
                action="oidc_login_initiated",
                metadata={"tenant_slug": tenant_slug},
            )

        return SSOInitiateResponse(
            redirect_url=redirect_url, provider="oidc", tenant_slug=tenant_slug
        )

    except Exception as e:
        # Log failed OIDC initiation
        from app.models.tenant import Tenant

        tenant = db.query(Tenant).filter(Tenant.slug == tenant_slug).first()
        if tenant:
            audit_service.log_authentication(
                tenant_id=tenant.id,
                user=None,
                action="oidc_login_failed",
                status="failure",
                error_message=str(e),
                metadata={"tenant_slug": tenant_slug},
            )
        raise


@router.get("/oidc/callback", response_model=SSOLoginResponse)
async def handle_oidc_callback(
    request: Request,
    code: str = Query(...),
    state: Optional[str] = Query(None),
    error: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    """Handle OIDC callback."""
    if error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"OIDC authentication error: {error}",
        )

    sso_service = SSOService(db)
    audit_service = AuditService(db)

    try:
        auth_result = await sso_service.handle_oidc_callback(code, state)

        # Log successful OIDC authentication
        from app.models.user import User

        user = (
            db.query(User).filter(User.id == auth_result["user"]["id"]).first()
        )
        if user:
            audit_service.log_authentication(
                tenant_id=user.tenant_id,
                user=user,
                action="oidc_login_success",
                request=request,
                metadata={"provider": "oidc"},
            )

        return SSOLoginResponse(**auth_result)

    except Exception as e:
        # Log failed OIDC authentication
        audit_service.log_security_event(
            tenant_id=None,  # We don't have tenant context on failure
            event_type="authentication",
            action="oidc_login_failed",
            request=request,
            status="failure",
            error_message=str(e),
        )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"OIDC authentication failed: {str(e)}",
        )


@router.get("/metadata/{tenant_slug}/saml")
async def get_saml_metadata(tenant_slug: str, db: Session = Depends(get_db)):
    """Get SAML metadata for a tenant."""
    from app.models.tenant import SSOConfiguration, Tenant

    tenant = db.query(Tenant).filter(Tenant.slug == tenant_slug).first()
    if not tenant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Tenant not found"
        )

    sso_config = (
        db.query(SSOConfiguration)
        .filter(
            SSOConfiguration.tenant_id == tenant.id,
            SSOConfiguration.provider == "saml",
            SSOConfiguration.is_active,
        )
        .first()
    )

    if not sso_config:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="SAML not configured for this tenant",
        )

    # Generate SAML metadata XML
    metadata_xml = f"""<?xml version="1.0" encoding="UTF-8"?>
<md:EntityDescriptor xmlns:md="urn:oasis:names:tc:SAML:2.0:metadata"
                     entityID="{sso_config.saml_entity_id}">
    <md:SPSSODescriptor protocolSupportEnumeration="urn:oasis:names:tc:SAML:2.0:protocol">
        <md:AssertionConsumerService
            Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST"
            Location="{sso_config.oidc_redirect_uri}"
            index="0" />
    </md:SPSSODescriptor>
</md:EntityDescriptor>"""

    return Response(
        content=metadata_xml,
        media_type="application/xml",
        headers={
            "Content-Disposition": f"attachment; filename={tenant_slug}-saml-metadata.xml"
        },
    )


@router.get("/.well-known/openid_configuration/{tenant_slug}")
async def get_oidc_configuration(
    tenant_slug: str, db: Session = Depends(get_db)
):
    """Get OIDC configuration for a tenant."""
    from app.models.tenant import SSOConfiguration, Tenant

    tenant = db.query(Tenant).filter(Tenant.slug == tenant_slug).first()
    if not tenant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Tenant not found"
        )

    sso_config = (
        db.query(SSOConfiguration)
        .filter(
            SSOConfiguration.tenant_id == tenant.id,
            SSOConfiguration.provider == "oidc",
            SSOConfiguration.is_active,
        )
        .first()
    )

    if not sso_config:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="OIDC not configured for this tenant",
        )

    return {
        "issuer": sso_config.oidc_issuer,
        "authorization_endpoint": f"{sso_config.oidc_issuer}/auth",
        "token_endpoint": f"{sso_config.oidc_issuer}/token",
        "userinfo_endpoint": f"{sso_config.oidc_issuer}/userinfo",
        "jwks_uri": f"{sso_config.oidc_issuer}/.well-known/jwks.json",
        "response_types_supported": ["code"],
        "subject_types_supported": ["public"],
        "id_token_signing_alg_values_supported": ["RS256"],
        "scopes_supported": ["openid", "profile", "email"],
    }
