import os
from typing import Any, Dict, Optional

import mlflow


class MLflowService:
    def __init__(self):
        mlflow.set_tracking_uri(
            os.getenv("MLFLOW_TRACKING_URI", "http://mlflow:5000")
        )

    def log_workflow_metrics(self, workflow_id: str, metrics: Dict[str, Any]):
        with mlflow.start_run(run_name=f"workflow_{workflow_id}"):
            for key, value in metrics.items():
                mlflow.log_metric(key, value)

    def log_model_performance(
        self, model_name: str, accuracy: float, latency: float
    ):
        with mlflow.start_run(run_name=f"model_{model_name}"):
            mlflow.log_metric("accuracy", accuracy)
            mlflow.log_metric("latency_ms", latency)

    def get_best_model(self, model_name: str) -> Optional[str]:
        try:
            client = mlflow.tracking.MlflowClient()
            experiment = client.get_experiment_by_name(model_name)
            if experiment:
                runs = client.search_runs(experiment.experiment_id)
                if runs:
                    best_run = max(
                        runs, key=lambda r: r.data.metrics.get("accuracy", 0)
                    )
                    return best_run.info.run_id
        except Exception:
            pass
        return None


mlflow_service = MLflowService()
