"""
Debug test to identify the exact source of the error
"""
import sys
import os

# Add the backend directory to Python path
backend_path = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, backend_path)

def main():
    print("🔍 Debugging instantiation issues...")
    
    try:
        from app.services.agents.orchestrator import AgentOrchestrator
        orchestrator = AgentOrchestrator()
        print("✅ AgentOrchestrator instantiated")
        
        from app.services.agents.rag_engine import RAGEngine
        rag_engine = RAGEngine()
        print("✅ RAGEngine instantiated")
        
        from app.services.agents.compliance_layer import ComplianceLayer
        compliance = ComplianceLayer()
        print("✅ ComplianceLayer instantiated")
        
        print("🔍 Testing SecurityManager...")
        from app.services.agents.security_manager import SecurityManager
        security = SecurityManager()
        print("✅ SecurityManager instantiated")
        
    except Exception as e:
        print(f"❌ Error occurred: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
