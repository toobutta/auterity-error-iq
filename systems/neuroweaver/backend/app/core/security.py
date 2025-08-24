"""
Security utilities and validation functions
"""

import os
import re
import html
from pathlib import Path
from typing import Any, Dict, List
from urllib.parse import quote

class SecurityValidator:
    """Centralized security validation"""
    
    @staticmethod
    def validate_path(path: str, base_dir: str) -> str:
        """Prevent path traversal attacks"""
        if not path or not base_dir:
            raise ValueError("Path and base_dir required")
        
        # Normalize and resolve paths
        base = Path(base_dir).resolve()
        target = (base / Path(path).name).resolve()
        
        # Ensure target is within base directory
        if not str(target).startswith(str(base)):
            raise ValueError(f"Path traversal detected: {path}")
        
        return str(target)
    
    @staticmethod
    def sanitize_log_input(data: Any) -> str:
        """Sanitize data for logging"""
        text = str(data)
        # Remove control characters and newlines
        return re.sub(r'[\r\n\t\x00-\x1f\x7f-\x9f]', '', text)[:500]
    
    @staticmethod
    def sanitize_html(data: str) -> str:
        """Sanitize HTML content"""
        return html.escape(str(data))
    
    @staticmethod
    def validate_model_id(model_id: str) -> str:
        """Validate model ID format"""
        if not re.match(r'^[a-zA-Z0-9_-]+$', model_id):
            raise ValueError("Invalid model ID format")
        return model_id
    
    @staticmethod
    def validate_config(config: Dict[str, Any]) -> Dict[str, Any]:
        """Validate training configuration"""
        required = ['model_name', 'base_model', 'dataset_path']
        for field in required:
            if field not in config:
                raise ValueError(f"Missing required field: {field}")
        
        # Sanitize string fields
        for key, value in config.items():
            if isinstance(value, str):
                config[key] = SecurityValidator.sanitize_log_input(value)
        
        return config