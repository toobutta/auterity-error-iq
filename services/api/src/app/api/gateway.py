"""Unified API Gateway for service orchestration."""

from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
import asyncio
import aiohttp
import json
import hashlib
from dataclasses import dataclass
from enum import Enum

from fastapi import APIRouter, Depends, HTTPException, Request, Response
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
import redis

from app.auth import get_current_active_user
from app.database import get_db
from app.models.user import User
from app.middleware.logging import get_logger
from app.services.service_discovery import ServiceDiscovery, ServiceInstance, ServiceStatus, get_service_discovery

logger = get_logger(__name__)
router = APIRouter(prefix="/gateway", tags=["gateway"])


class ServiceType(Enum):
    WORKFLOW_STUDIO = "workflow-studio"
    RELAY_CORE = "relay-core"
    NEURO_WEAVER = "neuro-weaver"
    ERROR_IQ = "error-iq"
    ANALYTICS = "analytics"


class RequestMethod(Enum):
    GET = "GET"
    POST = "POST"
    PUT = "PUT"
    DELETE = "DELETE"
    PATCH = "PATCH"
    OPTIONS = "OPTIONS"


@dataclass
class ServiceEndpoint:
    """Service endpoint configuration."""
    service: ServiceType
    base_url: str
    health_check_endpoint: str
    timeout: int = 30
    retries: int = 3
    rate_limit: int = 1000  # requests per minute
    circuit_breaker_threshold: int = 5
    circuit_breaker_timeout: int = 60  # seconds


@dataclass
class RouteConfig:
    """API route configuration."""
    path: str
    methods: List[RequestMethod]
    service: ServiceType
    requires_auth: bool = True
    cache_enabled: bool = False
    cache_ttl: int = 300  # seconds
    rate_limit_enabled: bool = True
    circuit_breaker_enabled: bool = True


class CircuitBreakerState(Enum):
    CLOSED = "closed"
    OPEN = "open"
    HALF_OPEN = "half_open"


@dataclass
class CircuitBreaker:
    """Circuit breaker for service resilience."""
    state: CircuitBreakerState = CircuitBreakerState.CLOSED
    failure_count: int = 0
    last_failure_time: Optional[datetime] = None
    success_count: int = 0

    def record_success(self):
        """Record successful request."""
        self.success_count += 1
        if self.state == CircuitBreakerState.HALF_OPEN and self.success_count >= 3:
            self.state = CircuitBreakerState.CLOSED
            self.failure_count = 0
            self.success_count = 0
            logger.info("Circuit breaker closed")

    def record_failure(self):
        """Record failed request."""
        self.failure_count += 1
        self.last_failure_time = datetime.utcnow()

        if self.failure_count >= 5:  # threshold
            self.state = CircuitBreakerState.OPEN
            logger.warning(f"Circuit breaker opened after {self.failure_count} failures")

    def can_attempt(self) -> bool:
        """Check if request can be attempted."""
        if self.state == CircuitBreakerState.CLOSED:
            return True
        elif self.state == CircuitBreakerState.OPEN:
            if self.last_failure_time and \
               (datetime.utcnow() - self.last_failure_time).seconds > 60:  # timeout
                self.state = CircuitBreakerState.HALF_OPEN
                self.success_count = 0
                return True
            return False
        elif self.state == CircuitBreakerState.HALF_OPEN:
            return True
        return False


class UnifiedAPIGateway:
    """Unified API Gateway for service orchestration."""

    def __init__(self, service_discovery: ServiceDiscovery):
        self.service_discovery = service_discovery
        self.services = self._configure_services()
        self.routes = self._configure_routes()
        self.circuit_breakers: Dict[ServiceType, CircuitBreaker] = {}
        self.redis_client = redis.Redis(host='localhost', port=6379, db=1, decode_responses=True)
        self.session_timeout = aiohttp.ClientTimeout(total=30)

        # Initialize circuit breakers
        for service in self.services.keys():
            self.circuit_breakers[service] = CircuitBreaker()

    def _configure_services(self) -> Dict[ServiceType, ServiceEndpoint]:
        """Configure service endpoints."""
        return {
            ServiceType.WORKFLOW_STUDIO: ServiceEndpoint(
                service=ServiceType.WORKFLOW_STUDIO,
                base_url="http://localhost:3001",
                health_check_endpoint="/health",
                timeout=30,
                retries=3,
                rate_limit=1000
            ),
            ServiceType.RELAY_CORE: ServiceEndpoint(
                service=ServiceType.RELAY_CORE,
                base_url="http://localhost:8001",
                health_check_endpoint="/health",
                timeout=45,
                retries=2,
                rate_limit=500
            ),
            ServiceType.NEURO_WEAVER: ServiceEndpoint(
                service=ServiceType.NEURO_WEAVER,
                base_url="http://localhost:8003",
                health_check_endpoint="/health",
                timeout=60,
                retries=2,
                rate_limit=200
            ),
            ServiceType.ERROR_IQ: ServiceEndpoint(
                service=ServiceType.ERROR_IQ,
                base_url="http://localhost:3000",
                health_check_endpoint="/health",
                timeout=30,
                retries=3,
                rate_limit=2000
            ),
            ServiceType.ANALYTICS: ServiceEndpoint(
                service=ServiceType.ANALYTICS,
                base_url="http://localhost:3002",
                health_check_endpoint="/health",
                timeout=30,
                retries=3,
                rate_limit=1500
            )
        }

    def _configure_routes(self) -> List[RouteConfig]:
        """Configure API routes and their target services."""
        return [
            # Workflow Studio routes
            RouteConfig(
                path="/api/workflows",
                methods=[RequestMethod.GET, RequestMethod.POST],
                service=ServiceType.WORKFLOW_STUDIO
            ),
            RouteConfig(
                path="/api/workflows/{workflow_id}",
                methods=[RequestMethod.GET, RequestMethod.PUT, RequestMethod.DELETE],
                service=ServiceType.WORKFLOW_STUDIO
            ),
            RouteConfig(
                path="/api/workflows/{workflow_id}/execute",
                methods=[RequestMethod.POST],
                service=ServiceType.WORKFLOW_STUDIO
            ),

            # RelayCore routes
            RouteConfig(
                path="/api/ai/chat",
                methods=[RequestMethod.POST],
                service=ServiceType.RELAY_CORE
            ),
            RouteConfig(
                path="/api/ai/models",
                methods=[RequestMethod.GET],
                service=ServiceType.RELAY_CORE
            ),
            RouteConfig(
                path="/api/ai/embeddings",
                methods=[RequestMethod.POST],
                service=ServiceType.RELAY_CORE
            ),

            # NeuroWeaver routes
            RouteConfig(
                path="/api/ml/models",
                methods=[RequestMethod.GET, RequestMethod.POST],
                service=ServiceType.NEURO_WEAVER
            ),
            RouteConfig(
                path="/api/ml/train",
                methods=[RequestMethod.POST],
                service=ServiceType.NEURO_WEAVER
            ),
            RouteConfig(
                path="/api/ml/predict",
                methods=[RequestMethod.POST],
                service=ServiceType.NEURO_WEAVER
            ),

            # Analytics routes
            RouteConfig(
                path="/api/analytics/dashboard",
                methods=[RequestMethod.GET],
                service=ServiceType.ANALYTICS
            ),
            RouteConfig(
                path="/api/analytics/reports",
                methods=[RequestMethod.GET, RequestMethod.POST],
                service=ServiceType.ANALYTICS
            ),

            # Cross-system routes (internal use)
            RouteConfig(
                path="/api/gateway/health",
                methods=[RequestMethod.GET],
                service=ServiceType.ERROR_IQ,
                requires_auth=False
            ),
            RouteConfig(
                path="/api/gateway/routes",
                methods=[RequestMethod.GET],
                service=ServiceType.ERROR_IQ,
                requires_auth=True
            )
        ]

    def _get_cache_key(self, method: str, path: str, query_params: Dict[str, Any]) -> str:
        """Generate cache key for request."""
        content = f"{method}:{path}:{json.dumps(query_params, sort_keys=True)}"
        return f"gateway:cache:{hashlib.md5(content.encode()).hexdigest()}"

    def _get_rate_limit_key(self, user_id: str, service: ServiceType) -> str:
        """Generate rate limit key."""
        return f"gateway:ratelimit:{user_id}:{service.value}"

    async def _check_rate_limit(self, user_id: str, service: ServiceType) -> bool:
        """Check if user has exceeded rate limit for service."""
        key = self._get_rate_limit_key(user_id, service)
        current_count = int(self.redis_client.get(key) or 0)

        service_config = self.services[service]
        if current_count >= service_config.rate_limit:
            return False

        # Increment counter with 1-minute expiry
        self.redis_client.incr(key)
        self.redis_client.expire(key, 60)
        return True

    async def _forward_request(
        self,
        service: ServiceType,
        path: str,
        method: str,
        headers: Dict[str, str],
        query_params: Dict[str, Any],
        body: Optional[bytes] = None,
        timeout: Optional[int] = None
    ) -> Dict[str, Any]:
        """Forward request to target service."""

        circuit_breaker = self.circuit_breakers[service]

        # Check circuit breaker
        if not circuit_breaker.can_attempt():
            raise HTTPException(
                status_code=503,
                detail=f"Service {service.value} is currently unavailable"
            )

        # Get healthy service instances from service discovery
        healthy_instances = self.service_discovery.get_healthy_instances(service.value)

        if not healthy_instances:
            # Fallback to static configuration
            service_config = self.services.get(service)
            if not service_config:
                raise HTTPException(
                    status_code=503,
                    detail=f"No available instances for service {service.value}"
                )
            target_url = f"{service_config.base_url}{path}"
        else:
            # Use service discovery instance (load balancing - round robin)
            instance = healthy_instances[0]  # TODO: Implement proper load balancing
            target_url = f"{instance.base_url}{path}"

        if query_params:
            from urllib.parse import urlencode
            target_url += f"?{urlencode(query_params)}"

        # Prepare request
        request_data = {
            "method": method,
            "url": target_url,
            "headers": {k: v for k, v in headers.items() if k.lower() not in ['host', 'content-length']},
            "timeout": aiohttp.ClientTimeout(total=timeout or service_config.timeout)
        }

        if body:
            request_data["data"] = body

        try:
            async with aiohttp.ClientSession(timeout=self.session_timeout) as session:
                async with session.request(**request_data) as response:
                    response_data = await response.read()
                    response_headers = dict(response.headers)

                    # Record success
                    circuit_breaker.record_success()

                    return {
                        "status_code": response.status,
                        "headers": response_headers,
                        "body": response_data,
                        "content_type": response_headers.get("content-type", "application/json")
                    }

        except Exception as e:
            # Record failure
            circuit_breaker.record_failure()
            logger.error(f"Request to {service.value} failed: {str(e)}")
            raise HTTPException(
                status_code=502,
                detail=f"Failed to communicate with {service.value}: {str(e)}"
            )

    async def route_request(
        self,
        path: str,
        method: str,
        headers: Dict[str, str],
        query_params: Dict[str, Any],
        body: Optional[bytes],
        user: Optional[User] = None,
        use_cache: bool = True,
        timeout: Optional[int] = None
    ) -> Dict[str, Any]:
        """Route request to appropriate service."""

        # Find matching route
        target_service = None
        route_config = None

        for route in self.routes:
            if self._matches_route(path, route.path) and RequestMethod(method) in route.methods:
                target_service = route.service
                route_config = route
                break

        if not target_service:
            raise HTTPException(status_code=404, detail="Route not found")

        # Check authentication
        if route_config and route_config.requires_auth and not user:
            raise HTTPException(status_code=401, detail="Authentication required")

        # Check rate limit
        if route_config and route_config.rate_limit_enabled and user:
            if not await self._check_rate_limit(str(user.id), target_service):
                raise HTTPException(status_code=429, detail="Rate limit exceeded")

        # Check cache
        cache_key = None
        if route_config and route_config.cache_enabled and use_cache and method == "GET":
            cache_key = self._get_cache_key(method, path, query_params)
            cached_response = self.redis_client.get(cache_key)
            if cached_response:
                return json.loads(cached_response)

        # Forward request
        response = await self._forward_request(
            target_service, path, method, headers, query_params, body, timeout
        )

        # Cache response
        if cache_key and route_config and route_config.cache_enabled:
            self.redis_client.setex(
                cache_key,
                route_config.cache_ttl,
                json.dumps(response)
            )

        return response

    def _matches_route(self, request_path: str, route_pattern: str) -> bool:
        """Check if request path matches route pattern."""
        # Simple pattern matching - can be enhanced with regex
        if "{" in route_pattern:
            # Handle parameterized routes
            pattern_parts = route_pattern.split("/")
            request_parts = request_path.split("/")

            if len(pattern_parts) != len(request_parts):
                return False

            for pattern_part, request_part in zip(pattern_parts, request_parts):
                if pattern_part.startswith("{") and pattern_part.endswith("}"):
                    continue  # Parameter placeholder
                elif pattern_part != request_part:
                    return False

            return True

        return request_path.startswith(route_pattern) or route_pattern == request_path

    async def get_health_status(self) -> Dict[str, Any]:
        """Get comprehensive health status of all services."""
        health_status = {}

        # Get health status from service discovery
        discovery_health = self.service_discovery.get_all_services_health()

        for service_type, service_config in self.services.items():
            circuit_breaker = self.circuit_breakers[service_type]
            service_name = service_type.value

            # Get service discovery health info
            discovery_instances = discovery_health.get(service_name, [])

            # Check static service endpoint
            static_health = None
            try:
                async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=5)) as session:
                    async with session.get(f"{service_config.base_url}{service_config.health_check_endpoint}") as response:
                        static_health = {
                            "status": "healthy" if response.status == 200 else "unhealthy",
                            "response_time": None,
                            "last_check": datetime.utcnow().isoformat()
                        }
            except Exception as e:
                static_health = {
                    "status": "unhealthy",
                    "error": str(e),
                    "last_check": datetime.utcnow().isoformat()
                }

            # Combine service discovery and static health info
            health_status[service_name] = {
                "static_endpoint": static_health,
                "service_discovery": {
                    "instances": len(discovery_instances),
                    "healthy_instances": len([h for h in discovery_instances if h and h.status == ServiceStatus.HEALTHY]),
                    "details": [
                        {
                            "service_id": h.service_id if h else "unknown",
                            "status": h.status.value if h else "unknown",
                            "response_time": h.response_time if h else 0,
                            "uptime_percentage": h.uptime_percentage if h else 0,
                            "last_check": datetime.fromtimestamp(h.last_check).isoformat() if h else None
                        } for h in discovery_instances if h
                    ] if discovery_instances else []
                },
                "circuit_breaker": {
                    "state": circuit_breaker.state.value,
                    "failure_count": circuit_breaker.failure_count,
                    "last_failure": circuit_breaker.last_failure_time.isoformat() if circuit_breaker.last_failure_time else None
                },
                "configuration": {
                    "rate_limit": service_config.rate_limit,
                    "timeout": service_config.timeout,
                    "retries": service_config.retries
                }
            }

        return health_status

    def get_route_config(self) -> List[Dict[str, Any]]:
        """Get current route configuration."""
        return [
            {
                "path": route.path,
                "methods": [method.value for method in route.methods],
                "service": route.service.value,
                "requires_auth": route.requires_auth,
                "cache_enabled": route.cache_enabled,
                "rate_limit_enabled": route.rate_limit_enabled
            }
            for route in self.routes
        ]


# Global gateway instance (will be initialized with service discovery)
gateway: Optional[UnifiedAPIGateway] = None

async def get_gateway() -> UnifiedAPIGateway:
    """Get the unified API gateway instance."""
    global gateway
    if gateway is None:
        service_discovery = await get_service_discovery()
        gateway = UnifiedAPIGateway(service_discovery)
    return gateway


@router.api_route("/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"])
async def gateway_proxy(
    path: str,
    request: Request,
    current_user: User = Depends(get_current_active_user)
):
    """Unified API Gateway proxy endpoint."""

    # Extract request data
    method = request.method
    headers = dict(request.headers)
    query_params = dict(request.query_params)

    # Read body if present
    body = None
    if method in ["POST", "PUT", "PATCH"]:
        body = await request.body()

    try:
        # Get gateway instance
        gateway_instance = await get_gateway()

        # Route the request
        response_data = await gateway_instance.route_request(
            path=f"/{path}",
            method=method,
            headers=headers,
            query_params=query_params,
            body=body,
            user=current_user
        )

        # Create response
        response = Response(
            content=response_data["body"],
            status_code=response_data["status_code"],
            headers={k: v for k, v in response_data["headers"].items()
                    if k.lower() not in ['content-length', 'transfer-encoding']}
        )

        # Set content type
        if "content_type" in response_data:
            response.headers["content-type"] = response_data["content_type"]

        return response

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Gateway error: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal gateway error")


@router.get("/health")
async def get_gateway_health():
    """Get gateway and service health status."""
    try:
        gateway_instance = await get_gateway()
        health_status = await gateway_instance.get_health_status()
        return {
            "gateway": "healthy",
            "timestamp": datetime.utcnow().isoformat(),
            "services": health_status
        }
    except Exception as e:
        logger.error(f"Health check error: {str(e)}")
        return {
            "gateway": "unhealthy",
            "timestamp": datetime.utcnow().isoformat(),
            "error": str(e)
        }


@router.get("/routes")
async def get_routes(current_user: User = Depends(get_current_active_user)):
    """Get configured routes (admin only)."""
    # TODO: Add admin permission check
    gateway_instance = await get_gateway()
    return gateway_instance.get_route_config()


@router.get("/metrics")
async def get_gateway_metrics(current_user: User = Depends(get_current_active_user)):
    """Get gateway performance metrics."""
    # TODO: Add admin permission check
    gateway_instance = await get_gateway()
    return {
        "circuit_breakers": {
            service.value: {
                "state": cb.state.value,
                "failure_count": cb.failure_count,
                "success_count": cb.success_count,
                "last_failure": cb.last_failure_time.isoformat() if cb.last_failure_time else None
            }
            for service, cb in gateway_instance.circuit_breakers.items()
        },
        "service_discovery": gateway_instance.service_discovery.get_service_stats(),
        "timestamp": datetime.utcnow().isoformat()
    }
