import { render, screen } from "@testing-library/react";
import { ReactFlowProvider } from "reactflow";
import { EndNode } from "../EndNode";
import { NodeData } from "../../../types/workflow";

// Mock ReactFlow Handle component
vi.mock("reactflow", async () => {
  const actual = await vi.importActual("reactflow");
  return {
    ...actual,
    Handle: ({ type, position }: { type: string; position: string }) => (
      <div data-testid={`handle-${type}-${position}`} />
    ),
    Position: {
      Top: "top",
      Bottom: "bottom",
      Left: "left",
      Right: "right",
    },
  };
});

// Wrapper component for ReactFlow provider
const ReactFlowWrapper = ({ children }: { children: React.ReactNode }) => (
  <ReactFlowProvider>{children}</ReactFlowProvider>
);

describe("EndNode", () => {
  const mockData: NodeData = {
    label: "End Node",
    description: "This is an end node",
    type: "end",
    config: {},
  };

  it("renders end node with label and description", () => {
    render(
      <ReactFlowWrapper>
        <EndNode data={mockData} isConnectable={true} />
      </ReactFlowWrapper>,
    );

    expect(screen.getByText("End Node")).toBeInTheDocument();
    expect(screen.getByText("This is an end node")).toBeInTheDocument();
  });

  it("renders without description when not provided", () => {
    const dataWithoutDescription = { ...mockData, description: undefined };
    render(
      <ReactFlowWrapper>
        <EndNode data={dataWithoutDescription} isConnectable={true} />
      </ReactFlowWrapper>,
    );

    expect(screen.getByText("End Node")).toBeInTheDocument();
    expect(screen.queryByText("This is an end node")).not.toBeInTheDocument();
  });

  it("renders target handle at top", () => {
    render(
      <ReactFlowWrapper>
        <EndNode data={mockData} isConnectable={true} />
      </ReactFlowWrapper>,
    );

    expect(screen.getByTestId("handle-target-top")).toBeInTheDocument();
  });

  it("does not render source handle", () => {
    render(
      <ReactFlowWrapper>
        <EndNode data={mockData} isConnectable={true} />
      </ReactFlowWrapper>,
    );

    expect(
      screen.queryByTestId("handle-source-bottom"),
    ).not.toBeInTheDocument();
  });

  it("applies correct styling classes", () => {
    const { container } = render(
      <ReactFlowWrapper>
        <EndNode data={mockData} isConnectable={true} />
      </ReactFlowWrapper>,
    );

    const nodeElement = container.querySelector(".bg-red-100");
    expect(nodeElement).toBeInTheDocument();
    expect(nodeElement).toHaveClass("border-2", "border-red-300", "rounded-lg");
  });
});


