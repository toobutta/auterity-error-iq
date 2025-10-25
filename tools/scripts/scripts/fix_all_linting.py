#!/usr/bin/env python3
"""
Comprehensive linting fix script for auterity-error-iq project.

This script systematically resolves all flake8 issues using existing tools
and configuration to maintain code quality while minimizing disruption.
"""

import subprocess
import sys
from pathlib import Path
from typing import List, Optional


def run_command(
    cmd: List[str], cwd: Optional[str] = None
) -> Optional[subprocess.CompletedProcess]:
    """Run a command and return the result."""
    try:
        result = subprocess.run(
            cmd, capture_output=True, text=True, cwd=cwd, check=False
        )
        return result
    except Exception as e:
        print(f"❌ Error running command {' '.join(cmd)}: {e}")
        return None


def fix_backend_linting():
    """Fix backend Python linting issues."""
    backend_dir = Path(__file__).parent.parent / "backend"

    print("🔧 Phase 1: Automated fixes for backend...")

    # Step 1: Remove unused imports and variables
    print("  📦 Removing unused imports and variables...")
    result = run_command(
        [
            sys.executable,
            "-m",
            "autoflake",
            "--remove-all-unused-imports",
            "--remove-unused-variables",
            "--in-place",
            "--recursive",
            ".",
        ],
        cwd=str(backend_dir),
    )

    if result and result.returncode == 0:
        print("  ✅ Autoflake completed successfully")
    else:
        print("  ⚠️  Autoflake had issues, continuing...")

    # Step 2: Sort imports
    print("  📋 Sorting imports...")
    result = run_command(
        [sys.executable, "-m", "isort", ".", "--profile", "black"],
        cwd=str(backend_dir)
    )

    if result and result.returncode == 0:
        print("  ✅ Import sorting completed")
    else:
        print("  ⚠️  Import sorting had issues, continuing...")

    # Step 3: Format code with Black
    print("  🎨 Formatting code with Black...")
    result = run_command(
        [sys.executable, "-m", "black", ".", "--line-length", "88"],
        cwd=str(backend_dir),
    )

    if result and result.returncode == 0:
        print("  ✅ Black formatting completed")
    else:
        print("  ⚠️  Black formatting had issues, continuing...")


def check_backend_status():
    """Check current backend linting status."""
    backend_dir = Path(__file__).parent.parent / "backend"

    print("📊 Checking backend linting status...")

    # Use the project's flake8 configuration
    result = run_command(
        [sys.executable, "-m", "flake8", ".", "--count", "--statistics"],
        cwd=str(backend_dir),
    )

    if result:
        print("📈 Flake8 Results:")
        print(result.stdout)
        if result.stderr:
            print("⚠️  Stderr:", result.stderr)
        return result.returncode == 0
    return False


def fix_frontend_linting():
    """Fix frontend TypeScript/JavaScript linting issues."""
    frontend_dir = Path(__file__).parent.parent / "frontend"

    print("🔧 Phase 2: Frontend linting fixes...")

    # Step 1: ESLint auto-fix
    print("  🎯 Running ESLint auto-fix...")
    result = run_command(
        ["npm", "run", "lint", "--", "--fix"],
        cwd=str(frontend_dir)
    )

    if result and result.returncode == 0:
        print("  ✅ ESLint auto-fix completed")
    else:
        print("  ⚠️  ESLint had issues, continuing...")

    # Step 2: Prettier formatting
    print("  💅 Running Prettier formatting...")
    result = run_command(["npm", "run", "format"], cwd=str(frontend_dir))

    if result and result.returncode == 0:
        print("  ✅ Prettier formatting completed")
    else:
        print("  ⚠️  Prettier had issues, continuing...")


def install_required_tools():
    """Install required Python tools if missing."""
    tools = ["autoflake", "isort", "black", "flake8"]

    print("🛠️  Checking and installing required tools...")

    for tool in tools:
        try:
            result = run_command([sys.executable, "-m", tool, "--version"])
            if result and result.returncode == 0:
                print(f"  ✅ {tool} is available")
            else:
                raise ImportError(f"{tool} not found")
        except Exception:
            print(f"  📦 Installing {tool}...")
            install_result = run_command(
                [sys.executable, "-m", "pip", "install", tool]
            )
            if install_result and install_result.returncode == 0:
                print(f"  ✅ {tool} installed successfully")
            else:
                print(f"  ❌ Failed to install {tool}")


def main():
    """Main execution function."""
    print("🚀 Auterity Linting Fix - Comprehensive Resolution")
    print("=" * 60)

    # Install required tools
    install_required_tools()

    # Fix backend issues
    fix_backend_linting()

    # Check backend status
    backend_clean = check_backend_status()

    # Fix frontend issues
    fix_frontend_linting()

    # Final summary
    print("\n" + "=" * 60)
    print("📋 FINAL SUMMARY")
    print("=" * 60)

    if backend_clean:
        print("✅ Backend: All linting issues resolved!")
    else:
        print("⚠️  Backend: Some issues may remain (check output above)")

    print("✅ Frontend: Automated fixes applied")

    print("\n🎯 NEXT STEPS:")
    print("1. Review changes with: git diff")
    print("2. Test functionality: npm run test")
    print(
        "3. Commit clean code: git add . && "
        "git commit -m 'fix: resolve linting issues'"
    )

    print("\n💡 To maintain quality going forward:")
    print("- Use: npm run lint:fix (for ongoing fixes)")
    print("- Enable: pre-commit hooks")
    print("- Consider: VS Code format-on-save")


if __name__ == "__main__":
    main()
