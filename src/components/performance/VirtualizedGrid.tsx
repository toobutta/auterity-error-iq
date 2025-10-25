/**
 * Virtualized Grid Component
 * High-performance rendering for large datasets using react-window
 */

import React, { useMemo, useCallback } from 'react';
import { FixedSizeGrid as Grid } from 'react-window';
import { useReducedMotion } from '../../utils/a11y';

export interface GridItem {
  id: string;
  data: any;
  width?: number;
  height?: number;
}

interface VirtualizedGridProps {
  items: GridItem[];
  itemWidth?: number;
  itemHeight?: number;
  containerWidth?: number;
  containerHeight?: number;
  gap?: number;
  overscanCount?: number;
  renderItem: (item: GridItem, style: React.CSSProperties) => React.ReactNode;
  onItemClick?: (item: GridItem) => void;
  onItemHover?: (item: GridItem) => void;
  className?: string;
  style?: React.CSSProperties;
}

export const VirtualizedGrid: React.FC<VirtualizedGridProps> = ({
  items,
  itemWidth = 200,
  itemHeight = 150,
  containerWidth = 800,
  containerHeight = 600,
  gap = 16,
  overscanCount = 5,
  renderItem,
  onItemClick,
  onItemHover,
  className = '',
  style = {}
}) => {
  const prefersReducedMotion = useReducedMotion();

  // Calculate grid dimensions
  const columnCount = useMemo(() => {
    const availableWidth = containerWidth - gap;
    return Math.max(1, Math.floor((availableWidth + gap) / (itemWidth + gap)));
  }, [containerWidth, itemWidth, gap]);

  const rowCount = useMemo(() => {
    return Math.ceil(items.length / columnCount);
  }, [items.length, columnCount]);

  // Get item at specific grid position
  const getItem = useCallback((rowIndex: number, columnIndex: number) => {
    const index = rowIndex * columnCount + columnIndex;
    return items[index] || null;
  }, [items, columnCount]);

  // Render individual grid cell
  const Cell = useCallback(({ rowIndex, columnIndex, style: cellStyle }: any) => {
    const item = getItem(rowIndex, columnIndex);

    if (!item) return null;

    // Calculate position with gap
    const x = cellStyle.left + gap / 2;
    const y = cellStyle.top + gap / 2;
    const width = itemWidth;
    const height = itemHeight;

    const itemStyle: React.CSSProperties = {
      ...cellStyle,
      left: x,
      top: y,
      width,
      height,
      transition: prefersReducedMotion ? 'none' : 'transform 0.2s ease, box-shadow 0.2s ease',
      cursor: onItemClick ? 'pointer' : 'default'
    };

    return (
      <div
        key={item.id}
        style={itemStyle}
        onClick={() => onItemClick?.(item)}
        onMouseEnter={() => onItemHover?.(item)}
        className="virtualized-grid-item"
      >
        {renderItem(item, itemStyle)}
      </div>
    );
  }, [getItem, itemWidth, itemHeight, gap, renderItem, onItemClick, onItemHover, prefersReducedMotion]);

  return (
    <div
      className={`virtualized-grid ${className}`}
      style={{
        width: containerWidth,
        height: containerHeight,
        position: 'relative',
        overflow: 'auto',
        ...style
      }}
    >
      <Grid
        columnCount={columnCount}
        columnWidth={itemWidth + gap}
        height={containerHeight}
        rowCount={rowCount}
        rowHeight={itemHeight + gap}
        width={containerWidth}
        overscanCount={overscanCount}
        className="virtualized-grid-container"
      >
        {Cell}
      </Grid>
    </div>
  );
};

// Hook for managing grid dimensions
export const useGridDimensions = (
  containerRef: React.RefObject<HTMLElement>,
  itemWidth: number,
  itemHeight: number,
  gap: number = 16
) => {
  const [dimensions, setDimensions] = React.useState({
    width: 800,
    height: 600,
    columnCount: 1,
    rowCount: 1
  });

  React.useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;

        const availableWidth = width - gap;
        const columnCount = Math.max(1, Math.floor((availableWidth + gap) / (itemWidth + gap)));
        const rowCount = Math.max(1, Math.ceil(100 / columnCount)); // Estimate based on typical item count

        setDimensions({
          width,
          height,
          columnCount,
          rowCount
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);

    return () => window.removeEventListener('resize', updateDimensions);
  }, [containerRef, itemWidth, itemHeight, gap]);

  return dimensions;
};

// Infinite loading variant for large datasets
export const VirtualizedInfiniteGrid: React.FC<
  VirtualizedGridProps & {
    hasNextPage: boolean;
    isNextPageLoading: boolean;
    loadNextPage: () => void;
    threshold?: number;
  }
> = ({
  items,
  hasNextPage,
  isNextPageLoading,
  loadNextPage,
  threshold = 100,
  ...gridProps
}) => {
  // Track loading state and trigger load when nearing end
  React.useEffect(() => {
    if (hasNextPage && !isNextPageLoading) {
      const lastItemIndex = items.length - 1;
      const thresholdIndex = Math.max(0, lastItemIndex - threshold);

      // This is a simplified check - in practice, you'd track visible items
      if (lastItemIndex >= thresholdIndex) {
        loadNextPage();
      }
    }
  }, [items.length, hasNextPage, isNextPageLoading, loadNextPage, threshold]);

  return (
    <>
      <VirtualizedGrid {...gridProps} items={items} />
      {isNextPageLoading && (
        <div className="infinite-loading-indicator">
          <div className="loading-spinner" />
          <span>Loading more items...</span>
        </div>
      )}
    </>
  );
};

export default VirtualizedGrid;
