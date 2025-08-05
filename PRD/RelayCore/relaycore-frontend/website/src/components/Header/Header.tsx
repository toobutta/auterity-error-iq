import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Button } from '@relaycore/design-system';
import { Link } from 'react-router-dom';

const HeaderContainer = styled.header<{ isScrolled: boolean }>`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 40px;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  transition: all 0.3s ease;
  background-color: ${({ isScrolled, theme }) => 
    isScrolled ? theme.colors.white : 'transparent'};
  box-shadow: ${({ isScrolled, theme }) => 
    isScrolled ? theme.shadows.sm : 'none'};
`;

const Logo = styled(Link)`
  font-size: 1.5rem;
  font-weight: bold;
  color: ${({ theme }) => theme.colors.primary};
  text-decoration: none;
`;

const Nav = styled.nav`
  display: flex;
  align-items: center;
`;

const NavLinks = styled.div`
  display: flex;
  margin-right: 20px;
  
  @media (max-width: 768px) {
    display: none;
  }
`;

const NavLink = styled(Link)`
  margin: 0 15px;
  text-decoration: none;
  color: ${({ theme }) => theme.colors.textPrimary};
  font-weight: 500;
  transition: color 0.2s ease;
  
  &:hover {
    color: ${({ theme }) => theme.colors.primary};
  }
`;

const MobileMenuButton = styled.button`
  display: none;
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  
  @media (max-width: 768px) {
    display: block;
  }
`;

const MobileMenu = styled.div<{ isOpen: boolean }>`
  position: fixed;
  top: 80px;
  left: 0;
  right: 0;
  background-color: ${({ theme }) => theme.colors.white};
  padding: 20px;
  box-shadow: ${({ theme }) => theme.shadows.md};
  transform: translateY(${({ isOpen }) => (isOpen ? '0' : '-100%')});
  opacity: ${({ isOpen }) => (isOpen ? '1' : '0')};
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  
  @media (min-width: 769px) {
    display: none;
  }
`;

const MobileNavLink = styled(Link)`
  margin: 10px 0;
  text-decoration: none;
  color: ${({ theme }) => theme.colors.textPrimary};
  font-weight: 500;
  transition: color 0.2s ease;
  
  &:hover {
    color: ${({ theme }) => theme.colors.primary};
  }
`;

export const Header: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <>
      <HeaderContainer isScrolled={isScrolled}>
        <Logo to="/">RelayCore</Logo>
        <Nav>
          <NavLinks>
            <NavLink to="/pricing">Pricing</NavLink>
            <NavLink to="/docs">Documentation</NavLink>
            <NavLink to="/blog">Blog</NavLink>
            <NavLink to="/contact">Contact</NavLink>
          </NavLinks>
          <Button as={Link} to="/dashboard">Sign In</Button>
          <MobileMenuButton onClick={toggleMobileMenu}>
            {isMobileMenuOpen ? '✕' : '☰'}
          </MobileMenuButton>
        </Nav>
      </HeaderContainer>
      
      <MobileMenu isOpen={isMobileMenuOpen}>
        <MobileNavLink to="/pricing">Pricing</MobileNavLink>
        <MobileNavLink to="/docs">Documentation</MobileNavLink>
        <MobileNavLink to="/blog">Blog</MobileNavLink>
        <MobileNavLink to="/contact">Contact</MobileNavLink>
        <Button as={Link} to="/dashboard" fullWidth style={{ marginTop: '10px' }}>Sign In</Button>
      </MobileMenu>
    </>
  );
};