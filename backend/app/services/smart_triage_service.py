"""Smart Triage Service - AI-powered workflow triage and routing."""

import logging
import time
from datetime import datetime
from typing import Any, Dict, List, Optional
from uuid import UUID

from sqlalchemy import and_, func
from sqlalchemy.orm import Session

from app.models.auterity_expansion import TriageResult, TriageRule, TriageRuleType
from app.models.tenant import Tenant
from app.services.ai_service import AIService
from app.services.vector_service import VectorService

logger = logging.getLogger(__name__)


class TriageDecision:
    """Container for triage decision results."""

    def __init__(
        self,
        routing_decision: str,
        confidence_score: float,
        rule_applied: Optional[str] = None,
        reasoning: str = "",
        suggested_actions: List[str] = None,
        processing_time_ms: int = 0,
    ):
        self.routing_decision = routing_decision
        self.confidence_score = confidence_score
        self.rule_applied = rule_applied
        self.reasoning = reasoning
        self.suggested_actions = suggested_actions or []
        self.processing_time_ms = processing_time_ms


class SmartTriageService:
    """AI-powered triage service for intelligent workflow routing."""

    def __init__(self, db: Session):
        self.db = db
        self.ai_service = AIService()
        self.vector_service = VectorService()
        self._rule_cache: Dict[UUID, List[TriageRule]] = {}

    async def triage_input(
        self, content: str, context: Dict[str, Any], tenant_id: UUID
    ) -> TriageDecision:
        """Triage input content and determine routing decision."""
        start_time = time.time()

        try:
            # Validate tenant
            tenant = self.db.query(Tenant).filter(Tenant.id == tenant_id).first()
            if not tenant:
                raise ValueError(f"Tenant {tenant_id} not found")

            # Get active triage rules for tenant
            rules = await self._get_active_triage_rules(tenant_id)

            # Process with AI-based triage
            ai_decision = await self._ai_triage(content, context, rules)

            # Apply rule-based logic if confidence is low
            if ai_decision.confidence_score < 0.7:
                rule_decision = await self._rule_based_triage(content, context, rules)
                if rule_decision.confidence_score > ai_decision.confidence_score:
                    ai_decision = rule_decision

            # Record triage result for learning
            await self._record_triage_result(
                tenant_id,
                content,
                ai_decision.routing_decision,
                ai_decision.confidence_score,
                int((time.time() - start_time) * 1000),
            )

            return ai_decision

        except Exception as e:
            logger.error(f"Triage failed: {str(e)}")
            # Return fallback decision
            return TriageDecision(
                routing_decision="general_queue",
                confidence_score=0.0,
                reasoning=f"Triage failed: {str(e)}",
                processing_time_ms=int((time.time() - start_time) * 1000),
            )

    async def _ai_triage(
        self, content: str, context: Dict[str, Any], rules: List[TriageRule]
    ) -> TriageDecision:
        """AI-based triage using NLP and ML."""
        try:
            # Prepare prompt for AI analysis
            prompt = self._build_triage_prompt(content, context, rules)

            # Get AI response
            ai_response = await self.ai_service.generate_completion(
                prompt=prompt, model="gpt-4", max_tokens=500, temperature=0.1
            )

            # Parse AI response
            decision = self._parse_ai_triage_response(ai_response, content)

            # Enhance with vector similarity if available
            if decision.confidence_score < 0.8:
                vector_enhancement = await self._vector_enhanced_triage(
                    content, context
                )
                if vector_enhancement.confidence_score > decision.confidence_score:
                    decision = vector_enhancement

            return decision

        except Exception as e:
            logger.error(f"AI triage failed: {str(e)}")
            return TriageDecision(
                routing_decision="general_queue",
                confidence_score=0.0,
                reasoning=f"AI triage failed: {str(e)}",
            )

    async def _rule_based_triage(
        self, content: str, context: Dict[str, Any], rules: List[TriageRule]
    ) -> TriageDecision:
        """Rule-based triage using predefined conditions."""
        try:
            best_rule = None
            best_score = 0.0

            for rule in rules:
                if rule.rule_type in [TriageRuleType.RULE_BASED, TriageRuleType.HYBRID]:
                    score = self._evaluate_rule(rule, content, context)
                    if score > best_score and score >= rule.confidence_threshold:
                        best_score = score
                        best_rule = rule

            if best_rule:
                routing_logic = best_rule.routing_logic
                decision = routing_logic.get("default_decision", "general_queue")

                return TriageDecision(
                    routing_decision=decision,
                    confidence_score=best_score,
                    rule_applied=best_rule.name,
                    reasoning=f"Matched rule: {best_rule.name}",
                    suggested_actions=routing_logic.get("suggested_actions", []),
                )

            return TriageDecision(
                routing_decision="general_queue",
                confidence_score=0.0,
                reasoning="No matching rules found",
            )

        except Exception as e:
            logger.error(f"Rule-based triage failed: {str(e)}")
            return TriageDecision(
                routing_decision="general_queue",
                confidence_score=0.0,
                reasoning=f"Rule-based triage failed: {str(e)}",
            )

    async def _vector_enhanced_triage(
        self, content: str, context: Dict[str, Any]
    ) -> TriageDecision:
        """Vector similarity enhanced triage."""
        try:
            # Get similar historical triage decisions
            similar_items = await self.vector_service.find_similar_items(
                content=content, item_type="triage_result", threshold=0.7, limit=5
            )

            if not similar_items:
                return TriageDecision(
                    routing_decision="general_queue",
                    confidence_score=0.0,
                    reasoning="No similar historical data found",
                )

            # Aggregate similar decisions
            routing_counts = {}
            total_similarity = 0.0

            for item in similar_items:
                routing = item.get("routing_decision", "general_queue")
                similarity = item.get("similarity_score", 0.0)

                routing_counts[routing] = routing_counts.get(routing, 0) + similarity
                total_similarity += similarity

            if total_similarity > 0:
                # Find most common routing decision
                best_routing = max(routing_counts.items(), key=lambda x: x[1])[0]
                confidence = routing_counts[best_routing] / total_similarity

                return TriageDecision(
                    routing_decision=best_routing,
                    confidence_score=min(
                        confidence, 0.9
                    ),  # Cap at 0.9 for vector-based
                    reasoning=f"Based on {len(similar_items)} similar historical cases",
                    suggested_actions=[
                        "Review historical patterns",
                        "Validate decision",
                    ],
                )

            return TriageDecision(
                routing_decision="general_queue",
                confidence_score=0.0,
                reasoning="Insufficient similarity data",
            )

        except Exception as e:
            logger.error(f"Vector enhanced triage failed: {str(e)}")
            return TriageDecision(
                routing_decision="general_queue",
                confidence_score=0.0,
                reasoning=f"Vector enhanced triage failed: {str(e)}",
            )

    def _evaluate_rule(
        self, rule: TriageRule, content: str, context: Dict[str, Any]
    ) -> float:
        """Evaluate a rule against content and context."""
        try:
            conditions = rule.conditions
            score = 0.0
            total_conditions = 0

            # Text-based conditions
            if "keywords" in conditions:
                keywords = conditions["keywords"]
                content_lower = content.lower()
                matches = sum(
                    1 for keyword in keywords if keyword.lower() in content_lower
                )
                if matches > 0:
                    score += (matches / len(keywords)) * 0.4
                total_conditions += 1

            # Context-based conditions
            if "context_rules" in conditions:
                context_rules = conditions["context_rules"]
                for field, expected_value in context_rules.items():
                    if field in context:
                        if context[field] == expected_value:
                            score += 0.3
                        total_conditions += 1

            # Sentiment-based conditions
            if "sentiment" in conditions:
                expected_sentiment = conditions["sentiment"]
                # Simple sentiment analysis (in production, use proper NLP)
                sentiment_score = self._analyze_sentiment(content)
                if expected_sentiment == "positive" and sentiment_score > 0.3:
                    score += 0.3
                elif expected_sentiment == "negative" and sentiment_score < -0.3:
                    score += 0.3
                elif expected_sentiment == "neutral" and abs(sentiment_score) <= 0.3:
                    score += 0.3
                total_conditions += 1

            # Normalize score
            if total_conditions > 0:
                score = score / total_conditions

            return min(score, 1.0)

        except Exception as e:
            logger.error(f"Rule evaluation failed: {str(e)}")
            return 0.0

    def _analyze_sentiment(self, content: str) -> float:
        """Simple sentiment analysis (placeholder for production NLP)."""
        # This is a simplified implementation
        # In production, use proper sentiment analysis models
        positive_words = [
            "good",
            "great",
            "excellent",
            "amazing",
            "wonderful",
            "perfect",
        ]
        negative_words = [
            "bad",
            "terrible",
            "awful",
            "horrible",
            "disappointing",
            "broken",
        ]

        content_lower = content.lower()
        positive_count = sum(1 for word in positive_words if word in content_lower)
        negative_count = sum(
            1 for word in word in negative_words if word in content_lower
        )

        if positive_count == 0 and negative_count == 0:
            return 0.0

        return (positive_count - negative_count) / (positive_count + negative_count)

    def _build_triage_prompt(
        self, content: str, context: Dict[str, Any], rules: List[TriageRule]
    ) -> str:
        """Build AI prompt for triage analysis."""
        prompt = f"""You are an AI workflow triage specialist. Analyze the following input and determine the best routing decision.

Input Content: {content}

Context: {context}

Available Routing Options:
- high_priority: Urgent issues requiring immediate attention
- bug_triage: Software bugs and technical issues
- feature_request: New feature requests and enhancements
- general_support: General questions and support requests
- sales_inquiry: Sales and pricing questions
- billing_support: Billing and payment issues
- general_queue: Default routing for unclear cases

Instructions:
1. Analyze the content and context
2. Determine the most appropriate routing decision
3. Provide a confidence score (0.0 to 1.0)
4. Explain your reasoning
5. Suggest any immediate actions

Respond in this exact JSON format:
{{
    "routing_decision": "decision_name",
    "confidence_score": 0.85,
    "reasoning": "Explanation of decision",
    "suggested_actions": ["action1", "action2"]
}}"""

        return prompt

    def _parse_ai_triage_response(
        self, ai_response: str, content: str
    ) -> TriageDecision:
        """Parse AI triage response."""
        try:
            import json

            response_data = json.loads(ai_response)

            return TriageDecision(
                routing_decision=response_data.get("routing_decision", "general_queue"),
                confidence_score=float(response_data.get("confidence_score", 0.0)),
                reasoning=response_data.get("reasoning", "AI analysis"),
                suggested_actions=response_data.get("suggested_actions", []),
            )

        except Exception as e:
            logger.error(f"Failed to parse AI response: {str(e)}")
            return TriageDecision(
                routing_decision="general_queue",
                confidence_score=0.0,
                reasoning="Failed to parse AI response",
            )

    async def _get_active_triage_rules(self, tenant_id: UUID) -> List[TriageRule]:
        """Get active triage rules for a tenant."""
        cache_key = tenant_id

        if cache_key not in self._rule_cache:
            rules = (
                self.db.query(TriageRule)
                .filter(
                    and_(
                        TriageRule.tenant_id == tenant_id, TriageRule.is_active == True
                    )
                )
                .order_by(TriageRule.priority.desc())
                .all()
            )

            self._rule_cache[cache_key] = rules

        return self._rule_cache[cache_key]

    async def _record_triage_result(
        self,
        tenant_id: UUID,
        input_content: str,
        predicted_routing: str,
        confidence_score: float,
        processing_time_ms: int,
    ) -> None:
        """Record triage result for learning and analytics."""
        try:
            triage_result = TriageResult(
                tenant_id=tenant_id,
                input_content=input_content,
                predicted_routing=predicted_routing,
                confidence_score=confidence_score,
                processing_time_ms=processing_time_ms,
            )

            self.db.add(triage_result)
            self.db.commit()

        except Exception as e:
            logger.error(f"Failed to record triage result: {str(e)}")
            self.db.rollback()

    async def create_triage_rule(
        self, tenant_id: UUID, rule_data: Dict[str, Any]
    ) -> TriageRule:
        """Create a new triage rule."""
        try:
            rule = TriageRule(
                tenant_id=tenant_id,
                name=rule_data["name"],
                rule_type=rule_data["rule_type"],
                conditions=rule_data["conditions"],
                routing_logic=rule_data["routing_logic"],
                confidence_threshold=rule_data["confidence_threshold"],
                priority=rule_data.get("priority", 1),
                is_active=rule_data.get("is_active", True),
            )

            self.db.add(rule)
            self.db.commit()
            self.db.refresh(rule)

            # Clear cache for this tenant
            if tenant_id in self._rule_cache:
                del self._rule_cache[tenant_id]

            return rule

        except Exception as e:
            logger.error(f"Failed to create triage rule: {str(e)}")
            self.db.rollback()
            raise

    async def update_triage_rule(
        self, rule_id: UUID, tenant_id: UUID, updates: Dict[str, Any]
    ) -> Optional[TriageRule]:
        """Update an existing triage rule."""
        try:
            rule = (
                self.db.query(TriageRule)
                .filter(
                    and_(TriageRule.id == rule_id, TriageRule.tenant_id == tenant_id)
                )
                .first()
            )

            if not rule:
                return None

            for field, value in updates.items():
                if hasattr(rule, field):
                    setattr(rule, field, value)

            rule.updated_at = datetime.utcnow()
            self.db.commit()
            self.db.refresh(rule)

            # Clear cache for this tenant
            if tenant_id in self._rule_cache:
                del self._rule_cache[tenant_id]

            return rule

        except Exception as e:
            logger.error(f"Failed to update triage rule: {str(e)}")
            self.db.rollback()
            raise

    async def get_triage_accuracy(
        self, tenant_id: UUID, days: int = 30
    ) -> Dict[str, Any]:
        """Get triage accuracy metrics."""
        try:
            from datetime import datetime, timedelta

            cutoff_date = datetime.utcnow() - timedelta(days=days)

            # Get total triage results
            total_results = (
                self.db.query(func.count(TriageResult.id))
                .filter(
                    and_(
                        TriageResult.tenant_id == tenant_id,
                        TriageResult.created_at >= cutoff_date,
                    )
                )
                .scalar()
            )

            # Get results with human overrides
            override_results = (
                self.db.query(func.count(TriageResult.id))
                .filter(
                    and_(
                        TriageResult.tenant_id == tenant_id,
                        TriageResult.created_at >= cutoff_date,
                        TriageResult.human_override.isnot(None),
                    )
                )
                .scalar()
            )

            # Calculate accuracy
            accuracy = 0.0
            if total_results > 0:
                accuracy = ((total_results - override_results) / total_results) * 100

            # Get average confidence
            avg_confidence = (
                self.db.query(func.avg(TriageResult.confidence_score))
                .filter(
                    and_(
                        TriageResult.tenant_id == tenant_id,
                        TriageResult.created_at >= cutoff_date,
                    )
                )
                .scalar()
                or 0.0
            )

            return {
                "total_triages": total_results,
                "human_overrides": override_results,
                "accuracy_percentage": round(accuracy, 2),
                "average_confidence": round(float(avg_confidence), 3),
                "period_days": days,
            }

        except Exception as e:
            logger.error(f"Failed to get triage accuracy: {str(e)}")
            return {
                "total_triages": 0,
                "human_overrides": 0,
                "accuracy_percentage": 0.0,
                "average_confidence": 0.0,
                "period_days": days,
            }
