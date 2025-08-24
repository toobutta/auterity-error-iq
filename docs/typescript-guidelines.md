# TypeScript Guidelines

## Type Safety Standards

### 1. Strict Type Checking
- Enable strict mode in tsconfig.json
- No use of `any` type unless absolutely necessary
- Document any use of `any` with a comment explaining why it's needed

### 2. Type Definitions
- Create dedicated type definition files in `src/types/`
- Use descriptive interface/type names
- Prefer interfaces for object types
- Use type for unions/intersections
- Export all types from a central index.ts

### 3. Component Props
- Always define Props interfaces
- Use descriptive prop names
- Make optional props explicit with `?`
- Use strict prop types (avoid `any`)

### 4. API Responses
- Define types for all API responses
- Use shared types between frontend and backend
- Handle nullable/optional fields appropriately
- Document API types with JSDoc comments

### 5. Test Files
- Use proper type definitions in test files
- Mock data should match type definitions exactly
- Use type assertions sparingly and only in tests
- Import types from their source files

## Best Practices

### 1. Type Organization
```typescript
// Group related types together
interface UserData {
  id: string;
  name: string;
}

interface UserResponse extends UserData {
  status: 'active' | 'inactive';
}

// Use type for unions
type UserRole = 'admin' | 'user' | 'guest';
```

### 2. Generic Types
```typescript
// Use generics for reusable types
interface ApiResponse<T> {
  data: T;
  status: number;
  message: string;
}

// Example usage
type UserApiResponse = ApiResponse<UserData>;
```

### 3. Type Guards
```typescript
// Use type guards for runtime type checking
function isUserData(data: unknown): data is UserData {
  return (
    typeof data === 'object' &&
    data !== null &&
    'id' in data &&
    'name' in data
  );
}
```

### 4. Enum Usage
```typescript
// Use const enums for better type safety
const enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}
```

## Common Issues and Solutions

### 1. Type Mismatches
Problem:
```typescript
interface ComponentProps {
  data?: Record<string, string>;
}

// Error: Type '{ data: undefined }' is not assignable to type 'ComponentProps'
const props: ComponentProps = {
  data: undefined
};
```

Solution:
```typescript
// Make the type explicitly allow undefined
interface ComponentProps {
  data?: Record<string, string> | undefined;
}
```

### 2. API Type Safety
Problem:
```typescript
// Unsafe API call
async function fetchUser(id: string) {
  const response = await api.get(`/users/${id}`);
  return response.data;
}
```

Solution:
```typescript
// Type-safe API call
async function fetchUser(id: string): Promise<UserData> {
  const response = await api.get<UserData>(`/users/${id}`);
  return response.data;
}
```

### 3. Event Handling
Problem:
```typescript
// Unsafe event handling
const handleChange = (event) => {
  setValue(event.target.value);
};
```

Solution:
```typescript
// Type-safe event handling
const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
  setValue(event.target.value);
};
```

## Pre-commit Checks

1. Install husky and lint-staged:
```bash
npm install --save-dev husky lint-staged
```

2. Configure pre-commit hooks in package.json:
```json
{
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged"
    }
  },
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "tsc --noEmit"
    ]
  }
}
```

## VSCode Configuration

1. Enable strict TypeScript checking in VSCode:
```json
{
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  }
}
```

2. Recommended extensions:
- ESLint
- TypeScript Import Sorter
- Error Lens

## Continuous Integration

1. Add TypeScript checks to CI pipeline:
```yaml
typescript-check:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v2
    - uses: actions/setup-node@v2
    - run: npm ci
    - run: npm run type-check
```

## Type Safety Checklist

- [ ] All props have explicit interfaces
- [ ] No unnecessary `any` types
- [ ] API responses are properly typed
- [ ] Event handlers have correct types
- [ ] Type guards used where needed
- [ ] Tests use proper type definitions
- [ ] Shared types are properly exported
- [ ] Generic types used appropriately
- [ ] Enums used for constants
- [ ] Type assertions only in tests
