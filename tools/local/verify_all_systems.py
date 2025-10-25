#!/usr/bin/env python3
"""
Auterity Unified AI Platform - System Verification Script.

Verifies all three systems + integration layer are running and communicating.
"""

import sys
import time
from typing import Any, Dict

import requests

# System endpoints
SYSTEMS = {
    "AutoMatrix Backend": "http://localhost:8000",
    "AutoMatrix Frontend": "http://localhost:3000",
    "RelayCore Backend": "http://localhost:3001",
    "RelayCore Frontend": "http://localhost:3002",
    "NeuroWeaver Backend": "http://localhost:8001",
    "NeuroWeaver Frontend": "http://localhost:3003",
    "Integration Layer": "http://localhost:3002",  # Note: Same as RelayCore
    # frontend in some configs
}


def check_system_health(name: str, url: str) -> Dict[str, Any]:
    """Check if a system is healthy."""
    try:
        # Try common health check endpoints
        endpoints_to_try = [
            f"{url}/health",
            f"{url}/api/health",
            f"{url}/api/v1/health",
            f"{url}/",
        ]

        for endpoint in endpoints_to_try:
            try:
                response = requests.get(endpoint, timeout=5)
                if response.status_code == 200:
                    return {
                        "status": "✅ HEALTHY",
                        "url": endpoint,
                        "response_time": response.elapsed.total_seconds(),
                        "details": (
                            response.text[:200] if response.text else "OK"
                        ),
                    }
            except requests.RequestException:
                continue

        return {
            "status": "❌ UNREACHABLE",
            "url": url,
            "response_time": None,
            "details": "No health endpoint responded",
        }

    except Exception as e:
        return {
            "status": "❌ ERROR",
            "url": url,
            "response_time": None,
            "details": str(e),
        }


def test_integration_endpoints():
    """Test key integration endpoints."""
    integration_tests = []

    # Test AutoMatrix → RelayCore integration
    try:
        response = requests.post(
            "http://localhost:8000/api/v1/ai/chat",
            json={"message": "Test integration", "model": "gpt-3.5-turbo"},
            timeout=10,
        )
        integration_tests.append(
            {
                "test": "AutoMatrix → RelayCore AI Chat",
                "status": "✅ SUCCESS"
                if response.status_code in [200, 201]
                else f"❌ FAILED ({response.status_code})",
                "details": (
                    response.text[:100] if response.text else "No response"
                ),
            }
        )
    except Exception as e:
        integration_tests.append(
            {
                "test": "AutoMatrix → RelayCore AI Chat",
                "status": "❌ ERROR",
                "details": str(e),
            }
        )

    return integration_tests


def main():
    """Verify all systems and return exit code."""
    # Check all systems
    results = {}
    for name, url in SYSTEMS.items():
        results[name] = check_system_health(name, url)
        time.sleep(0.5)  # Brief pause between checks

    healthy_count = 0
    for _name, result in results.items():
        if result["response_time"]:
            if "HEALTHY" in result["status"]:
                healthy_count += 1

    integration_results = test_integration_endpoints()
    for _test in integration_results:
        pass

    total_systems = len(SYSTEMS)

    if healthy_count == total_systems:
        return 0
    elif healthy_count >= total_systems * 0.75:
        return 1
    else:
        return 2


if __name__ == "__main__":
    sys.exit(main())
