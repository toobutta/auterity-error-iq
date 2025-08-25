"""Tests for Smart Triage Service."""

from unittest.mock import AsyncMock, Mock, patch
from uuid import uuid4

import pytest
from app.models.auterity_expansion import TriageRule, TriageRuleType
from app.models.tenant import Tenant
from app.services.smart_triage_service import SmartTriageService, TriageDecision


class TestSmartTriageService:
    """Test cases for SmartTriageService."""

    @pytest.fixture
    def mock_db(self):
        """Mock database session."""
        return Mock()

    @pytest.fixture
    def mock_tenant(self):
        """Mock tenant."""
        tenant = Mock(spec=Tenant)
        tenant.id = uuid4()
        tenant.name = "Test Tenant"
        return tenant

    @pytest.fixture
    def mock_triage_rules(self):
        """Mock triage rules."""
        rules = []

        # ML-based rule
        ml_rule = Mock(spec=TriageRule)
        ml_rule.id = uuid4()
        ml_rule.name = "ML Bug Detection"
        ml_rule.rule_type = TriageRuleType.ML
        ml_rule.conditions = {"keywords": ["bug", "error", "crash"]}
        ml_rule.routing_logic = {"default_decision": "bug_triage"}
        ml_rule.confidence_threshold = 0.8
        ml_rule.priority = 1
        ml_rule.is_active = True
        rules.append(ml_rule)

        # Rule-based rule
        rule_based = Mock(spec=TriageRule)
        rule_based.id = uuid4()
        rule_based.name = "High Priority Keywords"
        rule_based.rule_type = TriageRuleType.RULE_BASED
        rule_based.conditions = {"keywords": ["urgent", "critical", "emergency"]}
        rule_based.routing_logic = {"default_decision": "high_priority"}
        rule_based.confidence_threshold = 0.7
        rule_based.priority = 2
        rule_based.is_active = True
        rules.append(rule_based)

        return rules

    @pytest.fixture
    def service(self, mock_db):
        """Create service instance with mocked dependencies."""
        with (
            patch("app.services.smart_triage_service.AIService") as mock_ai,
            patch("app.services.smart_triage_service.VectorService") as mock_vector,
        ):
            mock_ai_instance = Mock()
            mock_ai_instance.generate_completion = AsyncMock(
                return_value='{"routing_decision": "bug_triage", "confidence_score": 0.85, "reasoning": "Contains bug-related keywords", "suggested_actions": ["Assign to dev team"]}'
            )

            mock_vector_instance = Mock()
            mock_vector_instance.find_similar_items = AsyncMock(return_value=[])

            mock_ai.return_value = mock_ai_instance
            mock_vector.return_value = mock_vector_instance

            service = SmartTriageService(mock_db)
            return service

    @pytest.mark.asyncio
    async def test_triage_input_success(self, service, mock_db, mock_tenant):
        """Test successful triage input processing."""
        # Mock tenant query
        mock_db.query.return_value.filter.return_value.first.return_value = mock_tenant

        # Mock triage rules query
        mock_db.query.return_value.filter.return_value.order_by.return_value.all.return_value = (
            []
        )

        # Mock triage result creation
        mock_db.add = Mock()
        mock_db.commit = Mock()

        # Test triage
        result = await service.triage_input(
            content="I found a bug in the login system",
            context={"user_type": "customer"},
            tenant_id=mock_tenant.id,
        )

        assert isinstance(result, TriageDecision)
        assert result.routing_decision in ["bug_triage", "general_queue"]
        assert result.confidence_score >= 0.0
        assert result.processing_time_ms >= 0

    @pytest.mark.asyncio
    async def test_triage_input_tenant_not_found(self, service, mock_db):
        """Test triage with non-existent tenant."""
        # Mock tenant query to return None
        mock_db.query.return_value.filter.return_value.first.return_value = None

        with pytest.raises(ValueError, match="Tenant .* not found"):
            await service.triage_input(
                content="Test content", context={}, tenant_id=uuid4()
            )

    @pytest.mark.asyncio
    async def test_ai_triage_success(self, service):
        """Test AI-based triage success."""
        content = "Critical bug in production system"
        context = {"priority": "high"}
        rules = []

        result = await service._ai_triage(content, context, rules)

        assert isinstance(result, TriageDecision)
        assert result.routing_decision == "bug_triage"
        assert result.confidence_score == 0.85
        assert "bug-related keywords" in result.reasoning

    @pytest.mark.asyncio
    async def test_ai_triage_failure(self, service):
        """Test AI-based triage failure."""
        # Mock AI service to raise exception
        service.ai_service.generate_completion = AsyncMock(
            side_effect=Exception("AI service error")
        )

        content = "Test content"
        context = {}
        rules = []

        result = await service._ai_triage(content, context, rules)

        assert isinstance(result, TriageDecision)
        assert result.routing_decision == "general_queue"
        assert result.confidence_score == 0.0
        assert "AI triage failed" in result.reasoning

    @pytest.mark.asyncio
    async def test_rule_based_triage_success(self, service, mock_triage_rules):
        """Test rule-based triage success."""
        content = "Urgent issue with the system"
        context = {"user_type": "admin"}

        result = await service._rule_based_triage(content, context, mock_triage_rules)

        assert isinstance(result, TriageDecision)
        assert result.routing_decision == "high_priority"
        assert result.confidence_score > 0.0
        assert "High Priority Keywords" in result.reasoning

    @pytest.mark.asyncio
    async def test_rule_based_triage_no_match(self, service, mock_triage_rules):
        """Test rule-based triage with no matching rules."""
        content = "General question about features"
        context = {}

        result = await service._rule_based_triage(content, context, mock_triage_rules)

        assert isinstance(result, TriageDecision)
        assert result.routing_decision == "general_queue"
        assert result.confidence_score == 0.0
        assert "No matching rules found" in result.reasoning

    def test_evaluate_rule_keywords_match(self, service):
        """Test rule evaluation with keyword matching."""
        rule = Mock(spec=TriageRule)
        rule.conditions = {"keywords": ["bug", "error", "crash"]}

        content = "I found a bug in the system"
        context = {}

        score = service._evaluate_rule(rule, content, context)

        assert score > 0.0
        assert score <= 1.0

    def test_evaluate_rule_context_match(self, service):
        """Test rule evaluation with context matching."""
        rule = Mock(spec=TriageRule)
        rule.conditions = {"context_rules": {"user_type": "admin"}}

        content = "System issue"
        context = {"user_type": "admin"}

        score = service._evaluate_rule(rule, content, context)

        assert score > 0.0
        assert score <= 1.0

    def test_evaluate_rule_sentiment_positive(self, service):
        """Test rule evaluation with positive sentiment."""
        rule = Mock(spec=TriageRule)
        rule.conditions = {"sentiment": "positive"}

        content = "Great system, works perfectly!"
        context = {}

        score = service._evaluate_rule(rule, content, context)

        assert score > 0.0
        assert score <= 1.0

    def test_analyze_sentiment_positive(self, service):
        """Test sentiment analysis for positive content."""
        content = "This is a great system with excellent features"
        sentiment = service._analyze_sentiment(content)

        assert sentiment > 0.0
        assert sentiment <= 1.0

    def test_analyze_sentiment_negative(self, service):
        """Test sentiment analysis for negative content."""
        content = "This system is terrible and broken"
        sentiment = service._analyze_sentiment(content)

        assert sentiment < 0.0
        assert sentiment >= -1.0

    def test_analyze_sentiment_neutral(self, service):
        """Test sentiment analysis for neutral content."""
        content = "The system processes data and shows results"
        sentiment = service._analyze_sentiment(content)

        assert abs(sentiment) <= 0.3

    def test_build_triage_prompt(self, service):
        """Test triage prompt building."""
        content = "System error occurred"
        context = {"priority": "high"}
        rules = []

        prompt = service._build_triage_prompt(content, context, rules)

        assert "System error occurred" in prompt
        assert "priority" in prompt
        assert "routing_decision" in prompt
        assert "confidence_score" in prompt

    def test_parse_ai_triage_response_valid(self, service):
        """Test parsing valid AI triage response."""
        ai_response = '{"routing_decision": "bug_triage", "confidence_score": 0.9, "reasoning": "Contains error keywords", "suggested_actions": ["Assign to dev"]}'
        content = "Test content"

        result = service._parse_ai_triage_response(ai_response, content)

        assert isinstance(result, TriageDecision)
        assert result.routing_decision == "bug_triage"
        assert result.confidence_score == 0.9
        assert "Contains error keywords" in result.reasoning
        assert ["Assign to dev"] == result.suggested_actions

    def test_parse_ai_triage_response_invalid(self, service):
        """Test parsing invalid AI triage response."""
        ai_response = "Invalid JSON response"
        content = "Test content"

        result = service._parse_ai_triage_response(ai_response, content)

        assert isinstance(result, TriageDecision)
        assert result.routing_decision == "general_queue"
        assert result.confidence_score == 0.0
        assert "Failed to parse AI response" in result.reasoning

    @pytest.mark.asyncio
    async def test_get_active_triage_rules(self, service, mock_db, mock_triage_rules):
        """Test getting active triage rules."""
        # Mock database query
        mock_db.query.return_value.filter.return_value.order_by.return_value.all.return_value = (
            mock_triage_rules
        )

        # Test cache miss
        rules = await service._get_active_triage_rules(uuid4())

        assert len(rules) == 2
        assert all(rule.is_active for rule in rules)

        # Test cache hit
        rules_cached = await service._get_active_triage_rules(uuid4())

        assert len(rules_cached) == 2
        # Should use cached result, so database should only be queried once
        assert mock_db.query.call_count == 1

    @pytest.mark.asyncio
    async def test_record_triage_result(self, service, mock_db):
        """Test recording triage result."""
        tenant_id = uuid4()
        content = "Test content"
        routing = "bug_triage"
        confidence = 0.85
        processing_time = 150

        await service._record_triage_result(
            tenant_id, content, routing, confidence, processing_time
        )

        mock_db.add.assert_called_once()
        mock_db.commit.assert_called_once()

    @pytest.mark.asyncio
    async def test_create_triage_rule(self, service, mock_db):
        """Test creating a triage rule."""
        tenant_id = uuid4()
        rule_data = {
            "name": "Test Rule",
            "rule_type": "ml",
            "conditions": {"keywords": ["test"]},
            "routing_logic": {"default_decision": "test_queue"},
            "confidence_threshold": 0.8,
            "priority": 1,
            "is_active": True,
        }

        # Mock rule creation
        mock_rule = Mock(spec=TriageRule)
        mock_rule.id = uuid4()
        mock_rule.tenant_id = tenant_id
        mock_rule.name = rule_data["name"]
        mock_rule.rule_type = TriageRuleType.ML
        mock_rule.conditions = rule_data["conditions"]
        mock_rule.routing_logic = rule_data["routing_logic"]
        mock_rule.confidence_threshold = rule_data["confidence_threshold"]
        mock_rule.priority = rule_data["priority"]
        mock_rule.is_active = rule_data["is_active"]

        mock_db.add.return_value = None
        mock_db.commit.return_value = None
        mock_db.refresh.return_value = None

        result = await service.create_triage_rule(tenant_id, rule_data)

        assert result == mock_rule
        mock_db.add.assert_called_once()
        mock_db.commit.assert_called_once()

    @pytest.mark.asyncio
    async def test_get_triage_accuracy(self, service, mock_db):
        """Test getting triage accuracy metrics."""
        tenant_id = uuid4()
        days = 30

        # Mock database queries
        mock_db.query.return_value.filter.return_value.scalar.side_effect = [
            100,
            5,
            0.85,
        ]

        accuracy = await service.get_triage_accuracy(tenant_id, days)

        assert accuracy["total_triages"] == 100
        assert accuracy["human_overrides"] == 5
        assert accuracy["accuracy_percentage"] == 95.0
        assert accuracy["average_confidence"] == 0.85
        assert accuracy["period_days"] == 30


if __name__ == "__main__":
    pytest.main([__file__])
