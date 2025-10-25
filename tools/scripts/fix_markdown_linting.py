#!/usr/bin/env python3
"""
Automated Markdown Linting Fix Script
Fixes common markdown linting issues across the project
"""

import os
import re
from pathlib import Path
from typing import List, Tuple


def fix_heading_blank_lines(content: str) -> str:
    """Fix MD022: Headings should be surrounded by blank lines"""
    # Pattern to find headings not preceded by blank lines
    pattern = r'(?<!\n\n)(#[^\n]+)'
    content = re.sub(pattern, r'\n\n\1', content)

    # Pattern to find headings not followed by blank lines (unless end of file)
    pattern = r'(#[^\n]+)(?!\n\n|\n*$)'
    content = re.sub(pattern, r'\1\n\n', content)

    return content


def fix_code_block_blank_lines(content: str) -> str:
    """Fix MD031: Fenced code blocks should be surrounded by blank lines"""
    # Fix code blocks not preceded by blank lines
    pattern = r'(?<!\n\n)(```[^\n]*\n)'
    content = re.sub(pattern, r'\n\n\1', content)

    # Fix code blocks not followed by blank lines
    pattern = r'(```[^\n]*\n.*?```)(?!\n\n|\n*$)'
    content = re.sub(pattern, r'\1\n\n', content, flags=re.DOTALL)

    return content


def fix_list_blank_lines(content: str) -> str:
    """Fix MD032: Lists should be surrounded by blank lines"""
    # Fix lists not preceded by blank lines
    pattern = r'(?<!\n\n)(\s*[-*+]\s)'
    content = re.sub(pattern, r'\n\n\1', content)

    # Fix numbered lists not preceded by blank lines
    pattern = r'(?<!\n\n)(\s*\d+\.\s)'
    content = re.sub(pattern, r'\n\n\1', content)

    # Fix lists not followed by blank lines (unless another list item follows)
    pattern = r'(\s*[-*+][^\n]+)(?!\n\n|\n\s*[-*+]|\n\s*\d+\.|\n*$)'
    content = re.sub(pattern, r'\1\n\n', content)

    # Fix numbered lists not followed by blank lines
    pattern = r'(\s*\d+\.[^\n]+)(?!\n\n|\n\s*\d+\.|\n*$)'
    content = re.sub(pattern, r'\1\n\n', content)

    return content


def fix_multiple_blank_lines(content: str) -> str:
    """Fix MD012: Multiple consecutive blank lines"""
    # Replace 3 or more consecutive blank lines with 2
    content = re.sub(r'\n\n\n+', '\n\n', content)
    return content


def fix_trailing_spaces(content: str) -> str:
    """Fix MD009: Trailing spaces"""
    # Remove trailing spaces from each line
    lines = content.split('\n')
    lines = [line.rstrip() for line in lines]
    return '\n'.join(lines)


def add_code_language(content: str) -> str:
    """Fix MD040: Add language specification to code blocks"""
    # Find code blocks without language specification
    pattern = r'```(\n)'
    content = re.sub(pattern, r'```\n', content)

    # For code blocks that start with known languages, add them
    # This is a basic implementation - could be enhanced with more language detection
    content = re.sub(r'```(\n)(import|from|def|class|function|const|let|var)',
                     r'```python\n\1', content)
    content = re.sub(r'```(\n)(<|{|export|import.*from)',
                     r'```typescript\n\1', content)

    return content


def fix_list_marker_spacing(content: str) -> str:
    """Fix MD030: List marker spacing"""
    # Fix excessive spaces after list markers
    content = re.sub(r'(\n\s*)([-*+])(\s{2,})', r'\1\2 ', content)
    content = re.sub(r'(\n\s*)(\d+\.)(\s{2,})', r'\1\2 ', content)
    return content


def fix_file(filepath: str) -> Tuple[int, int]:
    """Fix a single markdown file and return (fixes_made, original_errors)"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            original_content = f.read()

        content = original_content
        fixes_made = 0

        # Apply fixes
        new_content = fix_heading_blank_lines(content)
        if new_content != content:
            fixes_made += 1
        content = new_content

        new_content = fix_code_block_blank_lines(content)
        if new_content != content:
            fixes_made += 1
        content = new_content

        new_content = fix_list_blank_lines(content)
        if new_content != content:
            fixes_made += 1
        content = new_content

        new_content = fix_multiple_blank_lines(content)
        if new_content != content:
            fixes_made += 1
        content = new_content

        new_content = fix_trailing_spaces(content)
        if new_content != content:
            fixes_made += 1
        content = new_content

        new_content = add_code_language(content)
        if new_content != content:
            fixes_made += 1
        content = new_content

        new_content = fix_list_marker_spacing(content)
        if new_content != content:
            fixes_made += 1
        content = new_content

        # Write back if changes were made
        if content != original_content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)

        return fixes_made, 0  # We don't count original errors here

    except Exception as e:
        print(f"Error processing {filepath}: {e}")
        return 0, 0


def find_markdown_files(root_dir: str) -> List[str]:
    """Find all markdown files in the project"""
    markdown_files = []
    for root, dirs, files in os.walk(root_dir):
        # Skip certain directories
        dirs[:] = [d for d in dirs if not d.startswith('.') and d not in ['node_modules', '__pycache__']]

        for file in files:
            if file.endswith('.md'):
                markdown_files.append(os.path.join(root, file))

    return markdown_files


def main():
    """Main execution function"""
    print("🔧 Markdown Linting Auto-Fix Script")
    print("=" * 50)

    # Get project root
    script_dir = Path(__file__).parent.parent.parent
    project_root = script_dir

    print(f"Processing markdown files in: {project_root}")

    # Find all markdown files
    markdown_files = find_markdown_files(str(project_root))
    print(f"Found {len(markdown_files)} markdown files")

    total_fixes = 0
    files_processed = 0

    for filepath in markdown_files:
        print(f"Processing: {os.path.relpath(filepath, project_root)}")
        fixes, _ = fix_file(filepath)
        if fixes > 0:
            print(f"  ✅ Applied {fixes} fixes")
            total_fixes += fixes
            files_processed += 1
        else:
            print("  ℹ️  No fixes needed")

    print("\n" + "=" * 50)
    print("📊 SUMMARY")
    print("=" * 50)
    print(f"Files processed: {files_processed}")
    print(f"Total fixes applied: {total_fixes}")
    print("\n💡 Next steps:")
    print("1. Run your linter again to check remaining issues")
    print("2. Review changes with: git diff")
    print("3. Some issues may require manual review (tables, complex formatting)")


if __name__ == "__main__":
    main()