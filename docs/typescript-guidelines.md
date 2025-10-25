

# TypeScript Guideline

s

#

# Type Safety Standard

s

#

##

 1. Strict Type Checki

n

g

- Enable strict mode in tsconfig.jso

n

- No use of `any` type unless absolutely necessar

y

- Document any use of `any` with a comment explaining why it's neede

d

#

##

 2. Type Definitio

n

s

- Create dedicated type definition files in `src/types/

`

- Use descriptive interface/type name

s

- Prefer interfaces for object type

s

- Use type for unions/intersection

s

- Export all types from a central index.t

s

#

##

 3. Component Pro

p

s

- Always define Props interface

s

- Use descriptive prop name

s

- Make optional props explicit with `?

`

- Use strict prop types (avoid `any`

)

#

##

 4. API Respons

e

s

- Define types for all API response

s

- Use shared types between frontend and backen

d

- Handle nullable/optional fields appropriatel

y

- Document API types with JSDoc comment

s

#

##

 5. Test Fil

e

s

- Use proper type definitions in test file

s

- Mock data should match type definitions exactl

y

- Use type assertions sparingly and only in test

s

- Import types from their source file

s

#

# Best Practice

s

#

##

 1. Type Organizati

o

n

```typescript
// Group related types together
interface UserData {
  id: string;
  name: string;
}

interface UserResponse extends UserData {
  status: "active" | "inactive";
}

// Use type for unions
type UserRole = "admin" | "user" | "guest";

```

#

##

 2. Generic Typ

e

s

```

typescript
// Use generics for reusable types
interface ApiResponse<T> {
  data: T;
  status: number;
  message: string;
}

// Example usage
type UserApiResponse = ApiResponse<UserData>;

```

#

##

 3. Type Guar

d

s

```

typescript
// Use type guards for runtime type checking
function isUserData(data: unknown): data is UserData {
  return (
    typeof data === "object" && data !== null && "id" in data && "name" in data
  );
}

```

#

##

 4. Enum Usa

g

e

```

typescript
// Use const enums for better type safety
const enum ErrorSeverity {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  CRITICAL = "critical",
}

```

#

# Common Issues and Solution

s

#

##

 1. Type Mismatch

e

s

Problem:

```

typescript
interface ComponentProps {
  data?: Record<string, string>;
}

// Error: Type '{ data: undefined }' is not assignable to type 'ComponentProps'
const props: ComponentProps = {
  data: undefined,
};

```

Solution:

```

typescript
// Make the type explicitly allow undefined
interface ComponentProps {
  data?: Record<string, string> | undefined;
}

```

#

##

 2. API Type Safe

t

y

Problem:

```

typescript
// Unsafe API call
async function fetchUser(id: string) {
  const response = await api.get(`/users/${id}`);
  return response.data;
}

```

Solution:

```

typescript
// Type-safe API call

async function fetchUser(id: string): Promise<UserData> {
  const response = await api.get<UserData>(`/users/${id}`);
  return response.data;
}

```

#

##

 3. Event Handli

n

g

Problem:

```

typescript
// Unsafe event handling
const handleChange = (event) => {
  setValue(event.target.value);
};

```

Solution:

```

typescript
// Type-safe event handling

const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
  setValue(event.target.value);
};

```

#

# Pre-commit Chec

k

s

1. Install husky and lint-stage

d

:

```

bash
npm install --save-dev husky lint-stage

d

```

2. Configure pre-commit hooks in package.jso

n

:

```

json
{
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged"

    }
  },
  "lint-staged": {

    "*.{ts,tsx}": ["eslint --fix", "tsc --noEmit"]

  }
}

```

#

# VSCode Configuratio

n

1. Enable strict TypeScript checking in VSCode

:

```

json
{
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  }
}

```

2. Recommended extensions

:

- ESLin

t

- TypeScript Import Sorte

r

- Error Len

s

#

# Continuous Integratio

n

1. Add TypeScript checks to CI pipeline

:

```

yaml
typescript-check:

  runs-on: ubuntu-latest

  steps:

    - uses: actions/checkout@v

2

    - uses: actions/setup-node@v

2

    - run: npm c

i

    - run: npm run type-chec

k

```

#

# Type Safety Checklis

t

- [ ] All props have explicit interface

s

- [ ] No unnecessary `any` type

s

- [ ] API responses are properly type

d

- [ ] Event handlers have correct type

s

- [ ] Type guards used where neede

d

- [ ] Tests use proper type definition

s

- [ ] Shared types are properly exporte

d

- [ ] Generic types used appropriatel

y

- [ ] Enums used for constant

s

- [ ] Type assertions only in test

s
