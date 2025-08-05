"""
NeuroWeaver Alerts API
Endpoints for alert management and monitoring
"""

from fastapi import APIRouter, HTTPException
from typing import Optional

from app.services.alert_manager import AlertManager, AlertType, AlertSeverity

router = APIRouter()
alert_manager = AlertManager()

@router.get("/alerts")
async def get_alerts(model_id: Optional[str] = None):
    """Get active alerts, optionally filtered by model"""
    try:
        alerts = alert_manager.get_active_alerts(model_id)
        
        return {
            "success": True,
            "data": {
                "alerts": [
                    {
                        "id": str(id(alert)),
                        "type": alert.alert_type.value,
                        "severity": alert.severity.value,
                        "model_id": alert.model_id,
                        "message": alert.message,
                        "timestamp": alert.timestamp.isoformat(),
                        "metadata": alert.metadata
                    }
                    for alert in alerts
                ],
                "count": len(alerts)
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/alerts/summary")
async def get_alert_summary():
    """Get alert summary statistics"""
    try:
        summary = alert_manager.get_alert_summary()
        return {"success": True, "data": summary}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/alerts/{alert_id}/resolve")
async def resolve_alert(alert_id: str, resolution_message: str = ""):
    """Mark an alert as resolved"""
    try:
        await alert_manager.resolve_alert(alert_id, resolution_message)
        return {"success": True, "message": "Alert resolved"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/alerts/test")
async def create_test_alert(model_id: str = "test-model"):
    """Create a test alert for testing purposes"""
    try:
        alert = await alert_manager.create_alert(
            AlertType.PERFORMANCE_DEGRADATION,
            AlertSeverity.WARNING,
            model_id,
            "Test alert for monitoring system validation"
        )
        
        return {
            "success": True,
            "message": "Test alert created",
            "alert_id": str(id(alert))
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))