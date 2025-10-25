#!/usr/bin/env python3
"""
Comprehensive linting fix script for Auterity platform.

This script ensures all Python files are properly formatted and
follow the project's linting standards.
"""

import subprocess
import sys
from pathlib import Path
from typing import Optional


def run_command(cmd: list, cwd: Optional[Path] = None) -> bool:
    """Run a command and return success status."""
    try:
        subprocess.run(cmd, cwd=cwd, capture_output=True, text=True, check=True)
        print(f"✅ {' '.join(cmd)}")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ {' '.join(cmd)}: {e.stderr}")
        return False


def main():
    """Main function to fix all linting issues."""
    backend_dir = Path(__file__).parent.parent / "backend"

    print("🔧 Auterity Linting Fix Script")
    print("=" * 40)

    # 1. Format Python files with Black
    print("\n1. Formatting Python files with Black...")
    run_command(
        [sys.executable, "-m", "black", "--line-length", "88", "app/"], cwd=backend_dir
    )

    # 2. Sort imports with isort
    print("\n2. Sorting imports with isort...")
    run_command(
        [sys.executable, "-m", "isort", "--profile", "black", "app/"], cwd=backend_dir
    )

    # 3. Run flake8 to check for remaining issues
    print("\n3. Checking with flake8...")
    success = run_command(
        [sys.executable, "-m", "flake8", "--config", ".flake8", "app/"], cwd=backend_dir
    )

    if success:
        print("\n✅ All linting issues have been resolved!")
    else:
        print("\n⚠️  Some issues may still exist. Check the output above.")

    print("\nTo prevent future issues:")
    print("1. Ensure VS Code is using the project's .flake8 configuration")
    print("2. Run this script before committing changes")
    print("3. Enable format-on-save in VS Code")


if __name__ == "__main__":
    main()
