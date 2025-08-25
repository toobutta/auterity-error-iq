export const testUsers = {
  admin: {
    email: "admin@auterity.com",
    password: "admin123",
    role: "admin",
  },
  user: {
    email: "user@auterity.com",
    password: "user123",
    role: "user",
  },
};

export const testWorkflows = {
  simple: {
    name: "Test Simple Workflow",
    description: "A simple workflow for testing",
    steps: [
      {
        id: "1",
        type: "data_input",
        config: { input_type: "text", value: "Hello World" },
      },
      {
        id: "2",
        type: "ai_process",
        config: { prompt: "Process this text", model: "gpt-3.5-turbo" },
      },
      {
        id: "3",
        type: "output",
        config: { output_format: "json" },
      },
    ],
  },
  complex: {
    name: "Test Complex Workflow",
    description: "A complex workflow with multiple branches",
    steps: [
      {
        id: "1",
        type: "data_input",
        config: { input_type: "api", endpoint: "/api/data" },
      },
      {
        id: "2",
        type: "condition",
        config: { condition: "data.length > 0" },
      },
      {
        id: "3",
        type: "ai_process",
        config: { prompt: "Analyze this data", model: "gpt-4" },
      },
      {
        id: "4",
        type: "notification",
        config: { type: "email", recipient: "test@example.com" },
      },
    ],
  },
};

export const testTemplates = {
  customerSupport: {
    name: "Customer Support Automation",
    description: "Automated customer support workflow",
    category: "support",
    tags: ["customer-service", "automation"],
  },
  dataAnalysis: {
    name: "Data Analysis Pipeline",
    description: "Automated data analysis and reporting",
    category: "analytics",
    tags: ["data", "analysis", "reporting"],
  },
};

export const apiEndpoints = {
  auth: {
    login: "/api/auth/login",
    register: "/api/auth/register",
    logout: "/api/auth/logout",
    me: "/api/auth/me",
  },
  workflows: {
    list: "/api/workflows",
    create: "/api/workflows",
    get: (id: string) => `/api/workflows/${id}`,
    execute: (id: string) => `/api/workflows/${id}/execute`,
    status: (id: string) => `/api/workflows/${id}/status`,
  },
  templates: {
    list: "/api/templates",
    get: (id: string) => `/api/templates/${id}`,
    create: "/api/templates",
  },
};
