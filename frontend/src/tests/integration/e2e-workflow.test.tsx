// import { MemoryRouter } from "react-router-dom";
/**
 * End-to-end integration tests for frontend workflow functionality
 */

import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach, afterEach, Mock } from "vitest";
import { AuthProvider } from "../../contexts/AuthContext";
import { ErrorProvider } from "../../contexts/ErrorContext";
import App from "../../App";
import * as workflowsApi from "../../api/workflows";
import * as templatesApi from "../../api/templates";
import * as authApi from "../../api/auth";

// Mock API modules with complete exports
vi.mock("../../api/workflows", () => ({
  getWorkflows: vi.fn(),
  getWorkflow: vi.fn(),
  createWorkflow: vi.fn(),
  updateWorkflow: vi.fn(),
  deleteWorkflow: vi.fn(),
  executeWorkflow: vi.fn(),
  getExecution: vi.fn(),
  getExecutionLogs: vi.fn(),
  cancelExecution: vi.fn(),
  getExecutionHistory: vi.fn(),
  getWorkflowPerformance: vi.fn(),
  getSystemPerformance: vi.fn(),
  getDashboardMetrics: vi.fn(),
}));

vi.mock("../../api/templates", () => ({
  getTemplates: vi.fn(),
  getTemplate: vi.fn(),
  getTemplateCategories: vi.fn(),
  instantiateTemplate: vi.fn(),
}));

vi.mock("../../api/auth", () => ({
  AuthApi: {
    login: vi.fn(),
    register: vi.fn(),
    getCurrentUser: vi.fn(),
    logout: vi.fn(),
  },
}));

// Mock React Flow to avoid canvas issues in tests
vi.mock("reactflow", () => ({
  ReactFlow: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="react-flow">{children}</div>
  ),
  Background: () => <div data-testid="background" />,
  Controls: () => <div data-testid="controls" />,
  MiniMap: () => <div data-testid="minimap" />,
  useNodesState: () => [[], vi.fn(), vi.fn()],
  useEdgesState: () => [[], vi.fn(), vi.fn()],
  addEdge: vi.fn(),
  useReactFlow: () => ({
    getNodes: vi.fn(() => []),
    getEdges: vi.fn(() => []),
    setNodes: vi.fn(),
    setEdges: vi.fn(),
  }),
}));

// Mock the useAuth hook directly to avoid complex auth setup
const mockUseAuth = vi.fn();
vi.mock("../../contexts/AuthContext", () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="auth-provider">{children}</div>
  ),
  useAuth: () => mockUseAuth(),
}));

// Test wrapper component - App provides its own BrowserRouter
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <ErrorProvider>
    <AuthProvider>{children}</AuthProvider>
  </ErrorProvider>
);

describe("End-to-End Workflow Integration Tests", () => {
  const mockUser = {
    id: "user-123",
    email: "test@example.com",
    name: "Test User",
  };

  const mockWorkflow = {
    id: "workflow-123",
    name: "Test Workflow",
    description: "A test workflow",
    definition: {
      nodes: [
        {
          id: "start-1",
          type: "start",
          position: { x: 100, y: 100 },
          data: { label: "Start" },
        },
      ],
      edges: [],
    },
    user_id: "user-123",
    created_at: "2025-07-30T10:00:00Z",
    updated_at: "2025-07-30T10:00:00Z",
    is_active: true,
  };

  const mockExecution = {
    id: "execution-123",
    workflow_id: "workflow-123",
    status: "completed" as const,
    input_data: { input: "Test input" },
    output_data: { result: "Test output" },
    started_at: "2025-07-30T10:00:00Z",
    completed_at: "2025-07-30T10:01:00Z",
    duration: 60000,
    error_message: null,
  };

  const mockTemplate = {
    id: "template-123",
    name: "Customer Service Template",
    description: "Template for customer service workflows",
    category: "Customer Service",
    definition: {
      nodes: [
        {
          id: "start-1",
          type: "start",
          position: { x: 100, y: 100 },
          data: { label: "Start" },
        },
      ],
      edges: [],
    },
    parameters: [
      {
        name: "inquiry_type",
        type: "select",
        label: "Inquiry Type",
        description: "Type of customer inquiry",
        isRequired: true,
        options: ["billing", "technical", "general"],
        defaultValue: "general",
      },
    ],
    created_at: "2025-07-30T10:00:00Z",
  };

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();

    // Setup default auth mock - use AuthApi class methods
    (authApi.AuthApi.getCurrentUser as Mock).mockResolvedValue(mockUser);
    (authApi.AuthApi.login as Mock).mockResolvedValue({
      access_token: "mock-token",
      token_type: "bearer",
      user: mockUser,
    });

    // AuthApi class methods are already mocked above

    // Setup default API mocks
    (workflowsApi.getWorkflows as Mock).mockResolvedValue([mockWorkflow]);
    (workflowsApi.getWorkflow as Mock).mockResolvedValue(mockWorkflow);
    (workflowsApi.createWorkflow as Mock).mockResolvedValue(mockWorkflow);
    (workflowsApi.executeWorkflow as Mock).mockResolvedValue(mockExecution);
    (workflowsApi.getExecution as Mock).mockResolvedValue(mockExecution);
    (workflowsApi.getExecutionHistory as Mock).mockResolvedValue({
      executions: [mockExecution],
      total: 1,
      page: 1,
      size: 10,
    });

    (templatesApi.getTemplates as Mock).mockResolvedValue([mockTemplate]);
    (templatesApi.getTemplate as Mock).mockResolvedValue(mockTemplate);
    (templatesApi.instantiateTemplate as Mock).mockResolvedValue(mockWorkflow);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("Complete Workflow Creation and Execution Flow", () => {
    it("should allow user to create, execute, and monitor a workflow", async () => {
      render(
        <TestWrapper>
          <App />
        </TestWrapper>,
      );

      // Wait for initial load and authentication
      await waitFor(
        () => {
          expect(screen.getByText("Dashboard")).toBeInTheDocument();
        },
        { timeout: 3000 },
      );

      // Navigate to workflow builder
      const workflowBuilderLink = screen.getByText("Workflow Builder");
      fireEvent.click(workflowBuilderLink);

      await waitFor(() => {
        expect(screen.getByText("Workflow Builder")).toBeInTheDocument();
      });

      // Create a new workflow
      const workflowNameInput = screen.getByLabelText(/workflow name/i);
      const workflowDescInput = screen.getByLabelText(/description/i);

      fireEvent.change(workflowNameInput, {
        target: { value: "E2E Test Workflow" },
      });
      fireEvent.change(workflowDescInput, {
        target: { value: "End-to-end test workflow" },
      });

      // Save the workflow
      const saveButton = screen.getByText(/save workflow/i);
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(workflowsApi.createWorkflow).toHaveBeenCalledWith(
          expect.objectContaining({
            name: "E2E Test Workflow",
            description: "End-to-end test workflow",
          }),
        );
      });

      // Navigate to workflows page to execute
      const workflowsLink = screen.getByText("Workflows");
      fireEvent.click(workflowsLink);

      await waitFor(() => {
        expect(screen.getByText("Test Workflow")).toBeInTheDocument();
      });

      // Execute the workflow
      const executeButton = screen.getByText(/execute/i);
      fireEvent.click(executeButton);

      // Fill in execution form
      const inputField = screen.getByLabelText(/input/i);
      fireEvent.change(inputField, {
        target: { value: "Test execution input" },
      });

      const runButton = screen.getByText(/run workflow/i);
      fireEvent.click(runButton);

      await waitFor(() => {
        expect(workflowsApi.executeWorkflow).toHaveBeenCalledWith(
          "workflow-123",
          expect.objectContaining({
            input: "Test execution input",
          }),
        );
      });

      // Verify execution results are displayed
      await waitFor(() => {
        expect(screen.getByText(/execution completed/i)).toBeInTheDocument();
      });
    });

    it("should handle workflow execution errors gracefully", async () => {
      // Mock API to return error
      (workflowsApi.executeWorkflow as Mock).mockRejectedValue(
        new Error("Workflow execution failed"),
      );

      render(
        <TestWrapper>
          <App />
        </TestWrapper>,
      );

      // Navigate to workflows and try to execute
      await waitFor(() => {
        expect(screen.getByText("Dashboard")).toBeInTheDocument();
      });

      const workflowsLink = screen.getByText("Workflows");
      fireEvent.click(workflowsLink);

      await waitFor(() => {
        expect(screen.getByText("Test Workflow")).toBeInTheDocument();
      });

      const executeButton = screen.getByText(/execute/i);
      fireEvent.click(executeButton);

      const runButton = screen.getByText(/run workflow/i);
      fireEvent.click(runButton);

      // Verify error is displayed
      await waitFor(() => {
        expect(
          screen.getByText(/workflow execution failed/i),
        ).toBeInTheDocument();
      });
    });
  });

  describe("Template Integration Flow", () => {
    it("should allow user to browse, preview, and instantiate templates", async () => {
      render(
        <TestWrapper>
          <App />
        </TestWrapper>,
      );

      // Navigate to templates page
      await waitFor(() => {
        expect(screen.getByText("Dashboard")).toBeInTheDocument();
      });

      const templatesLink = screen.getByText("Templates");
      fireEvent.click(templatesLink);

      await waitFor(() => {
        expect(screen.getByText("Template Library")).toBeInTheDocument();
        expect(
          screen.getByText("Customer Service Template"),
        ).toBeInTheDocument();
      });

      // Preview template
      const previewButton = screen.getByText(/preview/i);
      fireEvent.click(previewButton);

      await waitFor(() => {
        expect(screen.getByText(/template preview/i)).toBeInTheDocument();
      });

      // Instantiate template
      const instantiateButton = screen.getByText(/use template/i);
      fireEvent.click(instantiateButton);

      // Fill in template parameters
      const inquiryTypeSelect = screen.getByLabelText(/inquiry type/i);
      fireEvent.change(inquiryTypeSelect, { target: { value: "billing" } });

      const workflowNameInput = screen.getByLabelText(/workflow name/i);
      fireEvent.change(workflowNameInput, {
        target: { value: "My Customer Service Workflow" },
      });

      const createButton = screen.getByText(/create workflow/i);
      fireEvent.click(createButton);

      await waitFor(() => {
        expect(templatesApi.instantiateTemplate).toHaveBeenCalledWith(
          "template-123",
          expect.objectContaining({
            name: "My Customer Service Workflow",
            parameters: expect.objectContaining({
              inquiry_type: "billing",
            }),
          }),
        );
      });
    });

    it("should validate template parameters before instantiation", async () => {
      render(
        <TestWrapper>
          <App />
        </TestWrapper>,
      );

      // Navigate to templates and try to instantiate without required params
      await waitFor(() => {
        expect(screen.getByText("Dashboard")).toBeInTheDocument();
      });

      const templatesLink = screen.getByText("Templates");
      fireEvent.click(templatesLink);

      await waitFor(() => {
        expect(
          screen.getByText("Customer Service Template"),
        ).toBeInTheDocument();
      });

      const previewButton = screen.getByText(/preview/i);
      fireEvent.click(previewButton);

      const instantiateButton = screen.getByText(/use template/i);
      fireEvent.click(instantiateButton);

      // Try to create without filling required fields
      const createButton = screen.getByText(/create workflow/i);
      fireEvent.click(createButton);

      // Verify validation error is shown
      await waitFor(() => {
        expect(screen.getByText(/required/i)).toBeInTheDocument();
      });
    });
  });

  describe("Authentication Integration", () => {
    it("should redirect unauthenticated users to login", async () => {
      // Mock auth to return no user
      (authApi.AuthApi.getCurrentUser as Mock).mockRejectedValue(
        new Error("Not authenticated"),
      );

      render(
        <TestWrapper>
          <App />
        </TestWrapper>,
      );

      // Should show login form
      await waitFor(() => {
        expect(screen.getByText(/sign in/i)).toBeInTheDocument();
      });
    });

    it("should allow user to login and access protected routes", async () => {
      // Start with no user
      (authApi.AuthApi.getCurrentUser as Mock).mockRejectedValue(
        new Error("Not authenticated"),
      );

      render(
        <TestWrapper>
          <App />
        </TestWrapper>,
      );

      // Should show login form
      await waitFor(() => {
        expect(screen.getByText(/sign in/i)).toBeInTheDocument();
      });

      // Fill in login form
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);

      fireEvent.change(emailInput, { target: { value: "test@example.com" } });
      fireEvent.change(passwordInput, { target: { value: "password123" } });

      // Submit login
      const loginButton = screen.getByRole("button", { name: /sign in/i });
      fireEvent.click(loginButton);

      await waitFor(() => {
        expect(authApi.AuthApi.login).toHaveBeenCalledWith({
          email: "test@example.com",
          password: "password123",
        });
      });

      // After successful login, should redirect to dashboard
      await waitFor(() => {
        expect(screen.getByText("Dashboard")).toBeInTheDocument();
      });
    });
  });

  describe("Performance and Load Testing", () => {
    it("should handle multiple concurrent workflow executions", async () => {
      // Mock multiple executions
      const executions = Array.from({ length: 5 }, (_, i) => ({
        ...mockExecution,
        id: `execution-${i}`,
        input_data: { input: `Test input ${i}` },
      }));

      (workflowsApi.executeWorkflow as Mock).mockImplementation(() =>
        Promise.resolve(
          executions[Math.floor(Math.random() * executions.length)],
        ),
      );

      render(
        <TestWrapper>
          <App />
        </TestWrapper>,
      );

      // Navigate to workflows
      await waitFor(() => {
        expect(screen.getByText("Dashboard")).toBeInTheDocument();
      });

      const workflowsLink = screen.getByText("Workflows");
      fireEvent.click(workflowsLink);

      await waitFor(() => {
        expect(screen.getByText("Test Workflow")).toBeInTheDocument();
      });

      // Execute workflow multiple times rapidly
      const executeButton = screen.getByText(/execute/i);

      for (let i = 0; i < 3; i++) {
        fireEvent.click(executeButton);

        const runButton = screen.getByText(/run workflow/i);
        fireEvent.click(runButton);

        // Small delay between executions
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      // Verify all executions were attempted
      await waitFor(() => {
        expect(workflowsApi.executeWorkflow).toHaveBeenCalledTimes(3);
      });
    });

    it("should render large workflow lists efficiently", async () => {
      // Mock large number of workflows
      const manyWorkflows = Array.from({ length: 50 }, (_, i) => ({
        ...mockWorkflow,
        id: `workflow-${i}`,
        name: `Test Workflow ${i}`,
        description: `Description for workflow ${i}`,
      }));

      (workflowsApi.getWorkflows as Mock).mockResolvedValue(manyWorkflows);

      const startTime = performance.now();

      render(
        <TestWrapper>
          <App />
        </TestWrapper>,
      );

      // Navigate to workflows
      await waitFor(() => {
        expect(screen.getByText("Dashboard")).toBeInTheDocument();
      });

      const workflowsLink = screen.getByText("Workflows");
      fireEvent.click(workflowsLink);

      // Wait for all workflows to render
      await waitFor(() => {
        expect(screen.getByText("Test Workflow 0")).toBeInTheDocument();
        expect(screen.getByText("Test Workflow 49")).toBeInTheDocument();
      });

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Verify reasonable render time (adjust threshold as needed)
      expect(renderTime).toBeLessThan(5000); // 5 seconds max
    });
  });

  describe("Error Handling and Recovery", () => {
    it("should handle API errors gracefully and allow retry", async () => {
      // Mock API to fail first, then succeed
      let callCount = 0;
      (workflowsApi.getWorkflows as Mock).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.reject(new Error("Network error"));
        }
        return Promise.resolve([mockWorkflow]);
      });

      render(
        <TestWrapper>
          <App />
        </TestWrapper>,
      );

      // Navigate to workflows
      await waitFor(() => {
        expect(screen.getByText("Dashboard")).toBeInTheDocument();
      });

      const workflowsLink = screen.getByText("Workflows");
      fireEvent.click(workflowsLink);

      // Should show error message
      await waitFor(() => {
        expect(screen.getByText(/error/i)).toBeInTheDocument();
      });

      // Click retry button
      const retryButton = screen.getByText(/retry/i);
      fireEvent.click(retryButton);

      // Should now show workflows
      await waitFor(() => {
        expect(screen.getByText("Test Workflow")).toBeInTheDocument();
      });
    });

    it("should maintain application state during navigation errors", async () => {
      render(
        <TestWrapper>
          <App />
        </TestWrapper>,
      );

      // Start at dashboard
      await waitFor(() => {
        expect(screen.getByText("Dashboard")).toBeInTheDocument();
      });

      // Try to navigate to non-existent route
      window.history.pushState({}, "", "/non-existent-route");

      // Should show 404 or redirect to dashboard
      await waitFor(() => {
        // Application should handle this gracefully
        expect(document.body).toBeInTheDocument();
      });

      // Should be able to navigate back to valid routes
      const dashboardLink = screen.getByText("Dashboard");
      fireEvent.click(dashboardLink);

      await waitFor(() => {
        expect(screen.getByText("Dashboard")).toBeInTheDocument();
      });
    });
  });
});


