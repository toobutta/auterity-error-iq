# Auterity Unified Code Quality Guide

This guide outlines the code quality standards and best practices for the Auterity Unified project. Following these guidelines will help maintain a clean, consistent, and maintainable codebase.

## Table of Contents

1. [TypeScript Best Practices](#typescript-best-practices)
2. [Python Code Style](#python-code-style)
3. [Linting Tools](#linting-tools)
4. [Pre-commit Hooks](#pre-commit-hooks)
5. [Common Issues and Solutions](#common-issues-and-solutions)

## TypeScript Best Practices

### Type Safety

- **Avoid using `any`**: Always define proper types for variables, parameters, and return values.
- **Use TypeScript interfaces**: Create interfaces for data structures, API responses, and component props.
- **Leverage utility types**: Use built-in utility types like `Partial<T>`, `Pick<T, K>`, `Omit<T, K>`, etc.
- **Type assertions**: Use type assertions (`as Type`) only when necessary and when you're certain of the type.

```typescript
// ❌ Bad
const fetchData = async (): Promise<any> => {
  const response = await api.get("/data");
  return response.data;
};

// ✅ Good
interface DataResponse {
  id: string;
  name: string;
  value: number;
}

const fetchData = async (): Promise<DataResponse[]> => {
  const response = await api.get<ApiResponse<DataResponse[]>>("/data");
  return response.data;
};
```

### React Components

- **Use functional components**: Prefer functional components with hooks over class components.
- **Type props properly**: Define interfaces for component props.
- **Handle unused variables**: Prefix unused variables with underscore (`_variable`).
- **useEffect dependencies**: Ensure all dependencies are properly listed in the dependency array.

```typescript
// ❌ Bad
const Component = (props) => {
  const [data, setData] = useState();

  useEffect(() => {
    const fetchData = async () => {
      const result = await api.get('/data');
      setData(result.data);
    };
    fetchData();
  }, []); // Missing dependency

  return <div>{data}</div>;
};

// ✅ Good
interface ComponentProps {
  id: string;
  onDataLoad?: (data: DataType[]) => void;
}

const Component: React.FC<ComponentProps> = ({ id, onDataLoad }) => {
  const [data, setData] = useState<DataType[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const result = await api.get<ApiResponse<DataType[]>>(`/data/${id}`);
      setData(result.data);
      if (onDataLoad) {
        onDataLoad(result.data);
      }
    };
    fetchData();
  }, [id, onDataLoad]); // All dependencies listed

  return <div>{data.map(item => <Item key={item.id} data={item} />)}</div>;
};
```

## Python Code Style

### Formatting

- **Use Black**: Format all Python code with Black using the project's configuration.
- **Line length**: Keep lines under 88 characters.
- **Import sorting**: Use isort to organize imports in the following order:
  1. Standard library imports
  2. Related third-party imports
  3. Local application/library specific imports

### Best Practices

- **Type hints**: Use type hints for function parameters and return values.
- **Docstrings**: Write docstrings for all public functions, classes, and methods.
- **Avoid unused imports**: Remove unused imports.
- **Whitespace**: Avoid trailing whitespace and ensure proper blank lines.

```python
# ❌ Bad
import json, os, sys
from typing import Dict, List, Any
import requests
from app.models import User

def process_data(data):
    """Process the data"""
    result = {}
    for item in data:
        result[item['id']] = item['value']
    return result

# ✅ Good
import json
import os
import sys
from typing import Dict, List

import requests

from app.models import User


def process_data(data: List[Dict[str, str]]) -> Dict[str, str]:
    """
    Process the input data and return a dictionary of id-value pairs.

    Args:
        data: A list of dictionaries containing 'id' and 'value' keys

    Returns:
        A dictionary mapping ids to values
    """
    result = {}
    for item in data:
        result[item['id']] = item['value']
    return result
```

## Linting Tools

### Frontend

- **ESLint**: Used for linting TypeScript/JavaScript code.
- **Prettier**: Used for code formatting.

To run linting:

```bash
cd frontend
npm run lint
```

To automatically fix issues:

```bash
cd frontend
npm run lint -- --fix
```

### Backend

- **Black**: Used for code formatting.
- **isort**: Used for import sorting.
- **flake8**: Used for code quality checks.

To run linting:

```bash
cd backend
python -m black app
python -m isort app
python -m flake8 app
```

### Automated Scripts

We provide scripts to automate linting:

```bash
# Backend linting
./scripts/backend-lint-fix.sh

# Frontend linting
./scripts/frontend-lint-fix.sh
```

## Pre-commit Hooks

We use pre-commit hooks to ensure code quality before committing changes.

### Installation

```bash
pip install pre-commit
pre-commit install
```

### Running Hooks Manually

```bash
pre-commit run --all-files
```

## Common Issues and Solutions

### TypeScript: no-explicit-any

**Issue**: Using `any` type.

**Solution**: Create proper interfaces or use more specific types:

```typescript
// Instead of:
const data: any = { name: "John", age: 30 };

// Use:
interface Person {
  name: string;
  age: number;
}

const data: Person = { name: "John", age: 30 };
```

### React: react-hooks/exhaustive-deps

**Issue**: Missing dependencies in useEffect.

**Solution**: Add all dependencies or use useCallback:

```typescript
// Instead of:
useEffect(() => {
  fetchData(id);
}, []); // Missing 'id' dependency

// Use:
useEffect(() => {
  fetchData(id);
}, [id]); // Include all dependencies

// Or for functions:
const handleData = useCallback(() => {
  // handle data
}, [dependency1, dependency2]);

useEffect(() => {
  handleData();
}, [handleData]);
```

### Python: Import Sorting

**Issue**: Imports not properly sorted.

**Solution**: Run isort:

```bash
python -m isort file.py
```

### Python: Line Length

**Issue**: Lines too long.

**Solution**: Break long lines:

```python
# Instead of:
result = some_function_with_a_very_long_name(parameter1, parameter2, parameter3, parameter4, parameter5)

# Use:
result = some_function_with_a_very_long_name(
    parameter1,
    parameter2,
    parameter3,
    parameter4,
    parameter5,
)
```

## Conclusion

Following these code quality guidelines will help maintain a clean, consistent, and maintainable codebase for the Auterity Unified project. If you have any questions or suggestions, please reach out to the development team.
