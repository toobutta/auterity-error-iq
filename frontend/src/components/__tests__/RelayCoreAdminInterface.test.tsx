import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import RelayCoreAdminInterface from "../RelayCoreAdminInterface";

describe("RelayCoreAdminInterface", () => {
  it("renders the admin interface with all sections", () => {
    render(<RelayCoreAdminInterface />);

    // Check for main title
    expect(screen.getByText("RelayCore Admin Interface")).toBeInTheDocument();

    // Check for Budget Management section
    expect(screen.getByText("Budget Management")).toBeInTheDocument();
    expect(screen.getByText(/Monthly Budget Limit/)).toBeInTheDocument();
    expect(screen.getByLabelText("Set Budget Limit")).toBeInTheDocument();

    // Check for Provider Configuration section
    expect(screen.getByText("Provider Configuration")).toBeInTheDocument();
    expect(screen.getByText("OpenAI")).toBeInTheDocument();
    expect(screen.getByText("Anthropic")).toBeInTheDocument();
    expect(screen.getByText("Google")).toBeInTheDocument();

    // Check for Cost Analytics placeholder
    expect(screen.getByText("Cost Analytics")).toBeInTheDocument();
    expect(
      screen.getByText("Cost analytics dashboard coming soon."),
    ).toBeInTheDocument();
  });

  it("displays correct budget information", () => {
    render(<RelayCoreAdminInterface />);

    expect(screen.getByText("$650 / $1000")).toBeInTheDocument();
  });
});


