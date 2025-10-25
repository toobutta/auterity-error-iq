"""Evidently.ai ML monitoring service."""

from datetime import datetime
from typing import Any, Dict, Optional

import pandas as pd
from evidently import ColumnMapping
from evidently.metrics import (
    DataDriftMetric,
    DataQualityMetric,
    RegressionQualityMetric,
)
from evidently.report import Report
from evidently.test_suite import TestSuite
from evidently.tests import (
    TestNumberOfColumnsWithMissingValues,
    TestShareOfMissingValues,
)

from app.config.settings import get_settings


class MLMonitoringService:
    """Evidently.ai ML monitoring service."""

    def __init__(self, service_url: Optional[str] = None):
        """Initialize ML monitoring service."""
        settings = get_settings()
        self.service_url = service_url or getattr(
            settings, "EVIDENTLY_URL", "http://evidently:8085"
        )

        # Default column mapping for AI workflows
        self.column_mapping = ColumnMapping(
            prediction="prediction",
            target="target",
            numerical_features=[],
            categorical_features=[],
        )

    def create_drift_report(
        self,
        reference_data: pd.DataFrame,
        current_data: pd.DataFrame,
        column_mapping: Optional[ColumnMapping] = None,
    ) -> Dict[str, Any]:
        """Create data drift report."""
        mapping = column_mapping or self.column_mapping

        report = Report(metrics=[DataDriftMetric(), DataQualityMetric()])

        report.run(
            reference_data=reference_data,
            current_data=current_data,
            column_mapping=mapping,
        )

        return {
            "report_html": report.get_html(),
            "report_json": report.as_dict(),
            "drift_detected": self._extract_drift_status(report.as_dict()),
            "timestamp": datetime.utcnow().isoformat(),
        }

    def create_model_performance_report(
        self,
        reference_data: pd.DataFrame,
        current_data: pd.DataFrame,
        column_mapping: Optional[ColumnMapping] = None,
    ) -> Dict[str, Any]:
        """Create model performance report."""
        mapping = column_mapping or self.column_mapping

        report = Report(metrics=[RegressionQualityMetric(), DataDriftMetric()])

        report.run(
            reference_data=reference_data,
            current_data=current_data,
            column_mapping=mapping,
        )

        return {
            "report_html": report.get_html(),
            "report_json": report.as_dict(),
            "performance_metrics": self._extract_performance_metrics(
                report.as_dict()
            ),
            "timestamp": datetime.utcnow().isoformat(),
        }

    def run_data_quality_tests(
        self, data: pd.DataFrame, reference_data: Optional[pd.DataFrame] = None
    ) -> Dict[str, Any]:
        """Run data quality test suite."""
        tests = TestSuite(
            tests=[
                TestNumberOfColumnsWithMissingValues(),
                TestShareOfMissingValues(),
            ]
        )

        tests.run(reference_data=reference_data, current_data=data)

        return {
            "test_results": tests.as_dict(),
            "all_tests_passed": self._all_tests_passed(tests.as_dict()),
            "timestamp": datetime.utcnow().isoformat(),
        }

    def monitor_workflow_predictions(
        self,
        workflow_id: str,
        predictions: pd.DataFrame,
        reference_predictions: Optional[pd.DataFrame] = None,
    ) -> Dict[str, Any]:
        """Monitor workflow AI predictions for drift."""
        if reference_predictions is None:
            # Store as reference for future comparisons
            return {
                "status": "reference_stored",
                "workflow_id": workflow_id,
                "timestamp": datetime.utcnow().isoformat(),
            }

        # Create drift report
        drift_report = self.create_drift_report(
            reference_data=reference_predictions, current_data=predictions
        )

        # Add workflow context
        drift_report.update(
            {
                "workflow_id": workflow_id,
                "prediction_count": len(predictions),
                "reference_count": len(reference_predictions),
            }
        )

        return drift_report

    def _extract_drift_status(self, report_dict: Dict[str, Any]) -> bool:
        """Extract drift detection status from report."""
        try:
            metrics = report_dict.get("metrics", [])
            for metric in metrics:
                if metric.get("metric") == "DataDriftMetric":
                    return metric.get("result", {}).get(
                        "drift_detected", False
                    )
            return False
        except Exception:
            return False

    def _extract_performance_metrics(
        self, report_dict: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Extract performance metrics from report."""
        try:
            metrics = report_dict.get("metrics", [])
            for metric in metrics:
                if metric.get("metric") == "RegressionQualityMetric":
                    result = metric.get("result", {})
                    return {
                        "mae": result.get("current", {}).get("mean_abs_error"),
                        "mse": result.get("current", {}).get(
                            "mean_squared_error"
                        ),
                        "r2": result.get("current", {}).get("r2_score"),
                    }
            return {}
        except Exception:
            return {}

    def _all_tests_passed(self, test_results: Dict[str, Any]) -> bool:
        """Check if all tests passed."""
        try:
            tests = test_results.get("tests", [])
            return all(test.get("status") == "SUCCESS" for test in tests)
        except Exception:
            return False

    def get_monitoring_dashboard_url(self) -> str:
        """Get Evidently dashboard URL."""
        return self.service_url


# Global ML monitoring service instance
_ml_monitoring_service: Optional[MLMonitoringService] = None


def get_ml_monitoring_service() -> MLMonitoringService:
    """Get global ML monitoring service instance."""
    global _ml_monitoring_service
    if _ml_monitoring_service is None:
        _ml_monitoring_service = MLMonitoringService()
    return _ml_monitoring_service
