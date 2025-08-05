import React, { useEffect } from 'react';
import styled, { css, keyframes } from 'styled-components';
import { tokens } from '../../tokens';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'small' | 'medium' | 'large' | 'full';
  closeOnEsc?: boolean;
  closeOnOverlayClick?: boolean;
  footer?: React.ReactNode;
}

const fadeIn = keyframes`
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
`;

const slideIn = keyframes`
  from {
    transform: translateY(-20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
`;

const ModalOverlay = styled.div<{ isOpen: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: ${tokens.zIndex.modal};
  animation: ${fadeIn} ${tokens.animations.duration.normal} ${tokens.animations.easing.easeInOut};
`;

const getModalSize = (size: string) => {
  switch (size) {
    case 'small':
      return css`
        width: 400px;
        max-width: 90%;
      `;
    case 'medium':
      return css`
        width: 600px;
        max-width: 90%;
      `;
    case 'large':
      return css`
        width: 800px;
        max-width: 90%;
      `;
    case 'full':
      return css`
        width: 90%;
        height: 90%;
      `;
    default:
      return css`
        width: 600px;
        max-width: 90%;
      `;
  }
};

const ModalContent = styled.div<{ size: string }>`
  background-color: ${({ theme }) => theme.colors.white};
  border-radius: ${tokens.borders.radius.lg};
  box-shadow: ${tokens.shadows.lg};
  display: flex;
  flex-direction: column;
  max-height: 90vh;
  animation: ${slideIn} ${tokens.animations.duration.normal} ${tokens.animations.easing.easeInOut};
  ${({ size }) => getModalSize(size)}
`;

const ModalHeader = styled.div`
  padding: ${tokens.spacing.md};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const ModalTitle = styled.h3`
  margin: 0;
  font-size: ${tokens.typography.fontSize.lg};
  font-weight: ${tokens.typography.fontWeight.medium};
  color: ${({ theme }) => theme.colors.textPrimary};
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  font-size: ${tokens.typography.fontSize.xl};
  color: ${({ theme }) => theme.colors.textSecondary};
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  transition: all ${tokens.animations.duration.fast} ${tokens.animations.easing.easeInOut};
  
  &:hover {
    background-color: ${({ theme }) => theme.colors.backgroundLight};
    color: ${({ theme }) => theme.colors.textPrimary};
  }
`;

const ModalBody = styled.div`
  padding: ${tokens.spacing.md};
  overflow-y: auto;
  flex: 1;
`;

const ModalFooter = styled.div`
  padding: ${tokens.spacing.md};
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  display: flex;
  justify-content: flex-end;
  gap: ${tokens.spacing.sm};
`;

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'medium',
  closeOnEsc = true,
  closeOnOverlayClick = true,
  footer,
}) => {
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (closeOnEsc && event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'auto';
    };
  }, [isOpen, onClose, closeOnEsc]);

  if (!isOpen) return null;

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (closeOnOverlayClick && e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <ModalOverlay isOpen={isOpen} onClick={handleOverlayClick}>
      <ModalContent size={size} onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          {title && <ModalTitle>{title}</ModalTitle>}
          <CloseButton onClick={onClose}>&times;</CloseButton>
        </ModalHeader>
        <ModalBody>{children}</ModalBody>
        {footer && <ModalFooter>{footer}</ModalFooter>}
      </ModalContent>
    </ModalOverlay>
  );
};