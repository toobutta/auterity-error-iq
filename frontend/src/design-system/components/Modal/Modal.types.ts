import React from 'react';

export interface ModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback when modal should close */
  onClose: () => void;
  /** Modal title */
  title?: string;
  /** Modal content */
  children: React.ReactNode;
  /** Modal size variant */
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  /** Whether to show close button */
  showCloseButton?: boolean;
  /** Whether to close on overlay click */
  closeOnOverlayClick?: boolean;
  /** Whether to close on Escape key */
  closeOnEscape?: boolean;
  /** Footer content */
  footer?: React.ReactNode;
  /** Custom className */
  className?: string;
  /** Whether modal is centered */
  centered?: boolean;
  /** Animation variant */
  animation?: 'fade' | 'slide' | 'scale' | 'none';
  /** Z-index level */
  zIndex?: number;
}

export interface ModalHeaderProps {
  title?: string;
  onClose?: () => void;
  showCloseButton?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export interface ModalBodyProps {
  children: React.ReactNode;
  className?: string;
  scrollable?: boolean;
}

export interface ModalFooterProps {
  children: React.ReactNode;
  className?: string;
  align?: 'left' | 'center' | 'right' | 'between';
}

export interface ModalContextValue {
  onClose: () => void;
  size: ModalProps['size'];
}
