import React from 'react';
import styled, { css } from 'styled-components';
import { tokens } from '../../tokens';

export interface Column<T> {
  key: string;
  title: string;
  render?: (value: any, record: T, index: number) => React.ReactNode;
  width?: string;
  align?: 'left' | 'center' | 'right';
  sortable?: boolean;
}

export interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  emptyText?: string;
  rowKey?: string | ((record: T) => string);
  onRowClick?: (record: T, index: number) => void;
  sortColumn?: string;
  sortDirection?: 'asc' | 'desc';
  onSort?: (column: string, direction: 'asc' | 'desc') => void;
  striped?: boolean;
  bordered?: boolean;
  compact?: boolean;
}

const TableWrapper = styled.div`
  width: 100%;
  overflow-x: auto;
`;

const StyledTable = styled.table<{
  striped?: boolean;
  bordered?: boolean;
  compact?: boolean;
}>`
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  font-family: ${tokens.typography.fontFamily.base};
  
  ${({ bordered }) => bordered && css`
    border: 1px solid ${({ theme }) => theme.colors.border};
    border-radius: ${tokens.borders.radius.md};
  `}
  
  ${({ compact }) => compact && css`
    font-size: ${tokens.typography.fontSize.sm};
  `}
`;

const TableHead = styled.thead`
  background-color: ${({ theme }) => theme.colors.backgroundLight};
`;

const TableHeadCell = styled.th<{
  width?: string;
  align?: 'left' | 'center' | 'right';
  sortable?: boolean;
  compact?: boolean;
}>`
  padding: ${({ compact }) => compact ? tokens.spacing.xs : tokens.spacing.sm};
  text-align: ${({ align }) => align || 'left'};
  font-weight: ${tokens.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.textPrimary};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  white-space: nowrap;
  
  ${({ width }) => width && css`width: ${width};`}
  ${({ sortable }) => sortable && css`cursor: pointer;`}
`;

const TableBody = styled.tbody``;

const TableRow = styled.tr<{
  clickable?: boolean;
  striped?: boolean;
  index: number;
}>`
  transition: background-color ${tokens.animations.duration.fast} ${tokens.animations.easing.easeInOut};
  
  ${({ clickable }) => clickable && css`
    cursor: pointer;
    &:hover {
      background-color: ${({ theme }) => theme.colors.backgroundLight};
    }
  `}
  
  ${({ striped, index, theme }) => striped && index % 2 === 1 && css`
    background-color: ${theme.colors.backgroundLight};
  `}
`;

const TableCell = styled.td<{
  align?: 'left' | 'center' | 'right';
  compact?: boolean;
}>`
  padding: ${({ compact }) => compact ? tokens.spacing.xs : tokens.spacing.sm};
  text-align: ${({ align }) => align || 'left'};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  color: ${({ theme }) => theme.colors.textPrimary};
`;

const EmptyState = styled.div`
  padding: ${tokens.spacing.lg};
  text-align: center;
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const SortIcon = styled.span<{ active?: boolean; direction?: 'asc' | 'desc' }>`
  margin-left: ${tokens.spacing.xs};
  display: inline-block;
  
  &::after {
    content: '${({ active, direction }) => {
      if (!active) return '↕';
      return direction === 'asc' ? '↑' : '↓';
    }}';
  }
`;

const LoadingOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1;
`;

const LoadingSpinner = styled.div`
  width: 40px;
  height: 40px;
  border: 4px solid rgba(0, 0, 0, 0.1);
  border-radius: 50%;
  border-top-color: ${({ theme }) => theme.colors.primary};
  animation: spin 1s ease-in-out infinite;
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

export function Table<T extends Record<string, any>>({
  columns,
  data,
  loading = false,
  emptyText = 'No data',
  rowKey,
  onRowClick,
  sortColumn,
  sortDirection,
  onSort,
  striped = false,
  bordered = false,
  compact = false,
}: TableProps<T>) {
  const getRowKey = (record: T, index: number): string => {
    if (typeof rowKey === 'function') {
      return rowKey(record);
    }
    if (typeof rowKey === 'string') {
      return record[rowKey];
    }
    return `row-${index}`;
  };

  const handleHeaderClick = (column: Column<T>) => {
    if (!column.sortable || !onSort) return;
    
    const newDirection = 
      sortColumn !== column.key ? 'asc' : 
      sortDirection === 'asc' ? 'desc' : 'asc';
    
    onSort(column.key, newDirection);
  };

  return (
    <TableWrapper>
      <StyledTable striped={striped} bordered={bordered} compact={compact}>
        <TableHead>
          <tr>
            {columns.map((column) => (
              <TableHeadCell
                key={column.key}
                width={column.width}
                align={column.align}
                sortable={column.sortable}
                compact={compact}
                onClick={() => column.sortable && handleHeaderClick(column)}
              >
                {column.title}
                {column.sortable && (
                  <SortIcon 
                    active={sortColumn === column.key}
                    direction={sortColumn === column.key ? sortDirection : undefined}
                  />
                )}
              </TableHeadCell>
            ))}
          </tr>
        </TableHead>
        <TableBody>
          {data.length > 0 ? (
            data.map((record, index) => (
              <TableRow
                key={getRowKey(record, index)}
                clickable={!!onRowClick}
                onClick={() => onRowClick && onRowClick(record, index)}
                striped={striped}
                index={index}
              >
                {columns.map((column) => (
                  <TableCell key={column.key} align={column.align} compact={compact}>
                    {column.render
                      ? column.render(record[column.key], record, index)
                      : record[column.key]}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <tr>
              <td colSpan={columns.length}>
                <EmptyState>{emptyText}</EmptyState>
              </td>
            </tr>
          )}
        </TableBody>
      </StyledTable>
      {loading && (
        <LoadingOverlay>
          <LoadingSpinner />
        </LoadingOverlay>
      )}
    </TableWrapper>
  );
}