"""API Gateway service for external integrations."""

import hashlib
import hmac
from datetime import datetime
from typing import Any, Dict, List, Optional

import requests

from app.config.settings import get_settings


class APIGatewayService:
    """API Gateway service for managing external API integrations."""

    def __init__(self):
        """Initialize API Gateway service."""
        settings = get_settings()
        self.kong_admin_url = getattr(settings, "KONG_ADMIN_URL", "http://kong:8001")
        self.kong_proxy_url = getattr(settings, "KONG_PROXY_URL", "http://kong:8000")
        self.default_timeout = 30

    def create_service(
        self, name: str, url: str, protocol: str = "http", path: Optional[str] = None
    ) -> Dict[str, Any]:
        """Create a new service in Kong."""
        try:
            service_data = {"name": name, "url": url, "protocol": protocol}

            if path:
                service_data["path"] = path

            response = requests.post(
                f"{self.kong_admin_url}/services",
                json=service_data,
                timeout=self.default_timeout,
            )

            if response.status_code in [200, 201]:
                return {
                    "service": response.json(),
                    "status": "created",
                    "timestamp": datetime.utcnow().isoformat(),
                }
            else:
                return {
                    "error": f"Service creation failed: {response.status_code}",
                    "details": response.text,
                }
        except Exception as e:
            return {"error": str(e)}

    def create_route(
        self, service_name: str, paths: List[str], methods: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """Create a route for a service."""
        try:
            route_data = {"paths": paths, "service": {"name": service_name}}

            if methods:
                route_data["methods"] = methods

            response = requests.post(
                f"{self.kong_admin_url}/routes",
                json=route_data,
                timeout=self.default_timeout,
            )

            if response.status_code in [200, 201]:
                return {
                    "route": response.json(),
                    "status": "created",
                    "timestamp": datetime.utcnow().isoformat(),
                }
            else:
                return {
                    "error": f"Route creation failed: {response.status_code}",
                    "details": response.text,
                }
        except Exception as e:
            return {"error": str(e)}

    def add_authentication(
        self,
        service_name: str,
        auth_type: str = "key-auth",
        config: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """Add authentication plugin to service."""
        try:
            plugin_data = {"name": auth_type, "service": {"name": service_name}}

            if config:
                plugin_data["config"] = config

            response = requests.post(
                f"{self.kong_admin_url}/plugins",
                json=plugin_data,
                timeout=self.default_timeout,
            )

            if response.status_code in [200, 201]:
                return {
                    "plugin": response.json(),
                    "status": "added",
                    "timestamp": datetime.utcnow().isoformat(),
                }
            else:
                return {
                    "error": f"Authentication plugin failed: {response.status_code}",
                    "details": response.text,
                }
        except Exception as e:
            return {"error": str(e)}

    def add_rate_limiting(
        self,
        service_name: str,
        requests_per_minute: int = 100,
        requests_per_hour: int = 1000,
    ) -> Dict[str, Any]:
        """Add rate limiting to service."""
        try:
            plugin_data = {
                "name": "rate-limiting",
                "service": {"name": service_name},
                "config": {
                    "minute": requests_per_minute,
                    "hour": requests_per_hour,
                    "policy": "local",
                },
            }

            response = requests.post(
                f"{self.kong_admin_url}/plugins",
                json=plugin_data,
                timeout=self.default_timeout,
            )

            if response.status_code in [200, 201]:
                return {
                    "plugin": response.json(),
                    "status": "added",
                    "timestamp": datetime.utcnow().isoformat(),
                }
            else:
                return {
                    "error": f"Rate limiting plugin failed: {response.status_code}",
                    "details": response.text,
                }
        except Exception as e:
            return {"error": str(e)}

    def proxy_request(
        self,
        service_path: str,
        method: str = "GET",
        headers: Optional[Dict[str, str]] = None,
        data: Optional[Dict[str, Any]] = None,
        params: Optional[Dict[str, str]] = None,
    ) -> Dict[str, Any]:
        """Proxy request through Kong gateway."""
        try:
            url = f"{self.kong_proxy_url}{service_path}"

            response = requests.request(
                method=method,
                url=url,
                headers=headers,
                json=data,
                params=params,
                timeout=self.default_timeout,
            )

            return {
                "status_code": response.status_code,
                "headers": dict(response.headers),
                "content": response.text,
                "url": url,
                "method": method,
                "timestamp": datetime.utcnow().isoformat(),
            }
        except Exception as e:
            return {"error": str(e)}

    def setup_webhook_endpoint(
        self, webhook_name: str, target_url: str, secret_key: Optional[str] = None
    ) -> Dict[str, Any]:
        """Setup webhook endpoint with optional signature verification."""
        try:
            # Create service for webhook
            service_result = self.create_service(
                name=f"webhook-{webhook_name}", url=target_url
            )

            if "error" in service_result:
                return service_result

            # Create route for webhook
            route_result = self.create_route(
                service_name=f"webhook-{webhook_name}",
                paths=[f"/webhooks/{webhook_name}"],
                methods=["POST"],
            )

            if "error" in route_result:
                return route_result

            # Add signature verification if secret provided
            if secret_key:
                plugin_result = self.add_request_transformer(
                    service_name=f"webhook-{webhook_name}",
                    config={"add": {"headers": [f"X-Webhook-Secret:{secret_key}"]}},
                )

            return {
                "webhook_name": webhook_name,
                "endpoint": f"{self.kong_proxy_url}/webhooks/{webhook_name}",
                "target_url": target_url,
                "secret_configured": bool(secret_key),
                "status": "configured",
                "timestamp": datetime.utcnow().isoformat(),
            }
        except Exception as e:
            return {"error": str(e)}

    def add_request_transformer(
        self, service_name: str, config: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Add request transformer plugin."""
        try:
            plugin_data = {
                "name": "request-transformer",
                "service": {"name": service_name},
                "config": config,
            }

            response = requests.post(
                f"{self.kong_admin_url}/plugins",
                json=plugin_data,
                timeout=self.default_timeout,
            )

            if response.status_code in [200, 201]:
                return {
                    "plugin": response.json(),
                    "status": "added",
                    "timestamp": datetime.utcnow().isoformat(),
                }
            else:
                return {
                    "error": f"Request transformer failed: {response.status_code}",
                    "details": response.text,
                }
        except Exception as e:
            return {"error": str(e)}

    def get_service_metrics(self, service_name: str) -> Dict[str, Any]:
        """Get metrics for a service."""
        try:
            # Get service info
            response = requests.get(
                f"{self.kong_admin_url}/services/{service_name}",
                timeout=self.default_timeout,
            )

            if response.status_code == 200:
                service_info = response.json()

                # This would typically integrate with monitoring system
                # For now, return basic service info
                return {
                    "service_name": service_name,
                    "service_info": service_info,
                    "metrics": {
                        "requests_total": "N/A - Requires monitoring integration",
                        "response_time_avg": "N/A - Requires monitoring integration",
                        "error_rate": "N/A - Requires monitoring integration",
                    },
                    "timestamp": datetime.utcnow().isoformat(),
                }
            else:
                return {
                    "error": f"Service not found: {response.status_code}",
                    "details": response.text,
                }
        except Exception as e:
            return {"error": str(e)}

    def list_services(self) -> Dict[str, Any]:
        """List all configured services."""
        try:
            response = requests.get(
                f"{self.kong_admin_url}/services", timeout=self.default_timeout
            )

            if response.status_code == 200:
                services = response.json()
                return {
                    "services": services.get("data", []),
                    "total": len(services.get("data", [])),
                    "timestamp": datetime.utcnow().isoformat(),
                }
            else:
                return {
                    "error": f"Failed to list services: {response.status_code}",
                    "details": response.text,
                }
        except Exception as e:
            return {"error": str(e)}

    def verify_webhook_signature(
        self, payload: str, signature: str, secret: str, algorithm: str = "sha256"
    ) -> bool:
        """Verify webhook signature."""
        try:
            expected_signature = hmac.new(
                secret.encode(), payload.encode(), getattr(hashlib, algorithm)
            ).hexdigest()

            return hmac.compare_digest(signature, expected_signature)
        except Exception:
            return False


# Global API Gateway service instance
_api_gateway_service: Optional[APIGatewayService] = None


def get_api_gateway_service() -> APIGatewayService:
    """Get global API Gateway service instance."""
    global _api_gateway_service
    if _api_gateway_service is None:
        _api_gateway_service = APIGatewayService()
    return _api_gateway_service
