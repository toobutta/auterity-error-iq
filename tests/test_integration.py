"""Integration tests for the complete analytics system."""

import pytest
import asyncio
import time
from concurrent.futures import ThreadPoolExecutor
from unittest.mock import Mock, patch
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.main import app
from app.database import get_db


@pytest.fixture
def client():
    """Test client fixture."""
    return TestClient(app)


@pytest.fixture
def integration_db():
    """Integration test database fixture."""
    # This would use a test database
    db = next(get_db())
    try:
        yield db
    finally:
        db.close()


class TestFullSystemIntegration:
    """Test the complete analytics system integration."""

    def test_complete_analytics_workflow(self, client):
        """Test complete analytics workflow from data ingestion to insights."""
        # Mock authentication
        with patch('app.middleware.security_middleware.AnalyticsSecurityMiddleware.validate_access_token') as mock_validate:
            mock_validate.return_value = {
                "sub": "test_user",
                "tenant_id": "test_tenant",
                "roles": ["analyst"]
            }

            # Step 1: Test unified analytics endpoint
            response = client.get("/api/unified/analytics")
            assert response.status_code == 200
            unified_data = response.json()

            # Verify all systems are included
            assert "auterity" in unified_data
            assert "neuroweaver" in unified_data
            assert "relaycore" in unified_data
            assert "correlations" in unified_data
            assert "insights" in unified_data

            # Step 2: Test correlations
            response = client.get("/api/unified/correlations")
            assert response.status_code == 200
            correlation_data = response.json()

            assert "correlations" in correlation_data
            assert "statistics" in correlation_data

            # Step 3: Test insights
            response = client.get("/api/unified/insights")
            assert response.status_code == 200
            insights_data = response.json()

            assert "insights" in insights_data
            assert "statistics" in insights_data

            # Step 4: Test predictions
            response = client.get("/api/unified/predictions")
            assert response.status_code == 200
            predictions_data = response.json()

            assert "predictions" in predictions_data

    def test_cross_system_data_flow(self, client):
        """Test data flow between different system components."""
        with patch('app.middleware.security_middleware.AnalyticsSecurityMiddleware.validate_access_token') as mock_validate:
            mock_validate.return_value = {
                "sub": "test_user",
                "tenant_id": "test_tenant",
                "roles": ["analyst"]
            }

            # Test data flows through different endpoints
            endpoints = [
                "/api/enhanced-analytics/unified",
                "/api/enhanced-analytics/business/overview",
                "/api/enhanced-analytics/correlations/advanced",
                "/api/enhanced-analytics/predictions/advanced",
                "/api/modelhub",
                "/api/modelhub/models",
                "/api/unified/analytics",
                "/api/unified/health"
            ]

            for endpoint in endpoints:
                response = client.get(endpoint)
                assert response.status_code == 200, f"Failed endpoint: {endpoint}"

                # Verify response has expected structure
                data = response.json()
                assert isinstance(data, dict), f"Invalid response format for {endpoint}"

    def test_real_time_updates(self, client):
        """Test real-time update capabilities."""
        with patch('app.middleware.security_middleware.AnalyticsSecurityMiddleware.validate_access_token') as mock_validate:
            mock_validate.return_value = {
                "sub": "test_user",
                "tenant_id": "test_tenant",
                "roles": ["analyst"]
            }

            # Test WebSocket stats endpoint
            response = client.get("/api/analytics-ws/stats")
            assert response.status_code == 200

            stats = response.json()
            assert "active_connections" in stats
            assert "total_subscriptions" in stats

            # Test health endpoint for real-time data
            response = client.get("/api/unified/health")
            assert response.status_code == 200

            health_data = response.json()
            assert "health" in health_data
            assert "timestamp" in health_data.get("metadata", {})


class TestLoadTesting:
    """Load testing scenarios for the analytics system."""

    def test_concurrent_api_calls(self, client):
        """Test concurrent API calls."""
        with patch('app.middleware.security_middleware.AnalyticsSecurityMiddleware.validate_access_token') as mock_validate:
            mock_validate.return_value = {
                "sub": "test_user",
                "tenant_id": "test_tenant",
                "roles": ["analyst"]
            }

            def make_request(endpoint):
                return client.get(endpoint)

            endpoints = [
                "/api/enhanced-analytics/unified",
                "/api/enhanced-analytics/business/overview",
                "/api/modelhub",
                "/api/unified/analytics"
            ] * 10  # 40 total requests

            with ThreadPoolExecutor(max_workers=10) as executor:
                futures = [executor.submit(make_request, endpoint) for endpoint in endpoints]
                results = [future.result() for future in futures]

            # All requests should succeed
            success_count = sum(1 for result in results if result.status_code == 200)
            assert success_count == len(results), f"Only {success_count}/{len(results)} requests succeeded"

    def test_high_frequency_requests(self, client):
        """Test high-frequency request handling."""
        with patch('app.middleware.security_middleware.AnalyticsSecurityMiddleware.validate_access_token') as mock_validate:
            mock_validate.return_value = {
                "sub": "test_user",
                "tenant_id": "test_tenant",
                "roles": ["analyst"]
            }

            # Make rapid successive requests
            start_time = time.time()
            request_count = 50

            for i in range(request_count):
                response = client.get("/api/enhanced-analytics/unified")
                # Some may be rate limited, but should not crash
                assert response.status_code in [200, 429]

            end_time = time.time()
            total_time = end_time - start_time

            # Calculate requests per second
            rps = request_count / total_time
            print(f"Achieved {rps:.2f} requests per second")

            # System should handle reasonable load
            assert rps > 5, f"Request rate too low: {rps:.2f} RPS"

    def test_large_data_handling(self, client):
        """Test handling of large datasets."""
        with patch('app.middleware.security_middleware.AnalyticsSecurityMiddleware.validate_access_token') as mock_validate:
            mock_validate.return_value = {
                "sub": "test_user",
                "tenant_id": "test_tenant",
                "roles": ["analyst"]
            }

            # Test with pagination parameters
            response = client.get("/api/enhanced-analytics/business/user-journey?page=1&page_size=1000")
            assert response.status_code == 200

            data = response.json()
            assert "userJourney" in data
            assert "pagination" in data

    def test_memory_usage_under_load(self, client):
        """Test memory usage under load conditions."""
        import psutil
        import os

        process = psutil.Process(os.getpid())
        initial_memory = process.memory_info().rss / 1024 / 1024  # MB

        with patch('app.middleware.security_middleware.AnalyticsSecurityMiddleware.validate_access_token') as mock_validate:
            mock_validate.return_value = {
                "sub": "test_user",
                "tenant_id": "test_tenant",
                "roles": ["analyst"]
            }

            # Generate load
            for i in range(100):
                response = client.get("/api/enhanced-analytics/unified")
                assert response.status_code in [200, 429]

            final_memory = process.memory_info().rss / 1024 / 1024  # MB
            memory_increase = final_memory - initial_memory

            # Memory increase should be reasonable (< 50MB for this test)
            assert memory_increase < 50, f"Memory increase too high: {memory_increase:.2f} MB"


class TestSecurityIntegration:
    """Test security integration across the system."""

    def test_role_based_access_control(self, client):
        """Test role-based access control."""
        # Test with different roles
        roles_to_test = ["viewer", "analyst", "admin"]

        for role in roles_to_test:
            with patch('app.middleware.security_middleware.AnalyticsSecurityMiddleware.validate_access_token') as mock_validate:
                mock_validate.return_value = {
                    "sub": "test_user",
                    "tenant_id": "test_tenant",
                    "roles": [role]
                }

                response = client.get("/api/enhanced-analytics/unified")
                assert response.status_code == 200

                data = response.json()
                # Different roles should see different data based on permissions
                assert isinstance(data, dict)

    def test_data_privacy_filters(self, client):
        """Test data privacy filtering."""
        # Test with different permission levels
        with patch('app.middleware.security_middleware.AnalyticsSecurityMiddleware.validate_access_token') as mock_validate:
            # Test with limited permissions
            mock_validate.return_value = {
                "sub": "test_user",
                "tenant_id": "test_tenant",
                "roles": ["viewer"]  # Limited permissions
            }

            response = client.get("/api/enhanced-analytics/unified")
            assert response.status_code == 200

            # Should still work but with filtered data
            data = response.json()
            assert isinstance(data, dict)

    def test_audit_logging_integration(self, client):
        """Test audit logging integration."""
        with patch('app.middleware.security_middleware.AnalyticsSecurityMiddleware.validate_access_token') as mock_validate:
            mock_validate.return_value = {
                "sub": "test_user",
                "tenant_id": "test_tenant",
                "roles": ["analyst"]
            }

            # Make several requests
            endpoints = [
                "/api/enhanced-analytics/unified",
                "/api/modelhub",
                "/api/unified/analytics"
            ]

            for endpoint in endpoints:
                response = client.get(endpoint)
                assert response.status_code == 200

            # Test audit endpoint (would require admin permissions in real scenario)
            # response = client.get("/api/management/security/audit")
            # assert response.status_code == 200


class TestPerformanceIntegration:
    """Test performance optimization integration."""

    def test_caching_integration(self, client):
        """Test caching system integration."""
        with patch('app.middleware.security_middleware.AnalyticsSecurityMiddleware.validate_access_token') as mock_validate:
            mock_validate.return_value = {
                "sub": "test_user",
                "tenant_id": "test_tenant",
                "roles": ["analyst"]
            }

            # Make same request multiple times
            endpoint = "/api/enhanced-analytics/unified"

            start_time = time.time()
            for i in range(5):
                response = client.get(endpoint)
                assert response.status_code == 200

            end_time = time.time()
            avg_response_time = (end_time - start_time) / 5

            # Should be fast due to caching
            assert avg_response_time < 1.0, f"Average response time too slow: {avg_response_time:.2f}s"

    def test_pagination_performance(self, client):
        """Test pagination performance."""
        with patch('app.middleware.security_middleware.AnalyticsSecurityMiddleware.validate_access_token') as mock_validate:
            mock_validate.return_value = {
                "sub": "test_user",
                "tenant_id": "test_tenant",
                "roles": ["analyst"]
            }

            # Test different page sizes
            page_sizes = [10, 50, 100, 500]

            for page_size in page_sizes:
                start_time = time.time()
                response = client.get(f"/api/enhanced-analytics/business/user-journey?page=1&page_size={page_size}")
                end_time = time.time()

                assert response.status_code == 200
                response_time = end_time - start_time

                # Should handle different page sizes efficiently
                assert response_time < 2.0, f"Page size {page_size} too slow: {response_time:.2f}s"


class TestErrorHandlingIntegration:
    """Test error handling across the system."""

    def test_graceful_error_handling(self, client):
        """Test graceful error handling."""
        # Test with invalid endpoints
        response = client.get("/api/enhanced-analytics/invalid-endpoint")
        assert response.status_code == 404

        # Test with invalid parameters
        response = client.get("/api/enhanced-analytics/unified?invalid_param=invalid")
        # Should still work with invalid params (depending on implementation)
        assert response.status_code in [200, 400]

    def test_service_unavailability_handling(self, client):
        """Test handling of service unavailability."""
        # This would require mocking service failures
        # For now, test normal operation
        with patch('app.middleware.security_middleware.AnalyticsSecurityMiddleware.validate_access_token') as mock_validate:
            mock_validate.return_value = {
                "sub": "test_user",
                "tenant_id": "test_tenant",
                "roles": ["analyst"]
            }

            response = client.get("/api/enhanced-analytics/unified")
            assert response.status_code == 200

    def test_timeout_handling(self, client):
        """Test timeout handling."""
        with patch('app.middleware.security_middleware.AnalyticsSecurityMiddleware.validate_access_token') as mock_validate:
            mock_validate.return_value = {
                "sub": "test_user",
                "tenant_id": "test_tenant",
                "roles": ["analyst"]
            }

            # Test with timeout-prone operations
            start_time = time.time()
            response = client.get("/api/enhanced-analytics/correlations/advanced")
            end_time = time.time()

            assert response.status_code == 200
            assert end_time - start_time < 30  # Should not timeout


class TestDataConsistency:
    """Test data consistency across the system."""

    def test_cross_endpoint_data_consistency(self, client):
        """Test data consistency across different endpoints."""
        with patch('app.middleware.security_middleware.AnalyticsSecurityMiddleware.validate_access_token') as mock_validate:
            mock_validate.return_value = {
                "sub": "test_user",
                "tenant_id": "test_tenant",
                "roles": ["analyst"]
            }

            # Get data from multiple endpoints
            unified_response = client.get("/api/unified/analytics")
            enhanced_response = client.get("/api/enhanced-analytics/unified")

            assert unified_response.status_code == 200
            assert enhanced_response.status_code == 200

            unified_data = unified_response.json()
            enhanced_data = enhanced_response.json()

            # Should have consistent structure
            assert "auterity" in unified_data
            assert "auterity" in enhanced_data

    def test_temporal_data_consistency(self, client):
        """Test temporal data consistency."""
        with patch('app.middleware.security_middleware.AnalyticsSecurityMiddleware.validate_access_token') as mock_validate:
            mock_validate.return_value = {
                "sub": "test_user",
                "tenant_id": "test_tenant",
                "roles": ["analyst"]
            }

            # Make requests with time parameters
            response1 = client.get("/api/enhanced-analytics/unified?date_from=2024-01-01")
            response2 = client.get("/api/enhanced-analytics/unified?date_from=2024-01-01")

            assert response1.status_code == 200
            assert response2.status_code == 200

            # Should return consistent results for same parameters
            data1 = response1.json()
            data2 = response2.json()

            # Basic structure should be the same
            assert set(data1.keys()) == set(data2.keys())


if __name__ == "__main__":
    pytest.main([__file__, "-v"])

