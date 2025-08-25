# Development Templates

## Usage

Replace `{{ComponentName}}`, `{{ModelName}}`, etc. with actual names.

## Quick Commands

```bash
# Create component
cp .dev-templates/component.tsx frontend/src/components/NewComponent.tsx
cp .dev-templates/test.tsx frontend/src/components/__tests__/NewComponent.test.tsx

# Create API endpoint
cp .dev-templates/api-endpoint.py backend/app/api/new_endpoint.py
```

## Templates Available

- `component.tsx` - React component
- `test.tsx` - Vitest test file
- `api-endpoint.py` - FastAPI endpoint
