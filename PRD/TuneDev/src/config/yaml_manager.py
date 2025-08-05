"""
YAML Configuration Manager

This module handles YAML-based configuration for NeuroWeaver workflows,
including validation, template management, and GUI integration.
"""

import os
import yaml
import json
import logging
import re
from typing import Dict, Any, List, Optional, Union
from dataclasses import dataclass
import jsonschema
from jsonschema import validate

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@dataclass
class YAMLTemplate:
    """YAML template for workflow configuration"""
    name: str
    description: str
    category: str
    template: str
    schema: Dict[str, Any]
    example: str
    variables: List[Dict[str, Any]]


class YAMLManager:
    """
    Manager for YAML configuration files used in NeuroWeaver workflows.
    Handles validation, template management, and variable substitution.
    """
    
    def __init__(self, templates_dir: Optional[str] = None):
        """
        Initialize the YAML Manager
        
        Args:
            templates_dir: Directory containing YAML templates
        """
        self.templates_dir = templates_dir or os.path.join(os.path.dirname(__file__), "templates")
        self.templates = {}
        self.schemas = {}
        
        # Load templates if directory exists
        if os.path.exists(self.templates_dir):
            self._load_templates()
            
    def _load_templates(self):
        """Load YAML templates from the templates directory"""
        for filename in os.listdir(self.templates_dir):
            if filename.endswith(".yaml") or filename.endswith(".yml"):
                template_path = os.path.join(self.templates_dir, filename)
                try:
                    with open(template_path, 'r') as f:
                        template_data = yaml.safe_load(f)
                        
                    # Extract template metadata
                    metadata = template_data.get("metadata", {})
                    name = metadata.get("name", os.path.splitext(filename)[0])
                    
                    # Load schema if specified
                    schema = {}
                    schema_path = metadata.get("schema")
                    if schema_path:
                        schema_full_path = os.path.join(self.templates_dir, schema_path)
                        if os.path.exists(schema_full_path):
                            with open(schema_full_path, 'r') as f:
                                schema = json.load(f)
                                
                    # Create template object
                    template = YAMLTemplate(
                        name=name,
                        description=metadata.get("description", ""),
                        category=metadata.get("category", "general"),
                        template=yaml.dump(template_data.get("template", {})),
                        schema=schema,
                        example=yaml.dump(template_data.get("example", {})),
                        variables=template_data.get("variables", [])
                    )
                    
                    self.templates[name] = template
                    self.schemas[name] = schema
                    
                    logger.info(f"Loaded template: {name}")
                    
                except Exception as e:
                    logger.error(f"Error loading template {filename}: {str(e)}")
                    
    def get_template(self, name: str) -> Optional[YAMLTemplate]:
        """
        Get a template by name
        
        Args:
            name: Template name
            
        Returns:
            Optional[YAMLTemplate]: Template object or None if not found
        """
        return self.templates.get(name)
        
    def get_templates_by_category(self, category: str) -> List[YAMLTemplate]:
        """
        Get templates by category
        
        Args:
            category: Template category
            
        Returns:
            List[YAMLTemplate]: List of templates in the category
        """
        return [t for t in self.templates.values() if t.category == category]
        
    def get_all_templates(self) -> List[YAMLTemplate]:
        """
        Get all templates
        
        Returns:
            List[YAMLTemplate]: List of all templates
        """
        return list(self.templates.values())
        
    def get_all_categories(self) -> List[str]:
        """
        Get all template categories
        
        Returns:
            List[str]: List of all categories
        """
        return sorted(list(set(t.category for t in self.templates.values())))
        
    def validate_yaml(self, yaml_str: str, template_name: Optional[str] = None) -> Dict[str, Any]:
        """
        Validate a YAML string against a schema
        
        Args:
            yaml_str: YAML string to validate
            template_name: Optional template name to use for validation
            
        Returns:
            Dict[str, Any]: Validation result with 'valid' and 'errors' keys
        """
        try:
            # Parse YAML
            config = yaml.safe_load(yaml_str)
            
            # If template specified, validate against schema
            if template_name and template_name in self.schemas and self.schemas[template_name]:
                try:
                    validate(instance=config, schema=self.schemas[template_name])
                    return {"valid": True, "errors": []}
                except jsonschema.exceptions.ValidationError as e:
                    return {"valid": False, "errors": [str(e)]}
                    
            # Basic validation (check if it's valid YAML)
            return {"valid": True, "errors": []}
            
        except yaml.YAMLError as e:
            return {"valid": False, "errors": [str(e)]}
            
    def substitute_variables(self, template: str, variables: Dict[str, Any]) -> str:
        """
        Substitute variables in a template
        
        Args:
            template: Template string
            variables: Dictionary of variables to substitute
            
        Returns:
            str: Template with variables substituted
        """
        result = template
        
        # Replace ${variable} with value
        for var_name, var_value in variables.items():
            pattern = r'\$\{' + re.escape(var_name) + r'\}'
            result = re.sub(pattern, str(var_value), result)
            
        return result
        
    def create_workflow_config(self, template_name: str, variables: Dict[str, Any]) -> str:
        """
        Create a workflow configuration from a template
        
        Args:
            template_name: Template name
            variables: Dictionary of variables to substitute
            
        Returns:
            str: Generated YAML configuration
        """
        template = self.get_template(template_name)
        if not template:
            raise ValueError(f"Template not found: {template_name}")
            
        # Substitute variables
        return self.substitute_variables(template.template, variables)
        
    def save_workflow_config(self, config: str, output_path: str):
        """
        Save a workflow configuration to a file
        
        Args:
            config: YAML configuration string
            output_path: Path to save the configuration
        """
        with open(output_path, 'w') as f:
            f.write(config)
            
        logger.info(f"Saved workflow configuration to {output_path}")
        
    def load_workflow_config(self, input_path: str) -> str:
        """
        Load a workflow configuration from a file
        
        Args:
            input_path: Path to the configuration file
            
        Returns:
            str: YAML configuration string
        """
        with open(input_path, 'r') as f:
            config = f.read()
            
        logger.info(f"Loaded workflow configuration from {input_path}")
        return config


# Create example templates
def create_example_templates(output_dir: str):
    """
    Create example YAML templates for different workflow types
    
    Args:
        output_dir: Directory to save templates
    """
    os.makedirs(output_dir, exist_ok=True)
    
    # Create schema directory
    schema_dir = os.path.join(output_dir, "schemas")
    os.makedirs(schema_dir, exist_ok=True)
    
    # Fine-tuning template
    fine_tuning_schema = {
        "$schema": "http://json-schema.org/draft-07/schema#",
        "type": "object",
        "required": ["task", "model", "method", "dataset"],
        "properties": {
            "task": {
                "type": "string",
                "enum": ["fine-tune"]
            },
            "model": {
                "type": "string"
            },
            "method": {
                "type": "string",
                "enum": ["QLoRA", "LoRA", "full-finetune"]
            },
            "dataset": {
                "type": "string"
            },
            "feedback": {
                "type": "string",
                "enum": ["auto_rlaif", "human", "none"]
            },
            "output_dir": {
                "type": "string"
            },
            "metrics": {
                "type": "array",
                "items": {
                    "type": "string"
                }
            }
        }
    }
    
    with open(os.path.join(schema_dir, "fine_tuning_schema.json"), 'w') as f:
        json.dump(fine_tuning_schema, f, indent=2)
    
    fine_tuning_template = {
        "metadata": {
            "name": "fine-tuning",
            "description": "Fine-tune a language model using QLoRA or other methods",
            "category": "training",
            "schema": "schemas/fine_tuning_schema.json"
        },
        "template": {
            "task": "fine-tune",
            "model": "${model}",
            "method": "${method}",
            "dataset": "${dataset}",
            "feedback": "${feedback}",
            "output_dir": "${output_dir}",
            "metrics": ["${metrics}"]
        },
        "example": {
            "task": "fine-tune",
            "model": "mistral-7b",
            "method": "QLoRA",
            "dataset": "./datasets/financial_qa",
            "feedback": "auto_rlaif",
            "output_dir": "./checkpoints/mistral-financial",
            "metrics": ["accuracy", "f1"]
        },
        "variables": [
            {
                "name": "model",
                "description": "Base model to fine-tune",
                "type": "string",
                "options": ["mistral-7b", "llama-7b", "llama-13b", "gpt-j-6b"]
            },
            {
                "name": "method",
                "description": "Fine-tuning method",
                "type": "string",
                "options": ["QLoRA", "LoRA", "full-finetune"]
            },
            {
                "name": "dataset",
                "description": "Path to dataset",
                "type": "string"
            },
            {
                "name": "feedback",
                "description": "Feedback method",
                "type": "string",
                "options": ["auto_rlaif", "human", "none"]
            },
            {
                "name": "output_dir",
                "description": "Output directory for checkpoints",
                "type": "string"
            },
            {
                "name": "metrics",
                "description": "Evaluation metrics",
                "type": "array",
                "items": {
                    "type": "string",
                    "options": ["accuracy", "f1", "precision", "recall", "rouge"]
                }
            }
        ]
    }
    
    with open(os.path.join(output_dir, "fine_tuning.yaml"), 'w') as f:
        yaml.dump(fine_tuning_template, f)
        
    # Inference template
    inference_schema = {
        "$schema": "http://json-schema.org/draft-07/schema#",
        "type": "object",
        "required": ["task", "model", "endpoint_type"],
        "properties": {
            "task": {
                "type": "string",
                "enum": ["deploy"]
            },
            "model": {
                "type": "string"
            },
            "endpoint_type": {
                "type": "string",
                "enum": ["vllm", "triton", "tensorrt", "onnx"]
            },
            "quantization": {
                "type": "string",
                "enum": ["none", "int8", "int4"]
            },
            "instance_type": {
                "type": "string"
            },
            "instance_count": {
                "type": "integer",
                "minimum": 1
            },
            "max_batch_size": {
                "type": "integer",
                "minimum": 1
            },
            "max_tokens": {
                "type": "integer",
                "minimum": 1
            }
        }
    }
    
    with open(os.path.join(schema_dir, "inference_schema.json"), 'w') as f:
        json.dump(inference_schema, f, indent=2)
    
    inference_template = {
        "metadata": {
            "name": "inference",
            "description": "Deploy a model for inference",
            "category": "deployment",
            "schema": "schemas/inference_schema.json"
        },
        "template": {
            "task": "deploy",
            "model": "${model}",
            "endpoint_type": "${endpoint_type}",
            "quantization": "${quantization}",
            "instance_type": "${instance_type}",
            "instance_count": "${instance_count}",
            "max_batch_size": "${max_batch_size}",
            "max_tokens": "${max_tokens}"
        },
        "example": {
            "task": "deploy",
            "model": "./checkpoints/mistral-financial",
            "endpoint_type": "vllm",
            "quantization": "none",
            "instance_type": "g4dn.xlarge",
            "instance_count": 1,
            "max_batch_size": 8,
            "max_tokens": 2048
        },
        "variables": [
            {
                "name": "model",
                "description": "Model path or identifier",
                "type": "string"
            },
            {
                "name": "endpoint_type",
                "description": "Inference endpoint type",
                "type": "string",
                "options": ["vllm", "triton", "tensorrt", "onnx"]
            },
            {
                "name": "quantization",
                "description": "Quantization method",
                "type": "string",
                "options": ["none", "int8", "int4"]
            },
            {
                "name": "instance_type",
                "description": "Instance type for deployment",
                "type": "string",
                "options": ["g4dn.xlarge", "g5.xlarge", "c5.2xlarge"]
            },
            {
                "name": "instance_count",
                "description": "Number of instances",
                "type": "integer",
                "default": 1
            },
            {
                "name": "max_batch_size",
                "description": "Maximum batch size",
                "type": "integer",
                "default": 8
            },
            {
                "name": "max_tokens",
                "description": "Maximum tokens per request",
                "type": "integer",
                "default": 2048
            }
        ]
    }
    
    with open(os.path.join(output_dir, "inference.yaml"), 'w') as f:
        yaml.dump(inference_template, f)
        
    # Automotive vertical kit template
    automotive_schema = {
        "$schema": "http://json-schema.org/draft-07/schema#",
        "type": "object",
        "required": ["task", "vertical", "model", "method"],
        "properties": {
            "task": {
                "type": "string",
                "enum": ["vertical-tune"]
            },
            "vertical": {
                "type": "string",
                "enum": ["automotive"]
            },
            "model": {
                "type": "string"
            },
            "method": {
                "type": "string",
                "enum": ["QLoRA", "LoRA"]
            },
            "specializations": {
                "type": "array",
                "items": {
                    "type": "string",
                    "enum": ["dealership", "service", "sales", "parts", "general"]
                }
            },
            "output_dir": {
                "type": "string"
            },
            "deployment": {
                "type": "object",
                "properties": {
                    "endpoint_type": {
                        "type": "string",
                        "enum": ["vllm", "triton", "tensorrt", "onnx"]
                    },
                    "quantization": {
                        "type": "string",
                        "enum": ["none", "int8", "int4"]
                    }
                }
            }
        }
    }
    
    with open(os.path.join(schema_dir, "automotive_schema.json"), 'w') as f:
        json.dump(automotive_schema, f, indent=2)
    
    automotive_template = {
        "metadata": {
            "name": "automotive",
            "description": "Fine-tune a model for automotive industry applications",
            "category": "vertical-kits",
            "schema": "schemas/automotive_schema.json"
        },
        "template": {
            "task": "vertical-tune",
            "vertical": "automotive",
            "model": "${model}",
            "method": "${method}",
            "specializations": ["${specializations}"],
            "output_dir": "${output_dir}",
            "deployment": {
                "endpoint_type": "${endpoint_type}",
                "quantization": "${quantization}"
            }
        },
        "example": {
            "task": "vertical-tune",
            "vertical": "automotive",
            "model": "mistral-7b",
            "method": "QLoRA",
            "specializations": ["dealership", "service", "sales"],
            "output_dir": "./checkpoints/mistral-automotive",
            "deployment": {
                "endpoint_type": "vllm",
                "quantization": "int8"
            }
        },
        "variables": [
            {
                "name": "model",
                "description": "Base model to fine-tune",
                "type": "string",
                "options": ["mistral-7b", "llama-7b", "llama-13b", "gpt-j-6b"]
            },
            {
                "name": "method",
                "description": "Fine-tuning method",
                "type": "string",
                "options": ["QLoRA", "LoRA"]
            },
            {
                "name": "specializations",
                "description": "Automotive specializations",
                "type": "array",
                "items": {
                    "type": "string",
                    "options": ["dealership", "service", "sales", "parts", "general"]
                }
            },
            {
                "name": "output_dir",
                "description": "Output directory for checkpoints",
                "type": "string"
            },
            {
                "name": "endpoint_type",
                "description": "Inference endpoint type",
                "type": "string",
                "options": ["vllm", "triton", "tensorrt", "onnx"]
            },
            {
                "name": "quantization",
                "description": "Quantization method",
                "type": "string",
                "options": ["none", "int8", "int4"]
            }
        ]
    }
    
    with open(os.path.join(output_dir, "automotive.yaml"), 'w') as f:
        yaml.dump(automotive_template, f)
        
    logger.info(f"Created example templates in {output_dir}")


# Example usage
if __name__ == "__main__":
    # Create example templates
    templates_dir = os.path.join(os.path.dirname(__file__), "templates")
    create_example_templates(templates_dir)
    
    # Initialize YAML Manager
    yaml_manager = YAMLManager(templates_dir)
    
    # List templates
    print("Available templates:")
    for template in yaml_manager.get_all_templates():
        print(f"- {template.name}: {template.description} (Category: {template.category})")
        
    # Create a workflow configuration
    variables = {
        "model": "mistral-7b",
        "method": "QLoRA",
        "dataset": "./datasets/automotive_qa",
        "feedback": "auto_rlaif",
        "output_dir": "./checkpoints/mistral-automotive",
        "metrics": "accuracy"
    }
    
    config = yaml_manager.create_workflow_config("fine-tuning", variables)
    print("\nGenerated configuration:")
    print(config)
    
    # Validate the configuration
    validation = yaml_manager.validate_yaml(config, "fine-tuning")
    print(f"\nValidation result: {'Valid' if validation['valid'] else 'Invalid'}")
    if not validation['valid']:
        print(f"Errors: {validation['errors']}")