"""WebSocket endpoints for real-time communication."""

import asyncio
import json
import logging
from typing import Dict, Set
from uuid import UUID

from app.database import get_db
from app.models.execution import ExecutionLog, WorkflowExecution
from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect, status
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)

router = APIRouter(tags=["websockets"])


# Connection manager to handle WebSocket connections
class ConnectionManager:
    def __init__(self):
        # Store active connections by execution_id
        self.active_connections: Dict[str, Set[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, execution_id: str):
        """Accept WebSocket connection and add to execution pool."""
        await websocket.accept()

        if execution_id not in self.active_connections:
            self.active_connections[execution_id] = set()

        self.active_connections[execution_id].add(websocket)
        logger.info(
            f"WebSocket connected for execution {execution_id}. "
            f"Total connections: {len(self.active_connections[execution_id])}"
        )

    def disconnect(self, websocket: WebSocket, execution_id: str):
        """Remove WebSocket connection from execution pool."""
        if execution_id in self.active_connections:
            self.active_connections[execution_id].discard(websocket)

            # Clean up empty connection sets
            if not self.active_connections[execution_id]:
                del self.active_connections[execution_id]

        logger.info("WebSocket disconnected for exec %s", execution_id)

    async def send_log_to_execution(self, execution_id: str, log_data: dict):
        """Send log message to all connected clients for execution."""
        if execution_id not in self.active_connections:
            return

        # Create a copy of connections to avoid modification during iteration
        connections = self.active_connections[execution_id].copy()

        for websocket in connections:
            try:
                await websocket.send_text(json.dumps(log_data))
            except Exception as e:
                logger.error(f"Error sending log to WebSocket: {e}")
                # Remove failed connection
                self.disconnect(websocket, execution_id)

    async def broadcast_to_execution(self, execution_id: str, message: str):
        """Broadcast message to all connected clients for execution."""
        if execution_id not in self.active_connections:
            return

        connections = self.active_connections[execution_id].copy()

        for websocket in connections:
            try:
                await websocket.send_text(message)
            except Exception as e:
                logger.error(f"Error broadcasting to WebSocket: {e}")
                self.disconnect(websocket, execution_id)


# Global connection manager instance
manager = ConnectionManager()


@router.websocket("/ws/executions/{execution_id}/logs")
async def websocket_execution_logs(
    websocket: WebSocket,
    execution_id: str,
    token: str = None,  # Token can be passed as query parameter
    db: Session = Depends(get_db),
):
    """WebSocket endpoint for real-time execution logs."""
    try:
        # Validate execution_id format
        try:
            execution_uuid = UUID(execution_id)
        except ValueError:
            await websocket.close(code=status.WS_1003_UNSUPPORTED_DATA)
            return

        # For now, skip authentication for WebSocket connections
        # In production, implement proper WebSocket authentication

        # Verify execution exists (without user check for now)
        execution = (
            db.query(WorkflowExecution)
            .filter(WorkflowExecution.id == execution_uuid)
            .first()
        )

        if not execution:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return

        # Connect to the execution's log stream
        await manager.connect(websocket, execution_id)

        try:
            # Send existing logs first
            existing_logs = (
                db.query(ExecutionLog)
                .filter(ExecutionLog.execution_id == execution_uuid)
                .order_by(ExecutionLog.timestamp)
                .all()
            )

            for log in existing_logs:
                log_data = {
                    "id": str(log.id),
                    "execution_id": str(log.execution_id),
                    "step_name": log.step_name,
                    "step_type": log.step_type,
                    "input_data": log.input_data or {},
                    "output_data": log.output_data or {},
                    "duration_ms": log.duration_ms,
                    "timestamp": log.timestamp.isoformat(),
                    "error_message": log.error_message,
                    "level": "error" if log.error_message else "info",
                }

                await websocket.send_text(json.dumps(log_data))

            # Keep connection alive and listen for new logs
            # In real implementation, detect new logs and push through WebSocket
            # For now, just keep the connection open.

            while True:
                # Wait for new messages (ping/pong or client messages)
                try:
                    # Set timeout to periodically check for new logs
                    message = await asyncio.wait_for(
                        websocket.receive_text(), timeout=30.0
                    )

                    # Handle client messages (ping, etc.)
                    if message == "ping":
                        await websocket.send_text("pong")

                except asyncio.TimeoutError:
                    # Check for new logs periodically
                    # In production, use database triggers or
                    # message queues to push new logs in real-time

                    # Send a heartbeat to keep connection alive
                    heartbeat_data = {
                        "type": "heartbeat",
                        "timestamp": asyncio.get_event_loop().time(),
                    }
                    await websocket.send_text(json.dumps(heartbeat_data))

                except WebSocketDisconnect:
                    break

        except WebSocketDisconnect:
            pass
        finally:
            manager.disconnect(websocket, execution_id)

    except Exception as e:
        logger.error(f"WebSocket error for execution {execution_id}: {e}")
        try:
            await websocket.close(code=status.WS_1011)
        except Exception:
            pass  # Ignore errors when closing
