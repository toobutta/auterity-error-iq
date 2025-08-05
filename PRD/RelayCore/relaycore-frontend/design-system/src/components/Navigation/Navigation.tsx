import React, { useState } from 'react';
import styled, { css } from 'styled-components';
import { tokens } from '../../tokens';

export interface NavItem {
  key: string;
  label: React.ReactNode;
  icon?: React.ReactNode;
  href?: string;
  onClick?: () => void;
  children?: NavItem[];
  disabled?: boolean;
}

export interface NavigationProps {
  items: NavItem[];
  activeKey?: string;
  onSelect?: (key: string) => void;
  mode?: 'horizontal' | 'vertical';
  collapsed?: boolean;
  collapsible?: boolean;
  theme?: 'light' | 'dark';
}

const NavContainer = styled.nav<{
  mode: 'horizontal' | 'vertical';
  theme: 'light' | 'dark';
  collapsed?: boolean;
}>`
  display: flex;
  flex-direction: ${({ mode }) => (mode === 'horizontal' ? 'row' : 'column')};
  background-color: ${({ theme: colorTheme, theme: { colors } }) => 
    colorTheme === 'light' ? colors.white : colors.backgroundDark};
  border-radius: ${tokens.borders.radius.md};
  
  ${({ mode, collapsed }) =>
    mode === 'vertical' &&
    css`
      width: ${collapsed ? '64px' : '240px'};
      transition: width ${tokens.animations.duration.normal} ${tokens.animations.easing.easeInOut};
      overflow: ${collapsed ? 'visible' : 'auto'};
      height: 100%;
    `}
  
  ${({ mode }) =>
    mode === 'horizontal' &&
    css`
      width: 100%;
      overflow-x: auto;
      overflow-y: hidden;
    `}
`;

const NavList = styled.ul<{
  mode: 'horizontal' | 'vertical';
  level?: number;
  isSubmenu?: boolean;
  isOpen?: boolean;
  theme: 'light' | 'dark';
}>`
  list-style: none;
  margin: 0;
  padding: ${({ isSubmenu }) => (isSubmenu ? '0' : tokens.spacing.xs)};
  display: flex;
  flex-direction: ${({ mode }) => (mode === 'horizontal' ? 'row' : 'column')};
  width: 100%;
  
  ${({ isSubmenu, isOpen, mode }) =>
    isSubmenu &&
    mode === 'vertical' &&
    css`
      max-height: ${isOpen ? '1000px' : '0'};
      overflow: hidden;
      transition: max-height ${tokens.animations.duration.normal} ${tokens.animations.easing.easeInOut};
      padding-left: ${tokens.spacing.md};
    `}
  
  ${({ isSubmenu, isOpen, mode }) =>
    isSubmenu &&
    mode === 'horizontal' &&
    css`
      position: absolute;
      top: 100%;
      left: 0;
      background-color: ${({ theme }) => theme.colors.white};
      border-radius: ${tokens.borders.radius.md};
      box-shadow: ${tokens.shadows.md};
      min-width: 200px;
      display: ${isOpen ? 'flex' : 'none'};
      z-index: ${tokens.zIndex.dropdown};
    `}
`;

const NavItemContainer = styled.li<{
  mode: 'horizontal' | 'vertical';
  isActive?: boolean;
  disabled?: boolean;
  hasChildren?: boolean;
  collapsed?: boolean;
  theme: 'light' | 'dark';
}>`
  position: relative;
  margin: ${({ mode }) => (mode === 'horizontal' ? `0 ${tokens.spacing.xs}` : `${tokens.spacing.xs} 0`)};
  
  ${({ mode, collapsed }) =>
    mode === 'vertical' &&
    collapsed &&
    css`
      display: flex;
      justify-content: center;
      align-items: center;
    `}
  
  ${({ disabled }) =>
    disabled &&
    css`
      opacity: 0.5;
      pointer-events: none;
    `}
`;

const NavItemContent = styled.div<{
  mode: 'horizontal' | 'vertical';
  isActive?: boolean;
  hasChildren?: boolean;
  collapsed?: boolean;
  theme: 'light' | 'dark';
}>`
  display: flex;
  align-items: center;
  padding: ${tokens.spacing.sm} ${tokens.spacing.md};
  border-radius: ${tokens.borders.radius.md};
  cursor: pointer;
  transition: all ${tokens.animations.duration.fast} ${tokens.animations.easing.easeInOut};
  color: ${({ theme: colorTheme, theme: { colors }, isActive }) => {
    if (colorTheme === 'light') {
      return isActive ? colors.primary : colors.textPrimary;
    }
    return isActive ? colors.white : colors.textSecondary;
  }};
  background-color: ${({ theme: colorTheme, theme: { colors }, isActive }) => {
    if (colorTheme === 'light') {
      return isActive ? colors.primaryLighter : 'transparent';
    }
    return isActive ? colors.primaryDark : 'transparent';
  }};
  
  &:hover {
    background-color: ${({ theme: colorTheme, theme: { colors }, isActive }) => {
      if (colorTheme === 'light') {
        return isActive ? colors.primaryLighter : colors.backgroundLight;
      }
      return isActive ? colors.primaryDark : colors.backgroundDarker;
    }};
  }
  
  ${({ collapsed, mode }) =>
    collapsed &&
    mode === 'vertical' &&
    css`
      padding: ${tokens.spacing.sm};
      justify-content: center;
    `}
`;

const NavItemIcon = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: ${({ theme }) => theme.spacing.sm};
  font-size: ${tokens.typography.fontSize.lg};
`;

const NavItemLabel = styled.span<{
  collapsed?: boolean;
  mode: 'horizontal' | 'vertical';
}>`
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  
  ${({ collapsed, mode }) =>
    collapsed &&
    mode === 'vertical' &&
    css`
      display: none;
    `}
`;

const NavItemArrow = styled.span<{
  isOpen?: boolean;
  mode: 'horizontal' | 'vertical';
  collapsed?: boolean;
}>`
  margin-left: auto;
  transition: transform ${tokens.animations.duration.fast} ${tokens.animations.easing.easeInOut};
  
  ${({ isOpen }) =>
    isOpen &&
    css`
      transform: rotate(${({ mode }) => (mode === 'horizontal' ? '180deg' : '90deg')});
    `}
  
  ${({ collapsed, mode }) =>
    collapsed &&
    mode === 'vertical' &&
    css`
      display: none;
    `}
  
  &::after {
    content: '${({ mode }) => (mode === 'horizontal' ? '▼' : '▶')}';
    font-size: ${tokens.typography.fontSize.sm};
  }
`;

const CollapsedSubmenu = styled.div<{
  isOpen?: boolean;
  theme: 'light' | 'dark';
}>`
  position: absolute;
  left: 100%;
  top: 0;
  background-color: ${({ theme: colorTheme, theme: { colors } }) => 
    colorTheme === 'light' ? colors.white : colors.backgroundDark};
  border-radius: ${tokens.borders.radius.md};
  box-shadow: ${tokens.shadows.md};
  min-width: 200px;
  display: ${({ isOpen }) => (isOpen ? 'block' : 'none')};
  z-index: ${tokens.zIndex.dropdown};
  padding: ${tokens.spacing.xs} 0;
`;

const NavItemComponent: React.FC<{
  item: NavItem;
  activeKey?: string;
  onSelect?: (key: string) => void;
  mode: 'horizontal' | 'vertical';
  level?: number;
  collapsed?: boolean;
  theme: 'light' | 'dark';
}> = ({ item, activeKey, onSelect, mode, level = 0, collapsed, theme: colorTheme }) => {
  const [isOpen, setIsOpen] = useState(false);
  const isActive = activeKey === item.key;
  const hasChildren = !!item.children && item.children.length > 0;

  const handleClick = () => {
    if (hasChildren) {
      setIsOpen(!isOpen);
    } else if (item.onClick) {
      item.onClick();
    }
    
    if (onSelect && !hasChildren) {
      onSelect(item.key);
    }
  };

  const handleMouseEnter = () => {
    if (collapsed && mode === 'vertical' && hasChildren) {
      setIsOpen(true);
    }
  };

  const handleMouseLeave = () => {
    if (collapsed && mode === 'vertical' && hasChildren) {
      setIsOpen(false);
    }
  };

  const renderNavItemContent = () => (
    <NavItemContent
      mode={mode}
      isActive={isActive}
      hasChildren={hasChildren}
      collapsed={collapsed}
      theme={colorTheme}
      onClick={handleClick}
    >
      {item.icon && <NavItemIcon>{item.icon}</NavItemIcon>}
      <NavItemLabel collapsed={collapsed} mode={mode}>
        {item.label}
      </NavItemLabel>
      {hasChildren && (
        <NavItemArrow isOpen={isOpen} mode={mode} collapsed={collapsed} />
      )}
    </NavItemContent>
  );

  const renderChildren = () => {
    if (!hasChildren) return null;

    if (collapsed && mode === 'vertical') {
      return (
        <CollapsedSubmenu isOpen={isOpen} theme={colorTheme}>
          {item.children!.map((child) => (
            <NavItemComponent
              key={child.key}
              item={child}
              activeKey={activeKey}
              onSelect={onSelect}
              mode="vertical"
              level={level + 1}
              theme={colorTheme}
            />
          ))}
        </CollapsedSubmenu>
      );
    }

    return (
      <NavList
        mode={mode}
        level={level + 1}
        isSubmenu
        isOpen={isOpen}
        theme={colorTheme}
      >
        {item.children!.map((child) => (
          <NavItemComponent
            key={child.key}
            item={child}
            activeKey={activeKey}
            onSelect={onSelect}
            mode={mode}
            level={level + 1}
            collapsed={collapsed}
            theme={colorTheme}
          />
        ))}
      </NavList>
    );
  };

  return (
    <NavItemContainer
      mode={mode}
      isActive={isActive}
      disabled={item.disabled}
      hasChildren={hasChildren}
      collapsed={collapsed}
      theme={colorTheme}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {item.href ? (
        <a href={item.href} style={{ textDecoration: 'none' }}>
          {renderNavItemContent()}
        </a>
      ) : (
        renderNavItemContent()
      )}
      {renderChildren()}
    </NavItemContainer>
  );
};

export const Navigation: React.FC<NavigationProps> = ({
  items,
  activeKey,
  onSelect,
  mode = 'horizontal',
  collapsed = false,
  collapsible = false,
  theme = 'light',
}) => {
  return (
    <NavContainer mode={mode} collapsed={collapsed} theme={theme}>
      <NavList mode={mode} theme={theme}>
        {items.map((item) => (
          <NavItemComponent
            key={item.key}
            item={item}
            activeKey={activeKey}
            onSelect={onSelect}
            mode={mode}
            collapsed={collapsed}
            theme={theme}
          />
        ))}
      </NavList>
    </NavContainer>
  );
};