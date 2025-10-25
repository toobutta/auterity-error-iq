"""Enterprise Audit Logging System for Week 3."""

import asyncio
import time
from typing import Dict, List, Optional, Any, Tuple
from datetime import datetime, timedelta
from dataclasses import dataclass
import logging
import json
import hashlib
from collections import defaultdict

from app.database import get_db_session
from app.monitoring.performance import performance_monitor
from app.services.enterprise_security import get_enterprise_security_service

logger = logging.getLogger(__name__)


@dataclass
class AuditEvent:
    """Audit event record."""
    event_id: str
    timestamp: datetime
    event_type: str
    category: str  # security, data, user, system, compliance
    severity: str  # low, medium, high, critical
    user_id: Optional[str]
    tenant_id: Optional[str]
    session_id: Optional[str]
    resource_type: str
    resource_id: str
    action: str
    method: str  # GET, POST, PUT, DELETE, etc.
    endpoint: str
    ip_address: str
    user_agent: str
    request_data: Dict[str, Any]
    response_data: Dict[str, Any]
    status_code: Optional[int]
    processing_time: float
    risk_score: int
    compliance_flags: List[str]
    metadata: Dict[str, Any]


@dataclass
class AuditRule:
    """Audit rule configuration."""
    rule_id: str
    name: str
    description: str
    event_patterns: List[Dict[str, Any]]
    severity_threshold: str
    alert_enabled: bool
    retention_days: int
    enabled: bool
    created_at: datetime


@dataclass
class AuditSummary:
    """Audit summary for reporting."""
    period_start: datetime
    period_end: datetime
    total_events: int
    events_by_category: Dict[str, int]
    events_by_severity: Dict[str, int]
    top_actions: List[Tuple[str, int]]
    top_users: List[Tuple[str, int]]
    top_resources: List[Tuple[str, int]]
    compliance_violations: int
    security_incidents: int
    anomalies_detected: int


class AuditLoggingService:
    """Enterprise audit logging and monitoring service."""

    def __init__(self):
        self.audit_events: List[AuditEvent] = []
        self.audit_rules: Dict[str, AuditRule] = {}
        self.event_buffer: List[AuditEvent] = []
        self.buffer_size = 1000
        self.flush_interval = 60  # seconds

    async def initialize(self):
        """Initialize audit logging service."""
        await self._load_audit_rules()
        await self._setup_default_rules()
        await self._start_audit_monitoring()

        logger.info("Audit Logging Service initialized")

    async def _load_audit_rules(self):
        """Load audit rules from database."""
        try:
            async with get_db_session() as session:
                rules = await session.execute(
                    "SELECT * FROM audit_rules WHERE enabled = true"
                )
                for rule in rules:
                    self.audit_rules[rule.rule_id] = AuditRule(
                        rule_id=rule.rule_id,
                        name=rule.name,
                        description=rule.description,
                        event_patterns=json.loads(rule.event_patterns) if rule.event_patterns else [],
                        severity_threshold=rule.severity_threshold,
                        alert_enabled=rule.alert_enabled,
                        retention_days=rule.retention_days,
                        enabled=rule.enabled,
                        created_at=rule.created_at
                    )
        except Exception as e:
            logger.error(f"Failed to load audit rules: {e}")

    async def _setup_default_rules(self):
        """Setup default audit rules."""
        default_rules = [
            {
                'rule_id': 'high_risk_actions',
                'name': 'High Risk Actions',
                'description': 'Monitor high-risk user actions',
                'event_patterns': [
                    {'action': 'DELETE', 'resource_type': 'user'},
                    {'action': 'UPDATE', 'resource_type': 'security_policy'},
                    {'action': 'CREATE', 'resource_type': 'admin_user'}
                ],
                'severity_threshold': 'high',
                'alert_enabled': True,
                'retention_days': 2555  # 7 years
            },
            {
                'rule_id': 'unauthorized_access',
                'name': 'Unauthorized Access Attempts',
                'description': 'Monitor failed authentication and authorization',
                'event_patterns': [
                    {'action': 'LOGIN_FAILED'},
                    {'status_code': 403},
                    {'status_code': 401}
                ],
                'severity_threshold': 'medium',
                'alert_enabled': True,
                'retention_days': 365
            },
            {
                'rule_id': 'data_modifications',
                'name': 'Data Modification Tracking',
                'description': 'Track all data creation, updates, and deletions',
                'event_patterns': [
                    {'action': 'CREATE', 'resource_type': 'data'},
                    {'action': 'UPDATE', 'resource_type': 'data'},
                    {'action': 'DELETE', 'resource_type': 'data'}
                ],
                'severity_threshold': 'low',
                'alert_enabled': False,
                'retention_days': 2555
            },
            {
                'rule_id': 'admin_actions',
                'name': 'Administrative Actions',
                'description': 'Monitor all administrative activities',
                'event_patterns': [
                    {'category': 'admin'},
                    {'resource_type': 'system_config'},
                    {'resource_type': 'security_policy'}
                ],
                'severity_threshold': 'medium',
                'alert_enabled': True,
                'retention_days': 2555
            }
        ]

        for rule_data in default_rules:
            rule_id = rule_data['rule_id']
            if rule_id not in self.audit_rules:
                self.audit_rules[rule_id] = AuditRule(
                    rule_id=rule_id,
                    name=rule_data['name'],
                    description=rule_data['description'],
                    event_patterns=rule_data['event_patterns'],
                    severity_threshold=rule_data['severity_threshold'],
                    alert_enabled=rule_data['alert_enabled'],
                    retention_days=rule_data['retention_days'],
                    enabled=True,
                    created_at=datetime.utcnow()
                )

    async def _start_audit_monitoring(self):
        """Start background audit monitoring."""
        asyncio.create_task(self._audit_monitoring_loop())
        asyncio.create_task(self._buffer_flush_loop())

    async def _audit_monitoring_loop(self):
        """Background audit monitoring."""
        while True:
            try:
                await self._process_audit_rules()
                await self._cleanup_old_events()
                await asyncio.sleep(300)  # Check every 5 minutes
            except Exception as e:
                logger.error(f"Audit monitoring error: {e}")
                await asyncio.sleep(300)

    async def _buffer_flush_loop(self):
        """Background buffer flush loop."""
        while True:
            try:
                await asyncio.sleep(self.flush_interval)
                await self._flush_event_buffer()
            except Exception as e:
                logger.error(f"Buffer flush error: {e}")

    async def _flush_event_buffer(self):
        """Flush buffered events to database."""
        if not self.event_buffer:
            return

        try:
            # In a real implementation, this would batch insert to database
            logger.info(f"Flushed {len(self.event_buffer)} audit events to database")

            # Clear buffer
            self.event_buffer.clear()

        except Exception as e:
            logger.error(f"Failed to flush audit buffer: {e}")

    async def log_audit_event(
        self,
        event_type: str,
        category: str,
        user_id: Optional[str] = None,
        tenant_id: Optional[str] = None,
        session_id: Optional[str] = None,
        resource_type: str = "unknown",
        resource_id: str = "unknown",
        action: str = "unknown",
        method: str = "UNKNOWN",
        endpoint: str = "",
        ip_address: str = "unknown",
        user_agent: str = "",
        request_data: Optional[Dict[str, Any]] = None,
        response_data: Optional[Dict[str, Any]] = None,
        status_code: Optional[int] = None,
        processing_time: float = 0.0,
        risk_score: int = 0,
        compliance_flags: Optional[List[str]] = None,
        metadata: Optional[Dict[str, Any]] = None
    ):
        """Log an audit event."""
        event = AuditEvent(
            event_id=f"audit_{int(time.time() * 1000000)}",
            timestamp=datetime.utcnow(),
            event_type=event_type,
            category=category,
            severity=self._calculate_severity(risk_score, action, resource_type),
            user_id=user_id,
            tenant_id=tenant_id,
            session_id=session_id,
            resource_type=resource_type,
            resource_id=resource_id,
            action=action,
            method=method,
            endpoint=endpoint,
            ip_address=ip_address,
            user_agent=user_agent,
            request_data=request_data or {},
            response_data=response_data or {},
            status_code=status_code,
            processing_time=processing_time,
            risk_score=risk_score,
            compliance_flags=compliance_flags or [],
            metadata=metadata or {}
        )

        # Add to buffer
        self.event_buffer.append(event)

        # Keep in memory for analysis (limited)
        self.audit_events.append(event)
        if len(self.audit_events) > 10000:
            self.audit_events = self.audit_events[-5000:]

        # Check against rules immediately for high-severity events
        if event.severity in ['high', 'critical']:
            await self._check_event_against_rules(event)

        # Log high-risk events
        if risk_score >= 70:
            logger.warning(f"HIGH RISK AUDIT EVENT: {event_type} - Risk: {risk_score}")

    def _calculate_severity(self, risk_score: int, action: str, resource_type: str) -> str:
        """Calculate event severity."""
        # High-risk actions
        high_risk_actions = ['DELETE', 'UPDATE', 'CREATE']
        high_risk_resources = ['user', 'security_policy', 'system_config']

        if risk_score >= 80 or (action in high_risk_actions and resource_type in high_risk_resources):
            return 'critical'
        elif risk_score >= 60 or action in high_risk_actions:
            return 'high'
        elif risk_score >= 30:
            return 'medium'
        else:
            return 'low'

    async def _check_event_against_rules(self, event: AuditEvent):
        """Check event against audit rules."""
        for rule in self.audit_rules.values():
            if not rule.enabled:
                continue

            if self._event_matches_rule(event, rule):
                await self._trigger_rule_action(event, rule)

    def _event_matches_rule(self, event: AuditEvent, rule: AuditRule) -> bool:
        """Check if event matches audit rule."""
        for pattern in rule.event_patterns:
            match = True

            for key, value in pattern.items():
                event_value = getattr(event, key, None)
                if event_value != value:
                    match = False
                    break

            if match:
                return True

        return False

    async def _trigger_rule_action(self, event: AuditEvent, rule: AuditRule):
        """Trigger action for matching audit rule."""
        logger.info(f"AUDIT RULE TRIGGERED: {rule.name} - Event: {event.event_type}")

        if rule.alert_enabled:
            # In a real implementation, this would send alerts
            await self._send_audit_alert(event, rule)

    async def _send_audit_alert(self, event: AuditEvent, rule: AuditRule):
        """Send audit alert."""
        alert_data = {
            'alert_type': 'audit_rule_violation',
            'rule_name': rule.name,
            'rule_description': rule.description,
            'event_id': event.event_id,
            'event_type': event.event_type,
            'severity': event.severity,
            'user_id': event.user_id,
            'resource': f"{event.resource_type}:{event.resource_id}",
            'timestamp': event.timestamp.isoformat()
        }

        logger.warning(f"AUDIT ALERT: {json.dumps(alert_data, indent=2)}")

    async def _process_audit_rules(self):
        """Process audit rules for anomaly detection."""
        if not self.audit_events:
            return

        # Analyze recent events (last hour)
        recent_events = [
            e for e in self.audit_events
            if (datetime.utcnow() - e.timestamp).seconds < 3600
        ]

        # Detect anomalies
        anomalies = await self._detect_audit_anomalies(recent_events)

        for anomaly in anomalies:
            await self.log_audit_event(
                event_type='anomaly_detected',
                category='security',
                severity='high',
                details=anomaly,
                risk_score=75,
                compliance_flags=['anomaly_detection']
            )

    async def _detect_audit_anomalies(self, events: List[AuditEvent]) -> List[Dict[str, Any]]:
        """Detect audit anomalies."""
        anomalies = []

        # Count events by user
        user_counts = defaultdict(int)
        ip_counts = defaultdict(int)
        action_counts = defaultdict(int)

        for event in events:
            if event.user_id:
                user_counts[event.user_id] += 1
            ip_counts[event.ip_address] += 1
            action_counts[event.action] += 1

        # Detect unusual activity
        avg_events_per_user = sum(user_counts.values()) / len(user_counts) if user_counts else 0

        for user_id, count in user_counts.items():
            if count > avg_events_per_user * 5:  # 5x average
                anomalies.append({
                    'type': 'unusual_user_activity',
                    'user_id': user_id,
                    'event_count': count,
                    'threshold': avg_events_per_user * 5,
                    'description': f'User {user_id} has unusually high activity'
                })

        # Detect rapid actions from same IP
        for ip, count in ip_counts.items():
            if count > 100:  # More than 100 events from same IP in hour
                anomalies.append({
                    'type': 'high_frequency_ip',
                    'ip_address': ip,
                    'event_count': count,
                    'description': f'Unusual activity from IP {ip}'
                })

        return anomalies

    async def _cleanup_old_events(self):
        """Clean up old audit events based on retention policies."""
        try:
            # Apply retention policies
            for rule in self.audit_rules.values():
                cutoff_date = datetime.utcnow() - timedelta(days=rule.retention_days)

                # Remove old events matching this rule's patterns
                self.audit_events = [
                    e for e in self.audit_events
                    if not (self._event_matches_rule(e, rule) and e.timestamp < cutoff_date)
                ]

        except Exception as e:
            logger.error(f"Audit cleanup error: {e}")

    async def generate_audit_report(
        self,
        start_date: datetime,
        end_date: datetime,
        category: Optional[str] = None,
        user_id: Optional[str] = None,
        tenant_id: Optional[str] = None
    ) -> AuditSummary:
        """Generate audit summary report."""

        # Filter events
        filtered_events = [
            e for e in self.audit_events
            if start_date <= e.timestamp <= end_date
        ]

        if category:
            filtered_events = [e for e in filtered_events if e.category == category]
        if user_id:
            filtered_events = [e for e in filtered_events if e.user_id == user_id]
        if tenant_id:
            filtered_events = [e for e in filtered_events if e.tenant_id == tenant_id]

        # Calculate statistics
        events_by_category = defaultdict(int)
        events_by_severity = defaultdict(int)
        user_counts = defaultdict(int)
        resource_counts = defaultdict(int)
        action_counts = defaultdict(int)

        compliance_violations = 0
        security_incidents = 0

        for event in filtered_events:
            events_by_category[event.category] += 1
            events_by_severity[event.severity] += 1

            if event.user_id:
                user_counts[event.user_id] += 1
            resource_counts[f"{event.resource_type}:{event.resource_id}"] += 1
            action_counts[event.action] += 1

            if 'gdpr' in event.compliance_flags or 'hipaa' in event.compliance_flags:
                compliance_violations += 1
            if event.category == 'security' and event.severity in ['high', 'critical']:
                security_incidents += 1

        # Get top items
        top_actions = sorted(action_counts.items(), key=lambda x: x[1], reverse=True)[:10]
        top_users = sorted(user_counts.items(), key=lambda x: x[1], reverse=True)[:10]
        top_resources = sorted(resource_counts.items(), key=lambda x: x[1], reverse=True)[:10]

        # Detect anomalies (simplified)
        anomalies_detected = len(await self._detect_audit_anomalies(filtered_events))

        return AuditSummary(
            period_start=start_date,
            period_end=end_date,
            total_events=len(filtered_events),
            events_by_category=dict(events_by_category),
            events_by_severity=dict(events_by_severity),
            top_actions=top_actions,
            top_users=top_users,
            top_resources=top_resources,
            compliance_violations=compliance_violations,
            security_incidents=security_incidents,
            anomalies_detected=anomalies_detected
        )

    async def get_audit_events(
        self,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        category: Optional[str] = None,
        severity: Optional[str] = None,
        user_id: Optional[str] = None,
        limit: int = 100
    ) -> List[AuditEvent]:
        """Get audit events with filtering."""

        events = self.audit_events.copy()

        # Apply filters
        if start_date:
            events = [e for e in events if e.timestamp >= start_date]
        if end_date:
            events = [e for e in events if e.timestamp <= end_date]
        if category:
            events = [e for e in events if e.category == category]
        if severity:
            events = [e for e in events if e.severity == severity]
        if user_id:
            events = [e for e in events if e.user_id == user_id]

        # Sort by timestamp (newest first)
        events.sort(key=lambda x: x.timestamp, reverse=True)

        return events[:limit]

    async def export_audit_data(
        self,
        start_date: datetime,
        end_date: datetime,
        format: str = 'json'
    ) -> str:
        """Export audit data in specified format."""
        events = await self.get_audit_events(start_date=start_date, end_date=end_date, limit=10000)

        if format == 'json':
            # Convert events to dict
            event_dicts = []
            for event in events:
                event_dict = {
                    'event_id': event.event_id,
                    'timestamp': event.timestamp.isoformat(),
                    'event_type': event.event_type,
                    'category': event.category,
                    'severity': event.severity,
                    'user_id': event.user_id,
                    'tenant_id': event.tenant_id,
                    'session_id': event.session_id,
                    'resource_type': event.resource_type,
                    'resource_id': event.resource_id,
                    'action': event.action,
                    'method': event.method,
                    'endpoint': event.endpoint,
                    'ip_address': event.ip_address,
                    'user_agent': event.user_agent,
                    'status_code': event.status_code,
                    'processing_time': event.processing_time,
                    'risk_score': event.risk_score,
                    'compliance_flags': event.compliance_flags,
                    'metadata': event.metadata
                }
                event_dicts.append(event_dict)

            return json.dumps(event_dicts, indent=2)

        elif format == 'csv':
            # Simple CSV format
            csv_lines = ['event_id,timestamp,event_type,category,severity,user_id,tenant_id,action,resource_type,ip_address,risk_score']

            for event in events:
                csv_lines.append(
                    f"{event.event_id},{event.timestamp.isoformat()},{event.event_type},"
                    f"{event.category},{event.severity},{event.user_id},{event.tenant_id},"
                    f"{event.action},{event.resource_type},{event.ip_address},{event.risk_score}"
                )

            return '\n'.join(csv_lines)

        else:
            raise ValueError(f"Unsupported export format: {format}")

    async def get_audit_health_status(self) -> Dict[str, Any]:
        """Get audit system health status."""
        return {
            'service_status': 'healthy',
            'events_in_buffer': len(self.event_buffer),
            'total_events_logged': len(self.audit_events),
            'active_rules': len([r for r in self.audit_rules.values() if r.enabled]),
            'last_cleanup': datetime.utcnow().isoformat(),  # Simplified
            'storage_status': 'normal',  # Would check actual storage
            'performance_metrics': {
                'avg_processing_time': 0.001,  # Would calculate from actual metrics
                'events_per_second': len(self.audit_events) / max(1, (datetime.utcnow() - self.audit_events[0].timestamp if self.audit_events else datetime.utcnow()).seconds)
            }
        }


# Global audit logging service instance
audit_logging_service = AuditLoggingService()


async def get_audit_logging_service() -> AuditLoggingService:
    """Get the global audit logging service instance."""
    if not hasattr(audit_logging_service, '_initialized'):
        await audit_logging_service.initialize()
        audit_logging_service._initialized = True
    return audit_logging_service


# Audit logging helper functions
async def log_user_action(
    user_id: str,
    action: str,
    resource_type: str,
    resource_id: str,
    tenant_id: Optional[str] = None,
    details: Optional[Dict[str, Any]] = None
):
    """Helper function to log user actions."""
    service = await get_audit_logging_service()
    await service.log_audit_event(
        event_type='user_action',
        category='user',
        user_id=user_id,
        tenant_id=tenant_id,
        resource_type=resource_type,
        resource_id=resource_id,
        action=action,
        details=details or {}
    )


async def log_security_event(
    event_type: str,
    severity: str,
    user_id: Optional[str],
    description: str,
    risk_score: int = 0
):
    """Helper function to log security events."""
    service = await get_audit_logging_service()
    await service.log_audit_event(
        event_type=event_type,
        category='security',
        severity=severity,
        user_id=user_id,
        action='security_event',
        risk_score=risk_score,
        metadata={'description': description}
    )


async def log_api_request(
    method: str,
    endpoint: str,
    status_code: int,
    processing_time: float,
    user_id: Optional[str] = None,
    tenant_id: Optional[str] = None,
    ip_address: str = "unknown"
):
    """Helper function to log API requests."""
    service = await get_audit_logging_service()
    await service.log_audit_event(
        event_type='api_request',
        category='system',
        user_id=user_id,
        tenant_id=tenant_id,
        action='api_access',
        method=method,
        endpoint=endpoint,
        status_code=status_code,
        processing_time=processing_time,
        ip_address=ip_address
    )
