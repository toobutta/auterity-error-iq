#!/usr/bin/env python3
"""
NeuroWeaver ML Dependencies Installation and Validation Script

This script ensures all required ML dependencies are properly installed
and validates the training pipeline functionality.
"""

import subprocess
import sys
import importlib
import logging
from pathlib import Path
from typing import List, Tuple, Dict, Any

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Required packages with their import names and minimum versions
REQUIRED_PACKAGES = [
    ("torch", "torch", "2.1.0"),
    ("transformers", "transformers", "4.35.0"),
    ("datasets", "datasets", "2.14.0"),
    ("tokenizers", "tokenizers", "0.15.0"),
    ("accelerate", "accelerate", "0.24.0"),
    ("peft", "peft", "0.6.0"),
    ("bitsandbytes", "bitsandbytes", "0.41.0"),
    ("trl", "trl", "0.7.0"),
    ("wandb", "wandb", "0.16.0"),
    ("tensorboard", "tensorboard", "2.15.0"),
    ("pandas", "pandas", "2.1.0"),
    ("numpy", "numpy", "1.24.0"),
    ("scikit-learn", "sklearn", "1.3.0"),
    ("scipy", "scipy", "1.11.0"),
    ("openai", "openai", "1.3.0"),
    ("PyYAML", "yaml", "6.0.0"),
    ("tqdm", "tqdm", "4.66.0"),
    ("psutil", "psutil", "5.9.0")
]

OPTIONAL_PACKAGES = [
    ("flash-attn", "flash_attn", "2.3.0"),
    ("xformers", "xformers", "0.0.22")
]


def check_package_installed(package_name: str, import_name: str) -> Tuple[bool, str]:
    """Check if a package is installed and return version info."""
    try:
        module = importlib.import_module(import_name)
        version = getattr(module, '__version__', 'unknown')
        return True, version
    except ImportError:
        return False, "not installed"


def install_package(package_name: str) -> bool:
    """Install a package using pip."""
    try:
        logger.info(f"Installing {package_name}...")
        subprocess.check_call([
            sys.executable, "-m", "pip", "install", package_name, 
            "--upgrade", "--no-cache-dir"
        ])
        return True
    except subprocess.CalledProcessError as e:
        logger.error(f"Failed to install {package_name}: {e}")
        return False


def validate_installation() -> Dict[str, Any]:
    """Validate all required packages are installed."""
    results = {
        "required": {},
        "optional": {},
        "missing_required": [],
        "missing_optional": [],
        "all_required_installed": True
    }
    
    logger.info("Validating required packages...")
    for package_name, import_name, min_version in REQUIRED_PACKAGES:
        installed, version = check_package_installed(package_name, import_name)
        results["required"][package_name] = {
            "installed": installed,
            "version": version,
            "min_version": min_version
        }
        
        if not installed:
            results["missing_required"].append(package_name)
            results["all_required_installed"] = False
            logger.warning(f"❌ {package_name} not installed")
        else:
            logger.info(f"✅ {package_name} ({version})")
    
    logger.info("Validating optional packages...")
    for package_name, import_name, min_version in OPTIONAL_PACKAGES:
        installed, version = check_package_installed(package_name, import_name)
        results["optional"][package_name] = {
            "installed": installed,
            "version": version,
            "min_version": min_version
        }
        
        if not installed:
            results["missing_optional"].append(package_name)
            logger.info(f"⚠️  {package_name} not installed (optional)")
        else:
            logger.info(f"✅ {package_name} ({version})")
    
    return results


def install_missing_packages(validation_results: Dict[str, Any]) -> bool:
    """Install any missing required packages."""
    missing_required = validation_results["missing_required"]
    
    if not missing_required:
        logger.info("All required packages are already installed!")
        return True
    
    logger.info(f"Installing {len(missing_required)} missing required packages...")
    
    # Try to install from requirements file first
    requirements_file = Path(__file__).parent / "requirements-ml.txt"
    if requirements_file.exists():
        try:
            logger.info("Installing from requirements-ml.txt...")
            subprocess.check_call([
                sys.executable, "-m", "pip", "install", 
                "-r", str(requirements_file), "--upgrade"
            ])
            return True
        except subprocess.CalledProcessError:
            logger.warning("Failed to install from requirements file, trying individual packages...")
    
    # Install packages individually
    success = True
    for package_name in missing_required:
        if not install_package(package_name):
            success = False
    
    return success


def test_training_pipeline_imports():
    """Test that the training pipeline can import all required modules."""
    logger.info("Testing training pipeline imports...")
    
    try:
        # Test basic imports
        import torch
        logger.info(f"✅ PyTorch {torch.__version__} (CUDA: {torch.cuda.is_available()})")
        
        from transformers import AutoTokenizer, AutoModelForCausalLM
        logger.info("✅ Transformers models")
        
        from peft import LoraConfig, get_peft_model
        logger.info("✅ PEFT (LoRA)")
        
        from datasets import Dataset
        logger.info("✅ Datasets")
        
        try:
            from trl import PPOTrainer, PPOConfig
            logger.info("✅ TRL (RLAIF support)")
        except ImportError:
            logger.warning("⚠️  TRL not available (RLAIF will be disabled)")
        
        try:
            import openai
            logger.info("✅ OpenAI client")
        except ImportError:
            logger.warning("⚠️  OpenAI not available")
        
        logger.info("✅ All core training pipeline imports successful!")
        return True
        
    except ImportError as e:
        logger.error(f"❌ Training pipeline import failed: {e}")
        return False


def main():
    """Main installation and validation script."""
    logger.info("=== NeuroWeaver ML Dependencies Setup ===")
    
    # Initial validation
    logger.info("Step 1: Validating current installation...")
    validation_results = validate_installation()
    
    # Install missing packages
    if not validation_results["all_required_installed"]:
        logger.info("Step 2: Installing missing packages...")
        if not install_missing_packages(validation_results):
            logger.error("Failed to install some required packages!")
            sys.exit(1)
        
        # Re-validate after installation
        logger.info("Step 3: Re-validating installation...")
        validation_results = validate_installation()
        
        if not validation_results["all_required_installed"]:
            logger.error("Some required packages are still missing after installation!")
            sys.exit(1)
    else:
        logger.info("Step 2: All required packages already installed!")
    
    # Test imports
    logger.info("Step 3: Testing training pipeline imports...")
    if not test_training_pipeline_imports():
        logger.error("Training pipeline import test failed!")
        sys.exit(1)
    
    logger.info("=== Setup Complete! ===")
    logger.info("✅ All ML dependencies are properly installed")
    logger.info("✅ Training pipeline imports are working")
    logger.info("🚀 NeuroWeaver training pipeline is ready to use!")


if __name__ == "__main__":
    main()
