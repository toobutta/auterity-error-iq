"""
Compliance Layer for Auterity Agent System

This module ensures all agent operations comply with enterprise requirements:
- Data privacy and protection (GDPR, HIPAA, etc.)
- Audit trails and logging
- Access controls and permissions
- Regulatory compliance for automotive, healthcare, and finance domains
"""

import hashlib
import json
import logging
import uuid
from datetime import datetime, timezone
from enum import Enum
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)


class ComplianceLevel(Enum):
    """Compliance levels for different regulatory requirements"""

    BASIC = "basic"
    GDPR = "gdpr"
    HIPAA = "hipaa"
    SOX = "sox"
    AUTOMOTIVE = "automotive"
    FINANCE = "finance"


class DataClassification(Enum):
    """Data classification levels"""

    PUBLIC = "public"
    INTERNAL = "internal"
    CONFIDENTIAL = "confidential"
    RESTRICTED = "restricted"
    PII = "pii"
    PHI = "phi"


class ComplianceLayer:
    """
    Enterprise compliance layer for Auterity agent operations

    Provides:
    - Audit trail generation and management
    - Data classification and protection
    - Access control enforcement
    - Compliance validation and reporting
    """

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        self.config = config or {}
        compliance_level_str = self.config.get("compliance_level", "basic")

        # Handle string to enum conversion safely
        try:
            self.compliance_level = ComplianceLevel(compliance_level_str)
        except ValueError:
            logger.warning(
                f"Invalid compliance level '{compliance_level_str}', using basic"
            )
            self.compliance_level = ComplianceLevel.BASIC

        self.audit_log = []
        self.data_classifiers = {}
        self.access_policies = {}

        # Initialize compliance rules based on level
        self._initialize_compliance_rules()

    def _initialize_compliance_rules(self):
        """Initialize compliance rules based on configured level"""

        base_rules = {
            "audit_all_operations": True,
            "encrypt_sensitive_data": True,
            "log_data_access": True,
            "validate_permissions": True,
        }

        if self.compliance_level in [ComplianceLevel.GDPR, ComplianceLevel.HIPAA]:
            base_rules.update(
                {
                    "anonymize_pii": True,
                    "consent_tracking": True,
                    "data_retention_policies": True,
                    "right_to_erasure": True,
                }
            )

        if self.compliance_level == ComplianceLevel.HIPAA:
            base_rules.update(
                {
                    "phi_protection": True,
                    "minimum_necessary_standard": True,
                    "breach_notification": True,
                }
            )

        if self.compliance_level == ComplianceLevel.SOX:
            base_rules.update(
                {
                    "financial_controls": True,
                    "change_management": True,
                    "segregation_of_duties": True,
                }
            )

        self.compliance_rules = base_rules
        logger.info(f"Initialized compliance rules for {self.compliance_level.value}")

    def validate_compliance(
        self, data: Dict[str, Any], compliance_rules: List[str]
    ) -> Dict[str, Any]:
        """Simple compliance validation for testing"""

        audit_id = str(uuid.uuid4())
        classification = data.get("classification", "public")

        violations = []
        compliance_status = "compliant"

        # Simple validation logic
        if "GDPR" in compliance_rules and "personal" in str(data).lower():
            violations.append("GDPR: Personal data detected without proper consent")
            compliance_status = "violation"

        if "HIPAA" in compliance_rules and "health" in str(data).lower():
            violations.append(
                "HIPAA: Health information detected without proper authorization"
            )
            compliance_status = "violation"

        result = {
            "compliance_status": compliance_status,
            "audit_id": audit_id,
            "violations": violations,
            "data_classification": classification,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }

        # Log for audit trail
        self.audit_log.append(result)

        return result

    async def validate_operation(
        self,
        operation: str,
        data: Dict[str, Any],
        user_id: str,
        tenant_id: str,
        context: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """Validate operation against compliance requirements"""

        validation_result = {
            "allowed": True,
            "violations": [],
            "requirements": [],
            "audit_id": self._generate_audit_id(operation, user_id, tenant_id),
        }

        try:
            # Check data classification
            data_classification = self._classify_data(data)

            # Validate access permissions
            access_validation = await self._validate_access(
                operation, user_id, tenant_id, data_classification
            )

            if not access_validation["allowed"]:
                validation_result["allowed"] = False
                validation_result["violations"].extend(access_validation["violations"])

            # Check data protection requirements
            protection_validation = self._validate_data_protection(
                data, data_classification
            )

            if not protection_validation["compliant"]:
                validation_result["violations"].extend(
                    protection_validation["violations"]
                )
                validation_result["requirements"].extend(
                    protection_validation["requirements"]
                )

            # Log audit trail
            await self._log_audit_event(
                {
                    "audit_id": validation_result["audit_id"],
                    "operation": operation,
                    "user_id": user_id,
                    "tenant_id": tenant_id,
                    "data_classification": data_classification.value,
                    "allowed": validation_result["allowed"],
                    "violations": validation_result["violations"],
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "context": context or {},
                }
            )

            return validation_result

        except Exception as e:
            logger.error(f"Compliance validation failed: {str(e)}")
            validation_result["allowed"] = False
            validation_result["violations"].append(f"Validation error: {str(e)}")
            return validation_result

    def _classify_data(self, data: Dict[str, Any]) -> DataClassification:
        """Classify data based on content and metadata"""

        # Check for PII patterns
        pii_indicators = [
            "email",
            "phone",
            "ssn",
            "social_security",
            "credit_card",
            "passport",
            "driver_license",
            "address",
        ]

        # Check for PHI patterns (healthcare)
        phi_indicators = [
            "medical_record",
            "diagnosis",
            "treatment",
            "medication",
            "health_condition",
            "patient_id",
            "mrn",
        ]

        data_str = json.dumps(data, default=str).lower()

        # Check for PHI first (highest classification)
        if any(indicator in data_str for indicator in phi_indicators):
            return DataClassification.PHI

        # Check for PII
        if any(indicator in data_str for indicator in pii_indicators):
            return DataClassification.PII

        # Check metadata for classification hints
        classification = data.get("metadata", {}).get("classification")
        if classification:
            try:
                return DataClassification(classification.lower())
            except ValueError:
                pass

        # Default classification
        return DataClassification.INTERNAL

    async def _validate_access(
        self,
        operation: str,
        user_id: str,
        tenant_id: str,
        data_classification: DataClassification,
    ) -> Dict[str, Any]:
        """Validate user access permissions for operation and data"""

        # This would integrate with your existing auth system
        # For now, implement basic validation logic

        violations = []

        # Check if user has permission for operation
        user_permissions = await self._get_user_permissions(user_id, tenant_id)

        if operation not in user_permissions.get("allowed_operations", []):
            violations.append(
                f"User {user_id} not authorized for operation: {operation}"
            )

        # Check data classification access
        max_classification = user_permissions.get("max_data_classification", "internal")

        classification_levels = {
            "public": 0,
            "internal": 1,
            "confidential": 2,
            "restricted": 3,
            "pii": 4,
            "phi": 5,
        }

        user_level = classification_levels.get(max_classification, 1)
        required_level = classification_levels.get(data_classification.value, 1)

        if user_level < required_level:
            violations.append(
                f"Insufficient clearance for {data_classification.value} data"
            )

        return {
            "allowed": len(violations) == 0,
            "violations": violations,
            "user_permissions": user_permissions,
        }

    def _validate_data_protection(
        self, data: Dict[str, Any], classification: DataClassification
    ) -> Dict[str, Any]:
        """Validate data protection requirements"""

        violations = []
        requirements = []

        # Check encryption requirements
        if classification in [DataClassification.PII, DataClassification.PHI]:
            if not data.get("encrypted", False):
                violations.append("Sensitive data must be encrypted")
                requirements.append("encrypt_data")

        # Check anonymization requirements
        if (
            self.compliance_level == ComplianceLevel.GDPR
            and classification == DataClassification.PII
        ):
            if not data.get("anonymized", False):
                requirements.append("anonymize_pii")

        # Check consent tracking for GDPR
        if (
            self.compliance_level == ComplianceLevel.GDPR
            and classification == DataClassification.PII
        ):
            if not data.get("consent_obtained", False):
                violations.append("GDPR consent required for PII processing")

        return {
            "compliant": len(violations) == 0,
            "violations": violations,
            "requirements": requirements,
        }

    async def _get_user_permissions(
        self, user_id: str, tenant_id: str
    ) -> Dict[str, Any]:
        """Get user permissions from auth system"""

        # This would integrate with your existing auth/permissions system
        # For now, return mock permissions
        return {
            "allowed_operations": ["read", "write", "execute", "query", "index"],
            "max_data_classification": "confidential",
            "roles": ["user"],
            "tenant_id": tenant_id,
        }

    async def _log_audit_event(self, event: Dict[str, Any]):
        """Log audit event for compliance tracking"""

        self.audit_log.append(event)

        # In production, this would write to a secure audit log system
        logger.info(f"Audit event: {event['audit_id']}")

        # Alert on violations
        if event.get("violations"):
            logger.warning(f"Compliance violations detected: {event['violations']}")

    def _generate_audit_id(self, operation: str, user_id: str, tenant_id: str) -> str:
        """Generate unique audit ID for tracking"""

        timestamp = datetime.now(timezone.utc).isoformat()
        content = f"{operation}:{user_id}:{tenant_id}:{timestamp}"

        return hashlib.sha256(content.encode()).hexdigest()[:16]

    async def anonymize_data(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Anonymize sensitive data for GDPR compliance"""

        anonymized = data.copy()

        # Common PII fields to anonymize
        pii_fields = [
            "email",
            "phone",
            "name",
            "address",
            "ssn",
            "social_security_number",
            "credit_card",
        ]

        for field in pii_fields:
            if field in anonymized:
                # Simple anonymization - in production use proper techniques
                anonymized[field] = self._anonymize_value(anonymized[field])

        anonymized["anonymized"] = True
        anonymized["anonymization_timestamp"] = datetime.now(timezone.utc).isoformat()

        return anonymized

    def _anonymize_value(self, value: str) -> str:
        """Anonymize a specific value"""

        # Simple hash-based anonymization
        # In production, use proper anonymization techniques
        hash_value = hashlib.sha256(str(value).encode()).hexdigest()
        return f"anon_{hash_value[:8]}"

    async def generate_compliance_report(
        self, tenant_id: str, start_date: datetime, end_date: datetime
    ) -> Dict[str, Any]:
        """Generate compliance report for audit purposes"""

        # Filter audit events for the specified period and tenant
        filtered_events = [
            event
            for event in self.audit_log
            if (
                event.get("tenant_id") == tenant_id
                and start_date <= datetime.fromisoformat(event["timestamp"]) <= end_date
            )
        ]

        # Aggregate statistics
        total_operations = len(filtered_events)
        violations = [event for event in filtered_events if event.get("violations")]

        report = {
            "tenant_id": tenant_id,
            "period": {"start": start_date.isoformat(), "end": end_date.isoformat()},
            "compliance_level": self.compliance_level.value,
            "statistics": {
                "total_operations": total_operations,
                "violations_count": len(violations),
                "compliance_rate": (
                    (total_operations - len(violations)) / total_operations
                    if total_operations > 0
                    else 1.0
                ),
            },
            "violations": violations,
            "generated_at": datetime.now(timezone.utc).isoformat(),
        }

        return report

    def get_compliance_status(self) -> Dict[str, Any]:
        """Get current compliance status"""

        recent_events = (
            self.audit_log[-100:] if len(self.audit_log) > 100 else self.audit_log
        )
        violations = [event for event in recent_events if event.get("violations")]

        return {
            "compliance_level": self.compliance_level.value,
            "rules_active": len(self.compliance_rules),
            "recent_operations": len(recent_events),
            "recent_violations": len(violations),
            "compliance_rate": (
                (len(recent_events) - len(violations)) / len(recent_events)
                if recent_events
                else 1.0
            ),
            "status": "compliant" if len(violations) == 0 else "violations_detected",
        }
