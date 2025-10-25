"""
vLLM Model Warmup Script
Pre-loads and warms up the model to ensure optimal performance
"""

import asyncio
import logging
import time
import json
import os
from typing import Dict, Any, List

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class VLLMWarmup:
    """Handles model warmup and pre-loading"""

    def __init__(self, config_path: str = "../config/default.json"):
        self.config = self._load_config(config_path)
        self.warmup_prompts = self._get_warmup_prompts()

    def _load_config(self, config_path: str) -> Dict[str, Any]:
        """Load configuration from JSON file"""
        try:
            with open(config_path, 'r') as f:
                return json.load(f)
        except FileNotFoundError:
            logger.warning(f"Config file {config_path} not found, using defaults")
            return {
                "model": {
                    "name": "meta-llama/Llama-2-7b-chat-hf",
                    "tensor_parallel_size": 1,
                    "gpu_memory_utilization": 0.9
                }
            }

    def _get_warmup_prompts(self) -> List[str]:
        """Get warmup prompts for different use cases"""
        return [
            # General conversation
            "Hello, how are you today?",

            # Code generation
            "Write a Python function to calculate fibonacci numbers",

            # Data analysis
            "Explain the difference between mean and median",

            # Creative writing
            "Write a short story about artificial intelligence",

            # Technical explanation
            "Explain how neural networks work",

            # Question answering
            "What is the capital of France?",

            # Instruction following
            "List the steps to bake chocolate chip cookies",

            # Reasoning tasks
            "If all cats are mammals and some mammals are pets, are all cats pets? Explain your reasoning.",

            # Summarization
            "Summarize the benefits of renewable energy",

            # Translation
            "Translate 'Hello world' to Spanish",

            # Long-form content
            "Write a detailed explanation of climate change and its impacts on global ecosystems"
        ]

    async def check_service_health(self, max_attempts: int = 30) -> bool:
        """Check if vLLM service is healthy"""
        import aiohttp

        for attempt in range(max_attempts):
            try:
                async with aiohttp.ClientSession() as session:
                    async with session.get('http://localhost:8001/health') as response:
                        if response.status == 200:
                            data = await response.json()
                            if data.get('vllm_initialized'):
                                logger.info("✅ vLLM service is healthy and model is loaded")
                                return True
                            else:
                                logger.info(f"Service responding but model not ready (attempt {attempt + 1}/{max_attempts})")
                        else:
                            logger.warning(f"Service unhealthy (attempt {attempt + 1}/{max_attempts})")
            except Exception as e:
                logger.warning(f"Health check failed (attempt {attempt + 1}/{max_attempts}): {e}")

            await asyncio.sleep(2)

        return False

    async def run_warmup_inference(self) -> bool:
        """Run warmup inference requests"""
        import aiohttp

        logger.info("🔥 Starting model warmup with sample prompts...")

        async with aiohttp.ClientSession() as session:
            for i, prompt in enumerate(self.warmup_prompts[:5]):  # Use first 5 prompts
                try:
                    logger.info(f"Warming up with prompt {i + 1}/5")

                    payload = {
                        "prompt": prompt,
                        "temperature": 0.7,
                        "max_tokens": 100,
                        "cache": False  # Don't cache warmup requests
                    }

                    async with session.post(
                        'http://localhost:8001/v1/generate',
                        json=payload,
                        timeout=aiohttp.ClientTimeout(total=30)
                    ) as response:
                        if response.status == 200:
                            data = await response.json()
                            logger.info(f"✅ Warmup request {i + 1} successful")
                        else:
                            logger.warning(f"❌ Warmup request {i + 1} failed: {response.status}")

                except Exception as e:
                    logger.error(f"❌ Warmup request {i + 1} error: {e}")
                    return False

                # Small delay between requests
                await asyncio.sleep(0.5)

        logger.info("🎉 Model warmup completed successfully")
        return True

    async def validate_performance(self) -> Dict[str, Any]:
        """Validate model performance after warmup"""
        import aiohttp

        logger.info("📊 Validating model performance...")

        try:
            async with aiohttp.ClientSession() as session:
                # Get metrics
                async with session.get('http://localhost:8001/v1/metrics') as response:
                    if response.status == 200:
                        metrics = await response.json()
                        logger.info("📈 Performance metrics retrieved")

                        # Validate key metrics
                        model_metrics = metrics.get('model_metrics', {})
                        gpu_info = metrics.get('gpu_info', {})

                        validation = {
                            "model_loaded": model_metrics.get('model_name') is not None,
                            "gpu_available": gpu_info.get('available', False),
                            "memory_usage": model_metrics.get('gpu_memory_used_gb', 0),
                            "average_latency": model_metrics.get('average_latency_ms', 0),
                            "health_status": metrics.get('health_status', 'unknown')
                        }

                        logger.info(f"✅ Performance validation: {validation}")
                        return validation
                    else:
                        logger.error(f"❌ Failed to get metrics: {response.status}")
                        return {"error": f"Metrics request failed: {response.status}"}

        except Exception as e:
            logger.error(f"❌ Performance validation error: {e}")
            return {"error": str(e)}

    async def run_warmup(self) -> bool:
        """Run complete warmup process"""
        logger.info("🚀 Starting vLLM model warmup process")

        # Step 1: Wait for service to be healthy
        logger.info("⏳ Waiting for vLLM service to be ready...")
        if not await self.check_service_health():
            logger.error("❌ Service failed to become healthy")
            return False

        # Step 2: Run warmup inference
        if not await self.run_warmup_inference():
            logger.error("❌ Warmup inference failed")
            return False

        # Step 3: Validate performance
        validation = await self.validate_performance()
        if "error" in validation:
            logger.error(f"❌ Performance validation failed: {validation['error']}")
            return False

        # Step 4: Final health check
        logger.info("🔍 Running final health check...")
        if not await self.check_service_health(5):
            logger.error("❌ Final health check failed")
            return False

        logger.info("🎊 vLLM warmup process completed successfully!")
        logger.info("📋 Warmup Summary:")
        logger.info(f"   - Model: {self.config['model']['name']}")
        logger.info(f"   - Warmup prompts: {len(self.warmup_prompts[:5])}")
        logger.info(f"   - Performance validated: ✅")

        return True

async def main():
    """Main warmup execution"""
    warmup = VLLMWarmup()

    success = await warmup.run_warmup()
    exit(0 if success else 1)

if __name__ == "__main__":
    asyncio.run(main())

