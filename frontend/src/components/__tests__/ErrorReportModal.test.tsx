import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import ErrorReportModal from "../ErrorReportModal";
import { mockAppError, mockFunctions, resetMocks } from "./setup";

describe("ErrorReportModal", () => {
  beforeEach(() => {
    resetMocks();
  });

  const props = {
    isOpen: true,
    onClose: mockFunctions.onClose,
    error: mockAppError,
    onSubmit: mockFunctions.onSubmit,
  };

  it("renders correctly", () => {
    const { getByText } = render(<ErrorReportModal {...props} />);
    expect(getByText("Report Error: Test error message")).toBeInTheDocument();
  });

  it("calls onClose when cancel button is clicked", () => {
    const { getByText } = render(<ErrorReportModal {...props} />);
    const cancelButton = getByText("Cancel");
    fireEvent.click(cancelButton);
    expect(props.onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onSubmit when submit button is clicked", async () => {
    const { getByText } = render(<ErrorReportModal {...props} />);
    const submitButton = getByText("Submit Report");
    fireEvent.click(submitButton);
    await waitFor(() => expect(props.onSubmit).toHaveBeenCalledTimes(1));
  });

  it("renders error message when error occurs", async () => {
    const { getByText } = render(<ErrorReportModal {...props} />);
    await waitFor(() =>
      expect(getByText("Test error message")).toBeInTheDocument(),
    );
  });
});


