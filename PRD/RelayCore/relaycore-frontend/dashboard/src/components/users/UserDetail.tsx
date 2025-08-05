import React, { useState } from 'react';
import styled from 'styled-components';
import { Card, CardHeader, CardBody, Button, Table } from '@relaycore/design-system';
import { User } from '../../types/user';

interface UserDetailProps {
  user: User;
  onEdit: () => void;
  onBack: () => void;
  onResetPassword: () => void;
  onDeactivate: () => void;
}

const DetailContainer = styled.div`
  width: 100%;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
`;

const BackButton = styled(Button)`
  margin-right: 16px;
`;

const HeaderActions = styled.div`
  display: flex;
  gap: 8px;
`;

const UserInfoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
  margin-bottom: 24px;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const ProfileSection = styled(Card)`
  grid-column: 1;
  grid-row: 1 / span 2;
`;

const UserAvatar = styled.div<{ src?: string }>`
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background-color: ${({ theme }) => theme.colors.primary};
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36px;
  font-weight: bold;
  margin: 0 auto 16px;
  background-image: ${({ src }) => (src ? `url(${src})` : 'none')};
  background-size: cover;
  background-position: center;
`;

const UserName = styled.h2`
  text-align: center;
  margin: 0 0 8px;
`;

const UserEmail = styled.p`
  text-align: center;
  margin: 0 0 16px;
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const UserRole = styled.div`
  text-align: center;
  margin: 0 0 24px;
  
  span {
    padding: 4px 12px;
    border-radius: 16px;
    font-size: 14px;
    font-weight: 500;
    background-color: ${({ theme }) => theme.colors.backgroundLight};
  }
`;

const InfoItem = styled.div`
  margin-bottom: 16px;
`;

const InfoLabel = styled.div`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-bottom: 4px;
`;

const InfoValue = styled.div`
  font-size: 14px;
`;

const TabContainer = styled.div`
  margin-top: 24px;
`;

const TabHeader = styled.div`
  display: flex;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  margin-bottom: 16px;
`;

const TabButton = styled.button<{ active: boolean }>`
  padding: 12px 16px;
  background: none;
  border: none;
  border-bottom: 2px solid ${({ active, theme }) => (active ? theme.colors.primary : 'transparent')};
  color: ${({ active, theme }) => (active ? theme.colors.primary : theme.colors.textPrimary)};
  font-weight: ${({ active }) => (active ? 'bold' : 'normal')};
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    color: ${({ theme }) => theme.colors.primary};
  }
`;

const TabContent = styled.div`
  padding: 16px 0;
`;

export const UserDetail: React.FC<UserDetailProps> = ({
  user,
  onEdit,
  onBack,
  onResetPassword,
  onDeactivate,
}) => {
  const [activeTab, setActiveTab] = useState('permissions');

  // Get user initials for avatar
  const getUserInitials = () => {
    const nameParts = user.name.split(' ');
    if (nameParts.length === 1) {
      return nameParts[0].charAt(0).toUpperCase();
    }
    
    return (
      nameParts[0].charAt(0).toUpperCase() + 
      nameParts[nameParts.length - 1].charAt(0).toUpperCase()
    );
  };

  const permissionsColumns = [
    {
      id: 'permission',
      header: 'Permission',
      accessor: (item: string) => item,
    },
  ];

  const apiKeysColumns = [
    {
      id: 'name',
      header: 'Name',
      accessor: 'name',
    },
    {
      id: 'lastUsed',
      header: 'Last Used',
      accessor: 'lastUsed',
    },
    {
      id: 'createdAt',
      header: 'Created At',
      accessor: 'createdAt',
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: () => (
        <Button size="small" variant="danger">
          Revoke
        </Button>
      ),
    },
  ];

  const teamsColumns = [
    {
      id: 'team',
      header: 'Team',
      accessor: (item: string) => item,
    },
  ];

  return (
    <DetailContainer>
      <Header>
        <div>
          <BackButton variant="tertiary" onClick={onBack}>
            ← Back to Users
          </BackButton>
          <h1>User Details</h1>
        </div>
        <HeaderActions>
          <Button variant="tertiary" onClick={onResetPassword}>
            Reset Password
          </Button>
          <Button variant="danger" onClick={onDeactivate}>
            {user.status === 'Active' ? 'Deactivate' : 'Activate'} User
          </Button>
          <Button onClick={onEdit}>Edit User</Button>
        </HeaderActions>
      </Header>

      <UserInfoGrid>
        <ProfileSection>
          <CardBody>
            {user.avatar ? (
              <UserAvatar src={user.avatar} />
            ) : (
              <UserAvatar>{getUserInitials()}</UserAvatar>
            )}
            <UserName>{user.name}</UserName>
            <UserEmail>{user.email}</UserEmail>
            <UserRole>
              <span>{user.role}</span>
            </UserRole>

            <InfoItem>
              <InfoLabel>Status</InfoLabel>
              <InfoValue>{user.status}</InfoValue>
            </InfoItem>
            <InfoItem>
              <InfoLabel>Last Active</InfoLabel>
              <InfoValue>{user.lastActive}</InfoValue>
            </InfoItem>
            <InfoItem>
              <InfoLabel>Created At</InfoLabel>
              <InfoValue>{user.createdAt}</InfoValue>
            </InfoItem>
          </CardBody>
        </ProfileSection>

        <Card>
          <CardHeader>User Activity</CardHeader>
          <CardBody>
            <p>Activity chart will be displayed here</p>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>Usage Statistics</CardHeader>
          <CardBody>
            <p>Usage statistics will be displayed here</p>
          </CardBody>
        </Card>
      </UserInfoGrid>

      <Card>
        <CardBody>
          <TabContainer>
            <TabHeader>
              <TabButton
                active={activeTab === 'permissions'}
                onClick={() => setActiveTab('permissions')}
              >
                Permissions
              </TabButton>
              <TabButton
                active={activeTab === 'apiKeys'}
                onClick={() => setActiveTab('apiKeys')}
              >
                API Keys
              </TabButton>
              <TabButton
                active={activeTab === 'teams'}
                onClick={() => setActiveTab('teams')}
              >
                Teams
              </TabButton>
            </TabHeader>

            <TabContent>
              {activeTab === 'permissions' && (
                <Table
                  columns={permissionsColumns}
                  data={user.permissions || []}
                  emptyMessage="No permissions assigned"
                />
              )}

              {activeTab === 'apiKeys' && (
                <Table
                  columns={apiKeysColumns}
                  data={user.apiKeys || []}
                  emptyMessage="No API keys found"
                />
              )}

              {activeTab === 'teams' && (
                <Table
                  columns={teamsColumns}
                  data={user.teams || []}
                  emptyMessage="Not a member of any teams"
                />
              )}
            </TabContent>
          </TabContainer>
        </CardBody>
      </Card>
    </DetailContainer>
  );
};