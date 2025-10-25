import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import TemplateLibrary from "../TemplateLibrary";
import { Template } from "../../types/template";
import * as templatesApi from "../../api/templates";

// Mock the templates API
vi.mock("../../api/templates");

const mockTemplates: Template[] = [
  {
    id: "template-1",
    name: "Customer Inquiry Template",
    description: "A template for handling customer inquiries",
    category: "sales",
    definition: { nodes: [], edges: [] },
    isActive: true,
    createdAt: "2023-01-01T00:00:00Z",
    updatedAt: "2023-01-01T00:00:00Z",
    parameters: [],
  },
  {
    id: "template-2",
    name: "Service Request Template",
    description: "A template for processing service requests",
    category: "service",
    definition: { nodes: [], edges: [] },
    isActive: true,
    createdAt: "2023-01-02T00:00:00Z",
    updatedAt: "2023-01-02T00:00:00Z",
    parameters: [],
  },
];

describe("TemplateLibrary", () => {
  const mockOnTemplateSelect = vi.fn();
  const mockOnTemplatePreview = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock API responses
    vi.mocked(templatesApi.getTemplates).mockResolvedValue({
      templates: mockTemplates,
      total: 2,
      page: 1,
      pageSize: 12,
    });

    vi.mocked(templatesApi.getTemplateCategories).mockResolvedValue({
      categories: ["sales", "service", "parts", "general"],
    });
  });

  it("renders templates correctly", async () => {
    render(
      <TemplateLibrary
        onTemplateSelect={mockOnTemplateSelect}
        onTemplatePreview={mockOnTemplatePreview}
      />,
    );

    // Wait for templates to load
    await waitFor(() => {
      expect(screen.getByText("Customer Inquiry Template")).toBeInTheDocument();
      expect(screen.getByText("Service Request Template")).toBeInTheDocument();
    });

    expect(screen.getByText("Showing 2 of 2 templates")).toBeInTheDocument();
  });

  it("handles search functionality", async () => {
    render(
      <TemplateLibrary
        onTemplateSelect={mockOnTemplateSelect}
        onTemplatePreview={mockOnTemplatePreview}
      />,
    );

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText("Customer Inquiry Template")).toBeInTheDocument();
    });

    // Search for a specific template
    const searchInput = screen.getByPlaceholderText(
      "Search by name, description, or tags...",
    );
    fireEvent.change(searchInput, { target: { value: "customer" } });

    // Wait for the API to be called with search parameters
    await waitFor(() => {
      expect(templatesApi.getTemplates).toHaveBeenCalledWith(
        expect.objectContaining({
          search: "customer",
        }),
      );
    });
  });

  it("handles category filtering", async () => {
    render(
      <TemplateLibrary
        onTemplateSelect={mockOnTemplateSelect}
        onTemplatePreview={mockOnTemplatePreview}
      />,
    );

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText("Customer Inquiry Template")).toBeInTheDocument();
    });

    // Filter by category
    const categorySelect = screen.getByLabelText("Category");
    fireEvent.change(categorySelect, { target: { value: "sales" } });

    // Wait for the API to be called with category filter
    await waitFor(() => {
      expect(templatesApi.getTemplates).toHaveBeenCalledWith(
        expect.objectContaining({
          category: "sales",
        }),
      );
    });
  });

  it("handles sorting", async () => {
    render(
      <TemplateLibrary
        onTemplateSelect={mockOnTemplateSelect}
        onTemplatePreview={mockOnTemplatePreview}
      />,
    );

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText("Customer Inquiry Template")).toBeInTheDocument();
    });

    // Change sort order
    const sortSelect = screen.getByLabelText("Sort By");
    fireEvent.change(sortSelect, { target: { value: "created_at-desc" } });

    // Wait for the API to be called with sort parameters
    await waitFor(() => {
      expect(templatesApi.getTemplates).toHaveBeenCalledWith(
        expect.objectContaining({
          sortBy: "created_at",
          sortOrder: "desc",
        }),
      );
    });
  });

  it("clears filters when clear button is clicked", async () => {
    render(
      <TemplateLibrary
        onTemplateSelect={mockOnTemplateSelect}
        onTemplatePreview={mockOnTemplatePreview}
      />,
    );

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText("Customer Inquiry Template")).toBeInTheDocument();
    });

    // Apply some filters
    const searchInput = screen.getByPlaceholderText(
      "Search by name, description, or tags...",
    );
    fireEvent.change(searchInput, { target: { value: "customer" } });

    const categorySelect = screen.getByLabelText("Category");
    fireEvent.change(categorySelect, { target: { value: "sales" } });

    // Wait for filters to be applied
    await waitFor(() => {
      expect(screen.getByText("Clear all filters")).toBeInTheDocument();
    });

    // Clear filters
    fireEvent.click(screen.getByText("Clear all filters"));

    // Check that filters are cleared
    expect(searchInput).toHaveValue("");
    expect(categorySelect).toHaveValue("");
  });

  it("displays loading state", () => {
    // Mock a delayed response
    vi.mocked(templatesApi.getTemplates).mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                templates: mockTemplates,
                total: 2,
                page: 1,
                pageSize: 12,
              }),
            1000,
          ),
        ),
    );

    render(
      <TemplateLibrary
        onTemplateSelect={mockOnTemplateSelect}
        onTemplatePreview={mockOnTemplatePreview}
      />,
    );

    expect(screen.getByText("Loading templates...")).toBeInTheDocument();
  });

  it("displays error state", async () => {
    // Mock API error
    vi.mocked(templatesApi.getTemplates).mockRejectedValue(
      new Error("API Error"),
    );

    render(
      <TemplateLibrary
        onTemplateSelect={mockOnTemplateSelect}
        onTemplatePreview={mockOnTemplatePreview}
      />,
    );

    await waitFor(() => {
      expect(
        screen.getByText("Failed to load templates. Please try again."),
      ).toBeInTheDocument();
    });
  });

  it("displays empty state when no templates found", async () => {
    // Mock empty response
    vi.mocked(templatesApi.getTemplates).mockResolvedValue({
      templates: [],
      total: 0,
      page: 1,
      pageSize: 12,
    });

    render(
      <TemplateLibrary
        onTemplateSelect={mockOnTemplateSelect}
        onTemplatePreview={mockOnTemplatePreview}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("No templates found")).toBeInTheDocument();
      expect(
        screen.getByText("No templates are available at the moment."),
      ).toBeInTheDocument();
    });
  });
});


