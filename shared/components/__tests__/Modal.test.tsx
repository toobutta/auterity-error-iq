import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { vi, beforeEach } from "vitest";
import { Modal } from "../Modal";

describe("Modal", () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does not render when isOpen is false", () => {
    render(
      <Modal isOpen={false} onClose={mockOnClose}>
        <p>Modal content</p>
      </Modal>,
    );

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders when isOpen is true", () => {
    render(
      <Modal isOpen={true} onClose={mockOnClose}>
        <p>Modal content</p>
      </Modal>,
    );

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Modal content")).toBeInTheDocument();
  });

  it("renders with title", () => {
    render(
      <Modal isOpen={true} onClose={mockOnClose} title="Test Modal">
        <p>Modal content</p>
      </Modal>,
    );

    expect(screen.getByText("Test Modal")).toBeInTheDocument();
  });

  it("calls onClose when close button is clicked", () => {
    render(
      <Modal isOpen={true} onClose={mockOnClose} title="Test Modal">
        <p>Modal content</p>
      </Modal>,
    );

    const closeButton = screen.getByLabelText("Close modal");
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when overlay is clicked", () => {
    render(
      <Modal isOpen={true} onClose={mockOnClose} closeOnOverlayClick={true}>
        <p>Modal content</p>
      </Modal>,
    );

    const overlay = screen.getByRole("dialog").parentElement;
    fireEvent.click(overlay!);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it("does not call onClose when overlay is clicked and closeOnOverlayClick is false", () => {
    render(
      <Modal isOpen={true} onClose={mockOnClose} closeOnOverlayClick={false}>
        <p>Modal content</p>
      </Modal>,
    );

    const overlay = screen.getByRole("dialog").parentElement;
    fireEvent.click(overlay!);

    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it("calls onClose when Escape key is pressed", () => {
    render(
      <Modal isOpen={true} onClose={mockOnClose} closeOnEscape={true}>
        <p>Modal content</p>
      </Modal>,
    );

    fireEvent.keyDown(document, { key: "Escape" });

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it("does not call onClose when Escape key is pressed and closeOnEscape is false", () => {
    render(
      <Modal isOpen={true} onClose={mockOnClose} closeOnEscape={false}>
        <p>Modal content</p>
      </Modal>,
    );

    fireEvent.keyDown(document, { key: "Escape" });

    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it("renders footer when provided", () => {
    const footer = <button>Footer Button</button>;

    render(
      <Modal isOpen={true} onClose={mockOnClose} footer={footer}>
        <p>Modal content</p>
      </Modal>,
    );

    expect(screen.getByText("Footer Button")).toBeInTheDocument();
  });

  it("applies correct size classes", () => {
    const { rerender } = render(
      <Modal isOpen={true} onClose={mockOnClose} size="sm">
        <p>Small modal</p>
      </Modal>,
    );

    let modal = screen.getByRole("dialog");
    expect(modal).toHaveClass("max-w-md");

    rerender(
      <Modal isOpen={true} onClose={mockOnClose} size="lg">
        <p>Large modal</p>
      </Modal>,
    );

    modal = screen.getByRole("dialog");
    expect(modal).toHaveClass("max-w-4xl");
  });

  it("hides close button when showCloseButton is false", () => {
    render(
      <Modal
        isOpen={true}
        onClose={mockOnClose}
        title="Test Modal"
        showCloseButton={false}
      >
        <p>Modal content</p>
      </Modal>,
    );

    expect(screen.queryByLabelText("Close modal")).not.toBeInTheDocument();
  });
});
