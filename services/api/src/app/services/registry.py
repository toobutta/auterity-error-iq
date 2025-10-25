"""Service Registry - Central service discovery and status"""

from enum import Enum
from typing import Any, Dict, List

import aiohttp


class ServiceStatus(str, Enum):
    PRODUCTION = "production"
    STAGING = "staging"
    DEVELOPMENT = "development"
    DISABLED = "disabled"


SERVICE_REGISTRY = {
    "core": {
        "auth": {
            "status": ServiceStatus.PRODUCTION,
            "port": 8001,
            "health_endpoint": "/health",
            "description": "Authentication & authorization service",
        },
        "database": {
            "status": ServiceStatus.PRODUCTION,
            "port": 5432,
            "description": "PostgreSQL primary database",
        },
        "cache": {
            "status": ServiceStatus.PRODUCTION,
            "port": 6379,
            "description": "Redis caching service",
        },
        "queue": {
            "status": ServiceStatus.PRODUCTION,
            "port": 5672,
            "description": "RabbitMQ message queue",
        },
    },
    "communication": {
        "twilio": {
            "status": ServiceStatus.PRODUCTION,
            "endpoints": ["/api/sms", "/api/voice", "/api/campaigns"],
            "description": "SMS and voice communication via Twilio",
        },
        "whatsapp": {
            "status": ServiceStatus.PRODUCTION,
            "endpoints": ["/api/whatsapp/message", "/api/whatsapp/webhook"],
            "description": "WhatsApp Business API integration",
        },
        "email": {
            "status": ServiceStatus.PRODUCTION,
            "endpoints": ["/api/email/send", "/api/email/templates"],
            "description": "Email service integration",
        },
        "notifications": {
            "status": ServiceStatus.PRODUCTION,
            "channels": ["email", "slack", "sms", "whatsapp", "webhook"],
            "endpoints": ["/api/notifications"],
            "description": "Multi-channel notification system",
        },
    },
    "automation": {
        "playwright": {
            "status": ServiceStatus.PRODUCTION,
            "capabilities": ["web_scraping", "form_automation", "testing"],
            "endpoints": ["/api/scrape", "/api/automate"],
            "description": "Browser automation with Playwright",
        },
        "puppeteer": {
            "status": ServiceStatus.PRODUCTION,
            "capabilities": ["web_scraping", "pdf_generation"],
            "endpoints": ["/api/puppeteer"],
            "description": "Alternative browser automation",
        },
        "workflow": {
            "status": ServiceStatus.PRODUCTION,
            "engines": ["celery", "workflow_engine"],
            "endpoints": ["/api/workflows", "/api/executions"],
            "description": "Workflow execution and management",
        },
    },
    "ai": {
        "vector": {
            "status": ServiceStatus.PRODUCTION,
            "providers": ["pinecone", "weaviate"],
            "endpoints": ["/api/vectors/store", "/api/vectors/query"],
            "description": "Vector database services",
        },
        "llm": {
            "status": ServiceStatus.PRODUCTION,
            "providers": ["openai", "anthropic", "azure_openai"],
            "endpoints": ["/api/llm/completion", "/api/llm/embedding"],
            "description": "Large Language Model integrations",
        },
        "mlflow": {
            "status": ServiceStatus.PRODUCTION,
            "port": 5000,
            "tracking": True,
            "endpoints": ["/api/mlflow"],
            "description": "ML experiment tracking and model registry",
        },
    },
    "infrastructure": {
        "monitoring": {
            "status": ServiceStatus.PRODUCTION,
            "services": ["prometheus", "grafana", "jaeger"],
            "ports": {"prometheus": 9090, "grafana": 3000, "jaeger": 16686},
            "description": "Monitoring and observability stack",
        },
        "security": {
            "status": ServiceStatus.PRODUCTION,
            "services": ["vault"],
            "port": 8200,
            "description": "HashiCorp Vault for secrets management",
        },
        "gateway": {
            "status": ServiceStatus.PRODUCTION,
            "service": "kong",
            "ports": {"proxy": 8000, "admin": 8001},
            "description": "Kong API Gateway",
        },
        "logging": {
            "status": ServiceStatus.PRODUCTION,
            "services": ["loki", "promtail"],
            "port": 3100,
            "description": "Centralized logging with Loki",
        },
    },
    "integrations": {
        "kafka": {
            "status": ServiceStatus.PRODUCTION,
            "port": 9092,
            "topics": ["workflow-events", "error-events", "notifications"],
            "description": "Apache Kafka event streaming",
        },
        "storage": {
            "status": ServiceStatus.PRODUCTION,
            "providers": ["local", "s3"],
            "endpoints": ["/api/storage"],
            "description": "File storage service",
        },
    },
}


class ServiceRegistry:
    def __init__(self):
        self.registry = SERVICE_REGISTRY

    def get_all_services(self) -> Dict[str, Any]:
        """Get complete service registry"""
        return self.registry

    def get_services_by_category(self, category: str) -> Dict[str, Any]:
        """Get services by category"""
        return self.registry.get(category, {})

    def get_service(self, category: str, service: str) -> Dict[str, Any]:
        """Get specific service details"""
        return self.registry.get(category, {}).get(service, {})

    def get_production_services(self) -> Dict[str, Any]:
        """Get only production-ready services"""
        production_services = {}
        for category, services in self.registry.items():
            production_services[category] = {
                name: details
                for name, details in services.items()
                if details.get("status") == ServiceStatus.PRODUCTION
            }
        return production_services

    def get_service_endpoints(self) -> List[str]:
        """Get all API endpoints"""
        endpoints = []
        for category, services in self.registry.items():
            for service, details in services.items():
                if "endpoints" in details:
                    endpoints.extend(details["endpoints"])
        return endpoints

    async def health_check_all(self) -> Dict[str, Any]:
        """Perform health checks on all services"""
        health_status = {}

        for category, services in self.registry.items():
            health_status[category] = {}
            for service, details in services.items():
                if details.get("status") == ServiceStatus.PRODUCTION:
                    health_status[category][
                        service
                    ] = await self._check_service_health(service, details)

        return health_status

    async def _check_service_health(
        self, service: str, details: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Check health of individual service"""
        try:
            if "port" in details and "health_endpoint" in details:
                url = f"http://localhost:{details['port']}{details['health_endpoint']}"
                async with aiohttp.ClientSession() as session:
                    async with session.get(url, timeout=5) as response:
                        return {
                            "status": (
                                "healthy"
                                if response.status == 200
                                else "unhealthy"
                            ),
                            "response_time": response.headers.get(
                                "X-Response-Time", "unknown"
                            ),
                            "last_check": "now",
                        }
            else:
                return {"status": "unknown", "reason": "no health endpoint"}
        except Exception as e:
            return {"status": "unhealthy", "error": str(e)}


# Global registry instance
service_registry = ServiceRegistry()
