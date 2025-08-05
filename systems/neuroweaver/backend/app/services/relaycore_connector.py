"""
NeuroWeaver RelayCore Connector Service
Handles automatic model registration with RelayCore
"""

import asyncio
import logging
import json
import aiohttp
from datetime import datetime
from typing import Dict, Optional, List
from dataclasses import dataclass, asdict

from app.core.config import settings
from app.services.model_registry import ModelInfo

logger = logging.getLogger(__name__)

@dataclass
class RelayCoreModelRegistration:
    """Model registration data for RelayCore"""
    model_id: str
    name: str
    provider: str = "neuroweaver"
    specialization: List[str] = None
    endpoint: str = ""
    cost_per_token: float = 0.001
    max_tokens: int = 4096
    capabilities: List[str] = None
    performance_metrics: Dict = None
    
    def __post_init__(self):
        if self.specialization is None:
            self.specialization = []
        if self.capabilities is None:
            self.capabilities = ["text-generation", "conversation"]
        if self.performance_metrics is None:
            self.performance_metrics = {}

class RelayCoreConnector:
    """Service for integrating with RelayCore"""
    
    def __init__(self):
        self.relaycore_url = settings.RELAYCORE_URL
        self.api_key = settings.RELAYCORE_API_KEY
        self.registered_models: Dict[str, Dict] = {}
        self.connection_healthy = False
        
    async def register_service(self) -> bool:
        """Register NeuroWeaver service with RelayCore"""
        try:
            service_info = {
                "service_name": "neuroweaver",
                "service_type": "model_provider",
                "version": "1.0.0",
                "endpoint": "http://neuroweaver-backend:8001",
                "capabilities": [
                    "model-registration",
                    "model-deployment",
                    "automotive-specialization",
                    "performance-monitoring"
                ],
                "specializations": [
                    "automotive-sales",
                    "service-advisor", 
                    "parts-specialist",
                    "finance-advisor"
                ],
                "health_check_endpoint": "/health",
                "registration_timestamp": datetime.utcnow().isoformat()
            }
            
            success = await self._make_relaycore_request(
                "POST",
                "/api/v1/providers/register",
                service_info
            )
            
            if success:
                self.connection_healthy = True
                logger.info("Successfully registered NeuroWeaver with RelayCore")
                return True
            else:
                logger.error("Failed to register NeuroWeaver with RelayCore")
                return False
                
        except Exception as e:
            logger.error(f"Error registering with RelayCore: {e}")
            return False
    
    async def register_model(self, model: ModelInfo) -> bool:
        """Register a deployed model with RelayCore"""
        try:
            if not self.connection_healthy:
                logger.warning("RelayCore connection not healthy, skipping model registration")
                return False
            
            # Prepare model registration data
            registration_data = RelayCoreModelRegistration(
                model_id=model.id,
                name=model.name,
                specialization=[model.specialization],
                endpoint=self._get_model_endpoint(model),
                cost_per_token=self._calculate_cost_per_token(model),
                performance_metrics=model.performance_metrics or {}
            )
            
            # Register with RelayCore
            success = await self._make_relaycore_request(
                "POST",
                "/api/v1/models/register",
                asdict(registration_data)
            )
            
            if success:
                self.registered_models[model.id] = {
                    "registered_at": datetime.utcnow().isoformat(),
                    "registration_data": asdict(registration_data)
                }
                logger.info(f"Successfully registered model {model.id} with RelayCore")
                return True
            else:
                logger.error(f"Failed to register model {model.id} with RelayCore")
                return False
                
        except Exception as e:
            logger.error(f"Error registering model {model.id} with RelayCore: {e}")
            return False
    
    async def unregister_model(self, model_id: str) -> bool:
        """Unregister a model from RelayCore"""
        try:
            if not self.connection_healthy:
                logger.warning("RelayCore connection not healthy, skipping model unregistration")
                return False
            
            success = await self._make_relaycore_request(
                "DELETE",
                f"/api/v1/models/{model_id}"
            )
            
            if success:
                if model_id in self.registered_models:
                    del self.registered_models[model_id]
                logger.info(f"Successfully unregistered model {model_id} from RelayCore")
                return True
            else:
                logger.error(f"Failed to unregister model {model_id} from RelayCore")
                return False
                
        except Exception as e:
            logger.error(f"Error unregistering model {model_id} from RelayCore: {e}")
            return False
    
    async def update_model_performance(self, model_id: str, metrics: Dict) -> bool:
        """Update model performance metrics in RelayCore"""
        try:
            if not self.connection_healthy:
                return False
            
            update_data = {
                "model_id": model_id,
                "performance_metrics": metrics,
                "updated_at": datetime.utcnow().isoformat()
            }
            
            success = await self._make_relaycore_request(
                "PUT",
                f"/api/v1/models/{model_id}/performance",
                update_data
            )
            
            if success:
                logger.info(f"Updated performance metrics for model {model_id} in RelayCore")
                return True
            else:
                logger.error(f"Failed to update performance metrics for model {model_id}")
                return False
                
        except Exception as e:
            logger.error(f"Error updating model performance {model_id}: {e}")
            return False
    
    async def notify_model_status_change(self, model_id: str, status: str, reason: str = "") -> bool:
        """Notify RelayCore of model status changes"""
        try:
            if not self.connection_healthy:
                return False
            
            notification_data = {
                "model_id": model_id,
                "status": status,
                "reason": reason,
                "timestamp": datetime.utcnow().isoformat()
            }
            
            success = await self._make_relaycore_request(
                "POST",
                f"/api/v1/models/{model_id}/status",
                notification_data
            )
            
            if success:
                logger.info(f"Notified RelayCore of status change for model {model_id}: {status}")
                return True
            else:
                logger.error(f"Failed to notify RelayCore of status change for model {model_id}")
                return False
                
        except Exception as e:
            logger.error(f"Error notifying model status change {model_id}: {e}")
            return False
    
    async def get_routing_analytics(self, model_id: str) -> Optional[Dict]:
        """Get routing analytics from RelayCore for a model"""
        try:
            if not self.connection_healthy:
                return None
            
            response = await self._make_relaycore_request(
                "GET",
                f"/api/v1/models/{model_id}/analytics"
            )
            
            if response:
                logger.info(f"Retrieved routing analytics for model {model_id}")
                return response
            else:
                logger.warning(f"No analytics available for model {model_id}")
                return None
                
        except Exception as e:
            logger.error(f"Error getting routing analytics for model {model_id}: {e}")
            return None
    
    async def check_relaycore_health(self) -> bool:
        """Check if RelayCore is healthy and reachable"""
        try:
            response = await self._make_relaycore_request("GET", "/health")
            self.connection_healthy = response is not None
            return self.connection_healthy
            
        except Exception as e:
            logger.error(f"RelayCore health check failed: {e}")
            self.connection_healthy = False
            return False
    
    async def sync_all_models(self, models: List[ModelInfo]) -> Dict[str, bool]:
        """Sync all deployed models with RelayCore"""
        results = {}
        
        for model in models:
            if model.status == "deployed":
                success = await self.register_model(model)
                results[model.id] = success
        
        return results
    
    def _get_model_endpoint(self, model: ModelInfo) -> str:
        """Get the inference endpoint for a model"""
        if model.deployment_info and "endpoint" in model.deployment_info:
            return model.deployment_info["endpoint"]
        else:
            # Default endpoint pattern
            return f"http://neuroweaver-{model.id}:8080/inference"
    
    def _calculate_cost_per_token(self, model: ModelInfo) -> float:
        """Calculate cost per token for a model"""
        # Base cost calculation - could be more sophisticated
        base_cost = 0.001
        
        # Adjust based on specialization
        specialization_multipliers = {
            "automotive-sales": 1.2,
            "service-advisor": 1.1,
            "parts-specialist": 1.0,
            "finance-advisor": 1.3
        }
        
        multiplier = specialization_multipliers.get(model.specialization, 1.0)
        return base_cost * multiplier
    
    async def _make_relaycore_request(
        self, 
        method: str, 
        endpoint: str, 
        data: Optional[Dict] = None
    ) -> Optional[Dict]:
        """Make HTTP request to RelayCore"""
        url = f"{self.relaycore_url}{endpoint}"
        headers = {
            "Content-Type": "application/json",
            "User-Agent": "NeuroWeaver/1.0.0"
        }
        
        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"
        
        try:
            timeout = aiohttp.ClientTimeout(total=10)
            async with aiohttp.ClientSession(timeout=timeout) as session:
                async with session.request(
                    method, 
                    url, 
                    headers=headers,
                    json=data if data else None
                ) as response:
                    if response.status < 400:
                        if response.content_type == "application/json":
                            return await response.json()
                        else:
                            return {"success": True}
                    else:
                        error_text = await response.text()
                        logger.error(f"RelayCore request failed: {response.status} - {error_text}")
                        return None
        
        except asyncio.TimeoutError:
            logger.error(f"RelayCore request timeout: {method} {url}")
            return None
        except Exception as e:
            logger.error(f"RelayCore request error: {method} {url} - {e}")
            return None
    
    def get_registration_status(self) -> Dict:
        """Get current registration status"""
        return {
            "connection_healthy": self.connection_healthy,
            "relaycore_url": self.relaycore_url,
            "registered_models_count": len(self.registered_models),
            "registered_models": list(self.registered_models.keys())
        }