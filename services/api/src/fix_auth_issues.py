#!/usr/bin/env python3
"""
Script to fix all auth.py issues systematically.
"""

import re


def fix_auth_file():
    """Fix all line length and type issues in auth.py"""

    with open("app/api/auth.py", "r") as f:
        content = f.read()

    # Fix line length issues by using proper line breaks
    fixes = [
        # Fix the second Inactive user account error
        (
            (
                r"raise HTTPException\(\s*status_code=status\."
                r'HTTP_400_BAD_REQUEST, detail="Inactive user account"\s*\)'
            ),
            (
                "raise HTTPException(\n            "
                "status_code=status.HTTP_400_BAD_REQUEST,\n            "
                'detail="Inactive user account"\n        )'
            ),
        ),
        # Fix get_current_user_info function definition
        (
            (
                r"async def get_current_user_info\(current_user: User = "
                r"Depends\(get_current_active_user\)\):"
            ),
            (
                "async def get_current_user_info(\n    "
                "current_user: User = Depends(get_current_active_user)\n):"
            ),
        ),
        # Fix create_cross_system_token line
        (
            (
                r"access_token = create_cross_system_token\("
                r"current_user, request\.target_system\)"
            ),
            (
                "access_token = create_cross_system_token(\n        "
                "current_user, request.target_system\n    )"
            ),
        ),
        # Fix list comprehension line
        (
            (
                r"p for p in user_permissions if p\.startswith\("
                r'f"\{request\.target_system\}:"\)'
            ),
            (
                "p for p in user_permissions\n        "
                'if p.startswith(f"{request.target_system}:")'
            ),
        ),
        # Fix admin access dependencies
        (
            (
                r"db: Session = Depends\(get_db\), current_user: User = "
                r"Depends\(require_admin_access\(\)\)"
            ),
            (
                "db: Session = Depends(get_db),\n    "
                "current_user: User = Depends(require_admin_access())"
            ),
        ),
        # Fix roles post decorator
        (
            (
                r'@router\.post\("/roles", response_model=RoleResponse, '
                r"status_code=status\.HTTP_201_CREATED\)"
            ),
            (
                '@router.post(\n    "/roles",\n    '
                "response_model=RoleResponse,\n    "
                "status_code=status.HTTP_201_CREATED\n)"
            ),
        ),
        # Fix long return message
        (
            (
                r'return \{"message": "Default roles and permissions '
                r'initialized successfully"\}'
            ),
            (
                'return {\n        "message": "Default roles and '
                'permissions initialized successfully"\n    }'
            ),
        ),
    ]

    for pattern, replacement in fixes:
        content = re.sub(pattern, replacement, content, flags=re.MULTILINE)

    # Write the fixed content back
    with open("app/api/auth.py", "w") as f:
        f.write(content)

    print("Fixed all line length issues in auth.py")


if __name__ == "__main__":
    fix_auth_file()
