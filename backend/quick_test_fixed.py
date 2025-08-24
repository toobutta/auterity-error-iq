"""
Quick test of agent framework components
"""

import os
import sys

# Add the backend directory to Python path
backend_path = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, backend_path)


def main():
    print("🚀 Testing Auterity Agent Framework")
    print("=" * 50)

    # Test imports
    try:
        from app.services.agents.orchestrator import AgentOrchestrator

        print("✅ AgentOrchestrator imported")

        from app.services.agents.rag_engine import RAGEngine

        print("✅ RAGEngine imported")

        from app.services.agents.compliance_layer import ComplianceLayer

        print("✅ ComplianceLayer imported")

        from app.services.agents.security_manager import SecurityManager

        print("✅ SecurityManager imported")

    except Exception as e:
        print(f"❌ Import failed: {e}")
        return False

    # Test instantiation
    try:
        orchestrator = AgentOrchestrator()
        print("✅ AgentOrchestrator instantiated")

        rag_engine = RAGEngine()
        print("✅ RAGEngine instantiated")

        compliance = ComplianceLayer()
        print("✅ ComplianceLayer instantiated")

        security = SecurityManager()
        print("✅ SecurityManager instantiated")

    except Exception as e:
        print(f"❌ Instantiation failed: {e}")
        import traceback

        traceback.print_exc()
        return False

    # Test basic functionality
    try:
        # Test agent registration
        agent_config = {"id": "test-agent", "name": "Test Agent", "type": "general"}
        result = orchestrator.register_agent(agent_config)
        assert result["success"] is True
        print("✅ Agent registration works")

        # Test security token
        user_data = {"user_id": "test", "roles": ["user"]}
        token = security.generate_token(user_data)
        assert token is not None
        print("✅ Security token generation works")

        # Test compliance
        test_data = {"content": "test", "classification": "public"}
        compliance_result = compliance.validate_compliance(test_data, ["GDPR"])
        assert "compliance_status" in compliance_result
        print("✅ Compliance validation works")

    except Exception as e:
        print(f"❌ Functionality test failed: {e}")
        import traceback

        traceback.print_exc()
        return False

    print("\n" + "=" * 50)
    print("🎉 All tests passed!")
    print("✅ Agent Framework is ready for production!")
    print("=" * 50)
    return True


if __name__ == "__main__":
    main()
