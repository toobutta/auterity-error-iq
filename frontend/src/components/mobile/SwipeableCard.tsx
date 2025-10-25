import React, { useRef, useState, useCallback } from 'react';
import { cn } from '../../design-system/utils/cn';

// Swipe directions
export type SwipeDirection = 'left' | 'right' | 'up' | 'down';

// Swipe actions
export interface SwipeAction {
  direction: SwipeDirection;
  icon: React.ReactNode;
  label: string;
  color: string;
  onSwipe: () => void;
  threshold?: number; // Distance threshold for action trigger
}

// Swipeable card props
export interface SwipeableCardProps {
  children: React.ReactNode;
  actions?: SwipeAction[];
  className?: string;
  onSwipeStart?: (direction: SwipeDirection) => void;
  onSwipeEnd?: (direction: SwipeDirection, distance: number) => void;
  onActionTriggered?: (action: SwipeAction) => void;
  disabled?: boolean;
  friction?: number; // Resistance when swiping
  maxDistance?: number; // Maximum swipe distance
}

// Swipe gesture hook
const useSwipeGesture = (
  onSwipeStart?: (direction: SwipeDirection) => void,
  onSwipeEnd?: (direction: SwipeDirection, distance: number) => void,
  onActionTriggered?: (action: SwipeAction) => void,
  actions?: SwipeAction[],
  friction = 0.7,
  maxDistance = 100
) => {
  const [isDragging, setIsDragging] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [currentPos, setCurrentPos] = useState({ x: 0, y: 0 });
  const [direction, setDirection] = useState<SwipeDirection | null>(null);

  const elementRef = useRef<HTMLDivElement>(null);

  // Calculate swipe direction
  const getDirection = useCallback((deltaX: number, deltaY: number): SwipeDirection => {
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      return deltaX > 0 ? 'right' : 'left';
    }
    return deltaY > 0 ? 'down' : 'up';
  }, []);

  // Calculate distance
  const getDistance = useCallback((deltaX: number, deltaY: number): number => {
    return Math.sqrt(deltaX * deltaX + deltaY * deltaY);
  }, []);

  // Handle touch start
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    setStartPos({ x: touch.clientX, y: touch.clientY });
    setCurrentPos({ x: touch.clientX, y: touch.clientY });
    setIsDragging(true);
  }, []);

  // Handle touch move
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging) return;

    e.preventDefault(); // Prevent scrolling

    const touch = e.touches[0];
    const deltaX = touch.clientX - startPos.x;
    const deltaY = touch.clientY - startPos.y;

    // Apply friction
    const constrainedX = deltaX * friction;
    const constrainedY = deltaY * friction;

    // Limit maximum distance
    const distance = getDistance(constrainedX, constrainedY);
    const maxDist = maxDistance;

    let finalX = constrainedX;
    let finalY = constrainedY;

    if (distance > maxDist) {
      const ratio = maxDist / distance;
      finalX = constrainedX * ratio;
      finalY = constrainedY * ratio;
    }

    setCurrentPos({ x: startPos.x + finalX, y: startPos.y + finalY });

    const currentDirection = getDirection(finalX, finalY);
    setDirection(currentDirection);
    onSwipeStart?.(currentDirection);
  }, [isDragging, startPos, getDirection, getDistance, friction, maxDistance, onSwipeStart]);

  // Handle touch end
  const handleTouchEnd = useCallback(() => {
    if (!isDragging) return;

    setIsDragging(false);

    const deltaX = currentPos.x - startPos.x;
    const deltaY = currentPos.y - startPos.y;
    const distance = getDistance(deltaX, deltaY);
    const currentDirection = getDirection(deltaX, deltaY);

    // Check if any action should be triggered
    if (actions && distance > 30) { // Minimum distance threshold
      const action = actions.find(a => a.direction === currentDirection);
      if (action && distance >= (action.threshold || 50)) {
        onActionTriggered?.(action);
        action.onSwipe();
      }
    }

    // Reset position
    setCurrentPos(startPos);
    setDirection(null);

    onSwipeEnd?.(currentDirection, distance);
  }, [isDragging, currentPos, startPos, getDistance, getDirection, actions, onSwipeEnd, onActionTriggered]);

  // Mouse events for desktop testing
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setStartPos({ x: e.clientX, y: e.clientY });
    setCurrentPos({ x: e.clientX, y: e.clientY });
    setIsDragging(true);
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;

    const deltaX = e.clientX - startPos.x;
    const deltaY = e.clientY - startPos.y;

    const constrainedX = deltaX * friction;
    const constrainedY = deltaY * friction;

    const distance = getDistance(constrainedX, constrainedY);
    const maxDist = maxDistance;

    let finalX = constrainedX;
    let finalY = constrainedY;

    if (distance > maxDist) {
      const ratio = maxDist / distance;
      finalX = constrainedX * ratio;
      finalY = constrainedY * ratio;
    }

    setCurrentPos({ x: startPos.x + finalX, y: startPos.y + finalY });

    const currentDirection = getDirection(finalX, finalY);
    setDirection(currentDirection);
  }, [isDragging, startPos, getDirection, getDistance, friction, maxDistance]);

  const handleMouseUp = useCallback(() => {
    handleTouchEnd();
  }, [handleTouchEnd]);

  return {
    elementRef,
    isDragging,
    currentPos,
    direction,
    handlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
      onMouseDown: handleMouseDown,
      onMouseMove: handleMouseMove,
      onMouseUp: handleMouseUp,
      onMouseLeave: handleMouseUp
    }
  };
};

// Swipeable card component
const SwipeableCard: React.FC<SwipeableCardProps> = ({
  children,
  actions = [],
  className = '',
  onSwipeStart,
  onSwipeEnd,
  onActionTriggered,
  disabled = false,
  friction = 0.7,
  maxDistance = 100
}) => {
  const {
    elementRef,
    isDragging,
    currentPos,
    direction,
    handlers
  } = useSwipeGesture(
    onSwipeStart,
    onSwipeEnd,
    onActionTriggered,
    actions,
    friction,
    maxDistance
  );

  if (disabled) {
    return (
      <div className={cn('swipeable-card', className)}>
        {children}
      </div>
    );
  }

  // Calculate transform based on current position
  const transform = isDragging && elementRef.current
    ? `translate(${currentPos.x - (elementRef.current.offsetLeft || 0)}px, ${currentPos.y - (elementRef.current.offsetTop || 0)}px)`
    : 'translate(0px, 0px)';

  return (
    <div className="relative overflow-hidden rounded-lg">
      {/* Action backgrounds */}
      {actions.map(action => {
        const isActiveDirection = direction === action.direction && isDragging;
        const actionOffset = isActiveDirection ? maxDistance : 0;

        return (
          <div
            key={action.direction}
            className={cn(
              'absolute inset-0 flex items-center justify-center text-white font-medium transition-all duration-200',
              action.color,
              isActiveDirection ? 'opacity-100' : 'opacity-0'
            )}
            style={{
              transform: action.direction === 'left' ? `translateX(-${actionOffset}px)` :
                         action.direction === 'right' ? `translateX(${actionOffset}px)` :
                         action.direction === 'up' ? `translateY(-${actionOffset}px)` :
                         `translateY(${actionOffset}px)`,
              zIndex: isActiveDirection ? 1 : 0
            }}
          >
            <div className="flex items-center space-x-2">
              <span className="text-lg">{action.icon}</span>
              <span className="text-sm">{action.label}</span>
            </div>
          </div>
        );
      })}

      {/* Main card */}
      <div
        ref={elementRef}
        className={cn(
          'swipeable-card bg-white shadow-sm border border-gray-200 rounded-lg cursor-grab active:cursor-grabbing',
          'transition-transform duration-200 ease-out',
          isDragging && 'shadow-lg',
          className
        )}
        style={{
          transform,
          zIndex: isDragging ? 10 : 1
        }}
        {...handlers}
      >
        {children}
      </div>

      {/* Swipe hint overlay */}
      {!isDragging && actions.length > 0 && (
        <div className="absolute top-2 right-2 text-gray-400 text-xs opacity-50 pointer-events-none">
          Swipe for actions
        </div>
      )}
    </div>
  );
};

export default SwipeableCard;
