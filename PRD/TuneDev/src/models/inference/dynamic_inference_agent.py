"""
Dynamic Inference Agent (DIA)

This module implements a real-time inference optimizer that routes AI requests
to optimal models and runtimes based on latency, cost, and accuracy requirements.
"""

import os
import json
import yaml
import logging
import time
from typing import List, Dict, Any, Optional, Union, Tuple
import numpy as np
from dataclasses import dataclass
import threading
import queue
from enum import Enum

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class ModelBackend(Enum):
    """Supported model backends"""
    VLLM = "vllm"
    TENSORRT = "tensorrt"
    TRITON = "triton"
    ONNX = "onnx"
    CUSTOM = "custom"


@dataclass
class ModelConfig:
    """Configuration for a model endpoint"""
    model_id: str
    name: str
    backend: ModelBackend
    endpoint_url: str
    max_tokens: int
    supports_batching: bool
    quantization: Optional[str] = None
    cost_per_1k_tokens: float = 0.0
    avg_latency_ms: float = 100.0
    max_batch_size: int = 1
    timeout_ms: int = 30000
    supports_streaming: bool = False
    metadata: Dict[str, Any] = None


@dataclass
class InferenceRequest:
    """Inference request details"""
    request_id: str
    prompt: str
    max_tokens: int = 1024
    temperature: float = 0.7
    top_p: float = 1.0
    top_k: int = 50
    stop_sequences: List[str] = None
    streaming: bool = False
    priority: int = 1  # 1 (highest) to 5 (lowest)
    timeout_ms: int = 30000
    metadata: Dict[str, Any] = None


@dataclass
class InferenceResponse:
    """Inference response details"""
    request_id: str
    output: str
    model_used: str
    backend_used: str
    tokens_input: int
    tokens_output: int
    latency_ms: float
    cost: float
    status: str = "success"
    error_message: Optional[str] = None
    metadata: Dict[str, Any] = None


@dataclass
class RoutingDecision:
    """Details about a routing decision"""
    model_id: str
    backend: ModelBackend
    endpoint_url: str
    estimated_latency_ms: float
    estimated_cost: float
    reason: str


class ModelPerformanceTracker:
    """
    Tracks performance metrics for model endpoints
    """
    
    def __init__(self):
        """Initialize the performance tracker"""
        self.metrics = {}
        self.lock = threading.Lock()
        
    def record_inference(self, model_id: str, latency_ms: float, success: bool):
        """
        Record an inference result
        
        Args:
            model_id: ID of the model
            latency_ms: Latency in milliseconds
            success: Whether the inference was successful
        """
        with self.lock:
            if model_id not in self.metrics:
                self.metrics[model_id] = {
                    "total_requests": 0,
                    "successful_requests": 0,
                    "failed_requests": 0,
                    "total_latency_ms": 0,
                    "latencies": [],
                    "last_10_latencies": []
                }
                
            self.metrics[model_id]["total_requests"] += 1
            
            if success:
                self.metrics[model_id]["successful_requests"] += 1
                self.metrics[model_id]["total_latency_ms"] += latency_ms
                self.metrics[model_id]["latencies"].append(latency_ms)
                
                # Keep only the last 100 latencies for memory efficiency
                if len(self.metrics[model_id]["latencies"]) > 100:
                    self.metrics[model_id]["latencies"] = self.metrics[model_id]["latencies"][-100:]
                
                # Update last 10 latencies
                self.metrics[model_id]["last_10_latencies"].append(latency_ms)
                if len(self.metrics[model_id]["last_10_latencies"]) > 10:
                    self.metrics[model_id]["last_10_latencies"] = self.metrics[model_id]["last_10_latencies"][-10:]
            else:
                self.metrics[model_id]["failed_requests"] += 1
    
    def get_avg_latency(self, model_id: str) -> float:
        """
        Get the average latency for a model
        
        Args:
            model_id: ID of the model
            
        Returns:
            float: Average latency in milliseconds
        """
        with self.lock:
            if model_id not in self.metrics or self.metrics[model_id]["successful_requests"] == 0:
                return float('inf')
                
            return self.metrics[model_id]["total_latency_ms"] / self.metrics[model_id]["successful_requests"]
    
    def get_recent_latency(self, model_id: str) -> float:
        """
        Get the average of the last 10 latencies for a model
        
        Args:
            model_id: ID of the model
            
        Returns:
            float: Average recent latency in milliseconds
        """
        with self.lock:
            if model_id not in self.metrics or not self.metrics[model_id]["last_10_latencies"]:
                return float('inf')
                
            return sum(self.metrics[model_id]["last_10_latencies"]) / len(self.metrics[model_id]["last_10_latencies"])
    
    def get_success_rate(self, model_id: str) -> float:
        """
        Get the success rate for a model
        
        Args:
            model_id: ID of the model
            
        Returns:
            float: Success rate (0.0 to 1.0)
        """
        with self.lock:
            if model_id not in self.metrics or self.metrics[model_id]["total_requests"] == 0:
                return 0.0
                
            return self.metrics[model_id]["successful_requests"] / self.metrics[model_id]["total_requests"]
    
    def get_metrics(self, model_id: str) -> Dict[str, Any]:
        """
        Get all metrics for a model
        
        Args:
            model_id: ID of the model
            
        Returns:
            Dict[str, Any]: Metrics dictionary
        """
        with self.lock:
            if model_id not in self.metrics:
                return {}
                
            metrics = self.metrics[model_id].copy()
            
            # Calculate additional metrics
            if metrics["successful_requests"] > 0:
                metrics["avg_latency_ms"] = metrics["total_latency_ms"] / metrics["successful_requests"]
                
                if metrics["latencies"]:
                    metrics["min_latency_ms"] = min(metrics["latencies"])
                    metrics["max_latency_ms"] = max(metrics["latencies"])
                    metrics["p50_latency_ms"] = np.percentile(metrics["latencies"], 50)
                    metrics["p90_latency_ms"] = np.percentile(metrics["latencies"], 90)
                    metrics["p99_latency_ms"] = np.percentile(metrics["latencies"], 99)
                    
                if metrics["last_10_latencies"]:
                    metrics["recent_avg_latency_ms"] = sum(metrics["last_10_latencies"]) / len(metrics["last_10_latencies"])
            
            if metrics["total_requests"] > 0:
                metrics["success_rate"] = metrics["successful_requests"] / metrics["total_requests"]
                metrics["failure_rate"] = metrics["failed_requests"] / metrics["total_requests"]
                
            return metrics


class DynamicInferenceAgent:
    """
    Dynamic Inference Agent (DIA) that routes inference requests to optimal
    model endpoints based on latency, cost, and accuracy requirements.
    """
    
    def __init__(self, config_path: Optional[str] = None, config: Optional[Dict[str, Any]] = None):
        """
        Initialize the Dynamic Inference Agent
        
        Args:
            config_path: Path to YAML configuration file
            config: Configuration dictionary (alternative to config_path)
        """
        if config_path and os.path.exists(config_path):
            with open(config_path, 'r') as f:
                self.config = yaml.safe_load(f)
        elif config:
            self.config = config
        else:
            self.config = {
                "default_timeout_ms": 30000,
                "default_max_tokens": 1024,
                "enable_batching": True,
                "max_batch_size": 4,
                "batch_timeout_ms": 100,
                "cost_weight": 0.3,
                "latency_weight": 0.4,
                "reliability_weight": 0.3,
                "models": []
            }
            
        # Initialize model registry
        self.models = {}
        for model_config in self.config.get("models", []):
            model_id = model_config["model_id"]
            self.models[model_id] = ModelConfig(
                model_id=model_id,
                name=model_config["name"],
                backend=ModelBackend(model_config["backend"]),
                endpoint_url=model_config["endpoint_url"],
                max_tokens=model_config.get("max_tokens", self.config["default_max_tokens"]),
                supports_batching=model_config.get("supports_batching", False),
                quantization=model_config.get("quantization"),
                cost_per_1k_tokens=model_config.get("cost_per_1k_tokens", 0.0),
                avg_latency_ms=model_config.get("avg_latency_ms", 100.0),
                max_batch_size=model_config.get("max_batch_size", 1),
                timeout_ms=model_config.get("timeout_ms", self.config["default_timeout_ms"]),
                supports_streaming=model_config.get("supports_streaming", False),
                metadata=model_config.get("metadata", {})
            )
            
        # Initialize performance tracker
        self.performance_tracker = ModelPerformanceTracker()
        
        # Initialize request queue for batching
        self.request_queue = queue.PriorityQueue()
        self.batch_timeout_ms = self.config.get("batch_timeout_ms", 100)
        
        # Start batching thread if enabled
        if self.config.get("enable_batching", True):
            self.batching_thread = threading.Thread(target=self._batch_processor, daemon=True)
            self.batching_thread.start()
            
    def _batch_processor(self):
        """
        Background thread that processes batched requests
        """
        while True:
            try:
                # Get the first request
                _, request = self.request_queue.get(block=True)
                batch = [request]
                
                # Try to get more requests within the timeout
                batch_timeout = time.time() + (self.batch_timeout_ms / 1000)
                
                while time.time() < batch_timeout and len(batch) < self.config.get("max_batch_size", 4):
                    try:
                        _, next_request = self.request_queue.get(block=False)
                        batch.append(next_request)
                    except queue.Empty:
                        break
                
                # Process the batch
                self._process_batch(batch)
                
            except Exception as e:
                logger.error(f"Error in batch processor: {str(e)}")
                
    def _process_batch(self, batch: List[InferenceRequest]):
        """
        Process a batch of inference requests
        
        Args:
            batch: List of inference requests
        """
        if not batch:
            return
            
        # For now, process each request individually
        # In a real implementation, would send as a batch to the model backend
        for request in batch:
            self._process_request(request)
            
    def _process_request(self, request: InferenceRequest):
        """
        Process a single inference request
        
        Args:
            request: Inference request
        """
        # Make routing decision
        routing = self.route_request(request)
        
        # In a real implementation, would call the model backend
        # For now, simulate a response
        
        # Simulate processing time
        latency = routing.estimated_latency_ms / 1000  # Convert to seconds
        time.sleep(min(latency, 1.0))  # Cap at 1 second for simulation
        
        # Simulate token counts
        tokens_input = len(request.prompt.split())
        tokens_output = int(tokens_input * 0.8)  # Simulate response length
        
        # Create response
        response = InferenceResponse(
            request_id=request.request_id,
            output=f"Simulated response for: {request.prompt[:50]}...",
            model_used=routing.model_id,
            backend_used=routing.backend.value,
            tokens_input=tokens_input,
            tokens_output=tokens_output,
            latency_ms=routing.estimated_latency_ms,
            cost=routing.estimated_cost,
            status="success",
            metadata={
                "routing_reason": routing.reason
            }
        )
        
        # Record performance metrics
        self.performance_tracker.record_inference(
            routing.model_id,
            routing.estimated_latency_ms,
            True
        )
        
        # In a real implementation, would return the response to the caller
        logger.info(f"Processed request {request.request_id} using model {routing.model_id}")
        
    def route_request(self, request: InferenceRequest) -> RoutingDecision:
        """
        Determine the optimal model endpoint for an inference request
        
        Args:
            request: Inference request
            
        Returns:
            RoutingDecision: Routing decision details
        """
        if not self.models:
            raise ValueError("No models available for routing")
            
        # Filter models that can handle this request
        eligible_models = []
        
        for model_id, model in self.models.items():
            # Check if model supports streaming if requested
            if request.streaming and not model.supports_streaming:
                continue
                
            # Check if model can handle the requested max tokens
            if request.max_tokens > model.max_tokens:
                continue
                
            # Check if model has acceptable success rate
            success_rate = self.performance_tracker.get_success_rate(model_id)
            if success_rate < 0.9 and self.performance_tracker.get_metrics(model_id).get("total_requests", 0) > 10:
                continue
                
            eligible_models.append(model)
            
        if not eligible_models:
            # Fall back to any model if no eligible models
            eligible_models = list(self.models.values())
            
        # Score each eligible model
        model_scores = []
        
        for model in eligible_models:
            # Get performance metrics
            metrics = self.performance_tracker.get_metrics(model.model_id)
            
            # Use recent latency if available, otherwise use configured average
            latency = metrics.get("recent_avg_latency_ms", model.avg_latency_ms)
            
            # Calculate estimated cost
            tokens_input = len(request.prompt.split())
            estimated_tokens_output = min(request.max_tokens, model.max_tokens)
            total_tokens = tokens_input + estimated_tokens_output
            estimated_cost = (total_tokens / 1000) * model.cost_per_1k_tokens
            
            # Calculate success rate score (default to 1.0 if no data)
            success_rate = metrics.get("success_rate", 1.0)
            
            # Normalize metrics to 0-1 scale
            # Lower is better for latency and cost
            max_latency = 5000  # 5 seconds
            max_cost = 0.1  # $0.10
            
            norm_latency = 1.0 - min(latency / max_latency, 1.0)
            norm_cost = 1.0 - min(estimated_cost / max_cost, 1.0)
            
            # Calculate weighted score
            latency_weight = self.config.get("latency_weight", 0.4)
            cost_weight = self.config.get("cost_weight", 0.3)
            reliability_weight = self.config.get("reliability_weight", 0.3)
            
            score = (
                latency_weight * norm_latency +
                cost_weight * norm_cost +
                reliability_weight * success_rate
            )
            
            # Determine routing reason
            if norm_latency > norm_cost and norm_latency > success_rate:
                reason = "Optimized for low latency"
            elif norm_cost > norm_latency and norm_cost > success_rate:
                reason = "Optimized for low cost"
            else:
                reason = "Optimized for reliability"
                
            # Special case for high priority requests
            if request.priority == 1:
                reason = "High priority request - optimized for performance"
                score = score * 1.5
                
            model_scores.append((model, score, latency, estimated_cost, reason))
            
        # Select the model with the highest score
        selected_model, _, latency, cost, reason = max(model_scores, key=lambda x: x[1])
        
        return RoutingDecision(
            model_id=selected_model.model_id,
            backend=selected_model.backend,
            endpoint_url=selected_model.endpoint_url,
            estimated_latency_ms=latency,
            estimated_cost=cost,
            reason=reason
        )
        
    def submit_request(self, request: InferenceRequest) -> str:
        """
        Submit an inference request for processing
        
        Args:
            request: Inference request
            
        Returns:
            str: Request ID
        """
        # Add to queue with priority
        self.request_queue.put((request.priority, request))
        
        return request.request_id
        
    def add_model(self, model_config: Dict[str, Any]):
        """
        Add a new model to the registry
        
        Args:
            model_config: Model configuration
        """
        model_id = model_config["model_id"]
        
        self.models[model_id] = ModelConfig(
            model_id=model_id,
            name=model_config["name"],
            backend=ModelBackend(model_config["backend"]),
            endpoint_url=model_config["endpoint_url"],
            max_tokens=model_config.get("max_tokens", self.config["default_max_tokens"]),
            supports_batching=model_config.get("supports_batching", False),
            quantization=model_config.get("quantization"),
            cost_per_1k_tokens=model_config.get("cost_per_1k_tokens", 0.0),
            avg_latency_ms=model_config.get("avg_latency_ms", 100.0),
            max_batch_size=model_config.get("max_batch_size", 1),
            timeout_ms=model_config.get("timeout_ms", self.config["default_timeout_ms"]),
            supports_streaming=model_config.get("supports_streaming", False),
            metadata=model_config.get("metadata", {})
        )
        
    def remove_model(self, model_id: str):
        """
        Remove a model from the registry
        
        Args:
            model_id: ID of the model to remove
        """
        if model_id in self.models:
            del self.models[model_id]
            
    def get_model_metrics(self, model_id: str) -> Dict[str, Any]:
        """
        Get performance metrics for a model
        
        Args:
            model_id: ID of the model
            
        Returns:
            Dict[str, Any]: Performance metrics
        """
        return self.performance_tracker.get_metrics(model_id)
        
    def get_all_metrics(self) -> Dict[str, Dict[str, Any]]:
        """
        Get performance metrics for all models
        
        Returns:
            Dict[str, Dict[str, Any]]: Performance metrics by model ID
        """
        metrics = {}
        
        for model_id in self.models:
            metrics[model_id] = self.performance_tracker.get_metrics(model_id)
            
        return metrics


# Example usage
if __name__ == "__main__":
    # Create a configuration with automotive-specific models
    config = {
        "default_timeout_ms": 30000,
        "default_max_tokens": 1024,
        "enable_batching": True,
        "max_batch_size": 4,
        "batch_timeout_ms": 100,
        "cost_weight": 0.3,
        "latency_weight": 0.4,
        "reliability_weight": 0.3,
        "models": [
            {
                "model_id": "automotive-large",
                "name": "Automotive Industry Expert (Large)",
                "backend": "vllm",
                "endpoint_url": "http://inference-server:8000/v1/automotive-large",
                "max_tokens": 4096,
                "supports_batching": True,
                "quantization": None,
                "cost_per_1k_tokens": 0.01,
                "avg_latency_ms": 500,
                "max_batch_size": 4,
                "timeout_ms": 30000,
                "supports_streaming": True,
                "metadata": {
                    "description": "Large model specialized for automotive industry",
                    "parameters": "7B",
                    "specializations": ["dealership_operations", "vehicle_specs", "maintenance"]
                }
            },
            {
                "model_id": "automotive-medium-quantized",
                "name": "Automotive Industry Expert (Medium, Quantized)",
                "backend": "tensorrt",
                "endpoint_url": "http://inference-server:8000/v1/automotive-medium",
                "max_tokens": 2048,
                "supports_batching": True,
                "quantization": "int8",
                "cost_per_1k_tokens": 0.005,
                "avg_latency_ms": 200,
                "max_batch_size": 8,
                "timeout_ms": 15000,
                "supports_streaming": False,
                "metadata": {
                    "description": "Medium model optimized for automotive industry with int8 quantization",
                    "parameters": "3B",
                    "specializations": ["dealership_operations", "vehicle_specs"]
                }
            },
            {
                "model_id": "automotive-small",
                "name": "Automotive Industry Expert (Small)",
                "backend": "onnx",
                "endpoint_url": "http://inference-server:8000/v1/automotive-small",
                "max_tokens": 1024,
                "supports_batching": True,
                "quantization": "int4",
                "cost_per_1k_tokens": 0.001,
                "avg_latency_ms": 50,
                "max_batch_size": 16,
                "timeout_ms": 5000,
                "supports_streaming": False,
                "metadata": {
                    "description": "Small model for quick automotive queries",
                    "parameters": "1B",
                    "specializations": ["vehicle_specs", "quick_reference"]
                }
            }
        ]
    }
    
    # Initialize the Dynamic Inference Agent
    dia = DynamicInferenceAgent(config=config)
    
    # Example requests
    requests = [
        InferenceRequest(
            request_id="req-001",
            prompt="What are the key features of the 2025 Toyota Camry Hybrid?",
            max_tokens=1024,
            priority=2
        ),
        InferenceRequest(
            request_id="req-002",
            prompt="Explain the differences between regular and synthetic oil for a BMW X5.",
            max_tokens=2048,
            priority=3
        ),
        InferenceRequest(
            request_id="req-003",
            prompt="What's the recommended maintenance schedule for a Tesla Model Y?",
            max_tokens=512,
            priority=1,
            streaming=True
        )
    ]
    
    # Submit requests
    for request in requests:
        dia.submit_request(request)
        print(f"Submitted request {request.request_id}")
        
    # Wait for processing
    time.sleep(3)
    
    # Print metrics
    metrics = dia.get_all_metrics()
    print("\nModel Performance Metrics:")
    for model_id, model_metrics in metrics.items():
        print(f"\n{model_id}:")
        for key, value in model_metrics.items():
            print(f"  {key}: {value}")