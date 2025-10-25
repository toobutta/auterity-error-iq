import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import TemplatePreviewModal from "../TemplatePreviewModal";
import { Template } from "../../types/template";

// Mock ReactFlow
vi.mock("reactflow", () => ({
  __esModule: true,
  default: () => <div data-testid="react-flow">Mocked ReactFlow</div>,
  Background: () => <div data-testid="background" />,
  Controls: () => <div data-testid="controls" />,
  MiniMap: () => <div data-testid="minimap" />,
  Panel: () => <div data-testid="panel">Mocked Panel</div>,
  useReactFlow: () => ({
    fitView: vi.fn(),
  }),
  ReactFlowProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="react-flow-provider">{children}</div>
  ),
}));

const mockTemplate: Template = {
  id: "template-1",
  name: "Test Template",
  description: "A test template for unit testing",
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
      {
        id: "step-2",
        name: "AI Process",
        type: "ai_process",
        position: { x: 200, y: 0 },
        description: "AI processing step",
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
    {
      id: "param-2",
      templateId: "template-1",
      name: "priority",
      description: "Priority level",
      parameterType: "number",
      isRequired: false,
      defaultValue: 1,
    },
  ],
};

describe("TemplatePreviewModal", () => {
  const mockOnClose = vi.fn();
  const mockOnInstantiate = vi.fn();
  const mockOnCompare = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders modal when open with template", () => {
    render(
      <TemplatePreviewModal
        template={mockTemplate}
        isOpen={true}
        onClose={mockOnClose}
        onInstantiate={mockOnInstantiate}
        onCompare={mockOnCompare}
      />,
    );

    expect(screen.getByText("Test Template")).toBeInTheDocument();
    expect(
      screen.getByText("A test template for unit testing"),
    ).toBeInTheDocument();
  });

  it("does not render when closed", () => {
    render(
      <TemplatePreviewModal
        template={mockTemplate}
        isOpen={false}
        onClose={mockOnClose}
        onInstantiate={mockOnInstantiate}
      />,
    );

    expect(screen.queryByText("Test Template")).not.toBeInTheDocument();
  });

  it("does not render when template is null", () => {
    render(
      <TemplatePreviewModal
        template={null}
        isOpen={true}
        onClose={mockOnClose}
        onInstantiate={mockOnInstantiate}
      />,
    );

    expect(screen.queryByText("Test Template")).not.toBeInTheDocument();
  });

  it("calls onClose when close button is clicked", () => {
    render(
      <TemplatePreviewModal
        template={mockTemplate}
        isOpen={true}
        onClose={mockOnClose}
        onInstantiate={mockOnInstantiate}
      />,
    );

    const closeButton = screen.getByRole("button", { name: "" });
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it("calls onClose when background overlay is clicked", () => {
    render(
      <TemplatePreviewModal
        template={mockTemplate}
        isOpen={true}
        onClose={mockOnClose}
        onInstantiate={mockOnInstantiate}
      />,
    );

    const overlay = document.querySelector(".fixed.inset-0.bg-gray-500");
    if (overlay) {
      fireEvent.click(overlay);
      expect(mockOnClose).toHaveBeenCalled();
    }
  });

  it("displays template tabs", () => {
    render(
      <TemplatePreviewModal
        template={mockTemplate}
        isOpen={true}
        onClose={mockOnClose}
        onInstantiate={mockOnInstantiate}
      />,
    );

    expect(screen.getByText("Preview")).toBeInTheDocument();
    expect(screen.getByText("Parameters")).toBeInTheDocument();
    expect(screen.getByText("Details")).toBeInTheDocument();
  });

  it("switches between tabs when clicked", () => {
    render(
      <TemplatePreviewModal
        template={mockTemplate}
        isOpen={true}
        onClose={mockOnClose}
        onInstantiate={mockOnInstantiate}
      />,
    );

    // Click on Parameters tab
    fireEvent.click(screen.getByText("Parameters"));
    expect(screen.getByText("Template Parameters")).toBeInTheDocument();

    // Click on Details tab
    fireEvent.click(screen.getByText("Details"));
    expect(screen.getByText("Template Details")).toBeInTheDocument();
  });

  it("displays workflow visualization in preview tab", () => {
    render(
      <TemplatePreviewModal
        template={mockTemplate}
        isOpen={true}
        onClose={mockOnClose}
        onInstantiate={mockOnInstantiate}
      />,
    );

    expect(screen.getByTestId("react-flow")).toBeInTheDocument();
    expect(screen.getByText("Workflow Visualization")).toBeInTheDocument();
  });

  it("displays parameters in parameters tab", () => {
    render(
      <TemplatePreviewModal
        template={mockTemplate}
        isOpen={true}
        onClose={mockOnClose}
        onInstantiate={mockOnInstantiate}
      />,
    );

    // Switch to parameters tab
    fireEvent.click(screen.getByText("Parameters"));

    expect(screen.getByText("customerName")).toBeInTheDocument();
    expect(screen.getByText("priority")).toBeInTheDocument();
  });

  it("validates required parameters before instantiation", async () => {
    render(
      <TemplatePreviewModal
        template={mockTemplate}
        isOpen={true}
        onClose={mockOnClose}
        onInstantiate={mockOnInstantiate}
      />,
    );

    // Switch to parameters tab
    fireEvent.click(screen.getByText("Parameters"));

    // Try to instantiate without filling required fields
    const instantiateButton = screen.getByText("Create Workflow");
    fireEvent.click(instantiateButton);

    // Should not call onInstantiate due to validation errors
    expect(mockOnInstantiate).not.toHaveBeenCalled();
  });

  it("calls onInstantiate with valid parameters", async () => {
    render(
      <TemplatePreviewModal
        template={mockTemplate}
        isOpen={true}
        onClose={mockOnClose}
        onInstantiate={mockOnInstantiate}
      />,
    );

    // Switch to parameters tab
    fireEvent.click(screen.getByText("Parameters"));

    // Fill required field
    const customerNameInput = screen.getByDisplayValue("");
    fireEvent.change(customerNameInput, { target: { value: "John Doe" } });

    // Click instantiate
    const instantiateButton = screen.getByText("Create Workflow");
    fireEvent.click(instantiateButton);

    await waitFor(() => {
      expect(mockOnInstantiate).toHaveBeenCalledWith(
        mockTemplate,
        expect.objectContaining({
          customerName: "John Doe",
          priority: 1,
        }),
      );
    });

    expect(mockOnClose).toHaveBeenCalled();
  });

  it("calls onCompare when compare button is clicked", () => {
    render(
      <TemplatePreviewModal
        template={mockTemplate}
        isOpen={true}
        onClose={mockOnClose}
        onInstantiate={mockOnInstantiate}
        onCompare={mockOnCompare}
      />,
    );

    const compareButton = screen.getByText("Compare");
    fireEvent.click(compareButton);

    expect(mockOnCompare).toHaveBeenCalledWith(mockTemplate);
  });

  it("displays template details in details tab", () => {
    render(
      <TemplatePreviewModal
        template={mockTemplate}
        isOpen={true}
        onClose={mockOnClose}
        onInstantiate={mockOnInstantiate}
      />,
    );

    // Switch to details tab
    fireEvent.click(screen.getByText("Details"));

    expect(screen.getByText("Basic Information")).toBeInTheDocument();
    expect(screen.getByText("Workflow Structure")).toBeInTheDocument();
    expect(screen.getAllByText("Parameters")).toHaveLength(2); // Tab and section
  });

  it("shows empty state when template has no workflow steps", () => {
    const templateWithoutSteps = {
      ...mockTemplate,
      definition: { steps: [], connections: [] },
    };

    render(
      <TemplatePreviewModal
        template={templateWithoutSteps}
        isOpen={true}
        onClose={mockOnClose}
        onInstantiate={mockOnInstantiate}
      />,
    );

    expect(screen.getByText("No workflow steps")).toBeInTheDocument();
  });

  it("shows empty state when template has no parameters", () => {
    const templateWithoutParams = {
      ...mockTemplate,
      parameters: [],
    };

    render(
      <TemplatePreviewModal
        template={templateWithoutParams}
        isOpen={true}
        onClose={mockOnClose}
        onInstantiate={mockOnInstantiate}
      />,
    );

    fireEvent.click(screen.getByText("Parameters"));
    expect(screen.getByText("No parameters defined")).toBeInTheDocument();
  });

  it("should show 'No parameters required' when template has no parameters", () => {
    const templateWithoutParams = {
      ...mockTemplate,
      parameters: [],
    };

    render(
      <TemplatePreviewModal
        template={templateWithoutParams}
        isOpen={true}
        onClose={mockOnClose}
        onInstantiate={mockOnInstantiate}
      />,
    );

    // Switch to parameters tab
    fireEvent.click(screen.getByText("Parameters"));

    expect(screen.getByText("No parameters required")).toBeInTheDocument();
  });
});


