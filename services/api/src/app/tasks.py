from app.celery_app import celery_app
from app.services.ai_service import AIModelType, AIService
from app.services.workflow_execution_engine import WorkflowExecutionEngine


@celery_app.task
def execute_workflow_async(workflow_id: str, input_data: dict):
    from app.database import SessionLocal
    from app.models.workflow import Workflow

    engine = WorkflowExecutionEngine()
    db = SessionLocal()
    workflow = db.query(Workflow).filter(Workflow.id == workflow_id).first()
    try:
        if not workflow:
            raise ValueError(f"Workflow {workflow_id} not found")
        workflow_def = getattr(workflow, "definition", None)
        if not isinstance(workflow_def, dict):
            import json

            workflow_def = json.loads(workflow_def) if workflow_def else {}
        # Optionally merge input_data into workflow_def if needed
        result = engine.execute_workflow(workflow_def)
        return result
    finally:
        db.close()


@celery_app.task
def process_ai_request(prompt: str, model: str = "gpt-3.5-turbo"):
    ai_service = AIService()
    # Convert string to AIModelType enum
    model_type = (
        AIModelType.GPT_3_5_TURBO if model == "gpt-3.5-turbo" else None
    )
    return ai_service.process_text(prompt, model=model_type)


@celery_app.task
def cleanup_old_executions():
    # Cleanup task for old workflow executions
    pass
