import React from 'react';
import { cn } from '../../design-system/utils/cn';

// Responsive grid breakpoints
export const BREAKPOINTS = {
  xs: '0px',
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px'
} as const;

// Grid column configurations
export const GRID_COLUMNS = {
  1: 'grid-cols-1',
  2: 'grid-cols-2',
  3: 'grid-cols-3',
  4: 'grid-cols-4',
  5: 'grid-cols-5',
  6: 'grid-cols-6',
  7: 'grid-cols-7',
  8: 'grid-cols-8',
  9: 'grid-cols-9',
  10: 'grid-cols-10',
  11: 'grid-cols-11',
  12: 'grid-cols-12'
} as const;

// Grid gap configurations
export const GRID_GAPS = {
  0: 'gap-0',
  1: 'gap-1',
  2: 'gap-2',
  3: 'gap-3',
  4: 'gap-4',
  5: 'gap-5',
  6: 'gap-6',
  8: 'gap-8',
  10: 'gap-10',
  12: 'gap-12',
  16: 'gap-16',
  20: 'gap-20',
  24: 'gap-24'
} as const;

// Responsive grid props
export interface ResponsiveGridProps {
  children: React.ReactNode;
  columns?: {
    default?: keyof typeof GRID_COLUMNS;
    xs?: keyof typeof GRID_COLUMNS;
    sm?: keyof typeof GRID_COLUMNS;
    md?: keyof typeof GRID_COLUMNS;
    lg?: keyof typeof GRID_COLUMNS;
    xl?: keyof typeof GRID_COLUMNS;
    '2xl'?: keyof typeof GRID_COLUMNS;
  };
  gap?: {
    default?: keyof typeof GRID_GAPS;
    xs?: keyof typeof GRID_GAPS;
    sm?: keyof typeof GRID_GAPS;
    md?: keyof typeof GRID_GAPS;
    lg?: keyof typeof GRID_GAPS;
    xl?: keyof typeof GRID_GAPS;
    '2xl'?: keyof typeof GRID_GAPS;
  };
  className?: string;
  as?: keyof JSX.IntrinsicElements;
}

// Responsive grid component
const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({
  children,
  columns = { default: 1, md: 2, lg: 3 },
  gap = { default: 4 },
  className = '',
  as: Component = 'div'
}) => {
  // Build responsive classes
  const columnClasses = Object.entries(columns).map(([breakpoint, cols]) => {
    if (breakpoint === 'default') {
      return GRID_COLUMNS[cols];
    }
    return `${breakpoint}:${GRID_COLUMNS[cols]}`;
  }).join(' ');

  const gapClasses = Object.entries(gap).map(([breakpoint, g]) => {
    if (breakpoint === 'default') {
      return GRID_GAPS[g];
    }
    return `${breakpoint}:${GRID_GAPS[g]}`;
  }).join(' ');

  return (
    <Component
      className={cn(
        'grid',
        columnClasses,
        gapClasses,
        className
      )}
    >
      {children}
    </Component>
  );
};

// Auto-responsive grid that adapts to content
export const AutoGrid: React.FC<{
  children: React.ReactNode;
  minItemWidth?: number;
  gap?: keyof typeof GRID_GAPS;
  className?: string;
  as?: keyof JSX.IntrinsicElements;
}> = ({
  children,
  minItemWidth = 280,
  gap = 4,
  className = '',
  as: Component = 'div'
}) => {
  const childrenArray = React.Children.toArray(children);
  const itemCount = childrenArray.length;

  // Calculate optimal grid layout based on screen size and item count
  const getGridClasses = () => {
    const baseClasses = ['grid', GRID_GAPS[gap]];

    // Mobile: single column
    baseClasses.push('grid-cols-1');

    // Tablet: 2 columns if enough items
    if (itemCount >= 2) {
      baseClasses.push('sm:grid-cols-2');
    }

    // Desktop: calculate based on item count and min width
    if (itemCount >= 3) {
      if (itemCount <= 4) {
        baseClasses.push('md:grid-cols-2', 'lg:grid-cols-3');
      } else if (itemCount <= 6) {
        baseClasses.push('md:grid-cols-2', 'lg:grid-cols-3');
      } else if (itemCount <= 8) {
        baseClasses.push('md:grid-cols-3', 'lg:grid-cols-4');
      } else {
        baseClasses.push('md:grid-cols-3', 'lg:grid-cols-4', 'xl:grid-cols-5');
      }
    }

    return baseClasses.join(' ');
  };

  return (
    <Component className={cn(getGridClasses(), className)}>
      {children}
    </Component>
  );
};

// Masonry grid for Pinterest-style layouts
export const MasonryGrid: React.FC<{
  children: React.ReactNode;
  columns?: {
    default?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  gap?: number;
  className?: string;
}> = ({
  children,
  columns = { default: 1, md: 2, lg: 3 },
  gap = 16,
  className = ''
}) => {
  const childrenArray = React.Children.toArray(children);
  const columnCount = {
    default: columns.default || 1,
    md: columns.md || 2,
    lg: columns.lg || 3,
    xl: columns.xl || columns.lg || 3
  };

  // Distribute items across columns
  const distributeItems = (cols: number) => {
    const result: React.ReactNode[][] = Array.from({ length: cols }, () => []);
    childrenArray.forEach((child, index) => {
      result[index % cols].push(child);
    });
    return result;
  };

  return (
    <div
      className={cn(
        'flex gap-4',
        'flex-col md:flex-row',
        className
      )}
      style={{ gap: `${gap}px` }}
    >
      {/* Mobile: single column */}
      <div className="md:hidden flex flex-col space-y-4">
        {childrenArray}
      </div>

      {/* Tablet and up: multi-column */}
      <div className="hidden md:flex md:flex-row lg:flex-row xl:flex-row gap-4">
        {distributeItems(columnCount.md).map((columnItems, columnIndex) => (
          <div
            key={columnIndex}
            className="flex-1 flex flex-col space-y-4"
          >
            {columnItems}
          </div>
        ))}
      </div>

      {/* Large screens */}
      <div className="hidden lg:flex xl:hidden gap-4">
        {distributeItems(columnCount.lg).map((columnItems, columnIndex) => (
          <div
            key={columnIndex}
            className="flex-1 flex flex-col space-y-4"
          >
            {columnItems}
          </div>
        ))}
      </div>

      {/* Extra large screens */}
      <div className="hidden xl:flex gap-4">
        {distributeItems(columnCount.xl).map((columnItems, columnIndex) => (
          <div
            key={columnIndex}
            className="flex-1 flex flex-col space-y-4"
          >
            {columnItems}
          </div>
        ))}
      </div>
    </div>
  );
};

// Card grid with consistent aspect ratios
export const CardGrid: React.FC<{
  children: React.ReactNode;
  aspectRatio?: 'square' | 'video' | 'portrait' | 'landscape' | 'auto';
  columns?: {
    default?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  gap?: keyof typeof GRID_GAPS;
  className?: string;
}> = ({
  children,
  aspectRatio = 'auto',
  columns = { default: 1, sm: 2, md: 3, lg: 4 },
  gap = 6,
  className = ''
}) => {
  const aspectRatioClasses = {
    square: 'aspect-square',
    video: 'aspect-video',
    portrait: 'aspect-[3/4]',
    landscape: 'aspect-[4/3]',
    auto: 'aspect-auto'
  };

  return (
    <ResponsiveGrid
      columns={columns}
      gap={{ default: gap }}
      className={cn(
        'w-full',
        aspectRatio !== 'auto' && aspectRatioClasses[aspectRatio],
        className
      )}
    >
      {children}
    </ResponsiveGrid>
  );
};

// Virtualized grid for performance with large datasets
export const VirtualizedGrid: React.FC<{
  items: any[];
  itemHeight: number;
  containerHeight: number;
  columns?: number;
  gap?: number;
  renderItem: (item: any, index: number) => React.ReactNode;
  className?: string;
}> = ({
  items,
  itemHeight,
  containerHeight,
  columns = 3,
  gap = 16,
  renderItem,
  className = ''
}) => {
  const [scrollTop, setScrollTop] = React.useState(0);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const itemWidth = `calc((100% - ${(columns - 1) * gap}px) / ${columns})`;

  // Calculate visible range
  const startIndex = Math.floor(scrollTop / (itemHeight + gap));
  const endIndex = Math.min(
    startIndex + Math.ceil(containerHeight / (itemHeight + gap)) * columns,
    items.length
  );

  const visibleItems = items.slice(startIndex, endIndex);

  // Position items in grid
  const positionedItems = visibleItems.map((item, index) => {
    const actualIndex = startIndex + index;
    const row = Math.floor(actualIndex / columns);
    const col = actualIndex % columns;

    return {
      item,
      index: actualIndex,
      style: {
        position: 'absolute' as const,
        top: row * (itemHeight + gap),
        left: col * (parseFloat(itemWidth) + gap / columns),
        width: itemWidth,
        height: itemHeight
      }
    };
  });

  return (
    <div
      ref={containerRef}
      className={cn('overflow-auto relative', className)}
      style={{ height: containerHeight }}
      onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
    >
      <div
        style={{
          height: Math.ceil(items.length / columns) * (itemHeight + gap),
          position: 'relative'
        }}
      >
        {positionedItems.map(({ item, index, style }) => (
          <div key={index} style={style}>
            {renderItem(item, index)}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ResponsiveGrid;
