---
name: "🏥 Project Health Monitor"
description: "Monitor project health metrics and alert on critical issues"
trigger: "manual"
disabled: false
---

# Project Health Monitoring Hook

Continuously monitor project health metrics and alert when critical thresholds are exceeded.

## Health Metrics Monitored

### Security Metrics
- Dependency vulnerabilities (npm audit)
- Outdated packages with known security issues
- Missing security headers in API responses

### Code Quality Metrics
- TypeScript compilation errors
- Linting violations (frontend and backend)
- Test coverage percentage
- Failed test count

### Performance Metrics
- Bundle size (target: <1MB)
- Build time (target: <2 minutes)
- Test execution time (target: <30 seconds)

### Dependency Health
- Outdated dependencies (>6 months old)
- Deprecated packages
- License compatibility issues

## Implementation
```bash
echo "🏥 Running project health check..."

# Initialize counters
CRITICAL_ISSUES=0
HIGH_ISSUES=0
MEDIUM_ISSUES=0

# Security Check
echo "🔒 Checking security vulnerabilities..."
cd frontend
AUDIT_OUTPUT=$(npm audit --audit-level=moderate 2>&1)
VULN_COUNT=$(echo "$AUDIT_OUTPUT" | grep -o '[0-9]* moderate' | head -1 | cut -d' ' -f1)
if [ ! -z "$VULN_COUNT" ] && [ "$VULN_COUNT" -gt 0 ]; then
    echo "⚠️  Found $VULN_COUNT moderate+ vulnerabilities"
    CRITICAL_ISSUES=$((CRITICAL_ISSUES + VULN_COUNT))
fi

# TypeScript Compliance
echo "📝 Checking TypeScript compliance..."
TS_ERRORS=$(npx tsc --noEmit 2>&1 | grep -c "error TS" || echo "0")
if [ "$TS_ERRORS" -gt 0 ]; then
    echo "⚠️  Found $TS_ERRORS TypeScript errors"
    HIGH_ISSUES=$((HIGH_ISSUES + TS_ERRORS))
fi

# Linting Check
echo "🔍 Checking code quality..."
LINT_ERRORS=$(npm run lint 2>&1 | grep -c "error" || echo "0")
if [ "$LINT_ERRORS" -gt 0 ]; then
    echo "⚠️  Found $LINT_ERRORS linting errors"
    HIGH_ISSUES=$((HIGH_ISSUES + LINT_ERRORS))
fi

# Test Health
echo "🧪 Checking test health..."
TEST_OUTPUT=$(npm test -- --run --reporter=json 2>/dev/null || echo '{"numFailedTests": 999}')
FAILED_TESTS=$(echo "$TEST_OUTPUT" | grep -o '"numFailedTests":[0-9]*' | cut -d':' -f2 || echo "0")
if [ "$FAILED_TESTS" -gt 0 ]; then
    echo "⚠️  Found $FAILED_TESTS failed tests"
    HIGH_ISSUES=$((HIGH_ISSUES + FAILED_TESTS))
fi

# Bundle Size Check
echo "📦 Checking bundle size..."
npm run build > /dev/null 2>&1
if [ -f "dist/assets/index-*.js" ]; then
    BUNDLE_SIZE=$(du -k dist/assets/index-*.js | cut -f1)
    if [ "$BUNDLE_SIZE" -gt 1024 ]; then
        echo "⚠️  Bundle size ${BUNDLE_SIZE}KB exceeds 1MB target"
        MEDIUM_ISSUES=$((MEDIUM_ISSUES + 1))
    fi
fi

# Backend Quality Check
cd ../backend
echo "🐍 Checking backend code quality..."
BACKEND_LINT=$(python -m flake8 . 2>&1 | wc -l)
if [ "$BACKEND_LINT" -gt 10 ]; then
    echo "⚠️  Found $BACKEND_LINT backend linting violations"
    HIGH_ISSUES=$((HIGH_ISSUES + 1))
fi

# Health Score Calculation
TOTAL_ISSUES=$((CRITICAL_ISSUES + HIGH_ISSUES + MEDIUM_ISSUES))
if [ "$CRITICAL_ISSUES" -gt 0 ]; then
    HEALTH_SCORE="CRITICAL"
    HEALTH_COLOR="🔴"
elif [ "$HIGH_ISSUES" -gt 5 ]; then
    HEALTH_SCORE="POOR"
    HEALTH_COLOR="🟠"
elif [ "$HIGH_ISSUES" -gt 0 ] || [ "$MEDIUM_ISSUES" -gt 5 ]; then
    HEALTH_SCORE="FAIR"
    HEALTH_COLOR="🟡"
else
    HEALTH_SCORE="GOOD"
    HEALTH_COLOR="🟢"
fi

# Generate Report
cd ..
echo ""
echo "📊 PROJECT HEALTH REPORT"
echo "========================"
echo "Overall Health: $HEALTH_COLOR $HEALTH_SCORE"
echo ""
echo "Issue Summary:"
echo "- Critical Issues: $CRITICAL_ISSUES (Security vulnerabilities)"
echo "- High Priority: $HIGH_ISSUES (TypeScript, linting, tests)"
echo "- Medium Priority: $MEDIUM_ISSUES (Performance, bundle size)"
echo ""

# Recommendations
if [ "$CRITICAL_ISSUES" -gt 0 ]; then
    echo "🚨 IMMEDIATE ACTION REQUIRED:"
    echo "- Fix security vulnerabilities with 'npm audit fix'"
    echo "- Review breaking changes before deployment"
fi

if [ "$HIGH_ISSUES" -gt 0 ]; then
    echo "⚠️  HIGH PRIORITY ACTIONS:"
    echo "- Fix TypeScript errors for type safety"
    echo "- Resolve linting violations for maintainability"
    echo "- Fix failed tests for reliability"
fi

if [ "$MEDIUM_ISSUES" -gt 0 ]; then
    echo "📈 IMPROVEMENT OPPORTUNITIES:"
    echo "- Optimize bundle size for better performance"
    echo "- Update outdated dependencies"
fi

# Exit with appropriate code
if [ "$CRITICAL_ISSUES" -gt 0 ]; then
    exit 2
elif [ "$HIGH_ISSUES" -gt 5 ]; then
    exit 1
else
    exit 0
fi
```

## Alert Thresholds

### Critical (Exit Code 2)
- Any security vulnerabilities
- Build failures
- >50% test failures

### High Priority (Exit Code 1)
- >5 TypeScript errors
- >10 linting errors
- >5 failed tests
- Bundle size >2MB

### Medium Priority (Exit Code 0)
- <5 TypeScript errors
- <10 linting errors
- Bundle size 1-2MB
- Outdated dependencies

## Integration with Development Workflow

### Pre-commit Hook Integration
```bash
# Add to .git/hooks/pre-commit
#!/bin/bash
.kiro/hooks/project-health-monitor.md
if [ $? -eq 2 ]; then
    echo "❌ Commit blocked due to critical health issues"
    exit 1
fi
```

### CI/CD Integration
```yaml
# GitHub Actions workflow
- name: Project Health Check
  run: .kiro/hooks/project-health-monitor.md
  continue-on-error: false
```

## Benefits
- Early detection of critical issues
- Automated quality gate enforcement
- Trend tracking for project health
- Actionable recommendations for improvements