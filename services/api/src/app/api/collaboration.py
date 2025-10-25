"""WebSocket endpoints for real-time collaboration."""

import json
from typing import Dict, Any

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, HTTPException

from app.auth import get_current_active_user
from app.models.user import User
from app.services.collaboration_service import (
    CollaborationService,
    get_collaboration_service,
    CollaborationEvent
)
from app.middleware.logging import get_logger

logger = get_logger(__name__)
router = APIRouter(prefix="/collaboration", tags=["collaboration"])


@router.websocket("/ws/{resource_type}/{resource_id}")
async def collaboration_websocket(
    websocket: WebSocket,
    resource_type: str,
    resource_id: str,
    token: str = None,
    collaboration_service: CollaborationService = Depends(get_collaboration_service)
):
    """WebSocket endpoint for real-time collaboration."""

    # TODO: Implement proper authentication from token
    # For now, we'll accept any connection (should be secured in production)
    user_id = "anonymous"  # Should be extracted from JWT token
    username = "Anonymous User"

    # Validate resource type
    if resource_type not in ["workflow", "dashboard"]:
        await websocket.close(code=1003, reason="Invalid resource type")
        return

    try:
        await websocket.accept()

        # Create or join session
        session_id = await collaboration_service.create_session(
            resource_type, resource_id, user_id, username
        )

        # Join the session
        session = await collaboration_service.join_session(
            session_id, websocket, user_id, username
        )

        logger.info(f"User {user_id} joined collaboration session {session_id}")

        # Main message handling loop
        while True:
            try:
                # Receive message
                message = await websocket.receive_json()
                message_type = message.get("type")

                if message_type == CollaborationEvent.PING.value:
                    # Respond to ping
                    await websocket.send_json({
                        "type": CollaborationEvent.PONG.value,
                        "timestamp": message.get("timestamp", 0)
                    })

                elif message_type == CollaborationEvent.OPERATION.value:
                    # Handle operation
                    await collaboration_service.handle_operation(
                        session_id,
                        message.get("operation", {})
                    )

                elif message_type == CollaborationEvent.CURSOR_MOVE.value:
                    # Handle cursor movement
                    await collaboration_service.handle_cursor_move(
                        session_id,
                        user_id,
                        message.get("position", {})
                    )

                elif message_type == CollaborationEvent.SELECTION_CHANGE.value:
                    # Handle selection changes
                    await collaboration_service.handle_selection_change(
                        session_id,
                        user_id,
                        message.get("selection")
                    )

                else:
                    logger.warning(f"Unknown message type: {message_type}")

            except json.JSONDecodeError:
                logger.error("Invalid JSON received")
                await websocket.send_json({
                    "type": "error",
                    "message": "Invalid JSON format"
                })

            except Exception as e:
                logger.error(f"Message handling error: {str(e)}")
                await websocket.send_json({
                    "type": "error",
                    "message": "Internal server error"
                })

    except WebSocketDisconnect:
        logger.info(f"User {user_id} disconnected from session {session_id}")

    except Exception as e:
        logger.error(f"WebSocket error: {str(e)}")

    finally:
        # Clean up when connection closes
        try:
            await collaboration_service.leave_session(session_id, user_id)
        except Exception as e:
            logger.error(f"Error leaving session: {str(e)}")


@router.get("/sessions/{resource_type}/{resource_id}")
async def get_session_info(
    resource_type: str,
    resource_id: str,
    current_user: User = Depends(get_current_active_user),
    collaboration_service: CollaborationService = Depends(get_collaboration_service)
):
    """Get information about a collaborative session."""
    session_id = f"{resource_type}:{resource_id}"

    # Check if session exists
    if session_id not in collaboration_service.sessions:
        raise HTTPException(status_code=404, detail="Session not found")

    session = collaboration_service.sessions[session_id]

    return {
        "session_id": session.session_id,
        "resource_type": session.resource_type,
        "resource_id": session.resource_id,
        "participant_count": len(session.get_active_participants()),
        "participants": [
            {
                "user_id": p.user_id,
                "username": p.username,
                "color": p.color,
                "joined_at": p.joined_at,
                "last_activity": p.last_activity
            }
            for p in session.get_active_participants()
        ],
        "operation_count": len(session.operations),
        "created_at": session.created_at,
        "last_activity": session.last_activity
    }


@router.get("/sessions")
async def list_active_sessions(
    current_user: User = Depends(get_current_active_user),
    collaboration_service: CollaborationService = Depends(get_collaboration_service)
):
    """List all active collaborative sessions."""

    sessions = []
    for session_id, session in collaboration_service.sessions.items():
        if session.get_active_participants():  # Only include sessions with active participants
            sessions.append({
                "session_id": session.session_id,
                "resource_type": session.resource_type,
                "resource_id": session.resource_id,
                "participant_count": len(session.get_active_participants()),
                "created_at": session.created_at,
                "last_activity": session.last_activity
            })

    return {
        "sessions": sessions,
        "total": len(sessions)
    }


@router.post("/sessions/{resource_type}/{resource_id}/invite")
async def invite_to_session(
    resource_type: str,
    resource_id: str,
    invite_data: Dict[str, Any],
    current_user: User = Depends(get_current_active_user),
    collaboration_service: CollaborationService = Depends(get_collaboration_service)
):
    """Invite users to a collaborative session."""

    # TODO: Implement user invitation system
    # This would involve sending notifications/emails and managing permissions

    return {
        "message": "Invitation sent",
        "session_id": f"{resource_type}:{resource_id}",
        "invited_users": invite_data.get("users", [])
    }


@router.delete("/sessions/{resource_type}/{resource_id}")
async def end_session(
    resource_type: str,
    resource_id: str,
    current_user: User = Depends(get_current_active_user),
    collaboration_service: CollaborationService = Depends(get_collaboration_service)
):
    """End a collaborative session."""

    session_id = f"{resource_type}:{resource_id}"

    if session_id not in collaboration_service.sessions:
        raise HTTPException(status_code=404, detail="Session not found")

    # TODO: Add permission check - only session owner should be able to end

    # Notify all participants
    session = collaboration_service.sessions[session_id]
    for participant in session.get_active_participants():
        try:
            await participant.websocket.send_json({
                "type": "session_ended",
                "reason": "Session ended by owner",
                "timestamp": json.dumps({"timestamp": 0})
            })
        except Exception:
            pass  # Ignore send errors when ending session

    # Remove session
    del collaboration_service.sessions[session_id]
    collaboration_service.redis.delete(f"collaboration:session:{session_id}")

    return {"message": "Session ended successfully"}
