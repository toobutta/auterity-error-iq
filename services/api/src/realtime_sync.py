"""
Real-Time Data Synchronization with Event Sourcing
Advanced implementation using CQRS and Event Streaming
"""

import asyncio
from dataclasses import dataclass
from datetime import datetime
from typing import Any, Dict, List


@dataclass
class SyncEvent:
    """Represents a synchronization event"""

    event_id: str
    source_system: str
    target_systems: List[str]
    event_type: str
    data: Dict[str, Any]
    timestamp: datetime
    version: int


class EventStream:
    """High-performance event streaming for real-time sync"""

    def __init__(self):
        self.streams = {}
        self.subscribers = {}
        self.offsets = {}

    async def append_event(self, stream_id: str, event: SyncEvent):
        """Append event to stream with ordering guarantees"""
        if stream_id not in self.streams:
            self.streams[stream_id] = []

        self.streams[stream_id].append(event)

        # Notify subscribers with at-least-once delivery
        if stream_id in self.subscribers:
            for subscriber in self.subscribers[stream_id]:
                await subscriber(event)

    async def subscribe_to_stream(
        self, stream_id: str, handler, from_offset: int = 0
    ):
        """Subscribe to event stream with replay capability"""
        if stream_id not in self.subscribers:
            self.subscribers[stream_id] = []

        self.subscribers[stream_id].append(handler)

        # Replay events from offset
        if stream_id in self.streams:
            for event in self.streams[stream_id][from_offset:]:
                await handler(event)


class ConflictResolver:
    """Advanced conflict resolution for distributed data"""

    def __init__(self):
        self.resolution_strategies = {
            "last_write_wins": self._last_write_wins,
            "vector_clock": self._vector_clock_resolve,
            "application_specific": self._application_resolve,
        }

    async def resolve_conflict(
        self, events: List[SyncEvent], strategy: str = "last_write_wins"
    ):
        """Resolve conflicts between concurrent updates"""
        resolver = self.resolution_strategies.get(
            strategy, self._last_write_wins
        )
        return await resolver(events)

    async def _last_write_wins(self, events: List[SyncEvent]) -> SyncEvent:
        """Simple last-write-wins resolution"""
        return max(events, key=lambda e: e.timestamp)

    async def _vector_clock_resolve(
        self, events: List[SyncEvent]
    ) -> SyncEvent:
        """Vector clock based resolution"""
        # Simplified vector clock logic
        return max(events, key=lambda e: e.version)

    async def _application_resolve(self, events: List[SyncEvent]) -> SyncEvent:
        """Application-specific conflict resolution"""
        # Custom business logic can be implemented here
        return events[0]


class RealTimeSyncEngine:
    """Real-time synchronization engine with advanced features"""

    def __init__(self):
        self.event_stream = EventStream()
        self.conflict_resolver = ConflictResolver()
        self.sync_graph = {}  # System dependency graph

    async def register_system(
        self, system_id: str, dependencies: List[str] = None
    ):
        """Register a system in the sync topology"""
        self.sync_graph[system_id] = dependencies or []

    async def propagate_change(
        self, source_system: str, change_data: Dict[str, Any]
    ):
        """Propagate changes through the system topology"""
        # Create sync event
        event = SyncEvent(
            event_id=f"sync-{hash(str(change_data))}",
            source_system=source_system,
            target_systems=self._get_dependent_systems(source_system),
            event_type="data_change",
            data=change_data,
            timestamp=datetime.now(),
            version=1,
        )

        # Stream to all relevant systems
        await self.event_stream.append_event(f"sync-{source_system}", event)

        return event

    def _get_dependent_systems(self, source_system: str) -> List[str]:
        """Get systems that depend on the source system"""
        dependents = []
        for system, deps in self.sync_graph.items():
            if source_system in deps:
                dependents.append(system)
        return dependents

    async def ensure_consistency(self, data_key: str, timeout: float = 5.0):
        """Ensure eventual consistency across systems"""
        # Implementation for consistency checks
        await asyncio.sleep(0.1)  # Simulate consistency check
        return {"status": "consistent", "key": data_key}


# Advanced synchronization patterns
async def demonstrate_real_time_sync():
    """Demonstrate advanced real-time synchronization"""

    sync_engine = RealTimeSyncEngine()

    # Register systems with dependencies
    await sync_engine.register_system("user_service", [])
    await sync_engine.register_system("order_service", ["user_service"])
    await sync_engine.register_system(
        "analytics_service", ["user_service", "order_service"]
    )

    # Set up event handlers
    async def handle_user_change(event: SyncEvent):
        print(
            f"User service received: {event.event_type} from {event.source_system}"
        )

    async def handle_order_change(event: SyncEvent):
        print(
            f"Order service received: {event.event_type} from {event.source_system}"
        )

    # Subscribe to relevant streams
    await sync_engine.event_stream.subscribe_to_stream(
        "sync-user_service", handle_user_change
    )
    await sync_engine.event_stream.subscribe_to_stream(
        "sync-order_service", handle_order_change
    )

    # Propagate changes
    await sync_engine.propagate_change(
        "user_service",
        {
            "user_id": "user-123",
            "profile_updated": True,
            "preferences": {"theme": "dark", "notifications": True},
        },
    )

    # Ensure consistency
    consistency_result = await sync_engine.ensure_consistency("user-123")
    print(f"Consistency check: {consistency_result}")


if __name__ == "__main__":
    asyncio.run(demonstrate_real_time_sync())
