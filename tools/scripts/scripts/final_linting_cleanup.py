#!/usr/bin/env python3
"""Final comprehensive linting cleanup script."""

import os
import re
import subprocess
import sys
from pathlib import Path
from typing import List


def run_command(cmd: List[str], cwd: str = None) -> tuple:
    """Run a command and return output, error, and return code."""
    try:
        result = subprocess.run(
            cmd, capture_output=True, text=True, cwd=cwd or os.getcwd()
        )
        return result.stdout, result.stderr, result.returncode
    except Exception as e:
        return "", str(e), 1


def fix_import_errors():
    """Fix all F821 undefined name errors by adding missing imports."""
    print("🔧 Fixing import errors...")

    # Define import mappings for common undefined names
    import_fixes = {
        "User": "from app.models.user import User",
        "Role": "from app.models.user import Role",
        "Permission": "from app.models.user import Permission",
        "Agent": "from app.schemas.agent import Agent",
        "AgentCreate": "from app.schemas.agent import AgentCreate",
        "AgentConfig": "from app.schemas.agent import AgentConfig",
        "AutonomousAgentService": "from app.services.autonomous_agent_service import AutonomousAgentService",
        "Template": "from app.models.template import Template",
        "TemplateParameter": "from app.models.template import TemplateParameter",
        "WorkflowExecution": "from app.models.workflow import WorkflowExecution",
        "PineconeDocumentStore": "from app.services.vector.pinecone_store import PineconeDocumentStore",
        "get_db_session": "from app.database import get_db_session",
        "check_database_connection": "from app.database import check_database_connection",
        "create_tables": "from app.database import create_tables",
        "word": "from collections import Counter",
    }

    # Get all F821 errors
    stdout, _, _ = run_command(
        [
            sys.executable,
            "-m",
            "flake8",
            "backend/",
            "scripts/",
            "--select=F821",
            "--config",
            "backend/.flake8",
        ]
    )

    file_fixes = {}
    for line in stdout.split("\n"):
        if "F821" in line and "undefined name" in line:
            # Parse: path:line:col: F821 undefined name 'VariableName'
            match = re.search(r"(.+?):(\d+):\d+: F821 undefined name '(\w+)'", line)
            if match:
                filepath, line_num, var_name = match.groups()
                if var_name in import_fixes:
                    if filepath not in file_fixes:
                        file_fixes[filepath] = set()
                    file_fixes[filepath].add(import_fixes[var_name])

    # Apply fixes
    for filepath, imports in file_fixes.items():
        try:
            with open(filepath, "r", encoding="utf-8") as f:
                content = f.read()

            # Find existing imports section
            lines = content.split("\n")
            import_end_idx = 0

            for i, line in enumerate(lines):
                if (
                    line.strip().startswith(("import ", "from "))
                    or line.strip().startswith('"""')
                    or line.strip().startswith("#")
                ):
                    import_end_idx = i
                elif line.strip() and not line.strip().startswith(('"""', "#")):
                    break

            # Add missing imports
            for import_stmt in sorted(imports):
                if import_stmt not in content:
                    lines.insert(import_end_idx + 1, import_stmt)
                    import_end_idx += 1

            # Write back
            with open(filepath, "w", encoding="utf-8") as f:
                f.write("\n".join(lines))

            print(f"✅ Fixed imports in {filepath}")

        except Exception as e:
            print(f"❌ Error fixing {filepath}: {e}")


def fix_unused_variables():
    """Fix F841 unused variable errors."""
    print("🔧 Fixing unused variables...")

    stdout, _, _ = run_command(
        [
            sys.executable,
            "-m",
            "flake8",
            "backend/",
            "scripts/",
            "--select=F841",
            "--config",
            "backend/.flake8",
        ]
    )

    for line in stdout.split("\n"):
        if "F841" in line and "assigned to but never used" in line:
            # Parse: path:line:col: F841 local variable 'var' is assigned to but never used
            match = re.search(r"(.+?):(\d+):\d+: F841 .* '(\w+)' .* never used", line)
            if match:
                filepath, line_num, var_name = match.groups()
                try:
                    with open(filepath, "r", encoding="utf-8") as f:
                        lines = f.readlines()

                    line_idx = int(line_num) - 1
                    if line_idx < len(lines):
                        original_line = lines[line_idx]
                        # Replace assignment with underscore
                        if f"{var_name} =" in original_line:
                            lines[line_idx] = original_line.replace(
                                f"{var_name} =", "_ ="
                            )
                        elif f"{var_name}," in original_line:
                            lines[line_idx] = original_line.replace(
                                f"{var_name},", "_,"
                            )

                    with open(filepath, "w", encoding="utf-8") as f:
                        f.writelines(lines)

                    print(f"✅ Fixed unused variable in {filepath}:{line_num}")

                except Exception as e:
                    print(f"❌ Error fixing {filepath}: {e}")


def fix_import_order():
    """Fix E402 import order errors."""
    print("🔧 Fixing import order...")

    stdout, _, _ = run_command(
        [
            sys.executable,
            "-m",
            "flake8",
            "backend/",
            "scripts/",
            "--select=E402",
            "--config",
            "backend/.flake8",
        ]
    )

    files_with_import_issues = set()
    for line in stdout.split("\n"):
        if "E402" in line:
            match = re.search(r"(.+?):\d+:\d+:", line)
            if match:
                files_with_import_issues.add(match.group(1))

    for filepath in files_with_import_issues:
        try:
            with open(filepath, "r", encoding="utf-8") as f:
                content = f.read()

            lines = content.split("\n")

            # Separate docstring, imports, and code
            docstring_lines = []
            import_lines = []
            code_lines = []

            in_docstring = False
            docstring_done = False

            for line in lines:
                stripped = line.strip()

                # Handle docstring
                if not docstring_done and ('"""' in line or "'''" in line):
                    if not in_docstring:
                        in_docstring = True
                        docstring_lines.append(line)
                        if line.count('"""') == 2 or line.count("'''") == 2:
                            in_docstring = False
                            docstring_done = True
                    else:
                        docstring_lines.append(line)
                        in_docstring = False
                        docstring_done = True
                elif in_docstring:
                    docstring_lines.append(line)
                # Handle imports
                elif not docstring_done and not stripped:
                    docstring_lines.append(line)
                elif stripped.startswith(("import ", "from ")) and docstring_done:
                    import_lines.append(line)
                elif stripped.startswith("#") and not code_lines:
                    import_lines.append(line)
                # Everything else is code
                else:
                    if not docstring_done:
                        docstring_done = True
                    code_lines.append(line)

            # Reconstruct file with proper order
            new_content = []
            new_content.extend(docstring_lines)
            if docstring_lines and import_lines:
                new_content.append("")
            new_content.extend(import_lines)
            if import_lines and code_lines:
                new_content.append("")
            new_content.extend(code_lines)

            with open(filepath, "w", encoding="utf-8") as f:
                f.write("\n".join(new_content))

            print(f"✅ Fixed import order in {filepath}")

        except Exception as e:
            print(f"❌ Error fixing {filepath}: {e}")


def fix_f_string_issues():
    """Fix F541 f-string placeholder issues."""
    print("🔧 Fixing f-string issues...")

    stdout, _, _ = run_command(
        [
            sys.executable,
            "-m",
            "flake8",
            "backend/",
            "scripts/",
            "--select=F541",
            "--config",
            "backend/.flake8",
        ]
    )

    for line in stdout.split("\n"):
        if "F541" in line and "f-string is missing placeholders" in line:
            match = re.search(r"(.+?):(\d+):\d+:", line)
            if match:
                filepath, line_num = match.groups()
                try:
                    with open(filepath, "r", encoding="utf-8") as f:
                        lines = f.readlines()

                    line_idx = int(line_num) - 1
                    if line_idx < len(lines):
                        original_line = lines[line_idx]
                        # Convert f-string to regular string if no placeholders
                        if 'f"' in original_line and "{" not in original_line:
                            lines[line_idx] = original_line.replace('f"', '"')
                        elif "f'" in original_line and "{" not in original_line:
                            lines[line_idx] = original_line.replace("f'", "'")

                    with open(filepath, "w", encoding="utf-8") as f:
                        f.writelines(lines)

                    print(f"✅ Fixed f-string in {filepath}:{line_num}")

                except Exception as e:
                    print(f"❌ Error fixing {filepath}: {e}")


def fix_redefinition_errors():
    """Fix F811 redefinition errors."""
    print("🔧 Fixing redefinition errors...")

    stdout, _, _ = run_command(
        [
            sys.executable,
            "-m",
            "flake8",
            "backend/",
            "scripts/",
            "--select=F811",
            "--config",
            "backend/.flake8",
        ]
    )

    for line in stdout.split("\n"):
        if "F811" in line and "redefinition" in line:
            match = re.search(
                r"(.+?):(\d+):\d+: F811 redefinition of unused '(\w+)'", line
            )
            if match:
                filepath, line_num, var_name = match.groups()
                try:
                    with open(filepath, "r", encoding="utf-8") as f:
                        content = f.read()

                    lines = content.split("\n")
                    line_idx = int(line_num) - 1

                    if line_idx < len(lines):
                        # Comment out the redefinition
                        lines[line_idx] = f"# {lines[line_idx]}"

                    with open(filepath, "w", encoding="utf-8") as f:
                        f.write("\n".join(lines))

                    print(f"✅ Fixed redefinition in {filepath}:{line_num}")

                except Exception as e:
                    print(f"❌ Error fixing {filepath}: {e}")


def apply_black_formatting():
    """Apply Black formatting to clean up whitespace issues."""
    print("🔧 Applying Black formatting...")

    stdout, stderr, code = run_command(
        [
            sys.executable,
            "-m",
            "black",
            "backend/",
            "scripts/",
            "--line-length",
            "88",
            "--quiet",
        ]
    )

    if code == 0:
        print("✅ Black formatting applied successfully")
    else:
        print(f"⚠️ Black formatting issues: {stderr}")


def main():
    """Run all linting fixes."""
    print("🚀 Starting final linting cleanup...")

    # Change to project root
    os.chdir(Path(__file__).parent.parent)

    # Apply fixes in order
    fix_import_errors()
    fix_unused_variables()
    fix_import_order()
    fix_f_string_issues()
    fix_redefinition_errors()
    apply_black_formatting()

    # Final check
    print("\n📊 Running final linting check...")
    stdout, stderr, code = run_command(
        [
            sys.executable,
            "-m",
            "flake8",
            "backend/",
            "scripts/",
            "--config",
            "backend/.flake8",
            "--count",
        ]
    )

    if code == 0:
        print("🎉 All linting issues resolved!")
    else:
        error_count = len(
            [line for line in stdout.split("\n") if line.strip() and not line.isdigit()]
        )
        print(f"📊 Remaining issues: {error_count}")
        if error_count < 50:  # Show details if manageable
            print(stdout)

    print("✅ Final linting cleanup completed!")


if __name__ == "__main__":
    main()
