"""
AI Ecosystem Startup Script
Initialize and coordinate RelayCore, NeuroWeaver, and AI Orchestrator
"""

import asyncio
import logging
from datetime import datetime
from typing import Any, Dict

from app.core.relay_core import relay_core
from app.ml.neuro_weaver import ModelType, TrainingConfig, neuro_weaver
from app.services.ai_orchestrator import ai_orchestrator
from app.services.registry import service_registry

# Configure logging
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


class AIEcosystemManager:
    """Comprehensive AI ecosystem management"""

    def __init__(self):
        self.startup_time = None
        self.components_status = {
            "ai_orchestrator": False,
            "relay_core": False,
            "neuro_weaver": False,
            "service_registry": False,
        }
        self.initialization_complete = False

    async def startup_ecosystem(self) -> Dict[str, Any]:
        """Start the complete AI ecosystem"""
        self.startup_time = datetime.now()
        logger.info("🚀 Starting AI Ecosystem...")

        startup_results = {
            "startup_time": self.startup_time.isoformat(),
            "components": {},
            "initialization_order": [],
            "total_startup_time": 0.0,
            "status": "starting",
        }

        try:
            # 1. Initialize AI Orchestrator
            logger.info("🧠 Initializing AI Orchestrator...")
            startup_results["initialization_order"].append("ai_orchestrator")
            self.components_status["ai_orchestrator"] = True
            startup_results["components"]["ai_orchestrator"] = {
                "status": "initialized",
                "features": [
                    "predictive_analytics",
                    "anomaly_detection",
                    "auto_scaling",
                    "autonomous_healing",
                ],
            }

            # 2. Initialize Service Registry
            logger.info("📋 Initializing Service Registry...")
            startup_results["initialization_order"].append("service_registry")
            # Service registry is already initialized as a global instance
            self.components_status["service_registry"] = True
            startup_results["components"]["service_registry"] = {
                "status": "initialized",
                "services_registered": len(service_registry.get_all_services()),
            }

            # 3. Start RelayCore
            logger.info("🔀 Starting RelayCore...")
            await relay_core.start()
            startup_results["initialization_order"].append("relay_core")
            self.components_status["relay_core"] = True
            startup_results["components"]["relay_core"] = {
                "status": "running",
                "features": [
                    "ai_routing",
                    "circuit_breaker",
                    "load_balancing",
                    "message_queue",
                ],
            }

            # 4. Initialize NeuroWeaver (prepare for training)
            logger.info("🧬 Initializing NeuroWeaver...")
            startup_results["initialization_order"].append("neuro_weaver")
            self.components_status["neuro_weaver"] = True
            startup_results["components"]["neuro_weaver"] = {
                "status": "ready_for_training",
                "features": [
                    "adaptive_architecture",
                    "hyperparameter_tuning",
                    "real_time_monitoring",
                ],
            }

            # 5. Generate sample training data and train initial model
            logger.info("📊 Generating sample data and training initial model...")
            sample_data = self._generate_sample_training_data()

            # Train a lightweight initial model
            training_config = TrainingConfig(
                epochs=20,  # Quick initial training
                batch_size=32,
                learning_rate=0.001,
                early_stopping_patience=5,
                hyperparameter_tuning=False,  # Skip for initial model
            )
            neuro_weaver.config = training_config

            training_result = await neuro_weaver.train(
                sample_data, ModelType.REGRESSION, "performance_score"
            )

            startup_results["components"]["neuro_weaver"]["initial_training"] = {
                "status": training_result.get("status"),
                "training_time": training_result.get("training_time", 0),
                "epochs_trained": training_result.get("epochs_trained", 0),
            }

            # 6. Integration Testing
            logger.info("🔗 Testing component integration...")
            integration_results = await self._test_integration()
            startup_results["integration_test"] = integration_results

            # 7. Finalize startup
            total_time = (datetime.now() - self.startup_time).total_seconds()
            startup_results["total_startup_time"] = total_time
            startup_results["status"] = "completed"
            self.initialization_complete = True

            logger.info(f"✅ AI Ecosystem startup completed in {total_time:.2f} seconds")

            return startup_results

        except Exception as e:
            logger.error(f"❌ Ecosystem startup failed: {str(e)}")
            startup_results["status"] = "failed"
            startup_results["error"] = str(e)
            return startup_results

    def _generate_sample_training_data(self) -> list:
        """Generate sample training data for initial model"""
        import random

        sample_data = []
        for i in range(500):  # Generate 500 samples
            sample = {
                "cpu_usage": random.uniform(10, 95),
                "memory_usage": random.uniform(20, 90),
                "network_latency": random.uniform(10, 500),
                "error_rate": random.uniform(0, 10),
                "request_count": random.uniform(100, 5000),
                "disk_io": random.uniform(0, 100),
                "network_io": random.uniform(0, 1000),
                "cache_hit_ratio": random.uniform(0.5, 0.98),
                "response_time": random.uniform(50, 2000),
                "throughput": random.uniform(100, 3000),
                "connection_count": random.uniform(10, 1000),
                "queue_depth": random.uniform(0, 100),
            }

            # Calculate performance score based on metrics
            performance_score = (
                (100 - sample["cpu_usage"]) * 0.2
                + (100 - sample["memory_usage"]) * 0.2
                + (500 - sample["network_latency"]) / 500 * 0.2
                + (10 - sample["error_rate"]) / 10 * 0.2
                + sample["cache_hit_ratio"] * 0.2
            ) / 100

            sample["performance_score"] = max(0, min(1, performance_score))
            sample_data.append(sample)

        return sample_data

    async def _test_integration(self) -> Dict[str, Any]:
        """Test integration between components"""
        integration_results = {
            "ai_orchestrator_to_relaycore": False,
            "relaycore_to_neuroweaver": False,
            "neuroweaver_predictions": False,
            "end_to_end_workflow": False,
        }

        try:
            # Test AI Orchestrator to RelayCore integration
            ecosystem_analysis = await ai_orchestrator.analyze_service_ecosystem()
            if ecosystem_analysis and "services" in ecosystem_analysis:
                integration_results["ai_orchestrator_to_relaycore"] = True

            # Test RelayCore status
            relay_status = relay_core.get_status()
            if relay_status.get("status") == "running":
                integration_results["relaycore_status"] = True

            # Test NeuroWeaver predictions
            if neuro_weaver.is_trained:
                test_data = {
                    "cpu_usage": 75.0,
                    "memory_usage": 60.0,
                    "network_latency": 150.0,
                    "error_rate": 2.0,
                    "request_count": 1500.0,
                }
                prediction = await neuro_weaver.predict(test_data)
                if prediction and "prediction" in prediction:
                    integration_results["neuroweaver_predictions"] = True

            # Test end-to-end workflow
            if all(
                [
                    integration_results["ai_orchestrator_to_relaycore"],
                    integration_results.get("relaycore_status", False),
                    integration_results["neuroweaver_predictions"],
                ]
            ):
                integration_results["end_to_end_workflow"] = True

        except Exception as e:
            logger.error(f"Integration testing failed: {str(e)}")
            integration_results["error"] = str(e)

        return integration_results

    async def shutdown_ecosystem(self) -> Dict[str, Any]:
        """Gracefully shutdown the AI ecosystem"""
        logger.info("🛑 Shutting down AI Ecosystem...")

        shutdown_results = {
            "shutdown_time": datetime.now().isoformat(),
            "components_stopped": [],
            "status": "shutting_down",
        }

        try:
            # Stop RelayCore
            if self.components_status["relay_core"]:
                await relay_core.stop()
                shutdown_results["components_stopped"].append("relay_core")
                self.components_status["relay_core"] = False

            # Clear AI Orchestrator websockets
            if self.components_status["ai_orchestrator"]:
                ai_orchestrator.active_websockets.clear()
                shutdown_results["components_stopped"].append("ai_orchestrator")
                self.components_status["ai_orchestrator"] = False

            # NeuroWeaver cleanup (if needed)
            if self.components_status["neuro_weaver"]:
                # No explicit shutdown needed for NeuroWeaver
                shutdown_results["components_stopped"].append("neuro_weaver")
                self.components_status["neuro_weaver"] = False

            shutdown_results["status"] = "completed"
            self.initialization_complete = False

            logger.info("✅ AI Ecosystem shutdown completed")

        except Exception as e:
            logger.error(f"❌ Ecosystem shutdown failed: {str(e)}")
            shutdown_results["status"] = "failed"
            shutdown_results["error"] = str(e)

        return shutdown_results

    def get_ecosystem_status(self) -> Dict[str, Any]:
        """Get current ecosystem status"""
        return {
            "initialization_complete": self.initialization_complete,
            "startup_time": (
                self.startup_time.isoformat() if self.startup_time else None
            ),
            "components_status": self.components_status,
            "uptime_seconds": (
                (datetime.now() - self.startup_time).total_seconds()
                if self.startup_time
                else 0
            ),
            "ready_for_production": all(self.components_status.values()),
        }


# Global ecosystem manager instance
ecosystem_manager = AIEcosystemManager()


# FastAPI lifespan event handlers
async def startup_event():
    """FastAPI startup event"""
    logger.info("🌟 FastAPI startup - Initializing AI Ecosystem...")
    startup_result = await ecosystem_manager.startup_ecosystem()

    if startup_result.get("status") == "completed":
        logger.info("🎉 AI Ecosystem ready for requests!")
    else:
        logger.error("💥 AI Ecosystem startup failed!")

    return startup_result


async def shutdown_event():
    """FastAPI shutdown event"""
    logger.info("👋 FastAPI shutdown - Cleaning up AI Ecosystem...")
    shutdown_result = await ecosystem_manager.shutdown_ecosystem()

    if shutdown_result.get("status") == "completed":
        logger.info("✅ AI Ecosystem cleanup completed!")
    else:
        logger.error("❌ AI Ecosystem cleanup failed!")

    return shutdown_result


# Manual startup/shutdown functions for testing
async def manual_startup():
    """Manually start the ecosystem (for testing)"""
    return await ecosystem_manager.startup_ecosystem()


async def manual_shutdown():
    """Manually shutdown the ecosystem (for testing)"""
    return await ecosystem_manager.shutdown_ecosystem()


if __name__ == "__main__":
    # Test the ecosystem startup
    async def test_ecosystem():
        startup_result = await manual_startup()
        print(f"Startup result: {startup_result}")

        # Wait a bit
        await asyncio.sleep(5)

        # Test predictions
        if neuro_weaver.is_trained:
            test_data = {
                "cpu_usage": 80.0,
                "memory_usage": 70.0,
                "network_latency": 200.0,
                "error_rate": 3.0,
                "request_count": 2000.0,
            }
            prediction = await neuro_weaver.predict(test_data)
            print(f"Test prediction: {prediction}")

        # Shutdown
        shutdown_result = await manual_shutdown()
        print(f"Shutdown result: {shutdown_result}")

    asyncio.run(test_ecosystem())
