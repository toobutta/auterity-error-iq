import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi, beforeEach, afterEach } from "vitest";
import { ErrorToast } from "../ErrorToast";
import { AppError, ErrorSeverity, ErrorCategory } from "../../types/error";

const mockError: AppError = {
  id: "test-error-1",
  code: "TEST_ERROR",
  message: "Test error message",
  userFriendlyMessage: "Something went wrong",
  severity: ErrorSeverity.HIGH,
  category: ErrorCategory.SYSTEM,
  timestamp: new Date(),
  retryable: true,
  correlationId: "test-correlation-id",
  details: "Detailed error information",
  context: {
    component: "TestComponent",
    action: "testAction",
  },
};

describe("ErrorToast", () => {
  const mockOnDismiss = vi.fn();
  const mockOnRetry = vi.fn();
  const mockOnReport = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders error toast with basic information", () => {
    render(
      <ErrorToast
        error={mockError}
        onDismiss={mockOnDismiss}
        autoHide={false}
      />,
    );

    expect(screen.getByText("Error")).toBeInTheDocument();
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    expect(screen.getByLabelText("Close notification")).toBeInTheDocument();
  });

  it("shows severity-specific styling for critical errors", () => {
    const criticalError = { ...mockError, severity: ErrorSeverity.CRITICAL };

    render(
      <ErrorToast
        error={criticalError}
        onDismiss={mockOnDismiss}
        autoHide={false}
      />,
    );

    expect(screen.getByText("Critical Error")).toBeInTheDocument();
  });

  it("calls onDismiss when close button is clicked", () => {
    render(
      <ErrorToast
        error={mockError}
        onDismiss={mockOnDismiss}
        autoHide={false}
      />,
    );

    const closeButton = screen.getByLabelText("Close notification");
    fireEvent.click(closeButton);

    expect(mockOnDismiss).toHaveBeenCalledTimes(1);
  });

  it("shows retry button for retryable errors", () => {
    render(
      <ErrorToast
        error={mockError}
        onDismiss={mockOnDismiss}
        onRetry={mockOnRetry}
        autoHide={false}
      />,
    );

    const retryButton = screen.getByText("Retry");
    expect(retryButton).toBeInTheDocument();

    fireEvent.click(retryButton);
    expect(mockOnRetry).toHaveBeenCalledTimes(1);
  });

  it("has proper accessibility attributes", () => {
    render(
      <ErrorToast
        error={mockError}
        onDismiss={mockOnDismiss}
        autoHide={false}
      />,
    );

    const toast = screen.getByRole("alert");
    expect(toast).toHaveAttribute("aria-live", "assertive");
    expect(toast).toHaveAttribute("aria-atomic", "true");
  });
});
