import React, { forwardRef, useEffect, useState } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../../utils/cn';

const modalVariants = cva(
  'fixed inset-0 z-50 flex items-center justify-center',
  {
    variants: {
      variant: {
        default: '',
        blur: 'backdrop-blur-sm',
        glass: 'backdrop-blur-md',
        dark: 'bg-black/50',
      },
      animation: {
        none: '',
        fade: 'animate-in fade-in duration-300',
        slideUp: 'animate-in slide-in-from-bottom duration-300',
        slideDown: 'animate-in slide-in-from-top duration-300',
        scale: 'animate-in zoom-in-95 duration-300',
        bounce: 'animate-in bounce-in duration-300',
      },
    },
    defaultVariants: {
      variant: 'default',
      animation: 'fade',
    },
  }
);

const modalBackdropVariants = cva(
  'absolute inset-0 bg-black/50',
  {
    variants: {
      variant: {
        default: 'bg-black/50',
        blur: 'backdrop-blur-sm bg-black/30',
        glass: 'backdrop-blur-md bg-white/10',
        dark: 'bg-black/80',
        none: '',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

const modalContentVariants = cva(
  'relative bg-background border shadow-lg rounded-lg',
  {
    variants: {
      size: {
        default: 'max-w-lg w-full mx-4',
        sm: 'max-w-md w-full mx-4',
        lg: 'max-w-2xl w-full mx-4',
        xl: 'max-w-4xl w-full mx-4',
        full: 'max-w-full w-full mx-4 max-h-full',
        'screen-sm': 'max-w-screen-sm w-full mx-4',
        'screen-md': 'max-w-screen-md w-full mx-4',
        'screen-lg': 'max-w-screen-lg w-full mx-4',
        'screen-xl': 'max-w-screen-xl w-full mx-4',
      },
      animation: {
        none: '',
        fade: 'animate-in fade-in-0 zoom-in-95 duration-200',
        slideUp: 'animate-in slide-in-from-bottom-4 duration-200',
        slideDown: 'animate-in slide-in-from-top-4 duration-200',
        scale: 'animate-in zoom-in-95 duration-200',
        bounce: 'animate-in bounce-in duration-300',
      },
    },
    defaultVariants: {
      size: 'default',
      animation: 'fade',
    },
  }
);

export interface ModalProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof modalVariants> {
  open: boolean;
  onOpenChange?: (open: boolean) => void;
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  showCloseButton?: boolean;
  preventScroll?: boolean;
}

const Modal = forwardRef<HTMLDivElement, ModalProps>(
  ({
    className,
    variant,
    animation,
    open,
    onOpenChange,
    closeOnOverlayClick = true,
    closeOnEscape = true,
    showCloseButton = true,
    preventScroll = true,
    children,
    ...props
  }, ref) => {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
      setMounted(true);
    }, []);

    useEffect(() => {
      if (open && preventScroll) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = '';
      }

      return () => {
        document.body.style.overflow = '';
      };
    }, [open, preventScroll]);

    useEffect(() => {
      const handleEscape = (event: KeyboardEvent) => {
        if (event.key === 'Escape' && closeOnEscape) {
          onOpenChange?.(false);
        }
      };

      if (open) {
        document.addEventListener('keydown', handleEscape);
      }

      return () => {
        document.removeEventListener('keydown', handleEscape);
      };
    }, [open, closeOnEscape, onOpenChange]);

    if (!mounted || !open) {
      return null;
    }

    const handleOverlayClick = (event: React.MouseEvent) => {
      if (event.target === event.currentTarget && closeOnOverlayClick) {
        onOpenChange?.(false);
      }
    };

    return (
      <div
        ref={ref}
        className={cn(modalVariants({ variant, animation }))}
        onClick={handleOverlayClick}
        {...props}
      >
        <div className={cn(modalBackdropVariants({ variant }))} />
        <div className="relative z-10">
          {children}
        </div>
      </div>
    );
  }
);

Modal.displayName = 'Modal';

export interface ModalContentProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof modalContentVariants> {
  showCloseButton?: boolean;
  onClose?: () => void;
}

const ModalContent = forwardRef<HTMLDivElement, ModalContentProps>(
  ({
    className,
    size,
    animation,
    showCloseButton = true,
    onClose,
    children,
    ...props
  }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(modalContentVariants({ size, animation }), className)}
        onClick={(e) => e.stopPropagation()}
        {...props}
      >
        {showCloseButton && onClose && (
          <button
            onClick={onClose}
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            <span className="sr-only">Close</span>
          </button>
        )}
        {children}
      </div>
    );
  }
);

ModalContent.displayName = 'ModalContent';

export interface ModalHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  showCloseButton?: boolean;
  onClose?: () => void;
}

const ModalHeader = forwardRef<HTMLDivElement, ModalHeaderProps>(
  ({ className, showCloseButton, onClose, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'flex flex-col space-y-1.5 text-center sm:text-left',
        showCloseButton && 'pr-8',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
);

ModalHeader.displayName = 'ModalHeader';

export interface ModalTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {}

const ModalTitle = forwardRef<HTMLHeadingElement, ModalTitleProps>(
  ({ className, ...props }, ref) => (
    <h2
      ref={ref}
      className={cn('text-lg font-semibold leading-none tracking-tight', className)}
      {...props}
    />
  )
);

ModalTitle.displayName = 'ModalTitle';

export interface ModalDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {}

const ModalDescription = forwardRef<HTMLParagraphElement, ModalDescriptionProps>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn('text-sm text-muted-foreground', className)}
      {...props}
    />
  )
);

ModalDescription.displayName = 'ModalDescription';

export interface ModalBodyProps extends React.HTMLAttributes<HTMLDivElement> {}

const ModalBody = forwardRef<HTMLDivElement, ModalBodyProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex-1 overflow-y-auto py-4', className)}
      {...props}
    />
  )
);

ModalBody.displayName = 'ModalBody';

export interface ModalFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  justify?: 'start' | 'center' | 'end' | 'between';
}

const ModalFooter = forwardRef<HTMLDivElement, ModalFooterProps>(
  ({ className, justify = 'end', ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'flex shrink-0 gap-2 pt-4',
        {
          'justify-start': justify === 'start',
          'justify-center': justify === 'center',
          'justify-end': justify === 'end',
          'justify-between': justify === 'between',
        },
        className
      )}
      {...props}
    />
  )
);

ModalFooter.displayName = 'ModalFooter';

// Enhanced modal components
export interface ConfirmModalProps extends ModalProps {
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: 'default' | 'destructive' | 'success';
  onConfirm: () => void;
  onCancel?: () => void;
  loading?: boolean;
}

const ConfirmModal = forwardRef<HTMLDivElement, ConfirmModalProps>(
  ({
    title,
    description,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    confirmVariant = 'default',
    onConfirm,
    onCancel,
    loading = false,
    children,
    ...modalProps
  }, ref) => {
    const handleCancel = () => {
      onCancel?.();
      modalProps.onOpenChange?.(false);
    };

    const handleConfirm = () => {
      onConfirm();
      if (!loading) {
        modalProps.onOpenChange?.(false);
      }
    };

    return (
      <Modal {...modalProps}>
        <ModalContent ref={ref} size="sm">
          <ModalHeader>
            <ModalTitle>{title}</ModalTitle>
            {description && <ModalDescription>{description}</ModalDescription>}
          </ModalHeader>
          {children && <ModalBody>{children}</ModalBody>}
          <ModalFooter>
            <button
              onClick={handleCancel}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
            >
              {cancelText}
            </button>
            <button
              onClick={handleConfirm}
              disabled={loading}
              className={cn(
                'px-4 py-2 text-sm font-medium rounded-md transition-colors disabled:opacity-50',
                {
                  'bg-primary text-primary-foreground hover:bg-primary/90': confirmVariant === 'default',
                  'bg-destructive text-destructive-foreground hover:bg-destructive/90': confirmVariant === 'destructive',
                  'bg-green-600 text-white hover:bg-green-700': confirmVariant === 'success',
                }
              )}
            >
              {loading ? 'Loading...' : confirmText}
            </button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    );
  }
);

ConfirmModal.displayName = 'ConfirmModal';

export interface AlertModalProps extends ModalProps {
  title: string;
  description?: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  onClose?: () => void;
}

const AlertModal = forwardRef<HTMLDivElement, AlertModalProps>(
  ({
    title,
    description,
    type = 'info',
    onClose,
    children,
    ...modalProps
  }, ref) => {
    const handleClose = () => {
      onClose?.();
      modalProps.onOpenChange?.(false);
    };

    const iconConfig = {
      info: {
        icon: (
          <svg className="w-6 h-6 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        ),
        color: 'text-blue-500',
      },
      success: {
        icon: (
          <svg className="w-6 h-6 text-green-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        ),
        color: 'text-green-500',
      },
      warning: {
        icon: (
          <svg className="w-6 h-6 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        ),
        color: 'text-yellow-500',
      },
      error: {
        icon: (
          <svg className="w-6 h-6 text-red-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        ),
        color: 'text-red-500',
      },
    };

    const config = iconConfig[type];

    return (
      <Modal {...modalProps}>
        <ModalContent ref={ref} size="sm">
          <ModalHeader>
            <div className="flex items-center gap-3">
              {config.icon}
              <ModalTitle>{title}</ModalTitle>
            </div>
            {description && <ModalDescription>{description}</ModalDescription>}
          </ModalHeader>
          {children && <ModalBody>{children}</ModalBody>}
          <ModalFooter>
            <button
              onClick={handleClose}
              className="w-full px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              OK
            </button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    );
  }
);

AlertModal.displayName = 'AlertModal';

export interface DrawerModalProps extends ModalProps {
  position?: 'left' | 'right' | 'top' | 'bottom';
}

const DrawerModal = forwardRef<HTMLDivElement, DrawerModalProps>(
  ({ position = 'right', className, children, ...modalProps }, ref) => {
    const positionClasses = {
      left: 'animate-in slide-in-from-left duration-300',
      right: 'animate-in slide-in-from-right duration-300',
      top: 'animate-in slide-in-from-top duration-300',
      bottom: 'animate-in slide-in-from-bottom duration-300',
    };

    return (
      <Modal {...modalProps}>
        <ModalContent
          ref={ref}
          size="full"
          className={cn(
            'fixed h-full w-80 border-0 rounded-none',
            {
              'left-0 top-0': position === 'left',
              'right-0 top-0': position === 'right',
              'top-0 left-0': position === 'top',
              'bottom-0 left-0': position === 'bottom',
            },
            positionClasses[position],
            className
          )}
        >
          {children}
        </ModalContent>
      </Modal>
    );
  }
);

DrawerModal.displayName = 'DrawerModal';

export {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalBody,
  ModalFooter,
  ConfirmModal,
  AlertModal,
  DrawerModal,
  modalVariants,
  modalBackdropVariants,
  modalContentVariants,
};
