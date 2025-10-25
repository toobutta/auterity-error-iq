import React, { useState, useCallback, useRef } from 'react';
import { cn } from '../../design-system/utils/cn';

// Touch feedback animation types
export type TouchFeedbackType = 'ripple' | 'scale' | 'glow' | 'bounce' | 'pulse';

// Touch feedback props
export interface TouchFeedbackProps {
  children: React.ReactNode;
  type?: TouchFeedbackType;
  duration?: number;
  disabled?: boolean;
  className?: string;
  onTouchStart?: (e: React.TouchEvent) => void;
  onTouchEnd?: (e: React.TouchEvent) => void;
  onClick?: (e: React.MouseEvent) => void;
}

// Ripple effect component
const RippleEffect: React.FC<{
  x: number;
  y: number;
  size: number;
  onComplete: () => void;
}> = ({ x, y, size, onComplete }) => {
  const [isAnimating, setIsAnimating] = useState(true);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setIsAnimating(false);
      setTimeout(onComplete, 300); // Wait for fade out
    }, 600);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <span
      className={cn(
        'absolute rounded-full bg-white bg-opacity-30 pointer-events-none',
        'transition-all duration-600 ease-out',
        isAnimating ? 'animate-ping' : 'opacity-0'
      )}
      style={{
        left: x - size / 2,
        top: y - size / 2,
        width: size,
        height: size
      }}
    />
  );
};

// Touch feedback component
const TouchFeedback: React.FC<TouchFeedbackProps> = ({
  children,
  type = 'ripple',
  duration = 300,
  disabled = false,
  className = '',
  onTouchStart: externalOnTouchStart,
  onTouchEnd: externalOnTouchEnd,
  onClick: externalOnClick
}) => {
  const [isActive, setIsActive] = useState(false);
  const [ripples, setRipples] = useState<Array<{ id: number; x: number; y: number }>>([]);
  const elementRef = useRef<HTMLDivElement>(null);

  // Generate unique ripple ID
  const rippleIdRef = useRef(0);

  // Handle touch start
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (disabled) return;

    setIsActive(true);

    // Haptic feedback
    if ('vibrate' in navigator && type === 'ripple') {
      navigator.vibrate(10);
    }

    // Create ripple effect
    if (type === 'ripple' && elementRef.current) {
      const rect = elementRef.current.getBoundingClientRect();
      const touch = e.touches[0];
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;
      const size = Math.max(rect.width, rect.height) * 2;

      const newRipple = { id: ++rippleIdRef.current, x, y };
      setRipples(prev => [...prev, newRipple]);

      // Auto-remove ripple after animation
      setTimeout(() => {
        setRipples(prev => prev.filter(r => r.id !== newRipple.id));
      }, 900);
    }

    externalOnTouchStart?.(e);
  }, [disabled, type, externalOnTouchStart]);

  // Handle touch end
  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (disabled) return;

    setIsActive(false);
    externalOnTouchEnd?.(e);
  }, [disabled, externalOnTouchEnd]);

  // Handle click
  const handleClick = useCallback((e: React.MouseEvent) => {
    if (disabled) return;
    externalOnClick?.(e);
  }, [disabled, externalOnClick]);

  // Get animation classes based on type
  const getAnimationClasses = () => {
    const baseClasses = 'transition-all ease-out';

    switch (type) {
      case 'scale':
        return cn(
          baseClasses,
          isActive ? 'transform scale-95' : 'transform scale-100',
          `duration-${duration}`
        );

      case 'glow':
        return cn(
          baseClasses,
          isActive ? 'shadow-lg shadow-blue-500/50' : 'shadow-sm',
          `duration-${duration}`
        );

      case 'bounce':
        return cn(
          baseClasses,
          isActive ? 'transform scale-110' : 'transform scale-100',
          `duration-${duration}`
        );

      case 'pulse':
        return cn(
          baseClasses,
          isActive ? 'animate-pulse' : '',
          `duration-${duration}`
        );

      case 'ripple':
      default:
        return cn(baseClasses, `duration-${duration}`);
    }
  };

  return (
    <div
      ref={elementRef}
      className={cn(
        'relative overflow-hidden',
        getAnimationClasses(),
        disabled && 'pointer-events-none opacity-50',
        className
      )}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleTouchStart}
      onMouseUp={handleTouchEnd}
      onMouseLeave={handleTouchEnd}
      onClick={handleClick}
    >
      {children}

      {/* Ripple effects */}
      {type === 'ripple' && ripples.map(ripple => (
        <RippleEffect
          key={ripple.id}
          x={ripple.x}
          y={ripple.y}
          size={Math.max(
            elementRef.current?.offsetWidth || 0,
            elementRef.current?.offsetHeight || 0
          ) * 2}
          onComplete={() => {
            setRipples(prev => prev.filter(r => r.id !== newRipple.id));
          }}
        />
      ))}
    </div>
  );
};

// Touch feedback utilities
export const touchFeedbackUtils = {
  // Check if device supports touch
  isTouchDevice: () => 'ontouchstart' in window || navigator.maxTouchPoints > 0,

  // Check if device supports haptic feedback
  hasHapticFeedback: () => 'vibrate' in navigator,

  // Trigger haptic feedback
  vibrate: (pattern: number | number[] = 10) => {
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  },

  // Get touch target size based on device
  getTouchTargetSize: (size: 'small' | 'medium' | 'large' = 'medium') => {
    const baseSize = {
      small: 36,    // 9mm at 160dpi
      medium: 44,   // 11mm at 160dpi (iOS HIG)
      large: 48     // 12mm at 160dpi
    };

    return baseSize[size];
  },

  // Check if element meets touch target requirements
  meetsTouchTarget: (element: HTMLElement, minSize = 44) => {
    const rect = element.getBoundingClientRect();
    return rect.width >= minSize && rect.height >= minSize;
  }
};

// Pre-built touch feedback variants
export const TouchFeedbackVariants = {
  // Button-like feedback
  Button: (props: Omit<TouchFeedbackProps, 'type'>) => (
    <TouchFeedback type="scale" duration={150} {...props} />
  ),

  // Card-like feedback
  Card: (props: Omit<TouchFeedbackProps, 'type'>) => (
    <TouchFeedback type="glow" duration={200} {...props} />
  ),

  // List item feedback
  ListItem: (props: Omit<TouchFeedbackProps, 'type'>) => (
    <TouchFeedback type="ripple" duration={300} {...props} />
  ),

  // Icon button feedback
  IconButton: (props: Omit<TouchFeedbackProps, 'type'>) => (
    <TouchFeedback type="bounce" duration={200} {...props} />
  ),

  // Tab feedback
  Tab: (props: Omit<TouchFeedbackProps, 'type'>) => (
    <TouchFeedback type="pulse" duration={150} {...props} />
  )
};

// Touch feedback styles
export const touchFeedbackStyles = {
  // Base touch styles
  base: 'touch-manipulation select-none',

  // Touch target styles
  touchTarget: {
    small: 'min-h-[36px] min-w-[36px]',
    medium: 'min-h-[44px] min-w-[44px]',
    large: 'min-h-[48px] min-w-[48px]'
  },

  // Animation styles
  animations: {
    scale: 'active:scale-95 transition-transform duration-150',
    glow: 'active:shadow-lg active:shadow-blue-500/50 transition-shadow duration-200',
    bounce: 'active:scale-110 transition-transform duration-200',
    pulse: 'active:animate-pulse',
    ripple: 'relative overflow-hidden'
  },

  // Focus styles for keyboard navigation
  focus: {
    default: 'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
    inset: 'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset'
  }
};

export default TouchFeedback;
