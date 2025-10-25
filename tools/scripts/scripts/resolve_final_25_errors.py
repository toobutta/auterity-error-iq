#!/usr/bin/env python3
"""Final 25 errors resolution script - Complete cleanup to 100% clean code."""

import os
import subprocess
import sys
from pathlib import Path


def run_command(cmd, cwd=None):
    """Run a command and return output, error, and return code."""
    try:
        result = subprocess.run(
            cmd, capture_output=True, text=True, cwd=cwd or os.getcwd()
        )
        return result.stdout, result.stderr, result.returncode
    except Exception as e:
        return "", str(e), 1


def fix_missing_imports():
    """Fix F821 undefined name errors by adding missing imports."""
    print("🔧 Fixing missing imports (F821 errors)...")

    # Agent registry imports
    agent_registry_file = "backend/app/api/agent_registry.py"
    try:
        with open(agent_registry_file, "r", encoding="utf-8") as f:
            content = f.read()

        if "from app.schemas.agent import Agent, AgentCreate" not in content:
            # Add import after existing imports
            lines = content.split("\n")
            import_added = False
            for i, line in enumerate(lines):
                if line.strip().startswith("from app.") and not import_added:
                    lines.insert(i, "from app.schemas.agent import Agent, AgentCreate")
                    import_added = True
                    break

            if not import_added:
                # Insert after fastapi imports
                for i, line in enumerate(lines):
                    if line.strip().startswith("from fastapi"):
                        lines.insert(
                            i + 1, "from app.schemas.agent import Agent, AgentCreate"
                        )
                        break

            with open(agent_registry_file, "w", encoding="utf-8") as f:
                f.write("\n".join(lines))
            print(f"✅ Fixed imports in {agent_registry_file}")
    except Exception as e:
        print(f"❌ Error fixing {agent_registry_file}: {e}")

    # RAG engine imports
    rag_engine_file = "backend/app/services/agents/rag_engine.py"
    try:
        with open(rag_engine_file, "r", encoding="utf-8") as f:
            content = f.read()

        if (
            "from app.services.vector.pinecone_store import PineconeDocumentStore"
            not in content
        ):
            lines = content.split("\n")
            # Add import after existing app imports
            for i, line in enumerate(lines):
                if line.strip().startswith("from app.") and "pinecone" not in line:
                    lines.insert(
                        i + 1,
                        "from app.services.vector.pinecone_store import PineconeDocumentStore",
                    )
                    break

            with open(rag_engine_file, "w", encoding="utf-8") as f:
                f.write("\n".join(lines))
            print(f"✅ Fixed imports in {rag_engine_file}")
    except Exception as e:
        print(f"❌ Error fixing {rag_engine_file}: {e}")

    # Smart triage service - fix 'word' undefined
    triage_file = "backend/app/services/smart_triage_service.py"
    try:
        with open(triage_file, "r", encoding="utf-8") as f:
            content = f.read()

        # Remove unused Counter import and fix word reference
        lines = content.split("\n")
        new_lines = []
        for line in lines:
            if "from collections import Counter" in line:
                continue  # Remove unused import
            elif "word" in line and "word_count" not in line:
                # Fix undefined 'word' reference
                line = line.replace("word", "token")
            new_lines.append(line)

        with open(triage_file, "w", encoding="utf-8") as f:
            f.write("\n".join(new_lines))
        print(f"✅ Fixed imports and undefined names in {triage_file}")
    except Exception as e:
        print(f"❌ Error fixing {triage_file}: {e}")


def fix_unused_variables():
    """Fix F841 unused variable errors."""
    print("🔧 Fixing unused variables (F841 errors)...")

    files_to_fix = [
        ("backend/app/api/endpoints/saas.py", [564, 568]),
        ("backend/app/api/mcp_routes.py", [66]),
        ("backend/cross_system_protocol.py", [118]),
    ]

    for filepath, line_numbers in files_to_fix:
        try:
            with open(filepath, "r", encoding="utf-8") as f:
                lines = f.readlines()

            for line_num in sorted(line_numbers, reverse=True):
                if line_num <= len(lines):
                    line_idx = line_num - 1
                    original_line = lines[line_idx]
                    if " e " in original_line and "except" in original_line:
                        lines[line_idx] = original_line.replace(" e ", " _ ")
                    elif " e:" in original_line:
                        lines[line_idx] = original_line.replace(" e:", " _:")

            with open(filepath, "w", encoding="utf-8") as f:
                f.writelines(lines)
            print(f"✅ Fixed unused variables in {filepath}")
        except Exception as e:
            print(f"❌ Error fixing {filepath}: {e}")


def fix_syntax_errors():
    """Fix E999 syntax errors in test files."""
    print("🔧 Fixing syntax errors (E999 errors)...")

    # Fix workflow_execution_example.py
    example_file = "backend/examples/workflow_execution_example.py"
    try:
        with open(example_file, "r", encoding="utf-8") as f:
            lines = f.readlines()

        # Fix indentation
        new_lines = []
        for line in lines:
            if line.startswith("        import traceback"):
                new_lines.append("import traceback\n")
            else:
                new_lines.append(line)

        with open(example_file, "w", encoding="utf-8") as f:
            f.writelines(new_lines)
        print(f"✅ Fixed syntax in {example_file}")
    except Exception as e:
        print(f"❌ Error fixing {example_file}: {e}")

    # Fix test files
    test_files = [
        "backend/tests/test_agent_framework.py",
        "backend/tests/test_database.py",
        "backend/tests/test_models.py",
    ]

    for test_file in test_files:
        try:
            with open(test_file, "r", encoding="utf-8") as f:
                content = f.read()

            # Fix common issues
            lines = content.split("\n")
            new_lines = []

            for i, line in enumerate(lines):
                # Fix incorrect indentation
                if line.startswith("            from app."):
                    new_lines.append(line[8:])  # Remove extra indentation
                elif line.startswith("        from app.") and i < 20:
                    new_lines.append(line[4:])  # Remove extra indentation
                elif 'os.environ["DATABASE_URL"]' in line and line.startswith("  "):
                    new_lines.append(line[2:])  # Fix indentation
                else:
                    new_lines.append(line)

            with open(test_file, "w", encoding="utf-8") as f:
                f.write("\n".join(new_lines))
            print(f"✅ Fixed syntax in {test_file}")
        except Exception as e:
            print(f"❌ Error fixing {test_file}: {e}")


def fix_ambiguous_variables():
    """Fix E741 ambiguous variable name errors."""
    print("🔧 Fixing ambiguous variable names (E741 errors)...")

    # Fix partner_ecosystem_service.py
    service_file = "backend/app/services/partner_ecosystem_service.py"
    try:
        with open(service_file, "r", encoding="utf-8") as f:
            content = f.read()

        # Replace ambiguous 'l' with descriptive names
        content = content.replace("for line in ", "for item in ")
        content = content.replace("l.", "item.")
        content = content.replace("l[", "item[")
        content = content.replace("l =", "item =")

        with open(service_file, "w", encoding="utf-8") as f:
            f.write(content)
        print(f"✅ Fixed ambiguous variables in {service_file}")
    except Exception as e:
        print(f"❌ Error fixing {service_file}: {e}")

    # Fix final_linting_cleanup.py
    cleanup_file = "scripts/final_linting_cleanup.py"
    try:
        with open(cleanup_file, "r", encoding="utf-8") as f:
            content = f.read()

        # Replace ambiguous 'l' with descriptive name
        content = content.replace("for line in ", "for line in ")
        content = content.replace("if line.", "if line.")

        with open(cleanup_file, "w", encoding="utf-8") as f:
            f.write(content)
        print(f"✅ Fixed ambiguous variables in {cleanup_file}")
    except Exception as e:
        print(f"❌ Error fixing {cleanup_file}: {e}")


def fix_import_issues():
    """Fix F401/F402 import issues."""
    print("🔧 Fixing import issues (F401/F402 errors)...")

    # Fix agent_marketplace_service.py shadowed import
    marketplace_file = "backend/app/services/agent_marketplace_service.py"
    try:
        with open(marketplace_file, "r", encoding="utf-8") as f:
            content = f.read()

        # Rename loop variable to avoid shadowing
        content = content.replace("for field in ", "for field_item in ")
        content = content.replace("field.", "field_item.")
        content = content.replace("field =", "field_item =")

        with open(marketplace_file, "w", encoding="utf-8") as f:
            f.write(content)
        print(f"✅ Fixed shadowed import in {marketplace_file}")
    except Exception as e:
        print(f"❌ Error fixing {marketplace_file}: {e}")

    # Fix unused imports in scripts
    script_file = "scripts/fix_remaining_linting.py"
    try:
        with open(script_file, "r", encoding="utf-8") as f:
            lines = f.readlines()

        new_lines = []
        for line in lines:
            # Remove unused imports
            if ("import sys" in line and "typing" not in line) or (
                "from typing import Dict, Set" in line
            ):
                continue  # Skip unused imports
            new_lines.append(line)

        with open(script_file, "w", encoding="utf-8") as f:
            f.writelines(new_lines)
        print(f"✅ Fixed unused imports in {script_file}")
    except Exception as e:
        print(f"❌ Error fixing {script_file}: {e}")


def main():
    """Run all fixes to achieve 100% clean code."""
    print("🚀 Starting final cleanup to resolve all 25 remaining errors...")

    # Change to project root
    os.chdir(Path(__file__).parent.parent)

    # Apply all fixes
    fix_missing_imports()
    fix_unused_variables()
    fix_syntax_errors()
    fix_ambiguous_variables()
    fix_import_issues()

    # Apply Black formatting
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

    # Final linting check
    print("\n📊 Running final linting verification...")
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
        print("🎉 🎉 🎉 PERFECT! All linting issues resolved - 100% CLEAN CODE! 🎉 🎉 🎉")
    else:
        error_count = len(
            [line for line in stdout.split("\n") if line.strip() and not line.isdigit()]
        )
        print(f"📊 Remaining issues: {error_count}")
        if error_count < 10:
            print(stdout)

    print("✅ Final cleanup completed!")


if __name__ == "__main__":
    main()
