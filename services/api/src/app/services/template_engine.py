"""Template engine service for managing workflow templates."""

import json
import re
import uuid
from typing import Any, Dict, List, Optional

from sqlalchemy.orm import Session

from app.models import Template, TemplateParameter, Workflow


class TemplateEngine:
    """Service for managing workflow templates and instantiation."""

    def __init__(self, db: Session):
        self.db = db

    async def get_templates(
        self, category: Optional[str] = None
    ) -> List[Template]:
        """Get all active templates, optionally filtered by category."""
        query = self.db.query(Template).filter(Template.is_active is True)

        if category:
            query = query.filter(Template.category == category.lower())

        return query.all()

    async def get_template(self, template_id: uuid.UUID) -> Optional[Template]:
        """Get a specific template by ID."""
        return (
            self.db.query(Template)
            .filter(Template.id == template_id, Template.is_active is True)
            .first()
        )

    async def instantiate_template(
        self,
        template_id: uuid.UUID,
        name: str,
        parameter_values: Dict[str, Any],
        user_id: uuid.UUID,
        description: Optional[str] = None,
    ) -> Workflow:
        """Create a new workflow from a template with parameter substitution."""
        # Get the template
        template = await self.get_template(template_id)
        if not template:
            raise ValueError(f"Template with ID {template_id} not found")

        # Validate required parameters
        await self._validate_parameters(template, parameter_values)

        # Substitute parameters in the template definition
        workflow_definition = await self._substitute_parameters(
            template.definition, template.parameters, parameter_values
        )

        # Create the new workflow
        workflow = Workflow(
            name=name,
            description=description
            or f"Workflow created from template: {template.name}",
            user_id=user_id,
            definition=workflow_definition,
            is_active=True,
        )

        self.db.add(workflow)
        self.db.commit()
        self.db.refresh(workflow)

        return workflow

    async def _validate_parameters(
        self, template: Template, parameter_values: Dict[str, Any]
    ) -> None:
        """Validate that all required parameters are provided and valid."""
        errors = []

        for param in template.parameters:
            param_name = param.name
            param_value = parameter_values.get(param_name)

            # Check required parameters
            if param.is_required and (
                param_value is None or param_value == ""
            ):
                errors.append(f"Required parameter '{param_name}' is missing")
                continue

            # Use default value if parameter not provided
            if param_value is None and param.default_value is not None:
                parameter_values[param_name] = param.default_value
                param_value = param.default_value

            # Skip validation if parameter is not provided and not required
            if param_value is None:
                continue

            # Validate parameter type
            type_error = self._validate_parameter_type(param, param_value)
            if type_error:
                errors.append(type_error)

            # Validate against custom validation rules
            validation_error = self._validate_parameter_rules(
                param, param_value
            )
            if validation_error:
                errors.append(validation_error)

        if errors:
            raise ValueError(
                f"Parameter validation failed: {'; '.join(errors)}"
            )

    def _validate_parameter_type(
        self, param: TemplateParameter, value: Any
    ) -> Optional[str]:
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

    def _validate_parameter_rules(
        self, param: TemplateParameter, value: Any
    ) -> Optional[str]:
        """Validate parameter value against custom validation rules."""
        if not param.validation_rules:
            return None

        rules = param.validation_rules
        param_name = param.name

        # String validation rules
        if isinstance(value, str):
            if "min_length" in rules and len(value) < rules["min_length"]:
                return f"Parameter '{param_name}' must be at least {rules['min_length']} characters long"
            if "max_length" in rules and len(value) > rules["max_length"]:
                return f"Parameter '{param_name}' must be at most {rules['max_length']} characters long"
            if "pattern" in rules and not re.match(rules["pattern"], value):
                return (
                    f"Parameter '{param_name}' does not match required pattern"
                )

        # Number validation rules
        if isinstance(value, (int, float)):
            if "min_value" in rules and value < rules["min_value"]:
                return f"Parameter '{param_name}' must be at least {rules['min_value']}"
            if "max_value" in rules and value > rules["max_value"]:
                return f"Parameter '{param_name}' must be at most {rules['max_value']}"

        # Array validation rules
        if isinstance(value, list):
            if "min_items" in rules and len(value) < rules["min_items"]:
                return f"Parameter '{param_name}' must have at least {rules['min_items']} items"
            if "max_items" in rules and len(value) > rules["max_items"]:
                return f"Parameter '{param_name}' must have at most {rules['max_items']} items"

        return None

    async def _substitute_parameters(
        self,
        definition: Dict[str, Any],
        parameters: List[TemplateParameter],
        parameter_values: Dict[str, Any],
    ) -> Dict[str, Any]:
        """Substitute parameter placeholders in the template definition."""
        # Convert definition to JSON string for easier substitution
        definition_str = json.dumps(definition)

        # Create parameter mapping with defaults
        param_map = {}
        for param in parameters:
            param_name = param.name
            if param_name in parameter_values:
                param_map[param_name] = parameter_values[param_name]
            elif param.default_value is not None:
                param_map[param_name] = param.default_value

        # Substitute parameters using template syntax {{parameter_name}}
        for param_name, param_value in param_map.items():
            placeholder = f"{{{{{param_name}}}}}"
            # Convert parameter value to JSON string for substitution
            if isinstance(param_value, str):
                param_value_str = (
                    param_value  # Don't add extra quotes for strings
                )
            else:
                param_value_str = json.dumps(param_value)
            definition_str = definition_str.replace(
                placeholder, param_value_str
            )

        # Parse back to dictionary
        try:
            return json.loads(definition_str)
        except json.JSONDecodeError as e:
            raise ValueError(
                f"Failed to parse template definition after parameter substitution: {e}"
            )

    async def create_template(
        self,
        name: str,
        description: str,
        category: str,
        definition: Dict[str, Any],
        parameters: Optional[List[Dict[str, Any]]] = None,
    ) -> Template:
        """Create a new template."""
        template = Template(
            name=name,
            description=description,
            category=category.lower(),
            definition=definition,
            is_active=True,
        )

        self.db.add(template)
        self.db.flush()  # Get the template ID

        # Create template parameters
        if parameters:
            for param_data in parameters:
                parameter = TemplateParameter(
                    template_id=template.id,
                    name=param_data["name"],
                    description=param_data.get("description"),
                    parameter_type=param_data["parameter_type"],
                    is_required=param_data.get("is_required", False),
                    default_value=param_data.get("default_value"),
                    validation_rules=param_data.get("validation_rules"),
                )
                self.db.add(parameter)

        self.db.commit()
        self.db.refresh(template)

        return template
