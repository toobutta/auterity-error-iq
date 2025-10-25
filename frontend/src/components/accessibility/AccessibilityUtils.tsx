import React, { useEffect, useState, useRef } from "react";

// Focus management utilities
export const useFocusManagement = () => {
  const [focusedElement, setFocusedElement] = useState<HTMLElement | null>(
    null,
  );
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const captureFocus = () => {
    previousFocusRef.current = document.activeElement as HTMLElement;
  };

  const restoreFocus = () => {
    if (
      previousFocusRef.current &&
      typeof previousFocusRef.current.focus === "function"
    ) {
      previousFocusRef.current.focus();
    }
  };

  return {
    focusedElement,
    setFocusedElement,
    captureFocus,
    restoreFocus,
  };
};

// Focus trap hook
export const useFocusTrap = (containerRef: React.RefObject<HTMLElement>) => {
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    const firstFocusable = focusableElements[0] as HTMLElement;
    const lastFocusable = focusableElements[
      focusableElements.length - 1
    ] as HTMLElement;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Tab") {
        if (e.shiftKey) {
          if (document.activeElement === firstFocusable) {
            e.preventDefault();
            lastFocusable?.focus();
          }
        } else {
          if (document.activeElement === lastFocusable) {
            e.preventDefault();
            firstFocusable?.focus();
          }
        }
      }
    };

    container.addEventListener("keydown", handleKeyDown);
    firstFocusable?.focus();

    return () => {
      container.removeEventListener("keydown", handleKeyDown);
    };
  }, [containerRef]);
};

// Keyboard navigation hook
export const useKeyboardNavigation = (
  items: Array<{ id: string; disabled?: boolean }>,
  onSelect?: (id: string) => void,
  orientation: "horizontal" | "vertical" = "vertical",
) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isNavigating, setIsNavigating] = useState(false);

  const handleKeyDown = (e: KeyboardEvent) => {
    const enabledItems = items.filter((item) => !item.disabled);
    if (enabledItems.length === 0) return;

    const currentEnabledIndex = enabledItems.findIndex(
      (item) => item.id === items[activeIndex]?.id,
    );

    let nextIndex = currentEnabledIndex;

    switch (e.key) {
      case "ArrowDown":
        if (orientation === "vertical") {
          e.preventDefault();
          nextIndex = (currentEnabledIndex + 1) % enabledItems.length;
          setIsNavigating(true);
        }
        break;
      case "ArrowUp":
        if (orientation === "vertical") {
          e.preventDefault();
          nextIndex =
            currentEnabledIndex === 0
              ? enabledItems.length - 1
              : currentEnabledIndex - 1;
          setIsNavigating(true);
        }
        break;
      case "ArrowRight":
        if (orientation === "horizontal") {
          e.preventDefault();
          nextIndex = (currentEnabledIndex + 1) % enabledItems.length;
          setIsNavigating(true);
        }
        break;
      case "ArrowLeft":
        if (orientation === "horizontal") {
          e.preventDefault();
          nextIndex =
            currentEnabledIndex === 0
              ? enabledItems.length - 1
              : currentEnabledIndex - 1;
          setIsNavigating(true);
        }
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        if (onSelect && enabledItems[currentEnabledIndex]) {
          onSelect(enabledItems[currentEnabledIndex].id);
        }
        break;
      case "Home":
        e.preventDefault();
        nextIndex = 0;
        setIsNavigating(true);
        break;
      case "End":
        e.preventDefault();
        nextIndex = enabledItems.length - 1;
        setIsNavigating(true);
        break;
    }

    if (nextIndex !== currentEnabledIndex) {
      const actualIndex = items.findIndex(
        (item) => item.id === enabledItems[nextIndex].id,
      );
      setActiveIndex(actualIndex);
    }
  };

  return {
    activeIndex,
    setActiveIndex,
    isNavigating,
    setIsNavigating,
    handleKeyDown,
  };
};

// Screen reader announcements
export const useScreenReader = () => {
  const [announcements, setAnnouncements] = useState<string[]>([]);

  const announce = (
    message: string,
    priority: "polite" | "assertive" = "polite",
  ) => {
    setAnnouncements((prev) => [...prev, message]);

    // Create temporary announcement element
    const announcement = document.createElement("div");
    announcement.setAttribute("aria-live", priority);
    announcement.setAttribute("aria-atomic", "true");
    announcement.className = "sr-only";
    announcement.textContent = message;

    document.body.appendChild(announcement);

    // Remove after announcement
    setTimeout(() => {
      document.body.removeChild(announcement);
      setAnnouncements((prev) => prev.filter((msg) => msg !== message));
    }, 1000);
  };

  const clearAnnouncements = () => {
    setAnnouncements([]);
  };

  return {
    announcements,
    announce,
    clearAnnouncements,
  };
};

// Enhanced Button Component with accessibility
interface AccessibleButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  loadingText?: string;
  children: React.ReactNode;
  ariaLabel?: string;
  ariaDescribedBy?: string;
}

export const AccessibleButton: React.FC<AccessibleButtonProps> = ({
  variant = "primary",
  size = "md",
  loading = false,
  loadingText = "Loading...",
  children,
  ariaLabel,
  ariaDescribedBy,
  disabled,
  className = "",
  ...props
}) => {
  const baseClasses =
    "font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";

  const variantClasses = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500",
    secondary:
      "bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500",
    danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500",
    ghost: "bg-transparent text-blue-600 hover:bg-blue-50 focus:ring-blue-500",
  };

  const sizeClasses = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-base",
    lg: "px-6 py-3 text-lg",
  };

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      disabled={disabled || loading}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
      aria-disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent" />
          <span>{loadingText}</span>
        </div>
      ) : (
        children
      )}
    </button>
  );
};

// Modal with accessibility features
interface AccessibleModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
}

export const AccessibleModal: React.FC<AccessibleModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = "md",
  closeOnOverlayClick = true,
  closeOnEscape = true,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const { captureFocus, restoreFocus } = useFocusManagement();
  useFocusTrap(modalRef);

  useEffect(() => {
    if (isOpen) {
      captureFocus();
      document.body.style.overflow = "hidden";
    } else {
      restoreFocus();
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen, captureFocus, restoreFocus]);

  useEffect(() => {
    if (!isOpen || !closeOnEscape) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, closeOnEscape, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
        onClick={closeOnOverlayClick ? onClose : undefined}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        ref={modalRef}
        className={`relative glass-card-strong ${sizeClasses[size]} w-full max-h-[90vh] overflow-y-auto`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2
            id="modal-title"
            className="text-xl font-semibold text-gray-900 dark:text-gray-100"
          >
            {title}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Close modal"
          >
            <svg
              className="w-5 h-5"
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
        </div>

        {/* Content */}
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
};

// Skip link component
interface SkipLinkProps {
  href: string;
  children: React.ReactNode;
}

export const SkipLink: React.FC<SkipLinkProps> = ({ href, children }) => {
  return (
    <a
      href={href}
      className="sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 z-50 bg-blue-600 text-white px-4 py-2 rounded-br-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      {children}
    </a>
  );
};

// Reduced motion detection
export const useReducedMotion = () => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = () => setPrefersReducedMotion(mediaQuery.matches);
    mediaQuery.addEventListener("change", handleChange);

    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  return prefersReducedMotion;
};

// High contrast detection
export const useHighContrast = () => {
  const [prefersHighContrast, setPrefersHighContrast] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-contrast: high)");
    setPrefersHighContrast(mediaQuery.matches);

    const handleChange = () => setPrefersHighContrast(mediaQuery.matches);
    mediaQuery.addEventListener("change", handleChange);

    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  return prefersHighContrast;
};


