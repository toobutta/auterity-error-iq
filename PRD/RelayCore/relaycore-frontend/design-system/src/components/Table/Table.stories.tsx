import React from 'react';
import { ComponentStory, ComponentMeta } from '@storybook/react';
import { Table } from './Table';
import { Button } from '../Button';

export default {
  title: 'Components/Table',
  component: Table,
  argTypes: {
    columns: {
      control: 'object',
      description: 'Column definitions for the table',
      table: {
        type: { summary: 'array' },
      },
    },
    data: {
      control: 'object',
      description: 'Data to display in the table',
      table: {
        type: { summary: 'array' },
      },
    },
    sortable: {
      control: 'boolean',
      description: 'Whether the table columns can be sorted',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: false },
      },
    },
    pagination: {
      control: 'object',
      description: 'Pagination configuration',
      table: {
        type: { summary: 'object' },
      },
    },
    onRowClick: {
      action: 'rowClicked',
      description: 'Function called when a row is clicked',
      table: {
        type: { summary: 'function' },
      },
    },
    loading: {
      control: 'boolean',
      description: 'Whether the table is in a loading state',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: false },
      },
    },
    emptyMessage: {
      control: 'text',
      description: 'Message to display when there is no data',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: 'No data available' },
      },
    },
  },
} as ComponentMeta<typeof Table>;

const Template: ComponentStory<typeof Table> = (args) => <Table {...args} />;

const defaultColumns = [
  {
    id: 'id',
    header: 'ID',
    accessor: 'id',
  },
  {
    id: 'name',
    header: 'Name',
    accessor: 'name',
  },
  {
    id: 'email',
    header: 'Email',
    accessor: 'email',
  },
  {
    id: 'role',
    header: 'Role',
    accessor: 'role',
  },
  {
    id: 'status',
    header: 'Status',
    accessor: 'status',
    cell: (value: string) => (
      <span
        style={{
          padding: '4px 8px',
          borderRadius: '4px',
          fontSize: '12px',
          fontWeight: 500,
          backgroundColor: value === 'Active' ? '#e6f7e6' : value === 'Inactive' ? '#f7e6e6' : '#f7f7e6',
          color: value === 'Active' ? '#2e7d32' : value === 'Inactive' ? '#d32f2f' : '#f57c00',
        }}
      >
        {value}
      </span>
    ),
  },
];

const defaultData = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john.doe@example.com',
    role: 'Admin',
    status: 'Active',
  },
  {
    id: '2',
    name: 'Jane Smith',
    email: 'jane.smith@example.com',
    role: 'User',
    status: 'Active',
  },
  {
    id: '3',
    name: 'Bob Johnson',
    email: 'bob.johnson@example.com',
    role: 'User',
    status: 'Inactive',
  },
  {
    id: '4',
    name: 'Alice Williams',
    email: 'alice.williams@example.com',
    role: 'Editor',
    status: 'Pending',
  },
  {
    id: '5',
    name: 'Charlie Brown',
    email: 'charlie.brown@example.com',
    role: 'User',
    status: 'Active',
  },
];

export const BasicTable = Template.bind({});
BasicTable.args = {
  columns: defaultColumns,
  data: defaultData,
};

export const SortableTable = Template.bind({});
SortableTable.args = {
  columns: defaultColumns,
  data: defaultData,
  sortable: true,
};

export const PaginatedTable = Template.bind({});
PaginatedTable.args = {
  columns: defaultColumns,
  data: Array(50).fill(0).map((_, i) => ({
    id: `${i + 1}`,
    name: `User ${i + 1}`,
    email: `user${i + 1}@example.com`,
    role: i % 3 === 0 ? 'Admin' : i % 3 === 1 ? 'Editor' : 'User',
    status: i % 4 === 0 ? 'Inactive' : i % 5 === 0 ? 'Pending' : 'Active',
  })),
  pagination: {
    pageSize: 10,
    pageSizeOptions: [5, 10, 20, 50],
  },
};

export const LoadingTable = Template.bind({});
LoadingTable.args = {
  columns: defaultColumns,
  data: [],
  loading: true,
};

export const EmptyTable = Template.bind({});
EmptyTable.args = {
  columns: defaultColumns,
  data: [],
  emptyMessage: 'No users found. Try adjusting your filters.',
};

export const WithRowActions = Template.bind({});
WithRowActions.args = {
  columns: [
    ...defaultColumns,
    {
      id: 'actions',
      header: 'Actions',
      cell: (_: any, row: any) => (
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button size="small" variant="tertiary">Edit</Button>
          <Button size="small" variant="danger">Delete</Button>
        </div>
      ),
    },
  ],
  data: defaultData,
};

export const WithRowSelection = () => {
  const [selectedRows, setSelectedRows] = React.useState<string[]>([]);
  
  const selectionColumn = {
    id: 'selection',
    header: (
      <input
        type="checkbox"
        checked={selectedRows.length === defaultData.length}
        onChange={(e) => {
          if (e.target.checked) {
            setSelectedRows(defaultData.map(row => row.id));
          } else {
            setSelectedRows([]);
          }
        }}
      />
    ),
    cell: (_: any, row: any) => (
      <input
        type="checkbox"
        checked={selectedRows.includes(row.id)}
        onChange={(e) => {
          if (e.target.checked) {
            setSelectedRows([...selectedRows, row.id]);
          } else {
            setSelectedRows(selectedRows.filter(id => id !== row.id));
          }
        }}
      />
    ),
    width: '40px',
  };
  
  return (
    <div>
      <div style={{ marginBottom: '16px' }}>
        {selectedRows.length > 0 && (
          <div>
            <span>{selectedRows.length} row(s) selected</span>
            <Button 
              size="small" 
              variant="tertiary" 
              style={{ marginLeft: '8px' }}
              onClick={() => setSelectedRows([])}
            >
              Clear Selection
            </Button>
          </div>
        )}
      </div>
      <Table
        columns={[selectionColumn, ...defaultColumns]}
        data={defaultData}
      />
    </div>
  );
};

export const WithCustomStyling = Template.bind({});
WithCustomStyling.args = {
  columns: defaultColumns,
  data: defaultData,
  style: {
    borderRadius: '8px',
    overflow: 'hidden',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  },
  headerStyle: {
    backgroundColor: '#f0f4f8',
  },
  rowStyle: (row, index) => ({
    backgroundColor: index % 2 === 0 ? '#ffffff' : '#f9fafb',
  }),
};

export const WithNestedData = Template.bind({});
WithNestedData.args = {
  columns: [
    {
      id: 'name',
      header: 'Name',
      accessor: 'name',
    },
    {
      id: 'email',
      header: 'Email',
      accessor: 'email',
    },
    {
      id: 'address',
      header: 'Address',
      accessor: (row) => `${row.address.street}, ${row.address.city}, ${row.address.country}`,
    },
    {
      id: 'company',
      header: 'Company',
      accessor: 'company.name',
    },
  ],
  data: [
    {
      id: '1',
      name: 'John Doe',
      email: 'john.doe@example.com',
      address: {
        street: '123 Main St',
        city: 'New York',
        country: 'USA',
      },
      company: {
        name: 'Acme Inc',
        position: 'Developer',
      },
    },
    {
      id: '2',
      name: 'Jane Smith',
      email: 'jane.smith@example.com',
      address: {
        street: '456 Park Ave',
        city: 'Boston',
        country: 'USA',
      },
      company: {
        name: 'TechCorp',
        position: 'Designer',
      },
    },
    {
      id: '3',
      name: 'Bob Johnson',
      email: 'bob.johnson@example.com',
      address: {
        street: '789 Broadway',
        city: 'San Francisco',
        country: 'USA',
      },
      company: {
        name: 'GlobalTech',
        position: 'Manager',
      },
    },
  ],
};