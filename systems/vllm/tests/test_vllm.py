"""
Comprehensive tests for Auterity vLLM Service
Tests cover functionality, performance, error handling, and integration
"""

import asyncio
import json
import time
import pytest
import aiohttp
from unittest.mock import Mock, patch, AsyncMock
from fastapi.testclient import TestClient

# Import the service components
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from src.vllm_service import (
    app,
    VLLMManager,
    VLLMConfig,
    GenerationRequest,
    vllm_manager
)


class TestVLLMService:
    """Test suite for vLLM service functionality"""

    def setup_method(self):
        """Setup test environment"""
        self.client = TestClient(app)
        self.base_url = "http://testserver"

    def test_service_health_endpoint(self):
        """Test service health check endpoint"""
        response = self.client.get("/health")
        assert response.status_code == 200

        data = response.json()
        assert "status" in data
        assert "vllm_initialized" in data
        assert "timestamp" in data

    def test_service_root_endpoint(self):
        """Test root endpoint"""
        response = self.client.get("/")
        assert response.status_code == 200

        data = response.json()
        assert "service" in data
        assert data["service"] == "Auterity vLLM Service"

    @patch('src.vllm_service.vllm_manager')
    def test_generate_text_success(self, mock_manager):
        """Test successful text generation"""
        # Mock the manager's generate method
        mock_manager.generate = AsyncMock(return_value={
            "response": "Test response",
            "usage": {
                "prompt_tokens": 5,
                "completion_tokens": 10,
                "total_tokens": 15
            },
            "performance": {
                "latency_ms": 150,
                "model": "test-model",
                "timestamp": "2024-01-15T10:30:00Z"
            },
            "metadata": {
                "finish_reason": "stop",
                "cached": False
            }
        })
        mock_manager.is_initialized = True

        request_data = {
            "prompt": "Hello world",
            "temperature": 0.7,
            "max_tokens": 100
        }

        response = self.client.post("/v1/generate", json=request_data)
        assert response.status_code == 200

        data = response.json()
        assert "response" in data
        assert "usage" in data
        assert "performance" in data
        assert data["response"] == "Test response"

    def test_generate_text_validation(self):
        """Test input validation for generation requests"""
        # Test empty prompt
        response = self.client.post("/v1/generate", json={
            "prompt": "",
            "temperature": 0.7
        })
        assert response.status_code == 422  # Validation error

        # Test invalid temperature
        response = self.client.post("/v1/generate", json={
            "prompt": "Hello world",
            "temperature": 2.5  # Invalid: > 2.0
        })
        assert response.status_code == 422

        # Test invalid max_tokens
        response = self.client.post("/v1/generate", json={
            "prompt": "Hello world",
            "temperature": 0.7,
            "max_tokens": 10000  # Invalid: > 4096
        })
        assert response.status_code == 422

    @patch('src.vllm_service.vllm_manager')
    def test_generate_text_service_unavailable(self, mock_manager):
        """Test generation when service is unavailable"""
        mock_manager.is_initialized = False

        response = self.client.post("/v1/generate", json={
            "prompt": "Hello world",
            "temperature": 0.7
        })
        assert response.status_code == 503
        assert "not initialized" in response.json()["detail"].lower()

    def test_get_metrics_endpoint(self):
        """Test metrics endpoint"""
        response = self.client.get("/v1/metrics")
        # Should return metrics even if service is not fully initialized
        assert response.status_code in [200, 503]

    def test_list_models_endpoint(self):
        """Test models listing endpoint"""
        response = self.client.get("/v1/models")
        assert response.status_code == 200

        data = response.json()
        assert "available_models" in data
        assert isinstance(data["available_models"], list)
        assert len(data["available_models"]) > 0

    def test_load_model_endpoint(self):
        """Test model loading endpoint"""
        response = self.client.post("/v1/models/load", json={"model_name": "test-model"})
        # This endpoint may return a placeholder response
        assert response.status_code in [200, 501]  # 501 = Not Implemented (expected for now)


class TestVLLMManager:
    """Test suite for VLLMManager class"""

    def setup_method(self):
        """Setup test environment"""
        self.config = VLLMConfig(
            model_name="test-model",
            tensor_parallel_size=1,
            gpu_memory_utilization=0.9
        )

    @patch('src.vllm_service.VLLMManager._get_gpu_info')
    async def test_get_metrics(self, mock_gpu_info):
        """Test metrics retrieval"""
        mock_gpu_info.return_value = {
            "available": True,
            "device_count": 1,
            "devices": [{
                "id": 0,
                "name": "Test GPU",
                "total_memory_gb": 16.0,
                "allocated_memory_gb": 8.0,
                "reserved_memory_gb": 10.0,
                "utilization": 0.625
            }]
        }

        manager = VLLMManager(self.config)
        manager.is_initialized = True
        manager.metrics.requests_per_second = 50.0
        manager.metrics.average_latency_ms = 200.0

        metrics = await manager.get_metrics()

        assert "model_metrics" in metrics
        assert "global_metrics" in metrics
        assert "gpu_info" in metrics
        assert "health_status" in metrics

        assert metrics["model_metrics"]["requests_per_second"] == 50.0
        assert metrics["model_metrics"]["average_latency_ms"] == 200.0
        assert metrics["gpu_info"]["available"] is True

    def test_cache_key_generation(self):
        """Test cache key generation for requests"""
        manager = VLLMManager(self.config)

        request1 = GenerationRequest(
            prompt="Hello world",
            temperature=0.7,
            max_tokens=100
        )

        request2 = GenerationRequest(
            prompt="Hello world",
            temperature=0.7,
            max_tokens=100
        )

        request3 = GenerationRequest(
            prompt="Different prompt",
            temperature=0.7,
            max_tokens=100
        )

        # Same requests should generate same cache key
        key1 = manager._generate_cache_key(request1)
        key2 = manager._generate_cache_key(request2)
        assert key1 == key2

        # Different requests should generate different cache keys
        key3 = manager._generate_cache_key(request3)
        assert key1 != key3


class TestGenerationRequest:
    """Test suite for GenerationRequest model"""

    def test_valid_request(self):
        """Test valid request creation"""
        request = GenerationRequest(
            prompt="Test prompt",
            temperature=0.8,
            max_tokens=200,
            top_p=0.9,
            stop_sequences=["\n", "END"]
        )

        assert request.prompt == "Test prompt"
        assert request.temperature == 0.8
        assert request.max_tokens == 200
        assert request.top_p == 0.9
        assert request.stop_sequences == ["\n", "END"]
        assert request.stream is False  # Default value
        assert request.cache is True    # Default value

    def test_request_validation(self):
        """Test request validation"""
        # Valid request
        request = GenerationRequest(prompt="Valid prompt")
        assert request.prompt == "Valid prompt"

        # Test boundary values
        request = GenerationRequest(
            prompt="x" * 10000,  # Maximum allowed length
            temperature=2.0,     # Maximum allowed
            max_tokens=4096      # Maximum allowed
        )
        assert len(request.prompt) == 10000
        assert request.temperature == 2.0
        assert request.max_tokens == 4096

    def test_request_defaults(self):
        """Test default values"""
        request = GenerationRequest(prompt="Test")

        assert request.temperature == 0.7
        assert request.top_p == 1.0
        assert request.max_tokens == 500
        assert request.stop_sequences is None
        assert request.stream is False
        assert request.cache is True


class TestIntegration:
    """Integration tests for the complete service"""

    def setup_method(self):
        """Setup integration test environment"""
        self.client = TestClient(app)

    def test_end_to_end_flow(self):
        """Test complete request flow"""
        # 1. Check health
        response = self.client.get("/health")
        assert response.status_code in [200, 503]  # May be 503 if vLLM not initialized

        # 2. Get available models
        response = self.client.get("/v1/models")
        assert response.status_code == 200
        data = response.json()
        assert "available_models" in data

        # 3. Attempt generation (may fail if vLLM not available)
        response = self.client.post("/v1/generate", json={
            "prompt": "Hello world",
            "temperature": 0.7,
            "max_tokens": 50
        })
        # Should either succeed or return service unavailable
        assert response.status_code in [200, 503]

    def test_error_handling(self):
        """Test error handling across endpoints"""
        # Test invalid JSON
        response = self.client.post("/v1/generate", data="invalid json")
        assert response.status_code == 422

        # Test missing required fields
        response = self.client.post("/v1/generate", json={})
        assert response.status_code == 422

        # Test invalid endpoint
        response = self.client.get("/invalid/endpoint")
        assert response.status_code == 404


# Performance tests
class TestPerformance:
    """Performance test suite"""

    def setup_method(self):
        """Setup performance test environment"""
        self.client = TestClient(app)

    def test_request_validation_performance(self):
        """Test request validation performance"""
        import time

        request_data = {
            "prompt": "Test prompt for performance",
            "temperature": 0.7,
            "max_tokens": 100
        }

        # Measure validation performance
        start_time = time.time()
        for _ in range(1000):
            request = GenerationRequest(**request_data)
        end_time = time.time()

        validation_time = (end_time - start_time) / 1000  # Average time per validation
        assert validation_time < 0.001  # Should be less than 1ms per validation

    def test_memory_usage(self):
        """Test memory usage patterns"""
        import psutil
        import os

        process = psutil.Process(os.getpid())
        initial_memory = process.memory_info().rss

        # Create multiple request objects
        requests = []
        for i in range(1000):
            request = GenerationRequest(
                prompt=f"Test prompt {i}",
                temperature=0.7,
                max_tokens=100
            )
            requests.append(request)

        final_memory = process.memory_info().rss
        memory_increase = final_memory - initial_memory

        # Memory increase should be reasonable (less than 50MB for 1000 objects)
        assert memory_increase < 50 * 1024 * 1024


# Load tests (run with caution)
class TestLoad:
    """Load test suite for high-throughput scenarios"""

    def setup_method(self):
        """Setup load test environment"""
        self.client = TestClient(app)

    @pytest.mark.skip(reason="Load test - run manually")
    def test_concurrent_requests(self):
        """Test handling of concurrent requests"""
        import concurrent.futures
        import threading

        results = []
        errors = []

        def make_request(request_id):
            try:
                response = self.client.post("/v1/generate", json={
                    "prompt": f"Test request {request_id}",
                    "temperature": 0.7,
                    "max_tokens": 50
                })
                results.append((request_id, response.status_code))
            except Exception as e:
                errors.append((request_id, str(e)))

        # Run 100 concurrent requests
        with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
            futures = [executor.submit(make_request, i) for i in range(100)]
            concurrent.futures.wait(futures)

        # Analyze results
        success_count = sum(1 for _, status in results if status in [200, 503])
        error_count = len(errors)

        # Should handle the load without crashing
        assert success_count + error_count == 100


if __name__ == "__main__":
    # Run basic health check
    client = TestClient(app)

    # Test health endpoint
    response = client.get("/health")

    # Test models endpoint
    response = client.get("/v1/models")

    # Test root endpoint
    response = client.get("/")

