import { render, screen } from "@testing-library/react";
import { EndNode } from "../EndNode";
import { NodeData } from "../../../types/workflow";

// Mock ReactFlow Handle component
vi.mock("reactflow", () => ({
  Handle: ({ type, position }: { type: string; position: string }) => (
    <div data-testid={`handle-${type}-${position}`} />
  ),
  Position: {
    Top: "top",
    Bottom: "bottom",
    Left: "left",
    Right: "right",
  },
}));

describe("EndNode", () => {
  const mockData: NodeData = {
    label: "End Node",
    description: "This is an end node",
    type: "end",
    config: {},
  };

  it("renders end node with label and description", () => {
    render(<EndNode data={mockData} isConnectable={true} />);

    expect(screen.getByText("End Node")).toBeInTheDocument();
    expect(screen.getByText("This is an end node")).toBeInTheDocument();
  });

  it("renders without description when not provided", () => {
    const dataWithoutDescription = { ...mockData, description: undefined };
    render(<EndNode data={dataWithoutDescription} isConnectable={true} />);

    expect(screen.getByText("End Node")).toBeInTheDocument();
    expect(screen.queryByText("This is an end node")).not.toBeInTheDocument();
  });

  it("renders target handle at top", () => {
    render(<EndNode data={mockData} isConnectable={true} />);

    expect(screen.getByTestId("handle-target-top")).toBeInTheDocument();
  });

  it("does not render source handle", () => {
    render(<EndNode data={mockData} isConnectable={true} />);

    expect(
      screen.queryByTestId("handle-source-bottom"),
    ).not.toBeInTheDocument();
  });

  it("applies correct styling classes", () => {
    const { container } = render(
      <EndNode data={mockData} isConnectable={true} />,
    );

    const nodeElement = container.querySelector(".bg-red-100");
    expect(nodeElement).toBeInTheDocument();
    expect(nodeElement).toHaveClass("border-2", "border-red-300", "rounded-lg");
  });
});
