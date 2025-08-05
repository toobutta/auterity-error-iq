import React from 'react';
import { ComponentStory, ComponentMeta } from '@storybook/react';
import { Card, CardHeader, CardBody, CardFooter } from './Card';
import { Button } from '../Button';

export default {
  title: 'Components/Card',
  component: Card,
  subcomponents: { CardHeader, CardBody, CardFooter },
  argTypes: {
    variant: {
      control: { type: 'select', options: ['default', 'outlined', 'elevated'] },
      description: 'The visual style of the card',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: 'default' },
      },
    },
    padding: {
      control: 'text',
      description: 'The padding inside the card',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: 'tokens.spacing.md' },
      },
    },
    fullWidth: {
      control: 'boolean',
      description: 'Whether the card should take up the full width of its container',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: false },
      },
    },
    onClick: {
      action: 'clicked',
      description: 'Function called when the card is clicked',
      table: {
        type: { summary: 'function' },
      },
    },
    children: {
      control: 'text',
      description: 'The content of the card',
      table: {
        type: { summary: 'React.ReactNode' },
      },
    },
  },
} as ComponentMeta<typeof Card>;

const Template: ComponentStory<typeof Button> = (args) => <Card {...args} />;

export const Default = Template.bind({});
Default.args = {
  children: <CardBody>This is a basic card</CardBody>,
};

export const WithHeaderAndFooter = () => (
  <Card>
    <CardHeader>Card Title</CardHeader>
    <CardBody>
      <p>This is the content of the card. You can put any content here.</p>
      <p>The card component is designed to be flexible and can contain various types of content.</p>
    </CardBody>
    <CardFooter>
      <Button variant="tertiary">Cancel</Button>
      <Button>Submit</Button>
    </CardFooter>
  </Card>
);

export const Outlined = () => (
  <Card variant="outlined">
    <CardHeader>Outlined Card</CardHeader>
    <CardBody>This card has an outlined style.</CardBody>
  </Card>
);

export const Elevated = () => (
  <Card variant="elevated">
    <CardHeader>Elevated Card</CardHeader>
    <CardBody>This card has an elevated style with a stronger shadow.</CardBody>
  </Card>
);

export const Clickable = () => (
  <Card onClick={() => alert('Card clicked!')}>
    <CardBody>
      <p>This card is clickable. Click me!</p>
    </CardBody>
  </Card>
);

export const CustomPadding = () => (
  <Card padding="40px">
    <CardBody>This card has custom padding.</CardBody>
  </Card>
);

export const FullWidth = () => (
  <Card fullWidth>
    <CardHeader>Full Width Card</CardHeader>
    <CardBody>This card takes up the full width of its container.</CardBody>
  </Card>
);

export const CardGrid = () => (
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '16px' }}>
    <Card>
      <CardHeader>Card 1</CardHeader>
      <CardBody>Content for card 1</CardBody>
    </Card>
    <Card>
      <CardHeader>Card 2</CardHeader>
      <CardBody>Content for card 2</CardBody>
    </Card>
    <Card>
      <CardHeader>Card 3</CardHeader>
      <CardBody>Content for card 3</CardBody>
    </Card>
    <Card>
      <CardHeader>Card 4</CardHeader>
      <CardBody>Content for card 4</CardBody>
    </Card>
  </div>
);

export const NestedCards = () => (
  <Card>
    <CardHeader>Parent Card</CardHeader>
    <CardBody>
      <p>This card contains nested cards:</p>
      <div style={{ display: 'flex', gap: '16px', marginTop: '16px' }}>
        <Card variant="outlined">
          <CardBody>Nested Card 1</CardBody>
        </Card>
        <Card variant="outlined">
          <CardBody>Nested Card 2</CardBody>
        </Card>
      </div>
    </CardBody>
  </Card>
);

export const ComplexCard = () => (
  <Card>
    <CardHeader>User Profile</CardHeader>
    <CardBody>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
        <div style={{ 
          width: '50px', 
          height: '50px', 
          borderRadius: '50%', 
          backgroundColor: '#E2E8F0', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          marginRight: '16px'
        }}>
          👤
        </div>
        <div>
          <h3 style={{ margin: 0 }}>John Doe</h3>
          <p style={{ margin: 0, color: '#718096' }}>Software Engineer</p>
        </div>
      </div>
      <p>John is a software engineer with 5 years of experience in web development.</p>
      <div style={{ 
        padding: '8px', 
        backgroundColor: '#F7FAFC', 
        borderRadius: '4px',
        marginTop: '16px'
      }}>
        <p style={{ margin: 0, fontStyle: 'italic' }}>
          "I love building user-friendly interfaces and solving complex problems."
        </p>
      </div>
    </CardBody>
    <CardFooter>
      <Button variant="tertiary">Message</Button>
      <Button>View Profile</Button>
    </CardFooter>
  </Card>
);