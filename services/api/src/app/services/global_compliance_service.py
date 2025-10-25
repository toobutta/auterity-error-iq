"""Global Compliance & Localization Service - Multi-language support and \
    regional compliance."""

import logging
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from decimal import Decimal
from enum import Enum
from typing import Any, Dict, List, Optional
from uuid import UUID

import pytz

from app.core.saas_config import SaaSConfig
from app.models.tenant import Tenant

logger = logging.getLogger(__name__)


class Language(str, Enum):
    """Supported languages."""

    ENGLISH = "en"
    SPANISH = "es"
    FRENCH = "fr"
    GERMAN = "de"
    ITALIAN = "it"
    PORTUGUESE = "pt"
    CHINESE = "zh"
    JAPANESE = "ja"
    KOREAN = "ko"
    ARABIC = "ar"
    HINDI = "hi"
    RUSSIAN = "ru"


class Region(str, Enum):
    """Supported regions."""

    NORTH_AMERICA = "na"
    SOUTH_AMERICA = "sa"
    EUROPE = "eu"
    ASIA_PACIFIC = "ap"
    MIDDLE_EAST = "me"
    AFRICA = "af"


class ComplianceFramework(str, Enum):
    """Global compliance frameworks."""

    GDPR = "gdpr"
    CCPA = "ccpa"
    HIPAA = "hipaa"
    SOX = "sox"
    ISO27001 = "iso27001"
    SOC2 = "soc2"
    PCI_DSS = "pci_dss"
    PIPEDA = "pipeda"
    LGPD = "lgpd"
    PDPA = "pdpa"


class LocalizationType(str, Enum):
    """Types of localization."""

    UI_TEXT = "ui_text"
    EMAIL = "email"
    DOCUMENT = "document"
    LEGAL = "legal"
    HELP = "help"
    ERROR_MESSAGE = "error_message"


@dataclass
class ComplianceRequirement:
    """Compliance requirement for a specific framework."""

    id: str
    framework: ComplianceFramework
    region: Region
    category: str
    requirement: str
    description: str
    severity: str = "medium"  # low, medium, high, critical
    controls: List[str] = field(default_factory=list)
    implementation_guide: str = ""
    audit_procedures: List[str] = field(default_factory=list)
    last_updated: datetime = field(default_factory=datetime.utcnow)


@dataclass
class LocalizationEntry:
    """Localized text entry."""

    key: str
    language: Language
    region: Optional[Region]
    text: str
    context: str = ""
    plural_forms: Dict[str, str] = field(default_factory=dict)
    last_updated: datetime = field(default_factory=datetime.utcnow)
    translator: Optional[str] = None


@dataclass
class RegionalConfiguration:
    """Regional configuration settings."""

    region: Region
    timezone: str
    currency: str
    date_format: str
    number_format: str
    compliance_frameworks: List[ComplianceFramework] = field(
        default_factory=list
    )
    business_hours: Dict[str, List[int]] = field(default_factory=dict)
    holidays: List[str] = field(default_factory=list)
    legal_requirements: Dict[str, Any] = field(default_factory=dict)


@dataclass
class ComplianceAssessment:
    """Compliance assessment result."""

    tenant_id: UUID
    framework: ComplianceFramework
    region: Region
    assessment_date: datetime
    overall_score: float  # 0-100
    requirements: Dict[str, Dict[str, Any]] = field(default_factory=dict)
    gaps: List[str] = field(default_factory=list)
    recommendations: List[str] = field(default_factory=list)
    next_audit_date: Optional[datetime] = None


@dataclass
class TranslationJob:
    """Translation job for localization."""

    id: str
    source_language: Language
    target_language: Language
    content_type: LocalizationType
    content_keys: List[str]
    status: str = "pending"  # pending, in_progress, completed, cancelled
    priority: int = 5  # 1-10, 1 being highest
    created_at: datetime = field(default_factory=datetime.utcnow)
    completed_at: Optional[datetime] = None
    translator_id: Optional[str] = None


class GlobalComplianceService:
    """Global Compliance & Localization Service - Multi-language support and \
        regional compliance."""

    def __init__(self, db_session):
        self.db = db_session
        self.config = SaaSConfig()

        # Localization storage
        self.translations: Dict[str, LocalizationEntry] = {}
        self.compliance_requirements: Dict[str, ComplianceRequirement] = {}
        self.regional_configs: Dict[Region, RegionalConfiguration] = {}

        # Compliance assessments
        self.assessments: Dict[str, ComplianceAssessment] = {}

        # Translation jobs
        self.translation_jobs: Dict[str, TranslationJob] = {}

        # Initialize default configurations
        self._initialize_compliance_requirements()
        self._initialize_regional_configs()
        self._initialize_default_translations()

    def _initialize_compliance_requirements(self):
        """Initialize default compliance requirements for various frameworks."""
        requirements = [
            # GDPR Requirements
            {
                "id": "gdpr_data_subject_rights",
                "framework": ComplianceFramework.GDPR,
                "region": Region.EUROPE,
                "category": "data_protection",
                "requirement": "Data Subject Rights",
                "description": "Implement rights for data access, rectification, erasure, and \
                    portability",
                "severity": "high",
                "controls": [
                    "Access control",
                    "Data export",
                    "Right to be forgotten",
                ],
                "implementation_guide": "Implement API endpoints for data subject requests with proper authentication",
            },
            {
                "id": "gdpr_data_breach_notification",
                "framework": ComplianceFramework.GDPR,
                "region": Region.EUROPE,
                "category": "incident_response",
                "requirement": "Data Breach Notification",
                "description": "Notify supervisory authority within 72 hours of breach",
                "severity": "critical",
                "controls": [
                    "Breach detection",
                    "Incident response plan",
                    "Notification procedures",
                ],
                "audit_procedures": [
                    "Review breach logs",
                    "Test notification procedures",
                ],
            },
            # CCPA Requirements
            {
                "id": "ccpa_privacy_notice",
                "framework": ComplianceFramework.CCPA,
                "region": Region.NORTH_AMERICA,
                "category": "privacy",
                "requirement": "Privacy Notice",
                "description": "Provide clear privacy notice to California residents",
                "severity": "high",
                "controls": [
                    "Privacy policy",
                    "Cookie consent",
                    "Data collection disclosure",
                ],
            },
            # HIPAA Requirements
            {
                "id": "hipaa_access_controls",
                "framework": ComplianceFramework.HIPAA,
                "region": Region.NORTH_AMERICA,
                "category": "security",
                "requirement": "Access Controls",
                "description": "Implement role-based access controls for PHI",
                "severity": "high",
                "controls": ["RBAC", "Audit logging", "Access reviews"],
            },
        ]

        for req_data in requirements:
            requirement = ComplianceRequirement(**req_data)
            self.compliance_requirements[requirement.id] = requirement

    def _initialize_regional_configs(self):
        """Initialize regional configurations."""
        configs = {
            Region.EUROPE: RegionalConfiguration(
                region=Region.EUROPE,
                timezone="Europe/London",
                currency="EUR",
                date_format="DD/MM/YYYY",
                number_format="1.234,56",
                compliance_frameworks=[
                    ComplianceFramework.GDPR,
                    ComplianceFramework.ISO27001,
                ],
                business_hours={
                    "monday": [9, 17],
                    "tuesday": [9, 17],
                    "wednesday": [9, 17],
                    "thursday": [9, 17],
                    "friday": [9, 17],
                },
            ),
            Region.NORTH_AMERICA: RegionalConfiguration(
                region=Region.NORTH_AMERICA,
                timezone="America/New_York",
                currency="USD",
                date_format="MM/DD/YYYY",
                number_format="1,234.56",
                compliance_frameworks=[
                    ComplianceFramework.CCPA,
                    ComplianceFramework.HIPAA,
                    ComplianceFramework.SOC2,
                ],
                business_hours={
                    "monday": [9, 17],
                    "tuesday": [9, 17],
                    "wednesday": [9, 17],
                    "thursday": [9, 17],
                    "friday": [9, 17],
                },
            ),
            Region.ASIA_PACIFIC: RegionalConfiguration(
                region=Region.ASIA_PACIFIC,
                timezone="Asia/Tokyo",
                currency="JPY",
                date_format="YYYY/MM/DD",
                number_format="1,234.56",
                compliance_frameworks=[
                    ComplianceFramework.ISO27001,
                    ComplianceFramework.PDPA,
                ],
                business_hours={
                    "monday": [9, 18],
                    "tuesday": [9, 18],
                    "wednesday": [9, 18],
                    "thursday": [9, 18],
                    "friday": [9, 18],
                },
            ),
        }

        self.regional_configs.update(configs)

    def _initialize_default_translations(self):
        """Initialize default English translations."""
        default_texts = {
            "welcome_message": "Welcome to our platform",
            "error_generic": "An error occurred. Please try again.",
            "login_required": "Please log in to continue",
            "privacy_policy": "Privacy Policy",
            "terms_of_service": "Terms of Service",
            "contact_support": "Contact Support",
            "save_changes": "Save Changes",
            "cancel": "Cancel",
            "delete": "Delete",
            "edit": "Edit",
            "view": "View",
            "create": "Create",
        }

        for key, text in default_texts.items():
            entry = LocalizationEntry(
                key=key, language=Language.ENGLISH, text=text, context="ui"
            )
            self.translations[f"{key}_en"] = entry

    async def get_localized_text(
        self,
        key: str,
        language: Language,
        region: Optional[Region] = None,
        context: Optional[str] = None,
        variables: Optional[Dict[str, Any]] = None,
    ) -> str:
        """Get localized text for the specified language and region."""
        try:
            # Try region-specific translation first
            if region:
                region_key = f"{key}_{language.value}_{region.value}"
                if region_key in self.translations:
                    text = self.translations[region_key].text
                    return self._interpolate_variables(text, variables or {})

            # Try language-specific translation
            lang_key = f"{key}_{language.value}"
            if lang_key in self.translations:
                text = self.translations[lang_key].text
                return self._interpolate_variables(text, variables or {})

            # Fall back to English
            en_key = f"{key}_en"
            if en_key in self.translations:
                text = self.translations[en_key].text
                return self._interpolate_variables(text, variables or {})

            # Final fallback
            return f"Translation missing: {key}"

        except Exception as e:
            logger.error(f"Localization failed for key '{key}': {str(e)}")
            return f"Translation error: {key}"

    async def add_translation(
        self,
        key: str,
        language: Language,
        text: str,
        region: Optional[Region] = None,
        context: str = "",
        translator: Optional[str] = None,
    ) -> LocalizationEntry:
        """Add a new translation."""
        try:
            entry_key = f"{key}_{language.value}"
            if region:
                entry_key += f"_{region.value}"

            entry = LocalizationEntry(
                key=key,
                language=language,
                region=region,
                text=text,
                context=context,
                translator=translator,
                last_updated=datetime.utcnow(),
            )

            self.translations[entry_key] = entry

            logger.info(f"Added translation: {entry_key}")
            return entry

        except Exception as e:
            logger.error(f"Translation addition failed: {str(e)}")
            raise

    async def get_supported_languages(self) -> List[Dict[str, Any]]:
        """Get list of supported languages with coverage statistics."""
        try:
            language_stats = {}

            for entry in self.translations.values():
                lang = entry.language.value
                if lang not in language_stats:
                    language_stats[lang] = {
                        "code": lang,
                        "name": (
                            entry.language.name
                            if hasattr(entry.language, "name")
                            else lang.upper()
                        ),
                        "translations": 0,
                        "regions": set(),
                    }

                language_stats[lang]["translations"] += 1
                if entry.region:
                    language_stats[lang]["regions"].add(entry.region.value)

            # Convert sets to lists for JSON serialization
            for stats in language_stats.values():
                stats["regions"] = list(stats["regions"])

            return list(language_stats.values())

        except Exception as e:
            logger.error(f"Language list retrieval failed: {str(e)}")
            return []

    async def get_compliance_requirements(
        self,
        framework: Optional[ComplianceFramework] = None,
        region: Optional[Region] = None,
        category: Optional[str] = None,
    ) -> List[ComplianceRequirement]:
        """Get compliance requirements with optional filtering."""
        try:
            requirements = list(self.compliance_requirements.values())

            if framework:
                requirements = [
                    r for r in requirements if r.framework == framework
                ]

            if region:
                requirements = [r for r in requirements if r.region == region]

            if category:
                requirements = [
                    r for r in requirements if r.category == category
                ]

            return requirements

        except Exception as e:
            logger.error(f"Compliance requirements retrieval failed: {str(e)}")
            return []

    async def assess_compliance(
        self, tenant_id: UUID, framework: ComplianceFramework, region: Region
    ) -> ComplianceAssessment:
        """Perform compliance assessment for a tenant."""
        try:
            tenant = (
                self.db.query(Tenant).filter(Tenant.id == tenant_id).first()
            )
            if not tenant:
                raise ValueError(f"Tenant {tenant_id} not found")

            # Get relevant requirements
            requirements = await self.get_compliance_requirements(
                framework=framework, region=region
            )

            assessment_results = {}
            total_score = 0
            gaps = []
            recommendations = []

            for req in requirements:
                # Simulate compliance check
                # (in real implementation, this would check actual tenant
                # configuration)
                compliance_score = await self._check_compliance_requirement(
                    tenant, req
                )

                assessment_results[req.id] = {
                    "requirement": req.requirement,
                    "description": req.description,
                    "score": compliance_score,
                    "status": (
                        "compliant"
                        if compliance_score >= 80
                        else "non_compliant"
                    ),
                    "controls": req.controls,
                }

                total_score += compliance_score

                if compliance_score < 80:
                    gaps.append(f"{req.requirement}: {req.description}")
                    recommendations.extend(req.controls)

            overall_score = (
                total_score / len(requirements) if requirements else 100
            )

            # Calculate next audit date (typically annually)
            next_audit_date = datetime.utcnow() + timedelta(days=365)

            assessment = ComplianceAssessment(
                tenant_id=tenant_id,
                framework=framework,
                region=region,
                assessment_date=datetime.utcnow(),
                overall_score=overall_score,
                requirements=assessment_results,
                gaps=gaps,
                recommendations=list(
                    set(recommendations)
                ),  # Remove duplicates
                next_audit_date=next_audit_date,
            )

            # Store assessment
            assessment_key = f"{tenant_id}_{framework.value}_{region.value}"
            self.assessments[assessment_key] = assessment

            return assessment

        except Exception as e:
            logger.error(f"Compliance assessment failed: {str(e)}")
            raise

    async def _check_compliance_requirement(
        self, tenant: Tenant, requirement: ComplianceRequirement
    ) -> float:
        """Check compliance for a specific requirement."""
        # This is a simplified implementation
        # In practice, this would check tenant's actual configuration against requirements

        checks = {
            "data_protection": await self._check_data_protection_compliance(
                tenant
            ),
            "privacy": await self._check_privacy_compliance(tenant),
            "security": await self._check_security_compliance(tenant),
            "incident_response": await self._check_incident_response_compliance(
                tenant
            ),
        }

        return checks.get(requirement.category, 50.0)  # Default score

    async def _check_data_protection_compliance(self, tenant: Tenant) -> float:
        """Check data protection compliance."""
        score = 50.0

        # Check if audit logging is enabled
        if tenant.audit_enabled:
            score += 20

        # Check if SSO is enabled (indicates better access control)
        if tenant.sso_enabled:
            score += 15

        # Check if industry settings are configured
        if tenant.industry_settings:
            score += 15

        return min(score, 100.0)

    async def _check_privacy_compliance(self, tenant: Tenant) -> float:
        """Check privacy compliance."""
        score = 60.0  # Base score for having basic privacy features

        # Check for custom domain (indicates white-label capability)
        if tenant.custom_domain:
            score += 20

        # Check for company branding (indicates customization)
        if tenant.company_name:
            score += 20

        return min(score, 100.0)

    async def _check_security_compliance(self, tenant: Tenant) -> float:
        """Check security compliance."""
        score = 40.0

        # Check SSO configuration
        if tenant.sso_enabled and tenant.sso_provider:
            score += 30

        # Check audit retention
        if tenant.audit_retention_days and tenant.audit_retention_days != "0":
            score += 30

        return min(score, 100.0)

    async def _check_incident_response_compliance(
        self, tenant: Tenant
    ) -> float:
        """Check incident response compliance."""
        # Simplified check - in practice would check for incident response plans
        return 70.0  # Assume basic compliance

    async def get_regional_config(
        self, region: Region
    ) -> Optional[RegionalConfiguration]:
        """Get regional configuration."""
        return self.regional_configs.get(region)

    async def format_datetime(
        self,
        dt: datetime,
        region: Region,
        language: Language = Language.ENGLISH,
    ) -> str:
        """Format datetime according to regional settings."""
        try:
            config = self.regional_configs.get(region)
            if not config:
                return dt.isoformat()

            # Set timezone
            tz = pytz.timezone(config.timezone)
            localized_dt = dt.astimezone(tz)

            # Format according to regional settings
            if config.date_format == "DD/MM/YYYY":
                return localized_dt.strftime("%d/%m/%Y %H:%M:%S")
            elif config.date_format == "MM/DD/YYYY":
                return localized_dt.strftime("%m/%d/%Y %H:%M:%S")
            elif config.date_format == "YYYY/MM/DD":
                return localized_dt.strftime("%Y/%m/%d %H:%M:%S")
            else:
                return localized_dt.isoformat()

        except Exception as e:
            logger.error(f"DateTime formatting failed: {str(e)}")
            return dt.isoformat()

    async def format_currency(
        self,
        amount: Decimal,
        region: Region,
        language: Language = Language.ENGLISH,
    ) -> str:
        """Format currency according to regional settings."""
        try:
            config = self.regional_configs.get(region)
            if not config:
                return f"${amount}"

            currency_symbol = {
                "USD": "$",
                "EUR": "€",
                "JPY": "¥",
                "GBP": "£",
            }.get(config.currency, "$")

            # Format number according to regional settings
            if config.number_format == "1.234,56":
                # European style
                formatted_amount = ".2f".replace(".", ",")
            else:
                # US/International style
                formatted_amount = ".2f"

            return f"{currency_symbol}{formatted_amount}"

        except Exception as e:
            logger.error(f"Currency formatting failed: {str(e)}")
            return f"${amount}"

    async def validate_data_residency(
        self, tenant_id: UUID, region: Region, data_types: List[str]
    ) -> Dict[str, Any]:
        """Validate data residency compliance for a tenant."""
        try:
            tenant = (
                self.db.query(Tenant).filter(Tenant.id == tenant_id).first()
            )
            if not tenant:
                raise ValueError(f"Tenant {tenant_id} not found")

            config = self.regional_configs.get(region)
            if not config:
                return {
                    "compliant": False,
                    "issues": ["Region not configured"],
                }

            validation_results = {
                "compliant": True,
                "issues": [],
                "recommendations": [],
                "data_types": {},
            }

            for data_type in data_types:
                compliance = await self._check_data_type_compliance(
                    data_type, region
                )
                validation_results["data_types"][data_type] = compliance

                if not compliance["compliant"]:
                    validation_results["compliant"] = False
                    validation_results["issues"].extend(compliance["issues"])

            return validation_results

        except Exception as e:
            logger.error(f"Data residency validation failed: {str(e)}")
            return {"compliant": False, "issues": [str(e)]}

    async def _check_data_type_compliance(
        self, data_type: str, region: Region
    ) -> Dict[str, Any]:
        """Check compliance for a specific data type in a region."""
        # Simplified implementation
        compliance_rules = {
            Region.EUROPE: {
                "personal_data": {
                    "compliant": True,
                    "requirements": ["GDPR compliance"],
                },
                "health_data": {
                    "compliant": False,
                    "issues": ["May require local hosting"],
                },
                "financial_data": {
                    "compliant": True,
                    "requirements": ["Encryption required"],
                },
            },
            Region.NORTH_AMERICA: {
                "personal_data": {
                    "compliant": True,
                    "requirements": ["CCPA compliance"],
                },
                "health_data": {
                    "compliant": True,
                    "requirements": ["HIPAA compliance"],
                },
                "financial_data": {
                    "compliant": True,
                    "requirements": ["PCI DSS compliance"],
                },
            },
        }

        region_rules = compliance_rules.get(region, {})
        return region_rules.get(
            data_type, {"compliant": False, "issues": ["Unknown data type"]}
        )

    async def create_translation_job(
        self,
        source_language: Language,
        target_language: Language,
        content_type: LocalizationType,
        content_keys: List[str],
        priority: int = 5,
    ) -> TranslationJob:
        """Create a translation job."""
        try:
            job_id = f"translation_{source_language.value}_to_{target_language.value}_{datetime.utcnow().timestamp()}"

            job = TranslationJob(
                id=job_id,
                source_language=source_language,
                target_language=target_language,
                content_type=content_type,
                content_keys=content_keys,
                priority=priority,
            )

            self.translation_jobs[job_id] = job

            logger.info(f"Created translation job: {job_id}")
            return job

        except Exception as e:
            logger.error(f"Translation job creation failed: {str(e)}")
            raise

    def _interpolate_variables(
        self, text: str, variables: Dict[str, Any]
    ) -> str:
        """Interpolate variables in localized text."""
        try:
            for key, value in variables.items():
                placeholder = f"{{{key}}}"
                text = text.replace(placeholder, str(value))
            return text
        except Exception as e:
            logger.error(f"Variable interpolation failed: {str(e)}")
            return text

    async def get_compliance_dashboard(
        self, tenant_id: UUID
    ) -> Dict[str, Any]:
        """Get compliance dashboard data for a tenant."""
        try:
            tenant = (
                self.db.query(Tenant).filter(Tenant.id == tenant_id).first()
            )
            if not tenant:
                raise ValueError(f"Tenant {tenant_id} not found")

            # Get regional config (simplified - would use tenant's actual region)
            region = Region.NORTH_AMERICA  # Default
            config = self.regional_configs.get(region)

            dashboard = {
                "tenant_id": str(tenant_id),
                "region": region.value,
                "compliance_frameworks": (
                    [f.value for f in config.compliance_frameworks]
                    if config
                    else []
                ),
                "assessments": {},
                "overall_compliance_score": 0.0,
                "critical_issues": [],
                "upcoming_audits": [],
            }

            if config:
                # Get assessments for each framework
                for framework in config.compliance_frameworks:
                    assessment_key = (
                        f"{tenant_id}_{framework.value}_{region.value}"
                    )
                    assessment = self.assessments.get(assessment_key)

                    if assessment:
                        dashboard["assessments"][framework.value] = {
                            "score": assessment.overall_score,
                            "status": (
                                "compliant"
                                if assessment.overall_score >= 80
                                else "needs_attention"
                            ),
                            "gaps": len(assessment.gaps),
                            "next_audit": (
                                assessment.next_audit_date.isoformat()
                                if assessment.next_audit_date
                                else None
                            ),
                        }

                        if assessment.next_audit_date:
                            dashboard["upcoming_audits"].append(
                                {
                                    "framework": framework.value,
                                    "date": assessment.next_audit_date.isoformat(),
                                    "days_until": (
                                        assessment.next_audit_date
                                        - datetime.utcnow()
                                    ).days,
                                }
                            )

                        # Add critical issues
                        if assessment.overall_score < 70:
                            dashboard["critical_issues"].extend(
                                [
                                    f"{framework.value}: {gap}"
                                    for gap in assessment.gaps[:3]
                                ]
                            )

                # Calculate overall score
                if dashboard["assessments"]:
                    total_score = sum(
                        assessment["score"]
                        for assessment in dashboard["assessments"].values()
                    )
                    dashboard["overall_compliance_score"] = total_score / len(
                        dashboard["assessments"]
                    )

            return dashboard

        except Exception as e:
            logger.error(f"Compliance dashboard generation failed: {str(e)}")
            return {"error": str(e)}

    async def health_check(self) -> Dict[str, Any]:
        """Perform health check on global compliance service."""
        try:
            health_status = {
                "status": "healthy",
                "translations_count": len(self.translations),
                "compliance_requirements_count": len(
                    self.compliance_requirements
                ),
                "regional_configs_count": len(self.regional_configs),
                "assessments_count": len(self.assessments),
                "translation_jobs_count": len(self.translation_jobs),
                "supported_languages": len(Language),
                "supported_regions": len(Region),
                "compliance_frameworks": len(ComplianceFramework),
            }

            return health_status

        except Exception as e:
            return {"status": "unhealthy", "error": str(e)}
