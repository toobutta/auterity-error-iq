

# Query Builder Component

s

This directory contains modular components for building a no-code database query interface within Auterity's workflow builder

.

#

# Component

s

#

## TableSelecto

r

A component for selecting database tables and their columns.

**Props:

* *

- `onTableSelect`: Callback when a table is selecte

d

- `onColumnSelect`: Callback when columns are selected/deselecte

d

- `selectedTable`: Currently selected tabl

e

- `selectedColumns`: Currently selected column

s

**Features:

* *

- Searchable table lis

t

- Column selection with visual indicator

s

- Primary key and foreign key indicator

s

- Row count displa

y

#

## QueryPrevie

w

A component for displaying query results and execution status.

**Props:

* *

- `query`: The SQL query string to displa

y

- `onExecute`: Function to execute the query and return result

s

- `isExecuting`: Loading state indicato

r

- `maxRows`: Maximum rows to display initiall

y

**Features:

* *

- Query syntax highlightin

g

- Result table with paginatio

n

- Execution time and row count displa

y

- Error handling and displa

y

#

## QueryEdito

r

A component for building queries through a visual interface.

**Props:

* *

- `selectedTable`: The table to quer

y

- `selectedColumns`: Columns to include in the quer

y

- `onQueryChange`: Callback when the generated query change

s

- `onFiltersChange`: Callback when filters chang

e

- `onSortChange`: Callback when sort order change

s

- `onAggregationChange`: Callback when aggregations chang

e

**Features:

* *

- Visual filter builde

r

- Sort configuratio

n

- Aggregation functions (COUNT, SUM, AVG, etc.

)

- Query limit settin

g

- Real-time SQL generatio

n

#

# Usage Exampl

e

```tsx
import { TableSelector, QueryEditor, QueryPreview } from './components/query-builder'

;

function QueryBuilderPage() {
  const [selectedTable, setSelectedTable] = useState();
  const [selectedColumns, setSelectedColumns] = useState([]);
  const [generatedQuery, setGeneratedQuery] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);

  const handleExecuteQuery = async () => {
    setIsExecuting(true);
    try {
      const result = await executeQuery(generatedQuery);
      return result;
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="grid grid-cols-3 gap-6">

      <TableSelector
        onTableSelect={setSelectedTable}
        onColumnSelect={setSelectedColumns}
        selectedTable={selectedTable}
        selectedColumns={selectedColumns}
      />

      <QueryEditor
        selectedTable={selectedTable?.name}
        selectedColumns={selectedColumns.map(col => col.name)}
        onQueryChange={setGeneratedQuery}
        onFiltersChange={() => {}}
        onSortChange={() => {}}
        onAggregationChange={() => {}}
      />

      <QueryPreview
        query={generatedQuery}
        onExecute={handleExecuteQuery}
        isExecuting={isExecuting}
      />
    </div>
  );
}

```

#

# Integration with Workflow Builde

r

These components are designed to integrate seamlessly with the workflow builder:

1. **Table Selection**: Users select tables and columns to define data sourc

e

s

2. **Query Building**: Visual query builder generates SQL for data transformation nod

e

s

3. **Preview**: Real-time query execution and result previ

e

w

4. **Workflow Integration**: Generated queries can be attached to workflow nod

e

s

#

# API Integratio

n

The components expect the following API endpoints:

- `GET /api/tables

`

 - List available table

s

- `GET /api/tables/{tableName}

`

 - Get table schema and metadat

a

- `POST /api/query/execute

`

 - Execute a query and return result

s

#

# Future Enhancement

s

- Support for JOIN operation

s

- Advanced filtering with date ranges and complex condition

s

- Query templates and saved querie

s

- Integration with external data sources (APIs, files, etc.

)

- Query performance optimization suggestion

s
