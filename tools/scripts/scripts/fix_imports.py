#!/usr/bin/env python3
"""
Fix missing imports in backend API files.

This script adds missing FastAPI and Pydantic imports to API files
that are causing F821 undefined name errors.
"""

import re
from pathlib import Path
from typing import Set, Dict


def get_missing_imports_from_flake8_output(
    flake8_output: str
) -> Dict[str, Set[str]]:
    """Parse flake8 output to find missing imports per file."""
    missing_imports = {}

    # Pattern to match F821 undefined name errors
    pattern = r"(.+?):\d+:\d+: F821 undefined name '(\w+)'"

    for line in flake8_output.split("\n"):
        match = re.search(pattern, line)
        if match:
            file_path = match.group(1)
            undefined_name = match.group(2)

            if file_path not in missing_imports:
                missing_imports[file_path] = set()
            missing_imports[file_path].add(undefined_name)

    return missing_imports


def get_required_imports(undefined_names: Set[str]) -> Set[str]:
    """Map undefined names to their required import statements."""
    fastapi_imports = {
        "APIRouter",
        "Depends",
        "HTTPException",
        "status",
        "BackgroundTasks",
        "Request",
        "Response",
        "Query",
        "File",
        "UploadFile",
        "Form",
    }

    fastapi_security_imports = {
        "HTTPBearer",
        "HTTPAuthorizationCredentials",
        "OAuth2PasswordBearer",
    }

    pydantic_imports = {
        "BaseModel", "Field", "EmailStr", "validator", "root_validator"
    }

    typing_imports = {"Dict", "Any", "List", "Optional", "Union", "Tuple"}

    datetime_imports = {"datetime", "timedelta"}

    sqlalchemy_imports = {"Session", "joinedload", "select", "and_", "or_"}

    required_imports = set()

    for name in undefined_names:
        if name in fastapi_imports:
            required_imports.add("fastapi")
        elif name in fastapi_security_imports:
            required_imports.add("fastapi.security")
        elif name in pydantic_imports:
            required_imports.add("pydantic")
        elif name in typing_imports:
            required_imports.add("typing")
        elif name in datetime_imports:
            required_imports.add("datetime")
        elif name in sqlalchemy_imports:
            required_imports.add("sqlalchemy")

    return required_imports


def add_imports_to_file(file_path: str, undefined_names: Set[str]):
    """Add missing imports to a Python file."""
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()

        # Get required imports
        required_imports = get_required_imports(undefined_names)

        # Prepare import statements
        import_statements = []

        if "fastapi" in required_imports:
            fastapi_names = [
                name
                for name in undefined_names
                if name
                in {
                    "APIRouter",
                    "Depends",
                    "HTTPException",
                    "status",
                    "BackgroundTasks",
                    "Request",
                    "Response",
                    "Query",
                    "File",
                    "UploadFile",
                    "Form",
                }
            ]
            if fastapi_names:
                import_statements.append(
                    f"from fastapi import {', '.join(sorted(fastapi_names))}"
                )

            if "fastapi.security" in required_imports:
                security_names = [
                    name
                    for name in undefined_names
                    if name
                    in {
                        "HTTPBearer",
                        "HTTPAuthorizationCredentials",
                        "OAuth2PasswordBearer",
                    }
                ]
                if security_names:
                    import_statements.append(
                        "from fastapi.security import "
                        f"{', '.join(sorted(security_names))}"
                    )

            if "pydantic" in required_imports:
                pydantic_names = [
                    name
                    for name in undefined_names
                    if name in {
                        "BaseModel", "Field", "EmailStr",
                        "validator", "root_validator"
                    }
                ]
                if pydantic_names:
                    pydantic_import = ', '.join(sorted(pydantic_names))
                    import_statements.append(
                        f"from pydantic import {pydantic_import}"
                    )

            if "typing" in required_imports:
                typing_names = [
                    name
                    for name in undefined_names
                    if name in {
                        "Dict", "Any", "List", "Optional", "Union", "Tuple"
                    }
                ]
                if typing_names:
                    typing_import = ', '.join(sorted(typing_names))
                    import_statements.append(
                        f"from typing import {typing_import}"
                    )

            if "datetime" in required_imports:
                datetime_names = [
                    name
                    for name in undefined_names
                    if name in {"datetime", "timedelta"}
                ]
                if datetime_names:
                    datetime_import = ', '.join(sorted(datetime_names))
                    import_statements.append(
                        f"from datetime import {datetime_import}"
                    )

            if "sqlalchemy" in required_imports:
                sqlalchemy_names = [
                    name
                    for name in undefined_names
                    if name in {
                        "Session", "joinedload", "select", "and_", "or_"
                    }
                ]
                if sqlalchemy_names:
                    import_statements.append(
                        "from sqlalchemy import "
                        f"{', '.join(sorted(sqlalchemy_names))}"
                    )

        # Find the last import line
        lines = content.split("\n")
        last_import_idx = -1

        for i, line in enumerate(lines):
            if line.startswith("import ") or line.startswith("from "):
                last_import_idx = i
            elif (line.strip() and not line.startswith("#") and
                  last_import_idx != -1):
                break

        # Insert new imports after the last import
        if last_import_idx != -1 and import_statements:
            # Add a blank line before new imports if needed
            if lines[last_import_idx + 1].strip():
                lines.insert(last_import_idx + 1, "")
                last_import_idx += 1

            # Insert new imports
            for i, import_stmt in enumerate(import_statements):
                lines.insert(last_import_idx + 1 + i, import_stmt)

            # Write back to file
            with open(file_path, "w", encoding="utf-8") as f:
                f.write("\n".join(lines))

            print(f"✅ Added imports to {file_path}")

    except Exception as e:
        print(f"❌ Error processing {file_path}: {e}")


def main():
    """Main function to fix missing imports."""
    backend_dir = Path(__file__).parent.parent / "backend"

    print("🔧 Fixing missing imports in backend API files")
    print("=" * 50)

    # Run flake8 to get current errors
    import subprocess

    try:
        result = subprocess.run(
            ["python", "-m", "flake8", "--config", ".flake8", "app/"],
            cwd=backend_dir,
            capture_output=True,
            text=True,
        )

        if result.returncode == 0:
            print("✅ No linting errors found!")
            return

        # Parse flake8 output
        missing_imports = get_missing_imports_from_flake8_output(result.stdout)

        if not missing_imports:
            print("✅ No undefined name errors found!")
            return

        # Fix imports for each file
        for file_path, undefined_names in missing_imports.items():
            # Convert relative path to absolute path
            abs_file_path = backend_dir / file_path
            if abs_file_path.exists() and (
                "api" in str(abs_file_path) or "API" in str(abs_file_path)
            ):
                add_imports_to_file(str(abs_file_path), undefined_names)

        print("\n✅ Import fixes completed!")
        print("Run flake8 again to check remaining issues.")

    except Exception as e:
        print(f"❌ Error running flake8: {e}")


if __name__ == "__main__":
    main()
