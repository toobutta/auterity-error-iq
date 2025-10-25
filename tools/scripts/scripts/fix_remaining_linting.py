#!/usr/bin/env python3
"""
Fix all remaining linting issues in auterity-error-iq project.

This script systematically resolves:
1. F821 undefined name errors (missing imports)
2. E712 boolean comparison issues
3. F841 unused variables
4. E722 bare except clauses
5. F541 f-string placeholder issues
6. E402 import order issues
"""

import subprocess
import re
from pathlib import Path
from typing import List


def run_command(cmd: List[str], cwd: str = None) -> subprocess.CompletedProcess:
    """Run a command and return the result."""
    try:
        result = subprocess.run(
            cmd, capture_output=True, text=True, cwd=cwd, check=False
        )
        return result
    except Exception as e:
        print(f"❌ Error running command {' '.join(cmd)}: {e}")
        return None


def fix_missing_imports():
    """Fix F821 undefined name errors by adding missing imports."""
    print("🔧 Fixing missing imports (F821 errors)...")

    # Common imports mapping
    import_mappings = {
        # FastAPI imports
        "APIRouter": "from fastapi import APIRouter",
        "Depends": "from fastapi import Depends",
        "HTTPException": "from fastapi import HTTPException",
        "status": "from fastapi import status",
        "BackgroundTasks": "from fastapi import BackgroundTasks",
        "Request": "from fastapi import Request",
        "Response": "from fastapi import Response",
        "Query": "from fastapi import Query",
        "File": "from fastapi import File",
        "UploadFile": "from fastapi import UploadFile",
        "Form": "from fastapi import Form",
        # FastAPI Security
        "HTTPBearer": "from fastapi.security import HTTPBearer",
        "HTTPAuthorizationCredentials": "from fastapi.security import HTTPAuthorizationCredentials",
        "OAuth2PasswordBearer": "from fastapi.security import OAuth2PasswordBearer",
        # Pydantic
        "BaseModel": "from pydantic import BaseModel",
        "Field": "from pydantic import Field",
        "EmailStr": "from pydantic import EmailStr",
        "validator": "from pydantic import validator",
        "root_validator": "from pydantic import root_validator",
        # Typing
        "Dict": "from typing import Dict",
        "Any": "from typing import Any",
        "List": "from typing import List",
        "Optional": "from typing import Optional",
        "Union": "from typing import Union",
        "Tuple": "from typing import Tuple",
        "Annotated": "from typing import Annotated",
        # DateTime
        "datetime": "from datetime import datetime",
        "timedelta": "from datetime import timedelta",
        # SQLAlchemy
        "Session": "from sqlalchemy.orm import Session",
        "joinedload": "from sqlalchemy.orm import joinedload",
        "select": "from sqlalchemy import select",
        "and_": "from sqlalchemy import and_",
        "or_": "from sqlalchemy import or_",
        # Collections
        "Counter": "from collections import Counter",
    }

    # Get current F821 errors
    backend_dir = Path(__file__).parent.parent / "backend"
    result = run_command(
        ["python", "-m", "flake8", ".", "--select=F821", "--config", ".flake8"],
        cwd=str(backend_dir),
    )

    if not result or result.returncode == 0:
        print("  ✅ No F821 errors found")
        return

    # Parse errors by file
    file_errors = {}
    for line in result.stdout.split("\n"):
        if "F821" in line:
            match = re.match(r"(.+?):\d+:\d+: F821 undefined name '(\w+)'", line)
            if match:
                file_path = match.group(1)
                undefined_name = match.group(2)

                if file_path not in file_errors:
                    file_errors[file_path] = set()
                file_errors[file_path].add(undefined_name)

    # Fix imports for each file
    for rel_path, undefined_names in file_errors.items():
        file_path = backend_dir / rel_path
        if not file_path.exists():
            continue

        try:
            with open(file_path, "r", encoding="utf-8") as f:
                content = f.read()

            # Find required imports
            needed_imports = []
            for name in undefined_names:
                if name in import_mappings:
                    import_stmt = import_mappings[name]
                    if import_stmt not in content and import_stmt not in needed_imports:
                        needed_imports.append(import_stmt)

            if needed_imports:
                lines = content.split("\n")

                # Find last import line
                last_import_idx = -1
                for i, line in enumerate(lines):
                    if line.startswith(
                        ("import ", "from ")
                    ) and not line.strip().startswith("#"):
                        last_import_idx = i

                # Insert imports
                if last_import_idx >= 0:
                    # Add blank line if needed
                    if (
                        last_import_idx + 1 < len(lines)
                        and lines[last_import_idx + 1].strip()
                    ):
                        lines.insert(last_import_idx + 1, "")
                        last_import_idx += 1

                    # Insert new imports
                    for i, import_stmt in enumerate(needed_imports):
                        lines.insert(last_import_idx + 1 + i, import_stmt)
                else:
                    # No imports found, add at top after docstring/comments
                    insert_idx = 0
                    for i, line in enumerate(lines):
                        if (
                            line.strip()
                            and not line.startswith("#")
                            and '"""' not in line
                            and "'''" not in line
                        ):
                            insert_idx = i
                            break

                    for import_stmt in needed_imports:
                        lines.insert(insert_idx, import_stmt)
                        insert_idx += 1
                    lines.insert(insert_idx, "")

                # Write back
                with open(file_path, "w", encoding="utf-8") as f:
                    f.write("\n".join(lines))

                print(f"  ✅ Added {len(needed_imports)} imports to {rel_path}")

        except Exception as e:
            print(f"  ❌ Error fixing {rel_path}: {e}")


def fix_boolean_comparisons():
    """Fix E712 boolean comparison issues."""
    print("🔧 Fixing boolean comparisons (E712 errors)...")

    backend_dir = Path(__file__).parent.parent / "backend"
    result = run_command(
        ["python", "-m", "flake8", ".", "--select=E712", "--config", ".flake8"],
        cwd=str(backend_dir),
    )

    if not result or result.returncode == 0:
        print("  ✅ No E712 errors found")
        return

    # Parse files with E712 errors
    files_to_fix = set()
    for line in result.stdout.split("\n"):
        if "E712" in line:
            match = re.match(r"(.+?):\d+:\d+:", line)
            if match:
                files_to_fix.add(match.group(1))

    for rel_path in files_to_fix:
        file_path = backend_dir / rel_path
        if not file_path.exists():
            continue

        try:
            with open(file_path, "r", encoding="utf-8") as f:
                content = f.read()

            # Fix boolean comparisons
            original_content = content
            content = re.sub(r"== True\b", "", content)
            content = re.sub(r"!= True\b", " is not True", content)
            content = re.sub(r"== False\b", " is False", content)
            content = re.sub(r"!= False\b", " is not False", content)

            if content != original_content:
                with open(file_path, "w", encoding="utf-8") as f:
                    f.write(content)
                print(f"  ✅ Fixed boolean comparisons in {rel_path}")

        except Exception as e:
            print(f"  ❌ Error fixing {rel_path}: {e}")


def fix_unused_variables():
    """Fix F841 unused variable issues."""
    print("🔧 Fixing unused variables (F841 errors)...")

    backend_dir = Path(__file__).parent.parent / "backend"
    result = run_command(
        ["python", "-m", "flake8", ".", "--select=F841", "--config", ".flake8"],
        cwd=str(backend_dir),
    )

    if not result or result.returncode == 0:
        print("  ✅ No F841 errors found")
        return

    # Parse errors
    file_errors = {}
    for line in result.stdout.split("\n"):
        if "F841" in line:
            match = re.match(
                r"(.+?):(\d+):\d+: F841 local variable '(\w+)' is assigned to but never used",
                line,
            )
            if match:
                file_path = match.group(1)
                line_num = int(match.group(2))
                var_name = match.group(3)

                if file_path not in file_errors:
                    file_errors[file_path] = []
                file_errors[file_path].append((line_num, var_name))

    for rel_path, errors in file_errors.items():
        file_path = backend_dir / rel_path
        if not file_path.exists():
            continue

        try:
            with open(file_path, "r", encoding="utf-8") as f:
                lines = f.readlines()

            # Fix unused variables by prefixing with _
            fixed_count = 0
            for line_num, var_name in errors:
                if line_num <= len(lines):
                    line = lines[line_num - 1]
                    # Replace variable assignment
                    if f"{var_name} =" in line and f"_{var_name}" not in line:
                        lines[line_num - 1] = line.replace(
                            f"{var_name} =", f"_{var_name} ="
                        )
                        fixed_count += 1

            if fixed_count > 0:
                with open(file_path, "w", encoding="utf-8") as f:
                    f.writelines(lines)
                print(f"  ✅ Fixed {fixed_count} unused variables in {rel_path}")

        except Exception as e:
            print(f"  ❌ Error fixing {rel_path}: {e}")


def fix_bare_except():
    """Fix E722 bare except issues."""
    print("🔧 Fixing bare except clauses (E722 errors)...")

    backend_dir = Path(__file__).parent.parent / "backend"
    result = run_command(
        ["python", "-m", "flake8", ".", "--select=E722", "--config", ".flake8"],
        cwd=str(backend_dir),
    )

    if not result or result.returncode == 0:
        print("  ✅ No E722 errors found")
        return

    # Parse files with E722 errors
    file_errors = {}
    for line in result.stdout.split("\n"):
        if "E722" in line:
            match = re.match(r"(.+?):(\d+):\d+:", line)
            if match:
                file_path = match.group(1)
                line_num = int(match.group(2))

                if file_path not in file_errors:
                    file_errors[file_path] = []
                file_errors[file_path].append(line_num)

    for rel_path, line_nums in file_errors.items():
        file_path = backend_dir / rel_path
        if not file_path.exists():
            continue

        try:
            with open(file_path, "r", encoding="utf-8") as f:
                lines = f.readlines()

            # Fix bare except
            fixed_count = 0
            for line_num in line_nums:
                if line_num <= len(lines):
                    line = lines[line_num - 1]
                    if "except:" in line:
                        lines[line_num - 1] = line.replace(
                            "except:", "except Exception:"
                        )
                        fixed_count += 1

            if fixed_count > 0:
                with open(file_path, "w", encoding="utf-8") as f:
                    f.writelines(lines)
                print(f"  ✅ Fixed {fixed_count} bare except clauses in {rel_path}")

        except Exception as e:
            print(f"  ❌ Error fixing {rel_path}: {e}")


def fix_f_string_placeholders():
    """Fix F541 f-string placeholder issues."""
    print("🔧 Fixing f-string placeholders (F541 errors)...")

    backend_dir = Path(__file__).parent.parent / "backend"
    result = run_command(
        ["python", "-m", "flake8", ".", "--select=F541", "--config", ".flake8"],
        cwd=str(backend_dir),
    )

    if not result or result.returncode == 0:
        print("  ✅ No F541 errors found")
        return

    # Parse files with F541 errors
    file_errors = {}
    for line in result.stdout.split("\n"):
        if "F541" in line:
            match = re.match(r"(.+?):(\d+):\d+:", line)
            if match:
                file_path = match.group(1)
                line_num = int(match.group(2))

                if file_path not in file_errors:
                    file_errors[file_path] = []
                file_errors[file_path].append(line_num)

    for rel_path, line_nums in file_errors.items():
        file_path = backend_dir / rel_path
        if not file_path.exists():
            continue

        try:
            with open(file_path, "r", encoding="utf-8") as f:
                lines = f.readlines()

            # Fix f-strings without placeholders
            fixed_count = 0
            for line_num in line_nums:
                if line_num <= len(lines):
                    line = lines[line_num - 1]
                    # Convert f"string" to "string" if no placeholders
                    if line.count('f"') > 0 and "{" not in line:
                        lines[line_num - 1] = line.replace('f"', '"')
                        fixed_count += 1
                    elif line.count("f'") > 0 and "{" not in line:
                        lines[line_num - 1] = line.replace("f'", "'")
                        fixed_count += 1

            if fixed_count > 0:
                with open(file_path, "w", encoding="utf-8") as f:
                    f.writelines(lines)
                print(f"  ✅ Fixed {fixed_count} f-string issues in {rel_path}")

        except Exception as e:
            print(f"  ❌ Error fixing {rel_path}: {e}")


def final_cleanup():
    """Run final cleanup passes."""
    print("🧹 Running final cleanup...")

    backend_dir = Path(__file__).parent.parent / "backend"

    # Remove unused imports again
    _ = run_command(
        [
            "python",
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

    # Sort imports
    run_command(
        ["python", "-m", "isort", ".", "--profile", "black"], cwd=str(backend_dir)
    )

    # Format with Black
    run_command(
        ["python", "-m", "black", ".", "--line-length", "88"], cwd=str(backend_dir)
    )

    print("  ✅ Final cleanup completed")


def check_final_status():
    """Check final linting status."""
    print("📊 Checking final status...")

    backend_dir = Path(__file__).parent.parent / "backend"
    result = run_command(
        [
            "python",
            "-m",
            "flake8",
            ".",
            "--count",
            "--statistics",
            "--config",
            ".flake8",
        ],
        cwd=str(backend_dir),
    )

    if result:
        if result.returncode == 0:
            print("🎉 SUCCESS: All linting issues resolved!")
            return True
        else:
            print(f"📈 Remaining issues: {result.stdout}")
            return False
    return False


def main():
    """Main execution function."""
    print("🚀 Comprehensive Linting Fix - Final Resolution")
    print("=" * 60)

    # Fix different types of issues
    fix_missing_imports()
    fix_boolean_comparisons()
    fix_unused_variables()
    fix_bare_except()
    fix_f_string_placeholders()

    # Final cleanup
    final_cleanup()

    # Check status
    success = check_final_status()

    print("\n" + "=" * 60)
    if success:
        print("✅ ALL LINTING ISSUES RESOLVED!")
        print("🎯 Ready to commit clean code")
    else:
        print("⚠️  Some issues may remain - check output above")
        print("💡 Manual review may be needed for complex cases")


if __name__ == "__main__":
    main()
