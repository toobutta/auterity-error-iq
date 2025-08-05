import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { Navigation, Button, Card } from '@relaycore/design-system';
import { useAuth } from '../../context/AuthContext';

interface LayoutProps {
  children: React.ReactNode;
}

const LayoutContainer = styled.div`
  display: flex;
  height: 100vh;
  width: 100%;
`;

const Sidebar = styled.aside`
  width: 240px;
  height: 100%;
  background-color: ${({ theme }) => theme.colors.backgroundDark};
  color: ${({ theme }) => theme.colors.white};
  overflow-y: auto;
  transition: width 0.3s ease;

  @media (max-width: 768px) {
    width: ${({ collapsed }: { collapsed?: boolean }) => (collapsed ? '0' : '240px')};
    position: fixed;
    z-index: 1000;
    top: 0;
    left: 0;
    height: 100%;
  }
`;

const Logo = styled.div`
  padding: 20px;
  font-size: 24px;
  font-weight: bold;
  color: ${({ theme }) => theme.colors.white};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
`;

const Content = styled.main`
  flex: 1;
  overflow-y: auto;
  background-color: ${({ theme }) => theme.colors.backgroundLight};
  transition: margin-left 0.3s ease;

  @media (max-width: 768px) {
    margin-left: ${({ sidebarCollapsed }: { sidebarCollapsed?: boolean }) => (sidebarCollapsed ? '0' : '240px')};
    width: 100%;
  }
`;

const Header = styled.header`
  height: 64px;
  background-color: ${({ theme }) => theme.colors.white};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
`;

const PageContent = styled.div`
  padding: 20px;
`;

const SearchBar = styled.div`
  display: flex;
  align-items: center;
`;

const SearchInput = styled.input`
  padding: 8px 12px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 4px;
  outline: none;
  
  &:focus {
    border-color: ${({ theme }) => theme.colors.primary};
  }
`;

const UserMenu = styled.div`
  position: relative;
`;

const UserButton = styled.button`
  display: flex;
  align-items: center;
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px;
  border-radius: 4px;
  
  &:hover {
    background-color: ${({ theme }) => theme.colors.backgroundLight};
  }
`;

const UserAvatar = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: ${({ theme }) => theme.colors.primary};
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  margin-right: 8px;
`;

const UserName = styled.span`
  margin-right: 8px;
`;

const UserDropdown = styled(Card)`
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 8px;
  width: 200px;
  z-index: 1000;
`;

const DropdownItem = styled.div`
  padding: 10px 16px;
  cursor: pointer;
  
  &:hover {
    background-color: ${({ theme }) => theme.colors.backgroundLight};
  }
`;

const MobileMenuButton = styled.button`
  display: none;
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: ${({ theme }) => theme.colors.textPrimary};
  
  @media (max-width: 768px) {
    display: block;
  }
`;

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);

  const navItems = [
    {
      key: 'dashboard',
      label: 'Dashboard',
      href: '/',
    },
    {
      key: 'requests',
      label: 'Request Logs',
      href: '/requests',
    },
    {
      key: 'analytics',
      label: 'Analytics',
      href: '/analytics',
    },
    {
      key: 'steering',
      label: 'Steering Rules',
      href: '/steering',
    },
    {
      key: 'config',
      label: 'Configuration',
      href: '/config',
    },
    {
      key: 'plugins',
      label: 'Plugins',
      href: '/plugins',
    },
    {
      key: 'users',
      label: 'Users',
      href: '/users',
    },
    {
      key: 'settings',
      label: 'Settings',
      href: '/settings',
    },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleUserMenu = () => {
    setUserMenuOpen(!userMenuOpen);
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  // Get user initials for avatar
  const getUserInitials = () => {
    if (!user || !user.name) return '?';
    
    const nameParts = user.name.split(' ');
    if (nameParts.length === 1) {
      return nameParts[0].charAt(0).toUpperCase();
    }
    
    return (
      nameParts[0].charAt(0).toUpperCase() + 
      nameParts[nameParts.length - 1].charAt(0).toUpperCase()
    );
  };

  return (
    <LayoutContainer>
      <Sidebar collapsed={sidebarCollapsed}>
        <Logo>RelayCore</Logo>
        <Navigation 
          items={navItems} 
          mode="vertical" 
          theme="dark"
        />
      </Sidebar>
      <Content sidebarCollapsed={sidebarCollapsed}>
        <Header>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <MobileMenuButton onClick={toggleSidebar}>
              ☰
            </MobileMenuButton>
            <SearchBar>
              <SearchInput placeholder="Search..." />
            </SearchBar>
          </div>
          <UserMenu>
            <UserButton onClick={toggleUserMenu}>
              <UserAvatar>{getUserInitials()}</UserAvatar>
              <UserName>{user?.name}</UserName>
              <span>▼</span>
            </UserButton>
            {userMenuOpen && (
              <UserDropdown>
                <DropdownItem onClick={() => navigate('/profile')}>
                  Profile
                </DropdownItem>
                <DropdownItem onClick={() => navigate('/settings')}>
                  Settings
                </DropdownItem>
                <DropdownItem onClick={handleLogout}>
                  Logout
                </DropdownItem>
              </UserDropdown>
            )}
          </UserMenu>
        </Header>
        <PageContent>{children}</PageContent>
      </Content>
    </LayoutContainer>
  );
};