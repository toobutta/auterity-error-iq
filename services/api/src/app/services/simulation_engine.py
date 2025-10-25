"""
Predictive Simulation Engine for Workflow "What-If" Analysis

This module provides Monte Carlo simulation capabilities for modeling
future workflow outcomes and exploring alternative scenarios.
"""

import numpy as np
from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime
from dataclasses import dataclass
from enum import Enum
import logging

logger = logging.getLogger(__name__)


class SimulationType(Enum):
    MONTE_CARLO = "monte_carlo"
    SENSITIVITY = "sensitivity"
    SCENARIO_COMPARISON = "scenario_comparison"


@dataclass
class SimulationParameters:
    """Parameters for simulation configuration"""
    num_iterations: int = 1000
    confidence_level: float = 0.95
    time_horizon_days: int = 30
    random_seed: Optional[int] = None
    variables: Optional[Dict[str, Dict[str, Any]]] = None

    def __post_init__(self):
        if self.variables is None:
            self.variables = {}


@dataclass
class SimulationResult:
    """Results from simulation run"""
    scenario_id: str
    simulation_type: SimulationType
    parameters: SimulationParameters
    outcomes: Dict[str, List[float]]
    statistics: Dict[str, Dict[str, float]]
    confidence_intervals: Dict[str, Tuple[float, float]]
    risk_assessment: Dict[str, Any]
    execution_time: float
    timestamp: datetime


class MonteCarloSimulator:
    """Monte Carlo simulation engine for workflow outcomes"""

    def __init__(self):
        self.rng = np.random.RandomState()

    def set_seed(self, seed: int):
        """Set random seed for reproducible results"""
        self.rng = np.random.RandomState(seed)

    def generate_random_variables(self, variables: Dict[str, Dict[str, Any]]) -> Dict[str, float]:
        """Generate random values for simulation variables"""
        results = {}

        for var_name, config in variables.items():
            var_type = config.get('type', 'normal')

            if var_type == 'normal':
                mean = config.get('mean', 0)
                std = config.get('std', 1)
                results[var_name] = self.rng.normal(mean, std)

            elif var_type == 'uniform':
                low = config.get('low', 0)
                high = config.get('high', 1)
                results[var_name] = self.rng.uniform(low, high)

            elif var_type == 'triangular':
                left = config.get('left', 0)
                mode = config.get('mode', 0.5)
                right = config.get('right', 1)
                results[var_name] = self.rng.triangular(left, mode, right)

            elif var_type == 'beta':
                alpha = config.get('alpha', 2)
                beta = config.get('beta', 2)
                results[var_name] = self.rng.beta(alpha, beta)

            elif var_type == 'constant':
                results[var_name] = config.get('value', 0)

            else:
                # Default to normal distribution
                results[var_name] = self.rng.normal(0, 1)

        return results

    def calculate_statistics(self, data: List[float], confidence_level: float = 0.95) -> Dict[str, float]:
        """Calculate statistical measures for simulation results"""
        if not data:
            return {}

        data_array = np.array(data)

        # Basic statistics
        stats = {
            'mean': float(np.mean(data_array)),
            'median': float(np.median(data_array)),
            'std': float(np.std(data_array)),
            'min': float(np.min(data_array)),
            'max': float(np.max(data_array)),
            'q25': float(np.percentile(data_array, 25)),
            'q75': float(np.percentile(data_array, 75)),
            'q95': float(np.percentile(data_array, 95)),
            'q99': float(np.percentile(data_array, 99)),
        }

        # Confidence interval
        alpha = 1 - confidence_level
        ci_lower = np.percentile(data_array, (alpha/2) * 100)
        ci_upper = np.percentile(data_array, (1 - alpha/2) * 100)

        stats['ci_lower'] = float(ci_lower)
        stats['ci_upper'] = float(ci_upper)

        return stats

    def assess_risk(self, data: List[float], thresholds: Dict[str, float]) -> Dict[str, Any]:
        """Assess risk levels based on simulation results"""
        if not data:
            return {}

        data_array = np.array(data)

        risk_assessment = {
            'probability_distribution': {},
            'risk_levels': {},
            'recommendations': []
        }

        # Calculate probabilities for different thresholds
        for threshold_name, threshold_value in thresholds.items():
            if threshold_name.startswith('>'):
                prob = np.mean(data_array > float(threshold_name[1:]))
                risk_assessment['probability_distribution'][f'P(X > {threshold_name[1:]})'] = float(prob)
            elif threshold_name.startswith('<'):
                prob = np.mean(data_array < float(threshold_name[1:]))
                risk_assessment['probability_distribution'][f'P(X < {threshold_name[1:]})'] = float(prob)

        # Risk level assessment
        mean_value = np.mean(data_array)
        std_value = np.std(data_array)
        cv = std_value / abs(mean_value) if mean_value != 0 else 0  # Coefficient of variation

        if cv > 0.5:
            risk_level = 'HIGH'
            risk_assessment['recommendations'].append("High variability detected - consider risk mitigation strategies")
        elif cv > 0.25:
            risk_level = 'MEDIUM'
            risk_assessment['recommendations'].append("Moderate variability - monitor closely")
        else:
            risk_level = 'LOW'
            risk_assessment['recommendations'].append("Low risk scenario - proceed with confidence")

        risk_assessment['risk_levels']['overall'] = risk_level
        risk_assessment['risk_levels']['variability'] = cv

        return risk_assessment


class ScenarioBuilder:
    """Builds and manages simulation scenarios"""

    def __init__(self):
        self.templates = self._load_scenario_templates()

    def _load_scenario_templates(self) -> Dict[str, Dict[str, Any]]:
        """Load predefined scenario templates"""
        return {
            'performance_optimization': {
                'name': 'Performance Optimization',
                'description': 'Optimize workflow performance parameters',
                'variables': {
                    'execution_time': {'type': 'normal', 'mean': 100, 'std': 20},
                    'success_rate': {'type': 'beta', 'alpha': 8, 'beta': 2},
                    'resource_usage': {'type': 'triangular', 'left': 50, 'mode': 75, 'right': 100}
                }
            },
            'cost_analysis': {
                'name': 'Cost Analysis',
                'description': 'Analyze cost implications of workflow changes',
                'variables': {
                    'compute_cost': {'type': 'normal', 'mean': 10, 'std': 3},
                    'api_cost': {'type': 'uniform', 'low': 5, 'high': 15},
                    'maintenance_cost': {'type': 'constant', 'value': 2}
                }
            },
            'scalability_test': {
                'name': 'Scalability Test',
                'description': 'Test workflow performance under different loads',
                'variables': {
                    'concurrent_users': {'type': 'uniform', 'low': 10, 'high': 1000},
                    'response_time': {'type': 'normal', 'mean': 200, 'std': 50},
                    'error_rate': {'type': 'beta', 'alpha': 15, 'beta': 1}
                }
            }
        }

    def create_scenario(self, template_name: str, customizations: Dict[str, Any] = None) -> Dict[str, Any]:
        """Create a scenario from template with customizations"""
        if template_name not in self.templates:
            raise ValueError(f"Template '{template_name}' not found")

        scenario = self.templates[template_name].copy()

        if customizations:
            # Apply customizations
            if 'variables' in customizations:
                scenario['variables'].update(customizations['variables'])

            if 'name' in customizations:
                scenario['name'] = customizations['name']

            if 'description' in customizations:
                scenario['description'] = customizations['description']

        return scenario

    def validate_scenario(self, scenario: Dict[str, Any]) -> List[str]:
        """Validate scenario configuration"""
        errors = []

        if 'variables' not in scenario:
            errors.append("Scenario must contain 'variables' section")
            return errors

        for var_name, var_config in scenario['variables'].items():
            if 'type' not in var_config:
                errors.append(f"Variable '{var_name}' missing 'type' field")

            var_type = var_config.get('type', '')
            if var_type == 'normal':
                if 'mean' not in var_config or 'std' not in var_config:
                    errors.append(f"Normal distribution variable '{var_name}' missing 'mean' or 'std'")
            elif var_type == 'uniform':
                if 'low' not in var_config or 'high' not in var_config:
                    errors.append(f"Uniform distribution variable '{var_name}' missing 'low' or 'high'")
            elif var_type == 'triangular':
                if 'left' not in var_config or 'mode' not in var_config or 'right' not in var_config:
                    errors.append(f"Triangular distribution variable '{var_name}' missing required parameters")

        return errors


class SimulationEngine:
    """Main simulation engine coordinating all simulation activities"""

    def __init__(self):
        self.monte_carlo = MonteCarloSimulator()
        self.scenario_builder = ScenarioBuilder()

    async def run_simulation(
        self,
        workflow_id: str,
        scenario_config: Dict[str, Any],
        parameters: SimulationParameters = None
    ) -> SimulationResult:
        """Run a complete simulation for a workflow scenario"""
        start_time = datetime.utcnow()

        if parameters is None:
            parameters = SimulationParameters()

        # Set random seed if provided
        if parameters.random_seed:
            self.monte_carlo.set_seed(parameters.random_seed)

        # Validate scenario
        errors = self.scenario_builder.validate_scenario(scenario_config)
        if errors:
            raise ValueError(f"Invalid scenario configuration: {errors}")

        # Extract variables
        variables = scenario_config.get('variables', {})

        # Run Monte Carlo simulation
        logger.info(f"Starting Monte Carlo simulation with {parameters.num_iterations} iterations")

        outcomes = {
            'execution_time': [],
            'success_rate': [],
            'cost': [],
            'performance_score': []
        }

        for i in range(parameters.num_iterations):
            # Generate random variables for this iteration
            random_vars = self.monte_carlo.generate_random_variables(variables)

            # Simulate workflow execution
            execution_result = await self._simulate_workflow_execution(workflow_id, random_vars)

            # Store outcomes
            outcomes['execution_time'].append(execution_result.get('execution_time', 0))
            outcomes['success_rate'].append(execution_result.get('success_rate', 0))
            outcomes['cost'].append(execution_result.get('cost', 0))
            outcomes['performance_score'].append(execution_result.get('performance_score', 0))

        # Calculate statistics
        statistics = {}
        confidence_intervals = {}

        for outcome_name, values in outcomes.items():
            if values:
                statistics[outcome_name] = self.monte_carlo.calculate_statistics(
                    values, parameters.confidence_level
                )
                ci_lower = statistics[outcome_name]['ci_lower']
                ci_upper = statistics[outcome_name]['ci_upper']
                confidence_intervals[outcome_name] = (ci_lower, ci_upper)

        # Risk assessment
        thresholds = {
            '>120': 120,  # Execution time > 120 seconds
            '<0.8': 0.8,  # Success rate < 80%
            '>50': 50     # Cost > $50
        }

        risk_assessment = self.monte_carlo.assess_risk(outcomes['performance_score'], thresholds)

        # Calculate execution time
        execution_time = (datetime.utcnow() - start_time).total_seconds()

        result = SimulationResult(
            scenario_id=f"sim_{workflow_id}_{int(start_time.timestamp())}",
            simulation_type=SimulationType.MONTE_CARLO,
            parameters=parameters,
            outcomes=outcomes,
            statistics=statistics,
            confidence_intervals=confidence_intervals,
            risk_assessment=risk_assessment,
            execution_time=execution_time,
            timestamp=datetime.utcnow()
        )

        logger.info(f"Simulation completed in {execution_time:.2f} seconds")
        return result

    async def _simulate_workflow_execution(self, workflow_id: str, variables: Dict[str, float]) -> Dict[str, float]:
        """Simulate a single workflow execution based on random variables"""
        # This is a simplified simulation - in practice, this would integrate with
        # actual workflow execution engine and historical data

        # Simulate execution time based on variables
        base_time = 100  # Base execution time in seconds
        time_multiplier = variables.get('execution_time', 1.0)
        execution_time = base_time * time_multiplier

        # Add some randomness
        execution_time *= np.random.normal(1.0, 0.1)

        # Simulate success rate
        base_success = 0.9  # Base success rate
        success_modifier = variables.get('success_rate', 0.0)
        success_rate = min(1.0, max(0.0, base_success + success_modifier))

        # Simulate cost
        base_cost = 10  # Base cost in dollars
        cost_multiplier = variables.get('compute_cost', 1.0) + variables.get('api_cost', 0.0)
        cost = base_cost * cost_multiplier

        # Calculate performance score (composite metric)
        performance_score = (
            (1.0 / execution_time) * 100 +  # Faster is better
            success_rate * 50 +              # Higher success is better
            (1.0 / cost) * 25                # Lower cost is better
        )

        return {
            'execution_time': execution_time,
            'success_rate': success_rate,
            'cost': cost,
            'performance_score': performance_score
        }

    async def compare_scenarios(
        self,
        workflow_id: str,
        scenarios: List[Dict[str, Any]],
        parameters: SimulationParameters = None
    ) -> Dict[str, Any]:
        """Compare multiple scenarios side by side"""
        if parameters is None:
            parameters = SimulationParameters()

        results = []
        for scenario in scenarios:
            result = await self.run_simulation(workflow_id, scenario, parameters)
            results.append(result)

        # Compare results
        comparison = {
            'scenarios': [],
            'comparison_metrics': {},
            'recommendations': []
        }

        for i, result in enumerate(results):
            scenario_summary = {
                'scenario_id': result.scenario_id,
                'name': scenarios[i].get('name', f'Scenario {i+1}'),
                'mean_performance': result.statistics.get('performance_score', {}).get('mean', 0),
                'performance_std': result.statistics.get('performance_score', {}).get('std', 0),
                'risk_level': result.risk_assessment.get('risk_levels', {}).get('overall', 'UNKNOWN')
            }
            comparison['scenarios'].append(scenario_summary)

        # Generate comparison insights
        if len(comparison['scenarios']) > 1:
            best_scenario = max(comparison['scenarios'], key=lambda x: x['mean_performance'])
            comparison['recommendations'].append(f"Best performing scenario: {best_scenario['name']}")

            # Risk analysis
            low_risk_scenarios = [s for s in comparison['scenarios'] if s['risk_level'] == 'LOW']
            if low_risk_scenarios:
                comparison['recommendations'].append(f"Lowest risk option: {low_risk_scenarios[0]['name']}")

        return comparison

    async def get_scenario_templates(self) -> Dict[str, Dict[str, Any]]:
        """Get available scenario templates"""
        return self.scenario_builder.templates

    async def create_custom_scenario(
        self,
        name: str,
        description: str,
        variables: Dict[str, Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Create a custom scenario"""
        scenario = {
            'name': name,
            'description': description,
            'variables': variables
        }

        # Validate the scenario
        errors = self.scenario_builder.validate_scenario(scenario)
        if errors:
            raise ValueError(f"Invalid custom scenario: {errors}")

        return scenario
