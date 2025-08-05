import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { UserList, UserDetail, UserForm, InviteUserModal } from '../../components/users';
import { User } from '../../types/user';

// Mock data for users
const mockUsers: User[] = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john.doe@example.com',
    role: 'Admin',
    status: 'Active',
    lastActive: '2 hours ago',
    createdAt: '2023-01-15',
    permissions: ['read:logs', 'write:logs', 'read:config', 'write:config', 'manage:users', 'manage:api_keys'],
    teams: ['engineering', 'product'],
    apiKeys: [
      {
        id: 'key1',
        name: 'Development API Key',
        lastUsed: '1 hour ago',
        createdAt: '2023-03-10',
      },
      {
        id: 'key2',
        name: 'Production API Key',
        lastUsed: '5 days ago',
        createdAt: '2023-02-20',
      },
    ],
  },
  {
    id: '2',
    name: 'Jane Smith',
    email: 'jane.smith@example.com',
    role: 'Editor',
    status: 'Active',
    lastActive: '1 day ago',
    createdAt: '2023-02-20',
    permissions: ['read:logs', 'read:config', 'write:config'],
    teams: ['product', 'design'],
  },
  {
    id: '3',
    name: 'Bob Johnson',
    email: 'bob.johnson@example.com',
    role: 'User',
    status: 'Inactive',
    lastActive: '30 days ago',
    createdAt: '2023-01-05',
    permissions: ['read:logs'],
    teams: ['support'],
  },
  {
    id: '4',
    name: 'Alice Williams',
    email: 'alice.williams@example.com',
    role: 'Editor',
    status: 'Active',
    lastActive: '3 hours ago',
    createdAt: '2023-03-10',
    permissions: ['read:logs', 'read:config'],
    teams: ['marketing', 'design'],
  },
  {
    id: '5',
    name: 'Charlie Brown',
    email: 'charlie.brown@example.com',
    role: 'User',
    status: 'Pending',
    lastActive: 'Never',
    createdAt: '2023-04-01',
    permissions: ['read:logs'],
  },
];

enum View {
  LIST,
  DETAIL,
  CREATE,
  EDIT,
}

const PageContainer = styled.div`
  padding: 20px;
`;

export const Users: React.FC = () => {
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [currentView, setCurrentView] = useState<View>(View.LIST);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  const selectedUser = selectedUserId ? users.find(user => user.id === selectedUserId) : undefined;

  const handleViewUser = (userId: string) => {
    setSelectedUserId(userId);
    setCurrentView(View.DETAIL);
  };

  const handleEditUser = (userId: string) => {
    setSelectedUserId(userId);
    setCurrentView(View.EDIT);
  };

  const handleDeleteUser = (userId: string) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      setUsers(users.filter(user => user.id !== userId));
    }
  };

  const handleCreateUser = () => {
    setSelectedUserId(null);
    setCurrentView(View.CREATE);
  };

  const handleUserFormSubmit = (userData: Partial<User>) => {
    if (currentView === View.CREATE) {
      // In a real app, this would be an API call
      const newUser: User = {
        id: `user-${Date.now()}`,
        name: userData.name || '',
        email: userData.email || '',
        role: (userData.role as User['role']) || 'User',
        status: 'Active',
        lastActive: 'Never',
        createdAt: new Date().toISOString().split('T')[0],
        permissions: userData.permissions || [],
        teams: userData.teams || [],
      };
      
      setUsers([...users, newUser]);
      setCurrentView(View.LIST);
    } else if (currentView === View.EDIT && selectedUserId) {
      // In a real app, this would be an API call
      setUsers(
        users.map(user =>
          user.id === selectedUserId ? { ...user, ...userData } : user
        )
      );
      setCurrentView(View.DETAIL);
    }
  };

  const handleInviteUser = (data: { email: string; role: string; message?: string }) => {
    // In a real app, this would be an API call to send an invitation
    console.log('Inviting user:', data);
    
    // For demo purposes, add a new pending user
    const newUser: User = {
      id: `user-${Date.now()}`,
      name: data.email.split('@')[0], // Use part of email as name until user completes registration
      email: data.email,
      role: data.role as User['role'],
      status: 'Pending',
      lastActive: 'Never',
      createdAt: new Date().toISOString().split('T')[0],
    };
    
    setUsers([...users, newUser]);
  };

  const handleResetPassword = () => {
    // In a real app, this would be an API call to trigger password reset
    alert('Password reset email has been sent.');
  };

  const handleDeactivateUser = () => {
    if (selectedUserId) {
      setUsers(
        users.map(user => {
          if (user.id === selectedUserId) {
            return {
              ...user,
              status: user.status === 'Active' ? 'Inactive' : 'Active',
            };
          }
          return user;
        })
      );
    }
  };

  return (
    <PageContainer>
      {currentView === View.LIST && (
        <>
          <h1>Users</h1>
          <UserList
            users={users}
            onViewUser={handleViewUser}
            onEditUser={handleEditUser}
            onDeleteUser={handleDeleteUser}
            onInviteUser={() => setIsInviteModalOpen(true)}
          />
        </>
      )}

      {currentView === View.DETAIL && selectedUser && (
        <UserDetail
          user={selectedUser}
          onEdit={() => setCurrentView(View.EDIT)}
          onBack={() => setCurrentView(View.LIST)}
          onResetPassword={handleResetPassword}
          onDeactivate={handleDeactivateUser}
        />
      )}

      {currentView === View.CREATE && (
        <UserForm
          isEditing={false}
          onSubmit={handleUserFormSubmit}
          onCancel={() => setCurrentView(View.LIST)}
        />
      )}

      {currentView === View.EDIT && selectedUser && (
        <UserForm
          user={selectedUser}
          isEditing={true}
          onSubmit={handleUserFormSubmit}
          onCancel={() => setCurrentView(View.DETAIL)}
        />
      )}

      <InviteUserModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        onInvite={handleInviteUser}
      />
    </PageContainer>
  );
};