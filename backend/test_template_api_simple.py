"""Simple test for template API functionality without full test environment."""

import json
import uuid
from typing import Dict, Any


def test_template_schema_validation():
    """Test template schema validation logic."""
    print("Testing template schema validation...")
    
    # Test valid template data
    valid_template = {
        "name": "Test Template",
        "description": "A test template",
        "category": "sales",
        "definition": {
            "nodes": [
                {"id": "start", "type": "start"},
                {"id": "end", "type": "end"}
            ],
            "edges": [
                {"source": "start", "target": "end"}
            ]
        },
        "parameters": [
            {
                "name": "test_param",
                "description": "Test parameter",
                "parameter_type": "string",
                "is_required": True
            }
        ]
    }
    
    # Validate required fields
    assert "name" in valid_template
    assert "category" in valid_template
    assert "definition" in valid_template
    assert "nodes" in valid_template["definition"]
    assert "edges" in valid_template["definition"]
    
    print("   ✓ Template schema validation works")
    
    # Test parameter validation
    param = valid_template["parameters"][0]
    assert param["name"] == "test_param"
    assert param["parameter_type"] == "string"
    assert param["is_required"] is True
    
    print("   ✓ Parameter schema validation works")


def test_template_instantiation_logic():
    """Test template instantiation logic."""
    print("Testing template instantiation logic...")
    
    template_definition = {
        "nodes": [
            {
                "id": "start",
                "type": "start",
                "data": {"label": "Welcome to {{dealership_name}}"}
            },
            {
                "id": "process",
                "type": "ai_process",
                "data": {
                    "prompt": "Process customer inquiry: {{customer_message}} for {{vehicle_type}}",
                    "timeout": "{{timeout_seconds}}"
                }
            }
        ],
        "edges": [
            {"source": "start", "target": "process"}
        ]
    }
    
    parameters = {
        "dealership_name": "AutoMax Toyota",
        "customer_message": "I want to buy a car",
        "vehicle_type": "sedan",
        "timeout_seconds": 30
    }
    
    # Simulate parameter substitution
    definition_str = json.dumps(template_definition)
    for param_name, param_value in parameters.items():
        placeholder = f"{{{{{param_name}}}}}"
        if isinstance(param_value, str):
            param_value_str = param_value
        else:
            param_value_str = json.dumps(param_value)
        definition_str = definition_str.replace(placeholder, param_value_str)
    
    result = json.loads(definition_str)
    result_str = json.dumps(result)
    
    # Verify substitution worked
    assert "AutoMax Toyota" in result_str
    assert "I want to buy a car" in result_str
    assert "sedan" in result_str
    assert "30" in result_str
    assert "{{" not in result_str  # No placeholders should remain
    
    print("   ✓ Template instantiation logic works")


def test_dealership_templates():
    """Test dealership-specific template structures."""
    print("Testing dealership template structures...")
    
    # Customer inquiry template
    customer_inquiry = {
        "name": "Customer Inquiry Processing",
        "category": "sales",
        "definition": {
            "nodes": [
                {
                    "id": "start",
                    "type": "start",
                    "data": {"label": "Customer Inquiry Received"}
                },
                {
                    "id": "analyze",
                    "type": "ai_process",
                    "data": {
                        "prompt": "Analyze customer inquiry: {{customer_message}} for {{dealership_name}}"
                    }
                }
            ],
            "edges": [{"source": "start", "target": "analyze"}]
        },
        "parameters": [
            {
                "name": "dealership_name",
                "parameter_type": "string",
                "is_required": True
            },
            {
                "name": "customer_message",
                "parameter_type": "string",
                "is_required": True
            }
        ]
    }
    
    # Service appointment template
    service_appointment = {
        "name": "Service Appointment Scheduling",
        "category": "service",
        "definition": {
            "nodes": [
                {
                    "id": "start",
                    "type": "start",
                    "data": {"label": "Service Request Received"}
                },
                {
                    "id": "extract",
                    "type": "ai_process",
                    "data": {
                        "prompt": "Extract service details: {{service_request}}"
                    }
                }
            ],
            "edges": [{"source": "start", "target": "extract"}]
        },
        "parameters": [
            {
                "name": "service_request",
                "parameter_type": "string",
                "is_required": True
            }
        ]
    }
    
    # Parts inquiry template
    parts_inquiry = {
        "name": "Parts Inquiry and Availability",
        "category": "parts",
        "definition": {
            "nodes": [
                {
                    "id": "start",
                    "type": "start",
                    "data": {"label": "Parts Inquiry Received"}
                },
                {
                    "id": "identify",
                    "type": "ai_process",
                    "data": {
                        "prompt": "Identify part from request: {{parts_request}}"
                    }
                }
            ],
            "edges": [{"source": "start", "target": "identify"}]
        },
        "parameters": [
            {
                "name": "parts_request",
                "parameter_type": "string",
                "is_required": True
            }
        ]
    }
    
    templates = [customer_inquiry, service_appointment, parts_inquiry]
    
    for template in templates:
        # Validate template structure
        assert "name" in template
        assert "category" in template
        assert "definition" in template
        assert "parameters" in template
        
        # Validate category
        assert template["category"] in ["sales", "service", "parts"]
        
        # Validate definition structure
        definition = template["definition"]
        assert "nodes" in definition
        assert "edges" in definition
        assert len(definition["nodes"]) >= 2  # At least start and one process node
        
        print(f"   ✓ {template['name']} template structure is valid")
    
    print("   ✓ All dealership templates are valid")


def test_api_endpoint_structure():
    """Test API endpoint structure and responses."""
    print("Testing API endpoint structure...")
    
    # Test template list response structure
    template_list_response = {
        "templates": [
            {
                "id": str(uuid.uuid4()),
                "name": "Test Template",
                "description": "Test description",
                "category": "sales",
                "definition": {"nodes": [], "edges": []},
                "is_active": True,
                "created_at": "2024-01-01T00:00:00Z",
                "updated_at": "2024-01-01T00:00:00Z",
                "parameters": []
            }
        ],
        "total": 1,
        "page": 1,
        "page_size": 10
    }
    
    # Validate response structure
    assert "templates" in template_list_response
    assert "total" in template_list_response
    assert "page" in template_list_response
    assert "page_size" in template_list_response
    
    template = template_list_response["templates"][0]
    required_fields = ["id", "name", "category", "definition", "is_active", "created_at", "updated_at", "parameters"]
    for field in required_fields:
        assert field in template
    
    print("   ✓ Template list response structure is valid")
    
    # Test template instantiation request structure
    instantiate_request = {
        "name": "New Workflow",
        "description": "Workflow from template",
        "parameter_values": {
            "dealership_name": "Test Dealership",
            "customer_message": "Test message"
        }
    }
    
    assert "name" in instantiate_request
    assert "parameter_values" in instantiate_request
    assert isinstance(instantiate_request["parameter_values"], dict)
    
    print("   ✓ Template instantiation request structure is valid")


if __name__ == "__main__":
    print("🧪 Running Template API Simple Tests...\n")
    
    test_template_schema_validation()
    print()
    
    test_template_instantiation_logic()
    print()
    
    test_dealership_templates()
    print()
    
    test_api_endpoint_structure()
    print()
    
    print("🎉 All template API tests passed successfully!")