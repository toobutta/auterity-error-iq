import React, { forwardRef, useState, useMemo } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../../utils/cn';

const tableVariants = cva(
  'w-full caption-bottom text-sm',
  {
    variants: {
      variant: {
        default: '',
        bordered: 'border-collapse border',
        striped: '[&_tbody_tr:nth-child(odd)]:bg-muted/50',
        hover: '[&_tbody_tr:hover]:bg-muted/50',
      },
      size: {
        default: '',
        sm: '[&_td]:px-2 [&_td]:py-1 [&_th]:px-2 [&_th]:py-1',
        lg: '[&_td]:px-6 [&_td]:py-4 [&_th]:px-6 [&_th]:py-4',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface TableProps
  extends React.TableHTMLAttributes<HTMLTableElement>,
    VariantProps<typeof tableVariants> {}

const Table = forwardRef<HTMLTableElement, TableProps>(
  ({ className, variant, size, ...props }, ref) => (
    <div className="relative w-full overflow-auto">
      <table
        ref={ref}
        className={cn(tableVariants({ variant, size }), className)}
        {...props}
      />
    </div>
  )
);

Table.displayName = 'Table';

export interface TableHeaderProps extends React.HTMLAttributes<HTMLTableSectionElement> {}

const TableHeader = forwardRef<HTMLTableSectionElement, TableHeaderProps>(
  ({ className, ...props }, ref) => (
    <thead ref={ref} className={cn('[&_tr]:border-b', className)} {...props} />
  )
);

TableHeader.displayName = 'TableHeader';

export interface TableBodyProps extends React.HTMLAttributes<HTMLTableSectionElement> {}

const TableBody = forwardRef<HTMLTableSectionElement, TableBodyProps>(
  ({ className, ...props }, ref) => (
    <tbody ref={ref} className={cn('[&_tr:last-child]:border-0', className)} {...props} />
  )
);

TableBody.displayName = 'TableBody';

export interface TableFooterProps extends React.HTMLAttributes<HTMLTableSectionElement> {}

const TableFooter = forwardRef<HTMLTableSectionElement, TableFooterProps>(
  ({ className, ...props }, ref) => (
    <tfoot
      ref={ref}
      className={cn(
        'border-t bg-muted/50 font-medium [&>tr]:last:border-b-0',
        className
      )}
      {...props}
    />
  )
);

TableFooter.displayName = 'TableFooter';

export interface TableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {}

const TableRow = forwardRef<HTMLTableRowElement, TableRowProps>(
  ({ className, ...props }, ref) => (
    <tr
      ref={ref}
      className={cn(
        'border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted',
        className
      )}
      {...props}
    />
  )
);

TableRow.displayName = 'TableRow';

export interface TableHeadProps extends React.ThHTMLAttributes<HTMLTableCellElement> {
  sortable?: boolean;
  sortDirection?: 'asc' | 'desc' | null;
  onSort?: () => void;
}

const TableHead = forwardRef<HTMLTableCellElement, TableHeadProps>(
  ({ className, sortable, sortDirection, onSort, children, ...props }, ref) => (
    <th
      ref={ref}
      className={cn(
        'h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0',
        sortable && 'cursor-pointer select-none hover:text-foreground',
        className
      )}
      onClick={sortable ? onSort : undefined}
      {...props}
    >
      <div className="flex items-center gap-2">
        {children}
        {sortable && (
          <div className="flex flex-col">
            <svg
              className={cn(
                'w-3 h-3 transition-colors',
                sortDirection === 'asc' ? 'text-foreground' : 'text-muted-foreground'
              )}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z"
                clipRule="evenodd"
              />
            </svg>
            <svg
              className={cn(
                'w-3 h-3 transition-colors -mt-1',
                sortDirection === 'desc' ? 'text-foreground' : 'text-muted-foreground'
              )}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        )}
      </div>
    </th>
  )
);

TableHead.displayName = 'TableHead';

export interface TableCellProps extends React.TdHTMLAttributes<HTMLTableCellElement> {}

const TableCell = forwardRef<HTMLTableCellElement, TableCellProps>(
  ({ className, ...props }, ref) => (
    <td
      ref={ref}
      className={cn('p-4 align-middle [&:has([role=checkbox])]:pr-0', className)}
      {...props}
    />
  )
);

TableCell.displayName = 'TableCell';

export interface TableCaptionProps extends React.HTMLAttributes<HTMLTableCaptionElement> {}

const TableCaption = forwardRef<HTMLTableCaptionElement, TableCaptionProps>(
  ({ className, ...props }, ref) => (
    <caption
      ref={ref}
      className={cn('mt-4 text-sm text-muted-foreground', className)}
      {...props}
    />
  )
);

TableCaption.displayName = 'TableCaption';

// Enhanced table components with data handling
export interface DataTableColumn<T = any> {
  key: keyof T | string;
  title: string;
  sortable?: boolean;
  filterable?: boolean;
  width?: string | number;
  render?: (value: any, record: T, index: number) => React.ReactNode;
  sorter?: (a: T, b: T) => number;
  filterOptions?: Array<{ label: string; value: any }>;
}

export interface DataTableProps<T = any> {
  data: T[];
  columns: DataTableColumn<T>[];
  loading?: boolean;
  pagination?: {
    current: number;
    pageSize: number;
    total: number;
    showSizeChanger?: boolean;
    pageSizeOptions?: number[];
    onChange: (page: number, pageSize: number) => void;
  };
  rowSelection?: {
    selectedRowKeys: React.Key[];
    onChange: (selectedRowKeys: React.Key[], selectedRows: T[]) => void;
    getCheckboxProps?: (record: T) => any;
  };
  expandable?: {
    expandedRowRender: (record: T, index: number) => React.ReactNode;
    rowExpandable?: (record: T) => boolean;
  };
  size?: 'small' | 'middle' | 'large';
  bordered?: boolean;
  striped?: boolean;
  className?: string;
  emptyText?: string;
}

function DataTable<T extends Record<string, any>>({
  data,
  columns,
  loading = false,
  pagination,
  rowSelection,
  expandable,
  size = 'middle',
  bordered = false,
  striped = false,
  className,
  emptyText = 'No data available',
}: DataTableProps<T>) {
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'asc' | 'desc' | null;
  } | null>(null);

  const [filters, setFilters] = useState<Record<string, any>>({});

  // Sorting logic
  const sortedData = useMemo(() => {
    if (!sortConfig || !sortConfig.key) return data;

    return [...data].sort((a, b) => {
      const column = columns.find(col => col.key === sortConfig.key);
      if (column?.sorter) {
        return sortConfig.direction === 'asc'
          ? column.sorter(a, b)
          : column.sorter(b, a);
      }

      const aValue = a[sortConfig.key as keyof T];
      const bValue = b[sortConfig.key as keyof T];

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [data, sortConfig, columns]);

  // Filtering logic
  const filteredData = useMemo(() => {
    return sortedData.filter(item => {
      return Object.entries(filters).every(([key, filterValue]) => {
        if (!filterValue || filterValue.length === 0) return true;

        const value = item[key];
        if (Array.isArray(filterValue)) {
          return filterValue.includes(value);
        }
        return String(value).toLowerCase().includes(String(filterValue).toLowerCase());
      });
    });
  }, [sortedData, filters]);

  // Pagination logic
  const paginatedData = useMemo(() => {
    if (!pagination) return filteredData;

    const { current, pageSize } = pagination;
    const startIndex = (current - 1) * pageSize;
    return filteredData.slice(startIndex, startIndex + pageSize);
  }, [filteredData, pagination]);

  const handleSort = (key: string) => {
    setSortConfig(current => {
      if (current?.key === key) {
        if (current.direction === 'asc') {
          return { key, direction: 'desc' };
        } else if (current.direction === 'desc') {
          return null; // Reset to no sorting
        }
      }
      return { key, direction: 'asc' };
    });
  };

  const handleFilter = (key: string, value: any) => {
    setFilters(current => ({
      ...current,
      [key]: value
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center py-8 text-muted-foreground">
        {emptyText}
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Filters */}
      {columns.some(col => col.filterable) && (
        <div className="flex gap-4 flex-wrap">
          {columns
            .filter(col => col.filterable)
            .map(column => (
              <div key={String(column.key)} className="min-w-32">
                <select
                  className="w-full px-3 py-2 border border-input rounded-md text-sm"
                  onChange={(e) => handleFilter(String(column.key), e.target.value)}
                  value={filters[String(column.key)] || ''}
                >
                  <option value="">{`All ${column.title}`}</option>
                  {column.filterOptions?.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            ))}
        </div>
      )}

      {/* Table */}
      <Table
        variant={cn(
          bordered && 'bordered',
          striped && 'striped',
          'hover'
        )}
        size={size === 'small' ? 'sm' : size === 'large' ? 'lg' : 'default'}
      >
        <TableHeader>
          <TableRow>
            {rowSelection && (
              <TableHead className="w-12">
                <input
                  type="checkbox"
                  checked={rowSelection.selectedRowKeys.length === paginatedData.length}
                  onChange={(e) => {
                    if (e.target.checked) {
                      rowSelection.onChange(
                        paginatedData.map((_, index) => index),
                        paginatedData
                      );
                    } else {
                      rowSelection.onChange([], []);
                    }
                  }}
                />
              </TableHead>
            )}
            {columns.map((column, index) => (
              <TableHead
                key={String(column.key)}
                sortable={column.sortable}
                sortDirection={
                  sortConfig?.key === column.key ? sortConfig.direction : null
                }
                onSort={() => column.sortable && handleSort(String(column.key))}
                style={column.width ? { width: column.width } : undefined}
              >
                {column.title}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginatedData.map((record, index) => (
            <React.Fragment key={index}>
              <TableRow>
                {rowSelection && (
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={rowSelection.selectedRowKeys.includes(index)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          rowSelection.onChange(
                            [...rowSelection.selectedRowKeys, index],
                            [...paginatedData.filter((_, i) =>
                              [...rowSelection.selectedRowKeys, index].includes(i)
                            )]
                          );
                        } else {
                          rowSelection.onChange(
                            rowSelection.selectedRowKeys.filter(key => key !== index),
                            paginatedData.filter((_, i) =>
                              rowSelection.selectedRowKeys.filter(key => key !== index).includes(i)
                            )
                          );
                        }
                      }}
                      {...rowSelection.getCheckboxProps?.(record)}
                    />
                  </TableCell>
                )}
                {columns.map(column => (
                  <TableCell key={String(column.key)}>
                    {column.render
                      ? column.render(record[column.key as keyof T], record, index)
                      : String(record[column.key as keyof T] || '')
                    }
                  </TableCell>
                ))}
              </TableRow>
              {expandable && expandable.rowExpandable?.(record) && (
                <TableRow>
                  <TableCell
                    colSpan={columns.length + (rowSelection ? 1 : 0)}
                    className="bg-muted/50"
                  >
                    {expandable.expandedRowRender(record, index)}
                  </TableCell>
                </TableRow>
              )}
            </React.Fragment>
          ))}
        </TableBody>
      </Table>

      {/* Pagination */}
      {pagination && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {(pagination.current - 1) * pagination.pageSize + 1} to{' '}
            {Math.min(pagination.current * pagination.pageSize, pagination.total)} of{' '}
            {pagination.total} entries
          </div>
          <div className="flex items-center gap-2">
            {pagination.showSizeChanger && (
              <select
                className="px-3 py-2 border border-input rounded-md text-sm"
                value={pagination.pageSize}
                onChange={(e) => pagination.onChange(1, Number(e.target.value))}
              >
                {pagination.pageSizeOptions?.map(size => (
                  <option key={size} value={size}>
                    {size} per page
                  </option>
                ))}
              </select>
            )}
            <div className="flex gap-1">
              <button
                onClick={() => pagination.onChange(pagination.current - 1, pagination.pageSize)}
                disabled={pagination.current === 1}
                className="px-3 py-2 border border-input rounded-md text-sm hover:bg-accent disabled:opacity-50"
              >
                Previous
              </button>
              {/* Page numbers would go here */}
              <button
                onClick={() => pagination.onChange(pagination.current + 1, pagination.pageSize)}
                disabled={pagination.current * pagination.pageSize >= pagination.total}
                className="px-3 py-2 border border-input rounded-md text-sm hover:bg-accent disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
  DataTable,
  tableVariants,
};
