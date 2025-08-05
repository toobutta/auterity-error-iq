#!/usr/bin/env python3
"""
Backend structure validation script.
Validates that all Python files can be parsed and have proper structure.
"""

import ast
import sys
from pathlib import Path


def validate_python_file(file_path: Path) -> tuple[bool, str]:
    """Validate a Python file can be parsed."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Parse the AST to check for syntax errors
        ast.parse(content)
        return True, "OK"
    
    except SyntaxError as e:
        return False, f"Syntax error: {e}"
    except Exception as e:
        return False, f"Error: {e}"


def main():
    """Main validation function."""
    backend_dir = Path(__file__).parent
    app_dir = backend_dir / "app"
    
    if not app_dir.exists():
        print("❌ App directory not found")
        return False
    
    print("🔍 Validating backend code structure...")
    
    # Find all Python files
    python_files = list(app_dir.rglob("*.py"))
    
    if not python_files:
        print("❌ No Python files found")
        return False
    
    print(f"📁 Found {len(python_files)} Python files")
    
    # Validate each file
    errors = []
    for file_path in python_files:
        is_valid, message = validate_python_file(file_path)
        relative_path = file_path.relative_to(backend_dir)
        
        if is_valid:
            print(f"✅ {relative_path}")
        else:
            print(f"❌ {relative_path}: {message}")
            errors.append((relative_path, message))
    
    # Summary
    print(f"\n📊 Validation Summary:")
    print(f"   Total files: {len(python_files)}")
    print(f"   Valid files: {len(python_files) - len(errors)}")
    print(f"   Files with errors: {len(errors)}")
    
    if errors:
        print(f"\n❌ Files with errors:")
        for file_path, error in errors:
            print(f"   {file_path}: {error}")
        return False
    else:
        print(f"\n✅ All Python files are syntactically valid!")
        
        # Check key structure
        key_files = [
            "app/main.py",
            "app/database.py", 
            "app/models/workflow.py",
            "app/models/user.py",
            "app/api/workflows.py",
            "app/services/workflow_engine.py",
            "app/services/ai_service.py"
        ]
        
        print(f"\n🏗️  Checking key backend components:")
        missing_files = []
        for key_file in key_files:
            file_path = backend_dir / key_file
            if file_path.exists():
                print(f"✅ {key_file}")
            else:
                print(f"❌ {key_file} - MISSING")
                missing_files.append(key_file)
        
        if missing_files:
            print(f"\n⚠️  Missing key files: {len(missing_files)}")
            return False
        else:
            print(f"\n🎉 Backend structure validation PASSED!")
            return True


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)