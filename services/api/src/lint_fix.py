#!/usr/bin/env python3
"""
Script to automatically fix common linting issues in the backend code.

This script:
1. Removes unused imports (F401 violations)
2. Fixes whitespace issues (W291, W293 violations)
3. Adds newlines at end of files (W292 violations)
4. Organizes imports using isort
5. Formats code using black

Usage:
    python lint_fix.py
"""

import os
import re
import subprocess
import sys
from pathlib import Path


def install_dependencies():
    """Install required dependencies if not already installed."""
    try:
        subprocess.run(
            [
                sys.executable,
                "-m",
                "pip",
                "install",
                "black",
                "isort",
                "flake8",
            ],
            check=True,
            capture_output=True,
        )
        print("✅ Dependencies installed successfully")
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to install dependencies: {e}")
        sys.exit(1)


def fix_unused_imports(file_path):
    """Remove unused imports from a Python file."""
    with open(file_path, "r") as f:
        content = f.read()

    # Find all import statements
    import_pattern = r"^from\s+[\w.]+\s+import\s+.*$|^import\s+.*$"
    imports = re.findall(import_pattern, content, re.MULTILINE)

    # Check each import for F401 violations
    for imp in imports:
        # Check if this import is used elsewhere in the file
        # This is a simplified check and might not catch all cases
        module_name = imp.split("import")[1].strip().split(" as ")[0].strip()
        if module_name and module_name not in content.replace(imp, ""):
            # Remove the import line
            content = content.replace(imp + "\n", "")

    with open(file_path, "w") as f:
        f.write(content)


def fix_whitespace_issues(file_path):
    """Fix whitespace issues in a Python file."""
    with open(file_path, "r") as f:
        lines = f.readlines()

    # Fix trailing whitespace (W291)
    lines = [line.rstrip() + "\n" for line in lines]

    # Fix blank lines with whitespace (W293)
    for i in range(len(lines)):
        if lines[i].strip() == "":
            lines[i] = "\n"

    # Ensure file ends with a newline (W292)
    if lines and not lines[-1].endswith("\n"):
        lines[-1] += "\n"

    with open(file_path, "w") as f:
        f.writelines(lines)


def run_isort(directory):
    """Run isort to organize imports."""
    try:
        subprocess.run(
            [sys.executable, "-m", "isort", directory],
            check=True,
            capture_output=True,
        )
        print(f"✅ isort completed successfully on {directory}")
    except subprocess.CalledProcessError as e:
        print(f"❌ isort failed: {e}")


def run_black(directory):
    """Run black to format code."""
    try:
        subprocess.run(
            [sys.executable, "-m", "black", "--line-length", "88", directory],
            check=True,
            capture_output=True,
        )
        print(f"✅ black completed successfully on {directory}")
    except subprocess.CalledProcessError as e:
        print(f"❌ black failed: {e}")


def run_flake8(directory):
    """Run flake8 to check for remaining issues."""
    try:
        result = subprocess.run(
            [sys.executable, "-m", "flake8", directory, "--count"],
            capture_output=True,
            text=True,
        )
        issue_count = result.stdout.strip().split("\n")[-1]
        print(f"ℹ️ Remaining flake8 issues: {issue_count}")
        return int(issue_count) if issue_count.isdigit() else 0
    except subprocess.CalledProcessError as e:
        print(f"❌ flake8 failed: {e}")
        return -1


def process_python_files(directory):
    """Process all Python files in the directory."""
    python_files = list(Path(directory).rglob("*.py"))
    print(f"Found {len(python_files)} Python files to process")

    for file_path in python_files:
        print(f"Processing {file_path}")
        fix_unused_imports(file_path)
        fix_whitespace_issues(file_path)


def main():
    """Main function to run the linting fixes."""
    # Get the app directory
    app_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "app")

    if not os.path.exists(app_dir):
        print(f"❌ Directory not found: {app_dir}")
        sys.exit(1)

    # Install dependencies
    install_dependencies()

    # Process Python files
    process_python_files(app_dir)

    # Run isort and black
    run_isort(app_dir)
    run_black(app_dir)

    # Check remaining issues
    issues = run_flake8(app_dir)

    if issues == 0:
        print("✅ All linting issues fixed!")
    else:
        print(
            f"⚠️ {issues} linting issues remain. Manual fixes may be required."
        )


if __name__ == "__main__":
    main()
