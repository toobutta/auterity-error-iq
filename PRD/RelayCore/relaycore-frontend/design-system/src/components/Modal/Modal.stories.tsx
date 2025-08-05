import React, { useState } from 'react';
import { ComponentStory, ComponentMeta } from '@storybook/react';
import { Modal } from './Modal';
import { Button } from '../Button';

export default {
  title: 'Components/Modal',
  component: Modal,
  argTypes: {
    isOpen: {
      control: 'boolean',
      description: 'Controls whether the modal is open or closed',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: false },
      },
    },
    onClose: {
      action: 'closed',
      description: 'Function called when the modal is closed',
      table: {
        type: { summary: 'function' },
      },
    },
    title: {
      control: 'text',
      description: 'The title of the modal',
      table: {
        type: { summary: 'string' },
      },
    },
    size: {
      control: { type: 'select', options: ['small', 'medium', 'large', 'full'] },
      description: 'The size of the modal',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: 'medium' },
      },
    },
    children: {
      control: 'text',
      description: 'The content of the modal',
      table: {
        type: { summary: 'React.ReactNode' },
      },
    },
    footer: {
      control: 'text',
      description: 'The footer content of the modal',
      table: {
        type: { summary: 'React.ReactNode' },
      },
    },
  },
} as ComponentMeta<typeof Modal>;

const Template: ComponentStory<typeof Modal> = (args) => {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <>
      <Button onClick={() => setIsOpen(true)}>Open Modal</Button>
      <Modal {...args} isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
};

export const Default = Template.bind({});
Default.args = {
  title: 'Modal Title',
  children: <p>This is the content of the modal. You can put any React components here.</p>,
  footer: (
    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
      <Button variant="tertiary">Cancel</Button>
      <Button>Confirm</Button>
    </div>
  ),
  size: 'medium',
};

export const SmallModal = Template.bind({});
SmallModal.args = {
  ...Default.args,
  title: 'Small Modal',
  size: 'small',
};

export const LargeModal = Template.bind({});
LargeModal.args = {
  ...Default.args,
  title: 'Large Modal',
  size: 'large',
};

export const FullScreenModal = Template.bind({});
FullScreenModal.args = {
  ...Default.args,
  title: 'Full Screen Modal',
  size: 'full',
};

export const WithLongContent = Template.bind({});
WithLongContent.args = {
  ...Default.args,
  title: 'Modal with Long Content',
  children: (
    <div>
      {Array(20).fill(0).map((_, i) => (
        <p key={i}>This is paragraph {i + 1} with some content to make the modal scroll.</p>
      ))}
    </div>
  ),
};

export const WithCustomHeader = Template.bind({});
WithCustomHeader.args = {
  ...Default.args,
  title: undefined,
  children: (
    <>
      <div style={{ padding: '16px', borderBottom: '1px solid #eee' }}>
        <h2 style={{ margin: 0 }}>Custom Header</h2>
        <p style={{ margin: '8px 0 0' }}>This is a custom header for the modal</p>
      </div>
      <div style={{ padding: '16px' }}>
        <p>This is the content of the modal with a custom header.</p>
      </div>
    </>
  ),
};

export const WithoutFooter = Template.bind({});
WithoutFooter.args = {
  ...Default.args,
  title: 'Modal Without Footer',
  footer: null,
};

// Interactive example with state
export const Interactive = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [result, setResult] = useState('');
  
  return (
    <div>
      <Button onClick={() => setIsOpen(true)}>Open Interactive Modal</Button>
      {result && <p>Result: {result}</p>}
      
      <Modal 
        isOpen={isOpen} 
        onClose={() => setIsOpen(false)}
        title="Confirm Action"
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <Button 
              variant="tertiary" 
              onClick={() => {
                setResult('Action cancelled');
                setIsOpen(false);
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={() => {
                setResult('Action confirmed!');
                setIsOpen(false);
              }}
            >
              Confirm
            </Button>
          </div>
        }
      >
        <p>Are you sure you want to perform this action?</p>
        <p>This action cannot be undone.</p>
      </Modal>
    </div>
  );
};