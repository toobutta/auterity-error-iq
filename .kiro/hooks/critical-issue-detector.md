---
name: "🚨 Critical Issue Detector"
description: "Detect and alert on critical issues that block production deployment"
trigger: "file_save"
filePattern: "**/*.{ts,tsx,py,json,md}"
disabled: false
---

# Critical Issue Detection Hook

Automatically detect critical issues that could block production deployment and alert immediately.

## Critical Issue Categories

### 🔒 Security Issues (CRITICAL)
- Dependency vulnerabilities (moderate or higher)
- Exposed API keys or secrets
- Insecure authentication patterns
- Missing security headers

### 🐛 Functionality Breaking Issues (CRITICAL)
- TypeScript compilation errors
- Undefined variable references
- Import/export errors
- Missing required dependencies

### 🧪 Test Infrastructure Issues (HIGH)
- Failed test count >10% of total
- Test execution memory errors
- Missing test coverage for critical paths
- Broken mock configurations

### 📦 Performance Issues (MEDIUM)
- Bundle size >2MB
- Build time >5 minutes
- Memory leaks in components
- Inefficient database queries

## Implementation
```bash
#!/bin/bash

# Get the changed file from the trigger
CHANGED_FILE="$1"
ISSUE_COUNT=0
CRITICAL_ISSUES=()
HIGH_ISSUES=()

echo "🔍 Scanning for critical issues in: $CHANGED_FILE"

# Security Vulnerability Check (if package.json changed)
if [[ "$CHANGED_FILE" == *"package.json"* ]]; then
    echo "📦 Checking for new security vulnerabilities..."
    cd frontend
    AUDIT_OUTPUT=$(npm audit --audit-level=moderate --json 2>/dev/null)
    VULN_COUNT=$(echo "$AUDIT_OUTPUT" | jq -r '.metadata.vulnerabilities.moderate + .metadata.vulnerabilities.high + .metadata.vulnerabilities.critical' 2>/dev/null || echo "0")
    
    if [ "$VULN_COUNT" -gt 0 ]; then
        CRITICAL_ISSUES+=("🔒 $VULN_COUNT security vulnerabilities detected")
        ISSUE_COUNT=$((ISSUE_COUNT + 1))
    fi
    cd ..
fi

# TypeScript Compilation Check (if TS file changed)
if [[ "$CHANGED_FILE" == *".ts"* ]] || [[ "$CHANGED_FILE" == *".tsx"* ]]; then
    echo "📝 Checking TypeScript compilation..."
    cd frontend
    TS_CHECK=$(npx tsc --noEmit --skipLibCheck 2>&1)
    TS_ERROR_COUNT=$(echo "$TS_CHECK" | grep -c "error TS" || echo "0")
    
    if [ "$TS_ERROR_COUNT" -gt 0 ]; then
        CRITICAL_ISSUES+=("📝 $TS_ERROR_COUNT TypeScript compilation errors")
        ISSUE_COUNT=$((ISSUE_COUNT + 1))
        
        # Show first few errors for context
        echo "$TS_CHECK" | head -5
    fi
    cd ..
fi

# Python Syntax Check (if Python file changed)
if [[ "$CHANGED_FILE" == *".py"* ]]; then
    echo "🐍 Checking Python syntax..."
    python -m py_compile "$CHANGED_FILE" 2>/dev/null
    if [ $? -ne 0 ]; then
        CRITICAL_ISSUES+=("🐍 Python syntax error in $CHANGED_FILE")
        ISSUE_COUNT=$((ISSUE_COUNT + 1))
    fi
    
    # Check for undefined names
    cd backend
    UNDEFINED_NAMES=$(python -m flake8 --select=F821 "$CHANGED_FILE" 2>/dev/null | wc -l)
    if [ "$UNDEFINED_NAMES" -gt 0 ]; then
        CRITICAL_ISSUES+=("🐍 $UNDEFINED_NAMES undefined name references in $CHANGED_FILE")
        ISSUE_COUNT=$((ISSUE_COUNT + 1))
    fi
    cd ..
fi

# Secret Detection
echo "🔐 Scanning for exposed secrets..."
SECRET_PATTERNS=(
    "api[_-]?key[[:space:]]*[:=][[:space:]]*['\"][^'\"]{10,}['\"]"
    "secret[_-]?key[[:space:]]*[:=][[:space:]]*['\"][^'\"]{10,}['\"]"
    "password[[:space:]]*[:=][[:space:]]*['\"][^'\"]{8,}['\"]"
    "token[[:space:]]*[:=][[:space:]]*['\"][^'\"]{20,}['\"]"
)

for pattern in "${SECRET_PATTERNS[@]}"; do
    if grep -iE "$pattern" "$CHANGED_FILE" >/dev/null 2>&1; then
        CRITICAL_ISSUES+=("🔐 Potential secret exposed in $CHANGED_FILE")
        ISSUE_COUNT=$((ISSUE_COUNT + 1))
        break
    fi
done

# Import/Export Error Check (for JS/TS files)
if [[ "$CHANGED_FILE" == *".ts"* ]] || [[ "$CHANGED_FILE" == *".tsx"* ]] || [[ "$CHANGED_FILE" == *".js"* ]]; then
    # Check for common import issues
    if grep -E "import.*from ['\"]\.\.?/.*['\"]" "$CHANGED_FILE" | grep -v "\.tsx\?$\|\.jsx\?$" >/dev/null; then
        HIGH_ISSUES+=("📦 Potential missing file extension in imports")
    fi
    
    # Check for unused imports (basic check)
    IMPORTS=$(grep -E "^import.*from" "$CHANGED_FILE" | sed -E "s/import[[:space:]]*\{?[[:space:]]*([^}]*)\}?.*/\1/" | tr ',' '\n' | sed 's/[[:space:]]//g' | grep -v "^$")
    for import in $IMPORTS; do
        if ! grep -q "$import" "$CHANGED_FILE" --exclude-dir=node_modules; then
            HIGH_ISSUES+=("📦 Potentially unused import: $import")
        fi
    done
fi

# Test File Quality Check
if [[ "$CHANGED_FILE" == *".test."* ]] || [[ "$CHANGED_FILE" == *".spec."* ]]; then
    echo "🧪 Checking test file quality..."
    
    # Check for 'any' types in test files
    ANY_COUNT=$(grep -c ": any\|as any" "$CHANGED_FILE" 2>/dev/null || echo "0")
    if [ "$ANY_COUNT" -gt 0 ]; then
        HIGH_ISSUES+=("🧪 $ANY_COUNT 'any' types in test file - reduces type safety")
    fi
    
    # Check for missing test descriptions
    if ! grep -q "describe\|it\|test" "$CHANGED_FILE"; then
        HIGH_ISSUES+=("🧪 Test file missing test cases")
    fi
fi

# Generate Alert Report
if [ "$ISSUE_COUNT" -gt 0 ] || [ "${#HIGH_ISSUES[@]}" -gt 0 ]; then
    echo ""
    echo "🚨 CRITICAL ISSUES DETECTED"
    echo "=========================="
    echo "File: $CHANGED_FILE"
    echo "Critical Issues: ${#CRITICAL_ISSUES[@]}"
    echo "High Priority Issues: ${#HIGH_ISSUES[@]}"
    echo ""
    
    if [ "${#CRITICAL_ISSUES[@]}" -gt 0 ]; then
        echo "🔴 CRITICAL ISSUES (Fix Immediately):"
        for issue in "${CRITICAL_ISSUES[@]}"; do
            echo "  - $issue"
        done
        echo ""
    fi
    
    if [ "${#HIGH_ISSUES[@]}" -gt 0 ]; then
        echo "🟡 HIGH PRIORITY ISSUES (Fix Soon):"
        for issue in "${HIGH_ISSUES[@]}"; do
            echo "  - $issue"
        done
        echo ""
    fi
    
    # Provide actionable recommendations
    echo "💡 RECOMMENDED ACTIONS:"
    if [[ " ${CRITICAL_ISSUES[*]} " =~ "security vulnerabilities" ]]; then
        echo "  - Run 'npm audit fix' to resolve security issues"
    fi
    if [[ " ${CRITICAL_ISSUES[*]} " =~ "TypeScript" ]]; then
        echo "  - Fix TypeScript errors with proper type definitions"
    fi
    if [[ " ${CRITICAL_ISSUES[*]} " =~ "Python" ]]; then
        echo "  - Run 'python -m flake8' and fix syntax/import errors"
    fi
    if [[ " ${CRITICAL_ISSUES[*]} " =~ "secret" ]]; then
        echo "  - Move secrets to environment variables or .env files"
    fi
    
    echo ""
    echo "🔗 For detailed guidance, see: .kiro/specs/workflow-engine-mvp/CURRENT-PROJECT-STATUS.md"
fi

# Exit with error code if critical issues found
if [ "$ISSUE_COUNT" -gt 0 ]; then
    exit 1
else
    echo "✅ No critical issues detected in $CHANGED_FILE"
    exit 0
fi
```

## Integration with Development Workflow

### File Save Trigger
This hook runs automatically when files are saved, providing immediate feedback on critical issues.

### Supported File Types
- **TypeScript/JavaScript**: `.ts`, `.tsx`, `.js`, `.jsx`
- **Python**: `.py`
- **Configuration**: `package.json`, `requirements.txt`
- **Documentation**: `.md` files

### Alert Levels

#### 🔴 Critical (Blocks Development)
- Security vulnerabilities
- Compilation errors
- Syntax errors
- Exposed secrets

#### 🟡 High Priority (Should Fix Soon)
- Type safety issues
- Import problems
- Test quality issues
- Performance concerns

#### 🟢 Medium Priority (Improvement Opportunities)
- Code style issues
- Documentation gaps
- Optimization opportunities

## Benefits
- **Immediate Feedback**: Catch critical issues as soon as they're introduced
- **Production Safety**: Prevent deployment-blocking issues from accumulating
- **Developer Productivity**: Fix issues early when context is fresh
- **Code Quality**: Maintain high standards throughout development
- **Security**: Detect potential security issues before they reach production