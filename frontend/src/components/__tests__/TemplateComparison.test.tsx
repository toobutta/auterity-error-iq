import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import TemplateComparison from "../TemplateComparison";
import { Template } from "../../types/template";
import { sanitizeInput } from "../../utils/sanitizer";

// Mock ReactFlow
vi.mock("reactflow", () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="react-flow">
      {typeof children === "string" ? sanitizeInput(children) : children}
    </div>
  ),
  Background: () => <div data-testid="background" />,
  Controls: () => <div data-testid="controls" />,
}));

const mockTemplates: Template[] = [
  {
    id: "template-1",
    name: sanitizeInput("Sales Template"),
    description: sanitizeInput("Template for sales processes"),
    category: "sales",
    definition: {
      steps: [
        {
          id: "step-1",
          name: "Start",
          type: "start",
          position: { x: 0, y: 0 },
          description: "Starting step",
          config: {},
        },
      ],
      connections: [],
    },
    isActive: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
    parameters: [
      {
        id: "param-1",
        templateId: "template-1",
        name: "customerName",
        description: "Customer name",
        parameterType: "string",
        isRequired: true,
        defaultValue: "",
      },
    ],
  },
  {
    id: "template-2",
    name: sanitizeInput("Service Template"),
    description: sanitizeInput("Template for service processes"),
    category: "service",
    definition: {
      steps: [
        {
          id: "step-1",
          name: "Start",
          type: "start",
          position: { x: 0, y: 0 },
          description: "Starting step",
          config: {},
        },
        {
          id: "step-2",
          name: "Process",
          type: "ai_process",
          position: { x: 200, y: 0 },
          description: "Processing step",
          config: {},
        },
      ],
      connections: [
        {
          id: "conn-1",
          source: "step-1",
          target: "step-2",
          label: "Next",
        },
      ],
    },
    isActive: false,
    createdAt: "2024-01-02T00:00:00Z",
    updatedAt: "2024-01-02T00:00:00Z",
    parameters: [
      {
        id: "param-2",
        templateId: "template-2",
        name: "serviceType",
        description: "Type of service",
        parameterType: "string",
        isRequired: true,
        defaultValue: "",
      },
      {
        id: "param-3",
        templateId: "template-2",
        name: "priority",
        description: "Priority level",
        parameterType: "number",
        isRequired: false,
        defaultValue: 1,
      },
    ],
  },
];

describe("TemplateComparison", () => {
  const mockOnClose = vi.fn();
  const mockOnSelectTemplate = vi.fn();
  const mockOnRemoveTemplate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders comparison modal when open with templates", () => {
    render(
      <TemplateComparison
        templates={mockTemplates}
        isOpen={true}
        onClose={mockOnClose}
        onSelectTemplate={mockOnSelectTemplate}
        onRemoveTemplate={mockOnRemoveTemplate}
      />,
    );

    expect(screen.getByText("Template Comparison")).toBeInTheDocument();
    expect(
      screen.getByText("Compare 2 templates side by side"),
    ).toBeInTheDocument();
    expect(screen.getByText("Sales Template")).toBeInTheDocument();
    expect(screen.getByText("Service Template")).toBeInTheDocument();
  });

  it("does not render when closed", () => {
    render(
      <TemplateComparison
        templates={mockTemplates}
        isOpen={false}
        onClose={mockOnClose}
        onSelectTemplate={mockOnSelectTemplate}
        onRemoveTemplate={mockOnRemoveTemplate}
      />,
    );

    expect(screen.queryByText("Template Comparison")).not.toBeInTheDocument();
  });

  it("does not render when no templates provided", () => {
    render(
      <TemplateComparison
        templates={[]}
        isOpen={true}
        onClose={mockOnClose}
        onSelectTemplate={mockOnSelectTemplate}
        onRemoveTemplate={mockOnRemoveTemplate}
      />,
    );

    expect(screen.queryByText("Template Comparison")).not.toBeInTheDocument();
  });

  it("calls onClose when close button is clicked", () => {
    render(
      <TemplateComparison
        templates={mockTemplates}
        isOpen={true}
        onClose={mockOnClose}
        onSelectTemplate={mockOnSelectTemplate}
        onRemoveTemplate={mockOnRemoveTemplate}
      />,
    );

    const closeButton = screen.getByRole("button", { name: "" });
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it("calls onClose when background overlay is clicked", () => {
    render(
      <TemplateComparison
        templates={mockTemplates}
        isOpen={true}
        onClose={mockOnClose}
        onSelectTemplate={mockOnSelectTemplate}
        onRemoveTemplate={mockOnRemoveTemplate}
      />,
    );

    const overlay = document.querySelector(".fixed.inset-0.bg-gray-500");
    if (overlay) {
      fireEvent.click(overlay);
      expect(mockOnClose).toHaveBeenCalled();
    }
  });

  it("displays comparison summary statistics", () => {
    render(
      <TemplateComparison
        templates={mockTemplates}
        isOpen={true}
        onClose={mockOnClose}
        onSelectTemplate={mockOnSelectTemplate}
        onRemoveTemplate={mockOnRemoveTemplate}
      />,
    );

    expect(screen.getByText("Avg Parameters")).toBeInTheDocument();
    expect(screen.getByText("Avg Steps")).toBeInTheDocument();
    expect(screen.getByText("Active Templates")).toBeInTheDocument();
    expect(screen.getByText("1/2")).toBeInTheDocument(); // 1 active out of 2 total
  });

  it("displays template cards with correct information", () => {
    render(
      <TemplateComparison
        templates={mockTemplates}
        isOpen={true}
        onClose={mockOnClose}
        onSelectTemplate={mockOnSelectTemplate}
        onRemoveTemplate={mockOnRemoveTemplate}
      />,
    );

    // Check first template
    expect(screen.getByText("Sales Template")).toBeInTheDocument();
    expect(
      screen.getByText("Template for sales processes"),
    ).toBeInTheDocument();
    expect(screen.getByText("sales")).toBeInTheDocument();
    expect(screen.getByText("Active")).toBeInTheDocument();

    // Check second template
    expect(screen.getByText("Service Template")).toBeInTheDocument();
    expect(
      screen.getByText("Template for service processes"),
    ).toBeInTheDocument();
    expect(screen.getByText("service")).toBeInTheDocument();
    expect(screen.getByText("Inactive")).toBeInTheDocument();
  });

  it("displays workflow visualizations for each template", () => {
    render(
      <TemplateComparison
        templates={mockTemplates}
        isOpen={true}
        onClose={mockOnClose}
        onSelectTemplate={mockOnSelectTemplate}
        onRemoveTemplate={mockOnRemoveTemplate}
      />,
    );

    const reactFlowElements = screen.getAllByTestId("react-flow");
    expect(reactFlowElements).toHaveLength(2);
  });

  it("shows empty state for templates without workflow steps", () => {
    const templatesWithoutSteps = [
      {
        ...mockTemplates[0],
        definition: { steps: [], connections: [] },
      },
    ];

    render(
      <TemplateComparison
        templates={templatesWithoutSteps}
        isOpen={true}
        onClose={mockOnClose}
        onSelectTemplate={mockOnSelectTemplate}
        onRemoveTemplate={mockOnRemoveTemplate}
      />,
    );

    expect(screen.getByText("No visual workflow")).toBeInTheDocument();
  });

  it("calls onRemoveTemplate when remove button is clicked", () => {
    render(
      <TemplateComparison
        templates={mockTemplates}
        isOpen={true}
        onClose={mockOnClose}
        onSelectTemplate={mockOnSelectTemplate}
        onRemoveTemplate={mockOnRemoveTemplate}
      />,
    );

    const removeButtons = screen.getAllByTitle("Remove from comparison");
    fireEvent.click(removeButtons[0]);

    expect(mockOnRemoveTemplate).toHaveBeenCalledWith("template-1");
  });

  it("calls onSelectTemplate when use template button is clicked for active template", () => {
    render(
      <TemplateComparison
        templates={mockTemplates}
        isOpen={true}
        onClose={mockOnClose}
        onSelectTemplate={mockOnSelectTemplate}
        onRemoveTemplate={mockOnRemoveTemplate}
      />,
    );

    const useTemplateButtons = screen.getAllByText("Use This Template");
    fireEvent.click(useTemplateButtons[0]);

    expect(mockOnSelectTemplate).toHaveBeenCalledWith(mockTemplates[0]);
  });

  it("disables use template button for inactive templates", () => {
    render(
      <TemplateComparison
        templates={mockTemplates}
        isOpen={true}
        onClose={mockOnClose}
        onSelectTemplate={mockOnSelectTemplate}
        onRemoveTemplate={mockOnRemoveTemplate}
      />,
    );

    const inactiveButtons = screen.getAllByRole("button");
    const inactiveButton = inactiveButtons.find((button) =>
      button.textContent?.includes("Template Inactive"),
    );
    expect(inactiveButton).toBeDisabled();
  });

  it("displays complexity indicators", () => {
    render(
      <TemplateComparison
        templates={mockTemplates}
        isOpen={true}
        onClose={mockOnClose}
        onSelectTemplate={mockOnSelectTemplate}
        onRemoveTemplate={mockOnRemoveTemplate}
      />,
    );

    const simpleIndicators = screen.getAllByText("Simple");
    expect(simpleIndicators).toHaveLength(2); // Both templates are simple
  });

  it("displays parameter type information", () => {
    render(
      <TemplateComparison
        templates={mockTemplates}
        isOpen={true}
        onClose={mockOnClose}
        onSelectTemplate={mockOnSelectTemplate}
        onRemoveTemplate={mockOnRemoveTemplate}
      />,
    );

    expect(screen.getAllByText("string")).toHaveLength(2); // Both templates have string parameters
    expect(screen.getByText("number")).toBeInTheDocument(); // Second template has number parameter
  });

  it("displays template age information", () => {
    render(
      <TemplateComparison
        templates={mockTemplates}
        isOpen={true}
        onClose={mockOnClose}
        onSelectTemplate={mockOnSelectTemplate}
        onRemoveTemplate={mockOnRemoveTemplate}
      />,
    );

    expect(screen.getAllByText(/\d+ days/)).toHaveLength(2);
  });

  it("displays correct statistics in template cards", () => {
    render(
      <TemplateComparison
        templates={mockTemplates}
        isOpen={true}
        onClose={mockOnClose}
        onSelectTemplate={mockOnSelectTemplate}
        onRemoveTemplate={mockOnRemoveTemplate}
      />,
    );

    // Check steps count
    const stepsLabels = screen.getAllByText("Steps");
    expect(stepsLabels).toHaveLength(2);

    // Check connections count
    const connectionsLabels = screen.getAllByText("Connections");
    expect(connectionsLabels).toHaveLength(2);

    // Check parameters count
    const parametersLabels = screen.getAllByText("Parameters");
    expect(parametersLabels).toHaveLength(2);

    // Check required parameters count
    const requiredLabels = screen.getAllByText("Required");
    expect(requiredLabels).toHaveLength(2);
  });

  it("displays close comparison button in footer", () => {
    render(
      <TemplateComparison
        templates={mockTemplates}
        isOpen={true}
        onClose={mockOnClose}
        onSelectTemplate={mockOnSelectTemplate}
        onRemoveTemplate={mockOnRemoveTemplate}
      />,
    );

    const closeComparisonButton = screen.getByText("Close Comparison");
    expect(closeComparisonButton).toBeInTheDocument();

    fireEvent.click(closeComparisonButton);
    expect(mockOnClose).toHaveBeenCalled();
  });

  it("displays correct template count in footer", () => {
    render(
      <TemplateComparison
        templates={mockTemplates}
        isOpen={true}
        onClose={mockOnClose}
        onSelectTemplate={mockOnSelectTemplate}
        onRemoveTemplate={mockOnRemoveTemplate}
      />,
    );

    expect(screen.getByText("Comparing 2 templates")).toBeInTheDocument();
  });

  it("handles single template correctly", () => {
    render(
      <TemplateComparison
        templates={[mockTemplates[0]]}
        isOpen={true}
        onClose={mockOnClose}
        onSelectTemplate={mockOnSelectTemplate}
        onRemoveTemplate={mockOnRemoveTemplate}
      />,
    );

    expect(screen.getByText(/Compare 1 template/)).toBeInTheDocument();
    expect(screen.getByText("Comparing 1 template")).toBeInTheDocument();
  });
});


