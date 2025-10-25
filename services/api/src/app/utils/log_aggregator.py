"""Log aggregation and filtering utilities."""

import json
import logging
from collections import Counter
from dataclasses import dataclass
from datetime import datetime, timedelta
from enum import Enum
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)


class LogLevel(str, Enum):
    """Log levels for filtering."""

    DEBUG = "debug"
    INFO = "info"
    WARNING = "warning"
    ERROR = "error"
    CRITICAL = "critical"


@dataclass
class LogEntry:
    """Structured log entry."""

    timestamp: datetime
    level: LogLevel
    message: str
    correlation_id: Optional[str] = None
    event: Optional[str] = None
    component: Optional[str] = None
    user_id: Optional[str] = None
    context: Optional[Dict[str, Any]] = None


@dataclass
class LogMetrics:
    """Log metrics and statistics."""

    total_entries: int
    entries_by_level: Dict[str, int]
    entries_by_component: Dict[str, int]
    entries_by_event: Dict[str, int]
    error_rate: float
    top_errors: List[Dict[str, Any]]
    time_range: Dict[str, datetime]


class LogFilter:
    """Log filtering utility."""

    def __init__(
        self,
        level: Optional[LogLevel] = None,
        component: Optional[str] = None,
        event: Optional[str] = None,
        correlation_id: Optional[str] = None,
        user_id: Optional[str] = None,
        start_time: Optional[datetime] = None,
        end_time: Optional[datetime] = None,
        message_contains: Optional[str] = None,
    ):
        self.level = level
        self.component = component
        self.event = event
        self.correlation_id = correlation_id
        self.user_id = user_id
        self.start_time = start_time
        self.end_time = end_time
        self.message_contains = message_contains

    def matches(self, entry: LogEntry) -> bool:
        """Check if log entry matches filter criteria."""
        if self.level and entry.level != self.level:
            return False

        if self.component and entry.component != self.component:
            return False

        if self.event and entry.event != self.event:
            return False

        if self.correlation_id and entry.correlation_id != self.correlation_id:
            return False

        if self.user_id and entry.user_id != self.user_id:
            return False

        if self.start_time and entry.timestamp < self.start_time:
            return False

        if self.end_time and entry.timestamp > self.end_time:
            return False

        if (
            self.message_contains
            and self.message_contains.lower() not in entry.message.lower()
        ):
            return False

        return True


class LogAggregator:
    """Log aggregation and analysis utility."""

    def __init__(self):
        self.entries: List[LogEntry] = []
        self.max_entries = 10000  # Limit memory usage

    def add_entry(self, entry: LogEntry) -> None:
        """Add a log entry to the aggregator."""
        self.entries.append(entry)

        # Remove old entries if we exceed the limit
        if len(self.entries) > self.max_entries:
            self.entries = self.entries[-self.max_entries :]

    def add_from_log_line(self, log_line: str) -> None:
        """Parse and add a log entry from a log line."""
        try:
            # Try to parse as JSON (structured log)
            log_data = json.loads(log_line)

            entry = LogEntry(
                timestamp=datetime.fromisoformat(
                    log_data.get("timestamp", datetime.utcnow().isoformat())
                ),
                level=LogLevel(log_data.get("level", "info")),
                message=log_data.get("message", ""),
                correlation_id=log_data.get("correlation_id"),
                event=log_data.get("event"),
                component=log_data.get("component"),
                user_id=log_data.get("user_id"),
                context=log_data.get("context", {}),
            )

            self.add_entry(entry)

        except (json.JSONDecodeError, ValueError, KeyError) as e:
            # If parsing fails, create a basic entry
            logger.warning(f"Failed to parse log line: {e}")
            entry = LogEntry(
                timestamp=datetime.utcnow(),
                level=LogLevel.INFO,
                message=log_line.strip(),
            )
            self.add_entry(entry)

    def filter_entries(self, log_filter: LogFilter) -> List[LogEntry]:
        """Filter log entries based on criteria."""
        return [entry for entry in self.entries if log_filter.matches(entry)]

    def get_metrics(
        self,
        log_filter: Optional[LogFilter] = None,
        time_window_hours: int = 24,
    ) -> LogMetrics:
        """Calculate metrics for log entries."""
        # Apply time window filter
        end_time = datetime.utcnow()
        start_time = end_time - timedelta(hours=time_window_hours)

        if log_filter:
            # Combine with existing filter
            if not log_filter.start_time:
                log_filter.start_time = start_time
            if not log_filter.end_time:
                log_filter.end_time = end_time
            entries = self.filter_entries(log_filter)
        else:
            # Create time-only filter
            time_filter = LogFilter(start_time=start_time, end_time=end_time)
            entries = self.filter_entries(time_filter)

        if not entries:
            return LogMetrics(
                total_entries=0,
                entries_by_level={},
                entries_by_component={},
                entries_by_event={},
                error_rate=0.0,
                top_errors=[],
                time_range={"start": start_time, "end": end_time},
            )

        # Calculate metrics
        total_entries = len(entries)

        # Count by level
        level_counts = Counter(entry.level.value for entry in entries)
        entries_by_level = dict(level_counts)

        # Count by component
        component_counts = Counter(
            entry.component for entry in entries if entry.component
        )
        entries_by_component = dict(component_counts)

        # Count by event
        event_counts = Counter(entry.event for entry in entries if entry.event)
        entries_by_event = dict(event_counts)

        # Calculate error rate
        error_count = level_counts.get("error", 0) + level_counts.get(
            "critical", 0
        )
        error_rate = (
            (error_count / total_entries) * 100 if total_entries > 0 else 0.0
        )

        # Get top errors
        error_entries = [
            entry
            for entry in entries
            if entry.level in [LogLevel.ERROR, LogLevel.CRITICAL]
        ]
        error_message_counts = Counter(
            entry.message for entry in error_entries
        )
        top_errors = [
            {
                "message": message,
                "count": count,
                "percentage": (
                    (count / len(error_entries)) * 100 if error_entries else 0
                ),
            }
            for message, count in error_message_counts.most_common(10)
        ]

        return LogMetrics(
            total_entries=total_entries,
            entries_by_level=entries_by_level,
            entries_by_component=entries_by_component,
            entries_by_event=entries_by_event,
            error_rate=error_rate,
            top_errors=top_errors,
            time_range={"start": start_time, "end": end_time},
        )

    def get_correlation_trace(self, correlation_id: str) -> List[LogEntry]:
        """Get all log entries for a specific correlation ID."""
        correlation_filter = LogFilter(correlation_id=correlation_id)
        entries = self.filter_entries(correlation_filter)

        # Sort by timestamp
        return sorted(entries, key=lambda x: x.timestamp)

    def get_user_activity(
        self, user_id: str, hours: int = 24
    ) -> List[LogEntry]:
        """Get log entries for a specific user."""
        end_time = datetime.utcnow()
        start_time = end_time - timedelta(hours=hours)

        user_filter = LogFilter(
            user_id=user_id, start_time=start_time, end_time=end_time
        )

        entries = self.filter_entries(user_filter)
        return sorted(entries, key=lambda x: x.timestamp, reverse=True)

    def get_component_health(
        self, component: str, hours: int = 1
    ) -> Dict[str, Any]:
        """Get health metrics for a specific component."""
        end_time = datetime.utcnow()
        start_time = end_time - timedelta(hours=hours)

        component_filter = LogFilter(
            component=component, start_time=start_time, end_time=end_time
        )

        entries = self.filter_entries(component_filter)

        if not entries:
            return {
                "status": "unknown",
                "total_entries": 0,
                "error_count": 0,
                "error_rate": 0.0,
                "last_activity": None,
            }

        error_count = sum(
            1
            for entry in entries
            if entry.level in [LogLevel.ERROR, LogLevel.CRITICAL]
        )
        error_rate = (error_count / len(entries)) * 100

        # Determine health status
        if error_rate > 10:
            status = "unhealthy"
        elif error_rate > 5:
            status = "degraded"
        else:
            status = "healthy"

        return {
            "status": status,
            "total_entries": len(entries),
            "error_count": error_count,
            "error_rate": error_rate,
            "last_activity": max(entry.timestamp for entry in entries),
        }

    def clear_old_entries(self, hours: int = 168) -> int:  # Default: 1 week
        """Remove log entries older than specified hours."""
        cutoff_time = datetime.utcnow() - timedelta(hours=hours)

        old_count = len(self.entries)
        self.entries = [
            entry for entry in self.entries if entry.timestamp > cutoff_time
        ]

        removed_count = old_count - len(self.entries)
        logger.info(f"Removed {removed_count} old log entries")

        return removed_count


# Global log aggregator instance
log_aggregator = LogAggregator()
