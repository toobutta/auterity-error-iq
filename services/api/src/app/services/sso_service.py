"""SSO service for SAML and OIDC authentication."""

import base64
import xml.etree.ElementTree as ET
from datetime import datetime
from typing import Dict, Optional
from urllib.parse import urlencode

import httpx
from fastapi import HTTPException, status
import jwt
from sqlalchemy.orm import Session

from app.auth import create_access_token
from app.models.tenant import SSOConfiguration, Tenant
from app.models.user import Role, User


class SSOService:
    """Service for handling SSO authentication."""

    def __init__(self, db: Session):
        self.db = db

    async def initiate_saml_login(
        self, tenant_slug: str, relay_state: Optional[str] = None
    ) -> str:
        """Initiate SAML login flow."""
        tenant = (
            self.db.query(Tenant).filter(Tenant.slug == tenant_slug).first()
        )
        if not tenant or not tenant.sso_enabled:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="SSO not configured for this tenant",
            )

        sso_config = (
            self.db.query(SSOConfiguration)
            .filter(
                SSOConfiguration.tenant_id == tenant.id,
                SSOConfiguration.provider == "saml",
                SSOConfiguration.is_active,
            )
            .first()
        )

        if not sso_config:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="SAML not configured for this tenant",
            )

        # Generate SAML AuthnRequest
        authn_request = self._generate_saml_authn_request(
            sso_config, relay_state
        )

        # Encode and redirect
        encoded_request = base64.b64encode(authn_request.encode()).decode()

        params = {
            "SAMLRequest": encoded_request,
            "RelayState": relay_state or "",
        }

        return f"{sso_config.saml_sso_url}?{urlencode(params)}"

    async def handle_saml_response(
        self, saml_response: str, relay_state: Optional[str] = None
    ) -> Dict:
        """Handle SAML response and authenticate user."""
        try:
            # Decode SAML response
            decoded_response = base64.b64decode(saml_response).decode()

            # Parse SAML response
            user_data = self._parse_saml_response(decoded_response)

            # Find tenant from relay state or assertion
            tenant = self._get_tenant_from_saml_data(user_data, relay_state)

            # Authenticate or create user
            user = await self._authenticate_or_create_saml_user(
                tenant, user_data
            )

            # Generate JWT token
            token_data = {
                "sub": user.email,
                "user_id": str(user.id),
                "tenant_id": str(user.tenant_id),
                "name": user.name,
                "permissions": user.get_permissions(),
                "sso_provider": "saml",
            }

            access_token = create_access_token(data=token_data)

            return {
                "access_token": access_token,
                "token_type": "bearer",
                "user": {
                    "id": str(user.id),
                    "email": user.email,
                    "name": user.name,
                    "tenant_id": str(user.tenant_id),
                },
            }

        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"SAML authentication failed: {str(e)}",
            )

    async def initiate_oidc_login(
        self, tenant_slug: str, state: Optional[str] = None
    ) -> str:
        """Initiate OIDC login flow."""
        tenant = (
            self.db.query(Tenant).filter(Tenant.slug == tenant_slug).first()
        )
        if not tenant or not tenant.sso_enabled:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="SSO not configured for this tenant",
            )

        sso_config = (
            self.db.query(SSOConfiguration)
            .filter(
                SSOConfiguration.tenant_id == tenant.id,
                SSOConfiguration.provider == "oidc",
                SSOConfiguration.is_active,
            )
            .first()
        )

        if not sso_config:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="OIDC not configured for this tenant",
            )

        # Build authorization URL
        params = {
            "response_type": "code",
            "client_id": sso_config.oidc_client_id,
            "redirect_uri": sso_config.oidc_redirect_uri,
            "scope": "openid profile email",
            "state": state or f"tenant:{tenant.slug}",
        }

        auth_url = f"{sso_config.oidc_issuer}/auth?{urlencode(params)}"
        return auth_url

    async def handle_oidc_callback(
        self, code: str, state: Optional[str] = None
    ) -> Dict:
        """Handle OIDC callback and authenticate user."""
        try:
            # Extract tenant from state
            tenant = self._get_tenant_from_oidc_state(state)

            sso_config = (
                self.db.query(SSOConfiguration)
                .filter(
                    SSOConfiguration.tenant_id == tenant.id,
                    SSOConfiguration.provider == "oidc",
                    SSOConfiguration.is_active,
                )
                .first()
            )

            if not sso_config:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="OIDC not configured",
                )

            # Exchange code for tokens
            token_data = await self._exchange_oidc_code(sso_config, code)

            # Get user info from ID token
            user_data = self._parse_oidc_id_token(token_data["id_token"])

            # Authenticate or create user
            user = await self._authenticate_or_create_oidc_user(
                tenant, user_data
            )

            # Generate JWT token
            jwt_data = {
                "sub": user.email,
                "user_id": str(user.id),
                "tenant_id": str(user.tenant_id),
                "name": user.name,
                "permissions": user.get_permissions(),
                "sso_provider": "oidc",
            }

            access_token = create_access_token(data=jwt_data)

            return {
                "access_token": access_token,
                "token_type": "bearer",
                "user": {
                    "id": str(user.id),
                    "email": user.email,
                    "name": user.name,
                    "tenant_id": str(user.tenant_id),
                },
            }

        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"OIDC authentication failed: {str(e)}",
            )

    def _generate_saml_authn_request(
        self, sso_config: SSOConfiguration, relay_state: Optional[str]
    ) -> str:
        """Generate SAML AuthnRequest XML."""
        request_id = f"_auterity_{datetime.utcnow().strftime('%Y%m%d%H%M%S')}"
        timestamp = datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")

        authn_request = f"""<?xml version="1.0" encoding="UTF-8"?>
<samlp:AuthnRequest xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol"
                    xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion"
                    ID="{request_id}"
                    Version="2.0"
                    IssueInstant="{timestamp}"
                    Destination="{sso_config.saml_sso_url}"
                    AssertionConsumerServiceURL="{sso_config.oidc_redirect_uri}"
                    ProtocolBinding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST">
    <saml:Issuer>{sso_config.saml_entity_id}</saml:Issuer>
    <samlp:NameIDPolicy Format="urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress" AllowCreate="true"/>
</samlp:AuthnRequest>"""

        return authn_request

    def _parse_saml_response(self, saml_response: str) -> Dict:
        """Parse SAML response and extract user data."""
        try:
            root = ET.fromstring(saml_response)

            # Extract user attributes
            user_data = {}

            # Find assertion
            assertion = root.find(
                ".//{urn:oasis:names:tc:SAML:2.0:assertion}Assertion"
            )
            if assertion is None:
                raise ValueError("No assertion found in SAML response")

            # Extract NameID (email)
            name_id = assertion.find(
                ".//{urn:oasis:names:tc:SAML:2.0:assertion}NameID"
            )
            if name_id is not None:
                user_data["email"] = name_id.text

            # Extract attributes
            attr_statements = assertion.findall(
                ".//{urn:oasis:names:tc:SAML:2.0:assertion}AttributeStatement"
            )
            for attr_statement in attr_statements:
                attributes = attr_statement.findall(
                    ".//{urn:oasis:names:tc:SAML:2.0:assertion}Attribute"
                )
                for attr in attributes:
                    attr_name = attr.get("Name")
                    attr_values = attr.findall(
                        ".//{urn:oasis:names:tc:SAML:2.0:assertion}AttributeValue"
                    )
                    if attr_values:
                        user_data[attr_name] = attr_values[0].text

            return user_data

        except ET.ParseError as e:
            raise ValueError(f"Invalid SAML response XML: {str(e)}")

    def _get_tenant_from_saml_data(
        self, user_data: Dict, relay_state: Optional[str]
    ) -> Tenant:
        """Get tenant from SAML data or relay state."""
        # Try to extract tenant from relay state
        if relay_state and relay_state.startswith("tenant:"):
            tenant_slug = relay_state.split(":", 1)[1]
            tenant = (
                self.db.query(Tenant)
                .filter(Tenant.slug == tenant_slug)
                .first()
            )
            if tenant:
                return tenant

        # Try to extract from email domain
        email = user_data.get("email", "")
        if "@" in email:
            domain = email.split("@")[1]
            tenant = (
                self.db.query(Tenant).filter(Tenant.domain == domain).first()
            )
            if tenant:
                return tenant

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot determine tenant from SAML response",
        )

    async def _authenticate_or_create_saml_user(
        self, tenant: Tenant, user_data: Dict
    ) -> User:
        """Authenticate or create user from SAML data."""
        email = user_data.get("email")
        if not email:
            raise ValueError("Email not found in SAML response")

        # Check if user exists
        user = (
            self.db.query(User)
            .filter(User.email == email, User.tenant_id == tenant.id)
            .first()
        )

        if user:
            # Update last login
            user.last_login = datetime.utcnow()
            self.db.commit()
            return user

        # Get SSO config for auto-provisioning
        sso_config = (
            self.db.query(SSOConfiguration)
            .filter(
                SSOConfiguration.tenant_id == tenant.id,
                SSOConfiguration.provider == "saml",
            )
            .first()
        )

        if not sso_config or not sso_config.auto_provision_users:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User not found and auto-provisioning is disabled",
            )

        # Create new user
        user = User(
            tenant_id=tenant.id,
            email=email,
            name=user_data.get("name", email.split("@")[0]),
            sso_provider="saml",
            sso_subject_id=user_data.get("subject_id", email),
            last_login=datetime.utcnow(),
        )

        # Assign default role
        default_role = (
            self.db.query(Role)
            .filter(Role.name == sso_config.default_role)
            .first()
        )
        if default_role:
            user.roles.append(default_role)

        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)

        return user

    async def _exchange_oidc_code(
        self, sso_config: SSOConfiguration, code: str
    ) -> Dict:
        """Exchange OIDC authorization code for tokens."""
        token_url = f"{sso_config.oidc_issuer}/token"

        data = {
            "grant_type": "authorization_code",
            "code": code,
            "redirect_uri": sso_config.oidc_redirect_uri,
            "client_id": sso_config.oidc_client_id,
            "client_secret": sso_config.oidc_client_secret,
        }

        async with httpx.AsyncClient() as client:
            response = await client.post(token_url, data=data)
            response.raise_for_status()
            return response.json()

    def _parse_oidc_id_token(self, id_token: str) -> Dict:
        """Parse OIDC ID token and extract user data.

        Decodes without signature verification; upstream OIDC verification should
        be performed when configured (issuer, audience, JWKS).
        """
        try:
            # Decode without signature verification
            payload = jwt.decode(
                id_token,
                options={"verify_signature": False, "verify_exp": False},
                algorithms=["HS256", "RS256", "ES256"],
            )
            return payload
        except Exception as e:
            raise ValueError(f"Invalid ID token: {str(e)}")

    def _get_tenant_from_oidc_state(self, state: Optional[str]) -> Tenant:
        """Get tenant from OIDC state parameter."""
        if not state or not state.startswith("tenant:"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid state parameter",
            )

        tenant_slug = state.split(":", 1)[1]
        tenant = (
            self.db.query(Tenant).filter(Tenant.slug == tenant_slug).first()
        )

        if not tenant:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Tenant not found",
            )

        return tenant

    async def _authenticate_or_create_oidc_user(
        self, tenant: Tenant, user_data: Dict
    ) -> User:
        """Authenticate or create user from OIDC data."""
        email = user_data.get("email")
        subject_id = user_data.get("sub")

        if not email or not subject_id:
            raise ValueError("Email or subject ID not found in OIDC token")

        # Check if user exists
        user = (
            self.db.query(User)
            .filter(User.email == email, User.tenant_id == tenant.id)
            .first()
        )

        if user:
            # Update last login
            user.last_login = datetime.utcnow()
            self.db.commit()
            return user

        # Get SSO config for auto-provisioning
        sso_config = (
            self.db.query(SSOConfiguration)
            .filter(
                SSOConfiguration.tenant_id == tenant.id,
                SSOConfiguration.provider == "oidc",
            )
            .first()
        )

        if not sso_config or not sso_config.auto_provision_users:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User not found and auto-provisioning is disabled",
            )

        # Create new user
        user = User(
            tenant_id=tenant.id,
            email=email,
            name=user_data.get("name", email.split("@")[0]),
            sso_provider="oidc",
            sso_subject_id=subject_id,
            last_login=datetime.utcnow(),
        )

        # Assign default role
        default_role = (
            self.db.query(Role)
            .filter(Role.name == sso_config.default_role)
            .first()
        )
        if default_role:
            user.roles.append(default_role)

        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)

        return user
