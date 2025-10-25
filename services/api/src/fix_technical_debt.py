#!/usr/bin/env python3
"""
Comprehensive Technical Debt Resolution Script
Automatically fixes linting, formatting, and type issues.
"""

import os
import subprocess
from pathlib import Path


def run_command(cmd, description):
    """Run a command and report results."""
    print(f"\n🔧 {description}")
    try:
        result = subprocess.run(
            cmd, shell=True, capture_output=True, text=True
        )
        if result.returncode == 0:
            print(f"✅ {description} - SUCCESS")
            if result.stdout:
                print(f"Output: {result.stdout[:200]}...")
        else:
            print(f"❌ {description} - FAILED")
            print(f"Error: {result.stderr[:200]}...")
        return result.returncode == 0
    except Exception as e:
        print(f"❌ {description} - EXCEPTION: {e}")
        return False


def main():
    """Main function to run all fixes."""
    backend_dir = Path(__file__).parent
    os.chdir(backend_dir)

    print("🚀 Starting Comprehensive Technical Debt Resolution")
    print(f"📁 Working directory: {backend_dir}")

    fixes = [
        # Fix whitespace issues
        (
            "python -m autopep8 --in-place --select=W293 app/",
            "Fix whitespace issues",
        ),
        # Fix line length issues (but respect our 88 char limit)
        (
            "python -m autopep8 --in-place --select=E501 "
            "--max-line-length=88 app/",
            "Fix line length issues",
        ),
        # Format code with black
        ("python -m black app/ --line-length=88", "Format code with Black"),
        # Sort imports
        ("python -m isort app/", "Sort imports with isort"),
        # Run flake8 check with proper config
        (
            "python -m flake8 app/ --max-line-length=88 "
            "--extend-ignore=E203,W503",
            "Run flake8 validation",
        ),
        # Type check with mypy (basic)
        (
            "python -m mypy app/main.py --ignore-missing-imports",
            "Basic type checking",
        ),
    ]

    success_count = 0
    for cmd, desc in fixes:
        if run_command(cmd, desc):
            success_count += 1

    print(
        f"\n📊 Results: {success_count}/{len(fixes)} "
        f"fixes completed successfully"
    )

    if success_count == len(fixes):
        print("🎉 All technical debt fixes completed successfully!")
    else:
        print("⚠️  Some fixes failed. Manual intervention may be required.")

    # Final validation
    print("\n🔍 Running final validation...")
    run_command("python -m flake8 app/ --statistics", "Final flake8 check")


if __name__ == "__main__":
    main()
