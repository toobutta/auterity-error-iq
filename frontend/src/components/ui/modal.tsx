import * as React from "react";
import { cn } from "../../lib/utils";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  description?: string;
  size?: "sm" | "md" | "lg" | "xl" | "full";
  variant?: "default" | "glass" | "centered";
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  showCloseButton?: boolean;
  className?: string;
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  children,
  title,
  description,
  size = "md",
  variant = "default",
  closeOnOverlayClick = true,
  closeOnEscape = true,
  showCloseButton = true,
  className,
}) => {
  const modalRef = React.useRef<HTMLDivElement>(null);

  // Handle escape key
  React.useEffect(() => {
    if (!closeOnEscape || !isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, closeOnEscape, onClose]);

  // Handle focus trap
  React.useEffect(() => {
    if (!isOpen) return;

    const modal = modalRef.current;
    if (!modal) return;

    const focusableElements = modal.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    ) as NodeListOf<HTMLElement>;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement?.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement?.focus();
          e.preventDefault();
        }
      }
    };

    modal.addEventListener("keydown", handleTabKey);
    firstElement?.focus();

    return () => {
      modal.removeEventListener("keydown", handleTabKey);
    };
  }, [isOpen]);

  // Prevent body scroll when modal is open
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
    full: "max-w-full m-4",
  };

  const variantClasses = {
    default: "bg-white dark:bg-neutral-900 shadow-2xl",
    glass: "glass backdrop-blur-xl",
    centered: "bg-white dark:bg-neutral-900 shadow-2xl",
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (closeOnOverlayClick && e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={handleOverlayClick}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-300" />

      {/* Modal */}
      <div
        ref={modalRef}
        className={cn(
          "relative w-full rounded-2xl border border-neutral-200 dark:border-neutral-800",
          "transform transition-all duration-300 animate-in zoom-in-95 slide-in-from-bottom-8",
          sizeClasses[size],
          variantClasses[variant],
          className,
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? "modal-title" : undefined}
        aria-describedby={description ? "modal-description" : undefined}
      >
        {/* Close button */}
        {showCloseButton && (
          <button
            onClick={onClose}
            className="absolute right-4 top-4 z-10 rounded-lg p-2 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-200 transition-colors"
            aria-label="Close modal"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}

        {/* Header */}
        {(title || description) && (
          <div className="border-b border-neutral-200 dark:border-neutral-800 px-6 py-4">
            {title && (
              <h2
                id="modal-title"
                className="text-xl font-semibold text-neutral-900 dark:text-neutral-100"
              >
                {title}
              </h2>
            )}
            {description && (
              <p
                id="modal-description"
                className="mt-2 text-sm text-neutral-600 dark:text-neutral-400"
              >
                {description}
              </p>
            )}
          </div>
        )}

        {/* Content */}
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
};

// Modal components for composition
export interface ModalHeaderProps {
  children: React.ReactNode;
  className?: string;
}

const ModalHeader: React.FC<ModalHeaderProps> = ({ children, className }) => (
  <div
    className={cn(
      "border-b border-neutral-200 dark:border-neutral-800 px-6 py-4",
      className,
    )}
  >
    {children}
  </div>
);

export interface ModalBodyProps {
  children: React.ReactNode;
  className?: string;
}

const ModalBody: React.FC<ModalBodyProps> = ({ children, className }) => (
  <div className={cn("p-6", className)}>{children}</div>
);

export interface ModalFooterProps {
  children: React.ReactNode;
  className?: string;
}

const ModalFooter: React.FC<ModalFooterProps> = ({ children, className }) => (
  <div
    className={cn(
      "border-t border-neutral-200 dark:border-neutral-800 px-6 py-4",
      className,
    )}
  >
    {children}
  </div>
);

// Specialized Error Detail Modal for Error-IQ
export interface ErrorDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  error?: {
    id: string;
    message: string;
    severity: "critical" | "high" | "medium" | "low";
    stackTrace?: string;
    timestamp: Date;
    affectedUsers?: number;
  };
}

const ErrorDetailModal: React.FC<ErrorDetailModalProps> = ({
  isOpen,
  onClose,
  error,
}) => {
  if (!error) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="xl"
      title="Error Details"
      description={`Error ID: ${error.id}`}
    >
      <div className="space-y-6">
        {/* Error Overview */}
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100">
              {error.message}
            </h3>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
              Occurred on {error.timestamp.toLocaleDateString()} at{" "}
              {error.timestamp.toLocaleTimeString()}
            </p>
          </div>

          {error.affectedUsers && (
            <div className="text-sm">
              <span className="font-medium text-neutral-900 dark:text-neutral-100">
                Affected Users:
              </span>
              <span className="ml-2 text-neutral-600 dark:text-neutral-400">
                {error.affectedUsers.toLocaleString()}
              </span>
            </div>
          )}
        </div>

        {/* Stack Trace */}
        {error.stackTrace && (
          <div>
            <h4 className="text-md font-medium text-neutral-900 dark:text-neutral-100 mb-3">
              Stack Trace
            </h4>
            <pre className="bg-neutral-50 dark:bg-neutral-800 rounded-lg p-4 text-xs overflow-x-auto text-neutral-800 dark:text-neutral-200">
              {error.stackTrace}
            </pre>
          </div>
        )}
      </div>
    </Modal>
  );
};

Modal.displayName = "Modal";
ModalHeader.displayName = "ModalHeader";
ModalBody.displayName = "ModalBody";
ModalFooter.displayName = "ModalFooter";
ErrorDetailModal.displayName = "ErrorDetailModal";

export { Modal, ModalHeader, ModalBody, ModalFooter, ErrorDetailModal };


