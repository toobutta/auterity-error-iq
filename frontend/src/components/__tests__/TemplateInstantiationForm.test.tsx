import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, describe, it, expect, beforeEach } from "vitest";
import TemplateInstantiationForm from "../TemplateInstantiationForm";
import { Template } from "../../types/template";
import { WorkflowDefinition } from "../../types/workflow";
import * as templatesApi from "../../api/templates";

// Mock the templates API
vi.mock("../../api/templates");

const mockGetTemplate = vi.mocked(templatesApi.getTemplate);
const mockInstantiateTemplate = vi.mocked(templatesApi.instantiateTemplate);

describe("TemplateInstantiationForm", () => {
  const mockOnSuccess = vi.fn();
  const mockOnCancel = vi.fn();

  const mockTemplate: Template = {
    id: "test-template-id",
    name: "Test Template",
    description: "A test template for unit testing",
    category: "general",
    definition: {},
    isActive: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
    parameters: [
      {
        id: "param1",
        templateId: "test-template-id",
        name: "customerName",
        description: "Customer full name",
        parameterType: "string",
        isRequired: true,
        defaultValue: "",
      },
      {
        id: "param2",
        templateId: "test-template-id",
        name: "vehicleYear",
        description: "Year of the vehicle",
        parameterType: "number",
        isRequired: true,
        validationRules: { min: 1900, max: 2025 },
      },
      {
        id: "param3",
        templateId: "test-template-id",
        name: "isUrgent",
        description: "Mark as urgent priority",
        parameterType: "boolean",
        isRequired: false,
        defaultValue: false,
      },
      {
        id: "param4",
        templateId: "test-template-id",
        name: "notes",
        description: "Additional notes",
        parameterType: "string",
        isRequired: false,
        validationRules: { multiline: true, maxLength: 500 },
      },
    ],
  };

  const mockWorkflow: WorkflowDefinition = {
    id: "created-workflow-id",
    name: "Test Workflow",
    description: "Created from template",
    steps: [],
    connections: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetTemplate.mockResolvedValue(mockTemplate);
    mockInstantiateTemplate.mockResolvedValue(mockWorkflow);
  });

  const renderComponent = (props = {}) => {
    return render(
      <TemplateInstantiationForm
        templateId="test-template-id"
        onSuccess={mockOnSuccess}
        onCancel={mockOnCancel}
        {...props}
      />,
    );
  };

  describe("Component Rendering", () => {
    it("renders loading state initially", () => {
      renderComponent();
      expect(screen.getByText("Loading template...")).toBeInTheDocument();
    });

    it("renders form after template loads", async () => {
      renderComponent();

      await waitFor(() => {
        expect(
          screen.getByText("Create Workflow from Template"),
        ).toBeInTheDocument();
      });

      expect(
        screen.getByText('Configure parameters for "Test Template" template'),
      ).toBeInTheDocument();
      expect(screen.getByLabelText(/Workflow Name/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Description/)).toBeInTheDocument();
    });

    it("renders all template parameters as form fields", async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByLabelText(/customerName/)).toBeInTheDocument();
      });

      expect(screen.getByLabelText(/vehicleYear/)).toBeInTheDocument();
      expect(screen.getByLabelText(/isUrgent/)).toBeInTheDocument();
      expect(screen.getByLabelText(/notes/)).toBeInTheDocument();
    });

    it("shows required field indicators", async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText("customerName")).toBeInTheDocument();
      });

      // Check for required asterisks
      const requiredFields = screen.getAllByText("*");
      expect(requiredFields.length).toBeGreaterThan(0);
    });

    it("applies custom className", () => {
      const { container } = renderComponent({ className: "custom-class" });
      expect(container.firstChild).toHaveClass("custom-class");
    });
  });

  describe("Form Field Types", () => {
    it("renders text input for string parameters", async () => {
      renderComponent();

      await waitFor(() => {
        const customerNameField = screen.getByLabelText(/customerName/);
        expect(customerNameField).toBeInTheDocument();
        expect(customerNameField).toHaveAttribute("type", "text");
      });
    });

    it("renders number input for number parameters", async () => {
      renderComponent();

      await waitFor(() => {
        const vehicleYearField = screen.getByLabelText(/vehicleYear/);
        expect(vehicleYearField).toBeInTheDocument();
        expect(vehicleYearField).toHaveAttribute("type", "number");
        expect(vehicleYearField).toHaveAttribute("min", "1900");
        expect(vehicleYearField).toHaveAttribute("max", "2025");
      });
    });

    it("renders checkbox for boolean parameters", async () => {
      renderComponent();

      await waitFor(() => {
        const isUrgentField = screen.getByLabelText(/Mark as urgent priority/);
        expect(isUrgentField).toBeInTheDocument();
        expect(isUrgentField).toHaveAttribute("type", "checkbox");
      });
    });

    it("renders textarea for multiline string parameters", async () => {
      renderComponent();

      await waitFor(() => {
        const notesField = screen.getByLabelText(/notes/);
        expect(notesField).toBeInTheDocument();
        expect(notesField.tagName).toBe("TEXTAREA");
      });
    });
  });

  describe("Form Validation", () => {
    it("validates required fields", async () => {
      const user = userEvent.setup();
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText("Create Workflow")).toBeInTheDocument();
      });

      // Try to submit without filling required fields
      await user.click(screen.getByText("Create Workflow"));

      await waitFor(() => {
        expect(
          screen.getByText("Workflow name is required"),
        ).toBeInTheDocument();
        expect(
          screen.getByText("customerName is required"),
        ).toBeInTheDocument();
        expect(screen.getByText("vehicleYear is required")).toBeInTheDocument();
      });
    });

    it("validates number field ranges", async () => {
      const user = userEvent.setup();
      renderComponent();

      await waitFor(() => {
        expect(screen.getByLabelText(/vehicleYear/)).toBeInTheDocument();
      });

      const vehicleYearField = screen.getByLabelText(/vehicleYear/);

      // Test minimum validation
      await user.clear(vehicleYearField);
      await user.type(vehicleYearField, "1800");
      await user.click(screen.getByText("Create Workflow"));

      await waitFor(() => {
        expect(
          screen.getByText("vehicleYear must be at least 1900"),
        ).toBeInTheDocument();
      });

      // Test maximum validation
      await user.clear(vehicleYearField);
      await user.type(vehicleYearField, "2030");
      await user.click(screen.getByText("Create Workflow"));

      await waitFor(() => {
        expect(
          screen.getByText("vehicleYear must be no more than 2025"),
        ).toBeInTheDocument();
      });
    });

    it("clears field errors when user starts typing", async () => {
      const user = userEvent.setup();
      renderComponent();

      await waitFor(() => {
        expect(screen.getByLabelText(/customerName/)).toBeInTheDocument();
      });

      // Trigger validation error
      await user.click(screen.getByText("Create Workflow"));

      await waitFor(() => {
        expect(
          screen.getByText("customerName is required"),
        ).toBeInTheDocument();
      });

      // Start typing to clear error
      const customerNameField = screen.getByLabelText(/customerName/);
      await user.type(customerNameField, "John");

      await waitFor(() => {
        expect(
          screen.queryByText("customerName is required"),
        ).not.toBeInTheDocument();
      });
    });
  });

  describe("Form Submission", () => {
    it("submits form with valid data", async () => {
      const user = userEvent.setup();
      renderComponent();

      await waitFor(() => {
        expect(screen.getByLabelText(/Workflow Name/)).toBeInTheDocument();
      });

      // Clear the default workflow name and set our own
      const workflowNameField = screen.getByLabelText(/Workflow Name/);
      await user.clear(workflowNameField);
      await user.type(workflowNameField, "My Test Workflow");

      await user.type(screen.getByLabelText(/customerName/), "John Doe");
      await user.type(screen.getByLabelText(/vehicleYear/), "2020");

      // Submit form
      await user.click(screen.getByText("Create Workflow"));

      await waitFor(() => {
        expect(mockInstantiateTemplate).toHaveBeenCalledWith(
          "test-template-id",
          {
            name: "My Test Workflow",
            parameterValues: {
              customerName: "John Doe",
              vehicleYear: 2020,
              isUrgent: false,
              notes: "",
            },
          },
        );
      });

      expect(mockOnSuccess).toHaveBeenCalledWith("created-workflow-id");
    });

    it("includes description when provided", async () => {
      const user = userEvent.setup();
      renderComponent();

      await waitFor(() => {
        expect(screen.getByLabelText(/Workflow Name/)).toBeInTheDocument();
      });

      // Clear the default workflow name and set our own
      const workflowNameField = screen.getByLabelText(/Workflow Name/);
      await user.clear(workflowNameField);
      await user.type(workflowNameField, "My Test Workflow");

      await user.type(
        screen.getByLabelText(/Description/),
        "Test workflow description",
      );
      await user.type(screen.getByLabelText(/customerName/), "John Doe");
      await user.type(screen.getByLabelText(/vehicleYear/), "2020");

      await user.click(screen.getByText("Create Workflow"));

      await waitFor(() => {
        expect(mockInstantiateTemplate).toHaveBeenCalledWith(
          "test-template-id",
          {
            name: "My Test Workflow",
            description: "Test workflow description",
            parameterValues: {
              customerName: "John Doe",
              vehicleYear: 2020,
              isUrgent: false,
              notes: "",
            },
          },
        );
      });
    });

    it("shows loading state during submission", async () => {
      const user = userEvent.setup();

      // Make the API call hang
      mockInstantiateTemplate.mockImplementation(() => new Promise(() => {}));

      renderComponent();

      await waitFor(() => {
        expect(screen.getByLabelText(/Workflow Name/)).toBeInTheDocument();
      });

      // Clear the default workflow name and set our own
      const workflowNameField = screen.getByLabelText(/Workflow Name/);
      await user.clear(workflowNameField);
      await user.type(workflowNameField, "My Test Workflow");

      await user.type(screen.getByLabelText(/customerName/), "John Doe");
      await user.type(screen.getByLabelText(/vehicleYear/), "2020");

      // Submit form
      await user.click(screen.getByText("Create Workflow"));

      await waitFor(() => {
        expect(screen.getByText("Creating Workflow...")).toBeInTheDocument();
      });

      // Buttons should be disabled
      const submitButton = screen.getByRole("button", {
        name: /Creating Workflow.../i,
      });
      const cancelButton = screen.getByRole("button", { name: /Cancel/i });
      expect(submitButton).toBeDisabled();
      expect(cancelButton).toBeDisabled();
    });

    it("handles submission errors", async () => {
      const user = userEvent.setup();
      mockInstantiateTemplate.mockRejectedValue(new Error("API Error"));

      renderComponent();

      await waitFor(() => {
        expect(screen.getByLabelText(/Workflow Name/)).toBeInTheDocument();
      });

      // Clear the default workflow name and set our own
      const workflowNameField = screen.getByLabelText(/Workflow Name/);
      await user.clear(workflowNameField);
      await user.type(workflowNameField, "My Test Workflow");

      await user.type(screen.getByLabelText(/customerName/), "John Doe");
      await user.type(screen.getByLabelText(/vehicleYear/), "2020");

      // Submit form
      await user.click(screen.getByText("Create Workflow"));

      await waitFor(() => {
        expect(
          screen.getByText("Failed to create workflow. Please try again."),
        ).toBeInTheDocument();
      });
    });
  });

  describe("Error Handling", () => {
    it("shows error when template fails to load", async () => {
      mockGetTemplate.mockRejectedValue(new Error("Template not found"));

      renderComponent();

      await waitFor(() => {
        expect(
          screen.getByText("Failed to load template. Please try again."),
        ).toBeInTheDocument();
      });

      expect(screen.getByText("Try again")).toBeInTheDocument();
    });

    it("allows retry when template loading fails", async () => {
      const user = userEvent.setup();
      mockGetTemplate.mockRejectedValueOnce(new Error("Network error"));

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText("Try again")).toBeInTheDocument();
      });

      // Reset mock to succeed on retry
      mockGetTemplate.mockResolvedValue(mockTemplate);

      await user.click(screen.getByText("Try again"));

      await waitFor(() => {
        expect(
          screen.getByText("Create Workflow from Template"),
        ).toBeInTheDocument();
      });
    });
  });

  describe("User Interactions", () => {
    it("calls onCancel when cancel button is clicked", async () => {
      const user = userEvent.setup();
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText("Cancel")).toBeInTheDocument();
      });

      await user.click(screen.getByText("Cancel"));

      expect(mockOnCancel).toHaveBeenCalled();
    });

    it("updates form data when fields change", async () => {
      const user = userEvent.setup();
      renderComponent();

      await waitFor(() => {
        expect(screen.getByLabelText(/customerName/)).toBeInTheDocument();
      });

      const customerNameField = screen.getByLabelText(/customerName/);
      await user.type(customerNameField, "Jane Doe");

      expect(customerNameField).toHaveValue("Jane Doe");
    });

    it("handles boolean field changes", async () => {
      const user = userEvent.setup();
      renderComponent();

      await waitFor(() => {
        expect(
          screen.getByLabelText(/Mark as urgent priority/),
        ).toBeInTheDocument();
      });

      const isUrgentField = screen.getByLabelText(/Mark as urgent priority/);
      expect(isUrgentField).not.toBeChecked();

      await user.click(isUrgentField);
      expect(isUrgentField).toBeChecked();
    });
  });

  describe("Default Values", () => {
    it("initializes form with default values from template", async () => {
      const templateWithDefaults: Template = {
        ...mockTemplate,
        parameters: [
          {
            id: "param1",
            templateId: "test-template-id",
            name: "customerName",
            description: "Customer name",
            parameterType: "string",
            isRequired: true,
            defaultValue: "Default Customer",
          },
          {
            id: "param2",
            templateId: "test-template-id",
            name: "priority",
            description: "Priority level",
            parameterType: "number",
            isRequired: false,
            defaultValue: 5,
          },
        ],
      };

      mockGetTemplate.mockResolvedValue(templateWithDefaults);

      renderComponent();

      await waitFor(() => {
        expect(
          screen.getByDisplayValue("Default Customer"),
        ).toBeInTheDocument();
      });

      expect(screen.getByDisplayValue("5")).toBeInTheDocument();
    });

    it("sets default workflow name based on template", async () => {
      renderComponent();

      await waitFor(() => {
        const workflowNameField = screen.getByLabelText(/Workflow Name/);
        expect(workflowNameField.value).toContain("Test Template");
      });
    });
  });

  describe("Accessibility", () => {
    it("has proper ARIA labels and descriptions", async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByLabelText(/customerName/)).toBeInTheDocument();
      });

      const customerNameField = screen.getByLabelText(/customerName/);
      expect(customerNameField).toHaveAttribute("id", "field-customerName");
    });

    it("associates error messages with form fields", async () => {
      const user = userEvent.setup();
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText("Create Workflow")).toBeInTheDocument();
      });

      // Trigger validation error
      await user.click(screen.getByText("Create Workflow"));

      await waitFor(() => {
        expect(
          screen.getByText("customerName is required"),
        ).toBeInTheDocument();
      });

      const customerNameField = screen.getByLabelText(/customerName/);
      expect(customerNameField).toHaveAttribute(
        "aria-describedby",
        "field-customerName-error",
      );
    });
  });
});


