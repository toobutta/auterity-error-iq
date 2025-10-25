import { render, screen } from "@testing-library/react";
import { ReactFlowProvider } from "reactflow";
import { StartNode } from "../StartNode";
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

describe("StartNode", () => {
  const mockData: NodeData = {
    label: "Start Node",
    description: "This is a start node",
    type: "start",
    config: {},
  };

  it("renders start node with label and description", () => {
    render(
      <ReactFlowWrapper>
        <StartNode data={mockData} isConnectable={true} />
      </ReactFlowWrapper>,
    );

    expect(screen.getByText("Start Node")).toBeInTheDocument();
    expect(screen.getByText("This is a start node")).toBeInTheDocument();
  });

  it("renders without description when not provided", () => {
    const dataWithoutDescription = { ...mockData, description: undefined };
    render(
      <ReactFlowWrapper>
        <StartNode data={dataWithoutDescription} isConnectable={true} />
      </ReactFlowWrapper>,
    );

    expect(screen.getByText("Start Node")).toBeInTheDocument();
    expect(screen.queryByText("This is a start node")).not.toBeInTheDocument();
  });

  it("renders source handle at bottom", () => {
    render(
      <ReactFlowWrapper>
        <StartNode data={mockData} isConnectable={true} />
      </ReactFlowWrapper>,
    );

    expect(screen.getByTestId("handle-source-bottom")).toBeInTheDocument();
  });

  it("applies correct styling classes", () => {
    const { container } = render(
      <ReactFlowWrapper>
        <StartNode data={mockData} isConnectable={true} />
      </ReactFlowWrapper>,
    );

    const nodeElement = container.querySelector(".bg-green-100");
    expect(nodeElement).toBeInTheDocument();
    expect(nodeElement).toHaveClass(
      "border-2",
      "border-green-300",
      "rounded-lg",
    );
  });
});


