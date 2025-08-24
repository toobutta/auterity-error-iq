"""
Execution Manager for tracking and managing tool and workflow executions.
Implements execution logging, result management, performance monitoring, and analytics.
"""

import logging
from dataclasses import dataclass
from datetime import datetime, timedelta
from enum import Enum
from typing import Any, Dict, List, Optional
from uuid import UUID, uuid4

logger = logging.getLogger(__name__)


class ExecutionType(str, Enum):
    TOOL_CALL = "tool_call"
    WORKFLOW = "workflow"
    STEP = "step"
    BATCH = "batch"


class ExecutionStatus(str, Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"
    TIMEOUT = "timeout"


class ExecutionPriority(str, Enum):
    LOW = "low"
    NORMAL = "normal"
    HIGH = "high"
    CRITICAL = "critical"


@dataclass
class ExecutionMetrics:
    start_time: datetime
    end_time: Optional[datetime] = None
    duration_ms: Optional[int] = None
    memory_usage_mb: Optional[float] = None
    cpu_usage_percent: Optional[float] = None
    network_requests: int = 0
    cache_hits: int = 0
    cache_misses: int = 0

    def calculate_duration(self):
        if self.end_time:
            self.duration_ms = int(
                (self.end_time - self.start_time).total_seconds() * 1000
            )


@dataclass
class ExecutionLog:
    id: UUID
    execution_type: ExecutionType
    target_id: str  # Tool ID, Workflow ID, etc.
    target_name: str
    status: ExecutionStatus
    priority: ExecutionPriority
    user_id: UUID
    parent_execution_id: Optional[UUID] = None
    input_data: Optional[Dict[str, Any]] = None
    output_data: Optional[Dict[str, Any]] = None
    error_details: Optional[Dict[str, Any]] = None
    metadata: Optional[Dict[str, Any]] = None
    metrics: Optional[ExecutionMetrics] = None
    created_at: datetime = None
    updated_at: datetime = None

    def __post_init__(self):
        if self.created_at is None:
            self.created_at = datetime.utcnow()
        if self.updated_at is None:
            self.updated_at = datetime.utcnow()
        if self.metrics is None:
            self.metrics = ExecutionMetrics(start_time=self.created_at)


class ExecutionManager:
    def __init__(self):
        self.active_executions: Dict[UUID, ExecutionLog] = {}
        self.execution_history: List[ExecutionLog] = []
        self.performance_cache: Dict[str, List[float]] = {}
        self.rate_limits: Dict[str, List[datetime]] = {}

    async def start_execution(
        self,
        execution_type: ExecutionType,
        target_id: str,
        target_name: str,
        user_id: UUID,
        input_data: Optional[Dict[str, Any]] = None,
        priority: ExecutionPriority = ExecutionPriority.NORMAL,
        parent_execution_id: Optional[UUID] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> UUID:
        """Start a new execution and return its ID."""
        execution_id = uuid4()

        execution_log = ExecutionLog(
            id=execution_id,
            execution_type=execution_type,
            target_id=target_id,
            target_name=target_name,
            status=ExecutionStatus.PENDING,
            priority=priority,
            user_id=user_id,
            parent_execution_id=parent_execution_id,
            input_data=input_data,
            metadata=metadata or {},
        )

        self.active_executions[execution_id] = execution_log

        logger.info(
            f"Started execution {execution_id} for {execution_type.value} {target_name}"
        )
        return execution_id

    async def update_execution_status(
        self,
        execution_id: UUID,
        status: ExecutionStatus,
        output_data: Optional[Dict[str, Any]] = None,
        error_details: Optional[Dict[str, Any]] = None,
    ) -> bool:
        """Update the status of an execution."""
        execution = self.active_executions.get(execution_id)
        if not execution:
            logger.warning(f"Execution {execution_id} not found")
            return False

        execution.status = status
        execution.updated_at = datetime.utcnow()

        if status == ExecutionStatus.RUNNING:
            execution.metrics.start_time = datetime.utcnow()
        elif status in [
            ExecutionStatus.COMPLETED,
            ExecutionStatus.FAILED,
            ExecutionStatus.CANCELLED,
            ExecutionStatus.TIMEOUT,
        ]:
            execution.metrics.end_time = datetime.utcnow()
            execution.metrics.calculate_duration()

            if output_data:
                execution.output_data = output_data
            if error_details:
                execution.error_details = error_details

            # Move to history
            self.execution_history.append(execution)
            del self.active_executions[execution_id]

            # Update performance cache
            await self._update_performance_cache(execution)

        logger.debug(f"Updated execution {execution_id} status to {status.value}")
        return True

    async def complete_execution(
        self,
        execution_id: UUID,
        output_data: Dict[str, Any],
        metrics: Optional[ExecutionMetrics] = None,
    ) -> bool:
        """Complete an execution with results."""
        execution = self.active_executions.get(execution_id)
        if not execution:
            return False

        if metrics:
            execution.metrics = metrics

        return await self.update_execution_status(
            execution_id, ExecutionStatus.COMPLETED, output_data=output_data
        )

    async def fail_execution(
        self, execution_id: UUID, error_details: Dict[str, Any]
    ) -> bool:
        """Fail an execution with error details."""
        return await self.update_execution_status(
            execution_id, ExecutionStatus.FAILED, error_details=error_details
        )

    def get_execution(self, execution_id: UUID) -> Optional[ExecutionLog]:
        """Get an execution by ID."""
        # Check active executions first
        if execution_id in self.active_executions:
            return self.active_executions[execution_id]

        # Check history
        for execution in self.execution_history:
            if execution.id == execution_id:
                return execution

        return None

    def list_executions(
        self,
        user_id: Optional[UUID] = None,
        execution_type: Optional[ExecutionType] = None,
        status: Optional[ExecutionStatus] = None,
        limit: int = 100,
    ) -> List[ExecutionLog]:
        """List executions with optional filtering."""
        all_executions = list(self.active_executions.values()) + self.execution_history

        # Apply filters
        if user_id:
            all_executions = [e for e in all_executions if e.user_id == user_id]
        if execution_type:
            all_executions = [
                e for e in all_executions if e.execution_type == execution_type
            ]
        if status:
            all_executions = [e for e in all_executions if e.status == status]

        # Sort by created_at descending and limit
        all_executions.sort(key=lambda x: x.created_at, reverse=True)
        return all_executions[:limit]

    def get_child_executions(self, parent_execution_id: UUID) -> List[ExecutionLog]:
        """Get all child executions for a parent execution."""
        all_executions = list(self.active_executions.values()) + self.execution_history
        return [
            e for e in all_executions if e.parent_execution_id == parent_execution_id
        ]

    async def cancel_execution(self, execution_id: UUID) -> bool:
        """Cancel a running execution."""
        execution = self.active_executions.get(execution_id)
        if not execution or execution.status not in [
            ExecutionStatus.PENDING,
            ExecutionStatus.RUNNING,
        ]:
            return False

        return await self.update_execution_status(
            execution_id, ExecutionStatus.CANCELLED
        )

    async def _update_performance_cache(self, execution: ExecutionLog):
        """Update performance metrics cache."""
        if not execution.metrics or not execution.metrics.duration_ms:
            return

        cache_key = f"{execution.execution_type.value}:{execution.target_id}"
        if cache_key not in self.performance_cache:
            self.performance_cache[cache_key] = []

        self.performance_cache[cache_key].append(execution.metrics.duration_ms)

        # Keep only last 100 measurements
        if len(self.performance_cache[cache_key]) > 100:
            self.performance_cache[cache_key] = self.performance_cache[cache_key][-100:]

    def get_performance_stats(
        self, target_id: str, execution_type: ExecutionType
    ) -> Dict[str, float]:
        """Get performance statistics for a target."""
        cache_key = f"{execution_type.value}:{target_id}"
        durations = self.performance_cache.get(cache_key, [])

        if not durations:
            return {}

        return {
            "avg_duration_ms": sum(durations) / len(durations),
            "min_duration_ms": min(durations),
            "max_duration_ms": max(durations),
            "median_duration_ms": sorted(durations)[len(durations) // 2],
            "total_executions": len(durations),
        }

    async def check_rate_limit(self, user_id: UUID, limit_per_minute: int = 60) -> bool:
        """Check if user is within rate limits."""
        now = datetime.utcnow()
        minute_ago = now - timedelta(minutes=1)

        user_key = str(user_id)
        if user_key not in self.rate_limits:
            self.rate_limits[user_key] = []

        # Clean old entries
        self.rate_limits[user_key] = [
            timestamp
            for timestamp in self.rate_limits[user_key]
            if timestamp > minute_ago
        ]

        # Check limit
        if len(self.rate_limits[user_key]) >= limit_per_minute:
            return False

        # Add current request
        self.rate_limits[user_key].append(now)
        return True

    def get_execution_analytics(
        self, start_date: Optional[datetime] = None, end_date: Optional[datetime] = None
    ) -> Dict[str, Any]:
        """Get execution analytics for a date range."""
        if not start_date:
            start_date = datetime.utcnow() - timedelta(days=30)
        if not end_date:
            end_date = datetime.utcnow()

        # Filter executions by date range
        filtered_executions = [
            e for e in self.execution_history if start_date <= e.created_at <= end_date
        ]

        if not filtered_executions:
            return {"total_executions": 0}

        # Calculate analytics
        total_executions = len(filtered_executions)
        successful_executions = len(
            [e for e in filtered_executions if e.status == ExecutionStatus.COMPLETED]
        )
        failed_executions = len(
            [e for e in filtered_executions if e.status == ExecutionStatus.FAILED]
        )

        success_rate = (
            (successful_executions / total_executions) * 100
            if total_executions > 0
            else 0
        )

        # Execution type breakdown
        type_breakdown = {}
        for execution_type in ExecutionType:
            count = len(
                [e for e in filtered_executions if e.execution_type == execution_type]
            )
            type_breakdown[execution_type.value] = count

        # Average duration by type
        avg_duration_by_type = {}
        for execution_type in ExecutionType:
            durations = [
                e.metrics.duration_ms
                for e in filtered_executions
                if e.execution_type == execution_type
                and e.metrics
                and e.metrics.duration_ms
            ]
            if durations:
                avg_duration_by_type[execution_type.value] = sum(durations) / len(
                    durations
                )

        # Top users by execution count
        user_counts = {}
        for execution in filtered_executions:
            user_id = str(execution.user_id)
            user_counts[user_id] = user_counts.get(user_id, 0) + 1

        top_users = sorted(user_counts.items(), key=lambda x: x[1], reverse=True)[:10]

        return {
            "date_range": {
                "start": start_date.isoformat(),
                "end": end_date.isoformat(),
            },
            "total_executions": total_executions,
            "successful_executions": successful_executions,
            "failed_executions": failed_executions,
            "success_rate_percent": round(success_rate, 2),
            "execution_type_breakdown": type_breakdown,
            "avg_duration_by_type_ms": avg_duration_by_type,
            "top_users": top_users,
        }

    def cleanup_old_executions(self, days_to_keep: int = 30):
        """Clean up old execution history."""
        cutoff_date = datetime.utcnow() - timedelta(days=days_to_keep)

        original_count = len(self.execution_history)
        self.execution_history = [
            e for e in self.execution_history if e.created_at > cutoff_date
        ]

        cleaned_count = original_count - len(self.execution_history)
        logger.info(f"Cleaned up {cleaned_count} old executions")

        return cleaned_count

    def get_system_stats(self) -> Dict[str, Any]:
        """Get overall system execution statistics."""
        active_count = len(self.active_executions)
        history_count = len(self.execution_history)

        # Status breakdown of active executions
        active_status_breakdown = {}
        for status in ExecutionStatus:
            count = len(
                [e for e in self.active_executions.values() if e.status == status]
            )
            active_status_breakdown[status.value] = count

        # Priority breakdown of active executions
        active_priority_breakdown = {}
        for priority in ExecutionPriority:
            count = len(
                [e for e in self.active_executions.values() if e.priority == priority]
            )
            active_priority_breakdown[priority.value] = count

        return {
            "active_executions": active_count,
            "historical_executions": history_count,
            "active_status_breakdown": active_status_breakdown,
            "active_priority_breakdown": active_priority_breakdown,
            "performance_cache_size": len(self.performance_cache),
            "rate_limit_tracking": len(self.rate_limits),
        }
