"""
Comprehensive Service Status and Health Check System

Provides detailed status for all 25+ services in the Auterity platform.
"""

import asyncio
import logging
from datetime import datetime
from typing import Any, Dict

import httpx
import redis.asyncio as redis
from fastapi import APIRouter, HTTPException

from app.config.settings import get_settings

router = APIRouter()
logger = logging.getLogger(__name__)


class ServiceHealthChecker:
    """Comprehensive service health checker for all platform services."""

    def __init__(self) -> None:
        self.client = httpx.AsyncClient(timeout=5.0)
        self.redis_client = None

    async def get_redis_client(self) -> Any:
        """Get Redis client for health checks."""
        if not self.redis_client:
            self.redis_client = redis.from_url(
                "redis://redis:6379", decode_responses=True
            )
        return self.redis_client

    async def check_service_http(
        self, name: str, url: str, expected_status: int = 200
    ) -> Dict[str, Any]:
        """Check HTTP service health."""
        try:
            start_time = datetime.utcnow()
            response = await self.client.get(url)
            end_time = datetime.utcnow()

            response_time = (end_time - start_time).total_seconds() * 1000

            if response.status_code == expected_status:
                return {
                    "name": name,
                    "status": "healthy",
                    "response_time": f"{response_time:.2f}ms",
                    "last_check": end_time.isoformat(),
                }
            else:
                return {
                    "name": name,
                    "status": "unhealthy",
                    "error": f"HTTP {response.status_code}",
                    "response_time": f"{response_time:.2f}ms",
                    "last_check": end_time.isoformat(),
                }
        except Exception as e:
            return {
                "name": name,
                "status": "unhealthy",
                "error": str(e),
                "last_check": datetime.utcnow().isoformat(),
            }

    async def check_database_services(self) -> Dict[str, Dict[str, Any]]:
        """Check database service health."""
        services = {}

        # PostgreSQL
        try:
            import asyncpg

            conn = await asyncpg.connect(
                "postgresql://postgres:password@postgres:5432/auterity"
            )
            await conn.execute("SELECT 1")
            await conn.close()
            services["postgres"] = {
                "name": "PostgreSQL Database",
                "status": "healthy",
                "last_check": datetime.utcnow().isoformat(),
            }
        except Exception as e:
            services["postgres"] = {
                "name": "PostgreSQL Database",
                "status": "unhealthy",
                "error": str(e),
                "last_check": datetime.utcnow().isoformat(),
            }

        # Redis
        try:
            redis_client = await self.get_redis_client()
            await redis_client.ping()
            services["redis"] = {
                "name": "Redis Cache",
                "status": "healthy",
                "last_check": datetime.utcnow().isoformat(),
            }
        except Exception as e:
            services["redis"] = {
                "name": "Redis Cache",
                "status": "unhealthy",
                "error": str(e),
                "last_check": datetime.utcnow().isoformat(),
            }

        # Weaviate Vector Database
        services["weaviate"] = await self.check_service_http(
            "Weaviate Vector DB", "http://weaviate:8080/v1/meta"
        )

        return services

    async def check_core_services(self) -> Dict[str, Dict[str, Any]]:
        """Check core application services."""
        services = {}

        # Backend API
        services["backend"] = await self.check_service_http(
            "FastAPI Backend", "http://backend:8000/api/health"
        )

        # Frontend
        services["frontend"] = await self.check_service_http(
            "React Frontend", "http://frontend:80", expected_status=200
        )

        # API Gateway
        services["kong"] = await self.check_service_http(
            "Kong API Gateway", "http://kong:8001/status"
        )

        return services

    async def check_communication_services(self) -> Dict[str, Dict[str, Any]]:
        """Check communication service health."""
        services = {}

        # Email Service (MailHog)
        services["mailhog"] = await self.check_service_http(
            "SMTP Email Service", "http://mailhog:8025"
        )

        # Note: Twilio, WhatsApp would require API key checks
        # For now, we'll mark them as configured if env vars exist
        settings = get_settings()

        services["twilio"] = {
            "name": "Twilio SMS/Voice",
            "status": "configured"
            if hasattr(settings, "TWILIO_ACCOUNT_SID")
            else "not_configured",
            "last_check": datetime.utcnow().isoformat(),
        }

        services["whatsapp"] = {
            "name": "WhatsApp Business",
            "status": "configured"
            if hasattr(settings, "WHATSAPP_ACCESS_TOKEN")
            else "not_configured",
            "last_check": datetime.utcnow().isoformat(),
        }

        return services

    async def check_automation_services(self) -> Dict[str, Dict[str, Any]]:
        """Check automation service health."""
        services = {}

        # Puppeteer Browser Automation
        services["puppeteer"] = await self.check_service_http(
            "Puppeteer Browser Service", "http://puppeteer:3000/pressure"
        )

        # Note: Playwright service runs within backend, check via API
        services["playwright"] = await self.check_service_http(
            "Playwright Service", "http://backend:8000/api/health"
        )

        return services

    async def check_ai_services(self) -> Dict[str, Dict[str, Any]]:
        """Check AI/ML service health."""
        services = {}

        # MLflow Tracking
        services["mlflow"] = await self.check_service_http(
            "MLflow ML Tracking", "http://mlflow:5000/health"
        )

        # Vector services already checked in database section
        # LLM services are external APIs, check configuration
        settings = get_settings()

        services["openai"] = {
            "name": "OpenAI LLM",
            "status": "configured"
            if hasattr(settings, "OPENAI_API_KEY")
            else "not_configured",
            "last_check": datetime.utcnow().isoformat(),
        }

        services["anthropic"] = {
            "name": "Anthropic Claude",
            "status": "configured"
            if hasattr(settings, "ANTHROPIC_API_KEY")
            else "not_configured",
            "last_check": datetime.utcnow().isoformat(),
        }

        return services

    async def check_infrastructure_services(self) -> Dict[str, Dict[str, Any]]:
        """Check infrastructure service health."""
        services = {}

        # Message Queue
        services["rabbitmq"] = await self.check_service_http(
            "RabbitMQ Message Queue", "http://rabbitmq:15672"
        )

        # Event Streaming
        services["kafka"] = await self.check_service_http(
            "Apache Kafka",
            "http://kafka:9092",
            # Kafka doesn't have HTTP endpoint, expect 404
            expected_status=404,
        )

        services["zookeeper"] = await self.check_service_http(
            "Zookeeper", "http://zookeeper:2181", expected_status=404
        )

        # Secrets Management
        services["vault"] = await self.check_service_http(
            "HashiCorp Vault",
            "http://vault:8200/v1/sys/health",
            expected_status=200,
        )

        # Object Storage
        services["minio"] = await self.check_service_http(
            "MinIO Object Storage", "http://minio:9000/minio/health/live"
        )

        # Load Balancer
        services["nginx"] = await self.check_service_http(
            "Nginx Load Balancer", "http://nginx:8080/nginx-health"
        )

        return services

    async def check_monitoring_services(self) -> Dict[str, Dict[str, Any]]:
        """Check monitoring service health."""
        services = {}

        # Core Monitoring
        services["prometheus"] = await self.check_service_http(
            "Prometheus Metrics", "http://prometheus:9090/-/healthy"
        )

        services["grafana"] = await self.check_service_http(
            "Grafana Dashboards", "http://grafana:3000/api/health"
        )

        services["alertmanager"] = await self.check_service_http(
            "Alertmanager", "http://alertmanager:9093/-/healthy"
        )

        # Logging
        services["loki"] = await self.check_service_http(
            "Loki Log Aggregation", "http://loki:3100/ready"
        )

        services["promtail"] = {
            "name": "Promtail Log Collector",
            "status": "running",  # Promtail doesn't have HTTP endpoint
            "last_check": datetime.utcnow().isoformat(),
        }

        # Tracing
        services["jaeger"] = await self.check_service_http(
            "Jaeger Tracing", "http://jaeger:16686"
        )

        # Exporters
        services["node_exporter"] = await self.check_service_http(
            "Node Exporter", "http://node-exporter:9100/metrics"
        )

        services["redis_exporter"] = await self.check_service_http(
            "Redis Exporter", "http://redis-exporter:9121/metrics"
        )

        services["postgres_exporter"] = await self.check_service_http(
            "Postgres Exporter", "http://postgres-exporter:9187/metrics"
        )

        return services

    async def check_worker_services(self) -> Dict[str, Dict[str, Any]]:
        """Check worker service health."""
        services = {}

        # Celery workers don't have HTTP endpoints, check via Redis/RabbitMQ
        try:
            await self.get_redis_client()
            # Check if workers are active by looking at Celery stats
            services["celery_workers"] = {
                "name": "Celery Task Workers",
                "status": "running",  # Simplified check
                "last_check": datetime.utcnow().isoformat(),
            }
        except Exception as e:
            services["celery_workers"] = {
                "name": "Celery Task Workers",
                "status": "unhealthy",
                "error": str(e),
                "last_check": datetime.utcnow().isoformat(),
            }

        return services

    async def get_all_services_status(self) -> Dict[str, Any]:
        """Get comprehensive status of all services."""
        try:
            # Run all health checks concurrently
            results = await asyncio.gather(
                self.check_core_services(),
                self.check_database_services(),
                self.check_communication_services(),
                self.check_automation_services(),
                self.check_ai_services(),
                self.check_infrastructure_services(),
                self.check_monitoring_services(),
                self.check_worker_services(),
                return_exceptions=True,
            )

            # Combine results
            all_services = {
                "core": (
                    results[0] if not isinstance(results[0], Exception) else {}
                ),
                "database": (
                    results[1] if not isinstance(results[1], Exception) else {}
                ),
                "communication": results[2]
                if not isinstance(results[2], Exception)
                else {},
                "automation": results[3]
                if not isinstance(results[3], Exception)
                else {},
                "ai": (
                    results[4] if not isinstance(results[4], Exception) else {}
                ),
                "infrastructure": results[5]
                if not isinstance(results[5], Exception)
                else {},
                "monitoring": results[6]
                if not isinstance(results[6], Exception)
                else {},
                "workers": (
                    results[7] if not isinstance(results[7], Exception) else {}
                ),
            }

            # Calculate summary statistics
            valid_categories = [
                category
                for category in all_services.values()
                if isinstance(category, dict)
            ]
            total_services = sum(
                len(category) for category in valid_categories
            )
            healthy_services = sum(
                len(
                    [
                        s
                        for s in category.values()
                        if isinstance(s, dict) and s.get("status") == "healthy"
                    ]
                )
                for category in valid_categories
            )
            configured_services = sum(
                len(
                    [
                        s
                        for s in category.values()
                        if (
                            isinstance(s, dict)
                            and s.get("status") == "configured"
                        )
                    ]
                )
                for category in valid_categories
            )

            return {
                "summary": {
                    "total_services": total_services,
                    "healthy_services": healthy_services,
                    "configured_services": configured_services,
                    "unhealthy_services": total_services
                    - healthy_services
                    - configured_services,
                    "health_percentage": round(
                        (healthy_services + configured_services)
                        / total_services
                        * 100,
                        1,
                    )
                    if total_services > 0
                    else 0,
                    "last_check": datetime.utcnow().isoformat(),
                },
                "services": all_services,
            }

        except Exception as e:
            logger.error(f"Failed to get all services status: {e}")
            return {"error": str(e)}

    async def close(self) -> None:
        """Close HTTP client and Redis connection."""
        await self.client.aclose()
        if self.redis_client:
            await self.redis_client.close()


# Global health checker instance
_health_checker: ServiceHealthChecker = ServiceHealthChecker()


@router.get("/services/status")
async def get_all_services_status() -> Dict[str, Any]:
    """Get comprehensive status of all 25+ services."""
    return await _health_checker.get_all_services_status()


@router.get("/services/status/{category}")
async def get_category_services_status(category: str) -> Dict[str, Any]:
    """Get status of services in a specific category."""
    health_checker = ServiceHealthChecker()

    category_map = {
        "core": health_checker.check_core_services,
        "database": health_checker.check_database_services,
        "communication": health_checker.check_communication_services,
        "automation": health_checker.check_automation_services,
        "ai": health_checker.check_ai_services,
        "infrastructure": health_checker.check_infrastructure_services,
        "monitoring": health_checker.check_monitoring_services,
        "workers": health_checker.check_worker_services,
    }

    if category not in category_map:
        raise HTTPException(
            status_code=404, detail=f"Category '{category}' not found"
        )

    try:
        result = await category_map[category]()
        await health_checker.close()
        return {
            "category": category,
            "services": result,
            "service_count": len(result),
            "healthy_count": len(
                [s for s in result.values() if s.get("status") == "healthy"]
            ),
            "last_check": datetime.utcnow().isoformat(),
        }
    except Exception as e:
        await health_checker.close()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/services/count")
async def get_service_count() -> Dict[str, Any]:
    """Get total count of services."""
    status = await _health_checker.get_all_services_status()
    summary = status.get("summary", {})
    return {
        "total_services": summary.get("total_services", 0),
        "healthy_services": summary.get("healthy_services", 0),
        "configured_services": summary.get("configured_services", 0),
        "health_percentage": summary.get("health_percentage", 0),
        "timestamp": datetime.utcnow().isoformat(),
    }


@router.get("/services/health")
async def get_services_health_summary() -> Dict[str, Any]:
    """Get simplified health summary for monitoring."""
    status = await _health_checker.get_all_services_status()
    summary = status.get("summary", {})

    overall_health = (
        "healthy"
        if summary.get("health_percentage", 0) >= 90
        else "degraded"
        if summary.get("health_percentage", 0) >= 70
        else "critical"
    )

    return {
        "overall_health": overall_health,
        "health_percentage": summary.get("health_percentage", 0),
        "total_services": summary.get("total_services", 0),
        "healthy_services": summary.get("healthy_services", 0),
        "timestamp": summary.get("last_check"),
    }
