from app.celery_app import celery_app
from app.tasks import execute_workflow_async, process_ai_request
from fastapi import APIRouter
from pydantic import BaseModel


router = APIRouter(prefix="/tasks", tags=["tasks"])


class WorkflowRequest(BaseModel):
    input_data: dict


class AIRequest(BaseModel):
    prompt: str
    model: str = "gpt-3.5-turbo"


@router.post("/workflow/{workflow_id}")
async def queue_workflow(workflow_id: str, request: WorkflowRequest):
    task = execute_workflow_async.delay(workflow_id, request.input_data)
    return {"task_id": task.id, "status": "queued"}


@router.get("/status/{task_id}")
async def get_task_status(task_id: str):
    result = celery_app.AsyncResult(task_id)
    response = {"task_id": task_id, "status": result.status}
    if result.successful():
        response["result"] = result.result
    elif result.failed():
        response["error"] = str(result.result)
    return response


@router.post("/ai/generate")
async def queue_ai_request(request: AIRequest):
    task = process_ai_request.delay(request.prompt, request.model)
    return {"task_id": task.id, "status": "queued"}
