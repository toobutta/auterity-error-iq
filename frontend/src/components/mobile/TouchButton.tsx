import React, { forwardRef } from 'react';
import { cn } from '../../design-system/utils/cn';
import { Button } from '../../design-system/components/Button';
import { ButtonProps } from '../../design-system/components/Button/Button.types';

// Touch button props
export interface TouchButtonProps extends ButtonProps {
  /** Enable haptic feedback on touch devices */
  haptic?: boolean;

  /** Ripple effect on touch */
  ripple?: boolean;

  /** Touch target size optimization */
  touchTarget?: 'comfortable' | 'compact';

  /** Press feedback animation */
  pressFeedback?: boolean;

  /** Long press support */
  longPress?: {
    duration: number;
    onLongPress: () => void;
  };
}

// Touch button component
const TouchButton = forwardRef<HTMLButtonElement, TouchButtonProps>(
  (
    {
      haptic = true,
      ripple = true,
      touchTarget = 'comfortable',
      pressFeedback = true,
      longPress,
      className = '',
      onClick,
      children,
      ...props
    },
    ref
  ) => {
    const [isPressed, setIsPressed] = React.useState(false);
    const [rippleEffect, setRippleEffect] = React.useState<{
      x: number;
      y: number;
      id: number;
    } | null>(null);
    const longPressTimerRef = React.useRef<NodeJS.Timeout>();
    const buttonRef = React.useRef<HTMLButtonElement>(null);

    // Touch target size classes
    const touchTargetClasses = {
      comfortable: 'min-h-[44px] min-w-[44px]', // iOS Human Interface Guidelines
      compact: 'min-h-[36px] min-w-[36px]'
    };

    // Handle touch start
    const handleTouchStart = React.useCallback((e: React.TouchEvent) => {
      setIsPressed(true);

      // Haptic feedback
      if (haptic && 'vibrate' in navigator) {
        navigator.vibrate(10);
      }

      // Ripple effect
      if (ripple && buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        const touch = e.touches[0];
        setRippleEffect({
          x: touch.clientX - rect.left,
          y: touch.clientY - rect.top,
          id: Date.now()
        });
      }

      // Long press timer
      if (longPress) {
        longPressTimerRef.current = setTimeout(() => {
          longPress.onLongPress();
          if (haptic && 'vibrate' in navigator) {
            navigator.vibrate(50); // Stronger vibration for long press
          }
        }, longPress.duration);
      }
    }, [haptic, ripple, longPress]);

    // Handle touch end
    const handleTouchEnd = React.useCallback(() => {
      setIsPressed(false);

      // Clear long press timer
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
      }

      // Clear ripple effect after animation
      setTimeout(() => {
        setRippleEffect(null);
      }, 600);
    }, [longPress]);

    // Handle click with long press prevention
    const handleClick = React.useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
      // Clear long press timer on click
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
      }

      onClick?.(e);
    }, [onClick, longPress]);

    // Combine refs
    const combinedRef = React.useCallback(
      (element: HTMLButtonElement | null) => {
        buttonRef.current = element;
        if (typeof ref === 'function') {
          ref(element);
        } else if (ref) {
          ref.current = element;
        }
      },
      [ref]
    );

    return (
      <div className="relative inline-block">
        <Button
          ref={combinedRef}
          className={cn(
            'touch-button',
            touchTargetClasses[touchTarget],
            pressFeedback && isPressed && 'scale-95',
            'transition-transform duration-100 ease-out',
            'select-none', // Prevent text selection on mobile
            className
          )}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleTouchStart}
          onMouseUp={handleTouchEnd}
          onMouseLeave={handleTouchEnd}
          onClick={handleClick}
          {...props}
        >
          {children}
        </Button>

        {/* Ripple effect */}
        {ripple && rippleEffect && (
          <span
            className="absolute rounded-full bg-white bg-opacity-30 animate-ping"
            style={{
              left: rippleEffect.x - 10,
              top: rippleEffect.y - 10,
              width: 20,
              height: 20,
              animation: 'ripple 0.6s linear'
            }}
          />
        )}
      </div>
    );
  }
);

TouchButton.displayName = 'TouchButton';

export default TouchButton;
