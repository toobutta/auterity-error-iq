"""
Simulation API endpoints for predictive workflow analysis

This module provides REST API endpoints for running Monte Carlo simulations
and "what-if" scenario analysis for workflow optimization.
"""

from typing import Dict, List, Any, Optional
from fastapi import APIRouter, HTTPException, BackgroundTasks, Depends
from pydantic import BaseModel, Field
import logging

from ..services.simulation_engine import SimulationEngine, SimulationParameters
from ..database import get_db
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/simulation", tags=["simulation"])


class SimulationRequest(BaseModel):
    """Request model for simulation execution"""
    workflow_id: str = Field(..., description="ID of the workflow to simulate")
    scenario_config: Dict[str, Any] = Field(..., description="Scenario configuration with variables")
    parameters: Optional[Dict[str, Any]] = Field(None, description="Simulation parameters")

    class Config:
        schema_extra = {
            "example": {
                "workflow_id": "wf_123",
                "scenario_config": {
                    "name": "Performance Test",
                    "description": "Test workflow under different loads",
                    "variables": {
                        "execution_time": {"type": "normal", "mean": 100, "std": 20},
                        "success_rate": {"type": "beta", "alpha": 8, "beta": 2},
                        "cost": {"type": "uniform", "low": 5, "high": 15}
                    }
                },
                "parameters": {
                    "num_iterations": 1000,
                    "confidence_level": 0.95,
                    "random_seed": 42
                }
            }
        }


class ScenarioComparisonRequest(BaseModel):
    """Request model for scenario comparison"""
    workflow_id: str = Field(..., description="ID of the workflow to analyze")
    scenarios: List[Dict[str, Any]] = Field(..., description="List of scenarios to compare")
    parameters: Optional[Dict[str, Any]] = Field(None, description="Simulation parameters")


class CustomScenarioRequest(BaseModel):
    """Request model for creating custom scenarios"""
    name: str = Field(..., description="Name of the custom scenario")
    description: str = Field(..., description="Description of the scenario")
    variables: Dict[str, Dict[str, Any]] = Field(..., description="Variable definitions")


# Global simulation engine instance
simulation_engine = SimulationEngine()


@router.post("/run", response_model=Dict[str, Any])
async def run_simulation(
    request: SimulationRequest,
    background_tasks: BackgroundTasks,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Run a Monte Carlo simulation for workflow scenario analysis

    This endpoint executes a complete simulation with the specified parameters
    and returns statistical analysis, confidence intervals, and risk assessment.
    """
    try:
        # Convert request parameters to SimulationParameters object
        parameters = None
        if request.parameters:
            parameters = SimulationParameters(**request.parameters)

        # Run simulation
        result = await simulation_engine.run_simulation(
            workflow_id=request.workflow_id,
            scenario_config=request.scenario_config,
            parameters=parameters
        )

        # Convert result to dict for JSON response
        response_data = {
            "scenario_id": result.scenario_id,
            "simulation_type": result.simulation_type.value,
            "parameters": {
                "num_iterations": result.parameters.num_iterations,
                "confidence_level": result.parameters.confidence_level,
                "time_horizon_days": result.parameters.time_horizon_days,
                "random_seed": result.parameters.random_seed
            },
            "statistics": result.statistics,
            "confidence_intervals": {
                key: list(value) for key, value in result.confidence_intervals.items()
            },
            "risk_assessment": result.risk_assessment,
            "execution_time": result.execution_time,
            "timestamp": result.timestamp.isoformat(),
            "outcomes_summary": {
                key: {
                    "count": len(values),
                    "range": [min(values), max(values)] if values else [0, 0]
                }
                for key, values in result.outcomes.items()
            }
        }

        logger.info(f"Simulation {result.scenario_id} completed successfully")
        return response_data

    except ValueError as e:
        logger.error(f"Validation error in simulation: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error running simulation: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error during simulation")


@router.post("/compare", response_model=Dict[str, Any])
async def compare_scenarios(
    request: ScenarioComparisonRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """
    Compare multiple simulation scenarios side by side

    This endpoint runs simulations for multiple scenarios and provides
    comparative analysis with recommendations.
    """
    try:
        # Convert request parameters to SimulationParameters object
        parameters = None
        if request.parameters:
            parameters = SimulationParameters(**request.parameters)

        # Run scenario comparison
        comparison = await simulation_engine.compare_scenarios(
            workflow_id=request.workflow_id,
            scenarios=request.scenarios,
            parameters=parameters
        )

        logger.info(f"Scenario comparison completed for workflow {request.workflow_id}")
        return comparison

    except ValueError as e:
        logger.error(f"Validation error in scenario comparison: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error comparing scenarios: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error during comparison")


@router.get("/templates", response_model=Dict[str, Dict[str, Any]])
async def get_scenario_templates(
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Get available scenario templates

    Returns predefined templates for common simulation scenarios
    like performance optimization, cost analysis, and scalability testing.
    """
    try:
        templates = await simulation_engine.get_scenario_templates()
        return templates
    except Exception as e:
        logger.error(f"Error retrieving scenario templates: {str(e)}")
        raise HTTPException(status_code=500, detail="Error retrieving templates")


@router.post("/custom-scenario", response_model=Dict[str, Any])
async def create_custom_scenario(
    request: CustomScenarioRequest,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create a custom simulation scenario

    Allows users to define their own simulation scenarios with custom variables
    and probability distributions.
    """
    try:
        scenario = await simulation_engine.create_custom_scenario(
            name=request.name,
            description=request.description,
            variables=request.variables
        )

        logger.info(f"Custom scenario '{request.name}' created successfully")
        return scenario

    except ValueError as e:
        logger.error(f"Validation error in custom scenario: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error creating custom scenario: {str(e)}")
        raise HTTPException(status_code=500, detail="Error creating custom scenario")


@router.get("/health")
async def simulation_health_check():
    """
    Health check endpoint for simulation service

    Returns the status of the simulation engine and available capabilities.
    """
    try:
        # Test basic functionality
        templates = await simulation_engine.get_scenario_templates()

        return {
            "status": "healthy",
            "service": "simulation_engine",
            "capabilities": {
                "monte_carlo_simulation": True,
                "scenario_comparison": True,
                "custom_scenarios": True,
                "risk_assessment": True,
                "templates_available": len(templates)
            },
            "supported_distributions": [
                "normal", "uniform", "triangular", "beta", "constant"
            ]
        }
    except Exception as e:
        logger.error(f"Simulation service health check failed: {str(e)}")
        return {
            "status": "unhealthy",
            "service": "simulation_engine",
            "error": str(e)
        }


# Error handlers
@router.exception_handler(ValueError)
async def validation_exception_handler(request, exc):
    """Handle validation errors with appropriate HTTP status"""
    return {
        "error": "Validation Error",
        "message": str(exc),
        "type": "validation_error"
    }


@router.exception_handler(Exception)
async def general_exception_handler(request, exc):
    """Handle general exceptions"""
    logger.error(f"Unhandled exception in simulation API: {str(exc)}")
    return {
        "error": "Internal Server Error",
        "message": "An unexpected error occurred",
        "type": "internal_error"
    }
