"""
Auterity vLLM High-Throughput AI Model Serving Service
Provides GPU-accelerated AI model inference with optimized performance
"""

import asyncio
import logging
import time
import json
from typing import Dict, List, Any, Optional, Union
from dataclasses import dataclass, asdict
from datetime import datetime
from contextlib import asynccontextmanager

import uvicorn
from fastapi import FastAPI, HTTPException, Request, BackgroundTasks
from fastapi.responses import JSONResponse, StreamingResponse
from pydantic import BaseModel, Field
import redis
import torch
from transformers import AutoTokenizer

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Global instances
redis_client = redis.Redis(host='localhost', port=6379, db=3, decode_responses=True)
model_cache = {}
performance_metrics = {
    'total_requests': 0,
    'successful_requests': 0,
    'failed_requests': 0,
    'total_tokens': 0,
    'average_latency': 0.0,
    'gpu_memory_usage': 0.0
}

@dataclass
class VLLMConfig:
    """Configuration for vLLM service"""
    model_name: str = "meta-llama/Llama-2-7b-chat-hf"
    tensor_parallel_size: int = 1
    gpu_memory_utilization: float = 0.9
    max_model_len: int = 4096
    max_batch_size: int = 32
    dtype: str = "auto"
    quantization: Optional[str] = None
    trust_remote_code: bool = True
    enforce_eager: bool = False

@dataclass
class ModelMetrics:
    """Real-time model performance metrics"""
    model_name: str
    requests_per_second: float
    average_latency_ms: float
    gpu_memory_used_gb: float
    gpu_memory_total_gb: float
    active_requests: int
    queue_depth: int
    cache_hit_rate: float
    last_updated: datetime

class VLLMManager:
    """Manages vLLM model instances and GPU resources"""

    def __init__(self, config: VLLMConfig):
        self.config = config
        self.llm = None
        self.tokenizer = None
        self.is_initialized = False
        self.request_queue = asyncio.Queue(maxsize=1000)
        self.active_requests = 0
        self.metrics = ModelMetrics(
            model_name=config.model_name,
            requests_per_second=0.0,
            average_latency_ms=0.0,
            gpu_memory_used_gb=0.0,
            gpu_memory_total_gb=0.0,
            active_requests=0,
            queue_depth=0,
            cache_hit_rate=0.0,
            last_updated=datetime.now()
        )

    async def initialize(self) -> bool:
        """Initialize vLLM model with GPU optimization"""
        try:
            logger.info(f"Initializing vLLM with model: {self.config.model_name}")

            # Dynamic import to handle optional dependencies
            try:
                from vllm import LLM, SamplingParams
                from vllm.engine.arg_utils import EngineArgs
            except ImportError as e:
                logger.error(f"vLLM not installed: {e}")
                logger.info("Installing vLLM...")
                # Auto-install vLLM if not present
                import subprocess
                import sys
                subprocess.check_call([sys.executable, "-m", "pip", "install", "vllm"])
                from vllm import LLM, SamplingParams
                from vllm.engine.arg_utils import EngineArgs

            # Configure engine arguments
            engine_args = EngineArgs(
                model=self.config.model_name,
                tensor_parallel_size=self.config.tensor_parallel_size,
                gpu_memory_utilization=self.config.gpu_memory_utilization,
                max_model_len=self.config.max_model_len,
                max_batch_size=self.config.max_batch_size,
                dtype=self.config.dtype,
                quantization=self.config.quantization,
                trust_remote_code=self.config.trust_remote_code,
                enforce_eager=self.config.enforce_eager,
            )

            # Initialize vLLM
            self.llm = LLM(engine_args)

            # Load tokenizer for preprocessing
            try:
                from transformers import AutoTokenizer
                self.tokenizer = AutoTokenizer.from_pretrained(
                    self.config.model_name,
                    trust_remote_code=self.config.trust_remote_code
                )
            except Exception as e:
                logger.warning(f"Could not load tokenizer: {e}")
                # Fallback tokenizer
                self.tokenizer = None

            # Update GPU memory metrics
            if torch.cuda.is_available():
                self.metrics.gpu_memory_total_gb = torch.cuda.get_device_properties(0).total_memory / (1024**3)
                self.metrics.gpu_memory_used_gb = torch.cuda.memory_allocated(0) / (1024**3)

            self.is_initialized = True
            logger.info("✅ vLLM initialization completed successfully")
            return True

        except Exception as e:
            logger.error(f"❌ vLLM initialization failed: {e}")
            self.is_initialized = False
            return False

    async def generate(self, request: 'GenerationRequest') -> Dict[str, Any]:
        """Generate text using vLLM with optimized performance"""
        if not self.is_initialized or not self.llm:
            raise HTTPException(status_code=503, detail="Model not initialized")

        start_time = time.time()
        self.active_requests += 1

        try:
            # Check cache first
            cache_key = self._generate_cache_key(request)
            cached_result = redis_client.get(cache_key)

            if cached_result and not request.stream:
                self.metrics.cache_hit_rate = (self.metrics.cache_hit_rate + 1) / 2
                return json.loads(cached_result)

            self.metrics.cache_hit_rate = (self.metrics.cache_hit_rate * 0.9)  # Decay

            # Import sampling parameters
            try:
                from vllm import SamplingParams
            except ImportError:
                # Fallback if vLLM not available
                return await self._fallback_generation(request)

            # Configure sampling parameters
            sampling_params = SamplingParams(
                temperature=request.temperature,
                top_p=request.top_p,
                top_k=request.top_k,
                max_tokens=request.max_tokens,
                stop=request.stop_sequences or [],
                repetition_penalty=request.repetition_penalty,
                presence_penalty=request.presence_penalty,
                frequency_penalty=request.frequency_penalty,
            )

            # Prepare prompts for batch processing
            prompts = [request.prompt]

            # Generate responses
            outputs = self.llm.generate(prompts, sampling_params)
            output = outputs[0]

            # Extract response
            response_text = output.outputs[0].text

            # Calculate token usage
            prompt_tokens = len(request.prompt.split())
            completion_tokens = len(response_text.split())
            total_tokens = prompt_tokens + completion_tokens

            # Update global metrics
            performance_metrics['total_requests'] += 1
            performance_metrics['successful_requests'] += 1
            performance_metrics['total_tokens'] += total_tokens

            # Calculate latency
            latency = (time.time() - start_time) * 1000
            performance_metrics['average_latency'] = (
                performance_metrics['average_latency'] + latency
            ) / 2

            # Update model metrics
            self.metrics.average_latency_ms = (
                self.metrics.average_latency_ms + latency
            ) / 2
            self.metrics.last_updated = datetime.now()

            # Prepare response
            result = {
                "response": response_text,
                "usage": {
                    "prompt_tokens": prompt_tokens,
                    "completion_tokens": completion_tokens,
                    "total_tokens": total_tokens
                },
                "performance": {
                    "latency_ms": round(latency, 2),
                    "model": self.config.model_name,
                    "timestamp": datetime.now().isoformat()
                },
                "metadata": {
                    "finish_reason": output.outputs[0].finish_reason,
                    "cached": False
                }
            }

            # Cache result if not streaming
            if not request.stream and len(request.prompt) < 1000:
                redis_client.setex(cache_key, 3600, json.dumps(result))  # Cache for 1 hour

            return result

        except Exception as e:
            performance_metrics['failed_requests'] += 1
            logger.error(f"Generation failed: {e}")
            raise HTTPException(status_code=500, detail=f"Generation failed: {str(e)}")

        finally:
            self.active_requests -= 1

    async def _fallback_generation(self, request: 'GenerationRequest') -> Dict[str, Any]:
        """Fallback generation when vLLM is not available"""
        logger.warning("Using fallback generation - vLLM not available")

        # Simple fallback using transformers
        try:
            from transformers import pipeline

            # Use a smaller model for fallback
            generator = pipeline(
                "text-generation",
                model="distilgpt2",
                device=0 if torch.cuda.is_available() else -1
            )

            outputs = generator(
                request.prompt,
                max_length=len(request.prompt.split()) + request.max_tokens,
                temperature=request.temperature,
                do_sample=True,
                pad_token_id=50256
            )

            response_text = outputs[0]['generated_text'][len(request.prompt):].strip()

            return {
                "response": response_text,
                "usage": {
                    "prompt_tokens": len(request.prompt.split()),
                    "completion_tokens": len(response_text.split()),
                    "total_tokens": len(request.prompt.split()) + len(response_text.split())
                },
                "performance": {
                    "latency_ms": 1000,  # Estimated
                    "model": "distilgpt2-fallback",
                    "timestamp": datetime.now().isoformat()
                },
                "metadata": {
                    "finish_reason": "fallback",
                    "cached": False,
                    "warning": "Using fallback model - vLLM not available"
                }
            }

        except Exception as e:
            logger.error(f"Fallback generation failed: {e}")
            raise HTTPException(status_code=500, detail="All generation methods failed")

    def _generate_cache_key(self, request: 'GenerationRequest') -> str:
        """Generate cache key for request"""
        key_data = {
            'prompt': request.prompt[:500],  # Limit prompt length for cache key
            'temperature': request.temperature,
            'top_p': request.top_p,
            'max_tokens': request.max_tokens,
            'model': self.config.model_name
        }
        return f"vllm:{hash(json.dumps(key_data, sort_keys=True))}"

    async def get_metrics(self) -> Dict[str, Any]:
        """Get comprehensive service metrics"""
        # Update queue depth
        self.metrics.queue_depth = self.request_queue.qsize()
        self.metrics.active_requests = self.active_requests

        # Calculate requests per second (simple estimation)
        current_time = time.time()
        time_window = 60  # 1 minute window
        recent_requests = performance_metrics['total_requests']

        self.metrics.requests_per_second = recent_requests / max(time_window, 1)

        return {
            "model_metrics": asdict(self.metrics),
            "global_metrics": performance_metrics.copy(),
            "gpu_info": await self._get_gpu_info(),
            "health_status": "healthy" if self.is_initialized else "unhealthy"
        }

    async def _get_gpu_info(self) -> Dict[str, Any]:
        """Get GPU information"""
        if not torch.cuda.is_available():
            return {"available": False}

        try:
            device_count = torch.cuda.device_count()
            devices = []

            for i in range(device_count):
                props = torch.cuda.get_device_properties(i)
                memory_allocated = torch.cuda.memory_allocated(i) / (1024**3)
                memory_reserved = torch.cuda.memory_reserved(i) / (1024**3)

                devices.append({
                    "id": i,
                    "name": props.name,
                    "total_memory_gb": props.total_memory / (1024**3),
                    "allocated_memory_gb": memory_allocated,
                    "reserved_memory_gb": memory_reserved,
                    "utilization": memory_allocated / (props.total_memory / (1024**3))
                })

            return {
                "available": True,
                "device_count": device_count,
                "devices": devices
            }

        except Exception as e:
            logger.error(f"Error getting GPU info: {e}")
            return {"available": False, "error": str(e)}

class GenerationRequest(BaseModel):
    """Request model for text generation"""
    prompt: str = Field(..., min_length=1, max_length=10000)
    temperature: float = Field(0.7, ge=0.0, le=2.0)
    top_p: float = Field(1.0, ge=0.0, le=1.0)
    top_k: Optional[int] = Field(None, ge=1, le=100)
    max_tokens: int = Field(500, ge=1, le=4096)
    stop_sequences: Optional[List[str]] = None
    repetition_penalty: float = Field(1.0, ge=0.0, le=2.0)
    presence_penalty: float = Field(0.0, ge=-2.0, le=2.0)
    frequency_penalty: float = Field(0.0, ge=-2.0, le=2.0)
    stream: bool = False
    cache: bool = True

# Global vLLM manager instance
vllm_manager = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    global vllm_manager

    # Startup
    logger.info("🚀 Starting Auterity vLLM Service")

    config = VLLMConfig()
    vllm_manager = VLLMManager(config)

    # Initialize vLLM
    init_success = await vllm_manager.initialize()
    if not init_success:
        logger.warning("⚠️ vLLM initialization failed - using fallback mode")

    yield

    # Shutdown
    logger.info("🛑 Shutting down Auterity vLLM Service")

# Create FastAPI application
app = FastAPI(
    title="Auterity vLLM Service",
    description="High-throughput AI model serving with GPU acceleration",
    version="1.0.0",
    lifespan=lifespan
)

@app.get("/")
async def root():
    """Service information endpoint"""
    return {
        "service": "Auterity vLLM Service",
        "version": "1.0.0",
        "description": "High-throughput AI model serving with GPU acceleration",
        "status": "running"
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    global vllm_manager

    if not vllm_manager:
        return JSONResponse(
            status_code=503,
            content={"status": "unhealthy", "message": "Service not initialized"}
        )

    health_status = {
        "status": "healthy" if vllm_manager.is_initialized else "degraded",
        "vllm_initialized": vllm_manager.is_initialized,
        "active_requests": vllm_manager.active_requests,
        "queue_depth": vllm_manager.metrics.queue_depth,
        "timestamp": datetime.now().isoformat()
    }

    return health_status

@app.post("/v1/generate")
async def generate_text(request: GenerationRequest):
    """Generate text using vLLM"""
    global vllm_manager

    if not vllm_manager:
        raise HTTPException(status_code=503, detail="Service not initialized")

    return await vllm_manager.generate(request)

@app.get("/v1/metrics")
async def get_metrics():
    """Get service metrics"""
    global vllm_manager

    if not vllm_manager:
        raise HTTPException(status_code=503, detail="Service not initialized")

    return await vllm_manager.get_metrics()

@app.post("/v1/models/load")
async def load_model(model_name: str):
    """Load a different model (future enhancement)"""
    return {
        "message": "Model loading not yet implemented",
        "requested_model": model_name,
        "current_model": vllm_manager.config.model_name if vllm_manager else None
    }

@app.get("/v1/models")
async def list_models():
    """List available models"""
    return {
        "current_model": vllm_manager.config.model_name if vllm_manager else None,
        "available_models": [
            "meta-llama/Llama-2-7b-chat-hf",
            "meta-llama/Llama-2-13b-chat-hf",
            "meta-llama/Llama-2-70b-chat-hf",
            "mistralai/Mistral-7B-Instruct-v0.1",
            "microsoft/DialoGPT-medium",
            # Add more models as they become available
        ],
        "note": "Model switching requires service restart"
    }

if __name__ == "__main__":
    uvicorn.run(
        "vllm_service:app",
        host="0.0.0.0",
        port=8001,
        reload=True,
        log_level="info"
    )

