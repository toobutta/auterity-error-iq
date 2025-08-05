import React from 'react';
import { ComponentStory, ComponentMeta } from '@storybook/react';
import { Navigation } from './Navigation';

export default {
  title: 'Components/Navigation',
  component: Navigation,
  argTypes: {
    items: {
      control: 'object',
      description: 'Navigation items to display',
      table: {
        type: { summary: 'array' },
      },
    },
    activeItemId: {
      control: 'text',
      description: 'ID of the currently active navigation item',
      table: {
        type: { summary: 'string' },
      },
    },
    onItemClick: {
      action: 'clicked',
      description: 'Function called when a navigation item is clicked',
      table: {
        type: { summary: 'function' },
      },
    },
    variant: {
      control: { type: 'select', options: ['vertical', 'horizontal'] },
      description: 'The orientation of the navigation',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: 'vertical' },
      },
    },
    collapsible: {
      control: 'boolean',
      description: 'Whether the navigation can be collapsed (vertical only)',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: false },
      },
    },
    collapsed: {
      control: 'boolean',
      description: 'Whether the navigation is collapsed (vertical only)',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: false },
      },
    },
    onToggleCollapse: {
      action: 'toggled',
      description: 'Function called when the collapse state is toggled',
      table: {
        type: { summary: 'function' },
      },
    },
  },
} as ComponentMeta<typeof Navigation>;

const defaultItems = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: '📊',
  },
  {
    id: 'requests',
    label: 'Requests',
    icon: '🔄',
  },
  {
    id: 'analytics',
    label: 'Analytics',
    icon: '📈',
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: '⚙️',
    subItems: [
      {
        id: 'profile',
        label: 'Profile',
      },
      {
        id: 'security',
        label: 'Security',
      },
      {
        id: 'preferences',
        label: 'Preferences',
      },
    ],
  },
  {
    id: 'help',
    label: 'Help & Support',
    icon: '❓',
  },
];

const Template: ComponentStory<typeof Navigation> = (args) => <Navigation {...args} />;

export const VerticalNavigation = Template.bind({});
VerticalNavigation.args = {
  items: defaultItems,
  activeItemId: 'dashboard',
  variant: 'vertical',
};

export const HorizontalNavigation = Template.bind({});
HorizontalNavigation.args = {
  items: defaultItems.map(item => ({ ...item, subItems: undefined })), // Remove subItems for horizontal nav
  activeItemId: 'dashboard',
  variant: 'horizontal',
};

export const CollapsibleNavigation = Template.bind({});
CollapsibleNavigation.args = {
  items: defaultItems,
  activeItemId: 'dashboard',
  variant: 'vertical',
  collapsible: true,
  collapsed: false,
};

export const CollapsedNavigation = Template.bind({});
CollapsedNavigation.args = {
  items: defaultItems,
  activeItemId: 'dashboard',
  variant: 'vertical',
  collapsible: true,
  collapsed: true,
};

export const WithExpandedSubItems = Template.bind({});
WithExpandedSubItems.args = {
  items: defaultItems,
  activeItemId: 'security',
  variant: 'vertical',
};

export const WithCustomStyling = () => (
  <div style={{ background: '#f0f0f0', padding: '16px', borderRadius: '8px' }}>
    <Navigation
      items={defaultItems}
      activeItemId="analytics"
      variant="vertical"
      style={{
        background: 'white',
        borderRadius: '4px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      }}
    />
  </div>
);

export const MobileNavigation = () => (
  <div style={{ maxWidth: '375px', border: '1px solid #ccc', borderRadius: '8px', overflow: 'hidden' }}>
    <div style={{ background: '#f5f5f5', padding: '12px', borderBottom: '1px solid #eee' }}>
      <h3 style={{ margin: 0 }}>Mobile View</h3>
    </div>
    <Navigation
      items={defaultItems}
      activeItemId="dashboard"
      variant="vertical"
      collapsible={true}
    />
  </div>
);

export const NavigationWithBadges = Template.bind({});
NavigationWithBadges.args = {
  items: [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: '📊',
    },
    {
      id: 'requests',
      label: 'Requests',
      icon: '🔄',
      badge: '5',
    },
    {
      id: 'messages',
      label: 'Messages',
      icon: '✉️',
      badge: '12',
    },
    {
      id: 'notifications',
      label: 'Notifications',
      icon: '🔔',
      badge: 'New',
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: '⚙️',
    },
  ],
  activeItemId: 'dashboard',
  variant: 'vertical',
};