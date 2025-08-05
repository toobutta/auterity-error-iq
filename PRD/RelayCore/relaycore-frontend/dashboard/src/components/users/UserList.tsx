import React, { useState } from 'react';
import styled from 'styled-components';
import { Table, Button, Input } from '@relaycore/design-system';
import { User } from '../../types/user';

interface UserListProps {
  users: User[];
  onViewUser: (userId: string) => void;
  onEditUser: (userId: string) => void;
  onDeleteUser: (userId: string) => void;
  onInviteUser: () => void;
}

const ListContainer = styled.div`
  width: 100%;
`;

const ListHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
`;

const SearchContainer = styled.div`
  display: flex;
  align-items: center;
  width: 300px;
`;

const FilterContainer = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
`;

const FilterButton = styled(Button)<{ isActive: boolean }>`
  opacity: ${({ isActive }) => (isActive ? 1 : 0.7)};
`;

export const UserList: React.FC<UserListProps> = ({
  users,
  onViewUser,
  onEditUser,
  onDeleteUser,
  onInviteUser,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleFilterClick = (filter: string) => {
    setActiveFilter(activeFilter === filter ? null : filter);
  };

  // Filter users based on search term and active filter
  const filteredUsers = users.filter(user => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.role.toLowerCase().includes(searchTerm.toLowerCase());

    if (!activeFilter) return matchesSearch;

    return matchesSearch && user.role.toLowerCase() === activeFilter.toLowerCase();
  });

  const columns = [
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
      cell: (value: string) => (
        <span
          style={{
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '12px',
            fontWeight: 500,
            backgroundColor:
              value === 'Admin'
                ? '#e3f2fd'
                : value === 'Editor'
                ? '#e8f5e9'
                : '#f5f5f5',
            color:
              value === 'Admin'
                ? '#1976d2'
                : value === 'Editor'
                ? '#388e3c'
                : '#616161',
          }}
        >
          {value}
        </span>
      ),
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
            backgroundColor:
              value === 'Active'
                ? '#e8f5e9'
                : value === 'Pending'
                ? '#fff8e1'
                : '#ffebee',
            color:
              value === 'Active'
                ? '#388e3c'
                : value === 'Pending'
                ? '#f57c00'
                : '#d32f2f',
          }}
        >
          {value}
        </span>
      ),
    },
    {
      id: 'lastActive',
      header: 'Last Active',
      accessor: 'lastActive',
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: (_: any, row: User) => (
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button size="small" variant="tertiary" onClick={() => onViewUser(row.id)}>
            View
          </Button>
          <Button size="small" variant="tertiary" onClick={() => onEditUser(row.id)}>
            Edit
          </Button>
          <Button size="small" variant="danger" onClick={() => onDeleteUser(row.id)}>
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <ListContainer>
      <ListHeader>
        <SearchContainer>
          <Input
            placeholder="Search users..."
            value={searchTerm}
            onChange={handleSearchChange}
            leftIcon="🔍"
          />
        </SearchContainer>
        <Button onClick={onInviteUser}>Invite User</Button>
      </ListHeader>

      <FilterContainer>
        <FilterButton
          size="small"
          variant="tertiary"
          isActive={activeFilter === 'admin'}
          onClick={() => handleFilterClick('admin')}
        >
          Admins
        </FilterButton>
        <FilterButton
          size="small"
          variant="tertiary"
          isActive={activeFilter === 'editor'}
          onClick={() => handleFilterClick('editor')}
        >
          Editors
        </FilterButton>
        <FilterButton
          size="small"
          variant="tertiary"
          isActive={activeFilter === 'user'}
          onClick={() => handleFilterClick('user')}
        >
          Users
        </FilterButton>
        <FilterButton
          size="small"
          variant="tertiary"
          isActive={activeFilter === 'pending'}
          onClick={() => handleFilterClick('pending')}
        >
          Pending
        </FilterButton>
      </FilterContainer>

      <Table
        columns={columns}
        data={filteredUsers}
        pagination={{
          pageSize: 10,
          pageSizeOptions: [5, 10, 20, 50],
        }}
        onRowClick={(row) => onViewUser(row.id)}
        emptyMessage="No users found"
      />
    </ListContainer>
  );
};