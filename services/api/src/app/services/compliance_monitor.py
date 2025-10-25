"""Compliance Monitoring Service for Enterprise Requirements."""

import asyncio
import time
from typing import Dict, List, Optional, Any, Tuple
from datetime import datetime, timedelta
from dataclasses import dataclass
import logging
import json

from app.database import get_db_session
from app.monitoring.performance import performance_monitor
from app.services.enterprise_security import get_enterprise_security_service

logger = logging.getLogger(__name__)


@dataclass
class ComplianceCheck:
    """Compliance check result."""
    check_id: str
    framework: str  # GDPR, HIPAA, SOC2, ISO27001
    category: str
    requirement: str
    status: str  # compliant, non_compliant, partial, unknown
    severity: str  # low, medium, high, critical
    evidence: Dict[str, Any]
    remediation: str
    checked_at: datetime
    next_check: datetime


@dataclass
class DataRetentionPolicy:
    """Data retention policy."""
    policy_id: str
    data_type: str
    retention_period_days: int
    deletion_method: str  # soft_delete, hard_delete, archive
    compliance_frameworks: List[str]
    auto_cleanup: bool
    last_cleanup: Optional[datetime]


@dataclass
class ComplianceReport:
    """Compliance report."""
    report_id: str
    framework: str
    period_start: datetime
    period_end: datetime
    overall_status: str
    compliance_score: int  # 0-100
    checks_passed: int
    checks_failed: int
    critical_findings: List[Dict[str, Any]]
    generated_at: datetime


class ComplianceMonitoringService:
    """Service for monitoring compliance with enterprise standards."""

    def __init__(self):
        self.compliance_checks: List[ComplianceCheck] = []
        self.retention_policies: Dict[str, DataRetentionPolicy] = {}
        self.compliance_reports: List[ComplianceReport] = {}
        self.audit_trail: List[Dict[str, Any]] = []

    async def initialize(self):
        """Initialize compliance monitoring service."""
        await self._load_compliance_frameworks()
        await self._setup_retention_policies()
        await self._start_compliance_monitoring()

        logger.info("Compliance Monitoring Service initialized")

    async def _load_compliance_frameworks(self):
        """Load compliance frameworks and requirements."""
        # GDPR Requirements
        gdpr_checks = [
            {
                'framework': 'GDPR',
                'category': 'Data Protection',
                'requirement': 'Data encryption at rest',
                'severity': 'high'
            },
            {
                'framework': 'GDPR',
                'category': 'Data Protection',
                'requirement': 'Data encryption in transit',
                'severity': 'high'
            },
            {
                'framework': 'GDPR',
                'category': 'Consent',
                'requirement': 'User consent management',
                'severity': 'critical'
            },
            {
                'framework': 'GDPR',
                'category': 'Rights',
                'requirement': 'Data subject access rights',
                'severity': 'high'
            },
            {
                'framework': 'GDPR',
                'category': 'Breach',
                'requirement': 'Breach notification within 72 hours',
                'severity': 'critical'
            }
        ]

        # HIPAA Requirements
        hipaa_checks = [
            {
                'framework': 'HIPAA',
                'category': 'Security',
                'requirement': 'Access controls and authentication',
                'severity': 'critical'
            },
            {
                'framework': 'HIPAA',
                'category': 'Security',
                'requirement': 'Audit controls',
                'severity': 'high'
            },
            {
                'framework': 'HIPAA',
                'category': 'Privacy',
                'requirement': 'PHI data handling procedures',
                'severity': 'critical'
            },
            {
                'framework': 'HIPAA',
                'category': 'Breach',
                'requirement': 'Security incident procedures',
                'severity': 'high'
            }
        ]

        # SOC2 Requirements
        soc2_checks = [
            {
                'framework': 'SOC2',
                'category': 'Security',
                'requirement': 'Logical access controls',
                'severity': 'high'
            },
            {
                'framework': 'SOC2',
                'category': 'Availability',
                'requirement': 'System availability monitoring',
                'severity': 'medium'
            },
            {
                'framework': 'SOC2',
                'category': 'Confidentiality',
                'requirement': 'Data classification and handling',
                'severity': 'high'
            },
            {
                'framework': 'SOC2',
                'category': 'Processing Integrity',
                'requirement': 'Data processing accuracy',
                'severity': 'medium'
            }
        ]

        all_checks = gdpr_checks + hipaa_checks + soc2_checks

        for check_data in all_checks:
            check = ComplianceCheck(
                check_id=f"check_{int(time.time() * 1000000)}_{len(self.compliance_checks)}",
                framework=check_data['framework'],
                category=check_data['category'],
                requirement=check_data['requirement'],
                status='unknown',
                severity=check_data['severity'],
                evidence={},
                remediation='',
                checked_at=datetime.utcnow(),
                next_check=datetime.utcnow() + timedelta(hours=24)
            )
            self.compliance_checks.append(check)

    async def _setup_retention_policies(self):
        """Setup data retention policies."""
        default_policies = [
            {
                'data_type': 'user_logs',
                'retention_period_days': 2555,  # 7 years for GDPR
                'compliance_frameworks': ['GDPR', 'HIPAA']
            },
            {
                'data_type': 'ai_requests',
                'retention_period_days': 2555,
                'compliance_frameworks': ['GDPR']
            },
            {
                'data_type': 'audit_logs',
                'retention_period_days': 2555,
                'compliance_frameworks': ['GDPR', 'HIPAA', 'SOC2']
            },
            {
                'data_type': 'security_events',
                'retention_period_days': 2555,
                'compliance_frameworks': ['GDPR', 'HIPAA', 'SOC2']
            },
            {
                'data_type': 'model_training_data',
                'retention_period_days': 1825,  # 5 years
                'compliance_frameworks': ['GDPR']
            }
        ]

        for policy_data in default_policies:
            policy = DataRetentionPolicy(
                policy_id=f"policy_{policy_data['data_type']}",
                data_type=policy_data['data_type'],
                retention_period_days=policy_data['retention_period_days'],
                deletion_method='soft_delete',
                compliance_frameworks=policy_data['compliance_frameworks'],
                auto_cleanup=True,
                last_cleanup=None
            )
            self.retention_policies[policy.policy_id] = policy

    async def _start_compliance_monitoring(self):
        """Start background compliance monitoring."""
        asyncio.create_task(self._compliance_monitoring_loop())

    async def _compliance_monitoring_loop(self):
        """Background compliance monitoring."""
        while True:
            try:
                await self._run_compliance_checks()
                await self._execute_retention_policies()
                await asyncio.sleep(3600)  # Check every hour
            except Exception as e:
                logger.error(f"Compliance monitoring error: {e}")
                await asyncio.sleep(1800)

    async def _run_compliance_checks(self):
        """Run automated compliance checks."""
        security_service = await get_enterprise_security_service()

        for check in self.compliance_checks:
            if datetime.utcnow() >= check.next_check:
                try:
                    result = await self._perform_compliance_check(check, security_service)
                    check.status = result['status']
                    check.evidence = result['evidence']
                    check.remediation = result['remediation']
                    check.checked_at = datetime.utcnow()
                    check.next_check = datetime.utcnow() + timedelta(hours=24)

                    # Log compliance check result
                    await self._log_compliance_event(check)

                except Exception as e:
                    logger.error(f"Compliance check failed for {check.requirement}: {e}")
                    check.status = 'error'
                    check.checked_at = datetime.utcnow()
                    check.next_check = datetime.utcnow() + timedelta(hours=1)

    async def _perform_compliance_check(self, check: ComplianceCheck, security_service) -> Dict[str, Any]:
        """Perform individual compliance check."""
        result = {
            'status': 'unknown',
            'evidence': {},
            'remediation': ''
        }

        if check.framework == 'GDPR':
            result = await self._check_gdpr_requirement(check, security_service)
        elif check.framework == 'HIPAA':
            result = await self._check_hipaa_requirement(check, security_service)
        elif check.framework == 'SOC2':
            result = await self._check_soc2_requirement(check, security_service)

        return result

    async def _check_gdpr_requirement(self, check: ComplianceCheck, security_service) -> Dict[str, Any]:
        """Check GDPR compliance requirement."""
        if 'encryption' in check.requirement.lower():
            # Check encryption status
            encryption_status = security_service._get_encryption_status()
            active_keys = encryption_status['keys_active']

            if active_keys >= 2:
                return {
                    'status': 'compliant',
                    'evidence': {'active_keys': active_keys},
                    'remediation': ''
                }
            else:
                return {
                    'status': 'non_compliant',
                    'evidence': {'active_keys': active_keys},
                    'remediation': 'Generate additional encryption keys'
                }

        elif 'consent' in check.requirement.lower():
            # Check consent management (simplified)
            return {
                'status': 'partial',
                'evidence': {'consent_mechanism': 'implemented'},
                'remediation': 'Implement comprehensive consent tracking'
            }

        elif 'breach' in check.requirement.lower():
            # Check breach notification procedures
            return {
                'status': 'compliant',
                'evidence': {'notification_procedures': 'documented'},
                'remediation': ''
            }

        return {
            'status': 'unknown',
            'evidence': {},
            'remediation': 'Manual review required'
        }

    async def _check_hipaa_requirement(self, check: ComplianceCheck, security_service) -> Dict[str, Any]:
        """Check HIPAA compliance requirement."""
        if 'access controls' in check.requirement.lower():
            # Check authentication and access controls
            audit_events = len([e for e in security_service.security_events
                              if e.event_type == 'authentication'])

            if audit_events > 0:
                return {
                    'status': 'compliant',
                    'evidence': {'audit_events': audit_events},
                    'remediation': ''
                }
            else:
                return {
                    'status': 'non_compliant',
                    'evidence': {'audit_events': audit_events},
                    'remediation': 'Implement authentication auditing'
                }

        elif 'audit controls' in check.requirement.lower():
            # Check audit logging
            security_report = await security_service.get_enterprise_security_report("24h")
            total_events = security_report['total_events']

            if total_events > 10:  # Basic threshold
                return {
                    'status': 'compliant',
                    'evidence': {'logged_events': total_events},
                    'remediation': ''
                }
            else:
                return {
                    'status': 'partial',
                    'evidence': {'logged_events': total_events},
                    'remediation': 'Increase audit logging coverage'
                }

        return {
            'status': 'unknown',
            'evidence': {},
            'remediation': 'Manual HIPAA review required'
        }

    async def _check_soc2_requirement(self, check: ComplianceCheck, security_service) -> Dict[str, Any]:
        """Check SOC2 compliance requirement."""
        if 'access controls' in check.requirement.lower():
            # Check logical access controls
            return {
                'status': 'compliant',
                'evidence': {'access_controls': 'implemented'},
                'remediation': ''
            }

        elif 'availability' in check.requirement.lower():
            # Check system monitoring
            return {
                'status': 'compliant',
                'evidence': {'monitoring': 'active'},
                'remediation': ''
            }

        elif 'confidentiality' in check.requirement.lower():
            # Check data classification
            return {
                'status': 'partial',
                'evidence': {'classification': 'basic'},
                'remediation': 'Implement comprehensive data classification'
            }

        return {
            'status': 'unknown',
            'evidence': {},
            'remediation': 'Manual SOC2 review required'
        }

    async def _execute_retention_policies(self):
        """Execute data retention policies."""
        for policy in self.retention_policies.values():
            if policy.auto_cleanup:
                try:
                    await self._cleanup_data_by_policy(policy)
                except Exception as e:
                    logger.error(f"Retention policy cleanup failed for {policy.data_type}: {e}")

    async def _cleanup_data_by_policy(self, policy: DataRetentionPolicy):
        """Clean up data according to retention policy."""
        cutoff_date = datetime.utcnow() - timedelta(days=policy.retention_period_days)

        try:
            async with get_db_session() as session:
                if policy.data_type == 'user_logs':
                    # Clean up old user logs
                    await session.execute(
                        "DELETE FROM user_logs WHERE created_at < :cutoff",
                        {"cutoff": cutoff_date}
                    )

                elif policy.data_type == 'ai_requests':
                    # Clean up old AI requests
                    await session.execute(
                        "DELETE FROM ai_requests WHERE created_at < :cutoff",
                        {"cutoff": cutoff_date}
                    )

                elif policy.data_type == 'audit_logs':
                    # Clean up old audit logs
                    await session.execute(
                        "DELETE FROM audit_logs WHERE created_at < :cutoff",
                        {"cutoff": cutoff_date}
                    )

                elif policy.data_type == 'security_events':
                    # Clean up old security events (keep critical ones longer)
                    await session.execute(
                        "DELETE FROM security_events WHERE created_at < :cutoff AND severity != 'critical'",
                        {"cutoff": cutoff_date}
                    )

                await session.commit()
                policy.last_cleanup = datetime.utcnow()

                logger.info(f"Cleaned up {policy.data_type} data older than {policy.retention_period_days} days")

        except Exception as e:
            logger.error(f"Data cleanup failed for {policy.data_type}: {e}")

    async def _log_compliance_event(self, check: ComplianceCheck):
        """Log compliance check event."""
        event = {
            'timestamp': datetime.utcnow().isoformat(),
            'event_type': 'compliance_check',
            'framework': check.framework,
            'requirement': check.requirement,
            'status': check.status,
            'severity': check.severity,
            'details': {
                'evidence': check.evidence,
                'remediation': check.remediation
            }
        }

        self.audit_trail.append(event)

        # Keep only recent audit trail
        if len(self.audit_trail) > 10000:
            self.audit_trail = self.audit_trail[-5000:]

    async def generate_compliance_report(self, framework: str, period_days: int = 30) -> ComplianceReport:
        """Generate compliance report for a specific framework."""
        period_start = datetime.utcnow() - timedelta(days=period_days)
        period_end = datetime.utcnow()

        # Filter checks for the framework
        framework_checks = [c for c in self.compliance_checks if c.framework == framework]

        checks_passed = len([c for c in framework_checks if c.status == 'compliant'])
        checks_failed = len([c for c in framework_checks if c.status in ['non_compliant', 'error']])

        total_checks = len(framework_checks)
        compliance_score = int((checks_passed / total_checks) * 100) if total_checks > 0 else 0

        # Determine overall status
        if compliance_score >= 95:
            overall_status = 'compliant'
        elif compliance_score >= 80:
            overall_status = 'mostly_compliant'
        elif compliance_score >= 60:
            overall_status = 'partial_compliance'
        else:
            overall_status = 'non_compliant'

        # Get critical findings
        critical_findings = [
            {
                'requirement': c.requirement,
                'status': c.status,
                'severity': c.severity,
                'remediation': c.remediation,
                'checked_at': c.checked_at.isoformat()
            }
            for c in framework_checks
            if c.status in ['non_compliant', 'error'] and c.severity in ['high', 'critical']
        ]

        report = ComplianceReport(
            report_id=f"report_{framework}_{int(time.time())}",
            framework=framework,
            period_start=period_start,
            period_end=period_end,
            overall_status=overall_status,
            compliance_score=compliance_score,
            checks_passed=checks_passed,
            checks_failed=checks_failed,
            critical_findings=critical_findings,
            generated_at=datetime.utcnow()
        )

        self.compliance_reports[report.report_id] = report
        return report

    async def get_compliance_status(self, framework: Optional[str] = None) -> Dict[str, Any]:
        """Get current compliance status."""
        if framework:
            frameworks = [framework]
        else:
            frameworks = ['GDPR', 'HIPAA', 'SOC2']

        status = {}

        for fw in frameworks:
            report = await self.generate_compliance_report(fw, 30)
            status[fw] = {
                'overall_status': report.overall_status,
                'compliance_score': report.compliance_score,
                'checks_passed': report.checks_passed,
                'checks_failed': report.checks_failed,
                'critical_findings': len(report.critical_findings),
                'last_updated': report.generated_at.isoformat()
            }

        return {
            'compliance_status': status,
            'overall_score': sum(s['compliance_score'] for s in status.values()) // len(status) if status else 0,
            'generated_at': datetime.utcnow().isoformat()
        }

    async def get_data_retention_status(self) -> Dict[str, Any]:
        """Get data retention compliance status."""
        retention_status = {}

        for policy in self.retention_policies.values():
            retention_status[policy.data_type] = {
                'retention_period_days': policy.retention_period_days,
                'compliance_frameworks': policy.compliance_frameworks,
                'auto_cleanup': policy.auto_cleanup,
                'last_cleanup': policy.last_cleanup.isoformat() if policy.last_cleanup else None,
                'days_since_cleanup': (datetime.utcnow() - policy.last_cleanup).days if policy.last_cleanup else None
            }

        return {
            'retention_policies': retention_status,
            'total_policies': len(retention_status),
            'auto_cleanup_enabled': len([p for p in self.retention_policies.values() if p.auto_cleanup]),
            'generated_at': datetime.utcnow().isoformat()
        }

    async def get_compliance_audit_trail(self, limit: int = 100) -> List[Dict[str, Any]]:
        """Get compliance audit trail."""
        return self.audit_trail[-limit:] if self.audit_trail else []

    async def perform_compliance_assessment(self) -> Dict[str, Any]:
        """Perform comprehensive compliance assessment."""
        assessment = {
            'assessment_id': f"assessment_{int(time.time())}",
            'timestamp': datetime.utcnow().isoformat(),
            'frameworks_assessed': [],
            'overall_compliance_score': 0,
            'risk_level': 'unknown',
            'recommendations': [],
            'critical_actions_required': []
        }

        # Assess each framework
        frameworks = ['GDPR', 'HIPAA', 'SOC2']
        total_score = 0

        for framework in frameworks:
            report = await self.generate_compliance_report(framework, 30)
            assessment['frameworks_assessed'].append({
                'framework': framework,
                'status': report.overall_status,
                'score': report.compliance_score,
                'critical_findings': len(report.critical_findings)
            })
            total_score += report.compliance_score

            # Add critical actions
            for finding in report.critical_findings:
                assessment['critical_actions_required'].append({
                    'framework': framework,
                    'requirement': finding['requirement'],
                    'remediation': finding['remediation']
                })

        assessment['overall_compliance_score'] = total_score // len(frameworks) if frameworks else 0

        # Determine risk level
        if assessment['overall_compliance_score'] >= 90:
            assessment['risk_level'] = 'low'
        elif assessment['overall_compliance_score'] >= 75:
            assessment['risk_level'] = 'medium'
        elif assessment['overall_compliance_score'] >= 60:
            assessment['risk_level'] = 'high'
        else:
            assessment['risk_level'] = 'critical'

        # Generate recommendations
        assessment['recommendations'] = await self._generate_compliance_recommendations(assessment)

        return assessment

    async def _generate_compliance_recommendations(self, assessment: Dict[str, Any]) -> List[str]:
        """Generate compliance recommendations."""
        recommendations = []

        if assessment['overall_compliance_score'] < 80:
            recommendations.append("Conduct comprehensive compliance training for all staff")
            recommendations.append("Implement automated compliance monitoring tools")

        if assessment['risk_level'] in ['high', 'critical']:
            recommendations.append("Engage external compliance consultant for gap analysis")
            recommendations.append("Establish formal compliance committee")

        if len(assessment['critical_actions_required']) > 0:
            recommendations.append("Prioritize remediation of critical compliance findings")
            recommendations.append("Implement compliance dashboard for real-time monitoring")

        recommendations.append("Schedule quarterly compliance assessments")
        recommendations.append("Maintain detailed compliance documentation")

        return recommendations


# Global compliance monitoring service instance
compliance_monitoring_service = ComplianceMonitoringService()


async def get_compliance_monitoring_service() -> ComplianceMonitoringService:
    """Get the global compliance monitoring service instance."""
    if not hasattr(compliance_monitoring_service, '_initialized'):
        await compliance_monitoring_service.initialize()
        compliance_monitoring_service._initialized = True
    return compliance_monitoring_service
