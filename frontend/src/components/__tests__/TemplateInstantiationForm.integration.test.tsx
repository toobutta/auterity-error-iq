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

describe("TemplateInstantiationForm Integration", () => {
  const mockOnSuccess = vi.fn();
  const mockOnCancel = vi.fn();

  const mockTemplate: Template = {
    id: "test-template-id",
    name: "Customer Service Template",
    description: "A template for customer service workflows",
    category: "service",
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
        name: "priority",
        description: "Priority level (1-5)",
        parameterType: "number",
        isRequired: false,
        defaultValue: 3,
        validationRules: { min: 1, max: 5 },
      },
    ],
  };

  const mockWorkflow: WorkflowDefinition = {
    id: "created-workflow-id",
    name: "Customer Service Workflow",
    description: "Created from template",
    steps: [],
    connections: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetTemplate.mockResolvedValue(mockTemplate);
    mockInstantiateTemplate.mockResolvedValue(mockWorkflow);
  });

  it("successfully creates a workflow from template", async () => {
    const user = userEvent.setup();

    render(
      <TemplateInstantiationForm
        templateId="test-template-id"
        onSuccess={mockOnSuccess}
        onCancel={mockOnCancel}
      />,
    );

    // Wait for template to load
    await waitFor(() => {
      expect(
        screen.getByText("Create Workflow from Template"),
      ).toBeInTheDocument();
    });

    // Verify template information is displayed
    expect(screen.getByText(/Customer Service Template/)).toBeInTheDocument();
    expect(screen.getByLabelText(/customerName/)).toBeInTheDocument();
    expect(screen.getByLabelText(/priority/)).toBeInTheDocument();

    // Fill in the form
    const workflowNameField = screen.getByLabelText(/Workflow Name/);
    await user.clear(workflowNameField);
    await user.type(workflowNameField, "My Customer Service Workflow");

    await user.type(screen.getByLabelText(/customerName/), "John Smith");

    // Submit the form
    await user.click(screen.getByText("Create Workflow"));

    // Verify API calls
    await waitFor(() => {
      expect(mockGetTemplate).toHaveBeenCalledWith("test-template-id");
      expect(mockInstantiateTemplate).toHaveBeenCalledWith("test-template-id", {
        name: "My Customer Service Workflow",
        parameterValues: {
          customerName: "John Smith",
          priority: 3,
        },
      });
      expect(mockOnSuccess).toHaveBeenCalledWith("created-workflow-id");
    });
  });

  it("handles template loading errors gracefully", async () => {
    mockGetTemplate.mockRejectedValue(new Error("Template not found"));

    render(
      <TemplateInstantiationForm
        templateId="invalid-template-id"
        onSuccess={mockOnSuccess}
        onCancel={mockOnCancel}
      />,
    );

    await waitFor(() => {
      expect(
        screen.getByText("Failed to load template. Please try again."),
      ).toBeInTheDocument();
    });

    expect(screen.getByText("Try again")).toBeInTheDocument();
  });

  it("handles workflow creation errors", async () => {
    const user = userEvent.setup();
    mockInstantiateTemplate.mockRejectedValue(new Error("Creation failed"));

    render(
      <TemplateInstantiationForm
        templateId="test-template-id"
        onSuccess={mockOnSuccess}
        onCancel={mockOnCancel}
      />,
    );

    // Wait for template to load
    await waitFor(() => {
      expect(
        screen.getByText("Create Workflow from Template"),
      ).toBeInTheDocument();
    });

    // Fill in required fields
    const workflowNameField = screen.getByLabelText(/Workflow Name/);
    await user.clear(workflowNameField);
    await user.type(workflowNameField, "Test Workflow");
    await user.type(screen.getByLabelText(/customerName/), "Jane Doe");

    // Submit form
    await user.click(screen.getByText("Create Workflow"));

    // Verify error is shown
    await waitFor(() => {
      expect(
        screen.getByText("Failed to create workflow. Please try again."),
      ).toBeInTheDocument();
    });
  });

  it("calls onCancel when cancel button is clicked", async () => {
    const user = userEvent.setup();

    render(
      <TemplateInstantiationForm
        templateId="test-template-id"
        onSuccess={mockOnSuccess}
        onCancel={mockOnCancel}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("Cancel")).toBeInTheDocument();
    });

    await user.click(screen.getByText("Cancel"));
    expect(mockOnCancel).toHaveBeenCalled();
  });
});


