"""Enterprise AI Governance Platform - AI policy enforcement and \
    enterprise governance."""

import logging
import uuid
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from decimal import Decimal
from enum import Enum
from typing import Any, Dict, List, Optional
from uuid import UUID

from app.core.saas_config import SaaSConfig
from app.models.tenant import AuditLog

logger = logging.getLogger(__name__)


class PolicyType(str, Enum):
    """Types of governance policies."""

    USAGE_LIMIT = "usage_limit"
    COST_CONTROL = "cost_control"
    MODEL_RESTRICTION = "model_restriction"
    DATA_CLASSIFICATION = "data_classification"
    COMPLIANCE_ENFORCEMENT = "compliance_enforcement"
    AUDIT_LOGGING = "audit_logging"
    APPROVAL_WORKFLOW = "approval_workflow"
    ACCESS_CONTROL = "access_control"


class PolicySeverity(str, Enum):
    """Policy violation severity levels."""

    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class EnforcementAction(str, Enum):
    """Actions to take when policy is violated."""

    WARN = "warn"
    BLOCK = "block"
    QUARANTINE = "quarantine"
    ESCALATE = "escalate"
    TERMINATE = "terminate"


class AuditEventType(str, Enum):
    """Types of audit events."""

    POLICY_VIOLATION = "policy_violation"
    USAGE_EXCEEDED = "usage_exceeded"
    MODEL_ACCESS = "model_access"
    DATA_ACCESS = "data_access"
    APPROVAL_REQUESTED = "approval_requested"
    APPROVAL_GRANTED = "approval_granted"
    APPROVAL_DENIED = "approval_denied"
    SECURITY_INCIDENT = "security_incident"


@dataclass
class GovernancePolicy:
    """AI governance policy definition."""

    id: str
    name: str
    description: str
    type: PolicyType
    severity: PolicySeverity = PolicySeverity.MEDIUM
    enabled: bool = True

    # Policy rules
    conditions: Dict[str, Any] = field(default_factory=dict)
    actions: List[EnforcementAction] = field(default_factory=list)

    # Scope
    tenant_id: Optional[UUID] = None
    user_groups: List[str] = field(default_factory=list)
    departments: List[str] = field(default_factory=list)

    # Audit settings
    audit_enabled: bool = True
    retention_days: int = 365

    # Metadata
    created_by: Optional[UUID] = None
    created_at: datetime = field(default_factory=datetime.utcnow)
    updated_at: datetime = field(default_factory=datetime.utcnow)
    version: str = "1.0"


@dataclass
class PolicyViolation:
    """Policy violation record."""

    id: str
    policy_id: str
    tenant_id: UUID
    user_id: Optional[UUID] = None
    resource_type: str = ""
    resource_id: Optional[str] = None

    # Violation details
    violation_type: str = ""
    severity: PolicySeverity = PolicySeverity.MEDIUM
    description: str = ""
    details: Dict[str, Any] = field(default_factory=dict)

    # Response
    action_taken: Optional[EnforcementAction] = None
    response_details: Dict[str, Any] = field(default_factory=dict)

    # Resolution
    resolved: bool = False
    resolved_by: Optional[UUID] = None
    resolved_at: Optional[datetime] = None
    resolution_notes: Optional[str] = None

    # Timestamps
    occurred_at: datetime = field(default_factory=datetime.utcnow)
    created_at: datetime = field(default_factory=datetime.utcnow)


@dataclass
class ApprovalWorkflow:
    """Approval workflow for AI usage."""

    id: str
    name: str
    description: str
    tenant_id: UUID

    # Workflow definition
    steps: List[Dict[str, Any]] = field(default_factory=list)
    conditions: Dict[str, Any] = field(default_factory=dict)

    # Approval settings
    auto_approve_threshold: Optional[Decimal] = None
    require_all_approvers: bool = False
    timeout_hours: int = 24

    # Status
    enabled: bool = True
    created_at: datetime = field(default_factory=datetime.utcnow)


@dataclass
class ApprovalRequest:
    """Approval request for AI usage."""

    id: str
    workflow_id: str
    tenant_id: UUID
    requested_by: UUID
    resource_type: str
    resource_details: Dict[str, Any] = field(default_factory=dict)

    # Approval process
    approvers: List[UUID] = field(default_factory=list)
    approvals_received: List[Dict[str, Any]] = field(default_factory=list)
    status: str = "pending"  # pending, approved, rejected, expired

    # Request details
    justification: str = ""
    risk_assessment: Dict[str, Any] = field(default_factory=dict)
    estimated_cost: Optional[Decimal] = None

    # Timestamps
    created_at: datetime = field(default_factory=datetime.utcnow)
    updated_at: datetime = field(default_factory=datetime.utcnow)
    expires_at: Optional[datetime] = None


@dataclass
class GovernanceReport:
    """Governance compliance report."""

    tenant_id: UUID
    report_period: str
    generated_at: datetime

    # Policy compliance
    total_policies: int = 0
    compliant_policies: int = 0
    violated_policies: int = 0
    compliance_score: float = 0.0

    # Violations
    total_violations: int = 0
    resolved_violations: int = 0
    critical_violations: int = 0

    # Usage governance
    usage_within_limits: bool = True
    cost_within_budget: bool = True
    security_incidents: int = 0

    # Recommendations
    recommendations: List[str] = field(default_factory=list)
    critical_issues: List[str] = field(default_factory=list)


class EnterpriseGovernanceService:
    """Enterprise AI Governance Platform - AI policy enforcement and \
        enterprise governance."""

    def __init__(self, db_session):
        self.db = db_session
        self.config = SaaSConfig()

        # Governance storage
        self.policies: Dict[str, GovernancePolicy] = {}
        self.violations: Dict[str, PolicyViolation] = {}
        self.workflows: Dict[str, ApprovalWorkflow] = {}
        self.approval_requests: Dict[str, ApprovalRequest] = {}

        # Initialize default policies
        self._initialize_default_policies()

    def _initialize_default_policies(self):
        """Initialize default governance policies."""
        default_policies = [
            {
                "id": "cost_control_basic",
                "name": "Basic Cost Control",
                "description": "Prevent excessive AI usage costs",
                "type": PolicyType.COST_CONTROL,
                "severity": PolicySeverity.MEDIUM,
                "conditions": {
                    "max_daily_cost": 100.00,
                    "max_monthly_cost": 3000.00,
                    "cost_increase_threshold": 0.50,  # 50% increase
                },
                "actions": [
                    EnforcementAction.WARN,
                    EnforcementAction.ESCALATE,
                ],
            },
            {
                "id": "model_restriction_sensitive",
                "name": "Sensitive Data Model Restriction",
                "description": "Restrict powerful models for sensitive data",
                "type": PolicyType.MODEL_RESTRICTION,
                "severity": PolicySeverity.HIGH,
                "conditions": {
                    "restricted_models": ["gpt-4", "claude-3-opus"],
                    "data_classification": ["confidential", "restricted"],
                    "requires_approval": True,
                },
                "actions": [
                    EnforcementAction.BLOCK,
                    EnforcementAction.ESCALATE,
                ],
            },
            {
                "id": "usage_limit_standard",
                "name": "Standard Usage Limits",
                "description": "Enforce standard usage limits",
                "type": PolicyType.USAGE_LIMIT,
                "severity": PolicySeverity.MEDIUM,
                "conditions": {
                    "max_requests_per_hour": 1000,
                    "max_requests_per_day": 10000,
                    "max_concurrent_requests": 50,
                },
                "actions": [EnforcementAction.WARN, EnforcementAction.BLOCK],
            },
            {
                "id": "audit_logging_comprehensive",
                "name": "Comprehensive Audit Logging",
                "description": "Log all AI usage for compliance",
                "type": PolicyType.AUDIT_LOGGING,
                "severity": PolicySeverity.LOW,
                "conditions": {
                    "log_all_requests": True,
                    "include_sensitive_data": False,
                    "retention_period_days": 365,
                },
                "actions": [EnforcementAction.WARN],
            },
            {
                "id": "data_classification_enforcement",
                "name": "Data Classification Enforcement",
                "description": "Enforce data classification rules",
                "type": PolicyType.DATA_CLASSIFICATION,
                "severity": PolicySeverity.HIGH,
                "conditions": {
                    "require_classification": True,
                    "restricted_classifications": [
                        "confidential",
                        "restricted",
                    ],
                    "auto_classify": True,
                },
                "actions": [
                    EnforcementAction.BLOCK,
                    EnforcementAction.ESCALATE,
                ],
            },
        ]

        for policy_data in default_policies:
            policy = GovernancePolicy(**policy_data)
            self.policies[policy.id] = policy

    async def create_policy(
        self,
        tenant_id: UUID,
        policy_data: Dict[str, Any],
        created_by: Optional[UUID] = None,
    ) -> GovernancePolicy:
        """Create a new governance policy."""
        try:
            policy_id = f"policy_{uuid.uuid4().hex}"

            policy = GovernancePolicy(
                id=policy_id,
                tenant_id=tenant_id,
                created_by=created_by,
                **policy_data,
            )

            self.policies[policy_id] = policy

            logger.info(f"Created governance policy: {policy_id}")
            return policy

        except Exception as e:
            logger.error(f"Policy creation failed: {str(e)}")
            raise

    async def evaluate_request(
        self,
        tenant_id: UUID,
        user_id: Optional[UUID],
        request_data: Dict[str, Any],
    ) -> Dict[str, Any]:
        """Evaluate a request against governance policies."""
        try:
            evaluation_result = {
                "approved": True,
                "warnings": [],
                "violations": [],
                "recommendations": [],
                "requires_approval": False,
            }

            # Get applicable policies
            applicable_policies = await self._get_applicable_policies(
                tenant_id, user_id, request_data
            )

            for policy in applicable_policies:
                violation = await self._check_policy_violation(
                    policy, tenant_id, user_id, request_data
                )

                if violation:
                    evaluation_result["violations"].append(
                        {
                            "policy_id": policy.id,
                            "policy_name": policy.name,
                            "severity": policy.severity.value,
                            "description": violation["description"],
                        }
                    )

                    # Apply policy actions
                    await self._apply_policy_actions(
                        policy, violation, evaluation_result
                    )

            # Check if approval is required
            if (
                evaluation_result["requires_approval"]
                or evaluation_result["violations"]
            ):
                evaluation_result["approved"] = False

            return evaluation_result

        except Exception as e:
            logger.error(f"Request evaluation failed: {str(e)}")
            return {
                "approved": False,
                "errors": [str(e)],
                "warnings": [],
                "violations": [],
                "recommendations": [],
            }

    async def _get_applicable_policies(
        self,
        tenant_id: UUID,
        user_id: Optional[UUID],
        request_data: Dict[str, Any],
    ) -> List[GovernancePolicy]:
        """Get policies applicable to the request."""
        try:
            applicable = []

            for policy in self.policies.values():
                if not policy.enabled:
                    continue

                # Check tenant scope
                if policy.tenant_id and policy.tenant_id != tenant_id:
                    continue

                # Check if policy conditions match request
                if await self._policy_matches_request(policy, request_data):
                    applicable.append(policy)

            return applicable

        except Exception as e:
            logger.error(f"Policy matching failed: {str(e)}")
            return []

    async def _policy_matches_request(
        self, policy: GovernancePolicy, request_data: Dict[str, Any]
    ) -> bool:
        """Check if policy conditions match the request."""
        conditions = policy.conditions

        # Check model restrictions
        if "restricted_models" in conditions:
            model = request_data.get("model", "")
            if model in conditions["restricted_models"]:
                return True

        # Check cost thresholds
        if "max_daily_cost" in conditions:
            estimated_cost = request_data.get("estimated_cost", 0)
            if estimated_cost > conditions["max_daily_cost"]:
                return True

        # Check usage limits
        if "max_requests_per_hour" in conditions:
            # This would check current usage rate
            return False  # Simplified

        # Check data classification
        if "data_classification" in conditions:
            data_class = request_data.get("data_classification", "")
            if data_class in conditions["data_classification"]:
                return True

        return False

    async def _check_policy_violation(
        self,
        policy: GovernancePolicy,
        tenant_id: UUID,
        user_id: Optional[UUID],
        request_data: Dict[str, Any],
    ) -> Optional[Dict[str, Any]]:
        """Check if request violates a policy."""
        try:
            # Simplified policy checking - in practice would be more sophisticated
            if policy.type == PolicyType.COST_CONTROL:
                estimated_cost = request_data.get("estimated_cost", 0)
                max_cost = policy.conditions.get("max_daily_cost", 100.00)

                if estimated_cost > max_cost:
                    return {
                        "description": f"Estimated cost ${estimated_cost:.2f} exceeds daily limit of ${max_cost:.2f}",
                        "severity": policy.severity,
                        "details": {
                            "estimated_cost": estimated_cost,
                            "limit": max_cost,
                            "exceeded_by": estimated_cost - max_cost,
                        },
                    }

            elif policy.type == PolicyType.MODEL_RESTRICTION:
                model = request_data.get("model", "")
                restricted_models = policy.conditions.get(
                    "restricted_models", []
                )

                if model in restricted_models:
                    return {
                        "description": f"Model {model} is restricted for this type of request",
                        "severity": policy.severity,
                        "details": {
                            "model": model,
                            "restricted_models": restricted_models,
                        },
                    }

            return None

        except Exception as e:
            logger.error(f"Policy violation check failed: {str(e)}")
            return None

    async def _apply_policy_actions(
        self,
        policy: GovernancePolicy,
        violation: Dict[str, Any],
        evaluation_result: Dict[str, Any],
    ) -> None:
        """Apply policy enforcement actions."""
        try:
            for action in policy.actions:
                if action == EnforcementAction.WARN:
                    evaluation_result["warnings"].append(
                        violation["description"]
                    )
                elif action == EnforcementAction.BLOCK:
                    evaluation_result["approved"] = False
                    evaluation_result["violations"].append(violation)
                elif action == EnforcementAction.ESCALATE:
                    evaluation_result["requires_approval"] = True
                elif action == EnforcementAction.QUARANTINE:
                    evaluation_result["approved"] = False
                    evaluation_result["recommendations"].append(
                        "Request requires manual review"
                    )

        except Exception as e:
            logger.error(f"Policy action application failed: {str(e)}")

    async def record_violation(
        self,
        tenant_id: UUID,
        policy_id: str,
        user_id: Optional[UUID],
        violation_details: Dict[str, Any],
    ) -> PolicyViolation:
        """Record a policy violation."""
        try:
            violation_id = f"violation_{uuid.uuid4().hex}"

            violation = PolicyViolation(
                id=violation_id,
                policy_id=policy_id,
                tenant_id=tenant_id,
                user_id=user_id,
                violation_type=violation_details.get("type", ""),
                severity=violation_details.get(
                    "severity", PolicySeverity.MEDIUM
                ),
                description=violation_details.get("description", ""),
                details=violation_details.get("details", {}),
                action_taken=violation_details.get("action_taken"),
            )

            self.violations[violation_id] = violation

            # Create audit log entry
            await self._create_audit_log(
                tenant_id=tenant_id,
                user_id=user_id,
                event_type=AuditEventType.POLICY_VIOLATION,
                details={
                    "violation_id": violation_id,
                    "policy_id": policy_id,
                    "description": violation.description,
                },
            )

            logger.info(f"Recorded policy violation: {violation_id}")
            return violation

        except Exception as e:
            logger.error(f"Violation recording failed: {str(e)}")
            raise

    async def create_approval_workflow(
        self, tenant_id: UUID, workflow_data: Dict[str, Any]
    ) -> ApprovalWorkflow:
        """Create an approval workflow."""
        try:
            workflow_id = f"workflow_{uuid.uuid4().hex}"

            workflow = ApprovalWorkflow(
                id=workflow_id, tenant_id=tenant_id, **workflow_data
            )

            self.workflows[workflow_id] = workflow

            logger.info(f"Created approval workflow: {workflow_id}")
            return workflow

        except Exception as e:
            logger.error(f"Approval workflow creation failed: {str(e)}")
            raise

    async def request_approval(
        self,
        workflow_id: str,
        tenant_id: UUID,
        requested_by: UUID,
        request_details: Dict[str, Any],
    ) -> ApprovalRequest:
        """Create an approval request."""
        try:
            if workflow_id not in self.workflows:
                raise ValueError(f"Workflow {workflow_id} not found")

            workflow = self.workflows[workflow_id]

            if workflow.tenant_id != tenant_id:
                raise ValueError(
                    "Workflow does not belong to the specified tenant"
                )

            request_id = f"approval_{uuid.uuid4().hex}"

            # Set expiration
            expires_at = datetime.utcnow() + timedelta(
                hours=workflow.timeout_hours
            )

            approval_request = ApprovalRequest(
                id=request_id,
                workflow_id=workflow_id,
                tenant_id=tenant_id,
                requested_by=requested_by,
                approvers=[],  # Would be populated from workflow
                expires_at=expires_at,
                **request_details,
            )

            self.approval_requests[request_id] = approval_request

            logger.info(f"Created approval request: {request_id}")
            return approval_request

        except Exception as e:
            logger.error(f"Approval request creation failed: {str(e)}")
            raise

    async def process_approval(
        self,
        request_id: str,
        approver_id: UUID,
        approved: bool,
        notes: Optional[str] = None,
    ) -> bool:
        """Process an approval decision."""
        try:
            if request_id not in self.approval_requests:
                raise ValueError(f"Approval request {request_id} not found")

            request = self.approval_requests[request_id]

            approval_record = {
                "approver_id": approver_id,
                "approved": approved,
                "notes": notes,
                "timestamp": datetime.utcnow(),
            }

            request.approvals_received.append(approval_record)
            request.updated_at = datetime.utcnow()

            # Check if request is fully approved or denied
            if approved:
                if request.require_all_approvers:
                    # Check if all required approvers have approved
                    if len(request.approvals_received) >= len(
                        request.approvers
                    ):
                        request.status = "approved"
                else:
                    # Any approval is sufficient
                    request.status = "approved"
            else:
                # Any denial denies the request
                request.status = "rejected"

            # Create audit log
            await self._create_audit_log(
                tenant_id=request.tenant_id,
                user_id=approver_id,
                event_type=(
                    AuditEventType.APPROVAL_GRANTED
                    if approved
                    else AuditEventType.APPROVAL_DENIED
                ),
                details={
                    "request_id": request_id,
                    "approved": approved,
                    "notes": notes,
                },
            )

            return request.status in ["approved", "rejected"]

        except Exception as e:
            logger.error(f"Approval processing failed: {str(e)}")
            return False

    async def generate_governance_report(
        self, tenant_id: UUID, days: int = 30
    ) -> GovernanceReport:
        """Generate a comprehensive governance report."""
        try:
            period_start = datetime.utcnow() - timedelta(days=days)

            # Get tenant policies
            tenant_policies = [
                p for p in self.policies.values() if p.tenant_id == tenant_id
            ]
            total_policies = len(tenant_policies)
            enabled_policies = len([p for p in tenant_policies if p.enabled])

            # Get violations for the period
            period_violations = [
                v
                for v in self.violations.values()
                if v.tenant_id == tenant_id and v.occurred_at >= period_start
            ]

            total_violations = len(period_violations)
            resolved_violations = len(
                [v for v in period_violations if v.resolved]
            )
            critical_violations = len(
                [
                    v
                    for v in period_violations
                    if v.severity == PolicySeverity.CRITICAL
                ]
            )

            # Calculate compliance score
            compliance_score = 100.0
            if total_policies > 0:
                violation_penalty = (
                    total_violations / total_policies
                ) * 20  # 20% penalty per violation
                compliance_score = max(0, 100 - violation_penalty)

            # Generate recommendations
            recommendations = await self._generate_governance_recommendations(
                tenant_id, period_violations, enabled_policies
            )

            # Identify critical issues
            critical_issues = []
            if critical_violations > 0:
                critical_issues.append(
                    f"{critical_violations} critical violations detected"
                )
            if compliance_score < 70:
                critical_issues.append("Compliance score below 70%")
            if total_violations > resolved_violations:
                critical_issues.append(
                    f"{total_violations - resolved_violations} unresolved violations"
                )

            report = GovernanceReport(
                tenant_id=tenant_id,
                report_period=f"Last {days} days",
                generated_at=datetime.utcnow(),
                total_policies=total_policies,
                compliant_policies=enabled_policies,  # Simplified
                violated_policies=total_violations,
                compliance_score=compliance_score,
                total_violations=total_violations,
                resolved_violations=resolved_violations,
                critical_violations=critical_violations,
                recommendations=recommendations,
                critical_issues=critical_issues,
            )

            return report

        except Exception as e:
            logger.error(f"Governance report generation failed: {str(e)}")
            raise

    async def _generate_governance_recommendations(
        self,
        tenant_id: UUID,
        violations: List[PolicyViolation],
        enabled_policies: int,
    ) -> List[str]:
        """Generate governance recommendations."""
        recommendations = []

        # Policy coverage recommendations
        if enabled_policies < 5:
            recommendations.append(
                "Consider implementing more governance"
                "policies for comprehensive coverage"
            )

        # Violation-based recommendations
        violation_types = {}
        for violation in violations:
            violation_types[violation.violation_type] = (
                violation_types.get(violation.violation_type, 0) + 1
            )

        if violation_types.get("cost_control", 0) > 5:
            recommendations.append("Implement stricter cost control measures")

        if violation_types.get("model_restriction", 0) > 0:
            recommendations.append(
                "Review model access policies and restrictions"
            )

        # General recommendations
        recommendations.extend(
            [
                "Regularly review and update governance policies",
                "Provide governance training to users",
                "Implement automated monitoring and alerting",
                "Conduct periodic compliance audits",
            ]
        )

        return recommendations

    async def _create_audit_log(
        self,
        tenant_id: UUID,
        user_id: Optional[UUID],
        event_type: AuditEventType,
        details: Dict[str, Any],
    ) -> None:
        """Create an audit log entry."""
        try:
            audit_log = AuditLog(
                tenant_id=tenant_id,
                user_id=user_id,
                action=event_type.value,
                resource_type="governance",
                resource_id=details.get("id", ""),
                details=details,
                ip_address="system",  # Would get actual IP
                user_agent="governance_service",
            )

            self.db.add(audit_log)
            self.db.commit()

        except Exception as e:
            logger.error(f"Audit log creation failed: {str(e)}")

    async def get_policy_violations(
        self,
        tenant_id: UUID,
        resolved: Optional[bool] = None,
        severity: Optional[PolicySeverity] = None,
        days: int = 30,
    ) -> List[PolicyViolation]:
        """Get policy violations with filtering."""
        try:
            period_start = datetime.utcnow() - timedelta(days=days)

            violations = [
                v
                for v in self.violations.values()
                if v.tenant_id == tenant_id and v.occurred_at >= period_start
            ]

            if resolved is not None:
                violations = [v for v in violations if v.resolved == resolved]

            if severity:
                violations = [v for v in violations if v.severity == severity]

            return violations

        except Exception as e:
            logger.error(f"Violation retrieval failed: {str(e)}")
            return []

    async def resolve_violation(
        self, violation_id: str, resolved_by: UUID, resolution_notes: str
    ) -> bool:
        """Resolve a policy violation."""
        try:
            if violation_id not in self.violations:
                return False

            violation = self.violations[violation_id]
            violation.resolved = True
            violation.resolved_by = resolved_by
            violation.resolved_at = datetime.utcnow()
            violation.resolution_notes = resolution_notes

            # Create audit log
            await self._create_audit_log(
                tenant_id=violation.tenant_id,
                user_id=resolved_by,
                event_type=AuditEventType.POLICY_VIOLATION,
                details={
                    "violation_id": violation_id,
                    "action": "resolved",
                    "notes": resolution_notes,
                },
            )

            return True

        except Exception as e:
            logger.error(f"Violation resolution failed: {str(e)}")
            return False

    async def get_tenant_governance_score(
        self, tenant_id: UUID, days: int = 30
    ) -> Dict[str, Any]:
        """Get tenant's governance score and metrics."""
        try:
            report = await self.generate_governance_report(tenant_id, days)

            score_details = {
                "overall_score": report.compliance_score,
                "policy_coverage": (
                    report.compliant_policies / max(report.total_policies, 1)
                )
                * 100,
                "violation_rate": (
                    report.total_violations / max(report.compliant_policies, 1)
                )
                * 100,
                "resolution_rate": (
                    report.resolved_violations
                    / max(report.total_violations, 1)
                )
                * 100,
                "critical_issues": len(report.critical_issues),
                "period_days": days,
            }

            return score_details

        except Exception as e:
            logger.error(f"Governance score calculation failed: {str(e)}")
            return {"error": str(e)}

    async def health_check(self) -> Dict[str, Any]:
        """Perform health check on governance service."""
        try:
            health_status = {
                "status": "healthy",
                "policies_count": len(self.policies),
                "enabled_policies": len(
                    [p for p in self.policies.values() if p.enabled]
                ),
                "violations_count": len(self.violations),
                "unresolved_violations": len(
                    [v for v in self.violations.values() if not v.resolved]
                ),
                "workflows_count": len(self.workflows),
                "active_workflows": len(
                    [w for w in self.workflows.values() if w.enabled]
                ),
                "approval_requests_count": len(self.approval_requests),
                "pending_approvals": len(
                    [
                        r
                        for r in self.approval_requests.values()
                        if r.status == "pending"
                    ]
                ),
                "policy_types_supported": len(PolicyType),
                "enforcement_actions_supported": len(EnforcementAction),
            }

            return health_status

        except Exception as e:
            return {"status": "unhealthy", "error": str(e)}
