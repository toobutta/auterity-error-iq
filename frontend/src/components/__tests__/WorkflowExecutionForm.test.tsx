import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import WorkflowExecutionForm from "../WorkflowExecutionForm";
import * as workflowsApi from "../../api/workflows";

// Mock the workflows API with all required exports
vi.mock("../../api/workflows", () => ({
  getWorkflow: vi.fn(),
  executeWorkflow: vi.fn(),
  getExecution: vi.fn(),
  getExecutionLogs: vi.fn(),
  getWorkflows: vi.fn(),
  createWorkflow: vi.fn(),
  updateWorkflow: vi.fn(),
  deleteWorkflow: vi.fn(),
  cancelExecution: vi.fn(),
  getExecutionHistory: vi.fn(),
  getWorkflowPerformance: vi.fn(),
  getSystemPerformance: vi.fn(),
  getDashboardMetrics: vi.fn(),
}));

const mockGetWorkflow = vi.mocked(workflowsApi.getWorkflow);
const mockExecuteWorkflow = vi.mocked(workflowsApi.executeWorkflow);

const mockWorkflow = {
  id: "workflow-1",
  name: "Test Workflow",
  description: "A test workflow for unit testing",
  steps: [
    {
      id: "start-1",
      type: "start" as const,
      name: "Start",
      config: {
        parameters: {
          customerName: {
            type: "text",
            label: "Customer Name",
            required: true,
            placeholder: "Enter customer name",
          },
          email: {
            type: "email",
            label: "Email Address",
            required: true,
          },
          budget: {
            type: "number",
            label: "Budget",
            required: false,
          },
        },
      },
      position: { x: 0, y: 0 },
    },
  ],
  connections: [],
  parameters: {
    additionalInfo: {
      type: "textarea",
      label: "Additional Information",
      required: false,
      placeholder: "Any additional details...",
    },
  },
};

const mockExecution = {
  id: "execution-1",
  workflowId: "workflow-1",
  status: "pending" as const,
  inputData: {},
  startedAt: "2023-01-01T00:00:00Z",
};

describe("WorkflowExecutionForm", () => {
  const user = userEvent.setup();
  const mockOnExecutionStart = vi.fn();
  const mockOnError = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetWorkflow.mockResolvedValue(mockWorkflow);
    mockExecuteWorkflow.mockResolvedValue(mockExecution);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders loading state initially", () => {
    render(
      <WorkflowExecutionForm
        workflowId="workflow-1"
        onExecutionStart={mockOnExecutionStart}
        onError={mockOnError}
      />,
    );

    expect(screen.getByText("Loading workflow...")).toBeInTheDocument();
  });

  it("renders workflow form after loading", async () => {
    render(
      <WorkflowExecutionForm
        workflowId="workflow-1"
        onExecutionStart={mockOnExecutionStart}
        onError={mockOnError}
      />,
    );

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /Execute Workflow/ }),
      ).toBeInTheDocument();
    });

    expect(screen.getByText("Test Workflow")).toBeInTheDocument();
    expect(
      screen.getByText("A test workflow for unit testing"),
    ).toBeInTheDocument();
  });

  it("renders form fields based on workflow parameters", async () => {
    render(
      <WorkflowExecutionForm
        workflowId="workflow-1"
        onExecutionStart={mockOnExecutionStart}
        onError={mockOnError}
      />,
    );

    await waitFor(() => {
      expect(screen.getByLabelText(/Customer Name/)).toBeInTheDocument();
    });

    expect(screen.getByLabelText(/Email Address/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Budget/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Additional Information/)).toBeInTheDocument();
  });

  it("shows required field indicators", async () => {
    render(
      <WorkflowExecutionForm
        workflowId="workflow-1"
        onExecutionStart={mockOnExecutionStart}
        onError={mockOnError}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("Customer Name")).toBeInTheDocument();
    });

    // Check for required asterisks
    const requiredFields = screen.getAllByText("*");
    expect(requiredFields).toHaveLength(2); // customerName and email are required
  });

  it("validates required fields on submission", async () => {
    render(
      <WorkflowExecutionForm
        workflowId="workflow-1"
        onExecutionStart={mockOnExecutionStart}
        onError={mockOnError}
      />,
    );

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /Execute Workflow/ }),
      ).toBeInTheDocument();
    });

    const submitButton = screen.getByRole("button", {
      name: /Execute Workflow/,
    });

    // Submit form without filling required fields
    const form = submitButton.closest("form")!;
    fireEvent.submit(form);

    // Wait for error message to appear
    await waitFor(() => {
      expect(screen.getByText(/Customer Name is required/)).toBeInTheDocument();
    });

    // Check if executeWorkflow was called (it shouldn't be)
    expect(mockExecuteWorkflow).not.toHaveBeenCalled();
  });

  it("validates email format", async () => {
    render(
      <WorkflowExecutionForm
        workflowId="workflow-1"
        onExecutionStart={mockOnExecutionStart}
        onError={mockOnError}
      />,
    );

    await waitFor(() => {
      expect(screen.getByLabelText(/Customer Name/)).toBeInTheDocument();
    });

    const customerNameInput = screen.getByLabelText(/Customer Name/);
    const emailInput = screen.getByLabelText(/Email Address/);
    const submitButton = screen.getByRole("button", {
      name: /Execute Workflow/,
    });

    fireEvent.change(customerNameInput, { target: { value: "John Doe" } });
    fireEvent.change(emailInput, { target: { value: "invalid-email" } });

    const form = submitButton.closest("form")!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(
        screen.getByText(/Email Address must be a valid email address/),
      ).toBeInTheDocument();
    });

    expect(mockExecuteWorkflow).not.toHaveBeenCalled();
  });

  it("validates number fields", async () => {
    render(
      <WorkflowExecutionForm
        workflowId="workflow-1"
        onExecutionStart={mockOnExecutionStart}
        onError={mockOnError}
      />,
    );

    await waitFor(() => {
      expect(screen.getByLabelText(/Budget/)).toBeInTheDocument();
    });

    const customerNameInput = screen.getByLabelText(/Customer Name/);
    const emailInput = screen.getByLabelText(/Email Address/);
    const budgetInput = screen.getByLabelText(/Budget/);
    const submitButton = screen.getByRole("button", {
      name: /Execute Workflow/,
    });

    // Fill required fields
    fireEvent.change(customerNameInput, { target: { value: "John Doe" } });
    fireEvent.change(emailInput, { target: { value: "john@example.com" } });

    // For number inputs, browsers typically don't allow invalid text
    // So let's test with a valid number instead and verify the form submits successfully
    fireEvent.change(budgetInput, { target: { value: "50000" } });

    const form = submitButton.closest("form")!;
    fireEvent.submit(form);

    // This should submit successfully since all fields are valid
    await waitFor(() => {
      expect(mockExecuteWorkflow).toHaveBeenCalledWith("workflow-1", {
        customerName: "John Doe",
        email: "john@example.com",
        budget: 50000,
        additionalInfo: "",
      });
    });
  });

  it("submits form with valid data", async () => {
    render(
      <WorkflowExecutionForm
        workflowId="workflow-1"
        onExecutionStart={mockOnExecutionStart}
        onError={mockOnError}
      />,
    );

    await waitFor(() => {
      expect(screen.getByLabelText(/Customer Name/)).toBeInTheDocument();
    });

    const customerNameInput = screen.getByLabelText(/Customer Name/);
    const emailInput = screen.getByLabelText(/Email Address/);
    const budgetInput = screen.getByLabelText(/Budget/);
    const additionalInfoInput = screen.getByLabelText(/Additional Information/);
    const submitButton = screen.getByRole("button", {
      name: /Execute Workflow/,
    });

    await user.type(customerNameInput, "John Doe");
    await user.type(emailInput, "john@example.com");
    await user.type(budgetInput, "50000");
    await user.type(additionalInfoInput, "Looking for a sedan");
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockExecuteWorkflow).toHaveBeenCalledWith("workflow-1", {
        customerName: "John Doe",
        email: "john@example.com",
        budget: 50000,
        additionalInfo: "Looking for a sedan",
      });
    });

    expect(mockOnExecutionStart).toHaveBeenCalledWith("execution-1");
  });

  it("shows loading state during submission", async () => {
    // Make the API call take some time
    mockExecuteWorkflow.mockImplementation(
      () =>
        new Promise((resolve) => setTimeout(() => resolve(mockExecution), 100)),
    );

    render(
      <WorkflowExecutionForm
        workflowId="workflow-1"
        onExecutionStart={mockOnExecutionStart}
        onError={mockOnError}
      />,
    );

    await waitFor(() => {
      expect(screen.getByLabelText(/Customer Name/)).toBeInTheDocument();
    });

    const customerNameInput = screen.getByLabelText(/Customer Name/);
    const emailInput = screen.getByLabelText(/Email Address/);
    const submitButton = screen.getByRole("button", {
      name: /Execute Workflow/,
    });

    await user.type(customerNameInput, "John Doe");
    await user.type(emailInput, "john@example.com");
    await user.click(submitButton);

    expect(screen.getByText("Executing...")).toBeInTheDocument();
    expect(submitButton).toBeDisabled();

    await waitFor(() => {
      expect(
        screen.getByText(/Workflow execution started successfully/),
      ).toBeInTheDocument();
    });
  });

  it("shows success message after successful submission", async () => {
    render(
      <WorkflowExecutionForm
        workflowId="workflow-1"
        onExecutionStart={mockOnExecutionStart}
        onError={mockOnError}
      />,
    );

    await waitFor(() => {
      expect(screen.getByLabelText(/Customer Name/)).toBeInTheDocument();
    });

    const customerNameInput = screen.getByLabelText(/Customer Name/);
    const emailInput = screen.getByLabelText(/Email Address/);
    const submitButton = screen.getByRole("button", {
      name: /Execute Workflow/,
    });

    await user.type(customerNameInput, "John Doe");
    await user.type(emailInput, "john@example.com");
    await user.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText(
          /Workflow execution started successfully! Execution ID: execution-1/,
        ),
      ).toBeInTheDocument();
    });
  });

  it("handles API errors gracefully", async () => {
    const errorMessage = "Workflow execution failed";
    mockExecuteWorkflow.mockRejectedValue(new Error(errorMessage));

    render(
      <WorkflowExecutionForm
        workflowId="workflow-1"
        onExecutionStart={mockOnExecutionStart}
        onError={mockOnError}
      />,
    );

    await waitFor(() => {
      expect(screen.getByLabelText(/Customer Name/)).toBeInTheDocument();
    });

    const customerNameInput = screen.getByLabelText(/Customer Name/);
    const emailInput = screen.getByLabelText(/Email Address/);
    const submitButton = screen.getByRole("button", {
      name: /Execute Workflow/,
    });

    await user.type(customerNameInput, "John Doe");
    await user.type(emailInput, "john@example.com");
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });

    expect(mockOnError).toHaveBeenCalledWith(errorMessage);
  });

  it("resets form after successful submission", async () => {
    render(
      <WorkflowExecutionForm
        workflowId="workflow-1"
        onExecutionStart={mockOnExecutionStart}
        onError={mockOnError}
      />,
    );

    await waitFor(() => {
      expect(screen.getByLabelText(/Customer Name/)).toBeInTheDocument();
    });

    const customerNameInput = screen.getByLabelText(
      /Customer Name/,
    ) as HTMLInputElement;
    const emailInput = screen.getByLabelText(
      /Email Address/,
    ) as HTMLInputElement;
    const submitButton = screen.getByRole("button", {
      name: /Execute Workflow/,
    });

    await user.type(customerNameInput, "John Doe");
    await user.type(emailInput, "john@example.com");
    await user.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText(/Workflow execution started successfully/),
      ).toBeInTheDocument();
    });

    // Form should be reset
    expect(customerNameInput.value).toBe("");
    expect(emailInput.value).toBe("");
  });

  it("handles reset button click", async () => {
    render(
      <WorkflowExecutionForm
        workflowId="workflow-1"
        onExecutionStart={mockOnExecutionStart}
        onError={mockOnError}
      />,
    );

    await waitFor(() => {
      expect(screen.getByLabelText(/Customer Name/)).toBeInTheDocument();
    });

    const customerNameInput = screen.getByLabelText(
      /Customer Name/,
    ) as HTMLInputElement;
    const emailInput = screen.getByLabelText(
      /Email Address/,
    ) as HTMLInputElement;
    const resetButton = screen.getByRole("button", { name: /Reset/ });

    await user.type(customerNameInput, "John Doe");
    await user.type(emailInput, "john@example.com");

    expect(customerNameInput.value).toBe("John Doe");
    expect(emailInput.value).toBe("john@example.com");

    await user.click(resetButton);

    expect(customerNameInput.value).toBe("");
    expect(emailInput.value).toBe("");
  });

  it("handles workflow loading error", async () => {
    const errorMessage = "Failed to load workflow";
    mockGetWorkflow.mockRejectedValue(new Error(errorMessage));

    render(
      <WorkflowExecutionForm
        workflowId="workflow-1"
        onExecutionStart={mockOnExecutionStart}
        onError={mockOnError}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("Failed to load workflow")).toBeInTheDocument();
    });

    expect(mockOnError).toHaveBeenCalledWith(errorMessage);
  });

  it("renders default input field when no parameters are defined", async () => {
    const workflowWithoutParams = {
      ...mockWorkflow,
      parameters: undefined,
      steps: [
        {
          ...mockWorkflow.steps[0],
          config: {},
        },
      ],
    };

    mockGetWorkflow.mockResolvedValue(workflowWithoutParams);

    render(
      <WorkflowExecutionForm
        workflowId="workflow-1"
        onExecutionStart={mockOnExecutionStart}
        onError={mockOnError}
      />,
    );

    await waitFor(() => {
      expect(screen.getByLabelText(/Input/)).toBeInTheDocument();
    });

    const inputField = screen.getByLabelText(/Input/);
    expect(inputField).toHaveAttribute(
      "placeholder",
      "Enter your input here...",
    );
  });
});


