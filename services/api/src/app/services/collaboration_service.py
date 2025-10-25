"""Real-time collaboration service for multi-user workflows and dashboards."""

import asyncio
import json
import hashlib
import time
from typing import Dict, List, Set, Optional, Any, Callable
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum

import redis
from fastapi import WebSocket, WebSocketDisconnect

from app.middleware.logging import get_logger

logger = get_logger(__name__)


class CollaborationEvent(Enum):
    """Types of collaboration events."""
    JOIN = "join"
    LEAVE = "leave"
    CURSOR_MOVE = "cursor_move"
    OPERATION = "operation"
    SELECTION_CHANGE = "selection_change"
    PING = "ping"
    PONG = "pong"


class OperationType(Enum):
    """Types of operations that can be performed."""
    INSERT = "insert"
    UPDATE = "update"
    DELETE = "delete"
    MOVE = "move"


@dataclass
class Operation:
    """Represents an operation in the operational transform system."""
    id: str
    type: OperationType
    path: List[str]  # JSON path to the target
    value: Any = None
    old_value: Any = None
    user_id: str = ""
    timestamp: float = field(default_factory=time.time)
    dependencies: List[str] = field(default_factory=list)

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for serialization."""
        return {
            "id": self.id,
            "type": self.type.value,
            "path": self.path,
            "value": self.value,
            "old_value": self.old_value,
            "user_id": self.user_id,
            "timestamp": self.timestamp,
            "dependencies": self.dependencies
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'Operation':
        """Create from dictionary."""
        return cls(
            id=data["id"],
            type=OperationType(data["type"]),
            path=data["path"],
            value=data.get("value"),
            old_value=data.get("old_value"),
            user_id=data.get("user_id", ""),
            timestamp=data.get("timestamp", time.time()),
            dependencies=data.get("dependencies", [])
        )


@dataclass
class Participant:
    """Represents a participant in a collaborative session."""
    user_id: str
    username: str
    websocket: WebSocket
    cursor_position: Dict[str, Any] = field(default_factory=dict)
    color: str = "#3b82f6"  # Default blue
    joined_at: float = field(default_factory=time.time)
    last_activity: float = field(default_factory=time.time)

    @property
    def is_active(self) -> bool:
        """Check if participant is still active."""
        return time.time() - self.last_activity < 60  # 1 minute timeout


@dataclass
class CollaborativeSession:
    """Represents a collaborative editing session."""
    session_id: str
    resource_type: str  # "workflow" or "dashboard"
    resource_id: str
    participants: Dict[str, Participant] = field(default_factory=dict)
    operations: List[Operation] = field(default_factory=list)
    created_at: float = field(default_factory=time.time)
    last_activity: float = field(default_factory=time.time)

    def add_participant(self, participant: Participant) -> None:
        """Add a participant to the session."""
        self.participants[participant.user_id] = participant
        self.last_activity = time.time()

    def remove_participant(self, user_id: str) -> None:
        """Remove a participant from the session."""
        if user_id in self.participants:
            del self.participants[user_id]
            self.last_activity = time.time()

    def get_active_participants(self) -> List[Participant]:
        """Get list of active participants."""
        return [p for p in self.participants.values() if p.is_active]

    def add_operation(self, operation: Operation) -> None:
        """Add an operation to the session."""
        self.operations.append(operation)
        self.last_activity = time.time()

    def get_recent_operations(self, since_timestamp: float) -> List[Operation]:
        """Get operations since a specific timestamp."""
        return [op for op in self.operations if op.timestamp > since_timestamp]


class OperationalTransformer:
    """Handles operational transformation for conflict resolution."""

    @staticmethod
    def transform_operation(operation: Operation, concurrent_ops: List[Operation]) -> Operation:
        """Transform an operation against concurrent operations."""
        transformed_op = operation

        for concurrent_op in concurrent_ops:
            if OperationalTransformer._are_concurrent(operation, concurrent_op):
                if OperationalTransformer._conflicts(operation, concurrent_op):
                    transformed_op = OperationalTransformer._resolve_conflict(
                        transformed_op, concurrent_op
                    )
                else:
                    transformed_op = OperationalTransformer._merge_operations(
                        transformed_op, concurrent_op
                    )

        return transformed_op

    @staticmethod
    def _are_concurrent(op1: Operation, op2: Operation) -> bool:
        """Check if two operations are concurrent (no causal relationship)."""
        return not (
            OperationalTransformer._depends_on(op1, op2) or
            OperationalTransformer._depends_on(op2, op1)
        )

    @staticmethod
    def _depends_on(op1: Operation, op2: Operation) -> bool:
        """Check if operation 1 depends on operation 2."""
        return (
            op1.timestamp > op2.timestamp and
            op2.id in op1.dependencies
        )

    @staticmethod
    def _conflicts(op1: Operation, op2: Operation) -> bool:
        """Check if two operations conflict."""
        # Operations conflict if they modify the same path
        return (
            op1.path == op2.path and
            (op1.type in [OperationType.UPDATE, OperationType.DELETE] or
             op2.type in [OperationType.UPDATE, OperationType.DELETE])
        )

    @staticmethod
    def _resolve_conflict(op1: Operation, op2: Operation) -> Operation:
        """Resolve conflict between two operations."""
        # Simple conflict resolution: last writer wins
        if op1.timestamp > op2.timestamp:
            return op1
        else:
            return op2

    @staticmethod
    def _merge_operations(op1: Operation, op2: Operation) -> Operation:
        """Merge two non-conflicting operations."""
        # For now, just return the first operation
        # In a more sophisticated implementation, this could combine operations
        return op1


class CollaborationService:
    """Main service for managing real-time collaboration."""

    def __init__(self, redis_url: str = "redis://localhost:6379/3"):
        self.redis = redis.Redis.from_url(redis_url, decode_responses=True)
        self.sessions: Dict[str, CollaborativeSession] = {}
        self.transformer = OperationalTransformer()
        self._cleanup_task: Optional[asyncio.Task] = None
        self._running = False

    async def start(self):
        """Start the collaboration service."""
        self._running = True
        self._cleanup_task = asyncio.create_task(self._cleanup_loop())
        logger.info("Collaboration service started")

    async def stop(self):
        """Stop the collaboration service."""
        self._running = False
        if self._cleanup_task:
            self._cleanup_task.cancel()
            try:
                await self._cleanup_task
            except asyncio.CancelledError:
                pass
        logger.info("Collaboration service stopped")

    async def create_session(
        self,
        resource_type: str,
        resource_id: str,
        user_id: str,
        username: str
    ) -> str:
        """Create a new collaborative session."""
        session_id = f"{resource_type}:{resource_id}"

        if session_id not in self.sessions:
            session = CollaborativeSession(
                session_id=session_id,
                resource_type=resource_type,
                resource_id=resource_id
            )
            self.sessions[session_id] = session

            # Persist session to Redis
            self._save_session(session)

        return session_id

    async def join_session(
        self,
        session_id: str,
        websocket: WebSocket,
        user_id: str,
        username: str
    ) -> CollaborativeSession:
        """Join an existing collaborative session."""
        if session_id not in self.sessions:
            # Try to load from Redis
            session = self._load_session(session_id)
            if session:
                self.sessions[session_id] = session
            else:
                raise ValueError(f"Session {session_id} not found")

        session = self.sessions[session_id]

        # Create participant
        participant = Participant(
            user_id=user_id,
            username=username,
            websocket=websocket
        )

        # Add participant to session
        session.add_participant(participant)

        # Notify other participants
        await self._broadcast_to_session(
            session_id,
            {
                "type": CollaborationEvent.JOIN.value,
                "user_id": user_id,
                "username": username,
                "timestamp": time.time()
            },
            exclude_user=user_id
        )

        # Send current state to new participant
        await self._send_current_state(session, participant)

        return session

    async def leave_session(self, session_id: str, user_id: str):
        """Leave a collaborative session."""
        if session_id in self.sessions:
            session = self.sessions[session_id]
            session.remove_participant(user_id)

            # Notify other participants
            await self._broadcast_to_session(
                session_id,
                {
                    "type": CollaborationEvent.LEAVE.value,
                    "user_id": user_id,
                    "timestamp": time.time()
                },
                exclude_user=user_id
            )

            # Clean up empty sessions
            if not session.participants:
                del self.sessions[session_id]
                self.redis.delete(f"collaboration:session:{session_id}")

    async def handle_operation(self, session_id: str, operation_data: Dict[str, Any]):
        """Handle an operation from a participant."""
        if session_id not in self.sessions:
            return

        session = self.sessions[session_id]

        # Create operation object
        operation = Operation.from_dict(operation_data)

        # Transform operation against concurrent operations
        recent_ops = session.get_recent_operations(operation.timestamp - 1)
        transformed_op = self.transformer.transform_operation(operation, recent_ops)

        # Add to session
        session.add_operation(transformed_op)

        # Broadcast to all participants
        await self._broadcast_to_session(session_id, {
            "type": CollaborationEvent.OPERATION.value,
            "operation": transformed_op.to_dict(),
            "timestamp": time.time()
        })

        # Persist operation
        self._save_operation(session_id, transformed_op)

    async def handle_cursor_move(self, session_id: str, user_id: str, position: Dict[str, Any]):
        """Handle cursor movement from a participant."""
        if session_id in self.sessions:
            session = self.sessions[session_id]

            if user_id in session.participants:
                session.participants[user_id].cursor_position = position
                session.participants[user_id].last_activity = time.time()

                # Broadcast cursor position
                await self._broadcast_to_session(
                    session_id,
                    {
                        "type": CollaborationEvent.CURSOR_MOVE.value,
                        "user_id": user_id,
                        "position": position,
                        "timestamp": time.time()
                    },
                    exclude_user=user_id
                )

    async def handle_selection_change(self, session_id: str, user_id: str, selection: Any):
        """Handle selection changes from a participant."""
        if session_id in self.sessions:
            session = self.sessions[session_id]

            if user_id in session.participants:
                session.participants[user_id].last_activity = time.time()

                # Broadcast selection change
                await self._broadcast_to_session(
                    session_id,
                    {
                        "type": CollaborationEvent.SELECTION_CHANGE.value,
                        "user_id": user_id,
                        "selection": selection,
                        "timestamp": time.time()
                    },
                    exclude_user=user_id
                )

    async def _broadcast_to_session(
        self,
        session_id: str,
        message: Dict[str, Any],
        exclude_user: Optional[str] = None
    ):
        """Broadcast message to all participants in a session."""
        if session_id not in self.sessions:
            return

        session = self.sessions[session_id]

        for participant in session.get_active_participants():
            if exclude_user and participant.user_id == exclude_user:
                continue

            try:
                await participant.websocket.send_json(message)
            except Exception as e:
                logger.error(f"Failed to send message to {participant.user_id}: {str(e)}")

    async def _send_current_state(self, session: CollaborativeSession, participant: Participant):
        """Send current session state to a new participant."""
        # Send list of current participants
        participants_data = [
            {
                "user_id": p.user_id,
                "username": p.username,
                "color": p.color,
                "cursor_position": p.cursor_position
            }
            for p in session.get_active_participants()
        ]

        await participant.websocket.send_json({
            "type": "session_state",
            "participants": participants_data,
            "operations": [op.to_dict() for op in session.operations[-50:]],  # Last 50 operations
            "timestamp": time.time()
        })

    async def _cleanup_loop(self):
        """Periodic cleanup of inactive sessions and participants."""
        while self._running:
            try:
                await self._cleanup_sessions()
                await asyncio.sleep(30)  # Clean up every 30 seconds
            except Exception as e:
                logger.error(f"Cleanup error: {str(e)}")
                await asyncio.sleep(5)

    async def _cleanup_sessions(self):
        """Clean up inactive sessions and participants."""
        current_time = time.time()
        sessions_to_remove = []

        for session_id, session in self.sessions.items():
            # Remove inactive participants
            inactive_users = []
            for user_id, participant in session.participants.items():
                if not participant.is_active:
                    inactive_users.append(user_id)

            for user_id in inactive_users:
                session.remove_participant(user_id)

            # Remove empty sessions older than 1 hour
            if (not session.participants and
                current_time - session.last_activity > 3600):
                sessions_to_remove.append(session_id)

        # Remove empty sessions
        for session_id in sessions_to_remove:
            del self.sessions[session_id]
            self.redis.delete(f"collaboration:session:{session_id}")

    def _save_session(self, session: CollaborativeSession):
        """Save session to Redis."""
        key = f"collaboration:session:{session.session_id}"
        data = {
            "session_id": session.session_id,
            "resource_type": session.resource_type,
            "resource_id": session.resource_id,
            "created_at": session.created_at,
            "last_activity": session.last_activity
        }
        self.redis.setex(key, 3600, json.dumps(data))  # 1 hour TTL

    def _load_session(self, session_id: str) -> Optional[CollaborativeSession]:
        """Load session from Redis."""
        key = f"collaboration:session:{session_id}"
        data = self.redis.get(key)

        if data:
            parsed_data = json.loads(data)
            session = CollaborativeSession(
                session_id=parsed_data["session_id"],
                resource_type=parsed_data["resource_type"],
                resource_id=parsed_data["resource_id"],
                created_at=parsed_data["created_at"],
                last_activity=parsed_data["last_activity"]
            )
            return session

        return None

    def _save_operation(self, session_id: str, operation: Operation):
        """Save operation to Redis."""
        key = f"collaboration:operations:{session_id}"
        operation_data = operation.to_dict()

        # Keep only last 100 operations
        existing_ops = self.redis.get(key)
        if existing_ops:
            operations = json.loads(existing_ops)
            operations.append(operation_data)
            operations = operations[-100:]  # Keep last 100
        else:
            operations = [operation_data]

        self.redis.setex(key, 3600, json.dumps(operations))  # 1 hour TTL


# Global collaboration service instance
collaboration_service = CollaborationService()


async def get_collaboration_service() -> CollaborationService:
    """Dependency injection for collaboration service."""
    return collaboration_service
