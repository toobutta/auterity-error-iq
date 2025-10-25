#!/usr/bin/env python3
"""
Systematic Technical Debt Resolution Script
Addresses all remaining flake8 line length violations in the backend codebase.
"""

import os
import re
import subprocess
from pathlib import Path
from typing import Dict, List, Tuple


def run_flake8_and_get_violations() -> List[Tuple[str, int, str]]:
    """Run flake8 and parse violations."""
    try:
        result = subprocess.run(
            [
                "python",
                "-m",
                "flake8",
                "app/",
                "--max-line-length=88",
                "--extend-ignore=E203,W503",
                "--format=%(path)s:%(row)d:%(col)d: %(code)s %(text)s",
            ],
            capture_output=True,
            text=True,
            cwd=".",
        )

        violations = []
        for line in result.stdout.strip().split("\n"):
            if line and "E501" in line:
                parts = line.split(":")
                if len(parts) >= 4:
                    file_path = parts[0]
                    line_num = int(parts[1])
                    message = ":".join(parts[3:]).strip()
                    violations.append((file_path, line_num, message))

        return violations
    except Exception as e:
        print(f"Error running flake8: {e}")
        return []


def fix_line_length_violations(
    file_path: str, violations: List[Tuple[int, str]]
) -> bool:
    """Fix line length violations in a specific file."""
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            lines = f.readlines()

        # Sort violations by line number in reverse order to avoid offset issues
        violations_sorted = sorted(
            violations, key=lambda x: x[0], reverse=True
        )

        for line_num, message in violations_sorted:
            if line_num <= len(lines):
                line = lines[line_num - 1]  # Convert to 0-based index
                fixed_line = fix_long_line(line, line_num, file_path)
                if fixed_line != line:
                    lines[line_num - 1] = fixed_line

        with open(file_path, "w", encoding="utf-8") as f:
            f.writelines(lines)

        return True
    except Exception as e:
        print(f"Error fixing {file_path}: {e}")
        return False


def fix_long_line(line: str, line_num: int, file_path: str) -> str:
    """Apply intelligent line wrapping strategies."""
    line = line.rstrip()

    if len(line) <= 88:
        return line + "\n"

    # Strategy 1: Break at logical operators
    if " and " in line or " or " in line:
        return break_at_logical_operators(line)

    # Strategy 2: Break long string literals
    if '"""' in line or "'''" in line or '"' in line or "'" in line:
        return break_long_strings(line)

    # Strategy 3: Break function calls with multiple arguments
    if "(" in line and ")" in line and "," in line:
        return break_function_calls(line)

    # Strategy 4: Break long imports
    if "import" in line or "from" in line:
        return break_imports(line)

    # Strategy 5: Break at assignment operators
    if " = " in line:
        return break_at_assignment(line)

    # Strategy 6: Break dictionary/list definitions
    if "{" in line or "[" in line:
        return break_collections(line)

    # Default: Simple break at suitable points
    return simple_line_break(line)


def break_at_logical_operators(line: str) -> str:
    """Break lines at logical operators (and, or)."""
    indent = get_indent(line)

    if " and " in line:
        parts = line.split(" and ")
        if len(parts) > 1:
            result = parts[0] + " and \\\n"
            for i, part in enumerate(parts[1:], 1):
                if i == len(parts) - 1:
                    result += indent + "    " + part.strip() + "\n"
                else:
                    result += indent + "    " + part.strip() + " and \\\n"
            return result

    if " or " in line:
        parts = line.split(" or ")
        if len(parts) > 1:
            result = parts[0] + " or \\\n"
            for i, part in enumerate(parts[1:], 1):
                if i == len(parts) - 1:
                    result += indent + "    " + part.strip() + "\n"
                else:
                    result += indent + "    " + part.strip() + " or \\\n"
            return result

    return line + "\n"


def break_long_strings(line: str) -> str:
    """Break long string literals."""
    indent = get_indent(line)

    # Handle f-strings
    if 'f"' in line or "f'" in line:
        return break_f_strings(line, indent)

    # Handle regular strings
    if '"' in line and line.count('"') >= 2:
        return break_regular_strings(line, indent)

    return line + "\n"


def break_f_strings(line: str, indent: str) -> str:
    """Break f-string literals."""
    # Simple approach: if the line contains f-strings, try to break at logical points
    if len(line) > 88:
        # Try to break at spaces within the f-string
        parts = line.split(" ")
        if len(parts) > 3:
            mid = len(parts) // 2
            first_part = " ".join(parts[:mid])
            second_part = " ".join(parts[mid:])
            return first_part + " \\\n" + indent + "    " + second_part + "\n"

    return line + "\n"


def break_regular_strings(line: str, indent: str) -> str:
    """Break regular string literals."""
    # Find string boundaries
    quote_positions = []
    i = 0
    while i < len(line):
        if line[i] == '"' and (i == 0 or line[i - 1] != "\\"):
            quote_positions.append(i)
        i += 1

    if len(quote_positions) >= 2:
        # Break long strings into multiple lines
        start_quote = quote_positions[0]
        end_quote = quote_positions[1]

        if end_quote - start_quote > 50:  # Long string
            string_content = line[start_quote + 1 : end_quote]
            if " " in string_content:
                words = string_content.split()
                mid = len(words) // 2
                first_part = " ".join(words[:mid])
                second_part = " ".join(words[mid:])

                prefix = line[: start_quote + 1]
                suffix = line[end_quote:]

                return (
                    prefix
                    + first_part
                    + '" \\\n'
                    + indent
                    + '    "'
                    + second_part
                    + suffix
                    + "\n"
                )

    return line + "\n"


def break_function_calls(line: str) -> str:
    """Break function calls with multiple arguments."""
    indent = get_indent(line)

    # Find function call pattern
    paren_match = re.search(r"(\w+)\s*\([^)]+\)", line)
    if paren_match:
        func_call = paren_match.group(0)
        if "," in func_call and len(func_call) > 40:
            # Extract function name and arguments
            func_name = paren_match.group(1)
            start_paren = paren_match.start() + len(func_name)

            # Find the opening parenthesis position
            paren_pos = line.find("(", start_paren)
            if paren_pos != -1:
                before_call = line[: paren_pos + 1]

                # Extract arguments
                args_start = paren_pos + 1
                args_end = line.rfind(")")
                if args_end > args_start:
                    args_text = line[args_start:args_end]
                    after_call = line[args_end:]

                    # Split arguments
                    args = []
                    current_arg = ""
                    paren_depth = 0

                    for char in args_text:
                        if char == "(":
                            paren_depth += 1
                        elif char == ")":
                            paren_depth -= 1
                        elif char == "," and paren_depth == 0:
                            args.append(current_arg.strip())
                            current_arg = ""
                            continue
                        current_arg += char

                    if current_arg.strip():
                        args.append(current_arg.strip())

                    if len(args) > 1:
                        result = before_call + "\n"
                        for i, arg in enumerate(args):
                            if i == len(args) - 1:
                                result += indent + "    " + arg + "\n"
                            else:
                                result += indent + "    " + arg + ",\n"
                        result += indent + after_call + "\n"
                        return result

    return line + "\n"


def break_imports(line: str) -> str:
    """Break long import statements."""
    indent = get_indent(line)

    if "from" in line and "import" in line:
        parts = line.split("import")
        if len(parts) == 2:
            from_part = parts[0] + "import"
            import_part = parts[1].strip()

            if "," in import_part:
                imports = [imp.strip() for imp in import_part.split(",")]
                if len(imports) > 2:
                    result = from_part + " (\n"
                    for i, imp in enumerate(imports):
                        if i == len(imports) - 1:
                            result += indent + "    " + imp + "\n"
                        else:
                            result += indent + "    " + imp + ",\n"
                    result += indent + ")\n"
                    return result

    return line + "\n"


def break_at_assignment(line: str) -> str:
    """Break lines at assignment operators."""
    indent = get_indent(line)

    if " = " in line:
        parts = line.split(" = ", 1)
        if len(parts) == 2 and len(parts[1]) > 50:
            var_part = parts[0] + " = "
            value_part = parts[1]

            # If the value part is a long expression, try to break it
            if "(" in value_part and ")" in value_part:
                return var_part + "\\\n" + indent + "    " + value_part + "\n"
            elif " and " in value_part or " or " in value_part:
                return break_at_logical_operators(line)

    return line + "\n"


def break_collections(line: str) -> str:
    """Break dictionary and list definitions."""
    indent = get_indent(line)

    # Handle dictionary definitions
    if "{" in line and "}" in line and ":" in line:
        return break_dict_definition(line, indent)

    # Handle list definitions
    if "[" in line and "]" in line and "," in line:
        return break_list_definition(line, indent)

    return line + "\n"


def break_dict_definition(line: str, indent: str) -> str:
    """Break dictionary definitions."""
    brace_start = line.find("{")
    brace_end = line.rfind("}")

    if brace_start != -1 and brace_end != -1 and brace_end > brace_start:
        before_dict = line[: brace_start + 1]
        dict_content = line[brace_start + 1 : brace_end]
        after_dict = line[brace_end:]

        if ":" in dict_content and len(dict_content) > 40:
            # Split by comma, but be careful of nested structures
            items = []
            current_item = ""
            brace_depth = 0

            for char in dict_content:
                if char == "{":
                    brace_depth += 1
                elif char == "}":
                    brace_depth -= 1
                elif char == "," and brace_depth == 0:
                    items.append(current_item.strip())
                    current_item = ""
                    continue
                current_item += char

            if current_item.strip():
                items.append(current_item.strip())

            if len(items) > 1:
                result = before_dict + "\n"
                for i, item in enumerate(items):
                    if i == len(items) - 1:
                        result += indent + "    " + item + "\n"
                    else:
                        result += indent + "    " + item + ",\n"
                result += indent + after_dict + "\n"
                return result

    return line + "\n"


def break_list_definition(line: str, indent: str) -> str:
    """Break list definitions."""
    bracket_start = line.find("[")
    bracket_end = line.rfind("]")

    if (
        bracket_start != -1
        and bracket_end != -1
        and bracket_end > bracket_start
    ):
        before_list = line[: bracket_start + 1]
        list_content = line[bracket_start + 1 : bracket_end]
        after_list = line[bracket_end:]

        if "," in list_content and len(list_content) > 40:
            items = [item.strip() for item in list_content.split(",")]
            if len(items) > 2:
                result = before_list + "\n"
                for i, item in enumerate(items):
                    if i == len(items) - 1:
                        result += indent + "    " + item + "\n"
                    else:
                        result += indent + "    " + item + ",\n"
                result += indent + after_list + "\n"
                return result

    return line + "\n"


def simple_line_break(line: str) -> str:
    """Simple line breaking as fallback."""
    indent = get_indent(line)

    # Find a good breaking point
    breaking_points = [
        " and ",
        " or ",
        ", ",
        " = ",
        " + ",
        " - ",
        " * ",
        " / ",
    ]

    for bp in breaking_points:
        if bp in line:
            pos = line.rfind(
                bp, 0, 85
            )  # Find last occurrence before position 85
            if pos > 20:  # Don't break too early
                first_part = line[: pos + len(bp)].rstrip()
                second_part = line[pos + len(bp) :].lstrip()
                return (
                    first_part + " \\\n" + indent + "    " + second_part + "\n"
                )

    # If no good breaking point, just break at a space
    pos = line.rfind(" ", 0, 85)
    if pos > 20:
        first_part = line[:pos]
        second_part = line[pos + 1 :]
        return first_part + " \\\n" + indent + "    " + second_part + "\n"

    return line + "\n"


def get_indent(line: str) -> str:
    """Get the indentation of a line."""
    return line[: len(line) - len(line.lstrip())]


def main():
    """Main execution function."""
    print("🔧 Starting systematic technical debt resolution...")

    # Change to backend directory
    os.chdir(Path(__file__).parent)

    # Get initial violations
    violations = run_flake8_and_get_violations()

    if not violations:
        print("✅ No flake8 violations found!")
        return

    print(f"📊 Found {len(violations)} line length violations")

    # Group violations by file
    file_violations: Dict[str, List[Tuple[int, str]]] = {}
    for file_path, line_num, message in violations:
        if file_path not in file_violations:
            file_violations[file_path] = []
        file_violations[file_path].append((line_num, message))

    # Process each file
    total_files = len(file_violations)
    fixed_files = 0

    for i, (file_path, file_violations_list) in enumerate(
        file_violations.items(), 1
    ):
        print(
            f"🔄 Processing {file_path} ({i}/{total_files}) - {len(file_violations_list)} violations"
        )

        if fix_line_length_violations(file_path, file_violations_list):
            fixed_files += 1
            print(f"  ✅ Fixed {file_path}")
        else:
            print(f"  ❌ Failed to fix {file_path}")

    print(f"\n📈 Summary:")
    print(f"  Files processed: {total_files}")
    print(f"  Files fixed: {fixed_files}")
    print(f"  Files failed: {total_files - fixed_files}")

    # Run flake8 again to check results
    print("\n🔍 Verifying fixes...")
    remaining_violations = run_flake8_and_get_violations()
    print(f"  Remaining violations: {len(remaining_violations)}")

    if len(remaining_violations) < len(violations):
        improvement = len(violations) - len(remaining_violations)
        print(f"  🎉 Improved by {improvement} violations!")

    print("\n✅ Technical debt resolution complete!")


if __name__ == "__main__":
    main()
