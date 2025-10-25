import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { WorkflowAnalyticsDashboard } from './WorkflowAnalyticsDashboard';

const meta: Meta<typeof WorkflowAnalyticsDashboard> = {
  title: 'Components/WorkflowAnalyticsDashboard',
  component: WorkflowAnalyticsDashboard,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof WorkflowAnalyticsDashboard>;

export const Default: Story = {
  args: {
    className: 'max-w-md',
  },
};




export const Dashboard: Story = {
  args: {
    className: 'w-full max-w-4xl',
  },
};



