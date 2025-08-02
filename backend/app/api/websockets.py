"""WebSocket endpoints for real-time communication."""

import asyncio
import json
import logging
from typing import Dict, Set
from uuid import UUID

from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect, status
from sqlalchemy import and_
from sqlalchemy.orm import Session

from app.auth import get_current_active_user_ws
from app.database import get_db
from app.models.execution import ExecutionLog, WorkflowExecution
from app.models.user import User
from app.models.workflow import Workflow

logger = logging.getLogger(__name__)

router = APIRouter(tags=["websockets"])

# Connection manager to handle WebSocket connections
class ConnectionManager:
    def __init__(self):
        # Store active connections by execution_id
        self.active_connections: Dict[str, Set[WebSocket]] = {}
        
    async def connect(self, websocket: WebSocket, execution_id: str):
        """Accept a WebSocket connection and add it to the execution's connection pool."""
        await websocket.accept()
        
        if execution_id not in self.active_connections:
            self.active_connections[execution_id] = set()
        
        self.active_connections[execution_id].add(websocket)
        logger.info(f"WebSocket connected for execution {execution_id}. Total connections: {len(self.active_connections[execution_id])}")
    
    def disconnect(self, websocket: WebSocket, execution_id: str):
        """Remove a WebSocket connection from the execution's connection pool."""
        if execution_id in self.active_connections:
            self.active_connections[execution_id].discard(websocket)
            
            # Clean up empty connection sets
            if not self.active_connections[execution_id]:
                del self.active_connections[execution_id]
                
        logger.info(f"WebSocket disconnected for execution {execution_id}")
    
    async def send_log_to_execution(self, execution_id: str, log_data: dict):
        """Send a log message to all connected clients for a specific execution."""
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
        """Broadcast a message to all connected clients for a specific execution."""
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


async def get_current_active_user_ws(
    websocket: WebSocket,
    token: str,
    db: Session = Depends(get_db)
) -> User:
    """Get current active user for WebSocket connections."""
    try:
        # For now, we'll implement a simple token validation
        # In production, you'd want to implement proper JWT validation
        from app.auth import get_current_active_user
        
        # Mock request object for dependency injection
        class MockRequest:
            def __init__(self, token: str):
                self.headers = {"authorization": f"Bearer {token}"}
        
        # This is a simplified approach - in production you'd want proper WebSocket auth
        # For now, we'll skip authentication and assume valid user
        # You should implement proper WebSocket authentication based on your auth system
        
        return None  # Placeholder - implement proper auth
        
    except Exception as e:
        logger.error(f"WebSocket authentication error: {e}")
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        raise


@router.websocket("/ws/executions/{execution_id}/logs")
async def websocket_execution_logs(
    websocket: WebSocket,
    execution_id: str,
    token: str = None,  # Token can be passed as query parameter
    db: Session = Depends(get_db)
):
    """WebSocket endpoint for real-time execution logs."""
    try:
        # Validate execution_id format
        try:
            execution_uuid = UUID(execution_id)
        except ValueError:
            await websocket.close(code=status.WS_1003_UNSUPPORTED_DATA)
            return
        
        # For now, we'll skip authentication for WebSocket connections
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
            # In a real implementation, you'd have a mechanism to detect new logs
            # and push them through the WebSocket. For now, we'll just keep the connection open.
            
            while True:
                # Wait for new messages (ping/pong or client messages)
                try:
                    # Set a timeout to periodically check for new logs
                    message = await asyncio.wait_for(websocket.receive_text(), timeout=30.0)
                    
                    # Handle client messages (ping, etc.)
                    if message == "ping":
                        await websocket.send_text("pong")
                    
                except asyncio.TimeoutError:
                    # Check for new logs periodically
                    # In production, you'd use database triggers or message queues
                    # to push new logs in real-time
                    
                    # Send a heartbeat to keep connection alive
                    await websocket.send_text(json.dumps({"type": "heartbeat", "timestamp": asyncio.get_event_loop().time()}))
                    
                except WebSocketDisconnect:
                    break
                    
        except WebSocketDisconnect:
            pass
        finally:
            manager.disconnect(websocket, execution_id)
            
    except Exception as e:
        logger.error(f"WebSocket error for execution {execution_id}: {e}")
        try:
            await websocket.close(code=status.WS_1011_INTERNAL_ERROR)
        except:
            pass


@router.websocket("/ws/executions/{execution_id}/status")
async def websocket_execution_status(
    websocket: WebSocket,
    execution_id: str,
    token: str = None,
    db: Session = Depends(get_db)
):
    """WebSocket endpoint for real-time execution status updates."""
    try:
        # Validate execution_id format
        try:
            execution_uuid = UUID(execution_id)
        except ValueError:
            await websocket.close(code=status.WS_1003_UNSUPPORTED_DATA)
            return
        
        # Verify execution exists
        execution = (
            db.query(WorkflowExecution)
            .filter(WorkflowExecution.id == execution_uuid)
            .first()
        )
        
        if not execution:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return
        
        await websocket.accept()
        
        try:
            # Send current status
            status_data = {
                "id": str(execution.id),
                "workflow_id": str(execution.workflow_id),
                "status": execution.status.value,
                "started_at": execution.started_at.isoformat() if execution.started_at else None,
                "completed_at": execution.completed_at.isoformat() if execution.completed_at else None,
                "error_message": execution.error_message,
            }
            
            await websocket.send_text(json.dumps(status_data))
            
            # Keep connection alive for status updates
            while True:
                try:
                    message = await asyncio.wait_for(websocket.receive_text(), timeout=30.0)
                    
                    if message == "ping":
                        await websocket.send_text("pong")
                    elif message == "get_status":
                        # Refresh execution status from database
                        db.refresh(execution)
                        status_data = {
                            "id": str(execution.id),
                            "workflow_id": str(execution.workflow_id),
                            "status": execution.status.value,
                            "started_at": execution.started_at.isoformat() if execution.started_at else None,
                            "completed_at": execution.completed_at.isoformat() if execution.completed_at else None,
                            "error_message": execution.error_message,
                        }
                        await websocket.send_text(json.dumps(status_data))
                        
                except asyncio.TimeoutError:
                    # Send heartbeat
                    await websocket.send_text(json.dumps({"type": "heartbeat"}))
                    
                except WebSocketDisconnect:
                    break
                    
        except WebSocketDisconnect:
            pass
            
    except Exception as e:
        logger.error(f"WebSocket status error for execution {execution_id}: {e}")
        try:
            await websocket.close(code=status.WS_1011_INTERNAL_ERROR)
        except:
            pass


# Utility function to push new logs to connected clients
async def push_log_to_clients(execution_id: str, log: ExecutionLog):
    """Push a new log entry to all connected WebSocket clients for an execution."""
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
    
    await manager.send_log_to_execution(str(execution_id), log_data)


# Utility function to push status updates to connected clients
async def push_status_to_clients(execution_id: str, execution: WorkflowExecution):
    """Push execution status update to all connected WebSocket clients."""
    status_data = {
        "type": "status_update",
        "id": str(execution.id),
        "workflow_id": str(execution.workflow_id),
        "status": execution.status.value,
        "started_at": execution.started_at.isoformat() if execution.started_at else None,
        "completed_at": execution.completed_at.isoformat() if execution.completed_at else None,
        "error_message": execution.error_message,
    }
    
    await manager.broadcast_to_execution(str(execution_id), json.dumps(status_data))