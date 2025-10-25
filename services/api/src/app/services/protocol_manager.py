"""
Protocol Manager for handling MCP protocol messages.
Implements message parsing, routing, authentication, and validation.
"""

import json
import logging
from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional
from uuid import UUID, uuid4

logger = logging.getLogger(__name__)


class MessageType(str, Enum):
    REQUEST = "request"
    RESPONSE = "response"
    NOTIFICATION = "notification"
    ERROR = "error"


class ProtocolMessage:
    def __init__(
        self,
        message_type: MessageType,
        method: str,
        params: Optional[Dict[str, Any]] = None,
        message_id: Optional[str] = None,
        result: Optional[Any] = None,
        error: Optional[Dict[str, Any]] = None,
    ):
        self.id = message_id or str(uuid4())
        self.message_type = message_type
        self.method = method
        self.params = params or {}
        self.result = result
        self.error = error
        self.timestamp = datetime.utcnow()

    def to_dict(self) -> Dict[str, Any]:
        data = {"jsonrpc": "2.0", "id": self.id, "method": self.method}

        if self.message_type == MessageType.REQUEST:
            data["params"] = self.params
        elif self.message_type == MessageType.RESPONSE:
            if self.error:
                data["error"] = self.error
            else:
                data["result"] = self.result
        elif self.message_type == MessageType.NOTIFICATION:
            data["params"] = self.params
            data.pop("id")  # Notifications don't have IDs

        return data

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "ProtocolMessage":
        if "method" in data:
            if "id" in data:
                return cls(
                    MessageType.REQUEST,
                    data["method"],
                    data.get("params"),
                    data.get("id"),
                )
            else:
                return cls(
                    MessageType.NOTIFICATION,
                    data["method"],
                    data.get("params"),
                )
        elif "result" in data or "error" in data:
            return cls(
                MessageType.RESPONSE,
                "",  # Responses don't have methods
                message_id=data.get("id"),
                result=data.get("result"),
                error=data.get("error"),
            )
        else:
            raise ValueError("Invalid message format")


class ProtocolManager:
    def __init__(self):
        self.message_handlers: Dict[str, callable] = {}
        self.middleware: List[callable] = []
        self.active_connections: Dict[UUID, Any] = {}

    def register_handler(self, method: str, handler: callable):
        """Register a handler for a specific method."""
        self.message_handlers[method] = handler
        logger.info(f"Registered handler for method: {method}")

    def add_middleware(self, middleware: callable):
        """Add middleware for message processing."""
        self.middleware.append(middleware)

    async def authenticate_message(
        self, message: ProtocolMessage, connection_id: UUID
    ) -> bool:
        """Authenticate incoming protocol message."""
        # TODO: Implement actual authentication logic
        # For now, return True for all messages
        logger.info(
            f"Authenticating message {message.id} from connection {connection_id}"
        )
        return True

    def validate_message(self, message: ProtocolMessage) -> bool:
        """Validate protocol message format and content."""
        try:
            # Check required fields
            if not message.method and message.message_type in [
                MessageType.REQUEST,
                MessageType.NOTIFICATION,
            ]:
                return False

            # Check JSON-RPC format requirements
            if message.message_type == MessageType.REQUEST and not message.id:
                return False

            return True
        except Exception as e:
            logger.error(f"Message validation failed: {str(e)}")
            return False

    async def process_message(
        self, raw_message: str, connection_id: UUID
    ) -> Optional[ProtocolMessage]:
        """Process an incoming protocol message."""
        try:
            # Parse JSON
            data = json.loads(raw_message)
            message = ProtocolMessage.from_dict(data)

            # Validate message
            if not self.validate_message(message):
                return ProtocolMessage(
                    MessageType.ERROR,
                    "",
                    error={"code": -32600, "message": "Invalid Request"},
                )

            # Authenticate
            if not await self.authenticate_message(message, connection_id):
                return ProtocolMessage(
                    MessageType.ERROR,
                    "",
                    error={"code": -32001, "message": "Unauthorized"},
                )

            # Apply middleware
            for middleware in self.middleware:
                message = await middleware(message)
                if message is None:
                    return None

            # Route to handler
            return await self.route_message(message)

        except json.JSONDecodeError:
            return ProtocolMessage(
                MessageType.ERROR,
                "",
                error={"code": -32700, "message": "Parse error"},
            )
        except Exception as e:
            logger.error(f"Error processing message: {str(e)}")
            return ProtocolMessage(
                MessageType.ERROR,
                "",
                error={"code": -32603, "message": "Internal error"},
            )

    async def route_message(
        self, message: ProtocolMessage
    ) -> Optional[ProtocolMessage]:
        """Route message to appropriate handler."""
        if message.method in self.message_handlers:
            handler = self.message_handlers[message.method]
            try:
                result = await handler(message)
                if message.message_type == MessageType.REQUEST:
                    return ProtocolMessage(
                        MessageType.RESPONSE,
                        "",
                        message_id=message.id,
                        result=result,
                    )
                return None
            except Exception as e:
                logger.error(
                    f"Handler error for method {message.method}: {str(e)}"
                )
                return ProtocolMessage(
                    MessageType.ERROR,
                    "",
                    message_id=message.id,
                    error={"code": -32603, "message": str(e)},
                )
        else:
            return ProtocolMessage(
                MessageType.ERROR,
                "",
                message_id=message.id,
                error={"code": -32601, "message": "Method not found"},
            )

    def register_connection(self, connection_id: UUID, connection: Any):
        """Register a new connection."""
        self.active_connections[connection_id] = connection
        logger.info(f"Registered connection: {connection_id}")

    def unregister_connection(self, connection_id: UUID):
        """Unregister a connection."""
        if connection_id in self.active_connections:
            del self.active_connections[connection_id]
            logger.info(f"Unregistered connection: {connection_id}")

    async def send_message(
        self, connection_id: UUID, message: ProtocolMessage
    ) -> bool:
        """Send a message to a specific connection."""
        if connection_id not in self.active_connections:
            logger.error(f"Connection {connection_id} not found")
            return False

        try:
            connection = self.active_connections[connection_id]
            data = json.dumps(message.to_dict())
            await connection.send_text(data)
            return True
        except Exception as e:
            logger.error(
                f"Failed to send message to {connection_id}: {str(e)}"
            )
            return False
