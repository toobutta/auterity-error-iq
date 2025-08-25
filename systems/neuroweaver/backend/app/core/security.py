"""
Security utilities for NeuroWeaver
"""
import os
import re
from pathlib import Path
from typing import Any, Dict


class SecurityValidator:
    """Security validation utilities"""

    @staticmethod
    def sanitize_log_input(input_str: str) -> str:
        """Sanitize input for logging to prevent log injection"""
        if not isinstance(input_str, str):
            input_str = str(input_str)

        # Remove control characters and limit length
        sanitized = re.sub(r"[\x00-\x1f\x7f-\x9f]", "", input_str)
        return sanitized[:200] + "..." if len(sanitized) > 200 else sanitized

    @staticmethod
    def validate_path(path: str, base_dir: str) -> str:
        """Validate file path to prevent directory traversal"""
        if not path or not isinstance(path, str):
            raise ValueError("Invalid path")

        # Resolve absolute paths
        abs_path = os.path.abspath(path)
        abs_base = os.path.abspath(base_dir)

        # Check if path is within base directory
        if not abs_path.startswith(abs_base):
            raise ValueError("Path outside allowed directory")

        return abs_path

    @staticmethod
    def validate_model_id(model_id: str) -> str:
        """Validate model ID format"""
        if not model_id or not isinstance(model_id, str):
            raise ValueError("Invalid model ID")

        # Allow alphanumeric, hyphens, underscores
        if not re.match(r"^[a-zA-Z0-9_-]+$", model_id):
            raise ValueError("Model ID contains invalid characters")

        return model_id[:100]  # Limit length

    @staticmethod
    def validate_config(config: Dict[str, Any]) -> Dict[str, Any]:
        """Validate training configuration"""
        if not isinstance(config, dict):
            raise ValueError("Config must be a dictionary")

        # Basic validation - extend as needed
        required_fields = ["model_name", "base_model", "dataset_path"]
        for field in required_fields:
            if field not in config:
                raise ValueError(f"Missing required field: {field}")

        return config
