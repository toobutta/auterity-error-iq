#!/usr/bin/env python3
"""
Service Architecture Verification Script

Verifies that all 26 services are properly configured and deployed.
"""

import asyncio
import json
import subprocess
import sys
from datetime import datetime
from typing import Dict, List


class ServiceArchitectureVerifier:
    """Verifies the complete service architecture deployment."""

    def __init__(self):
        self.expected_services = [
            "kong",
            "nginx",
            "backend",
            "frontend",
            "postgres",
            "redis",
            "rabbitmq",
            "kafka",
            "zookeeper",
            "vault",
            "mlflow",
            "weaviate",
            "puppeteer",
            "mailhog",
            "celery-worker",
            "prometheus",
            "grafana",
            "alertmanager",
            "jaeger",
            "loki",
            "promtail",
            "node-exporter",
            "redis-exporter",
            "postgres-exporter",
            "minio",
        ]
        self.expected_count = 26

    def run_command(self, command: str) -> tuple:
        """Run shell command and return output."""
        try:
            result = subprocess.run(
                command, shell=True, capture_output=True, text=True, timeout=30
            )
            return result.returncode, result.stdout.strip(), result.stderr.strip()
        except subprocess.TimeoutExpired:
            return 1, "", "Command timed out"
        except Exception as e:
            return 1, "", str(e)

    def check_docker_compose_services(self) -> Dict:
        """Check services defined in docker-compose.unified.yml."""
        print("🔍 Checking docker-compose.unified.yml service definitions...")

        code, stdout, stderr = self.run_command(
            "docker-compose -f docker-compose.unified.yml config --services"
        )

        if code != 0:
            return {
                "status": "error",
                "error": f"Failed to read docker-compose config: {stderr}",
                "services": [],
            }

        services = stdout.split("\n") if stdout else []
        services = [s.strip() for s in services if s.strip()]

        # Filter out volume names that might be included
        actual_services = [s for s in services if not s.endswith("_data")]

        missing_services = set(self.expected_services) - set(actual_services)
        extra_services = set(actual_services) - set(self.expected_services)

        return {
            "status": "success" if len(missing_services) == 0 else "warning",
            "expected_count": self.expected_count,
            "actual_count": len(actual_services),
            "services": actual_services,
            "missing_services": list(missing_services),
            "extra_services": list(extra_services),
        }

    def check_running_containers(self) -> Dict:
        """Check actually running containers."""
        print("🐳 Checking running Docker containers...")

        code, stdout, stderr = self.run_command(
            "docker-compose -f docker-compose.unified.yml ps --format json"
        )

        if code != 0:
            return {
                "status": "error",
                "error": f"Failed to check running containers: {stderr}",
                "running_services": [],
            }

        try:
            if stdout:
                containers = [
                    json.loads(line) for line in stdout.split("\n") if line.strip()
                ]
                running_services = [
                    c.get("Service", "")
                    for c in containers
                    if c.get("State") == "running"
                ]

                return {
                    "status": "success",
                    "running_count": len(running_services),
                    "running_services": running_services,
                    "all_containers": containers,
                }
            else:
                return {
                    "status": "warning",
                    "running_count": 0,
                    "running_services": [],
                    "message": "No containers found",
                }
        except json.JSONDecodeError:
            # Fallback to simple ps command
            code, stdout, stderr = self.run_command(
                "docker-compose -f docker-compose.unified.yml ps --services --filter 'status=running'"
            )
            services = stdout.split("\n") if stdout else []
            services = [s.strip() for s in services if s.strip()]

            return {
                "status": "success",
                "running_count": len(services),
                "running_services": services,
            }

    def check_service_health(self) -> Dict:
        """Check service health endpoints."""
        print("🏥 Checking service health endpoints...")

        health_checks = [
            ("backend", "http://localhost:8080/api/health"),
            ("frontend", "http://localhost:3000"),
            ("grafana", "http://localhost:3001/api/health"),
            ("prometheus", "http://localhost:9090/-/healthy"),
            ("jaeger", "http://localhost:16686"),
            ("mailhog", "http://localhost:8025"),
            ("minio", "http://localhost:9001"),
        ]

        healthy_services = []
        unhealthy_services = []

        for service, url in health_checks:
            code, stdout, stderr = self.run_command(
                f"curl -s -o /dev/null -w '%{{http_code}}' {url}"
            )

            if code == 0 and stdout in ["200", "302"]:
                healthy_services.append(service)
            else:
                unhealthy_services.append(
                    {"service": service, "url": url, "error": stderr}
                )

        return {
            "status": "success" if len(unhealthy_services) == 0 else "warning",
            "healthy_count": len(healthy_services),
            "unhealthy_count": len(unhealthy_services),
            "healthy_services": healthy_services,
            "unhealthy_services": unhealthy_services,
        }

    def check_monitoring_stack(self) -> Dict:
        """Check monitoring stack completeness."""
        print("📊 Checking monitoring stack...")

        monitoring_services = [
            "prometheus",
            "grafana",
            "alertmanager",
            "jaeger",
            "loki",
            "promtail",
            "node-exporter",
            "redis-exporter",
            "postgres-exporter",
        ]

        # Check if monitoring config files exist
        config_files = [
            "monitoring/prometheus/prometheus.yml",
            "monitoring/grafana/datasources.yml",
            "monitoring/alertmanager/alertmanager.yml",
            "monitoring/loki/local-config.yaml",
            "monitoring/promtail/config.yml",
        ]

        existing_configs = []
        missing_configs = []

        for config in config_files:
            code, stdout, stderr = self.run_command(f"test -f {config}")
            if code == 0:
                existing_configs.append(config)
            else:
                missing_configs.append(config)

        return {
            "status": "success" if len(missing_configs) == 0 else "warning",
            "monitoring_services": monitoring_services,
            "existing_configs": existing_configs,
            "missing_configs": missing_configs,
            "config_completeness": len(existing_configs) / len(config_files) * 100,
        }

    def verify_architecture(self) -> Dict:
        """Run complete architecture verification."""
        print("🚀 Starting Service Architecture Verification")
        print("=" * 60)

        verification_start = datetime.utcnow()

        # Run all checks
        compose_check = self.check_docker_compose_services()
        container_check = self.check_running_containers()
        health_check = self.check_service_health()
        monitoring_check = self.check_monitoring_stack()

        verification_end = datetime.utcnow()
        duration = (verification_end - verification_start).total_seconds()

        # Calculate overall status
        all_checks = [compose_check, container_check, health_check, monitoring_check]
        error_checks = [c for c in all_checks if c.get("status") == "error"]
        warning_checks = [c for c in all_checks if c.get("status") == "warning"]

        if error_checks:
            overall_status = "error"
        elif warning_checks:
            overall_status = "warning"
        else:
            overall_status = "success"

        return {
            "verification_id": f"arch_verify_{int(verification_start.timestamp())}",
            "timestamp": verification_start.isoformat(),
            "duration_seconds": duration,
            "overall_status": overall_status,
            "checks": {
                "compose_services": compose_check,
                "running_containers": container_check,
                "service_health": health_check,
                "monitoring_stack": monitoring_check,
            },
            "summary": {
                "expected_services": self.expected_count,
                "defined_services": compose_check.get("actual_count", 0),
                "running_services": container_check.get("running_count", 0),
                "healthy_services": health_check.get("healthy_count", 0),
                "architecture_completeness": self.calculate_completeness(
                    compose_check, container_check
                ),
            },
        }

    def calculate_completeness(
        self, compose_check: Dict, container_check: Dict
    ) -> float:
        """Calculate architecture completeness percentage."""
        defined_ratio = compose_check.get("actual_count", 0) / self.expected_count
        running_ratio = container_check.get("running_count", 0) / self.expected_count

        # Weight: 60% defined services, 40% running services
        completeness = (defined_ratio * 0.6 + running_ratio * 0.4) * 100
        return round(completeness, 1)

    def print_verification_report(self, result: Dict):
        """Print formatted verification report."""
        print("\n" + "=" * 60)
        print("📋 SERVICE ARCHITECTURE VERIFICATION REPORT")
        print("=" * 60)

        # Overall Status
        status_emoji = {"success": "✅", "warning": "⚠️", "error": "❌"}

        print(
            f"\n🎯 Overall Status: {status_emoji.get(result['overall_status'], '❓')} {result['overall_status'].upper()}"
        )
        print(f"⏱️  Verification Duration: {result['duration_seconds']:.2f}s")
        print(f"📅 Timestamp: {result['timestamp']}")

        # Summary
        summary = result["summary"]
        print(f"\n📊 Summary:")
        print(f"   Expected Services: {summary['expected_services']}")
        print(f"   Defined Services:  {summary['defined_services']}")
        print(f"   Running Services:  {summary['running_services']}")
        print(f"   Healthy Services:  {summary['healthy_services']}")
        print(f"   Completeness:     {summary['architecture_completeness']}%")

        # Detailed Checks
        checks = result["checks"]

        print(f"\n🔍 Detailed Check Results:")

        # Compose Services
        compose = checks["compose_services"]
        print(f"   📝 Docker Compose: {status_emoji.get(compose['status'], '❓')}")
        if compose.get("missing_services"):
            print(f"      Missing: {', '.join(compose['missing_services'])}")

        # Running Containers
        containers = checks["running_containers"]
        print(f"   🐳 Running Containers: {status_emoji.get(containers['status'], '❓')}")
        print(
            f"      Running: {containers.get('running_count', 0)}/{summary['expected_services']}"
        )

        # Health Checks
        health = checks["service_health"]
        print(f"   🏥 Health Checks: {status_emoji.get(health['status'], '❓')}")
        print(f"      Healthy: {health.get('healthy_count', 0)} services")
        if health.get("unhealthy_services"):
            print(f"      Unhealthy: {len(health['unhealthy_services'])} services")

        # Monitoring
        monitoring = checks["monitoring_stack"]
        print(f"   📊 Monitoring Stack: {status_emoji.get(monitoring['status'], '❓')}")
        print(
            f"      Config Completeness: {monitoring.get('config_completeness', 0):.1f}%"
        )

        # Recommendations
        self.print_recommendations(result)

    def print_recommendations(self, result: Dict):
        """Print recommendations based on verification results."""
        print(f"\n💡 Recommendations:")

        checks = result["checks"]

        # Missing services
        missing_services = checks["compose_services"].get("missing_services", [])
        if missing_services:
            print(
                f"   • Add missing services to docker-compose.unified.yml: {', '.join(missing_services)}"
            )

        # Unhealthy services
        unhealthy = checks["service_health"].get("unhealthy_services", [])
        if unhealthy:
            print(
                f"   • Fix unhealthy services: {', '.join([s['service'] for s in unhealthy])}"
            )

        # Missing configs
        missing_configs = checks["monitoring_stack"].get("missing_configs", [])
        if missing_configs:
            print(f"   • Add missing monitoring configs: {', '.join(missing_configs)}")

        # General recommendations
        completeness = result["summary"]["architecture_completeness"]
        if completeness < 90:
            print(
                f"   • Architecture is {completeness}% complete - work on missing components"
            )
        elif completeness >= 95:
            print(f"   • Excellent! Architecture is {completeness}% complete")

        print("\n🚀 Next Steps:")
        print("   1. Fix any missing or unhealthy services")
        print("   2. Verify all monitoring endpoints are accessible")
        print("   3. Run integration tests on all service APIs")
        print("   4. Update README.md if service count changes")

        print("\n" + "=" * 60)


async def main():
    """Main verification function."""
    verifier = ServiceArchitectureVerifier()

    try:
        result = verifier.verify_architecture()
        verifier.print_verification_report(result)

        # Save results to file
        with open("service_architecture_verification.json", "w") as f:
            json.dump(result, f, indent=2)

        print(f"📄 Full results saved to: service_architecture_verification.json")

        # Exit with appropriate code
        if result["overall_status"] == "error":
            sys.exit(1)
        elif result["overall_status"] == "warning":
            sys.exit(2)
        else:
            sys.exit(0)

    except Exception as e:
        print(f"❌ Verification failed: {e}")
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
