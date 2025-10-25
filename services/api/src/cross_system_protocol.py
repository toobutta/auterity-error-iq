"""
Cross-System Communication Protocol Implementation
Advanced messaging patterns with reliability and observability
"""

import asyncio
import time
from dataclasses import dataclass
from enum import Enum
from typing import Any, Dict, List, Optional, Protocol


class MessageType(Enum):
    COMMAND = "command"
    EVENT = "event"
    QUERY = "query"
    RESPONSE = "response"


class DeliveryGuarantee(Enum):
    AT_MOST_ONCE = "at_most_once"
    AT_LEAST_ONCE = "at_least_once"
    EXACTLY_ONCE = "exactly_once"


@dataclass
class Message:
    """Advanced message structure with metadata"""

    id: str
    type: MessageType
    source_system: str
    target_system: str
    payload: Dict[str, Any]
    headers: Dict[str, str]
    timestamp: float
    ttl: Optional[int] = None
    correlation_id: Optional[str] = None
    reply_to: Optional[str] = None
    delivery_guarantee: DeliveryGuarantee = DeliveryGuarantee.AT_LEAST_ONCE


class MessageHandler(Protocol):
    """Protocol for message handlers"""

    async def handle(self, message: Message) -> Optional[Message]:
        """Handle incoming message and optionally return response"""
        ...


class MessageBroker:
    """Advanced message broker with multiple delivery guarantees"""

    def __init__(self):
        self.subscribers: Dict[str, List[MessageHandler]] = {}
        self.message_store: Dict[str, Message] = {}
        self.delivery_receipts: Dict[str, bool] = {}
        self.dead_letter_queue: List[Message] = []

    async def publish(self, message: Message) -> bool:
        """Publish message with delivery guarantees"""
        # Store message for reliability
        self.message_store[message.id] = message

        # Check TTL
        if message.ttl and (time.time() - message.timestamp) > message.ttl:
            self.dead_letter_queue.append(message)
            return False

        # Route to subscribers
        target_key = f"{message.target_system}.{message.type.value}"
        wildcard_key = f"*.{message.type.value}"

        handlers = []
        handlers.extend(self.subscribers.get(target_key, []))
        handlers.extend(self.subscribers.get(wildcard_key, []))

        if not handlers:
            # No handlers available, move to DLQ
            self.dead_letter_queue.append(message)
            return False

        # Deliver based on guarantee
        if message.delivery_guarantee == DeliveryGuarantee.AT_MOST_ONCE:
            return await self._deliver_at_most_once(message, handlers)
        elif message.delivery_guarantee == DeliveryGuarantee.AT_LEAST_ONCE:
            return await self._deliver_at_least_once(message, handlers)
        else:  # EXACTLY_ONCE
            return await self._deliver_exactly_once(message, handlers)

    async def subscribe(self, pattern: str, handler: MessageHandler):
        """Subscribe to messages with pattern matching"""
        if pattern not in self.subscribers:
            self.subscribers[pattern] = []
        self.subscribers[pattern].append(handler)

    async def _deliver_at_most_once(
        self, message: Message, handlers: List[MessageHandler]
    ) -> bool:
        """Deliver message at most once (fire and forget)"""
        try:
            for handler in handlers:
                asyncio.create_task(handler.handle(message))
            return True
        except Exception:
            return False

    async def _deliver_at_least_once(
        self, message: Message, handlers: List[MessageHandler]
    ) -> bool:
        """Deliver message at least once (with retries)"""
        max_retries = 3
        for attempt in range(max_retries):
            try:
                for handler in handlers:
                    await handler.handle(message)
                return True
            except Exception:
                if attempt == max_retries - 1:
                    self.dead_letter_queue.append(message)
                    return False
                await asyncio.sleep(2**attempt)  # Exponential backoff
        return False

    async def _deliver_exactly_once(
        self, message: Message, handlers: List[MessageHandler]
    ) -> bool:
        """Deliver message exactly once (with deduplication)"""
        if message.id in self.delivery_receipts:
            return True  # Already delivered

        success = await self._deliver_at_least_once(message, handlers)
        if success:
            self.delivery_receipts[message.id] = True
        return success


class SystemConnector:
    """Connector for external system integration"""

    def __init__(self, system_id: str, broker: MessageBroker):
        self.system_id = system_id
        self.broker = broker
        self.handlers: Dict[str, MessageHandler] = {}

    async def send_command(
        self, target_system: str, command: str, payload: Dict[str, Any]
    ) -> Optional[Message]:
        """Send command to target system"""
        message = Message(
            id=f"cmd-{int(time.time() * 1000000)}",
            type=MessageType.COMMAND,
            source_system=self.system_id,
            target_system=target_system,
            payload={"command": command, "data": payload},
            headers={"sender": self.system_id},
            timestamp=time.time(),
            delivery_guarantee=DeliveryGuarantee.AT_LEAST_ONCE,
        )

        await self.broker.publish(message)
        return message

    async def publish_event(self, event_type: str, payload: Dict[str, Any]):
        """Publish domain event"""
        message = Message(
            id=f"evt-{int(time.time() * 1000000)}",
            type=MessageType.EVENT,
            source_system=self.system_id,
            target_system="*",  # Broadcast
            payload={"event_type": event_type, "data": payload},
            headers={"publisher": self.system_id},
            timestamp=time.time(),
            delivery_guarantee=DeliveryGuarantee.AT_LEAST_ONCE,
        )

        await self.broker.publish(message)

    async def query(
        self, target_system: str, query: str, parameters: Dict[str, Any]
    ) -> Optional[Message]:
        """Send query and wait for response"""
        correlation_id = f"query-{int(time.time() * 1000000)}"

        message = Message(
            id=f"qry-{int(time.time() * 1000000)}",
            type=MessageType.QUERY,
            source_system=self.system_id,
            target_system=target_system,
            payload={"query": query, "parameters": parameters},
            headers={"sender": self.system_id},
            timestamp=time.time(),
            correlation_id=correlation_id,
            reply_to=self.system_id,
            delivery_guarantee=DeliveryGuarantee.EXACTLY_ONCE,
        )

        # Set up response handler
        response_future = asyncio.Future()

        class ResponseHandler:
            async def handle(self, response_msg: Message) -> Optional[Message]:
                if (
                    response_msg.correlation_id == correlation_id
                    and response_msg.type == MessageType.RESPONSE
                ):
                    response_future.set_result(response_msg)
                return None

        response_handler = ResponseHandler()
        await self.broker.subscribe(
            f"{self.system_id}.response", response_handler
        )

        await self.broker.publish(message)

        try:
            response = await asyncio.wait_for(response_future, timeout=10.0)
            return response
        except asyncio.TimeoutError:
            return None

    def register_handler(self, message_pattern: str, handler: MessageHandler):
        """Register message handler for this system"""
        self.broker.subscribe(message_pattern, handler)


class DistributedTracing:
    """Distributed tracing for cross-system communication"""

    def __init__(self):
        self.traces: Dict[str, List[Dict[str, Any]]] = {}

    def start_trace(self, operation: str) -> str:
        """Start a new trace"""
        trace_id = f"trace-{int(time.time() * 1000000)}"
        self.traces[trace_id] = [
            {
                "operation": operation,
                "start_time": time.time(),
                "system": "coordinator",
            }
        ]
        return trace_id

    def add_span(
        self, trace_id: str, system: str, operation: str, duration: float
    ):
        """Add span to existing trace"""
        if trace_id in self.traces:
            self.traces[trace_id].append(
                {
                    "system": system,
                    "operation": operation,
                    "duration": duration,
                    "timestamp": time.time(),
                }
            )

    def get_trace(self, trace_id: str) -> List[Dict[str, Any]]:
        """Get complete trace"""
        return self.traces.get(trace_id, [])


# Protocol implementation showcase
class OrderServiceHandler:
    """Example handler for order service"""

    def __init__(self, system_id: str):
        self.system_id = system_id

    async def handle(self, message: Message) -> Optional[Message]:
        """Handle order-related messages"""
        payload = message.payload

        if message.type == MessageType.COMMAND:
            command = payload.get("command")
            if command == "create_order":
                # Process order creation
                order_id = f"order-{int(time.time())}"
                print(f"Order created: {order_id}")

                # Return acknowledgment
                return Message(
                    id=f"ack-{int(time.time() * 1000000)}",
                    type=MessageType.RESPONSE,
                    source_system=self.system_id,
                    target_system=message.source_system,
                    payload={"order_id": order_id, "status": "created"},
                    headers={"responder": self.system_id},
                    timestamp=time.time(),
                    correlation_id=message.correlation_id,
                )

        elif message.type == MessageType.QUERY:
            query = payload.get("query")
            if query == "get_order_status":
                order_id = payload.get("parameters", {}).get("order_id")

                return Message(
                    id=f"resp-{int(time.time() * 1000000)}",
                    type=MessageType.RESPONSE,
                    source_system=self.system_id,
                    target_system=message.source_system,
                    payload={"order_id": order_id, "status": "processing"},
                    headers={"responder": self.system_id},
                    timestamp=time.time(),
                    correlation_id=message.correlation_id,
                )

        return None


# Demonstration
async def demonstrate_cross_system_communication():
    """Demonstrate advanced cross-system communication"""

    # Initialize broker and tracing
    broker = MessageBroker()
    tracing = DistributedTracing()

    # Create system connectors
    api_gateway = SystemConnector("api_gateway", broker)
    order_service = SystemConnector("order_service", broker)

    # Register handlers
    order_handler = OrderServiceHandler("order_service")
    await broker.subscribe("order_service.command", order_handler)
    await broker.subscribe("order_service.query", order_handler)

    # Start trace
    trace_id = tracing.start_trace("create_order_flow")

    # Send command
    start_time = time.time()
    _ = await api_gateway.send_command(
        "order_service",
        "create_order",
        {
            "customer_id": "cust-123",
            "items": [{"product_id": "prod-456", "quantity": 2}],
        },
    )

    # Simulate processing time
    await asyncio.sleep(0.1)
    tracing.add_span(
        trace_id, "api_gateway", "send_command", time.time() - start_time
    )

    # Query order status
    start_time = time.time()
    response = await api_gateway.query(
        "order_service", "get_order_status", {"order_id": "order-123"}
    )

    tracing.add_span(
        trace_id, "api_gateway", "query_status", time.time() - start_time
    )

    if response:
        print(f"Query response: {response.payload}")

    # Publish event
    await order_service.publish_event(
        "order_status_changed",
        {"order_id": "order-123", "new_status": "shipped"},
    )

    # Show trace
    trace = tracing.get_trace(trace_id)
    print(f"Distributed trace: {trace}")

    # Show broker metrics
    print(f"Messages in DLQ: {len(broker.dead_letter_queue)}")
    print(f"Delivery receipts: {len(broker.delivery_receipts)}")


if __name__ == "__main__":
    asyncio.run(demonstrate_cross_system_communication())
