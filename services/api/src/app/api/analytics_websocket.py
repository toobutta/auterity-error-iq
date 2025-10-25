"""WebSocket server for real-time analytics updates."""

import asyncio
import json
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Set, Optional, Any
from uuid import uuid4

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, Query
from sqlalchemy.orm import Session

from app.auth import get_current_active_user
from app.database import get_db
from app.models.user import User
from app.services.analytics_service import AnalyticsService
from app.services.ai_model_orchestration_service import AIModelOrchestrationService
from app.middleware.logging import get_logger

logger = get_logger(__name__)
router = APIRouter(prefix="/analytics-ws", tags=["analytics-websocket"])


class AnalyticsWebSocketManager:
    """WebSocket manager for real-time analytics updates."""

    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
        self.subscriptions: Dict[str, Set[str]] = {}  # client_id -> set of channels
        self.client_metadata: Dict[str, Dict[str, Any]] = {}  # client_id -> metadata
        self.broadcast_tasks: Dict[str, asyncio.Task] = {}
        self.is_running = False

    async def connect(self, websocket: WebSocket, client_id: str, user_id: str, tenant_id: str) -> str:
        """Connect a new WebSocket client."""
        await websocket.accept()

        self.active_connections[client_id] = websocket
        self.subscriptions[client_id] = set()
        self.client_metadata[client_id] = {
            "user_id": user_id,
            "tenant_id": tenant_id,
            "connected_at": datetime.utcnow().isoformat(),
            "last_activity": datetime.utcnow().isoformat()
        }

        logger.info(f"WebSocket client connected: {client_id} (user: {user_id})")
        return client_id

    def disconnect(self, client_id: str):
        """Disconnect a WebSocket client."""
        if client_id in self.active_connections:
            del self.active_connections[client_id]

        if client_id in self.subscriptions:
            del self.subscriptions[client_id]

        if client_id in self.client_metadata:
            del self.client_metadata[client_id]

        # Cancel any broadcast tasks for this client
        if client_id in self.broadcast_tasks:
            self.broadcast_tasks[client_id].cancel()
            del self.broadcast_tasks[client_id]

        logger.info(f"WebSocket client disconnected: {client_id}")

    async def subscribe(self, client_id: str, channels: List[str]) -> bool:
        """Subscribe client to channels."""
        if client_id not in self.subscriptions:
            return False

        self.subscriptions[client_id].update(channels)

        # Update metadata
        if client_id in self.client_metadata:
            self.client_metadata[client_id]["last_activity"] = datetime.utcnow().isoformat()
            self.client_metadata[client_id]["subscriptions"] = list(self.subscriptions[client_id])

        logger.info(f"Client {client_id} subscribed to channels: {channels}")
        return True

    async def unsubscribe(self, client_id: str, channels: List[str]) -> bool:
        """Unsubscribe client from channels."""
        if client_id not in self.subscriptions:
            return False

        self.subscriptions[client_id].difference_update(channels)

        # Update metadata
        if client_id in self.client_metadata:
            self.client_metadata[client_id]["last_activity"] = datetime.utcnow().isoformat()
            self.client_metadata[client_id]["subscriptions"] = list(self.subscriptions[client_id])

        logger.info(f"Client {client_id} unsubscribed from channels: {channels}")
        return True

    async def broadcast_to_client(self, client_id: str, message: Dict[str, Any]) -> bool:
        """Broadcast message to specific client."""
        if client_id not in self.active_connections:
            return False

        try:
            await self.active_connections[client_id].send_json(message)
            return True
        except Exception as e:
            logger.error(f"Failed to send message to client {client_id}: {str(e)}")
            self.disconnect(client_id)
            return False

    async def broadcast_to_channel(self, channel: str, message: Dict[str, Any], tenant_filter: Optional[str] = None):
        """Broadcast message to all clients subscribed to a channel."""
        sent_count = 0

        for client_id, channels in self.subscriptions.items():
            if channel in channels:
                # Apply tenant filter if specified
                if tenant_filter:
                    client_tenant = self.client_metadata.get(client_id, {}).get("tenant_id")
                    if client_tenant != tenant_filter:
                        continue

                success = await self.broadcast_to_client(client_id, message)
                if success:
                    sent_count += 1

        logger.debug(f"Broadcasted message to {sent_count} clients on channel '{channel}'")

    async def start_periodic_broadcasts(self, db: Session):
        """Start periodic broadcast tasks."""
        if self.is_running:
            return

        self.is_running = True

        # Start analytics broadcast task
        analytics_task = asyncio.create_task(self._broadcast_analytics_updates(db))
        self.broadcast_tasks["analytics"] = analytics_task

        # Start health broadcast task
        health_task = asyncio.create_task(self._broadcast_health_updates(db))
        self.broadcast_tasks["health"] = health_task

        logger.info("Started periodic broadcast tasks")

    async def stop_periodic_broadcasts(self):
        """Stop periodic broadcast tasks."""
        if not self.is_running:
            return

        self.is_running = False

        # Cancel all broadcast tasks
        for task_name, task in self.broadcast_tasks.items():
            task.cancel()

        self.broadcast_tasks.clear()
        logger.info("Stopped periodic broadcast tasks")

    async def _broadcast_analytics_updates(self, db: Session):
        """Broadcast periodic analytics updates."""
        while self.is_running:
            try:
                await asyncio.sleep(30)  # Broadcast every 30 seconds

                # Get analytics data for all tenants
                analytics_service = AnalyticsService(db)

                # Broadcast to different channels
                await self._broadcast_user_analytics_updates(analytics_service)
                await self._broadcast_system_performance_updates(analytics_service)
                await self._broadcast_business_metrics_updates(analytics_service)

            except Exception as e:
                logger.error(f"Error in analytics broadcast: {str(e)}")
                await asyncio.sleep(5)  # Wait before retrying

    async def _broadcast_user_analytics_updates(self, analytics_service: AnalyticsService):
        """Broadcast user analytics updates."""
        try:
            # Get recent analytics data (would be optimized in production)
            current_time = datetime.utcnow()
            one_hour_ago = current_time - timedelta(hours=1)

            # This would be replaced with actual recent data queries
            mock_update = {
                "type": "user_analytics_update",
                "data": {
                    "active_users": 2847,
                    "new_users_last_hour": 23,
                    "page_views_last_hour": 1250,
                    "conversion_rate": 3.2
                },
                "timestamp": current_time.isoformat(),
                "channel": "user_analytics"
            }

            await self.broadcast_to_channel("user_analytics", mock_update)

        except Exception as e:
            logger.error(f"Error broadcasting user analytics: {str(e)}")

    async def _broadcast_system_performance_updates(self, analytics_service: AnalyticsService):
        """Broadcast system performance updates."""
        try:
            mock_update = {
                "type": "system_performance_update",
                "data": {
                    "response_time": 245,
                    "error_rate": 0.8,
                    "throughput": 1250,
                    "cpu_usage": 68.5,
                    "memory_usage": 72.3
                },
                "timestamp": datetime.utcnow().isoformat(),
                "channel": "system_performance"
            }

            await self.broadcast_to_channel("system_performance", mock_update)

        except Exception as e:
            logger.error(f"Error broadcasting system performance: {str(e)}")

    async def _broadcast_business_metrics_updates(self, analytics_service: AnalyticsService):
        """Broadcast business metrics updates."""
        try:
            mock_update = {
                "type": "business_metrics_update",
                "data": {
                    "revenue": 125000,
                    "transactions": 1250,
                    "conversion_rate": 3.2,
                    "avg_order_value": 100,
                    "growth_rate": 15.7
                },
                "timestamp": datetime.utcnow().isoformat(),
                "channel": "business_metrics"
            }

            await self.broadcast_to_channel("business_metrics", mock_update)

        except Exception as e:
            logger.error(f"Error broadcasting business metrics: {str(e)}")

    async def _broadcast_health_updates(self, db: Session):
        """Broadcast periodic health updates."""
        while self.is_running:
            try:
                await asyncio.sleep(60)  # Broadcast every minute

                health_update = {
                    "type": "health_update",
                    "data": {
                        "overall": "healthy",
                        "score": 87,
                        "systems": {
                            "auterity": {"status": "healthy", "score": 92},
                            "neuroweaver": {"status": "healthy", "score": 85},
                            "relaycore": {"status": "warning", "score": 78}
                        },
                        "last_updated": datetime.utcnow().isoformat()
                    },
                    "timestamp": datetime.utcnow().isoformat(),
                    "channel": "health"
                }

                await self.broadcast_to_channel("health", health_update)

            except Exception as e:
                logger.error(f"Error in health broadcast: {str(e)}")
                await asyncio.sleep(5)

    def get_connection_stats(self) -> Dict[str, Any]:
        """Get WebSocket connection statistics."""
        return {
            "active_connections": len(self.active_connections),
            "total_subscriptions": sum(len(channels) for channels in self.subscriptions.values()),
            "running_tasks": len(self.broadcast_tasks),
            "is_running": self.is_running,
            "timestamp": datetime.utcnow().isoformat()
        }


# Global WebSocket manager instance
ws_manager = AnalyticsWebSocketManager()


@router.websocket("/ws")
async def analytics_websocket(
    websocket: WebSocket,
    token: Optional[str] = Query(None),
    tenant_id: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """WebSocket endpoint for real-time analytics updates."""
    client_id = str(uuid4())

    try:
        # Authenticate user (simplified - would validate JWT token in production)
        if not token:
            await websocket.close(code=4001, reason="Authentication required")
            return

        # For demo purposes, create a mock user
        mock_user = {
            "id": "user_123",
            "tenant_id": tenant_id or "tenant_123"
        }

        # Connect client
        await ws_manager.connect(websocket, client_id, mock_user["id"], mock_user["tenant_id"])

        # Send welcome message
        welcome_message = {
            "type": "welcome",
            "data": {
                "client_id": client_id,
                "message": "Connected to Analytics WebSocket",
                "available_channels": [
                    "user_analytics",
                    "system_performance",
                    "business_metrics",
                    "ai_performance",
                    "health",
                    "insights"
                ]
            },
            "timestamp": datetime.utcnow().isoformat()
        }
        await websocket.send_json(welcome_message)

        # Start periodic broadcasts if not already running
        if not ws_manager.is_running:
            await ws_manager.start_periodic_broadcasts(db)

        # Handle incoming messages
        while True:
            try:
                # Receive message with timeout
                data = await asyncio.wait_for(
                    websocket.receive_json(),
                    timeout=300  # 5 minutes timeout
                )

                await handle_websocket_message(client_id, data, websocket)

            except asyncio.TimeoutError:
                # Send ping to keep connection alive
                await websocket.send_json({
                    "type": "ping",
                    "timestamp": datetime.utcnow().isoformat()
                })

    except WebSocketDisconnect:
        logger.info(f"WebSocket disconnected: {client_id}")
    except Exception as e:
        logger.error(f"WebSocket error for client {client_id}: {str(e)}")
    finally:
        ws_manager.disconnect(client_id)


async def handle_websocket_message(client_id: str, data: Dict[str, Any], websocket: WebSocket):
    """Handle incoming WebSocket messages."""
    try:
        message_type = data.get("type", "")

        if message_type == "subscribe":
            channels = data.get("channels", [])
            success = await ws_manager.subscribe(client_id, channels)

            response = {
                "type": "subscription_result",
                "data": {
                    "success": success,
                    "channels": channels,
                    "subscribed_channels": list(ws_manager.subscriptions.get(client_id, set()))
                },
                "timestamp": datetime.utcnow().isoformat()
            }

        elif message_type == "unsubscribe":
            channels = data.get("channels", [])
            success = await ws_manager.unsubscribe(client_id, channels)

            response = {
                "type": "unsubscription_result",
                "data": {
                    "success": success,
                    "channels": channels,
                    "remaining_channels": list(ws_manager.subscriptions.get(client_id, set()))
                },
                "timestamp": datetime.utcnow().isoformat()
            }

        elif message_type == "ping":
            response = {
                "type": "pong",
                "timestamp": datetime.utcnow().isoformat()
            }

        elif message_type == "get_stats":
            stats = ws_manager.get_connection_stats()
            response = {
                "type": "stats",
                "data": stats,
                "timestamp": datetime.utcnow().isoformat()
            }

        else:
            response = {
                "type": "error",
                "data": {
                    "message": f"Unknown message type: {message_type}",
                    "supported_types": ["subscribe", "unsubscribe", "ping", "get_stats"]
                },
                "timestamp": datetime.utcnow().isoformat()
            }

        await websocket.send_json(response)

    except Exception as e:
        logger.error(f"Error handling WebSocket message: {str(e)}")
        await websocket.send_json({
            "type": "error",
            "data": {
                "message": "Failed to process message",
                "error": str(e)
            },
            "timestamp": datetime.utcnow().isoformat()
        })


@router.get("/stats")
async def get_websocket_stats():
    """Get WebSocket connection statistics."""
    return ws_manager.get_connection_stats()


@router.post("/broadcast/{channel}")
async def broadcast_to_channel(
    channel: str,
    message: Dict[str, Any],
    tenant_id: Optional[str] = Query(None),
    current_user: User = Depends(get_current_active_user)
):
    """Broadcast message to all clients subscribed to a channel (admin only)."""
    # In production, add admin permission check here

    enhanced_message = {
        "type": "broadcast",
        "channel": channel,
        "data": message,
        "broadcast_by": str(current_user.id),
        "timestamp": datetime.utcnow().isoformat()
    }

    await ws_manager.broadcast_to_channel(channel, enhanced_message, tenant_id)

    return {
        "status": "broadcasted",
        "channel": channel,
        "recipient_count": "unknown",  # Would need to track this
        "timestamp": datetime.utcnow().isoformat()
    }


# ============================================================================
# AI/ML REAL-TIME UPDATES
# ============================================================================

@router.websocket("/ai-ws")
async def ai_analytics_websocket(
    websocket: WebSocket,
    token: Optional[str] = Query(None),
    tenant_id: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """WebSocket endpoint for real-time AI/ML analytics updates."""
    client_id = str(uuid4())

    try:
        # Authentication (simplified)
        if not token:
            await websocket.close(code=4001, reason="Authentication required")
            return

        mock_user = {
            "id": "user_123",
            "tenant_id": tenant_id or "tenant_123"
        }

        # Connect client
        await ws_manager.connect(websocket, client_id, mock_user["id"], mock_user["tenant_id"])

        # Send welcome message
        welcome_message = {
            "type": "welcome",
            "data": {
                "client_id": client_id,
                "message": "Connected to AI Analytics WebSocket",
                "available_channels": [
                    "model_performance",
                    "ai_costs",
                    "experiment_results",
                    "prompt_analytics",
                    "model_health"
                ]
            },
            "timestamp": datetime.utcnow().isoformat()
        }
        await websocket.send_json(welcome_message)

        # Start AI-specific broadcasts
        ai_broadcast_task = asyncio.create_task(_broadcast_ai_updates(client_id, db))
        ws_manager.broadcast_tasks[f"ai_{client_id}"] = ai_broadcast_task

        # Handle incoming messages
        while True:
            try:
                data = await asyncio.wait_for(
                    websocket.receive_json(),
                    timeout=300
                )

                await handle_ai_websocket_message(client_id, data, websocket, db)

            except asyncio.TimeoutError:
                await websocket.send_json({
                    "type": "ping",
                    "timestamp": datetime.utcnow().isoformat()
                })

    except WebSocketDisconnect:
        logger.info(f"AI WebSocket disconnected: {client_id}")
    except Exception as e:
        logger.error(f"AI WebSocket error for client {client_id}: {str(e)}")
    finally:
        # Cancel AI broadcast task
        if f"ai_{client_id}" in ws_manager.broadcast_tasks:
            ws_manager.broadcast_tasks[f"ai_{client_id}"].cancel()
            del ws_manager.broadcast_tasks[f"ai_{client_id}"]

        ws_manager.disconnect(client_id)


async def _broadcast_ai_updates(client_id: str, db: Session):
    """Broadcast AI-specific updates to client."""
    try:
        while client_id in ws_manager.active_connections:
            await asyncio.sleep(45)  # Broadcast every 45 seconds

            # Mock AI updates
            ai_updates = [
                {
                    "type": "model_performance_update",
                    "data": {
                        "model_id": "gpt-4",
                        "requests_this_minute": 12,
                        "avg_response_time": 3200,
                        "success_rate": 97.6
                    },
                    "timestamp": datetime.utcnow().isoformat(),
                    "channel": "model_performance"
                },
                {
                    "type": "cost_update",
                    "data": {
                        "total_cost_today": 15.8,
                        "cost_per_hour": 0.66,
                        "cost_trend": "stable"
                    },
                    "timestamp": datetime.utcnow().isoformat(),
                    "channel": "ai_costs"
                }
            ]

            # Send updates to client
            for update in ai_updates:
                await ws_manager.broadcast_to_client(client_id, update)

    except Exception as e:
        logger.error(f"Error in AI broadcast for client {client_id}: {str(e)}")


async def handle_ai_websocket_message(client_id: str, data: Dict[str, Any], websocket: WebSocket, db: Session):
    """Handle incoming AI WebSocket messages."""
    try:
        message_type = data.get("type", "")

        if message_type == "subscribe":
            channels = data.get("channels", [])
            # Add AI-specific channels
            ai_channels = [f"ai_{channel}" for channel in channels]
            success = await ws_manager.subscribe(client_id, ai_channels)

            response = {
                "type": "subscription_result",
                "data": {
                    "success": success,
                    "channels": ai_channels,
                    "subscribed_channels": list(ws_manager.subscriptions.get(client_id, set()))
                },
                "timestamp": datetime.utcnow().isoformat()
            }

        elif message_type == "get_model_stats":
            model_id = data.get("model_id")
            # Mock model stats - would query actual data in production
            response = {
                "type": "model_stats",
                "data": {
                    "model_id": model_id,
                    "performance": {
                        "total_requests": 1250,
                        "success_rate": 97.6,
                        "avg_response_time": 3200,
                        "total_cost": 7.2
                    },
                    "health": {
                        "status": "healthy",
                        "uptime": 99.8,
                        "error_rate": 2.4
                    }
                },
                "timestamp": datetime.utcnow().isoformat()
            }

        else:
            response = {
                "type": "error",
                "data": {
                    "message": f"Unknown AI message type: {message_type}",
                    "supported_types": ["subscribe", "get_model_stats"]
                },
                "timestamp": datetime.utcnow().isoformat()
            }

        await websocket.send_json(response)

    except Exception as e:
        logger.error(f"Error handling AI WebSocket message: {str(e)}")
        await websocket.send_json({
            "type": "error",
            "data": {
                "message": "Failed to process AI message",
                "error": str(e)
            },
            "timestamp": datetime.utcnow().isoformat()
        })


# ============================================================================
# LIFECYCLE MANAGEMENT
# ============================================================================

async def startup_analytics_websocket(db: Session):
    """Startup function for analytics WebSocket."""
    logger.info("Starting Analytics WebSocket manager...")
    await ws_manager.start_periodic_broadcasts(db)


async def shutdown_analytics_websocket():
    """Shutdown function for analytics WebSocket."""
    logger.info("Shutting down Analytics WebSocket manager...")
    await ws_manager.stop_periodic_broadcasts()

