import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import TemplateCard from "../TemplateCard";
import { Template } from "../../types/template";

const mockTemplate: Template = {
  id: "template-1",
  name: "Customer Inquiry Template",
  description: "A template for handling customer inquiries",
  category: "sales",
  definition: { nodes: [], edges: [] },
  isActive: true,
  createdAt: "2023-01-01T00:00:00Z",
  updatedAt: "2023-01-01T00:00:00Z",
  parameters: [
    {
      id: "param-1",
      templateId: "template-1",
      name: "customerName",
      description: "Name of the customer",
      parameterType: "string",
      isRequired: true,
      defaultValue: undefined,
      validationRules: undefined,
    },
  ],
};

describe("TemplateCard", () => {
  it("renders template information correctly", () => {
    const mockOnSelect = vi.fn();
    const mockOnPreview = vi.fn();

    render(
      <TemplateCard
        template={mockTemplate}
        onSelect={mockOnSelect}
        onPreview={mockOnPreview}
      />,
    );

    expect(screen.getByText("Customer Inquiry Template")).toBeInTheDocument();
    expect(
      screen.getByText("A template for handling customer inquiries"),
    ).toBeInTheDocument();
    expect(screen.getByText("sales")).toBeInTheDocument();
    expect(screen.getByText("1 parameters")).toBeInTheDocument();
    expect(screen.getByText("Created: Dec 31, 2022")).toBeInTheDocument();
  });

  it("calls onSelect when Use Template button is clicked", () => {
    const mockOnSelect = vi.fn();
    const mockOnPreview = vi.fn();

    render(
      <TemplateCard
        template={mockTemplate}
        onSelect={mockOnSelect}
        onPreview={mockOnPreview}
      />,
    );

    fireEvent.click(screen.getByText("Use Template"));
    expect(mockOnSelect).toHaveBeenCalledWith(mockTemplate);
  });

  it("calls onPreview when Preview button is clicked", () => {
    const mockOnSelect = vi.fn();
    const mockOnPreview = vi.fn();

    render(
      <TemplateCard
        template={mockTemplate}
        onSelect={mockOnSelect}
        onPreview={mockOnPreview}
      />,
    );

    fireEvent.click(screen.getByText("Preview"));
    expect(mockOnPreview).toHaveBeenCalledWith(mockTemplate);
  });

  it("displays correct category color for different categories", () => {
    const salesTemplate = { ...mockTemplate, category: "sales" as const };
    const serviceTemplate = { ...mockTemplate, category: "service" as const };
    const partsTemplate = { ...mockTemplate, category: "parts" as const };
    const generalTemplate = { ...mockTemplate, category: "general" as const };

    const mockOnSelect = vi.fn();
    const mockOnPreview = vi.fn();

    const { rerender } = render(
      <TemplateCard
        template={salesTemplate}
        onSelect={mockOnSelect}
        onPreview={mockOnPreview}
      />,
    );
    expect(screen.getByText("sales")).toHaveClass(
      "bg-blue-100",
      "text-blue-800",
    );

    rerender(
      <TemplateCard
        template={serviceTemplate}
        onSelect={mockOnSelect}
        onPreview={mockOnPreview}
      />,
    );
    expect(screen.getByText("service")).toHaveClass(
      "bg-green-100",
      "text-green-800",
    );

    rerender(
      <TemplateCard
        template={partsTemplate}
        onSelect={mockOnSelect}
        onPreview={mockOnPreview}
      />,
    );
    expect(screen.getByText("parts")).toHaveClass(
      "bg-yellow-100",
      "text-yellow-800",
    );

    rerender(
      <TemplateCard
        template={generalTemplate}
        onSelect={mockOnSelect}
        onPreview={mockOnPreview}
      />,
    );
    expect(screen.getByText("general")).toHaveClass(
      "bg-gray-100",
      "text-gray-800",
    );
  });

  it("handles template with no description", () => {
    const templateWithoutDescription = {
      ...mockTemplate,
      description: undefined,
    };
    const mockOnSelect = vi.fn();
    const mockOnPreview = vi.fn();

    render(
      <TemplateCard
        template={templateWithoutDescription}
        onSelect={mockOnSelect}
        onPreview={mockOnPreview}
      />,
    );

    expect(screen.getByText("No description available")).toBeInTheDocument();
  });
});


