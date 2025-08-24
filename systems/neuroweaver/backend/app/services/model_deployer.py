"""
NeuroWeaver Model Deployment Service
Handles model deployment with health checks and monitoring
"""

import asyncio
import logging
import json

try:
    import aiohttp
    import yaml
    HTTP_AVAILABLE = True
except ImportError:
    HTTP_AVAILABLE = False
    logger = logging.getLogger(__name__)
    logger.warning("HTTP libraries not available. Deployment functionality will be limited.")
from datetime import datetime, timedelta
from typing import Dict, Optional, List, Any
from dataclasses import dataclass, asdict
from pathlib import Path

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
        if not HTTP_AVAILABLE:
            return HealthCheckResult(
                is_healthy=False,
                response_time_ms=0,
                error_message="HTTP client not available",
                timestamp=datetime.utcnow()
            )
        
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

    async def create_kubernetes_deployment(self, model: ModelInfo, config: DeploymentConfig) -> Dict:
        """Create Kubernetes deployment for model"""
        try:
            # Create deployment manifest
            deployment_manifest = self._generate_deployment_manifest(model, config)
            service_manifest = self._generate_service_manifest(model, config)

            # Apply manifests to Kubernetes
            deployment_result = await self._apply_kubernetes_manifest(deployment_manifest)
            service_result = await self._apply_kubernetes_manifest(service_manifest)

            # Create deployment info
            deployment_info = {
                "deployment_id": f"deploy-{model.id}",
                "model_id": model.id,
                "endpoint": f"http://{model.name}-{model.specialization}:8080",
                "replicas": config.replicas,
                "status": "creating",
                "created_at": datetime.utcnow().isoformat(),
                "kubernetes": {
                    "deployment_name": f"{model.name}-{model.specialization}",
                    "service_name": f"{model.name}-{model.specialization}",
                    "namespace": "neuroweaver-models",
                    "deployment_uid": deployment_result.get("metadata", {}).get("uid"),
                    "service_uid": service_result.get("metadata", {}).get("uid")
                },
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

            return deployment_info

        except Exception as e:
            logger.error(f"Failed to create Kubernetes deployment for model {model.id}: {e}")
            raise

    def _generate_deployment_manifest(self, model: ModelInfo, config: DeploymentConfig) -> Dict:
        """Generate Kubernetes deployment manifest"""
        manifest = {
            "apiVersion": "apps/v1",
            "kind": "Deployment",
            "metadata": {
                "name": f"{model.name}-{model.specialization}",
                "namespace": "neuroweaver-models",
                "labels": {
                    "app": "neuroweaver-model",
                    "model": model.name,
                    "version": model.version,
                    "specialization": model.specialization
                }
            },
            "spec": {
                "replicas": config.replicas,
                "selector": {
                    "matchLabels": {
                        "app": "neuroweaver-model",
                        "model": model.name,
                        "version": model.version
                    }
                },
                "template": {
                    "metadata": {
                        "labels": {
                            "app": "neuroweaver-model",
                            "model": model.name,
                            "version": model.version,
                            "specialization": model.specialization
                        }
                    },
                    "spec": {
                        "containers": [
                            {
                                "name": "model-server",
                                "image": f"neuroweaver/{model.name}:{model.version}",
                                "ports": [
                                    {
                                        "containerPort": 8080,
                                        "name": "http"
                                    }
                                ],
                                "env": [
                                    {
                                        "name": "MODEL_PATH",
                                        "value": f"/models/{model.name}/{model.version}"
                                    },
                                    {
                                        "name": "SPECIALIZATION",
                                        "value": model.specialization
                                    }
                                ],
                                "resources": {
                                    "limits": {
                                        "cpu": config.cpu_limit,
                                        "memory": config.memory_limit
                                    },
                                    "requests": {
                                        "cpu": "500m",
                                        "memory": "1Gi"
                                    }
                                },
                                "livenessProbe": {
                                    "httpGet": {
                                        "path": config.health_check_path,
                                        "port": 8080
                                    },
                                    "initialDelaySeconds": 30,
                                    "periodSeconds": config.health_check_interval,
                                    "timeoutSeconds": 5,
                                    "failureThreshold": 3
                                },
                                "readinessProbe": {
                                    "httpGet": {
                                        "path": config.health_check_path,
                                        "port": 8080
                                    },
                                    "initialDelaySeconds": 5,
                                    "periodSeconds": 10,
                                    "timeoutSeconds": 3
                                },
                                "volumeMounts": [
                                    {
                                        "name": "model-storage",
                                        "mountPath": "/models",
                                        "readOnly": True
                                    }
                                ]
                            }
                        ],
                        "volumes": [
                            {
                                "name": "model-storage",
                                "persistentVolumeClaim": {
                                    "claimName": "neuroweaver-models-pvc"
                                }
                            }
                        ]
                    }
                }
            }
        }

        # Add GPU resources if required
        if config.gpu_required:
            manifest["spec"]["template"]["spec"]["containers"][0]["resources"]["limits"]["nvidia.com/gpu"] = "1"
            manifest["spec"]["template"]["spec"]["containers"][0]["resources"]["requests"]["nvidia.com/gpu"] = "1"
            manifest["spec"]["template"]["spec"]["nodeSelector"] = {"accelerator": "nvidia-tesla-k80"}

        return manifest

    def _generate_service_manifest(self, model: ModelInfo, config: DeploymentConfig) -> Dict:
        """Generate Kubernetes service manifest"""
        return {
            "apiVersion": "v1",
            "kind": "Service",
            "metadata": {
                "name": f"{model.name}-{model.specialization}",
                "namespace": "neuroweaver-models",
                "labels": {
                    "app": "neuroweaver-model",
                    "model": model.name,
                    "version": model.version,
                    "specialization": model.specialization
                }
            },
            "spec": {
                "selector": {
                    "app": "neuroweaver-model",
                    "model": model.name,
                    "version": model.version
                },
                "ports": [
                    {
                        "name": "http",
                        "port": 8080,
                        "targetPort": 8080,
                        "protocol": "TCP"
                    }
                ],
                "type": "ClusterIP"
            }
        }

    async def _apply_kubernetes_manifest(self, manifest: Dict) -> Dict:
        """Apply Kubernetes manifest using kubectl or API"""
        try:
            # In a real implementation, this would use the Kubernetes Python client
            # For now, we'll simulate the application

            # Convert manifest to YAML
            if 'yaml' in globals() and yaml:
                manifest_yaml = yaml.dump(manifest, default_flow_style=False)
            else:
                manifest_yaml = str(manifest)  # Fallback to string representation

            # Simulate applying to Kubernetes
            # In production, you would use:
            # from kubernetes import client, config
            # config.load_kube_config()
            # api = client.AppsV1Api()
            # api.create_namespaced_deployment(namespace=manifest["metadata"]["namespace"], body=manifest)

            logger.info(f"Applied Kubernetes manifest for {manifest['metadata']['name']}")

            # Return simulated result
            return {
                "metadata": {
                    "name": manifest["metadata"]["name"],
                    "namespace": manifest["metadata"]["namespace"],
                    "uid": f"uid-{manifest['metadata']['name']}-{int(datetime.utcnow().timestamp())}"
                },
                "status": "created"
            }

        except Exception as e:
            logger.error(f"Failed to apply Kubernetes manifest: {e}")
            raise

    async def create_horizontal_pod_autoscaler(self, model: ModelInfo, config: DeploymentConfig) -> Dict:
        """Create HPA for auto-scaling"""
        try:
            hpa_manifest = {
                "apiVersion": "autoscaling/v2",
                "kind": "HorizontalPodAutoscaler",
                "metadata": {
                    "name": f"{model.name}-{model.specialization}-hpa",
                    "namespace": "neuroweaver-models"
                },
                "spec": {
                    "scaleTargetRef": {
                        "apiVersion": "apps/v1",
                        "kind": "Deployment",
                        "name": f"{model.name}-{model.specialization}"
                    },
                    "minReplicas": 1,
                    "maxReplicas": 10,
                    "metrics": [
                        {
                            "type": "Resource",
                            "resource": {
                                "name": "cpu",
                                "target": {
                                    "type": "Utilization",
                                    "averageUtilization": 70
                                }
                            }
                        },
                        {
                            "type": "Resource",
                            "resource": {
                                "name": "memory",
                                "target": {
                                    "type": "Utilization",
                                    "averageUtilization": 80
                                }
                            }
                        }
                    ]
                }
            }

            return await self._apply_kubernetes_manifest(hpa_manifest)

        except Exception as e:
            logger.error(f"Failed to create HPA for model {model.id}: {e}")
            raise

    async def setup_monitoring(self, model: ModelInfo) -> Dict:
        """Set up monitoring for the model deployment"""
        try:
            # Create ServiceMonitor for Prometheus
            service_monitor = {
                "apiVersion": "monitoring.coreos.com/v1",
                "kind": "ServiceMonitor",
                "metadata": {
                    "name": f"{model.name}-{model.specialization}-monitor",
                    "namespace": "neuroweaver-monitoring"
                },
                "spec": {
                    "selector": {
                        "matchLabels": {
                            "app": "neuroweaver-model",
                            "model": model.name,
                            "version": model.version
                        }
                    },
                    "endpoints": [
                        {
                            "port": "http",
                            "path": "/metrics",
                            "interval": "30s"
                        }
                    ]
                }
            }

            # Create Prometheus rules for alerting
            prometheus_rules = {
                "apiVersion": "monitoring.coreos.com/v1",
                "kind": "PrometheusRule",
                "metadata": {
                    "name": f"{model.name}-{model.specialization}-rules",
                    "namespace": "neuroweaver-monitoring"
                },
                "spec": {
                    "groups": [
                        {
                            "name": f"{model.name}_{model.specialization}",
                            "rules": [
                                {
                                    "alert": "ModelHighLatency",
                                    "expr": f"histogram_quantile(0.95, rate(http_request_duration_seconds_bucket{{model=\"{model.name}\",version=\"{model.version}\"}}[5m])) > 2",
                                    "for": "5m",
                                    "labels": {
                                        "severity": "warning",
                                        "model": model.name,
                                        "version": model.version
                                    },
                                    "annotations": {
                                        "summary": f"High latency detected for {model.name} v{model.version}",
                                        "description": "Model response time is above 2 seconds for 5 minutes"
                                    }
                                },
                                {
                                    "alert": "ModelHighErrorRate",
                                    "expr": f"rate(http_requests_total{{status=~\"5..\",model=\"{model.name}\",version=\"{model.version}\"}}[5m]) / rate(http_requests_total{{model=\"{model.name}\",version=\"{model.version}\"}}[5m]) > 0.05",
                                    "for": "5m",
                                    "labels": {
                                        "severity": "critical",
                                        "model": model.name,
                                        "version": model.version
                                    },
                                    "annotations": {
                                        "summary": f"High error rate detected for {model.name} v{model.version}",
                                        "description": "Model error rate is above 5% for 5 minutes"
                                    }
                                }
                            ]
                        }
                    ]
                }
            }

            # Apply monitoring manifests
            await self._apply_kubernetes_manifest(service_monitor)
            await self._apply_kubernetes_manifest(prometheus_rules)

            return {
                "service_monitor": service_monitor["metadata"]["name"],
                "prometheus_rules": prometheus_rules["metadata"]["name"],
                "monitoring_setup": "completed"
            }

        except Exception as e:
            logger.error(f"Failed to setup monitoring for model {model.id}: {e}")
            raise

    async def get_kubernetes_logs(self, model_id: str, lines: int = 100) -> List[str]:
        """Get logs from Kubernetes pods"""
        try:
            deployment_info = self.deployed_models.get(model_id)
            if not deployment_info:
                raise ValueError(f"Model {model_id} is not deployed")

            # In a real implementation, this would use the Kubernetes API
            # kubectl logs deployment/{deployment_name} --tail={lines}

            # Simulate log retrieval
            logs = []
            for i in range(min(lines, 50)):  # Limit to 50 for simulation
                logs.append(
                    f"[{datetime.utcnow().isoformat()}] "
                    f"Model {model_id} - INFO - Processing request {i+1}"
                )

            return logs

        except Exception as e:
            logger.error(f"Failed to get Kubernetes logs for model {model_id}: {e}")
            return []

    async def get_kubernetes_metrics(self, model_id: str) -> Dict[str, Any]:
        """Get comprehensive Kubernetes metrics"""
        try:
            deployment_info = self.deployed_models.get(model_id)
            if not deployment_info:
                raise ValueError(f"Model {model_id} is not deployed")

            # In a real implementation, this would query Prometheus/Grafana
            # or use Kubernetes metrics server

            # Simulate comprehensive metrics
            return {
                "cpu_usage": {
                    "current": 45.2,
                    "limit": 1000,
                    "unit": "millicores"
                },
                "memory_usage": {
                    "current": 1024,
                    "limit": 2048,
                    "unit": "MB"
                },
                "network": {
                    "rx_bytes_per_second": 1024000,
                    "tx_bytes_per_second": 512000
                },
                "requests": {
                    "total": 15432,
                    "per_second": 10.5,
                    "error_rate": 0.01
                },
                "latency": {
                    "p50": 120,
                    "p95": 250,
                    "p99": 450,
                    "unit": "ms"
                },
                "replicas": {
                    "current": deployment_info.get("replicas", 1),
                    "ready": deployment_info.get("replicas", 1),
                    "desired": deployment_info.get("replicas", 1)
                },
                "uptime_seconds": (datetime.utcnow() - datetime.fromisoformat(
                    deployment_info.get("created_at", datetime.utcnow().isoformat())
                )).total_seconds()
            }

        except Exception as e:
            logger.error(f"Failed to get Kubernetes metrics for model {model_id}: {e}")
            return {}

    async def scale_deployment_kubernetes(self, model_id: str, replicas: int) -> bool:
        """Scale deployment using Kubernetes API"""
        try:
            deployment_info = self.deployed_models.get(model_id)
            if not deployment_info:
                raise ValueError(f"Model {model_id} is not deployed")

            # In a real implementation, this would use the Kubernetes API:
            # api = client.AppsV1Api()
            # scale = client.V1Scale(
            #     spec=client.V1ScaleSpec(replicas=replicas)
            # )
            # api.patch_namespaced_deployment_scale(
            #     name=deployment_info["kubernetes"]["deployment_name"],
            #     namespace=deployment_info["kubernetes"]["namespace"],
            #     body=scale
            # )

            # Simulate scaling
            deployment_info["replicas"] = replicas
            logger.info(f"Scaled Kubernetes deployment for model {model_id} to {replicas} replicas")

            return True

        except Exception as e:
            logger.error(f"Failed to scale Kubernetes deployment for model {model_id}: {e}")
            return False

    async def delete_kubernetes_resources(self, deployment_info: Dict) -> None:
        """Delete Kubernetes resources for a deployment"""
        try:
            kubernetes_info = deployment_info.get("kubernetes", {})

            if kubernetes_info:
                # Delete in reverse order: HPA, Service, Deployment
                resources_to_delete = [
                    ("HorizontalPodAutoscaler", kubernetes_info.get("hpa_name")),
                    ("Service", kubernetes_info.get("service_name")),
                    ("Deployment", kubernetes_info.get("deployment_name"))
                ]

                for resource_type, resource_name in resources_to_delete:
                    if resource_name:
                        await self._delete_kubernetes_resource(
                            resource_type,
                            resource_name,
                            kubernetes_info.get("namespace", "neuroweaver-models")
                        )

            logger.info(f"Deleted Kubernetes resources for deployment {deployment_info['deployment_id']}")

        except Exception as e:
            logger.error(f"Failed to delete Kubernetes resources: {e}")
            raise

    async def _delete_kubernetes_resource(self, resource_type: str, resource_name: str, namespace: str) -> None:
        """Delete a specific Kubernetes resource"""
        try:
            # In a real implementation, this would use the Kubernetes API
            logger.info(f"Deleted {resource_type} {resource_name} from namespace {namespace}")

        except Exception as e:
            logger.error(f"Failed to delete {resource_type} {resource_name}: {e}")
            # Don't raise, continue with other deletions
