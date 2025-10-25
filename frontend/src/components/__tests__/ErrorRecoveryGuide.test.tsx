import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import ErrorRecoveryGuide from "../ErrorRecoveryGuide";
import { ErrorCategory, ErrorSeverity } from "../../types/error";

// Mock window.location
const mockLocation = {
  href: "",
  reload: vi.fn(),
};
Object.defineProperty(window, "location", {
  value: mockLocation,
  writable: true,
});

// Mock localStorage
const mockLocalStorage = {
  removeItem: vi.fn(),
};
Object.defineProperty(window, "localStorage", {
  value: mockLocalStorage,
  writable: true,
});

// Mock alert
global.alert = vi.fn();

describe("ErrorRecoveryGuide", () => {
  const defaultProps = {
    category: ErrorCategory.WORKFLOW,
    severity: ErrorSeverity.MEDIUM,
    errorMessage: "Workflow execution failed",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockLocation.href = "";
  });

  it("renders error recovery guide with correct title", () => {
    render(<ErrorRecoveryGuide {...defaultProps} />);

    expect(screen.getByText("Error Recovery Guide")).toBeInTheDocument();
    expect(screen.getByText("workflow • medium severity")).toBeInTheDocument();
  });

  it("displays appropriate recovery steps for workflow errors", () => {
    render(<ErrorRecoveryGuide {...defaultProps} />);

    expect(
      screen.getByText("Review Workflow Configuration"),
    ).toBeInTheDocument();
    expect(screen.getByText("Validate Input Parameters")).toBeInTheDocument();
    expect(screen.getByText("Test Individual Steps")).toBeInTheDocument();
  });

  it("displays authentication-specific recovery steps", () => {
    render(
      <ErrorRecoveryGuide
        {...defaultProps}
        category={ErrorCategory.AUTHENTICATION}
      />,
    );

    expect(screen.getByText("Verify Login Credentials")).toBeInTheDocument();
    expect(screen.getByText("Clear Browser Cache")).toBeInTheDocument();
    expect(screen.getByText("Log In Again")).toBeInTheDocument();
  });

  it("displays network-specific recovery steps", () => {
    render(
      <ErrorRecoveryGuide {...defaultProps} category={ErrorCategory.NETWORK} />,
    );

    expect(screen.getByText("Check Internet Connection")).toBeInTheDocument();
    expect(screen.getByText("Refresh the Page")).toBeInTheDocument();
    expect(screen.getByText("Wait and Retry")).toBeInTheDocument();
  });

  it("displays AI service-specific recovery steps", () => {
    render(
      <ErrorRecoveryGuide
        {...defaultProps}
        category={ErrorCategory.AI_SERVICE}
      />,
    );

    expect(screen.getByText("Simplify Your Request")).toBeInTheDocument();
    expect(screen.getByText("Review Content Guidelines")).toBeInTheDocument();
    expect(screen.getByText("Wait for Service Recovery")).toBeInTheDocument();
  });

  it("displays validation-specific recovery steps", () => {
    render(
      <ErrorRecoveryGuide
        {...defaultProps}
        category={ErrorCategory.VALIDATION}
      />,
    );

    expect(screen.getByText("Review Input Fields")).toBeInTheDocument();
    expect(screen.getByText("Verify Data Format")).toBeInTheDocument();
    expect(screen.getByText("Check Field Limits")).toBeInTheDocument();
  });

  it("shows retry step when onRetry is provided", () => {
    const onRetry = vi.fn();

    render(<ErrorRecoveryGuide {...defaultProps} onRetry={onRetry} />);

    expect(screen.getByText("Retry the Action")).toBeInTheDocument();
    expect(screen.getByText("Retry Now")).toBeInTheDocument();
  });

  it("shows contact support step for high severity errors", () => {
    const onContactSupport = vi.fn();

    render(
      <ErrorRecoveryGuide
        {...defaultProps}
        severity={ErrorSeverity.HIGH}
        onContactSupport={onContactSupport}
      />,
    );

    expect(screen.getByText("Contact Support")).toBeInTheDocument();
  });

  it("shows contact support step for critical severity errors", () => {
    const onContactSupport = vi.fn();

    render(
      <ErrorRecoveryGuide
        {...defaultProps}
        severity={ErrorSeverity.CRITICAL}
        onContactSupport={onContactSupport}
      />,
    );

    expect(screen.getByText("Contact Support")).toBeInTheDocument();
  });

  it("does not show contact support for low severity errors", () => {
    const onContactSupport = vi.fn();

    render(
      <ErrorRecoveryGuide
        {...defaultProps}
        severity={ErrorSeverity.LOW}
        onContactSupport={onContactSupport}
      />,
    );

    expect(screen.queryByText("Contact Support")).not.toBeInTheDocument();
  });

  it("allows marking steps as completed", () => {
    render(<ErrorRecoveryGuide {...defaultProps} />);

    const markDoneButton = screen.getAllByText("Mark as Done")[0];
    fireEvent.click(markDoneButton);

    // Check that the step is marked as completed
    expect(screen.getAllByText("Completed").length).toBeGreaterThan(0);
  });

  it("executes action when action button is clicked", () => {
    render(
      <ErrorRecoveryGuide {...defaultProps} category={ErrorCategory.NETWORK} />,
    );

    const refreshButton = screen.getByText("Refresh Page");
    fireEvent.click(refreshButton);

    expect(mockLocation.reload).toHaveBeenCalled();
  });

  it("handles clear cache action", () => {
    render(
      <ErrorRecoveryGuide
        {...defaultProps}
        category={ErrorCategory.AUTHENTICATION}
      />,
    );

    const clearCacheButton = screen.getByText("Clear Cache");
    fireEvent.click(clearCacheButton);

    expect(global.alert).toHaveBeenCalledWith(
      "Please clear your browser cache and cookies, then refresh the page.",
    );
  });

  it("handles login redirect action", () => {
    render(
      <ErrorRecoveryGuide
        {...defaultProps}
        category={ErrorCategory.AUTHENTICATION}
      />,
    );

    const loginButton = screen.getByText("Go to Login");
    fireEvent.click(loginButton);

    expect(mockLocalStorage.removeItem).toHaveBeenCalledWith("access_token");
    expect(mockLocation.href).toBe("/login");
  });

  it("handles retry action correctly", async () => {
    const onRetry = vi.fn().mockResolvedValue(undefined);

    render(<ErrorRecoveryGuide {...defaultProps} onRetry={onRetry} />);

    const retryButton = screen.getByText("Retry Now");
    fireEvent.click(retryButton);

    expect(screen.getByText("Retrying...")).toBeInTheDocument();

    await waitFor(() => {
      expect(onRetry).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(screen.getByText("Completed")).toBeInTheDocument();
    });
  });

  it("handles contact support action", () => {
    const onContactSupport = vi.fn();

    render(
      <ErrorRecoveryGuide
        {...defaultProps}
        severity={ErrorSeverity.HIGH}
        onContactSupport={onContactSupport}
      />,
    );

    // Find the Contact Support button (not the header)
    const contactButtons = screen.getAllByText("Contact Support");
    const contactButton = contactButtons.find(
      (element) => element.tagName === "BUTTON",
    );

    expect(contactButton).toBeInTheDocument();
    fireEvent.click(contactButton!);

    expect(onContactSupport).toHaveBeenCalled();
  });

  it("updates progress correctly", () => {
    render(<ErrorRecoveryGuide {...defaultProps} />);

    // Initially should show 0 completed
    expect(
      screen.getByText(/Progress: 0 of \d+ steps completed/),
    ).toBeInTheDocument();
    expect(screen.getByText("0%")).toBeInTheDocument();

    // Mark first step as done
    const markDoneButton = screen.getAllByText("Mark as Done")[0];
    fireEvent.click(markDoneButton);

    // Progress should update
    expect(
      screen.getByText(/Progress: 1 of \d+ steps completed/),
    ).toBeInTheDocument();
  });

  it("shows success message when all steps are completed", () => {
    render(<ErrorRecoveryGuide {...defaultProps} />);

    // Mark all steps as done
    const markDoneButtons = screen.getAllByText("Mark as Done");
    markDoneButtons.forEach((button) => {
      fireEvent.click(button);
    });

    expect(
      screen.getByText("All recovery steps completed!"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "You should now be able to proceed with your original action. If the issue persists, please contact support.",
      ),
    ).toBeInTheDocument();
  });

  it("applies correct severity styling", () => {
    const { rerender } = render(
      <ErrorRecoveryGuide
        {...defaultProps}
        severity={ErrorSeverity.CRITICAL}
      />,
    );

    expect(screen.getByText(/critical.*severity/)).toBeInTheDocument();

    rerender(
      <ErrorRecoveryGuide {...defaultProps} severity={ErrorSeverity.LOW} />,
    );

    expect(screen.getByText(/low.*severity/)).toBeInTheDocument();
  });

  it("handles unknown error category with default steps", () => {
    render(
      <ErrorRecoveryGuide {...defaultProps} category={ErrorCategory.UNKNOWN} />,
    );

    expect(screen.getByText("Refresh and Try Again")).toBeInTheDocument();
    expect(screen.getByText("Try a Different Browser")).toBeInTheDocument();
  });

  it("prevents action execution on completed steps", async () => {
    const onRetry = vi.fn();

    render(<ErrorRecoveryGuide {...defaultProps} onRetry={onRetry} />);

    const retryButton = screen.getByText("Retry Now");

    // Click once to complete
    fireEvent.click(retryButton);

    await waitFor(() => {
      expect(screen.getByText("Completed")).toBeInTheDocument();
    });

    // Try to click again - should not call onRetry again
    const completedButton = screen.getByText("Completed");
    fireEvent.click(completedButton);

    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});


