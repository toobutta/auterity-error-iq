"""Process Mining Engine for analyzing workflow execution patterns."""

import logging
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from collections import defaultdict, Counter
from uuid import UUID

import numpy as np
from sqlalchemy import and_, desc
from sqlalchemy.orm import Session

from app.models.execution import WorkflowExecution, ExecutionLog, ExecutionStatus
from app.services.advanced_analytics_service import AdvancedAnalyticsService

logger = logging.getLogger(__name__)


@dataclass
class ProcessPattern:
    """Represents a discovered process pattern."""

    pattern_id: str
    pattern_type: str  # "sequence", "parallel", "choice", "loop"
    steps: List[str]
    frequency: int
    avg_duration: float
    success_rate: float
    confidence: float
    support: float
    first_seen: datetime
    last_seen: datetime
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class BottleneckAnalysis:
    """Analysis of workflow bottlenecks."""

    step_name: str
    avg_duration: float
    max_duration: float
    frequency: int
    impact_score: float  # 0-1, higher means more significant bottleneck
    recommendations: List[str] = field(default_factory=list)


@dataclass
class ProcessMiningResult:
    """Complete process mining analysis result."""

    workflow_id: UUID
    analysis_period: str
    total_executions: int
    patterns_discovered: List[ProcessPattern]
    bottlenecks: List[BottleneckAnalysis]
    efficiency_score: float
    optimization_opportunities: List[str]
    generated_at: datetime


class ProcessMiningEngine:
    """Process Mining Engine for workflow pattern analysis.

    Leverages existing execution logs and analytics infrastructure
    to discover patterns, identify bottlenecks, and suggest optimizations.
    """

    def __init__(self, db: Session):
        self.db = db
        self.analytics_service = AdvancedAnalyticsService(db)
        self.cache = {}  # Simple in-memory cache

    async def analyze_workflow_patterns(
        self,
        workflow_id: UUID,
        days_back: int = 30,
        min_support: float = 0.1,
        min_confidence: float = 0.7
    ) -> ProcessMiningResult:
        """Analyze workflow execution patterns using process mining techniques."""

        try:
            # Get execution data
            executions = await self._get_workflow_executions(workflow_id, days_back)
            if not executions:
                return self._create_empty_result(workflow_id, days_back)

            # Extract execution logs
            execution_logs = await self._get_execution_logs(workflow_id, days_back)

            # Discover patterns
            patterns = await self._discover_patterns(
                executions, execution_logs, min_support, min_confidence
            )

            # Analyze bottlenecks
            bottlenecks = await self._analyze_bottlenecks(execution_logs)

            # Calculate efficiency score
            efficiency_score = await self._calculate_efficiency_score(
                executions, execution_logs
            )

            # Generate optimization opportunities
            optimization_opportunities = await self._generate_optimization_opportunities(
                patterns, bottlenecks, efficiency_score
            )

            result = ProcessMiningResult(
                workflow_id=workflow_id,
                analysis_period=f"Last {days_back} days",
                total_executions=len(executions),
                patterns_discovered=patterns,
                bottlenecks=bottlenecks,
                efficiency_score=efficiency_score,
                optimization_opportunities=optimization_opportunities,
                generated_at=datetime.utcnow()
            )

            # Cache results
            await self._cache_analysis_result(workflow_id, result)

            return result

        except Exception as e:
            logger.error(f"Process mining analysis failed for workflow {workflow_id}: {str(e)}")
            return self._create_empty_result(workflow_id, days_back)

    async def _get_workflow_executions(
        self, workflow_id: UUID, days_back: int
    ) -> List[WorkflowExecution]:
        """Get workflow executions for analysis period."""
        period_start = datetime.utcnow() - timedelta(days=days_back)

        executions = (
            self.db.query(WorkflowExecution)
            .filter(
                and_(
                    WorkflowExecution.workflow_id == workflow_id,
                    WorkflowExecution.started_at >= period_start,
                )
            )
            .order_by(desc(WorkflowExecution.started_at))
            .all()
        )

        return executions

    async def _get_execution_logs(
        self, workflow_id: UUID, days_back: int
    ) -> List[ExecutionLog]:
        """Get detailed execution logs for pattern analysis."""
        period_start = datetime.utcnow() - timedelta(days=days_back)

        # Get executions first
        executions = await self._get_workflow_executions(workflow_id, days_back)
        execution_ids = [exec.id for exec in executions]

        if not execution_ids:
            return []

        logs = (
            self.db.query(ExecutionLog)
            .filter(
                and_(
                    ExecutionLog.execution_id.in_(execution_ids),
                    ExecutionLog.timestamp >= period_start,
                )
            )
            .order_by(ExecutionLog.execution_id, ExecutionLog.timestamp)
            .all()
        )

        return logs

    async def _discover_patterns(
        self,
        executions: List[WorkflowExecution],
        logs: List[ExecutionLog],
        min_support: float,
        min_confidence: float
    ) -> List[ProcessPattern]:
        """Discover process patterns using sequence mining techniques."""

        patterns = []

        # Group logs by execution
        execution_sequences = defaultdict(list)
        for log in logs:
            execution_sequences[log.execution_id].append(log)

        # Sort each sequence by timestamp
        for execution_id in execution_sequences:
            execution_sequences[execution_id].sort(key=lambda x: x.timestamp)

        # Extract step sequences
        sequences = []
        for execution_id, logs_list in execution_sequences.items():
            sequence = [log.step_name for log in logs_list]
            sequences.append(sequence)

        if not sequences:
            return patterns

        # Find frequent sequences (simplified approach)
        frequent_patterns = await self._find_frequent_sequences(
            sequences, min_support
        )

        # Analyze each pattern
        for pattern_data in frequent_patterns:
            pattern = await self._analyze_pattern(
                pattern_data, executions, logs, min_confidence
            )
            if pattern:
                patterns.append(pattern)

        return patterns

    async def _find_frequent_sequences(
        self, sequences: List[List[str]], min_support: float
    ) -> List[Dict[str, Any]]:
        """Find frequent sequences in execution logs."""

        # Count step frequencies
        step_counts = Counter()
        for sequence in sequences:
            for step in sequence:
                step_counts[step] += 1

        total_sequences = len(sequences)
        min_count = int(total_sequences * min_support)

        # Find frequent individual steps (not used in this simplified version)
        # frequent_steps = {
        #     step: count for step, count in step_counts.items()
        #     if count >= min_count
        # }

        # Find frequent pairs (simplified bigram analysis)
        pair_counts = Counter()
        for sequence in sequences:
            for i in range(len(sequence) - 1):
                pair = (sequence[i], sequence[i + 1])
                pair_counts[pair] += 1

        frequent_pairs = [
            {"steps": list(pair), "count": count, "type": "sequence"}
            for pair, count in pair_counts.items()
            if count >= min_count
        ]

        return frequent_pairs

    async def _analyze_pattern(
        self,
        pattern_data: Dict[str, Any],
        executions: List[WorkflowExecution],
        logs: List[ExecutionLog],
        min_confidence: float
    ) -> Optional[ProcessPattern]:
        """Analyze a discovered pattern in detail."""

        try:
            steps = pattern_data["steps"]
            pattern_type = pattern_data.get("type", "sequence")
            frequency = pattern_data["count"]

            # Calculate pattern metrics
            pattern_logs = []
            for log in logs:
                if log.step_name in steps:
                    pattern_logs.append(log)

            if not pattern_logs:
                return None

            # Calculate duration and success metrics
            durations = []
            successful_executions = 0
            total_executions = len(set(log.execution_id for log in pattern_logs))

            execution_durations = defaultdict(list)
            for log in pattern_logs:
                if log.duration_ms:
                    execution_durations[log.execution_id].append(log.duration_ms)

            for execution_id, durations_list in execution_durations.items():
                if durations_list:
                    durations.append(sum(durations_list))
                    # Check if execution was successful
                    execution = next(
                        (e for e in executions if e.id == execution_id), None
                    )
                    if execution and execution.status == ExecutionStatus.COMPLETED:
                        successful_executions += 1

            avg_duration = float(np.mean(durations)) if durations else 0.0
            success_rate = (successful_executions / total_executions * 100) if total_executions > 0 else 0

            # Calculate confidence (simplified)
            confidence = success_rate / 100.0

            if confidence < min_confidence:
                return None

            # Calculate support
            total_possible = len(executions)
            support = frequency / total_possible if total_possible > 0 else 0

            # Get timestamps
            timestamps = [log.timestamp for log in pattern_logs]
            first_seen = min(timestamps) if timestamps else datetime.utcnow()
            last_seen = max(timestamps) if timestamps else datetime.utcnow()

            return ProcessPattern(
                pattern_id=f"{pattern_type}_{'_'.join(steps)}",
                pattern_type=pattern_type,
                steps=steps,
                frequency=frequency,
                avg_duration=avg_duration,
                success_rate=success_rate,
                confidence=confidence,
                support=support,
                first_seen=first_seen,
                last_seen=last_seen,
                metadata={
                    "total_executions": total_executions,
                    "successful_executions": successful_executions,
                    "avg_step_duration": avg_duration / len(steps) if steps else 0
                }
            )

        except Exception as e:
            logger.error(f"Pattern analysis failed: {str(e)}")
            return None

    async def _analyze_bottlenecks(
        self, logs: List[ExecutionLog]
    ) -> List[BottleneckAnalysis]:
        """Analyze workflow bottlenecks."""

        bottlenecks = []

        # Group logs by step
        step_stats = defaultdict(list)
        for log in logs:
            if log.duration_ms:
                step_stats[log.step_name].append(log.duration_ms)

        # Analyze each step
        for step_name, durations in step_stats.items():
            if not durations:
                continue

            avg_duration = float(np.mean(durations))
            max_duration = float(max(durations))
            frequency = len(durations)

            # Calculate impact score (simplified)
            # Higher score = more significant bottleneck
            impact_score = float(min(avg_duration / 10000.0, 1.0))  # Normalize to 0-1

            # Generate recommendations
            recommendations = []
            if avg_duration > 5000:  # 5 seconds
                recommendations.append("Consider optimizing this step for better performance")
            if max_duration > avg_duration * 3:
                recommendations.append("High variance detected - investigate inconsistent performance")
            if frequency > 100:
                recommendations.append("High-frequency step - consider caching or parallelization")

            bottlenecks.append(BottleneckAnalysis(
                step_name=step_name,
                avg_duration=avg_duration,
                max_duration=max_duration,
                frequency=frequency,
                impact_score=impact_score,
                recommendations=recommendations
            ))

        # Sort by impact score
        bottlenecks.sort(key=lambda x: x.impact_score, reverse=True)

        return bottlenecks[:10]  # Return top 10 bottlenecks

    async def _calculate_efficiency_score(
        self,
        executions: List[WorkflowExecution],
        logs: List[ExecutionLog]
    ) -> float:
        """Calculate overall workflow efficiency score."""

        if not executions:
            return 0.0

        # Success rate (40% weight)
        successful_executions = len([
            e for e in executions
            if e.status == ExecutionStatus.COMPLETED
        ])
        success_rate = successful_executions / len(executions)

        # Average execution time efficiency (30% weight)
        execution_durations = []
        for execution in executions:
            if execution.completed_at and execution.started_at:
                duration = (execution.completed_at - execution.started_at).total_seconds() * 1000
                execution_durations.append(duration)

        avg_duration = float(np.mean(execution_durations)) if execution_durations else 0.0
        # Normalize duration (lower is better, target < 30000ms = 30s)
        duration_score = max(0, 1 - (avg_duration / 30000))

        # Bottleneck impact (30% weight)
        bottlenecks = await self._analyze_bottlenecks(logs)
        bottleneck_score = 1.0
        if bottlenecks:
            avg_impact = float(np.mean([b.impact_score for b in bottlenecks]))
            bottleneck_score = 1 - avg_impact

        # Calculate weighted efficiency score
        efficiency_score = (
            success_rate * 0.4 +
            duration_score * 0.3 +
            bottleneck_score * 0.3
        )

        return round(efficiency_score, 3)

    async def _generate_optimization_opportunities(
        self,
        patterns: List[ProcessPattern],
        bottlenecks: List[BottleneckAnalysis],
        efficiency_score: float
    ) -> List[str]:
        """Generate optimization opportunities based on analysis."""

        opportunities = []

        # Pattern-based opportunities
        for pattern in patterns:
            if pattern.success_rate < 80:
                opportunities.append(
                    f"Improve success rate for pattern '{pattern.pattern_id}' "
                    f"(currently {pattern.success_rate:.1f}%)"
                )
            if pattern.avg_duration > 5000:
                opportunities.append(
                    f"Optimize duration for pattern '{pattern.pattern_id}' "
                    f"(currently {pattern.avg_duration:.0f}ms average)"
                )

        # Bottleneck-based opportunities
        for bottleneck in bottlenecks[:3]:  # Top 3 bottlenecks
            if bottleneck.impact_score > 0.7:
                opportunities.append(
                    f"Address critical bottleneck in '{bottleneck.step_name}' "
                    f"(impact score: {bottleneck.impact_score:.2f})"
                )

        # Efficiency-based opportunities
        if efficiency_score < 0.7:
            opportunities.append(
                f"Overall efficiency is low ({efficiency_score:.2f}) - "
                "consider comprehensive workflow optimization"
            )
        elif efficiency_score < 0.85:
            opportunities.append(
                f"Moderate efficiency ({efficiency_score:.2f}) - "
                "focus on bottleneck resolution and success rate improvement"
            )

        # Remove duplicates and limit to top 5
        seen = set()
        unique_opportunities = []
        for opp in opportunities:
            if opp not in seen:
                unique_opportunities.append(opp)
                seen.add(opp)

        return unique_opportunities[:5]

    async def _cache_analysis_result(
        self, workflow_id: UUID, result: ProcessMiningResult
    ):
        """Cache analysis results for performance."""
        cache_key = f"analysis:{workflow_id}"
        self.cache[cache_key] = result  # Simple in-memory cache

    def _create_empty_result(
        self, workflow_id: UUID, days_back: int
    ) -> ProcessMiningResult:
        """Create empty result for workflows with no data."""
        return ProcessMiningResult(
            workflow_id=workflow_id,
            analysis_period=f"Last {days_back} days",
            total_executions=0,
            patterns_discovered=[],
            bottlenecks=[],
            efficiency_score=0.0,
            optimization_opportunities=["Insufficient data for analysis"],
            generated_at=datetime.utcnow()
        )

    async def get_cached_analysis(
        self, workflow_id: UUID
    ) -> Optional[ProcessMiningResult]:
        """Get cached analysis result if available."""
        cache_key = f"analysis:{workflow_id}"
        return self.cache.get(cache_key)
