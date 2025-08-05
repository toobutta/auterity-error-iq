"""
Cross-System Error Correlation and Handling Service

This service aggregates errors from AutoMatrix, RelayCore, and NeuroWeaver
to identify patterns, correlate root causes, and implement automated recovery.
"""

import hashlib
import json
import logging
from collections import Counter, defaultdict
from dataclasses import asdict, dataclass
from datetime import datetime, timedelta
from enum import Enum
from typing import Any, Dict, List, Optional, Set

import redis.asyncio as redis


class SystemType(str, Enum):
    """Supported system types for error correlation."""

    AUTMATRIX = "autmatrix"
    RELAYCORE = "relaycore"
    NEUROWEAVER = "neuroweaver"


class CorrelationPattern(str, Enum):
    """Types of error correlation patterns."""

    CASCADING_FAILURE = "cascading_failure"
    COMMON_ROOT_CAUSE = "common_root_cause"
    DEPENDENCY_FAILURE = "dependency_failure"
    RESOURCE_EXHAUSTION = "resource_exhaustion"
    AUTHENTICATION_PROPAGATION = "authentication_propagation"
    NETWORK_PARTITION = "network_partition"


@dataclass
class SystemError:
    """Standardized error representation across all systems."""

    id: str
    system: SystemType
    timestamp: datetime
    category: str
    severity: str
    message: str
    code: str
    context: Dict[str, Any]
    stack_trace: Optional[str] = None
    user_id: Optional[str] = None
    request_id: Optional[str] = None
    correlation_id: Optional[str] = None


@dataclass
class ErrorCorrelation:
    """Represents a correlation between multiple errors."""

    id: str
    pattern: CorrelationPattern
    root_cause: str
    affected_systems: Set[SystemType]
    error_ids: List[str]
    confidence: float
    created_at: datetime
    resolved_at: Optional[datetime] = None
    recovery_actions: List[str] = None


@dataclass
class RecoveryAction:
    """Automated recovery action definition."""

    id: str
    name: str
    description: str
    applicable_patterns: List[CorrelationPattern]
    applicable_categories: List[str]
    retry_count: int
    retry_delay: int
    timeout: int
    action_type: str  # 'restart', 'retry', 'fallback', 'scale', 'notify'
    parameters: Dict[str, Any]


class ErrorCorrelationService:
    """Service for cross-system error correlation and automated recovery."""

    def __init__(self, redis_client: redis.Redis):
        self.redis = redis_client
        self.logger = logging.getLogger(__name__)
        self.correlation_window = timedelta(minutes=5)
        self.max_correlation_age = timedelta(hours=24)

        # Initialize recovery actions
        self.recovery_actions = self._initialize_recovery_actions()

        # Error pattern matchers
        self.pattern_matchers = {
            CorrelationPattern.CASCADING_FAILURE: self._detect_cascading_failure,
            CorrelationPattern.COMMON_ROOT_CAUSE: self._detect_common_root_cause,
            CorrelationPattern.DEPENDENCY_FAILURE: self._detect_dependency_failure,
            CorrelationPattern.RESOURCE_EXHAUSTION: self._detect_resource_exhaustion,
            CorrelationPattern.AUTHENTICATION_PROPAGATION: self._detect_auth_propagation,
            CorrelationPattern.NETWORK_PARTITION: self._detect_network_partition,
        }

    async def aggregate_error(self, error_data: Dict[str, Any]) -> SystemError:
        """Aggregate error from any system into standardized format."""
        try:
            # Normalize error data from different systems
            normalized_error = self._normalize_error(error_data)

            # Store in Redis for real-time correlation
            await self._store_error_in_redis(normalized_error)

            # Trigger correlation analysis
            await self._trigger_correlation_analysis(normalized_error)

            self.logger.info(
                f"Aggregated error {normalized_error.id} from "
                f"{normalized_error.system}"
            )
            return normalized_error

        except Exception as e:
            self.logger.error(f"Failed to aggregate error: {e}")
            raise SystemError(f"Error aggregation failed: {e}")

    def _normalize_error(self, error_data: Dict[str, Any]) -> SystemError:
        """Normalize error data from different system formats."""
        # Detect source system based on error structure
        system = self._detect_source_system(error_data)

        # Generate unique error ID
        error_id = self._generate_error_id(error_data, system)

        # Extract common fields with system-specific handling
        if system == SystemType.AUTMATRIX:
            return self._normalize_autmatrix_error(error_id, error_data)
        elif system == SystemType.RELAYCORE:
            return self._normalize_relaycore_error(error_id, error_data)
        elif system == SystemType.NEUROWEAVER:
            return self._normalize_neuroweaver_error(error_id, error_data)
        else:
            return self._normalize_generic_error(error_id, error_data)

    def _detect_source_system(self, error_data: Dict[str, Any]) -> SystemType:
        """Detect which system generated the error based on structure."""
        if "workflow_id" in error_data or "execution_id" in error_data:
            return SystemType.AUTMATRIX
        elif "model_id" in error_data or "provider" in error_data:
            return SystemType.RELAYCORE
        elif "training_job_id" in error_data or "model_version" in error_data:
            return SystemType.NEUROWEAVER
        else:
            # Default to AutoMatrix if unclear
            return SystemType.AUTMATRIX

    def _normalize_autmatrix_error(
        self, error_id: str, data: Dict[str, Any]
    ) -> SystemError:
        """Normalize AutoMatrix error format."""
        return SystemError(
            id=error_id,
            system=SystemType.AUTMATRIX,
            timestamp=datetime.fromisoformat(
                data.get("timestamp", datetime.utcnow().isoformat())
            ),
            category=data.get("category", "workflow"),
            severity=data.get("severity", "medium"),
            message=data.get("message", "Unknown AutoMatrix error"),
            code=data.get("code", "AUTMATRIX_ERROR"),
            context={
                "workflow_id": data.get("workflow_id"),
                "execution_id": data.get("execution_id"),
                "step_name": data.get("step_name"),
                "user_id": data.get("user_id"),
            },
            stack_trace=data.get("stack_trace"),
            user_id=data.get("user_id"),
            request_id=data.get("request_id"),
            correlation_id=data.get("correlation_id"),
        )

    def _normalize_relaycore_error(
        self, error_id: str, data: Dict[str, Any]
    ) -> SystemError:
        """Normalize RelayCore error format."""
        return SystemError(
            id=error_id,
            system=SystemType.RELAYCORE,
            timestamp=datetime.fromisoformat(
                data.get("timestamp", datetime.utcnow().isoformat())
            ),
            category=data.get("category", "ai_service"),
            severity=data.get("severity", "medium"),
            message=data.get("message", "Unknown RelayCore error"),
            code=data.get("code", "RELAYCORE_ERROR"),
            context={
                "provider": data.get("provider"),
                "model_id": data.get("model_id"),
                "request_type": data.get("request_type"),
                "cost": data.get("cost"),
                "latency": data.get("latency"),
            },
            stack_trace=data.get("stack_trace"),
            user_id=data.get("user_id"),
            request_id=data.get("request_id"),
            correlation_id=data.get("correlation_id"),
        )

    def _normalize_neuroweaver_error(
        self, error_id: str, data: Dict[str, Any]
    ) -> SystemError:
        """Normalize NeuroWeaver error format."""
        return SystemError(
            id=error_id,
            system=SystemType.NEUROWEAVER,
            timestamp=datetime.fromisoformat(
                data.get("timestamp", datetime.utcnow().isoformat())
            ),
            category=data.get("category", "model"),
            severity=data.get("severity", "medium"),
            message=data.get("message", "Unknown NeuroWeaver error"),
            code=data.get("code", "NEUROWEAVER_ERROR"),
            context={
                "model_id": data.get("model_id"),
                "model_version": data.get("model_version"),
                "training_job_id": data.get("training_job_id"),
                "deployment_id": data.get("deployment_id"),
                "performance_metrics": data.get("performance_metrics"),
            },
            stack_trace=data.get("stack_trace"),
            user_id=data.get("user_id"),
            request_id=data.get("request_id"),
            correlation_id=data.get("correlation_id"),
        )

    def _normalize_generic_error(
        self, error_id: str, data: Dict[str, Any]
    ) -> SystemError:
        """Normalize generic error format."""
        return SystemError(
            id=error_id,
            system=SystemType.AUTMATRIX,  # Default system
            timestamp=datetime.fromisoformat(
                data.get("timestamp", datetime.utcnow().isoformat())
            ),
            category=data.get("category", "system"),
            severity=data.get("severity", "medium"),
            message=data.get("message", "Unknown system error"),
            code=data.get("code", "SYSTEM_ERROR"),
            context=data.get("context", {}),
            stack_trace=data.get("stack_trace"),
            user_id=data.get("user_id"),
            request_id=data.get("request_id"),
            correlation_id=data.get("correlation_id"),
        )

    def _generate_error_id(self, error_data: Dict[str, Any], system: SystemType) -> str:
        """Generate unique error ID based on content and system."""
        content = (
            f"{system}:{error_data.get('message', '')}:{error_data.get('code', '')}"
        )
        return hashlib.md5(content.encode()).hexdigest()[:16]

    async def _store_error_in_redis(self, error: SystemError) -> None:
        """Store error in Redis for real-time correlation."""
        key = f"error:{error.system}:{error.id}"
        data = asdict(error)

        # Convert datetime to ISO string for JSON serialization
        data["timestamp"] = error.timestamp.isoformat()

        await self.redis.setex(key, 3600, json.dumps(data, default=str))

        # Add to system-specific error list
        await self.redis.lpush(f"errors:{error.system}", error.id)
        await self.redis.expire(f"errors:{error.system}", 3600)

    async def _trigger_correlation_analysis(self, new_error: SystemError) -> None:
        """Trigger correlation analysis for new error."""
        try:
            # Get recent errors from all systems
            recent_errors = await self._get_recent_errors()

            # Run correlation analysis
            correlations = await self._analyze_correlations(new_error, recent_errors)

            # Process any new correlations
            for correlation in correlations:
                await self._process_correlation(correlation)

        except Exception as e:
            self.logger.error(f"Correlation analysis failed: {e}")

    async def _get_recent_errors(self) -> List[SystemError]:
        """Get recent errors from all systems within correlation window."""
        errors = []
        cutoff_time = datetime.utcnow() - self.correlation_window

        for system in SystemType:
            error_ids = await self.redis.lrange(f"errors:{system}", 0, 100)

            for error_id in error_ids:
                error_key = f"error:{system}:{error_id.decode()}"
                error_data = await self.redis.get(error_key)

                if error_data:
                    error_dict = json.loads(error_data)
                    error_time = datetime.fromisoformat(error_dict["timestamp"])

                    if error_time >= cutoff_time:
                        # Reconstruct SystemError object
                        error = SystemError(**error_dict)
                        error.timestamp = error_time
                        errors.append(error)

        return errors

    async def _analyze_correlations(
        self, new_error: SystemError, recent_errors: List[SystemError]
    ) -> List[ErrorCorrelation]:
        """Analyze correlations between new error and recent errors."""
        correlations = []

        for pattern, matcher in self.pattern_matchers.items():
            correlation = await matcher(new_error, recent_errors)
            if correlation:
                correlations.append(correlation)

        return correlations

    async def _detect_cascading_failure(
        self, new_error: SystemError, recent_errors: List[SystemError]
    ) -> Optional[ErrorCorrelation]:
        """Detect cascading failure patterns across systems."""
        # Look for errors that follow dependency chain: AutoMatrix -> RelayCore -> NeuroWeaver
        system_order = [
            SystemType.AUTMATRIX,
            SystemType.RELAYCORE,
            SystemType.NEUROWEAVER,
        ]

        # Group errors by system and time
        system_errors = defaultdict(list)
        for error in recent_errors + [new_error]:
            system_errors[error.system].append(error)

        # Check for cascading pattern
        cascade_errors = []
        for i, system in enumerate(system_order):
            if system in system_errors:
                # Sort by timestamp
                system_errors[system].sort(key=lambda x: x.timestamp)
                if system_errors[system]:
                    cascade_errors.extend(system_errors[system][:1])  # Take first error

        # If we have errors from multiple systems in sequence, it's likely cascading
        if len(cascade_errors) >= 2:
            affected_systems = {error.system for error in cascade_errors}

            return ErrorCorrelation(
                id=f"cascade_{datetime.utcnow().timestamp()}",
                pattern=CorrelationPattern.CASCADING_FAILURE,
                root_cause=(
                    f"Cascading failure starting from {cascade_errors[0].system}"
                ),
                affected_systems=affected_systems,
                error_ids=[error.id for error in cascade_errors],
                confidence=0.8,
                created_at=datetime.utcnow(),
                recovery_actions=["restart_upstream_service", "retry_failed_requests"],
            )

        return None

    async def _detect_common_root_cause(
        self, new_error: SystemError, recent_errors: List[SystemError]
    ) -> Optional[ErrorCorrelation]:
        """Detect errors with common root causes."""
        # Look for similar error messages or codes across systems
        similar_errors = []

        for error in recent_errors:
            if error.system != new_error.system:
                # Check for similar error codes or messages
                if (
                    error.code == new_error.code
                    or self._calculate_message_similarity(
                        error.message, new_error.message
                    )
                    > 0.7
                ):
                    similar_errors.append(error)

        if similar_errors:
            all_errors = similar_errors + [new_error]
            affected_systems = {error.system for error in all_errors}

            return ErrorCorrelation(
                id=f"common_cause_{datetime.utcnow().timestamp()}",
                pattern=CorrelationPattern.COMMON_ROOT_CAUSE,
                root_cause=f"Common root cause: {new_error.code}",
                affected_systems=affected_systems,
                error_ids=[error.id for error in all_errors],
                confidence=0.7,
                created_at=datetime.utcnow(),
                recovery_actions=[
                    "investigate_shared_dependency",
                    "check_configuration",
                ],
            )

        return None

    async def _detect_dependency_failure(
        self, new_error: SystemError, recent_errors: List[SystemError]
    ) -> Optional[ErrorCorrelation]:
        """Detect dependency failure patterns."""
        # Look for database, network, or external service failures
        dependency_keywords = [
            "database",
            "connection",
            "timeout",
            "network",
            "api",
            "service",
        ]

        if any(keyword in new_error.message.lower() for keyword in dependency_keywords):
            related_errors = []

            for error in recent_errors:
                if any(
                    keyword in error.message.lower() for keyword in dependency_keywords
                ):
                    related_errors.append(error)

            if related_errors:
                all_errors = related_errors + [new_error]
                affected_systems = {error.system for error in all_errors}

                return ErrorCorrelation(
                    id=f"dependency_{datetime.utcnow().timestamp()}",
                    pattern=CorrelationPattern.DEPENDENCY_FAILURE,
                    root_cause="Shared dependency failure",
                    affected_systems=affected_systems,
                    error_ids=[error.id for error in all_errors],
                    confidence=0.9,
                    created_at=datetime.utcnow(),
                    recovery_actions=[
                        "restart_dependency",
                        "check_network_connectivity",
                    ],
                )

        return None

    async def _detect_resource_exhaustion(
        self, new_error: SystemError, recent_errors: List[SystemError]
    ) -> Optional[ErrorCorrelation]:
        """Detect resource exhaustion patterns."""
        resource_keywords = [
            "memory",
            "cpu",
            "disk",
            "quota",
            "limit",
            "exhausted",
            "full",
        ]

        if any(keyword in new_error.message.lower() for keyword in resource_keywords):
            related_errors = []

            for error in recent_errors:
                if any(
                    keyword in error.message.lower() for keyword in resource_keywords
                ):
                    related_errors.append(error)

            if related_errors:
                all_errors = related_errors + [new_error]
                affected_systems = {error.system for error in all_errors}

                return ErrorCorrelation(
                    id=f"resource_{datetime.utcnow().timestamp()}",
                    pattern=CorrelationPattern.RESOURCE_EXHAUSTION,
                    root_cause="Resource exhaustion across systems",
                    affected_systems=affected_systems,
                    error_ids=[error.id for error in all_errors],
                    confidence=0.85,
                    created_at=datetime.utcnow(),
                    recovery_actions=[
                        "scale_resources",
                        "cleanup_resources",
                        "restart_services",
                    ],
                )

        return None

    async def _detect_auth_propagation(
        self, new_error: SystemError, recent_errors: List[SystemError]
    ) -> Optional[ErrorCorrelation]:
        """Detect authentication error propagation."""
        if (
            new_error.category == "authentication"
            or "auth" in new_error.message.lower()
        ):
            auth_errors = []

            for error in recent_errors:
                if (
                    error.category == "authentication"
                    or "auth" in error.message.lower()
                    or error.code in ["AUTHENTICATION_ERROR", "AUTHORIZATION_ERROR"]
                ):
                    auth_errors.append(error)

            if auth_errors:
                all_errors = auth_errors + [new_error]
                affected_systems = {error.system for error in all_errors}

                return ErrorCorrelation(
                    id=f"auth_{datetime.utcnow().timestamp()}",
                    pattern=CorrelationPattern.AUTHENTICATION_PROPAGATION,
                    root_cause="Authentication failure propagation",
                    affected_systems=affected_systems,
                    error_ids=[error.id for error in all_errors],
                    confidence=0.9,
                    created_at=datetime.utcnow(),
                    recovery_actions=[
                        "refresh_tokens",
                        "check_auth_service",
                        "validate_permissions",
                    ],
                )

        return None

    async def _detect_network_partition(
        self, new_error: SystemError, recent_errors: List[SystemError]
    ) -> Optional[ErrorCorrelation]:
        """Detect network partition or connectivity issues."""
        network_keywords = [
            "connection",
            "timeout",
            "unreachable",
            "network",
            "dns",
            "resolve",
        ]

        if any(keyword in new_error.message.lower() for keyword in network_keywords):
            network_errors = []

            for error in recent_errors:
                if any(
                    keyword in error.message.lower() for keyword in network_keywords
                ):
                    network_errors.append(error)

            # If multiple systems have network issues, likely partition
            if len(network_errors) >= 2:
                all_errors = network_errors + [new_error]
                affected_systems = {error.system for error in all_errors}

                return ErrorCorrelation(
                    id=f"network_{datetime.utcnow().timestamp()}",
                    pattern=CorrelationPattern.NETWORK_PARTITION,
                    root_cause="Network connectivity issues",
                    affected_systems=affected_systems,
                    error_ids=[error.id for error in all_errors],
                    confidence=0.8,
                    created_at=datetime.utcnow(),
                    recovery_actions=[
                        "check_network_connectivity",
                        "restart_network_services",
                    ],
                )

        return None

    def _calculate_message_similarity(self, msg1: str, msg2: str) -> float:
        """Calculate similarity between two error messages."""
        # Simple word-based similarity
        words1 = set(msg1.lower().split())
        words2 = set(msg2.lower().split())

        if not words1 or not words2:
            return 0.0

        intersection = words1.intersection(words2)
        union = words1.union(words2)

        return len(intersection) / len(union) if union else 0.0

    async def _process_correlation(self, correlation: ErrorCorrelation) -> None:
        """Process a detected error correlation."""
        try:
            # Store correlation
            await self._store_correlation(correlation)

            # Trigger automated recovery
            await self._trigger_automated_recovery(correlation)

            # Send alerts
            await self._send_correlation_alert(correlation)

            self.logger.info(
                f"Processed correlation {correlation.id} with pattern "
                f"{correlation.pattern}"
            )

        except Exception as e:
            self.logger.error(f"Failed to process correlation {correlation.id}: {e}")

    async def _store_correlation(self, correlation: ErrorCorrelation) -> None:
        """Store correlation in Redis."""
        key = f"correlation:{correlation.id}"
        data = asdict(correlation)

        # Convert sets and datetime to serializable format
        data["affected_systems"] = list(correlation.affected_systems)
        data["created_at"] = correlation.created_at.isoformat()
        if correlation.resolved_at:
            data["resolved_at"] = correlation.resolved_at.isoformat()

        await self.redis.setex(key, 86400, json.dumps(data, default=str))  # 24 hour TTL

    async def _trigger_automated_recovery(self, correlation: ErrorCorrelation) -> None:
        """Trigger automated recovery actions for correlation."""
        if not correlation.recovery_actions:
            return

        for action_name in correlation.recovery_actions:
            recovery_action = self._get_recovery_action(action_name)
            if recovery_action:
                await self._execute_recovery_action(recovery_action, correlation)

    def _get_recovery_action(self, action_name: str) -> Optional[RecoveryAction]:
        """Get recovery action by name."""
        return self.recovery_actions.get(action_name)

    async def _execute_recovery_action(
        self, action: RecoveryAction, correlation: ErrorCorrelation
    ) -> None:
        """Execute a recovery action."""
        try:
            self.logger.info(
                f"Executing recovery action {action.name} for correlation "
                f"{correlation.id}"
            )

            if action.action_type == "restart":
                await self._restart_services(correlation.affected_systems)
            elif action.action_type == "retry":
                await self._retry_failed_operations(correlation)
            elif action.action_type == "fallback":
                await self._activate_fallback_systems(correlation.affected_systems)
            elif action.action_type == "scale":
                await self._scale_resources(correlation.affected_systems)
            elif action.action_type == "notify":
                await self._send_recovery_notification(correlation, action)

            self.logger.info(f"Recovery action {action.name} completed successfully")

        except Exception as e:
            self.logger.error(f"Recovery action {action.name} failed: {e}")

    async def _restart_services(self, affected_systems: Set[SystemType]) -> None:
        """Restart affected services."""
        # This would integrate with container orchestration or service management
        for system in affected_systems:
            self.logger.info(f"Triggering restart for {system}")
            # Implementation would depend on deployment architecture
            # Could use Docker API, Kubernetes API, or service management tools

    async def _retry_failed_operations(self, correlation: ErrorCorrelation) -> None:
        """Retry failed operations based on correlation context."""
        # Extract operation context from error details
        for error_id in correlation.error_ids:
            # Implementation would retry specific operations based on error context
            self.logger.info(f"Retrying operations for error {error_id}")

    async def _activate_fallback_systems(
        self, affected_systems: Set[SystemType]
    ) -> None:
        """Activate fallback systems."""
        for system in affected_systems:
            if system == SystemType.RELAYCORE:
                # Activate direct OpenAI fallback
                await self._activate_direct_ai_fallback()
            elif system == SystemType.NEUROWEAVER:
                # Fallback to standard models
                await self._activate_standard_model_fallback()

    async def _activate_direct_ai_fallback(self) -> None:
        """Activate direct AI provider fallback."""
        # Set fallback flag in Redis
        await self.redis.setex("fallback:relaycore", 3600, "active")
        self.logger.info("Activated direct AI provider fallback")

    async def _activate_standard_model_fallback(self) -> None:
        """Activate standard model fallback."""
        await self.redis.setex("fallback:neuroweaver", 3600, "active")
        self.logger.info("Activated standard model fallback")

    async def _scale_resources(self, affected_systems: Set[SystemType]) -> None:
        """Scale resources for affected systems."""
        # This would integrate with auto-scaling systems
        for system in affected_systems:
            self.logger.info(f"Triggering resource scaling for {system}")

    async def _send_recovery_notification(
        self, correlation: ErrorCorrelation, action: RecoveryAction
    ) -> None:
        """Send recovery notification."""
        notification = {
            "correlation_id": correlation.id,
            "pattern": correlation.pattern,
            "action": action.name,
            "affected_systems": list(correlation.affected_systems),
            "timestamp": datetime.utcnow().isoformat(),
        }

        # Store notification for dashboard
        await self.redis.lpush("notifications:recovery", json.dumps(notification))
        await self.redis.expire("notifications:recovery", 86400)

    async def _send_correlation_alert(self, correlation: ErrorCorrelation) -> None:
        """Send alert for detected correlation."""
        alert = {
            "correlation_id": correlation.id,
            "pattern": correlation.pattern.value,
            "root_cause": correlation.root_cause,
            "affected_systems": list(correlation.affected_systems),
            "confidence": correlation.confidence,
            "error_count": len(correlation.error_ids),
            "timestamp": correlation.created_at.isoformat(),
        }

        # Store alert for dashboard
        await self.redis.lpush("alerts:correlations", json.dumps(alert))
        await self.redis.expire("alerts:correlations", 86400)

    def _initialize_recovery_actions(self) -> Dict[str, RecoveryAction]:
        """Initialize available recovery actions."""
        actions = {}

        # Restart services action
        actions["restart_upstream_service"] = RecoveryAction(
            id="restart_upstream",
            name="Restart Upstream Service",
            description="Restart the upstream service causing cascading failures",
            applicable_patterns=[CorrelationPattern.CASCADING_FAILURE],
            applicable_categories=["system", "database", "network"],
            retry_count=3,
            retry_delay=30,
            timeout=300,
            action_type="restart",
            parameters={"graceful": True},
        )

        # Retry failed requests
        actions["retry_failed_requests"] = RecoveryAction(
            id="retry_requests",
            name="Retry Failed Requests",
            description="Retry failed requests with exponential backoff",
            applicable_patterns=[
                CorrelationPattern.CASCADING_FAILURE,
                CorrelationPattern.DEPENDENCY_FAILURE,
            ],
            applicable_categories=["api", "network", "timeout"],
            retry_count=5,
            retry_delay=10,
            timeout=120,
            action_type="retry",
            parameters={"backoff_multiplier": 2},
        )

        # Scale resources
        actions["scale_resources"] = RecoveryAction(
            id="scale_resources",
            name="Scale Resources",
            description="Scale up resources to handle increased load",
            applicable_patterns=[CorrelationPattern.RESOURCE_EXHAUSTION],
            applicable_categories=["performance", "memory", "cpu"],
            retry_count=1,
            retry_delay=0,
            timeout=600,
            action_type="scale",
            parameters={"scale_factor": 1.5},
        )

        # Refresh authentication tokens
        actions["refresh_tokens"] = RecoveryAction(
            id="refresh_tokens",
            name="Refresh Authentication Tokens",
            description="Refresh expired or invalid authentication tokens",
            applicable_patterns=[CorrelationPattern.AUTHENTICATION_PROPAGATION],
            applicable_categories=["authentication", "authorization"],
            retry_count=3,
            retry_delay=5,
            timeout=60,
            action_type="retry",
            parameters={"force_refresh": True},
        )

        return actions

    async def get_correlation_status(self) -> Dict[str, Any]:
        """Get current correlation status and statistics."""
        try:
            # Get recent correlations
            correlation_keys = await self.redis.keys("correlation:*")
            correlations = []

            for key in correlation_keys:
                data = await self.redis.get(key)
                if data:
                    correlation_data = json.loads(data)
                    correlations.append(correlation_data)

            # Calculate statistics
            pattern_counts = Counter(c["pattern"] for c in correlations)
            system_counts = Counter()
            for c in correlations:
                for system in c["affected_systems"]:
                    system_counts[system] += 1

            # Get recent alerts
            alerts = await self.redis.lrange("alerts:correlations", 0, 10)
            alert_data = [json.loads(alert) for alert in alerts]

            return {
                "total_correlations": len(correlations),
                "pattern_distribution": dict(pattern_counts),
                "affected_systems": dict(system_counts),
                "recent_alerts": alert_data,
                "active_correlations": len(
                    [c for c in correlations if not c.get("resolved_at")]
                ),
                "recovery_actions_executed": await self._get_recovery_action_count(),
            }

        except Exception as e:
            self.logger.error(f"Failed to get correlation status: {e}")
            return {"error": str(e)}

    async def _get_recovery_action_count(self) -> int:
        """Get count of executed recovery actions."""
        notifications = await self.redis.lrange("notifications:recovery", 0, -1)
        return len(notifications)


# Global service instance
_correlation_service: Optional[ErrorCorrelationService] = None


async def get_correlation_service() -> ErrorCorrelationService:
    """Get or create correlation service instance."""
    global _correlation_service

    if _correlation_service is None:
        # Initialize Redis connection
        redis_client = redis.from_url("redis://localhost:6379", decode_responses=False)
        _correlation_service = ErrorCorrelationService(redis_client)

    return _correlation_service
