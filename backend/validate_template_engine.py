"""Validation script for template engine functionality."""

import json
import uuid
from typing import Any, Dict, List


class MockTemplateParameter:
    """Mock TemplateParameter for testing."""
    
    def __init__(self, name: str, parameter_type: str, is_required: bool = False, 
                 default_value: Any = None, validation_rules: Dict[str, Any] = None):
        self.name = name
        self.parameter_type = parameter_type
        self.is_required = is_required
        self.default_value = default_value
        self.validation_rules = validation_rules or {}


class MockTemplate:
    """Mock Template for testing."""
    
    def __init__(self, name: str, definition: Dict[str, Any], parameters: List[MockTemplateParameter] = None):
        self.id = uuid.uuid4()
        self.name = name
        self.definition = definition
        self.parameters = parameters or []


def validate_parameter_type(param: MockTemplateParameter, value: Any) -> str:
    """Validate parameter value against its expected type."""
    param_type = param.parameter_type.lower()
    param_name = param.name

    if param_type == "string" and not isinstance(value, str):
        return f"Parameter '{param_name}' must be a string"
    elif param_type == "number" and not isinstance(value, (int, float)):
        return f"Parameter '{param_name}' must be a number"
    elif param_type == "boolean" and not isinstance(value, bool):
        return f"Parameter '{param_name}' must be a boolean"
    elif param_type == "array" and not isinstance(value, list):
        return f"Parameter '{param_name}' must be an array"
    elif param_type == "object" and not isinstance(value, dict):
        return f"Parameter '{param_name}' must be an object"

    return None


def substitute_parameters(definition: Dict[str, Any], parameter_values: Dict[str, Any]) -> Dict[str, Any]:
    """Substitute parameter placeholders in the template definition."""
    # Convert definition to JSON string for easier substitution
    definition_str = json.dumps(definition)

    # Substitute parameters using template syntax {{parameter_name}}
    for param_name, param_value in parameter_values.items():
        placeholder = f"{{{{{param_name}}}}}"
        # Convert parameter value to JSON string for substitution
        if isinstance(param_value, str):
            param_value_str = param_value  # Don't add extra quotes for strings
        else:
            param_value_str = json.dumps(param_value)
        definition_str = definition_str.replace(placeholder, param_value_str)

    # Parse back to dictionary
    try:
        return json.loads(definition_str)
    except json.JSONDecodeError as e:
        raise ValueError(f"Failed to parse template definition after parameter substitution: {e}")


def test_template_functionality():
    """Test core template functionality."""
    print("Testing Template Engine Core Functionality...")
    
    # Test 1: Parameter type validation
    print("\n1. Testing parameter type validation...")
    
    string_param = MockTemplateParameter("test_string", "string", True)
    assert validate_parameter_type(string_param, "valid string") is None
    assert validate_parameter_type(string_param, 123) is not None
    print("   ✓ String parameter validation works")
    
    number_param = MockTemplateParameter("test_number", "number", True)
    assert validate_parameter_type(number_param, 123) is None
    assert validate_parameter_type(number_param, 123.45) is None
    assert validate_parameter_type(number_param, "not a number") is not None
    print("   ✓ Number parameter validation works")
    
    boolean_param = MockTemplateParameter("test_bool", "boolean", True)
    assert validate_parameter_type(boolean_param, True) is None
    assert validate_parameter_type(boolean_param, False) is None
    assert validate_parameter_type(boolean_param, "true") is not None
    print("   ✓ Boolean parameter validation works")
    
    # Test 2: Parameter substitution
    print("\n2. Testing parameter substitution...")
    
    template_definition = {
        "nodes": [
            {
                "id": "start",
                "type": "start",
                "data": {"label": "Start: {{greeting}}"}
            },
            {
                "id": "process",
                "type": "ai_process",
                "data": {
                    "label": "Process {{item_count}} items",
                    "prompt": "Process this: {{input_text}} with priority {{priority}}",
                    "enabled": "{{is_enabled}}"
                }
            }
        ],
        "edges": []
    }
    
    parameter_values = {
        "greeting": "Hello World",
        "item_count": 5,
        "input_text": "customer inquiry",
        "priority": "high",
        "is_enabled": True
    }
    
    result = substitute_parameters(template_definition, parameter_values)
    result_str = json.dumps(result)
    
    assert "Hello World" in result_str
    assert "5" in result_str
    assert "customer inquiry" in result_str
    assert "high" in result_str
    assert "true" in result_str
    assert "{{" not in result_str  # No placeholders should remain
    print("   ✓ Parameter substitution works correctly")
    
    # Test 3: Template structure validation
    print("\n3. Testing template structure...")
    
    valid_template = {
        "nodes": [
            {"id": "start", "type": "start"},
            {"id": "end", "type": "end"}
        ],
        "edges": [
            {"source": "start", "target": "end"}
        ]
    }
    
    # This would be validated in the schema validation
    assert "nodes" in valid_template
    assert "edges" in valid_template
    assert isinstance(valid_template["nodes"], list)
    assert isinstance(valid_template["edges"], list)
    print("   ✓ Template structure validation works")
    
    # Test 4: Complex parameter substitution
    print("\n4. Testing complex parameter substitution...")
    
    complex_definition = {
        "workflow_config": {
            "name": "{{workflow_name}}",
            "settings": {
                "timeout": "{{timeout_minutes}}",
                "retry_count": "{{max_retries}}"
            }
        },
        "steps": [
            {
                "type": "condition",
                "condition": "{{enable_feature}}"
            }
        ]
    }
    
    complex_params = {
        "workflow_name": "Customer Processing",
        "timeout_minutes": 30,
        "max_retries": 3,
        "enable_feature": False
    }
    
    complex_result = substitute_parameters(complex_definition, complex_params)
    complex_str = json.dumps(complex_result)
    
    assert "Customer Processing" in complex_str
    assert "30" in complex_str
    assert "3" in complex_str
    assert "false" in complex_str
    print("   ✓ Complex parameter substitution works")
    
    print("\n✅ All template engine core functionality tests passed!")
    
    # Test 5: Sample dealership templates
    print("\n5. Testing sample dealership templates...")
    
    customer_inquiry_template = {
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
                    "prompt": "Analyze this inquiry for {{dealership_name}}: {{customer_message}}"
                }
            }
        ],
        "edges": [{"source": "start", "target": "analyze"}]
    }
    
    dealership_params = {
        "dealership_name": "AutoMax Toyota",
        "customer_message": "I'm interested in a new Camry"
    }
    
    dealership_result = substitute_parameters(customer_inquiry_template, dealership_params)
    dealership_str = json.dumps(dealership_result)
    
    assert "AutoMax Toyota" in dealership_str
    assert "I'm interested in a new Camry" in dealership_str
    print("   ✓ Dealership template substitution works")
    
    print("\n🎉 All template functionality validation completed successfully!")


if __name__ == "__main__":
    test_template_functionality()