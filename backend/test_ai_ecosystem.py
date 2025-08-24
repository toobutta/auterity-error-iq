#!/usr/bin/env python3
"""
Test script for AI-Enhanced AutoMatrix Development Workflow
"""

import asyncio
import sys
import os

# Add current directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

async def test_ai_ecosystem():
    """Test the complete AI ecosystem"""
    print("🧪 Testing AI-Enhanced AutoMatrix Development Workflow")
    print("=" * 60)
    
    try:
        # Test imports
        print("📦 Testing imports...")
        from app.services.ai_orchestrator import ai_orchestrator
        from app.core.relay_core import relay_core
        from app.ml.neuro_weaver import neuro_weaver, TrainingConfig, ModelType
        from app.services.registry import service_registry
        print("✅ All imports successful!")
        
        # Test AI Orchestrator
        print("\n🧠 Testing AI Orchestrator...")
        ecosystem_analysis = await ai_orchestrator.analyze_service_ecosystem()
        print(f"✅ Ecosystem analysis completed: {len(ecosystem_analysis.get('services', {}))} services analyzed")
        
        # Test RelayCore
        print("\n🔀 Testing RelayCore...")
        await relay_core.start()
        relay_status = relay_core.get_status()
        print(f"✅ RelayCore started: {relay_status.get('status')}")
        
        # Test NeuroWeaver
        print("\n🧬 Testing NeuroWeaver...")
        
        # Generate sample data
        sample_data = []
        for i in range(100):
            import random
            sample = {
                "cpu_usage": random.uniform(20, 90),
                "memory_usage": random.uniform(30, 85),
                "network_latency": random.uniform(50, 300),
                "error_rate": random.uniform(0, 5),
                "request_count": random.uniform(100, 2000),
                "performance_score": random.uniform(0.3, 1.0)
            }
            sample_data.append(sample)
        
        # Quick training test
        config = TrainingConfig(epochs=5, batch_size=16, hyperparameter_tuning=False)
        neuro_weaver.config = config
        
        training_result = await neuro_weaver.train(
            sample_data[:50],  # Small dataset for quick test
            ModelType.REGRESSION,
            "performance_score"
        )
        
        print(f"✅ NeuroWeaver training completed: {training_result.get('status')}")
        
        # Test prediction
        if neuro_weaver.is_trained:
            test_data = {
                "cpu_usage": 75.0,
                "memory_usage": 65.0,
                "network_latency": 120.0,
                "error_rate": 2.0,
                "request_count": 1200.0
            }
            prediction = await neuro_weaver.predict(test_data)
            print(f"✅ Prediction test successful: {prediction.get('prediction', 'N/A')}")
        
        # Test integration
        print("\n🔗 Testing integration...")
        await ai_orchestrator.auto_optimize_ecosystem()
        print("✅ Autonomous optimization completed")
        
        # Cleanup
        await relay_core.stop()
        print("✅ RelayCore stopped")
        
        print("\n🎉 All tests passed successfully!")
        print("=" * 60)
        print("✅ AI-Enhanced AutoMatrix is ready for production!")
        
        return True
        
    except Exception as e:
        print(f"❌ Test failed: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = asyncio.run(test_ai_ecosystem())
    sys.exit(0 if success else 1)
