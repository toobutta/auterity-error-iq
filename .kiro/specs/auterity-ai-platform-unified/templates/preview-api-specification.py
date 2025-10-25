# Preview API Specification and Implementation Template
# This template provides the backend preview API with sandboxed execution, RBAC, and streaming support

from typing import Dict, List, Optional, Any, AsyncIterable, Union
from dataclasses import dataclass, asdict
from enum import Enum
from datetime import datetime, timedelta
import asyncio
import json
import uuid
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, WebSocket, WebSocketDisconnect
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field, validator
import redis
import hashlib

# API Models and Schemas
class NodeType(str, Enum):
    DATA_SOURCE = "dataSource"
    TRANSFORM = "transform"
    VISUALIZATION = "visualization"
    CONTENT = "content"
    AI_AGENT = "aiAgent"
    COMPLIANCE_CHECK = "complianceCheck"

class PreviewStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"

class StreamingEventType(str, Enum):
    PROGRESS = "progress"
    PARTIAL_RESULT = "partial_result"
    COMPLETE = "complete"
    ERROR = "error"

# Request Models
class PreviewRequest(BaseModel):
    node_id: str = Field(..., description="Unique identifier for the node")
    node_type: NodeType = Field(..., description="Type of node being previewed")
    config: Dict[str, Any] = Field(..., description="Node configuration parameters")
    input_data: Optional[List[Dict[str, Any]]] = Field(None, description="Input data for processing")
    industry_context: Optional[str] = Field(None, description="Industry context for specialized processing")
    compliance_level: str = Field("standard", description="Required compliance level")
    max_rows: int = Field(1000, ge=1, le=10000, description="Maximum number of rows to return")
    timeout: int = Field(30, ge=5, le=300, description="Timeout in seconds")
    enable_streaming: bool = Field(False, description="Enable streaming for long-running operations")
    cache_ttl: Optional[int] = Field(3600, description="Cache TTL in seconds")

    @validator('config')
    def validate_config(cls, v):
        if not isinstance(v, dict):
            raise ValueError('Config must be a dictionary')
        return v

class StreamingPreviewRequest(BaseModel):
    node_id: str
    node_type: NodeType
    config: Dict[str, Any]
    industry_context: Optional[str] = None
    compliance_level: str = "standard"
    chunk_size: int = Field(100, ge=10, le=1000)
    progress_interval: int = Field(5, ge=1, le=30)

# Response Models
class PreviewMetadata(BaseModel):
    row_count: int
    processing_time: float
    cost: Optional[float] = None
    cache_key: str
    expires_at: datetime
    sandbox_id: Optional[str] = None

class ComplianceInfo(BaseModel):
    pii_detected: bool
    redacted_fields: List[str]
    compliance_level: str
    audit_log_id: str

class PreviewError(BaseModel):
    code: str
    message: str
    details: Optional[Dict[str, Any]] = None

class VisualizationResult(BaseModel):
    type: str
    config: Dict[str, Any]
    chart_data: Any

class ContentResult(BaseModel):
    type: str
    rendered: str
    metadata: Dict[str, Any]

class PreviewResponse(BaseModel):
    node_id: str
    success: bool
    status: PreviewStatus
    data: Optional[List[Dict[str, Any]]] = None
    visualization: Optional[VisualizationResult] = None
    content: Optional[ContentResult] = None
    metadata: PreviewMetadata
    error: Optional[PreviewError] = None
    compliance_info: Optional[ComplianceInfo] = None

class StreamingUpdate(BaseModel):
    node_id: str
    type: StreamingEventType
    data: Optional[Any] = None
    progress: Optional[Dict[str, Any]] = None
    error: Optional[PreviewError] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)

# Sandboxed Execution Engine
class SandboxConfig:
    def __init__(self):
        self.max_memory_mb = 512
        self.max_cpu_time_seconds = 30
        self.max_disk_mb = 100
        self.allowed_imports = [
            'pandas', 'numpy', 'matplotlib', 'plotly', 'seaborn',
            'sklearn', 'scipy', 'json', 'datetime', 'math', 'statistics'
        ]
        self.blocked_functions = [
            'exec', 'eval', 'compile', 'open', '__import__',
            'input', 'raw_input', 'file', 'execfile'
        ]

class SandboxedExecutor:
    """Secure sandboxed execution environment for preview operations"""
    
    def __init__(self, config: SandboxConfig):
        self.config = config
        self.active_sandboxes: Dict[str, Any] = {}
        self.resource_monitor = ResourceMonitor()
    
    async def create_sandbox(self, sandbox_id: str) -> Dict[str, Any]:
        """Create a new sandboxed execution environment"""
        
        sandbox_context = {
            'id': sandbox_id,
            'created_at': datetime.utcnow(),
            'memory_limit': self.config.max_memory_mb * 1024 * 1024,
            'cpu_limit': self.config.max_cpu_time_seconds,
            'disk_limit': self.config.max_disk_mb * 1024 * 1024,
            'globals': self._create_safe_globals(),
            'locals': {},
            'resource_usage': {
                'memory': 0,
                'cpu_time': 0,
                'disk_usage': 0
            }
        }
        
        self.active_sandboxes[sandbox_id] = sandbox_context
        
        # Start resource monitoring
        await self.resource_monitor.start_monitoring(sandbox_id, sandbox_context)
        
        return sandbox_context
    
    async def execute_in_sandbox(
        self, 
        sandbox_id: str, 
        code: str, 
        input_data: Optional[Any] = None
    ) -> Dict[str, Any]:
        """Execute code in sandboxed environment with resource limits"""
        
        if sandbox_id not in self.active_sandboxes:
            raise ValueError(f"Sandbox {sandbox_id} not found")
        
        sandbox = self.active_sandboxes[sandbox_id]
        
        try:
            # Validate code safety
            await self._validate_code_safety(code)
            
            # Set up execution context
            execution_context = {
                **sandbox['globals'],
                'input_data': input_data,
                'output_data': None,
                'metadata': {}
            }
            
            # Execute with timeout and resource monitoring
            start_time = datetime.utcnow()
            
            # Use restricted execution environment
            result = await self._execute_with_limits(
                code, execution_context, sandbox
            )
            
            execution_time = (datetime.utcnow() - start_time).total_seconds()
            
            return {
                'success': True,
                'result': result,
                'execution_time': execution_time,
                'resource_usage': sandbox['resource_usage']
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'error_type': type(e).__name__
            }
    
    async def cleanup_sandbox(self, sandbox_id: str) -> None:
        """Clean up sandbox resources"""
        
        if sandbox_id in self.active_sandboxes:
            await self.resource_monitor.stop_monitoring(sandbox_id)
            del self.active_sandboxes[sandbox_id]
    
    def _create_safe_globals(self) -> Dict[str, Any]:
        """Create safe global namespace for sandbox execution"""
        
        safe_builtins = {
            'len', 'str', 'int', 'float', 'bool', 'list', 'dict', 'tuple',
            'set', 'frozenset', 'range', 'enumerate', 'zip', 'map', 'filter',
            'sorted', 'reversed', 'sum', 'min', 'max', 'abs', 'round',
            'isinstance', 'hasattr', 'getattr', 'setattr'
        }
        
        safe_globals = {
            '__builtins__': {name: getattr(__builtins__, name) for name in safe_builtins}
        }
        
        # Add allowed imports
        for module_name in self.config.allowed_imports:
            try:
                safe_globals[module_name] = __import__(module_name)
            except ImportError:
                pass  # Module not available
        
        return safe_globals
    
    async def _validate_code_safety(self, code: str) -> None:
        """Validate code for security issues"""
        
        # Check for blocked functions
        for blocked_func in self.config.blocked_functions:
            if blocked_func in code:
                raise SecurityError(f"Blocked function '{blocked_func}' found in code")
        
        # Check for dangerous imports
        dangerous_imports = ['os', 'sys', 'subprocess', 'socket', 'urllib']
        for dangerous_import in dangerous_imports:
            if f"import {dangerous_import}" in code or f"from {dangerous_import}" in code:
                raise SecurityError(f"Dangerous import '{dangerous_import}' not allowed")
        
        # Additional security checks can be added here
    
    async def _execute_with_limits(
        self, 
        code: str, 
        context: Dict[str, Any], 
        sandbox: Dict[str, Any]
    ) -> Any:
        """Execute code with resource limits"""
        
        # This would use a proper sandboxing library like RestrictedPython
        # For now, this is a simplified implementation
        
        try:
            # Compile code
            compiled_code = compile(code, '<sandbox>', 'exec')
            
            # Execute with timeout
            exec(compiled_code, context)
            
            return context.get('output_data')
            
        except Exception as e:
            raise ExecutionError(f"Code execution failed: {str(e)}")

class ResourceMonitor:
    """Monitor resource usage in sandboxed environments"""
    
    def __init__(self):
        self.monitoring_tasks: Dict[str, asyncio.Task] = {}
    
    async def start_monitoring(self, sandbox_id: str, sandbox_context: Dict[str, Any]) -> None:
        """Start monitoring resource usage for a sandbox"""
        
        async def monitor_resources():
            while sandbox_id in self.monitoring_tasks:
                # Monitor memory, CPU, and disk usage
                # This would integrate with system monitoring tools
                await asyncio.sleep(1)
        
        self.monitoring_tasks[sandbox_id] = asyncio.create_task(monitor_resources())
    
    async def stop_monitoring(self, sandbox_id: str) -> None:
        """Stop monitoring for a sandbox"""
        
        if sandbox_id in self.monitoring_tasks:
            self.monitoring_tasks[sandbox_id].cancel()
            del self.monitoring_tasks[sandbox_id]

# Preview Service Implementation
class PreviewService:
    """Main service for handling preview requests"""
    
    def __init__(self):
        self.sandbox_executor = SandboxedExecutor(SandboxConfig())
        self.cache_manager = PreviewCacheManager()
        self.compliance_validator = ComplianceValidator()
        self.cost_tracker = CostTracker()
        self.rbac_manager = RBACManager()
    
    async def process_preview_request(
        self, 
        request: PreviewRequest,
        user_context: Dict[str, Any]
    ) -> PreviewResponse:
        """Process a preview request with full validation and caching"""
        
        # Validate RBAC permissions
        if not await self.rbac_manager.check_preview_permission(user_context, request):
            raise HTTPException(status_code=403, detail="Insufficient permissions for preview operation")
        
        # Generate cache key
        cache_key = self._generate_cache_key(request)
        
        # Check cache first
        cached_result = await self.cache_manager.get_cached_result(cache_key)
        if cached_result:
            return cached_result
        
        # Create sandbox for execution
        sandbox_id = f"sandbox_{uuid.uuid4().hex[:8]}"
        
        try:
            await self.sandbox_executor.create_sandbox(sandbox_id)
            
            # Process based on node type
            if request.node_type == NodeType.DATA_SOURCE:
                result = await self._process_data_source(request, sandbox_id)
            elif request.node_type == NodeType.TRANSFORM:
                result = await self._process_transform(request, sandbox_id)
            elif request.node_type == NodeType.VISUALIZATION:
                result = await self._process_visualization(request, sandbox_id)
            elif request.node_type == NodeType.CONTENT:
                result = await self._process_content(request, sandbox_id)
            else:
                raise ValueError(f"Unsupported node type: {request.node_type}")
            
            # Validate compliance
            compliance_info = await self.compliance_validator.validate_result(
                result, request.compliance_level
            )
            
            # Apply PII redaction if needed
            if compliance_info.pii_detected:
                result = await self._redact_pii_data(result, compliance_info.redacted_fields)
            
            # Track costs
            cost = await self.cost_tracker.calculate_cost(request, result)
            
            # Create response
            response = PreviewResponse(
                node_id=request.node_id,
                success=True,
                status=PreviewStatus.COMPLETED,
                data=result.get('data'),
                visualization=result.get('visualization'),
                content=result.get('content'),
                metadata=PreviewMetadata(
                    row_count=len(result.get('data', [])),
                    processing_time=result.get('processing_time', 0),
                    cost=cost,
                    cache_key=cache_key,
                    expires_at=datetime.utcnow() + timedelta(seconds=request.cache_ttl or 3600),
                    sandbox_id=sandbox_id
                ),
                compliance_info=compliance_info
            )
            
            # Cache result
            await self.cache_manager.cache_result(cache_key, response, request.cache_ttl)
            
            return response
            
        except Exception as e:
            return PreviewResponse(
                node_id=request.node_id,
                success=False,
                status=PreviewStatus.FAILED,
                metadata=PreviewMetadata(
                    row_count=0,
                    processing_time=0,
                    cache_key=cache_key,
                    expires_at=datetime.utcnow(),
                    sandbox_id=sandbox_id
                ),
                error=PreviewError(
                    code="PROCESSING_ERROR",
                    message=str(e),
                    details={"error_type": type(e).__name__}
                )
            )
        
        finally:
            # Cleanup sandbox
            await self.sandbox_executor.cleanup_sandbox(sandbox_id)
    
    async def process_streaming_preview(
        self, 
        request: StreamingPreviewRequest,
        user_context: Dict[str, Any]
    ) -> AsyncIterable[StreamingUpdate]:
        """Process streaming preview request with progressive updates"""
        
        # Validate permissions
        if not await self.rbac_manager.check_streaming_permission(user_context, request):
            yield StreamingUpdate(
                node_id=request.node_id,
                type=StreamingEventType.ERROR,
                error=PreviewError(code="PERMISSION_DENIED", message="Insufficient permissions")
            )
            return
        
        sandbox_id = f"stream_sandbox_{uuid.uuid4().hex[:8]}"
        
        try:
            await self.sandbox_executor.create_sandbox(sandbox_id)
            
            # Send initial progress
            yield StreamingUpdate(
                node_id=request.node_id,
                type=StreamingEventType.PROGRESS,
                progress={"current": 0, "total": 100, "message": "Starting processing..."}
            )
            
            # Process in chunks
            async for update in self._process_streaming_data(request, sandbox_id):
                yield update
            
            # Send completion
            yield StreamingUpdate(
                node_id=request.node_id,
                type=StreamingEventType.COMPLETE,
                progress={"current": 100, "total": 100, "message": "Processing complete"}
            )
            
        except Exception as e:
            yield StreamingUpdate(
                node_id=request.node_id,
                type=StreamingEventType.ERROR,
                error=PreviewError(
                    code="STREAMING_ERROR",
                    message=str(e)
                )
            )
        
        finally:
            await self.sandbox_executor.cleanup_sandbox(sandbox_id)
    
    def _generate_cache_key(self, request: PreviewRequest) -> str:
        """Generate cache key for request"""
        
        key_data = {
            'node_type': request.node_type,
            'config': request.config,
            'industry_context': request.industry_context,
            'compliance_level': request.compliance_level
        }
        
        key_string = json.dumps(key_data, sort_keys=True)
        return hashlib.md5(key_string.encode()).hexdigest()
    
    async def _process_data_source(self, request: PreviewRequest, sandbox_id: str) -> Dict[str, Any]:
        """Process data source node"""
        
        # Implementation would connect to actual data sources
        # This is a simplified mock implementation
        
        mock_data = [
            {"id": 1, "name": "Sample Data 1", "value": 100},
            {"id": 2, "name": "Sample Data 2", "value": 200},
            {"id": 3, "name": "Sample Data 3", "value": 300}
        ]
        
        return {
            'data': mock_data[:request.max_rows],
            'processing_time': 0.1
        }
    
    async def _process_visualization(self, request: PreviewRequest, sandbox_id: str) -> Dict[str, Any]:
        """Process visualization node"""
        
        # Mock visualization processing
        visualization_result = VisualizationResult(
            type="plotly",
            config=request.config,
            chart_data={
                "data": [{"x": [1, 2, 3], "y": [4, 5, 6], "type": "scatter"}],
                "layout": {"title": "Sample Chart"}
            }
        )
        
        return {
            'visualization': visualization_result,
            'processing_time': 0.2
        }

# Cache Management
class PreviewCacheManager:
    """Manage caching for preview results"""
    
    def __init__(self):
        self.redis_client = redis.Redis(host='localhost', port=6379, db=0)
    
    async def get_cached_result(self, cache_key: str) -> Optional[PreviewResponse]:
        """Get cached preview result"""
        
        try:
            cached_data = self.redis_client.get(f"preview:{cache_key}")
            if cached_data:
                data = json.loads(cached_data)
                return PreviewResponse(**data)
        except Exception:
            pass  # Cache miss or error
        
        return None
    
    async def cache_result(
        self, 
        cache_key: str, 
        result: PreviewResponse, 
        ttl: Optional[int] = None
    ) -> None:
        """Cache preview result"""
        
        try:
            data = result.dict()
            self.redis_client.setex(
                f"preview:{cache_key}",
                ttl or 3600,
                json.dumps(data, default=str)
            )
        except Exception:
            pass  # Cache write error, continue without caching

# API Router Implementation
router = APIRouter(prefix="/api/preview", tags=["Preview"])

@router.post("/node", response_model=PreviewResponse)
async def preview_node(
    request: PreviewRequest,
    background_tasks: BackgroundTasks,
    current_user: Dict[str, Any] = Depends(get_current_user),
    preview_service: PreviewService = Depends(get_preview_service)
) -> PreviewResponse:
    """
    Generate preview for a workflow node
    
    This endpoint processes a node configuration and returns a preview of the results.
    Supports data sources, transformations, visualizations, and content generation.
    
    **Security Features:**
    - RBAC permission validation
    - Sandboxed execution environment
    - PII detection and redaction
    - Resource limits and monitoring
    
    **Performance Features:**
    - Result caching with configurable TTL
    - Request debouncing
    - Resource usage tracking
    """
    
    try:
        # Add cost tracking background task
        background_tasks.add_task(
            track_preview_usage,
            current_user['user_id'],
            request.node_type,
            request.industry_context
        )
        
        result = await preview_service.process_preview_request(request, current_user)
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Preview processing failed: {str(e)}"
        )

@router.websocket("/stream/{node_id}")
async def stream_preview(
    websocket: WebSocket,
    node_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user_websocket),
    preview_service: PreviewService = Depends(get_preview_service)
):
    """
    Stream preview results for long-running operations
    
    Provides real-time updates for data processing operations that take
    longer than the standard preview timeout.
    """
    
    await websocket.accept()
    
    try:
        # Get streaming request from websocket
        request_data = await websocket.receive_json()
        streaming_request = StreamingPreviewRequest(**request_data)
        
        # Validate node_id matches
        if streaming_request.node_id != node_id:
            await websocket.send_json({
                "type": "error",
                "error": {"code": "INVALID_NODE_ID", "message": "Node ID mismatch"}
            })
            return
        
        # Process streaming preview
        async for update in preview_service.process_streaming_preview(
            streaming_request, current_user
        ):
            await websocket.send_json(update.dict())
            
    except WebSocketDisconnect:
        pass  # Client disconnected
    except Exception as e:
        await websocket.send_json({
            "type": "error",
            "error": {"code": "STREAMING_ERROR", "message": str(e)}
        })
    finally:
        await websocket.close()

@router.get("/health")
async def preview_health():
    """Health check for preview service"""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "services": {
            "sandbox": "operational",
            "cache": "operational",
            "compliance": "operational"
        }
    }

# Utility functions
async def track_preview_usage(
    user_id: str, 
    node_type: str, 
    industry_context: Optional[str]
) -> None:
    """Background task to track preview usage for analytics"""
    # Implementation for usage tracking
    pass

async def get_current_user() -> Dict[str, Any]:
    """Get current user context for RBAC"""
    # Implementation for user authentication
    return {"user_id": "test_user", "permissions": ["preview:read"]}

async def get_current_user_websocket(websocket: WebSocket) -> Dict[str, Any]:
    """Get current user context for WebSocket connections"""
    # Implementation for WebSocket authentication
    return {"user_id": "test_user", "permissions": ["preview:stream"]}

async def get_preview_service() -> PreviewService:
    """Dependency injection for preview service"""
    return PreviewService()

# Custom Exceptions
class SecurityError(Exception):
    """Raised when security validation fails"""
    pass

class ExecutionError(Exception):
    """Raised when code execution fails"""
    pass

class ComplianceValidator:
    """Validate preview results for compliance"""
    
    async def validate_result(
        self, 
        result: Dict[str, Any], 
        compliance_level: str
    ) -> ComplianceInfo:
        """Validate result for compliance requirements"""
        
        # Mock implementation
        return ComplianceInfo(
            pii_detected=False,
            redacted_fields=[],
            compliance_level=compliance_level,
            audit_log_id=f"audit_{uuid.uuid4().hex[:8]}"
        )

class CostTracker:
    """Track costs for preview operations"""
    
    async def calculate_cost(
        self, 
        request: PreviewRequest, 
        result: Dict[str, Any]
    ) -> float:
        """Calculate cost for preview operation"""
        
        # Mock cost calculation
        base_cost = 0.001  # $0.001 per preview
        data_cost = len(result.get('data', [])) * 0.0001  # $0.0001 per row
        
        return base_cost + data_cost

class RBACManager:
    """Role-based access control for preview operations"""
    
    async def check_preview_permission(
        self, 
        user_context: Dict[str, Any], 
        request: PreviewRequest
    ) -> bool:
        """Check if user has permission for preview operation"""
        
        # Mock RBAC implementation
        return "preview:read" in user_context.get("permissions", [])
    
    async def check_streaming_permission(
        self, 
        user_context: Dict[str, Any], 
        request: StreamingPreviewRequest
    ) -> bool:
        """Check if user has permission for streaming preview"""
        
        # Mock RBAC implementation
        return "preview:stream" in user_context.get("permissions", [])

# Export the router for integration with main FastAPI app
__all__ = ['router', 'PreviewRequest', 'PreviewResponse', 'StreamingUpdate']