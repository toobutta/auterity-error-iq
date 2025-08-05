"""
RelayCore Integration Connector

This module provides integration between NeuroWeaver and RelayCore platforms
for automotive industry applications.
"""

import os
import json
import yaml
import logging
import requests
import time
from typing import Dict, Any, List, Optional, Union
from dataclasses import dataclass
import threading
import queue
import hashlib
import hmac
import base64
from datetime import datetime, timedelta

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@dataclass
class RelayCoreConfig:
    """Configuration for RelayCore integration"""
    api_url: str
    api_key: str
    api_secret: str
    client_id: Optional[str] = None
    client_secret: Optional[str] = None
    oauth_url: Optional[str] = None
    sync_interval: int = 3600  # Default sync interval in seconds (1 hour)
    timeout: int = 30  # Default timeout in seconds
    max_retries: int = 3  # Default number of retries
    cache_ttl: int = 300  # Default cache TTL in seconds (5 minutes)


@dataclass
class AuthToken:
    """Authentication token for RelayCore API"""
    token: str
    token_type: str
    expires_at: datetime
    
    @property
    def is_expired(self) -> bool:
        """Check if token is expired"""
        return datetime.now() > self.expires_at
    
    @property
    def auth_header(self) -> Dict[str, str]:
        """Get authorization header"""
        return {"Authorization": f"{self.token_type} {self.token}"}


class RelayCoreConnector:
    """
    Connector for integrating NeuroWeaver with RelayCore platform.
    Provides methods for authentication, data exchange, and API access.
    """
    
    def __init__(self, config_path: Optional[str] = None, config: Optional[RelayCoreConfig] = None):
        """
        Initialize the RelayCore connector
        
        Args:
            config_path: Path to configuration file
            config: Configuration object (alternative to config_path)
        """
        if config_path and os.path.exists(config_path):
            with open(config_path, 'r') as f:
                config_data = yaml.safe_load(f)
                self.config = RelayCoreConfig(**config_data)
        elif config:
            self.config = config
        else:
            raise ValueError("Either config_path or config must be provided")
            
        # Initialize authentication token
        self._auth_token = None
        
        # Initialize cache
        self._cache = {}
        
        # Initialize sync thread
        self._sync_thread = None
        self._sync_queue = queue.Queue()
        self._stop_sync = threading.Event()
        
        # Start sync thread if interval is set
        if self.config.sync_interval > 0:
            self._start_sync_thread()
            
    def _start_sync_thread(self):
        """Start the synchronization thread"""
        if self._sync_thread is not None:
            return
            
        self._sync_thread = threading.Thread(target=self._sync_worker, daemon=True)
        self._sync_thread.start()
        logger.info("Started RelayCore sync thread")
        
    def _stop_sync_thread(self):
        """Stop the synchronization thread"""
        if self._sync_thread is None:
            return
            
        self._stop_sync.set()
        self._sync_thread.join(timeout=5.0)
        self._sync_thread = None
        logger.info("Stopped RelayCore sync thread")
        
    def _sync_worker(self):
        """Worker function for synchronization thread"""
        while not self._stop_sync.is_set():
            try:
                # Process any queued sync tasks
                while not self._sync_queue.empty():
                    sync_task = self._sync_queue.get_nowait()
                    try:
                        if sync_task["type"] == "import":
                            self._sync_import_data(sync_task["data_type"], sync_task["params"])
                        elif sync_task["type"] == "export":
                            self._sync_export_data(sync_task["data_type"], sync_task["data"], sync_task["params"])
                    except Exception as e:
                        logger.error(f"Error processing sync task: {str(e)}")
                    finally:
                        self._sync_queue.task_done()
                
                # Perform periodic sync
                self._perform_periodic_sync()
                
                # Sleep until next sync interval
                for _ in range(self.config.sync_interval):
                    if self._stop_sync.is_set():
                        break
                    time.sleep(1)
            except Exception as e:
                logger.error(f"Error in sync worker: {str(e)}")
                time.sleep(60)  # Sleep for a minute before retrying
                
    def _perform_periodic_sync(self):
        """Perform periodic synchronization"""
        try:
            # Sync vehicle data
            self._sync_import_data("vehicles", {"limit": 100, "updated_since": "1d"})
            
            # Sync service records
            self._sync_import_data("service_records", {"limit": 100, "updated_since": "1d"})
            
            # Sync customer data
            self._sync_import_data("customers", {"limit": 100, "updated_since": "1d"})
            
            logger.info("Completed periodic sync with RelayCore")
        except Exception as e:
            logger.error(f"Error during periodic sync: {str(e)}")
            
    def _sync_import_data(self, data_type: str, params: Dict[str, Any]):
        """
        Import data from RelayCore
        
        Args:
            data_type: Type of data to import
            params: Parameters for the import
        """
        try:
            # Get data from RelayCore
            data = self.get_data(data_type, params)
            
            # Process and store data
            if data_type == "vehicles":
                self._process_vehicle_data(data)
            elif data_type == "service_records":
                self._process_service_records(data)
            elif data_type == "customers":
                self._process_customer_data(data)
            else:
                logger.warning(f"Unknown data type for import: {data_type}")
                
            logger.info(f"Imported {len(data)} {data_type} from RelayCore")
        except Exception as e:
            logger.error(f"Error importing {data_type} from RelayCore: {str(e)}")
            
    def _sync_export_data(self, data_type: str, data: List[Dict[str, Any]], params: Dict[str, Any]):
        """
        Export data to RelayCore
        
        Args:
            data_type: Type of data to export
            data: Data to export
            params: Parameters for the export
        """
        try:
            # Send data to RelayCore
            result = self.send_data(data_type, data, params)
            
            logger.info(f"Exported {len(data)} {data_type} to RelayCore: {result}")
        except Exception as e:
            logger.error(f"Error exporting {data_type} to RelayCore: {str(e)}")
            
    def _process_vehicle_data(self, vehicles: List[Dict[str, Any]]):
        """
        Process vehicle data imported from RelayCore
        
        Args:
            vehicles: List of vehicle data
        """
        # In a real implementation, this would store data in a database
        # For now, just log the number of vehicles
        logger.info(f"Processed {len(vehicles)} vehicles from RelayCore")
        
    def _process_service_records(self, records: List[Dict[str, Any]]):
        """
        Process service records imported from RelayCore
        
        Args:
            records: List of service records
        """
        # In a real implementation, this would store data in a database
        # For now, just log the number of records
        logger.info(f"Processed {len(records)} service records from RelayCore")
        
    def _process_customer_data(self, customers: List[Dict[str, Any]]):
        """
        Process customer data imported from RelayCore
        
        Args:
            customers: List of customer data
        """
        # In a real implementation, this would store data in a database
        # For now, just log the number of customers
        logger.info(f"Processed {len(customers)} customers from RelayCore")
        
    def _get_auth_token(self) -> AuthToken:
        """
        Get authentication token for RelayCore API
        
        Returns:
            AuthToken: Authentication token
        """
        # Check if we have a valid token
        if self._auth_token and not self._auth_token.is_expired:
            return self._auth_token
            
        # Determine authentication method
        if self.config.client_id and self.config.client_secret and self.config.oauth_url:
            # Use OAuth authentication
            return self._get_oauth_token()
        else:
            # Use API key authentication
            return self._get_api_key_token()
            
    def _get_oauth_token(self) -> AuthToken:
        """
        Get OAuth authentication token
        
        Returns:
            AuthToken: Authentication token
        """
        try:
            # Prepare request data
            data = {
                "grant_type": "client_credentials",
                "client_id": self.config.client_id,
                "client_secret": self.config.client_secret,
                "scope": "api"
            }
            
            # Make request to OAuth endpoint
            response = requests.post(
                self.config.oauth_url,
                data=data,
                timeout=self.config.timeout
            )
            
            # Check response
            response.raise_for_status()
            
            # Parse response
            token_data = response.json()
            
            # Create token
            token = AuthToken(
                token=token_data["access_token"],
                token_type=token_data["token_type"],
                expires_at=datetime.now() + timedelta(seconds=token_data["expires_in"])
            )
            
            # Store token
            self._auth_token = token
            
            logger.info("Obtained OAuth token from RelayCore")
            
            return token
        except Exception as e:
            logger.error(f"Error getting OAuth token: {str(e)}")
            raise
            
    def _get_api_key_token(self) -> AuthToken:
        """
        Get API key authentication token
        
        Returns:
            AuthToken: Authentication token
        """
        # For API key authentication, we create a token that expires in 1 hour
        token = AuthToken(
            token=self.config.api_key,
            token_type="ApiKey",
            expires_at=datetime.now() + timedelta(hours=1)
        )
        
        # Store token
        self._auth_token = token
        
        return token
        
    def _generate_signature(self, method: str, path: str, timestamp: str, body: Optional[str] = None) -> str:
        """
        Generate HMAC signature for API request
        
        Args:
            method: HTTP method
            path: API path
            timestamp: Request timestamp
            body: Request body (optional)
            
        Returns:
            str: HMAC signature
        """
        # Create string to sign
        string_to_sign = f"{method}\n{path}\n{timestamp}"
        
        # Add body hash if present
        if body:
            body_hash = hashlib.sha256(body.encode()).hexdigest()
            string_to_sign += f"\n{body_hash}"
            
        # Generate HMAC signature
        signature = hmac.new(
            self.config.api_secret.encode(),
            string_to_sign.encode(),
            hashlib.sha256
        ).digest()
        
        # Encode signature as base64
        return base64.b64encode(signature).decode()
        
    def _make_request(self, method: str, path: str, params: Optional[Dict[str, Any]] = None, data: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Make a request to the RelayCore API
        
        Args:
            method: HTTP method
            path: API path
            params: Query parameters (optional)
            data: Request data (optional)
            
        Returns:
            Dict[str, Any]: Response data
        """
        # Get authentication token
        token = self._get_auth_token()
        
        # Prepare headers
        headers = {
            "Content-Type": "application/json",
            "Accept": "application/json",
            **token.auth_header
        }
        
        # Add signature if using API key authentication
        if token.token_type == "ApiKey":
            timestamp = datetime.utcnow().isoformat() + "Z"
            headers["X-API-Key"] = self.config.api_key
            headers["X-Timestamp"] = timestamp
            
            # Generate signature
            body = json.dumps(data) if data else None
            signature = self._generate_signature(method, path, timestamp, body)
            headers["X-Signature"] = signature
            
        # Prepare URL
        url = f"{self.config.api_url.rstrip('/')}/{path.lstrip('/')}"
        
        # Make request with retries
        retries = 0
        while retries <= self.config.max_retries:
            try:
                response = requests.request(
                    method=method,
                    url=url,
                    headers=headers,
                    params=params,
                    json=data,
                    timeout=self.config.timeout
                )
                
                # Check response
                response.raise_for_status()
                
                # Parse response
                return response.json()
            except requests.exceptions.HTTPError as e:
                if e.response.status_code == 401 and retries < self.config.max_retries:
                    # Token might be expired, try to refresh
                    self._auth_token = None
                    token = self._get_auth_token()
                    headers.update(token.auth_header)
                    retries += 1
                    continue
                else:
                    logger.error(f"HTTP error making request to RelayCore: {str(e)}")
                    raise
            except Exception as e:
                if retries < self.config.max_retries:
                    retries += 1
                    time.sleep(1)  # Wait before retrying
                    continue
                else:
                    logger.error(f"Error making request to RelayCore: {str(e)}")
                    raise
                    
    def _get_cache_key(self, method: str, path: str, params: Optional[Dict[str, Any]] = None, data: Optional[Dict[str, Any]] = None) -> str:
        """
        Generate cache key for a request
        
        Args:
            method: HTTP method
            path: API path
            params: Query parameters (optional)
            data: Request data (optional)
            
        Returns:
            str: Cache key
        """
        # Create string to hash
        string_to_hash = f"{method}:{path}"
        
        # Add params if present
        if params:
            string_to_hash += f":{json.dumps(params, sort_keys=True)}"
            
        # Add data if present
        if data:
            string_to_hash += f":{json.dumps(data, sort_keys=True)}"
            
        # Generate hash
        return hashlib.md5(string_to_hash.encode()).hexdigest()
        
    def _get_cached_response(self, cache_key: str) -> Optional[Dict[str, Any]]:
        """
        Get cached response
        
        Args:
            cache_key: Cache key
            
        Returns:
            Optional[Dict[str, Any]]: Cached response or None if not found
        """
        # Check if key exists in cache
        if cache_key not in self._cache:
            return None
            
        # Get cached item
        cached_item = self._cache[cache_key]
        
        # Check if item is expired
        if datetime.now() > cached_item["expires_at"]:
            # Remove expired item
            del self._cache[cache_key]
            return None
            
        return cached_item["data"]
        
    def _cache_response(self, cache_key: str, data: Dict[str, Any], ttl: Optional[int] = None):
        """
        Cache response
        
        Args:
            cache_key: Cache key
            data: Response data
            ttl: Time to live in seconds (optional)
        """
        # Use default TTL if not specified
        if ttl is None:
            ttl = self.config.cache_ttl
            
        # Store in cache
        self._cache[cache_key] = {
            "data": data,
            "expires_at": datetime.now() + timedelta(seconds=ttl)
        }
        
    def get_data(self, data_type: str, params: Optional[Dict[str, Any]] = None, use_cache: bool = True) -> List[Dict[str, Any]]:
        """
        Get data from RelayCore
        
        Args:
            data_type: Type of data to get
            params: Query parameters (optional)
            use_cache: Whether to use cache (default: True)
            
        Returns:
            List[Dict[str, Any]]: Data from RelayCore
        """
        # Map data type to API path
        path_map = {
            "vehicles": "api/v1/vehicles",
            "service_records": "api/v1/service-records",
            "customers": "api/v1/customers",
            "parts": "api/v1/parts",
            "inventory": "api/v1/inventory"
        }
        
        # Check if data type is supported
        if data_type not in path_map:
            raise ValueError(f"Unsupported data type: {data_type}")
            
        # Get API path
        path = path_map[data_type]
        
        # Check cache if enabled
        if use_cache:
            cache_key = self._get_cache_key("GET", path, params)
            cached_response = self._get_cached_response(cache_key)
            if cached_response:
                return cached_response
                
        # Make request
        response = self._make_request("GET", path, params=params)
        
        # Cache response if enabled
        if use_cache:
            self._cache_response(cache_key, response)
            
        return response
        
    def send_data(self, data_type: str, data: List[Dict[str, Any]], params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Send data to RelayCore
        
        Args:
            data_type: Type of data to send
            data: Data to send
            params: Query parameters (optional)
            
        Returns:
            Dict[str, Any]: Response from RelayCore
        """
        # Map data type to API path
        path_map = {
            "model_outputs": "api/v1/model-outputs",
            "analytics": "api/v1/analytics",
            "recommendations": "api/v1/recommendations"
        }
        
        # Check if data type is supported
        if data_type not in path_map:
            raise ValueError(f"Unsupported data type: {data_type}")
            
        # Get API path
        path = path_map[data_type]
        
        # Make request
        return self._make_request("POST", path, params=params, data={"data": data})
        
    def queue_sync_task(self, task_type: str, data_type: str, data: Optional[List[Dict[str, Any]]] = None, params: Optional[Dict[str, Any]] = None):
        """
        Queue a synchronization task
        
        Args:
            task_type: Type of task ("import" or "export")
            data_type: Type of data
            data: Data to export (for "export" tasks)
            params: Parameters for the task
        """
        # Validate task type
        if task_type not in ["import", "export"]:
            raise ValueError(f"Unsupported task type: {task_type}")
            
        # Validate data for export tasks
        if task_type == "export" and not data:
            raise ValueError("Data is required for export tasks")
            
        # Create task
        task = {
            "type": task_type,
            "data_type": data_type,
            "params": params or {}
        }
        
        # Add data for export tasks
        if task_type == "export":
            task["data"] = data
            
        # Queue task
        self._sync_queue.put(task)
        
    def get_vehicle_data(self, vin: Optional[str] = None, params: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        """
        Get vehicle data from RelayCore
        
        Args:
            vin: Vehicle Identification Number (optional)
            params: Additional query parameters (optional)
            
        Returns:
            List[Dict[str, Any]]: Vehicle data
        """
        # Prepare parameters
        query_params = params or {}
        if vin:
            query_params["vin"] = vin
            
        # Get data
        return self.get_data("vehicles", query_params)
        
    def get_service_records(self, vehicle_id: Optional[str] = None, params: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        """
        Get service records from RelayCore
        
        Args:
            vehicle_id: Vehicle ID (optional)
            params: Additional query parameters (optional)
            
        Returns:
            List[Dict[str, Any]]: Service records
        """
        # Prepare parameters
        query_params = params or {}
        if vehicle_id:
            query_params["vehicle_id"] = vehicle_id
            
        # Get data
        return self.get_data("service_records", query_params)
        
    def get_customer_data(self, customer_id: Optional[str] = None, params: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        """
        Get customer data from RelayCore
        
        Args:
            customer_id: Customer ID (optional)
            params: Additional query parameters (optional)
            
        Returns:
            List[Dict[str, Any]]: Customer data
        """
        # Prepare parameters
        query_params = params or {}
        if customer_id:
            query_params["id"] = customer_id
            
        # Get data
        return self.get_data("customers", query_params)
        
    def send_model_outputs(self, outputs: List[Dict[str, Any]], params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Send model outputs to RelayCore
        
        Args:
            outputs: Model outputs to send
            params: Additional query parameters (optional)
            
        Returns:
            Dict[str, Any]: Response from RelayCore
        """
        return self.send_data("model_outputs", outputs, params)
        
    def send_analytics(self, analytics: List[Dict[str, Any]], params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Send analytics data to RelayCore
        
        Args:
            analytics: Analytics data to send
            params: Additional query parameters (optional)
            
        Returns:
            Dict[str, Any]: Response from RelayCore
        """
        return self.send_data("analytics", analytics, params)
        
    def send_recommendations(self, recommendations: List[Dict[str, Any]], params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Send recommendations to RelayCore
        
        Args:
            recommendations: Recommendations to send
            params: Additional query parameters (optional)
            
        Returns:
            Dict[str, Any]: Response from RelayCore
        """
        return self.send_data("recommendations", recommendations, params)
        
    def close(self):
        """Close the connector and release resources"""
        self._stop_sync_thread()


class RelayCoreService:
    """
    Service for integrating NeuroWeaver with RelayCore platform.
    Provides high-level methods for automotive industry applications.
    """
    
    def __init__(self, connector: RelayCoreConnector):
        """
        Initialize the RelayCore service
        
        Args:
            connector: RelayCore connector
        """
        self.connector = connector
        
    def get_vehicle_maintenance_history(self, vin: str) -> Dict[str, Any]:
        """
        Get vehicle maintenance history
        
        Args:
            vin: Vehicle Identification Number
            
        Returns:
            Dict[str, Any]: Vehicle maintenance history
        """
        try:
            # Get vehicle data
            vehicles = self.connector.get_vehicle_data(vin)
            if not vehicles:
                return {"error": "Vehicle not found", "vin": vin}
                
            vehicle = vehicles[0]
            
            # Get service records
            service_records = self.connector.get_service_records(vehicle["id"])
            
            # Organize data
            maintenance_history = {
                "vehicle": {
                    "vin": vehicle["vin"],
                    "make": vehicle["make"],
                    "model": vehicle["model"],
                    "year": vehicle["year"],
                    "mileage": vehicle["mileage"]
                },
                "service_records": sorted(
                    service_records,
                    key=lambda x: x["service_date"],
                    reverse=True
                )
            }
            
            return maintenance_history
        except Exception as e:
            logger.error(f"Error getting vehicle maintenance history: {str(e)}")
            return {"error": str(e), "vin": vin}
            
    def get_customer_vehicles(self, customer_id: str) -> Dict[str, Any]:
        """
        Get customer vehicles
        
        Args:
            customer_id: Customer ID
            
        Returns:
            Dict[str, Any]: Customer vehicles
        """
        try:
            # Get customer data
            customers = self.connector.get_customer_data(customer_id)
            if not customers:
                return {"error": "Customer not found", "customer_id": customer_id}
                
            customer = customers[0]
            
            # Get vehicles
            vehicles = self.connector.get_vehicle_data(params={"customer_id": customer_id})
            
            # Organize data
            customer_vehicles = {
                "customer": {
                    "id": customer["id"],
                    "first_name": customer["first_name"],
                    "last_name": customer["last_name"],
                    "email": customer["email"]
                },
                "vehicles": vehicles
            }
            
            return customer_vehicles
        except Exception as e:
            logger.error(f"Error getting customer vehicles: {str(e)}")
            return {"error": str(e), "customer_id": customer_id}
            
    def send_maintenance_recommendations(self, vin: str, recommendations: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Send maintenance recommendations
        
        Args:
            vin: Vehicle Identification Number
            recommendations: Maintenance recommendations
            
        Returns:
            Dict[str, Any]: Response from RelayCore
        """
        try:
            # Get vehicle data
            vehicles = self.connector.get_vehicle_data(vin)
            if not vehicles:
                return {"error": "Vehicle not found", "vin": vin}
                
            vehicle = vehicles[0]
            
            # Prepare recommendations
            formatted_recommendations = []
            for rec in recommendations:
                formatted_recommendations.append({
                    "vehicle_id": vehicle["id"],
                    "vin": vehicle["vin"],
                    "type": "maintenance",
                    "priority": rec.get("priority", "medium"),
                    "description": rec["description"],
                    "details": rec.get("details", {}),
                    "estimated_cost": rec.get("estimated_cost"),
                    "due_date": rec.get("due_date"),
                    "created_at": datetime.now().isoformat()
                })
                
            # Send recommendations
            return self.connector.send_recommendations(formatted_recommendations)
        except Exception as e:
            logger.error(f"Error sending maintenance recommendations: {str(e)}")
            return {"error": str(e), "vin": vin}
            
    def send_service_analytics(self, service_analytics: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Send service analytics
        
        Args:
            service_analytics: Service analytics data
            
        Returns:
            Dict[str, Any]: Response from RelayCore
        """
        try:
            # Prepare analytics
            formatted_analytics = []
            for analytics in service_analytics:
                formatted_analytics.append({
                    "type": "service",
                    "data": analytics,
                    "created_at": datetime.now().isoformat()
                })
                
            # Send analytics
            return self.connector.send_analytics(formatted_analytics)
        except Exception as e:
            logger.error(f"Error sending service analytics: {str(e)}")
            return {"error": str(e)}
            
    def process_service_inquiry(self, inquiry: Dict[str, Any], model_id: str) -> Dict[str, Any]:
        """
        Process service inquiry using NeuroWeaver model
        
        Args:
            inquiry: Service inquiry
            model_id: Model ID to use for processing
            
        Returns:
            Dict[str, Any]: Processed inquiry with model response
        """
        try:
            # In a real implementation, this would call the NeuroWeaver model
            # For now, just return a mock response
            
            # Mock model response
            model_response = {
                "response": f"This is a mock response for service inquiry {inquiry.get('id')} using model {model_id}",
                "confidence": 0.95,
                "model_id": model_id,
                "processing_time_ms": 120
            }
            
            # Send model output to RelayCore
            self.connector.send_model_outputs([{
                "inquiry_id": inquiry.get("id"),
                "model_id": model_id,
                "input": inquiry,
                "output": model_response,
                "created_at": datetime.now().isoformat()
            }])
            
            # Return processed inquiry
            return {
                "inquiry": inquiry,
                "model_response": model_response
            }
        except Exception as e:
            logger.error(f"Error processing service inquiry: {str(e)}")
            return {"error": str(e), "inquiry_id": inquiry.get("id")}
            
    def close(self):
        """Close the service and release resources"""
        self.connector.close()


# Example usage
if __name__ == "__main__":
    # Create configuration
    config = RelayCoreConfig(
        api_url="https://api.relaycore.example.com",
        api_key="test_api_key",
        api_secret="test_api_secret"
    )
    
    # Create connector
    connector = RelayCoreConnector(config=config)
    
    # Create service
    service = RelayCoreService(connector)
    
    try:
        # Example: Get vehicle maintenance history
        maintenance_history = service.get_vehicle_maintenance_history("1HGCM82633A123456")
        print(f"Maintenance History: {json.dumps(maintenance_history, indent=2)}")
        
        # Example: Send maintenance recommendations
        recommendations = [
            {
                "description": "Oil change recommended",
                "priority": "medium",
                "details": {
                    "current_mileage": 35000,
                    "last_service_mileage": 30000,
                    "service_interval": 5000
                },
                "estimated_cost": 75.99,
                "due_date": (datetime.now() + timedelta(days=14)).isoformat()
            },
            {
                "description": "Brake pad replacement recommended",
                "priority": "high",
                "details": {
                    "current_mileage": 35000,
                    "pad_thickness": "3mm",
                    "minimum_thickness": "2mm"
                },
                "estimated_cost": 299.99,
                "due_date": (datetime.now() + timedelta(days=7)).isoformat()
            }
        ]
        
        result = service.send_maintenance_recommendations("1HGCM82633A123456", recommendations)
        print(f"Recommendations Result: {json.dumps(result, indent=2)}")
        
    finally:
        # Close service
        service.close()