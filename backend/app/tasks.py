from app.celery_app import celery_app
from app.services.ai_service import AIService
from app.services.workflow_execution_engine import WorkflowExecutionEngine


@celery_app.task
def execute_workflow_async(workflow_id: str, input_data: dict):
    engine = WorkflowExecutionEngine()
    return engine.execute_workflow(workflow_id, input_data)


@celery_app.task
def process_ai_request(prompt: str, model: str = "gpt-3.5-turbo"):
    ai_service = AIService()
    return ai_service.generate_response(prompt, model)


@celery_app.task
def cleanup_old_executions():
    # Cleanup task for old workflow executions
    pass
