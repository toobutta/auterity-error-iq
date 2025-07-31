#!/usr/bin/env python3
"""Validation script for template management system."""

import asyncio
import sys
from typing import Dict, Any

# Add the app directory to the Python path
sys.path.insert(0, '/Users/andrew-thompson/Documents/Dryva/Dryva-IDE/Dryva/backend')

from app.database import SessionLocal
from app.models import Template, TemplateParameter, User
from app.services.template_engine import TemplateEngine


async def validate_template_system():
    """Validate that the template management system is working correctly."""
    print("🔍 Validating Template Management System...")
    
    db = SessionLocal()
    template_engine = TemplateEngine(db)
    
    try:
        # Test 1: Create a test template
        print("\n1. Testing template creation...")
        test_template_data = {
            "name": "Test Validation Template",
            "description": "A template for validation testing",
            "category": "general",
            "definition": {
                "nodes": [
                    {
                        "id": "start",
                        "type": "start",
                        "position": {"x": 100, "y": 100},
                        "data": {"label": "Start: {{test_param}}"}
                    },
                    {
                        "id": "end",
                        "type": "end",
                        "position": {"x": 300, "y": 100},
                        "data": {"label": "End"}
                    }
                ],
                "edges": [
                    {"id": "e1", "source": "start", "target": "end"}
                ]
            },
            "parameters": [
                {
                    "name": "test_param",
                    "description": "Test parameter",
                    "parameter_type": "string",
                    "is_required": True,
                    "validation_rules": {"min_length": 1, "max_length": 100}
                }
            ]
        }
        
        template = await template_engine.create_template(
            name=test_template_data["name"],
            description=test_template_data["description"],
            category=test_template_data["category"],
            definition=test_template_data["definition"],
            parameters=test_template_data["parameters"]
        )
        
        print(f"✅ Template created successfully: {template.name} (ID: {template.id})")
        print(f"   Parameters: {len(template.parameters)}")
        
        # Test 2: Retrieve templates
        print("\n2. Testing template retrieval...")
        templates = await template_engine.get_templates()
        print(f"✅ Retrieved {len(templates)} templates")
        
        # Test 3: Get specific template
        print("\n3. Testing specific template retrieval...")
        retrieved_template = await template_engine.get_template(template.id)
        if retrieved_template:
            print(f"✅ Retrieved template: {retrieved_template.name}")
        else:
            print("❌ Failed to retrieve template by ID")
            return False
        
        # Test 4: Create a test user for instantiation
        print("\n4. Creating test user...")
        test_user = User(
            email="test@validation.com",
            name="Test User",
            hashed_password="test_hash",
            is_active=True
        )
        db.add(test_user)
        db.commit()
        db.refresh(test_user)
        print(f"✅ Test user created: {test_user.email}")
        
        # Test 5: Template instantiation
        print("\n5. Testing template instantiation...")
        parameter_values = {
            "test_param": "Hello, World!"
        }
        
        workflow = await template_engine.instantiate_template(
            template_id=template.id,
            name="Test Workflow from Template",
            parameter_values=parameter_values,
            user_id=test_user.id,
            description="Test workflow created from template"
        )
        
        print(f"✅ Workflow created from template: {workflow.name} (ID: {workflow.id})")
        
        # Verify parameter substitution
        import json
        definition_str = json.dumps(workflow.definition)
        if "Hello, World!" in definition_str and "{{test_param}}" not in definition_str:
            print("✅ Parameter substitution working correctly")
        else:
            print("❌ Parameter substitution failed")
            return False
        
        # Test 6: Parameter validation
        print("\n6. Testing parameter validation...")
        try:
            await template_engine.instantiate_template(
                template_id=template.id,
                name="Invalid Workflow",
                parameter_values={},  # Missing required parameter
                user_id=test_user.id
            )
            print("❌ Parameter validation failed - should have thrown error")
            return False
        except ValueError as e:
            print(f"✅ Parameter validation working: {str(e)}")
        
        # Test 7: Template categories
        print("\n7. Testing category filtering...")
        general_templates = await template_engine.get_templates(category="general")
        if len(general_templates) > 0:
            print(f"✅ Category filtering working: {len(general_templates)} general templates")
        else:
            print("❌ Category filtering failed")
            return False
        
        # Cleanup
        print("\n8. Cleaning up test data...")
        db.delete(workflow)
        db.delete(test_user)
        db.delete(template)
        db.commit()
        print("✅ Test data cleaned up")
        
        print("\n🎉 All template management system tests passed!")
        return True
        
    except Exception as e:
        print(f"\n❌ Template system validation failed: {e}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        db.close()


def validate_models():
    """Validate that template models are properly defined."""
    print("\n🔍 Validating Template Models...")
    
    try:
        # Test Template model
        template = Template(
            name="Test Template",
            description="Test description",
            category="test",
            definition={"nodes": [], "edges": []},
            is_active=True
        )
        print("✅ Template model instantiation successful")
        
        # Test TemplateParameter model
        param = TemplateParameter(
            template_id=template.id,
            name="test_param",
            description="Test parameter",
            parameter_type="string",
            is_required=True
        )
        print("✅ TemplateParameter model instantiation successful")
        
        return True
        
    except Exception as e:
        print(f"❌ Model validation failed: {e}")
        return False


def validate_database_schema():
    """Validate that template tables exist in the database."""
    print("\n🔍 Validating Database Schema...")
    
    try:
        db = SessionLocal()
        
        # Check if we can query templates table
        template_count = db.query(Template).count()
        print(f"✅ Templates table accessible, contains {template_count} records")
        
        # Check if we can query template_parameters table
        param_count = db.query(TemplateParameter).count()
        print(f"✅ Template parameters table accessible, contains {param_count} records")
        
        db.close()
        return True
        
    except Exception as e:
        print(f"❌ Database schema validation failed: {e}")
        return False


async def main():
    """Run all validation tests."""
    print("🚀 Starting Template Management System Validation")
    print("=" * 60)
    
    # Test 1: Model validation
    if not validate_models():
        print("\n❌ Model validation failed. Exiting.")
        return False
    
    # Test 2: Database schema validation
    if not validate_database_schema():
        print("\n❌ Database schema validation failed. Exiting.")
        return False
    
    # Test 3: Full system validation
    if not await validate_template_system():
        print("\n❌ Template system validation failed. Exiting.")
        return False
    
    print("\n" + "=" * 60)
    print("🎉 ALL VALIDATIONS PASSED! Template Management System is working correctly.")
    return True


if __name__ == "__main__":
    success = asyncio.run(main())
    sys.exit(0 if success else 1)