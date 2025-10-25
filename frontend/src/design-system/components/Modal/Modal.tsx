import React, { useEffect, useRef, useCallback, createContext, useContext } from 'react';
import { cn } from '../../utils/cn';
import { COLORS } from '../../tokens/colors';
import type { ModalProps, ModalHeaderProps, ModalBodyProps, ModalFooterProps, ModalContextValue } from './Modal.types';

// Modal Context for nested components
const ModalContext = createContext<ModalContextValue | null>(null);

export const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used within a Modal component');
  }
  return context;
};

// Size configurations
const MODAL_SIZES = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  full: 'max-w-full mx-4'
} as const;

// Animation configurations
const ANIMATION_CLASSES = {
  fade: {
    overlay: 'animate-in fade-in duration-200',
    modal: 'animate-in fade-in zoom-in-95 duration-200'
  },
  slide: {
    overlay: 'animate-in fade-in duration-200',
    modal: 'animate-in slide-in-from-bottom-4 duration-200'
  },
  scale: {
    overlay: 'animate-in fade-in duration-200',
    modal: 'animate-in zoom-in-95 duration-200'
  },
  none: {
    overlay: '',
    modal: ''
  }
} as const;

// Modal Header Component
export const ModalHeader: React.FC<ModalHeaderProps> = ({
  title,
  onClose,
  showCloseButton = true,
  className,
  children
}) => {
  const modal = useModal();

  const handleClose = useCallback(() => {
    onClose?.();
    modal.onClose();
  }, [onClose, modal.onClose]);

  return (
    <div className={cn(
      'flex items-center justify-between px-6 py-4 border-b border-gray-200',
      className
    )}>
      {title && (
        <h3 className="text-lg font-semibold text-gray-900">
          {title}
        </h3>
      )}
      {children}
      {showCloseButton && (
        <button
          onClick={handleClose}
          className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          aria-label="Close modal"
        >
          <svg
            className="w-5 h-5 text-gray-400"
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
    </div>
  );
};

// Modal Body Component
export const ModalBody: React.FC<ModalBodyProps> = ({
  children,
  className,
  scrollable = true
}) => {
  return (
    <div
      className={cn(
        'px-6 py-4',
        scrollable && 'overflow-y-auto max-h-96',
        className
      )}
    >
      {children}
    </div>
  );
};

// Modal Footer Component
export const ModalFooter: React.FC<ModalFooterProps> = ({
  children,
  className,
  align = 'right'
}) => {
  const alignmentClasses = {
    left: 'justify-start',
    center: 'justify-center',
    right: 'justify-end',
    between: 'justify-between'
  };

  return (
    <div className={cn(
      'flex items-center px-6 py-4 border-t border-gray-200 bg-gray-50',
      alignmentClasses[align],
      className
    )}>
      {children}
    </div>
  );
};

// Main Modal Component
const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  showCloseButton = true,
  closeOnOverlayClick = true,
  closeOnEscape = true,
  footer,
  className,
  centered = true,
  animation = 'fade',
  zIndex = 50
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Focus management
  useEffect(() => {
    if (isOpen) {
      // Store previously focused element
      previousFocusRef.current = document.activeElement as HTMLElement;

      // Focus modal
      setTimeout(() => {
        modalRef.current?.focus();
      }, 100);

      // Prevent body scroll
      document.body.style.overflow = 'hidden';

      // Focus trap setup
      const focusableElements = modalRef.current?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const firstElement = focusableElements?.[0] as HTMLElement;
      const lastElement = focusableElements?.[focusableElements.length - 1] as HTMLElement;

      const handleTabKey = (e: KeyboardEvent) => {
        if (e.key === 'Tab') {
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
        }
      };

      document.addEventListener('keydown', handleTabKey);

      return () => {
        document.removeEventListener('keydown', handleTabKey);
      };
    } else {
      // Restore body scroll
      document.body.style.overflow = 'unset';

      // Restore focus
      if (previousFocusRef.current) {
        previousFocusRef.current.focus();
      }
    }
  }, [isOpen]);

  // Escape key handler
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (closeOnEscape && event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, closeOnEscape, onClose]);

  // Overlay click handler
  const handleOverlayClick = useCallback((event: React.MouseEvent) => {
    if (closeOnOverlayClick && event.target === event.currentTarget) {
      onClose();
    }
  }, [closeOnOverlayClick, onClose]);

  // Prevent rendering when closed
  if (!isOpen) return null;

  const modalContextValue: ModalContextValue = {
    onClose,
    size
  };

  return (
    <ModalContext.Provider value={modalContextValue}>
      <div
        className="fixed inset-0 flex items-center justify-center p-4"
        style={{ zIndex }}
      >
        {/* Backdrop */}
        <div
          className={cn(
            'fixed inset-0 bg-black bg-opacity-50 transition-opacity',
            ANIMATION_CLASSES[animation].overlay
          )}
          onClick={handleOverlayClick}
          aria-hidden="true"
        />

        {/* Modal */}
        <div
          ref={modalRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={title ? 'modal-title' : undefined}
          className={cn(
            'relative bg-white rounded-lg shadow-xl max-h-full overflow-hidden',
            MODAL_SIZES[size],
            ANIMATION_CLASSES[animation].modal,
            centered && 'my-auto',
            className
          )}
          tabIndex={-1}
        >
          {children}
        </div>
      </div>
    </ModalContext.Provider>
  );
};

// Compound component pattern
Modal.Header = ModalHeader;
Modal.Body = ModalBody;
Modal.Footer = ModalFooter;

export { Modal };
export default Modal;
