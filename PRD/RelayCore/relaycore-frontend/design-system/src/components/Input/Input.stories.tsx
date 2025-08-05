import React from 'react';
import { ComponentStory, ComponentMeta } from '@storybook/react';
import { Input } from './Input';

export default {
  title: 'Components/Input',
  component: Input,
  argTypes: {
    size: {
      control: { type: 'select', options: ['small', 'medium', 'large'] },
      description: 'The size of the input',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: 'medium' },
      },
    },
    variant: {
      control: { type: 'select', options: ['default', 'filled', 'outlined'] },
      description: 'The visual style of the input',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: 'default' },
      },
    },
    fullWidth: {
      control: 'boolean',
      description: 'Whether the input should take up the full width of its container',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: false },
      },
    },
    error: {
      control: 'boolean',
      description: 'Whether the input is in an error state',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: false },
      },
    },
    helperText: {
      control: 'text',
      description: 'Helper text to display below the input',
      table: {
        type: { summary: 'string' },
      },
    },
    label: {
      control: 'text',
      description: 'Label for the input',
      table: {
        type: { summary: 'string' },
      },
    },
    placeholder: {
      control: 'text',
      description: 'Placeholder text for the input',
      table: {
        type: { summary: 'string' },
      },
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the input is disabled',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: false },
      },
    },
    onChange: {
      action: 'changed',
      description: 'Function called when the input value changes',
      table: {
        type: { summary: 'function' },
      },
    },
  },
} as ComponentMeta<typeof Input>;

const Template: ComponentStory<typeof Input> = (args) => <Input {...args} />;

export const Default = Template.bind({});
Default.args = {
  placeholder: 'Enter text',
};

export const WithLabel = Template.bind({});
WithLabel.args = {
  label: 'Name',
  placeholder: 'Enter your name',
};

export const Filled = Template.bind({});
Filled.args = {
  variant: 'filled',
  label: 'Email',
  placeholder: 'Enter your email',
};

export const Outlined = Template.bind({});
Outlined.args = {
  variant: 'outlined',
  label: 'Password',
  placeholder: 'Enter your password',
  type: 'password',
};

export const Small = Template.bind({});
Small.args = {
  size: 'small',
  label: 'Small Input',
  placeholder: 'Small input',
};

export const Medium = Template.bind({});
Medium.args = {
  size: 'medium',
  label: 'Medium Input',
  placeholder: 'Medium input',
};

export const Large = Template.bind({});
Large.args = {
  size: 'large',
  label: 'Large Input',
  placeholder: 'Large input',
};

export const WithError = Template.bind({});
WithError.args = {
  label: 'Email',
  placeholder: 'Enter your email',
  error: true,
  helperText: 'Please enter a valid email address',
};

export const WithHelperText = Template.bind({});
WithHelperText.args = {
  label: 'Email',
  placeholder: 'Enter your email',
  helperText: "We'll never share your email with anyone else",
};

export const Disabled = Template.bind({});
Disabled.args = {
  label: 'Disabled Input',
  placeholder: 'This input is disabled',
  disabled: true,
};

export const FullWidth = Template.bind({});
FullWidth.args = {
  label: 'Full Width Input',
  placeholder: 'This input takes up the full width',
  fullWidth: true,
};

export const WithLeftIcon = Template.bind({});
WithLeftIcon.args = {
  label: 'Search',
  placeholder: 'Search...',
  leftIcon: <span>🔍</span>,
};

export const WithRightIcon = Template.bind({});
WithRightIcon.args = {
  label: 'Date',
  placeholder: 'Select a date',
  rightIcon: <span>📅</span>,
};

export const TextArea = Template.bind({});
TextArea.args = {
  label: 'Message',
  placeholder: 'Enter your message',
  as: 'textarea',
  style: { minHeight: '150px' },
};

export const FormLayout = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '400px' }}>
    <Input label="First Name" placeholder="Enter your first name" />
    <Input label="Last Name" placeholder="Enter your last name" />
    <Input label="Email" placeholder="Enter your email" type="email" />
    <Input label="Password" placeholder="Enter your password" type="password" />
  </div>
);