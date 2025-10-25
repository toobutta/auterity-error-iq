"""White-label branding service for tenant customization."""

import logging
import re
import time
from datetime import datetime
from pathlib import Path
from typing import Dict, Optional
from uuid import UUID

from sqlalchemy.orm import Session

from app.models.tenant import Tenant

logger = logging.getLogger(__name__)


class BrandingService:
    """Service for managing tenant white-label branding and customization."""

    def __init__(self, db: Session):
        self.db = db
        self.default_colors = {
            "primary": "#3B82F6",
            "secondary": "#10B981",
            "accent": "#F59E0B",
            "success": "#10B981",
            "warning": "#F59E0B",
            "error": "#EF4444",
            "info": "#3B82F6",
        }

    async def get_tenant_theme(self, tenant_id: UUID) -> Dict:
        """Get complete theme configuration for a tenant."""
        try:
            tenant = (
                self.db.query(Tenant).filter(Tenant.id == tenant_id).first()
            )
            if not tenant:
                raise ValueError(f"Tenant {tenant_id} not found")

            theme = {
                "primary_color": tenant.primary_color
                or self.default_colors["primary"],
                "secondary_color": tenant.secondary_color
                or self.default_colors["secondary"],
                "logo_url": tenant.logo_url or "/static/default-logo.png",
                "company_name": tenant.company_name or tenant.name,
                "custom_css": tenant.custom_css or "",
                "remove_auterity_branding": tenant.remove_auterity_branding
                or False,
                "custom_domain": tenant.custom_domain,
                "industry_profile": tenant.industry_profile,
            }

            # Add industry-specific theme overrides
            if tenant.industry_profile:
                industry_theme = self._get_industry_theme(
                    tenant.industry_profile
                )
                theme.update(industry_theme)

            return theme

        except Exception as e:
            logger.error(f"Failed to get tenant theme: {str(e)}")
            raise

    async def update_tenant_branding(
        self, tenant_id: UUID, branding_data: Dict
    ) -> Tenant:
        """Update tenant branding configuration."""
        try:
            tenant = (
                self.db.query(Tenant).filter(Tenant.id == tenant_id).first()
            )
            if not tenant:
                raise ValueError(f"Tenant {tenant_id} not found")

            # Validate and update branding fields
            if "primary_color" in branding_data:
                tenant.primary_color = self._validate_color(
                    branding_data["primary_color"]
                )

            if "secondary_color" in branding_data:
                tenant.secondary_color = self._validate_color(
                    branding_data["secondary_color"]
                )

            if "logo_url" in branding_data:
                tenant.logo_url = self._validate_logo_url(
                    branding_data["logo_url"]
                )

            if "company_name" in branding_data:
                tenant.company_name = branding_data["company_name"]

            if "custom_css" in branding_data:
                tenant.custom_css = self._validate_custom_css(
                    branding_data["custom_css"]
                )

            if "remove_auterity_branding" in branding_data:
                tenant.remove_auterity_branding = bool(
                    branding_data["remove_auterity_branding"]
                )

            if "custom_domain" in branding_data:
                tenant.custom_domain = self._validate_custom_domain(
                    branding_data["custom_domain"]
                )

            tenant.updated_at = datetime.utcnow()
            self.db.commit()

            return tenant

        except Exception as e:
            logger.error(f"Failed to update tenant branding: {str(e)}")
            self.db.rollback()
            raise

    async def generate_custom_css(self, tenant_id: UUID) -> str:
        """Generate custom CSS for tenant branding."""
        try:
            theme = await self.get_tenant_theme(tenant_id)

            css_variables = f"""
:root {{
    --primary-color: {theme['primary_color']};
    --secondary-color: {theme['secondary_color']};
    --accent-color: {self.default_colors['accent']};
    --success-color: {self.default_colors['success']};
    --warning-color: {self.default_colors['warning']};
    --error-color: {self.default_colors['error']};
    --info-color: {self.default_colors['info']};
    --company-name: "{theme['company_name']}";
}}
"""

            # Add custom CSS if provided
            if theme["custom_css"]:
                css_variables += f"\n{theme['custom_css']}"

            # Add industry-specific CSS
            if theme.get("industry_profile"):
                industry_css = self._get_industry_css(
                    theme["industry_profile"]
                )
                css_variables += f"\n{industry_css}"

            return css_variables

        except Exception as e:
            logger.error(f"Failed to generate custom CSS: {str(e)}")
            return ""

    async def upload_logo(
        self, tenant_id: UUID, logo_file: bytes, filename: str
    ) -> str:
        """Upload and store tenant logo."""
        try:
            # Validate file type and size
            if not self._is_valid_logo_file(filename, logo_file):
                raise ValueError("Invalid logo file format or size")

            # Generate unique filename
            file_extension = Path(filename).suffix
            unique_filename = (
                f"tenant_{tenant_id}_{int(time.time())}{file_extension}"
            )

            # Store file (implement your file storage logic here)
            logo_url = await self._store_logo_file(logo_file, unique_filename)

            # Update tenant logo URL
            tenant = (
                self.db.query(Tenant).filter(Tenant.id == tenant_id).first()
            )
            if tenant:
                tenant.logo_url = logo_url
                tenant.updated_at = datetime.utcnow()
                self.db.commit()

            return logo_url

        except Exception as e:
            logger.error(f"Failed to upload logo: {str(e)}")
            raise

    async def get_branding_preview(self, tenant_id: UUID) -> Dict:
        """Get branding preview with sample elements."""
        try:
            theme = await self.get_tenant_theme(tenant_id)

            preview = {
                "theme": theme,
                "sample_elements": {
                    "button": {
                        "primary": f"background-color: {theme['primary_color']}",
                        "secondary": f"background-color: {theme['secondary_color']}",
                    },
                    "header": {
                        "logo": theme["logo_url"],
                        "company_name": theme["company_name"],
                    },
                    "color_palette": {
                        "primary": theme["primary_color"],
                        "secondary": theme["secondary_color"],
                        "accent": self.default_colors["accent"],
                    },
                },
                "css_preview": await self.generate_custom_css(tenant_id),
            }

            return preview

        except Exception as e:
            logger.error(f"Failed to get branding preview: {str(e)}")
            raise

    async def validate_branding_compliance(self, tenant_id: UUID) -> Dict:
        """Validate tenant branding for compliance and best practices."""
        try:
            theme = await self.get_tenant_theme(tenant_id)

            compliance_checks = {
                "logo": self._validate_logo_compliance(theme.get("logo_url")),
                "colors": self._validate_color_compliance(theme),
                "css": self._validate_css_compliance(
                    theme.get("custom_css", "")
                ),
                "domain": self._validate_domain_compliance(
                    theme.get("custom_domain")
                ),
                "overall_score": 0,
            }

            # Calculate overall compliance score
            scores = [
                check.get("score", 0)
                for check in compliance_checks.values()
                if isinstance(check, dict)
            ]
            if scores:
                compliance_checks["overall_score"] = sum(scores) / len(scores)

            return compliance_checks

        except Exception as e:
            logger.error(f"Failed to validate branding compliance: {str(e)}")
            raise

    # Private helper methods
    def _validate_color(self, color: str) -> str:
        """Validate and normalize color value."""
        # Basic hex color validation
        if re.match(r"^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$", color):
            return color.upper()

        # Named color validation
        valid_colors = {
            "red",
            "blue",
            "green",
            "yellow",
            "orange",
            "purple",
            "pink",
            "brown",
            "gray",
            "black",
            "white",
            "cyan",
            "magenta",
        }
        if color.lower() in valid_colors:
            return color.lower()

        # Default fallback
        logger.warning(f"Invalid color value: {color}, using default")
        return self.default_colors["primary"]

    def _validate_logo_url(self, logo_url: str) -> str:
        """Validate logo URL format."""
        if not logo_url:
            return "/static/default-logo.png"

        # Basic URL validation
        if logo_url.startswith(("http://", "https://", "/static/", "/media/")):
            return logo_url

        logger.warning(f"Invalid logo URL: {logo_url}, using default")
        return "/static/default-logo.png"

    def _validate_custom_css(self, css: str) -> str:
        """Validate and sanitize custom CSS."""
        if not css:
            return ""

        # Basic CSS validation (prevent dangerous CSS)
        dangerous_patterns = [
            r"javascript:",
            r"expression\(",
            r"url\(javascript:",
            r"behavior:",
            r"import\s+url",
            r"@import\s+url",
        ]

        for pattern in dangerous_patterns:
            if re.search(pattern, css, re.IGNORECASE):
                logger.warning(
                    f"Potentially dangerous CSS pattern detected: {pattern}"
                )
                css = re.sub(pattern, "", css, flags=re.IGNORECASE)

        return css

    def _validate_custom_domain(self, domain: str) -> Optional[str]:
        """Validate custom domain format."""
        if not domain:
            return None

        # Basic domain validation
        domain_pattern = r"^[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?)*$"

        if re.match(domain_pattern, domain):
            return domain.lower()

        logger.warning(f"Invalid domain format: {domain}")
        return None

    def _get_industry_theme(self, industry_profile: str) -> Dict:
        """Get industry-specific theme overrides."""
        industry_themes = {
            "automotive": {
                "primary_color": "#1F2937",  # Dark gray
                "secondary_color": "#DC2626",  # Red
                "accent_color": "#F59E0B",  # Amber
            },
            "healthcare": {
                "primary_color": "#059669",  # Green
                "secondary_color": "#3B82F6",  # Blue
                "accent_color": "#10B981",  # Emerald
            },
            "finance": {
                "primary_color": "#1E40AF",  # Blue
                "secondary_color": "#059669",  # Green
                "accent_color": "#F59E0B",  # Amber
            },
            "retail": {
                "primary_color": "#DC2626",  # Red
                "secondary_color": "#7C3AED",  # Purple
                "accent_color": "#F59E0B",  # Amber
            },
            "manufacturing": {
                "primary_color": "#374151",  # Gray
                "secondary_color": "#059669",  # Green
                "accent_color": "#F59E0B",  # Amber
            },
        }

        return industry_themes.get(industry_profile, {})

    def _get_industry_css(self, industry_profile: str) -> str:
        """Get industry-specific CSS styles."""
        industry_css = {
            "automotive": """
.automotive-header {
    background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
    color: white;
}

.automotive-button {
    border-radius: 8px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}
""",
            "healthcare": """
.healthcare-header {
    background: var(--primary-color);
    color: white;
    border-bottom: 3px solid var(--secondary-color);
}

.healthcare-button {
    border-radius: 20px;
    font-weight: 500;
    padding: 12px 24px;
}
""",
            "finance": """
.finance-header {
    background: var(--primary-color);
    color: white;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.finance-button {
    border-radius: 4px;
    font-weight: 600;
    border: 2px solid var(--primary-color);
}
""",
            "retail": """
.retail-header {
    background: var(--primary-color);
    color: white;
    border-bottom: 2px solid var(--accent-color);
}

.retail-button {
    border-radius: 25px;
    font-weight: 600;
    background: linear-gradient(45deg, var(--primary-color), var(--secondary-color));
}
""",
            "manufacturing": """
.manufacturing-header {
    background: var(--primary-color);
    color: white;
    border-bottom: 1px solid var(--secondary-color);
}

.manufacturing-button {
    border-radius: 6px;
    font-weight: 500;
    background: var(--secondary-color);
    color: white;
}
""",
        }

        return industry_css.get(industry_profile, "")

    def _is_valid_logo_file(self, filename: str, file_content: bytes) -> bool:
        """Validate logo file format and size."""
        # Check file extension
        valid_extensions = {".png", ".jpg", ".jpeg", ".svg", ".gif"}
        file_extension = Path(filename).suffix.lower()

        if file_extension not in valid_extensions:
            return False

        # Check file size (max 5MB)
        max_size = 5 * 1024 * 1024  # 5MB
        if len(file_content) > max_size:
            return False

        return True

    async def _store_logo_file(
        self, file_content: bytes, filename: str
    ) -> str:
        """Store logo file and return URL."""
        # Implement your file storage logic here
        # This could be AWS S3, local storage, etc.

        # For now, return a placeholder URL
        # In production, implement actual file storage
        return f"/static/logos/{filename}"

    def _validate_logo_compliance(self, logo_url: str) -> Dict:
        """Validate logo for compliance requirements."""
        score = 100
        issues = []

        if not logo_url or logo_url == "/static/default-logo.png":
            score -= 20
            issues.append("No custom logo uploaded")

        if logo_url and not logo_url.startswith(("http://", "https://")):
            score -= 10
            issues.append("Logo should use HTTPS for production")

        return {
            "score": max(0, score),
            "issues": issues,
            "recommendations": [
                "Upload high-quality logo (PNG/SVG recommended)",
                "Use HTTPS URLs for production",
                "Ensure logo meets accessibility guidelines",
            ],
        }

    def _validate_color_compliance(self, theme: Dict) -> Dict:
        """Validate color scheme for compliance."""
        score = 100
        issues = []

        # Check contrast ratios (basic validation)
        primary_color = theme.get("primary_color", "#000000")
        secondary_color = theme.get("secondary_color", "#FFFFFF")

        # Basic accessibility check
        if primary_color == secondary_color:
            score -= 30
            issues.append("Primary and secondary colors are too similar")

        return {
            "score": max(0, score),
            "issues": issues,
            "recommendations": [
                "Ensure sufficient color contrast for accessibility",
                "Test colors with colorblind users",
                "Use consistent color scheme throughout",
            ],
        }

    def _validate_css_compliance(self, css: str) -> Dict:
        """Validate custom CSS for compliance."""
        score = 100
        issues = []

        if not css:
            return {
                "score": 100,
                "issues": [],
                "recommendations": ["No custom CSS provided"],
            }

        # Check for dangerous patterns
        dangerous_patterns = [r"javascript:", r"expression\(", r"behavior:"]

        for pattern in dangerous_patterns:
            if re.search(pattern, css, re.IGNORECASE):
                score -= 50
                issues.append(f"Potentially dangerous CSS pattern: {pattern}")

        return {
            "score": max(0, score),
            "issues": issues,
            "recommendations": [
                "Avoid inline JavaScript in CSS",
                "Test CSS across different browsers",
                "Ensure CSS doesn't break accessibility",
            ],
        }

    def _validate_domain_compliance(self, domain: str) -> Dict:
        """Validate custom domain for compliance."""
        score = 100
        issues = []

        if not domain:
            return {
                "score": 100,
                "issues": [],
                "recommendations": ["No custom domain configured"],
            }

        # Check domain format
        if not re.match(
            r"^[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?)*$",
            domain,
        ):
            score -= 30
            issues.append("Invalid domain format")

        return {
            "score": max(0, score),
            "issues": issues,
            "recommendations": [
                "Use valid domain format",
                "Ensure SSL certificate is configured",
                "Set up proper DNS records",
            ],
        }
