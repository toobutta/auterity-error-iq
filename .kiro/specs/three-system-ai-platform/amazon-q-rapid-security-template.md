# AMAZON-Q RAPID SECURITY EXECUTION

## IMMEDIATE ACTION REQUIRED

**Task**: Security vulnerability assessment and fixes across AutoMatrix, RelayCore, NeuroWeaver
**Priority**: CRITICAL - Foundation task blocking all integration work
**Time Limit**: 4 hours maximum

## RAPID EXECUTION CHECKLIST

### 1. SCAN (30 min)

```bash
# AutoMatrix vulnerabilities
cd backend && pip-audit
cd frontend && npm audit
cd PRD/RelayCore && npm audit
cd PRD/TuneDev && npm audit
```

### 2. FIX CRITICAL/HIGH (2 hours)

- Update all vulnerable dependencies immediately
- Fix authentication/authorization flaws
- Patch SQL injection risks
- Secure API endpoints

### 3. FIX MODERATE (1 hour)

- Update remaining vulnerable packages
- Add security headers
- Strengthen input validation

### 4. VERIFY (30 min)

- Re-run security scans
- Test core functionality
- Document changes

## SUCCESS CRITERIA

- ✅ Zero critical/high vulnerabilities
- ✅ All moderate issues addressed
- ✅ No functional regressions
- ✅ Security best practices implemented

## COMPLETION SIGNAL

Update task status to completed and hand off to Cline for Phase 2 tasks.

**EXECUTE IMMEDIATELY - NO FURTHER APPROVAL NEEDED**
