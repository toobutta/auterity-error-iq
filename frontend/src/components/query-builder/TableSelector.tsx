import React, { useEffect, useState } from 'react';

export interface TableInfo {
  name: string;
  schema: string;
  columns: ColumnInfo[];
  rowCount?: number;
}

export interface ColumnInfo {
  name: string;
  type: string;
  nullable: boolean;
  primaryKey?: boolean;
  foreignKey?: boolean;
}

interface TableSelectorProps {
  onTableSelect: (table: TableInfo) => void;
  onColumnSelect: (columns: ColumnInfo[]) => void;
  selectedTable?: TableInfo;
  selectedColumns?: ColumnInfo[];
}

export const TableSelector: React.FC<TableSelectorProps> = ({
  onTableSelect,
  onColumnSelect,
  selectedTable,
  selectedColumns = []
}) => {
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Mock data for demonstration - replace with actual API calls
  useEffect(() => {
    const mockTables: TableInfo[] = [
      {
        name: 'customers',
        schema: 'public',
        rowCount: 15420,
        columns: [
          { name: 'id', type: 'integer', nullable: false, primaryKey: true },
          { name: 'first_name', type: 'varchar', nullable: false },
          { name: 'last_name', type: 'varchar', nullable: false },
          { name: 'email', type: 'varchar', nullable: false },
          { name: 'phone', type: 'varchar', nullable: true },
          { name: 'created_at', type: 'timestamp', nullable: false },
          { name: 'updated_at', type: 'timestamp', nullable: false }
        ]
      },
      {
        name: 'orders',
        schema: 'public',
        rowCount: 8750,
        columns: [
          { name: 'id', type: 'integer', nullable: false, primaryKey: true },
          { name: 'customer_id', type: 'integer', nullable: false, foreignKey: true },
          { name: 'order_date', type: 'timestamp', nullable: false },
          { name: 'total_amount', type: 'decimal', nullable: false },
          { name: 'status', type: 'varchar', nullable: false },
          { name: 'created_at', type: 'timestamp', nullable: false }
        ]
      },
      {
        name: 'products',
        schema: 'public',
        rowCount: 2340,
        columns: [
          { name: 'id', type: 'integer', nullable: false, primaryKey: true },
          { name: 'name', type: 'varchar', nullable: false },
          { name: 'description', type: 'text', nullable: true },
          { name: 'price', type: 'decimal', nullable: false },
          { name: 'category', type: 'varchar', nullable: false },
          { name: 'stock_quantity', type: 'integer', nullable: false },
          { name: 'created_at', type: 'timestamp', nullable: false }
        ]
      }
    ];

    setTables(mockTables);
  }, []);

  const filteredTables = tables.filter(table =>
    table.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    table.schema.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleTableClick = async (table: TableInfo) => {
    setLoading(true);
    try {
      // In a real implementation, fetch detailed table info from API
      onTableSelect(table);
    } catch (error) {

    } finally {
      setLoading(false);
    }
  };

  const handleColumnToggle = (column: ColumnInfo) => {
    if (!selectedTable) return;

    const isSelected = selectedColumns.some(col => col.name === column.name);
    let newSelectedColumns: ColumnInfo[];

    if (isSelected) {
      newSelectedColumns = selectedColumns.filter(col => col.name !== column.name);
    } else {
      newSelectedColumns = [...selectedColumns, column];
    }

    onColumnSelect(newSelectedColumns);
  };

  const getColumnIcon = (column: ColumnInfo) => {
    if (column.primaryKey) return '🔑';
    if (column.foreignKey) return '🔗';
    return '📄';
  };

  return (
    <div className="table-selector bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold mb-4">Select Tables & Columns</h3>

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search tables..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Tables List */}
      <div className="mb-6">
        <h4 className="text-md font-medium mb-2">Available Tables</h4>
        <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-md">
          {filteredTables.map((table) => (
            <div
              key={`${table.schema}.${table.name}`}
              onClick={() => handleTableClick(table)}
              className={`p-3 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                selectedTable?.name === table.name ? 'bg-blue-50 border-blue-200' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-900">
                    {table.schema}.{table.name}
                  </div>
                  <div className="text-sm text-gray-500">
                    {table.columns.length} columns • {table.rowCount?.toLocaleString() || 'N/A'} rows
                  </div>
                </div>
                {loading && selectedTable?.name === table.name && (
                  <div className="text-blue-500">Loading...</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Columns Selection */}
      {selectedTable && (
        <div>
          <h4 className="text-md font-medium mb-2">
            Columns in {selectedTable.schema}.{selectedTable.name}
          </h4>
          <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-md">
            {selectedTable.columns.map((column) => {
              const isSelected = selectedColumns.some(col => col.name === column.name);
              return (
                <div
                  key={column.name}
                  onClick={() => handleColumnToggle(column)}
                  className={`p-3 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                    isSelected ? 'bg-green-50 border-green-200' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">{getColumnIcon(column)}</span>
                      <div>
                        <div className="font-medium text-gray-900">{column.name}</div>
                        <div className="text-sm text-gray-500">
                          {column.type} {column.nullable ? '(nullable)' : '(required)'}
                        </div>
                      </div>
                    </div>
                    {isSelected && (
                      <div className="text-green-600 font-medium">✓</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-2 text-sm text-gray-600">
            {selectedColumns.length} of {selectedTable.columns.length} columns selected
          </div>
        </div>
      )}
    </div>
  );
};


