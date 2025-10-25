import { render, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import RetryWorkflowModal from "../RetryWorkflowModal";
import { mockAppError, mockFunctions, resetMocks } from "./setup";

describe("RetryWorkflowModal", () => {
  beforeEach(() => {
    resetMocks();
  });

  const props = {
    isOpen: true,
    onClose: mockFunctions.onClose,
    workflowId: "workflow-1",
    executionId: "execution-1",
    error: mockAppError,
    onRetry: mockFunctions.onRetry,
  };

  it("renders correctly", () => {
    const { getByText } = render(<RetryWorkflowModal {...props} />);
    expect(getByText("Retry Workflow: workflow-1")).toBeInTheDocument();
  });

  it("calls onClose when cancel button is clicked", () => {
    const { getByText } = render(<RetryWorkflowModal {...props} />);
    const cancelButton = getByText("Cancel");
    fireEvent.click(cancelButton);
    expect(props.onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onRetry when retry button is clicked", async () => {
    const { getByText } = render(<RetryWorkflowModal {...props} />);
    const retryButton = getByText("Retry Workflow");
    fireEvent.click(retryButton);
    await waitFor(() => expect(props.onRetry).toHaveBeenCalledTimes(1));
  });

  it("renders error message when error occurs", async () => {
    const { getByText } = render(<RetryWorkflowModal {...props} />);
    await waitFor(() =>
      expect(getByText("Test error message")).toBeInTheDocument(),
    );
  });
});


