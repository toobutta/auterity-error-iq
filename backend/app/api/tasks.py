from app.celery_app import celery_app
from app.tasks import execute_workflow_async, process_ai_request
from fastapi import APIRouter

router = APIRouter(prefix="/tasks", tags=["tasks"])


@router.post("/workflow/{workflow_id}")
async def queue_workflow(workflow_id: str, input_data: dict):
    task = execute_workflow_async.delay(workflow_id, input_data)
    return {"task_id": task.id, "status": "queued"}


@router.get("/status/{task_id}")
async def get_task_status(task_id: str):
    result = celery_app.AsyncResult(task_id)
    return {"task_id": task_id, "status": result.status, "result": result.result}


@router.post("/ai/generate")
async def queue_ai_request(prompt: str, model: str = "gpt-3.5-turbo"):
    task = process_ai_request.delay(prompt, model)
    return {"task_id": task.id, "status": "queued"}
