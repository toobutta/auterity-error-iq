---
name: "🚀 Pre-Deploy Check"
description: "Run comprehensive checks before deployment"
trigger: "manual"
disabled: false
---

# Pre-Deployment Check Hook

Run comprehensive checks before deployment to ensure everything is ready and reduce deployment failures.

## Implementation
```bash
echo "🚀 Running pre-deployment checks..."

# Initialize exit codes
OVERALL_EXIT=0

# Backend checks
cd backend
echo "📋 Running backend tests..."
python -m pytest tests/ --tb=short
BACKEND_EXIT=$?
if [ $BACKEND_EXIT -ne 0 ]; then OVERALL_EXIT=1; fi

echo "🔍 Checking code quality..."
black --check .
BLACK_EXIT=$?
flake8 .
FLAKE8_EXIT=$?
if [ $BLACK_EXIT -ne 0 ] || [ $FLAKE8_EXIT -ne 0 ]; then OVERALL_EXIT=1; fi

echo "🗄️  Checking database migrations..."
alembic check
MIGRATION_EXIT=$?
if [ $MIGRATION_EXIT -ne 0 ]; then OVERALL_EXIT=1; fi

echo "🤖 Validating AI service..."
python validate_ai_service.py
AI_EXIT=$?
if [ $AI_EXIT -ne 0 ]; then OVERALL_EXIT=1; fi

echo "⚙️  Validating workflow engine..."
python validate_workflow_engine.py
WORKFLOW_EXIT=$?
if [ $WORKFLOW_EXIT -ne 0 ]; then OVERALL_EXIT=1; fi

# Frontend checks
cd ../frontend
echo "⚛️  Building frontend..."
npm run build
FRONTEND_EXIT=$?
if [ $FRONTEND_EXIT -ne 0 ]; then OVERALL_EXIT=1; fi

echo "🧪 Running frontend tests..."
npm test -- --run
FRONTEND_TEST_EXIT=$?
if [ $FRONTEND_TEST_EXIT -ne 0 ]; then OVERALL_EXIT=1; fi

echo "🔧 Checking TypeScript compilation..."
npx tsc --noEmit
TS_EXIT=$?
if [ $TS_EXIT -ne 0 ]; then OVERALL_EXIT=1; fi

# Environment checks
cd ..
echo "🌍 Checking environment configuration..."
if [ ! -f ".env" ]; then
    echo "⚠️  .env file missing - copy from .env.example"
    OVERALL_EXIT=1
fi

# Docker checks
echo "🐳 Validating Docker configuration..."
docker-compose config > /dev/null 2>&1
DOCKER_EXIT=$?
if [ $DOCKER_EXIT -ne 0 ]; then 
    echo "⚠️  Docker Compose configuration invalid"
    OVERALL_EXIT=1
fi

# Summary
echo ""
echo "📊 Pre-deployment Check Summary:"
echo "================================"
echo "Backend Tests: $([ $BACKEND_EXIT -eq 0 ] && echo "✅ PASS" || echo "❌ FAIL")"
echo "Code Quality: $([ $BLACK_EXIT -eq 0 ] && [ $FLAKE8_EXIT -eq 0 ] && echo "✅ PASS" || echo "❌ FAIL")"
echo "DB Migrations: $([ $MIGRATION_EXIT -eq 0 ] && echo "✅ PASS" || echo "❌ FAIL")"
echo "AI Service: $([ $AI_EXIT -eq 0 ] && echo "✅ PASS" || echo "❌ FAIL")"
echo "Workflow Engine: $([ $WORKFLOW_EXIT -eq 0 ] && echo "✅ PASS" || echo "❌ FAIL")"
echo "Frontend Build: $([ $FRONTEND_EXIT -eq 0 ] && echo "✅ PASS" || echo "❌ FAIL")"
echo "Frontend Tests: $([ $FRONTEND_TEST_EXIT -eq 0 ] && echo "✅ PASS" || echo "❌ FAIL")"
echo "TypeScript: $([ $TS_EXIT -eq 0 ] && echo "✅ PASS" || echo "❌ FAIL")"
echo "Environment: $([ -f ".env" ] && echo "✅ PASS" || echo "❌ FAIL")"
echo "Docker Config: $([ $DOCKER_EXIT -eq 0 ] && echo "✅ PASS" || echo "❌ FAIL")"
echo ""

if [ $OVERALL_EXIT -eq 0 ]; then
    echo "🎉 All pre-deployment checks passed! Ready to deploy."
    echo "🚀 You can now safely run: docker-compose up -d"
else
    echo "❌ Some checks failed. Please fix issues before deploying."
    echo "💡 Run individual commands above to debug specific failures."
fi

exit $OVERALL_EXIT
```

## Benefits
- Comprehensive pre-deployment validation
- Reduces deployment failures
- Ensures quality standards are met