# Project Structure & Organization

## Root Level Organization

```
├── backend/                 # FastAPI backend application
├── frontend/               # React frontend application
├── infra/                  # Infrastructure and deployment configs
├── .kiro/                  # Kiro AI assistant configuration
├── docker-compose.yml      # Development environment setup
├── .env.example           # Environment variables template
└── readme.md              # Project documentation
```

## Backend Structure (`backend/`)

```
backend/
├── app/                    # Main application package
│   ├── api/               # API route handlers
│   ├── models/            # SQLAlchemy data models
│   ├── services/          # Business logic services
│   ├── database.py        # Database connection setup
│   ├── init_db.py         # Database initialization
│   └── main.py            # FastAPI application entry point
├── alembic/               # Database migration files
│   ├── versions/          # Migration version files
│   ├── env.py             # Alembic environment config
│   └── script.py.mako     # Migration template
├── tests/                 # Backend test suite
├── Dockerfile             # Backend container config
├── pyproject.toml         # Python project configuration
├── requirements.txt       # Python dependencies
├── alembic.ini           # Alembic configuration
└── .flake8               # Linting configuration
```

## Frontend Structure (`frontend/`)

```
frontend/
├── src/                   # Source code
│   ├── api/              # API client functions and type definitions
│   ├── components/       # React components library
│   │   ├── auth/         # Authentication components
│   │   ├── charts/       # Chart components (BarChart, LineChart)
│   │   ├── nodes/        # Workflow node components
│   │   └── __tests__/    # Component test files
│   ├── contexts/         # React context providers (Auth, Error)
│   ├── hooks/            # Custom React hooks
│   ├── pages/            # Page-level components
│   ├── types/            # TypeScript type definitions
│   ├── utils/            # Utility functions and helpers
│   ├── App.tsx           # Main application component
│   ├── main.tsx          # Application entry point
│   ├── App.css           # Application styles
│   ├── index.css         # Global styles
│   └── setupTests.ts     # Test configuration
├── Dockerfile            # Frontend container config
├── package.json          # Node.js dependencies and scripts
├── tsconfig.json         # TypeScript configuration
├── vite.config.ts        # Vite build configuration
├── tailwind.config.js    # Tailwind CSS configuration
├── postcss.config.js     # PostCSS configuration
└── .eslintrc.json        # ESLint configuration
```

## Architecture Patterns

### Backend Patterns

- **Layered Architecture**: API → Services → Models → Database
- **Dependency Injection**: FastAPI's built-in DI for database sessions
- **Repository Pattern**: Models handle data access logic
- **Async/Await**: All endpoints and database operations are async
- **Environment-based Config**: Database URLs and API keys from environment

### Frontend Patterns

- **Component-based Architecture**: React functional components with hooks
- **TypeScript**: Strong typing throughout the application
- **CSS-in-JS**: Tailwind utility classes for styling
- **Single Page Application**: React Router for client-side routing

### Database Patterns

- **ORM**: SQLAlchemy with declarative base models
- **Migrations**: Alembic for version-controlled schema changes
- **Naming Conventions**: Consistent constraint naming via metadata
- **Test Isolation**: SQLite in-memory database for tests

## File Naming Conventions

- **Python**: snake_case for files, modules, functions, variables
- **TypeScript**: PascalCase for components, camelCase for functions/variables
- **Database**: snake_case for table and column names
- **API Routes**: kebab-case for URL paths

## Import Organization

- **Python**: Standard library → Third party → Local imports (isort configured)
- **TypeScript**: External libraries → Internal modules → Relative imports
- **Absolute Imports**: Use relative imports for same-directory files
