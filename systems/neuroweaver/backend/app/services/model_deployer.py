"""
NeuroWeaver Model Deployment Service
Handles model deployment with health checks and monitoring
"""

import asyncio
import logging
import json
import aiohttp
from datetime import datetime
from typing import Dict, Optional, List
from dataclasses import dataclass

from app.core.config import settings
from app.services.model_registry import ModelRegistry, ModelInfo

logger = logging.getLogger(__name__)

@dataclass
class DeploymentConfig:
    """Configuration for model deployment"""
    replicas: int = 1
    memory_limit: str = "2Gi"
    cpu_limit: str = "1000m"
    gpu_required: bool = False
    auto_scaling: bool = True
    health_check_path: str = "/health"
    health_check_interval: int = 30
    max_response_time: int = 5000  # milliseconds

@dataclass
class HealthCheckResult:
    """Result of a health check"""
    is_healthy: bool
    response_time_ms: int
    status_code: Optional[int] = None
    error_message: Optional[str] = None
    timestamp: datetime = None

    def __post_init__(self):
        if self.timestamp is None:
            self.timestamp = datetime.utcnow()

class ModelDeployer:
    """Service for deploying and managing model instances"""
    
    def __init__(self):
        self.model_registry = ModelRegistry()
        self.deployed_models: Dict[str, Dict] = {}
        self.health_check_tasks: Dict[str, asyncio.Task] = {}
        
    async def deploy_model(self, model_id: str, deployment_config: Dict) -> Dict:
        """Deploy a model for inference"""
        try:
            # Get model information
            model = await self.model_registry.get_model(model_id)
            if not model:
                raise ValueError(f"Model {model_id} not found")
            
            # Parse deployment configuration
            config = DeploymentConfig(**deployment_config)
            
            # Create deployment
            deployment_info = await self._create_deployment(model, config)
            
            # Start health monitoring
            await self._start_health_monitoring(model_id, deployment_info)
            
            # Update model registry with deployment info
            model.deployment_info = deployment_info
            model.status = "deployed"
            await self.model_registry.update_model(model)
            
            logger.info(f"Model {model_id} deployed successfully")
            return deployment_info
            
        except Exception as e:
            logger.error(f"Failed to deploy model {model_id}: {e}")
            raise
    
    async def undeploy_model(self, model_id: str) -> bool:
        """Undeploy a model and clean up resources"""
        try:
            # Stop health monitoring
            if model_id in self.health_check_tasks:
                self.health_check_tasks[model_id].cancel()
                del self.health_check_tasks[model_id]
            
            # Remove deployment
            if model_id in self.deployed_models:
                deployment_info = self.deployed_models[model_id]
                await self._remove_deployment(deployment_info)
                del self.deployed_models[model_id]
            
            # Update model status
            model = await self.model_registry.get_model(model_id)
            if model:
                model.status = "undeployed"
                model.deployment_info = None
                await self.model_registry.update_model(model)
            
            logger.info(f"Model {model_id} undeployed successfully")
            return True
            
        except Exception as e:
            logger.error(f"Failed to undeploy model {model_id}: {e}")
            return False
    
    async def get_deployment_status(self, model_id: str) -> Optional[Dict]:
        """Get current deployment status for a model"""
        if model_id not in self.deployed_models:
            return None
        
        deployment_info = self.deployed_models[model_id]
        
        # Perform health check
        health_result = await self._perform_health_check(deployment_info)
        
        return {
            "model_id": model_id,
            "status": "healthy" if health_result.is_healthy else "unhealthy",
            "endpoint": deployment_info.get("endpoint"),
            "replicas": deployment_info.get("replicas", 1),
            "last_health_check": health_result.timestamp.isoformat(),
            "response_time_ms": health_result.response_time_ms,
            "error_message": health_result.error_message
        }
    
    async def list_deployments(self) -> List[Dict]:
        """List all current deployments"""
        deployments = []
        
        for model_id in self.deployed_models:
            status = await self.get_deployment_status(model_id)
            if status:
                deployments.append(status)
        
        return deployments
    
    async def scale_deployment(self, model_id: str, replicas: int) -> bool:
        """Scale a deployment to specified number of replicas"""
        try:
            if model_id not in self.deployed_models:
                raise ValueError(f"Model {model_id} is not deployed")
            
            deployment_info = self.deployed_models[model_id]
            
            # Update replica count (placeholder for actual scaling logic)
            deployment_info["replicas"] = replicas
            
            logger.info(f"Scaled model {model_id} to {replicas} replicas")
            return True
            
        except Exception as e:
            logger.error(f"Failed to scale model {model_id}: {e}")
            return False
    
    async def _create_deployment(self, model: ModelInfo, config: DeploymentConfig) -> Dict:
        """Create actual deployment (placeholder implementation)"""
        # In a real implementation, this would:
        # 1. Create Kubernetes deployment
        # 2. Set up load balancer
        # 3. Configure auto-scaling
        # 4. Set up monitoring
        
        # For now, simulate deployment creation
        endpoint = f"http://neuroweaver-{model.id}:8080"
        
        deployment_info = {
            "deployment_id": f"deploy-{model.id}",
            "model_id": model.id,
            "endpoint": endpoint,
            "replicas": config.replicas,
            "status": "running",
            "created_at": datetime.utcnow().isoformat(),
            "config": {
                "memory_limit": config.memory_limit,
                "cpu_limit": config.cpu_limit,
                "gpu_required": config.gpu_required,
                "auto_scaling": config.auto_scaling
            },
            "health_check": {
                "path": config.health_check_path,
                "interval": config.health_check_interval,
                "max_response_time": config.max_response_time
            }
        }
        
        # Store deployment info
        self.deployed_models[model.id] = deployment_info
        
        return deployment_info
    
    async def _remove_deployment(self, deployment_info: Dict) -> None:
        """Remove deployment resources"""
        # In a real implementation, this would:
        # 1. Delete Kubernetes deployment
        # 2. Remove load balancer
        # 3. Clean up volumes
        # 4. Remove monitoring
        
        logger.info(f"Removed deployment {deployment_info['deployment_id']}")
    
    async def _start_health_monitoring(self, model_id: str, deployment_info: Dict) -> None:
        """Start health monitoring for a deployment"""
        if model_id in self.health_check_tasks:
            self.health_check_tasks[model_id].cancel()
        
        task = asyncio.create_task(
            self._health_monitor_loop(model_id, deployment_info)
        )
        self.health_check_tasks[model_id] = task
    
    async def _health_monitor_loop(self, model_id: str, deployment_info: Dict) -> None:
        """Continuous health monitoring loop"""
        interval = deployment_info["health_check"]["interval"]
        
        while True:
            try:
                health_result = await self._perform_health_check(deployment_info)
                
                # Update deployment status
                if model_id in self.deployed_models:
                    self.deployed_models[model_id]["last_health_check"] = health_result.timestamp.isoformat()
                    self.deployed_models[model_id]["health_status"] = "healthy" if health_result.is_healthy else "unhealthy"
                
                # Handle unhealthy status
                if not health_result.is_healthy:
                    await self._handle_unhealthy_deployment(model_id, health_result)
                
                await asyncio.sleep(interval)
                
            except asyncio.CancelledError:
                logger.info(f"Health monitoring cancelled for model {model_id}")
                break
            except Exception as e:
                logger.error(f"Health monitoring error for model {model_id}: {e}")
                await asyncio.sleep(interval)
    
    async def _perform_health_check(self, deployment_info: Dict) -> HealthCheckResult:
        """Perform health check on deployment"""
        endpoint = deployment_info["endpoint"]
        health_path = deployment_info["health_check"]["path"]
        max_response_time = deployment_info["health_check"]["max_response_time"]
        
        url = f"{endpoint}{health_path}"
        start_time = datetime.utcnow()
        
        try:
            timeout = aiohttp.ClientTimeout(total=max_response_time / 1000)
            async with aiohttp.ClientSession(timeout=timeout) as session:
                async with session.get(url) as response:
                    end_time = datetime.utcnow()
                    response_time_ms = int((end_time - start_time).total_seconds() * 1000)
                    
                    is_healthy = response.status == 200 and response_time_ms <= max_response_time
                    
                    return HealthCheckResult(
                        is_healthy=is_healthy,
                        response_time_ms=response_time_ms,
                        status_code=response.status,
                        timestamp=end_time
                    )
        
        except Exception as e:
            end_time = datetime.utcnow()
            response_time_ms = int((end_time - start_time).total_seconds() * 1000)
            
            return HealthCheckResult(
                is_healthy=False,
                response_time_ms=response_time_ms,
                error_message=str(e),
                timestamp=end_time
            )
    
    async def _handle_unhealthy_deployment(self, model_id: str, health_result: HealthCheckResult) -> None:
        """Handle unhealthy deployment"""
        logger.warning(f"Model {model_id} is unhealthy: {health_result.error_message}")
        
        # Update model status
        model = await self.model_registry.get_model(model_id)
        if model:
            model.status = "unhealthy"
            await self.model_registry.update_model(model)
        
        # Could implement automatic restart/recovery logic here
    
    async def get_deployment_logs(self, model_id: str, lines: int = 100) -> List[str]:
        """Get deployment logs"""
        # Placeholder for log retrieval
        return [
            f"[{datetime.utcnow().isoformat()}] Model {model_id} started",
            f"[{datetime.utcnow().isoformat()}] Health check passed",
            f"[{datetime.utcnow().isoformat()}] Serving requests on port 8080"
        ]
    
    async def get_deployment_metrics(self, model_id: str) -> Dict:
        """Get deployment metrics"""
        # Placeholder for metrics collection
        return {
            "requests_per_second": 10.5,
            "average_response_time_ms": 150,
            "error_rate": 0.01,
            "cpu_usage_percent": 45.2,
            "memory_usage_mb": 1024,
            "active_connections": 5
        }