"""
Orchestration API Routes
Phase 1: Foundation Infrastructure API endpoints
"""

from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from typing import List, Dict, Any, Optional
from datetime import datetime
import logging

from ..services.kiro_orchestrator import (
    KiroOrchestrator, 
    DevelopmentBlock, 
    AITool, 
    Priority,
    BlockStatus
)
from ..services.integration_controller import (
    IntegrationController,
    IntegrationRequest,
    Artifact,
    DeploymentStage
)
from ..auth import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/orchestration", tags=["orchestration"])

# Global instances - in production, these would be dependency injected
orchestrator = KiroOrchestrator()
integration_controller = IntegrationController()


@router.post("/blocks/plan")
async def plan_development_blocks(
    requirements: Dict[str, Any],
    current_user = Depends(get_current_user)
) -> List[Dict[str, Any]]:
    """Plan development blocks from requirements"""
    try:
        blocks = await orchestrator.plan_development_blocks(requirements)
        return [
            {
                "id": block.id,
                "name": block.name,
                "description": block.description,
                "assigned_tool": block.assigned_tool.value,
                "dependencies": block.dependencies,
                "estimated_hours": block.estimated_hours,
                "priority": block.priority.value,
                "status": block.status.value,
                "quality_gates": block.quality_gates,
                "created_at": block.created_at.isoformat()
            }
            for block in blocks
        ]
    except Exception as e:
        logger.error(f"Failed to plan development blocks: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/blocks/{block_id}/assign")
async def assign_block(
    block_id: str,
    tool: str,
    current_user = Depends(get_current_user)
) -> Dict[str, Any]:
    """Assign a development block to a specific tool"""
    try:
        # Validate tool
        try:
            ai_tool = AITool(tool)
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid tool: {tool}")
        
        # Get block
        block = orchestrator.active_blocks.get(block_id)
        if not block:
            raise HTTPException(status_code=404, detail=f"Block {block_id} not found")
        
        assignment = await orchestrator.assign_block(block, ai_tool)
        return assignment
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to assign block {block_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/blocks/{block_id}/complete")
async def complete_block(
    block_id: str,
    current_user = Depends(get_current_user)
) -> Dict[str, Any]:
    """Mark a development block as completed and run quality gates"""
    try:
        result = await orchestrator.complete_block(block_id)
        return result
        
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Failed to complete block {block_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/blocks")
async def get_blocks(
    status: Optional[str] = None,
    tool: Optional[str] = None,
    current_user = Depends(get_current_user)
) -> List[Dict[str, Any]]:
    """Get development blocks with optional filtering"""
    try:
        all_blocks = {**orchestrator.active_blocks, **orchestrator.completed_blocks}
        blocks = list(all_blocks.values())
        
        # Apply filters
        if status:
            try:
                status_enum = BlockStatus(status)
                blocks = [b for b in blocks if b.status == status_enum]
            except ValueError:
                raise HTTPException(status_code=400, detail=f"Invalid status: {status}")
        
        if tool:
            try:
                tool_enum = AITool(tool)
                blocks = [b for b in blocks if b.assigned_tool == tool_enum]
            except ValueError:
                raise HTTPException(status_code=400, detail=f"Invalid tool: {tool}")
        
        return [
            {
                "id": block.id,
                "name": block.name,
                "description": block.description,
                "assigned_tool": block.assigned_tool.value,
                "dependencies": block.dependencies,
                "estimated_hours": block.estimated_hours,
                "priority": block.priority.value,
                "status": block.status.value,
                "created_at": block.created_at.isoformat(),
                "started_at": block.started_at.isoformat() if block.started_at else None,
                "completed_at": block.completed_at.isoformat() if block.completed_at else None
            }
            for block in blocks
        ]
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get blocks: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/blocks/{block_id}")
async def get_block(
    block_id: str,
    current_user = Depends(get_current_user)
) -> Dict[str, Any]:
    """Get a specific development block"""
    try:
        block = orchestrator.active_blocks.get(block_id) or orchestrator.completed_blocks.get(block_id)
        if not block:
            raise HTTPException(status_code=404, detail=f"Block {block_id} not found")
        
        return {
            "id": block.id,
            "name": block.name,
            "description": block.description,
            "assigned_tool": block.assigned_tool.value,
            "dependencies": block.dependencies,
            "inputs": block.inputs,
            "outputs": block.outputs,
            "success_criteria": block.success_criteria,
            "estimated_hours": block.estimated_hours,
            "priority": block.priority.value,
            "status": block.status.value,
            "quality_gates": block.quality_gates,
            "context": block.context,
            "created_at": block.created_at.isoformat(),
            "updated_at": block.updated_at.isoformat(),
            "started_at": block.started_at.isoformat() if block.started_at else None,
            "completed_at": block.completed_at.isoformat() if block.completed_at else None
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get block {block_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/progress")
async def get_progress(
    current_user = Depends(get_current_user)
) -> Dict[str, Any]:
    """Get current progress report"""
    try:
        report = await orchestrator.monitor_progress()
        return {
            "timestamp": report.timestamp.isoformat(),
            "overall_progress": report.overall_progress,
            "stream_progress": report.stream_progress,
            "blockers": report.blockers,
            "quality_metrics": report.quality_metrics,
            "timeline": report.timeline,
            "risks": report.risks,
            "recommendations": report.recommendations
        }
        
    except Exception as e:
        logger.error(f"Failed to get progress: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/tools/specialization")
async def get_tool_specialization(
    current_user = Depends(get_current_user)
) -> Dict[str, Any]:
    """Get tool specialization matrix"""
    try:
        matrix = orchestrator.specialization_matrix.specializations
        return {
            tool.value: {
                "primary_capabilities": spec.primary_capabilities,
                "support_capabilities": spec.support_capabilities,
                "restrictions": spec.restrictions,
                "max_concurrent_blocks": spec.max_concurrent_blocks,
                "average_velocity": spec.average_velocity,
                "quality_weight": spec.quality_weight
            }
            for tool, spec in matrix.items()
        }
        
    except Exception as e:
        logger.error(f"Failed to get tool specialization: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# Integration Controller Routes

@router.post("/integration/request")
async def submit_integration_request(
    request_data: Dict[str, Any],
    background_tasks: BackgroundTasks,
    current_user = Depends(get_current_user)
) -> Dict[str, Any]:
    """Submit an integration request"""
    try:
        # Parse deployment stages
        deployment_stages = []
        for stage_name in request_data.get("deployment_stages", []):
            try:
                deployment_stages.append(DeploymentStage(stage_name))
            except ValueError:
                raise HTTPException(status_code=400, detail=f"Invalid deployment stage: {stage_name}")
        
        request = IntegrationRequest(
            id=f"integration_{datetime.now().timestamp()}",
            name=request_data["name"],
            description=request_data.get("description", ""),
            source_artifacts=request_data["source_artifacts"],
            target_branch=request_data.get("target_branch", "main"),
            requested_by=current_user.get("username", "unknown"),
            requested_at=datetime.now(),
            priority=request_data.get("priority", "medium"),
            auto_merge=request_data.get("auto_merge", False),
            quality_gates=request_data.get("quality_gates", []),
            deployment_stages=deployment_stages
        )
        
        request_id = await integration_controller.submit_integration_request(request)
        
        return {
            "request_id": request_id,
            "status": "submitted",
            "message": "Integration request submitted successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to submit integration request: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/integration/{request_id}")
async def get_integration_status(
    request_id: str,
    current_user = Depends(get_current_user)
) -> Dict[str, Any]:
    """Get integration request status"""
    try:
        status = await integration_controller.get_integration_status(request_id)
        if not status:
            raise HTTPException(status_code=404, detail=f"Integration request {request_id} not found")
        
        return status
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get integration status {request_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/artifacts")
async def store_artifact(
    artifact_data: Dict[str, Any],
    current_user = Depends(get_current_user)
) -> Dict[str, Any]:
    """Store a development artifact"""
    try:
        artifact = Artifact(
            id=f"artifact_{datetime.now().timestamp()}",
            name=artifact_data["name"],
            type=artifact_data["type"],
            path=artifact_data["path"],
            content_hash=artifact_data.get("content_hash", ""),
            size=artifact_data.get("size", 0),
            created_by=artifact_data.get("created_by", current_user.get("username", "unknown")),
            created_at=datetime.now(),
            version=artifact_data.get("version", "1.0.0"),
            dependencies=artifact_data.get("dependencies", []),
            metadata=artifact_data.get("metadata", {}),
            tags=artifact_data.get("tags", [])
        )
        
        artifact_id = await integration_controller.artifact_repo.store_artifact(artifact)
        
        return {
            "artifact_id": artifact_id,
            "status": "stored",
            "message": "Artifact stored successfully"
        }
        
    except Exception as e:
        logger.error(f"Failed to store artifact: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/artifacts/{artifact_id}")
async def get_artifact(
    artifact_id: str,
    current_user = Depends(get_current_user)
) -> Dict[str, Any]:
    """Get a development artifact"""
    try:
        artifact = await integration_controller.artifact_repo.get_artifact(artifact_id)
        if not artifact:
            raise HTTPException(status_code=404, detail=f"Artifact {artifact_id} not found")
        
        return {
            "id": artifact.id,
            "name": artifact.name,
            "type": artifact.type,
            "path": artifact.path,
            "content_hash": artifact.content_hash,
            "size": artifact.size,
            "created_by": artifact.created_by,
            "created_at": artifact.created_at.isoformat(),
            "version": artifact.version,
            "dependencies": artifact.dependencies,
            "metadata": artifact.metadata,
            "tags": artifact.tags
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get artifact {artifact_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/health")
async def get_system_health(
    current_user = Depends(get_current_user)
) -> Dict[str, Any]:
    """Get overall system health"""
    try:
        health = await integration_controller.get_system_health()
        return health
        
    except Exception as e:
        logger.error(f"Failed to get system health: {e}")
        raise HTTPException(status_code=500, detail=str(e))
