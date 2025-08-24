"""Mock Smart Triage Service for testing without heavy ML dependencies."""

import logging
import uuid
from datetime import datetime
from typing import Any, Dict
from uuid import UUID

logger = logging.getLogger(__name__)


class MockSmartTriageService:
    """Mock implementation of Smart Triage Service for testing."""

    def __init__(self):
        self.logger = logger
        self.logger.info("MockSmartTriageService initialized")

    async def triage_content(
        self, tenant_id: UUID, content: str, context: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """Mock triage content processing."""
        self.logger.info(f"Mock triaging content for tenant {tenant_id}")

        # Mock triage logic
        if "urgent" in content.lower() or "critical" in content.lower():
            priority = "high"
            confidence = 0.95
            route_to = "urgent_support"
        elif "bug" in content.lower() or "error" in content.lower():
            priority = "medium"
            confidence = 0.85
            route_to = "technical_support"
        else:
            priority = "low"
            confidence = 0.75
            route_to = "general_support"

        return {
            "triage_id": str(uuid.uuid4()),
            "tenant_id": str(tenant_id),
            "priority": priority,
            "confidence_score": confidence,
            "routing_decision": route_to,
            "processing_time_ms": 150,
            "rule_applied": "mock_rule_001",
            "timestamp": datetime.utcnow().isoformat(),
        }

    async def create_triage_rule(
        self, tenant_id: UUID, rule_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Mock create triage rule."""
        self.logger.info(f"Mock creating triage rule for tenant {tenant_id}")

        rule_id = str(uuid.uuid4())
        return {
            "id": rule_id,
            "tenant_id": str(tenant_id),
            "name": rule_data.get("name", "Mock Rule"),
            "rule_type": rule_data.get("rule_type", "hybrid"),
            "conditions": rule_data.get("conditions", {}),
            "routing_logic": rule_data.get("routing_logic", {}),
            "confidence_threshold": rule_data.get("confidence_threshold", 0.8),
            "priority": rule_data.get("priority", 1),
            "is_active": True,
            "created_at": datetime.utcnow().isoformat(),
        }

    async def get_triage_accuracy(
        self, tenant_id: UUID, days: int = 30
    ) -> Dict[str, Any]:
        """Mock get triage accuracy metrics."""
        self.logger.info(f"Mock getting triage accuracy for tenant {tenant_id}")

        return {
            "tenant_id": str(tenant_id),
            "period_days": days,
            "total_triaged": 1250,
            "correct_routing": 1187,
            "accuracy_percentage": 94.96,
            "average_confidence": 0.87,
            "processing_time_avg_ms": 145,
            "rule_effectiveness": {
                "hybrid_rules": 0.96,
                "ml_based": 0.93,
                "rule_based": 0.89,
            },
        }

    async def analyze_sentiment(self, text: str) -> Dict[str, Any]:
        """Mock sentiment analysis."""
        self.logger.info("Mock analyzing sentiment")

        # Simple keyword-based sentiment
        positive_words = ["good", "great", "excellent", "amazing", "wonderful"]
        negative_words = ["bad", "terrible", "awful", "horrible", "disappointing"]

        text_lower = text.lower()
        positive_count = sum(1 for word in positive_words if word in text_lower)
        negative_count = sum(1 for word in negative_words if word in text_lower)

        if positive_count > negative_count:
            sentiment = "positive"
            score = 0.7
        elif negative_count > positive_count:
            sentiment = "negative"
            score = -0.6
        else:
            sentiment = "neutral"
            score = 0.0

        return {
            "sentiment": sentiment,
            "score": score,
            "confidence": 0.8,
            "keywords": {
                "positive": [w for w in positive_words if w in text_lower],
                "negative": [w for w in negative_words if w in text_lower],
            },
        }
