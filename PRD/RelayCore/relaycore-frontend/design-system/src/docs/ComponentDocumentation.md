# RelayCore Design System - Component Documentation

## Overview

The RelayCore Design System provides a comprehensive set of UI components designed to create consistent, accessible, and visually appealing interfaces across the RelayCore ecosystem. This document provides detailed information about each component, including usage examples, props, and best practices.

## Table of Contents

1. [Button](#button)
2. [Input](#input)
3. [Card](#card)
4. [Modal](#modal)
5. [Table](#table)
6. [Navigation](#navigation)
7. [Form](#form)

---

## Button

The Button component is used for actions, such as submitting forms, triggering dialogs, or navigating to new pages.

### Usage

```jsx
import { Button } from '@relaycore/design-system';

// Primary button (default)
<Button>Click Me</Button>

// Secondary button
<Button variant="secondary">Click Me</Button>

// Tertiary button
<Button variant="tertiary">Click Me</Button>

// Danger button
<Button variant="danger">Click Me</Button>

// Different sizes
<Button size="small">Small</Button>
<Button size="medium">Medium</Button>
<Button size="large">Large</Button>

// Full width button
<Button fullWidth>Full Width</Button>

// Loading state
<Button isLoading>Loading</Button>

// With icons
<Button leftIcon={<Icon name="search" />}>Search</Button>
<Button rightIcon={<Icon name="arrow-right" />}>Next</Button>

// Disabled state
<Button disabled>Disabled</Button>
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'primary' \| 'secondary' \| 'tertiary' \| 'danger'` | `'primary'` | The visual style of the button |
| `size` | `'small' \| 'medium' \| 'large'` | `'medium'` | The size of the button |
| `fullWidth` | `boolean` | `false` | Whether the button should take up the full width of its container |
| `isLoading` | `boolean` | `false` | Whether the button is in a loading state |
| `leftIcon` | `React.ReactNode` | `undefined` | Icon to display before the button text |
| `rightIcon` | `React.ReactNode` | `undefined` | Icon to display after the button text |
| `disabled` | `boolean` | `false` | Whether the button is disabled |
| `onClick` | `(event: React.MouseEvent<HTMLButtonElement>) => void` | `undefined` | Function called when the button is clicked |

### Accessibility

- Use the `aria-label` attribute when a button has no text content (icon-only buttons)
- The component handles focus states and keyboard interactions
- Loading state is properly communicated to screen readers

### Best Practices

- Use the primary variant for the main action in a section
- Use secondary or tertiary variants for less important actions
- Use the danger variant for destructive actions (delete, remove)
- Keep button text concise and action-oriented
- Group related buttons together
- Maintain consistent button usage patterns throughout the application

## Input

The Input component is used to collect user input in a form.

### Usage

```jsx
import { Input } from '@relaycore/design-system';

// Basic input
<Input placeholder="Enter your name" />

// With label
<>
  <label htmlFor="email">Email</label>
  <Input id="email" type="email" placeholder="Enter your email" />
</>

// Different types
<Input type="text" placeholder="Text input" />
<Input type="password" placeholder="Password input" />
<Input type="email" placeholder="Email input" />
<Input type="number" placeholder="Number input" />

// With error
<Input error="This field is required" />

// Disabled state
<Input disabled value="Disabled input" />

// With icon
<Input leftIcon={<Icon name="search" />} placeholder="Search..." />
<Input rightIcon={<Icon name="calendar" />} placeholder="Select date" />

// With clear button
<Input clearable value="Clearable input" onClear={() => {}} />
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `type` | `string` | `'text'` | The type of input (text, password, email, etc.) |
| `value` | `string` | `''` | The value of the input |
| `placeholder` | `string` | `''` | Placeholder text when the input is empty |
| `disabled` | `boolean` | `false` | Whether the input is disabled |
| `error` | `string \| boolean` | `undefined` | Error message or boolean indicating error state |
| `leftIcon` | `React.ReactNode` | `undefined` | Icon to display at the left side of the input |
| `rightIcon` | `React.ReactNode` | `undefined` | Icon to display at the right side of the input |
| `clearable` | `boolean` | `false` | Whether to show a clear button when the input has a value |
| `onClear` | `() => void` | `undefined` | Function called when the clear button is clicked |
| `onChange` | `(event: React.ChangeEvent<HTMLInputElement>) => void` | `undefined` | Function called when the input value changes |
| `onBlur` | `(event: React.FocusEvent<HTMLInputElement>) => void` | `undefined` | Function called when the input loses focus |
| `onFocus` | `(event: React.FocusEvent<HTMLInputElement>) => void` | `undefined` | Function called when the input gains focus |

### Accessibility

- Always associate inputs with labels using the `htmlFor` and `id` attributes
- Error messages are linked to inputs using `aria-describedby`
- The component handles focus states and keyboard interactions

### Best Practices

- Always provide clear, descriptive labels for inputs
- Use placeholder text to provide hints, not to replace labels
- Show validation errors after the user has interacted with the field
- Group related inputs together
- Use appropriate input types for different data types

## Card

The Card component is used to group related content and actions in a container with a consistent style.

### Usage

```jsx
import { Card, Button } from '@relaycore/design-system';

// Basic card
<Card>
  <p>This is a basic card with some content.</p>
</Card>

// Card with header and footer
<Card
  header={<h3>Card Title</h3>}
  footer={<Button>Action</Button>}
>
  <p>This card has a header and footer.</p>
</Card>

// Card with custom styling
<Card
  style={{ maxWidth: '300px' }}
  className="custom-card"
>
  <p>This card has custom styling.</p>
</Card>

// Interactive card
<Card onClick={() => console.log('Card clicked')} hoverable>
  <p>Click this card to trigger an action.</p>
</Card>
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | `React.ReactNode` | `undefined` | The content of the card |
| `header` | `React.ReactNode` | `undefined` | Content to display in the card header |
| `footer` | `React.ReactNode` | `undefined` | Content to display in the card footer |
| `hoverable` | `boolean` | `false` | Whether the card should have a hover effect |
| `onClick` | `(event: React.MouseEvent<HTMLDivElement>) => void` | `undefined` | Function called when the card is clicked |
| `className` | `string` | `''` | Additional CSS class for the card |
| `style` | `React.CSSProperties` | `{}` | Additional inline styles for the card |

### Accessibility

- When using `onClick`, the card is given appropriate keyboard focus and interaction attributes
- Interactive cards have appropriate focus indicators

### Best Practices

- Use cards to group related content and actions
- Keep card content concise and focused
- Use consistent card layouts throughout the application
- Consider using grid layouts for displaying multiple cards
- Make cards interactive only when they represent a single action or destination

## Modal

The Modal component is used to display content in a layer above the page, requiring user interaction before returning to the page.

### Usage

```jsx
import { Modal, Button } from '@relaycore/design-system';
import { useState } from 'react';

function ModalExample() {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <>
      <Button onClick={() => setIsOpen(true)}>Open Modal</Button>
      
      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Modal Title"
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <Button variant="tertiary" onClick={() => setIsOpen(false)}>Cancel</Button>
            <Button onClick={() => {
              // Handle confirmation
              setIsOpen(false);
            }}>Confirm</Button>
          </div>
        }
      >
        <p>This is the content of the modal.</p>
        <p>You can add any React components here.</p>
      </Modal>
    </>
  );
}
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `isOpen` | `boolean` | `false` | Controls whether the modal is open or closed |
| `onClose` | `() => void` | `undefined` | Function called when the modal is closed |
| `title` | `React.ReactNode` | `undefined` | The title of the modal |
| `children` | `React.ReactNode` | `undefined` | The content of the modal |
| `footer` | `React.ReactNode` | `undefined` | Content to display in the modal footer |
| `size` | `'small' \| 'medium' \| 'large' \| 'full'` | `'medium'` | The size of the modal |
| `closeOnEsc` | `boolean` | `true` | Whether the modal can be closed by pressing the Escape key |
| `closeOnOverlayClick` | `boolean` | `true` | Whether the modal can be closed by clicking the overlay |
| `showCloseButton` | `boolean` | `true` | Whether to show the close button in the header |
| `preventScroll` | `boolean` | `true` | Whether to prevent scrolling of the body when the modal is open |
| `className` | `string` | `''` | Additional CSS class for the modal |
| `overlayClassName` | `string` | `''` | Additional CSS class for the modal overlay |

### Accessibility

- Focus is trapped within the modal when open
- The Escape key closes the modal by default
- The modal is properly labeled for screen readers
- The modal announces its presence to screen readers
- Focus returns to the triggering element when the modal is closed

### Best Practices

- Use modals sparingly, only when user attention needs to be focused on a specific task
- Keep modal content concise and focused
- Provide clear actions in the footer
- Always include a way to close the modal (close button, cancel button, etc.)
- Consider using different sizes based on the content complexity
- Avoid nesting modals

## Table

The Table component is used to display structured data in rows and columns.

### Usage

```jsx
import { Table, Button } from '@relaycore/design-system';

// Basic table
const columns = [
  {
    id: 'name',
    header: 'Name',
    accessor: 'name',
  },
  {
    id: 'email',
    header: 'Email',
    accessor: 'email',
  },
  {
    id: 'role',
    header: 'Role',
    accessor: 'role',
  },
];

const data = [
  { id: '1', name: 'John Doe', email: 'john@example.com', role: 'Admin' },
  { id: '2', name: 'Jane Smith', email: 'jane@example.com', role: 'User' },
  { id: '3', name: 'Bob Johnson', email: 'bob@example.com', role: 'Editor' },
];

<Table
  columns={columns}
  data={data}
/>

// Sortable table
<Table
  columns={columns}
  data={data}
  sortable
/>

// Paginated table
<Table
  columns={columns}
  data={data}
  pagination={{
    pageSize: 10,
    pageSizeOptions: [5, 10, 20, 50],
  }}
/>

// Table with custom cell rendering
const columnsWithCustomCell = [
  ...columns,
  {
    id: 'actions',
    header: 'Actions',
    cell: (_, row) => (
      <div style={{ display: 'flex', gap: '8px' }}>
        <Button size="small" variant="tertiary">Edit</Button>
        <Button size="small" variant="danger">Delete</Button>
      </div>
    ),
  },
];

<Table
  columns={columnsWithCustomCell}
  data={data}
/>
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `columns` | `Array<Column>` | `[]` | Column definitions for the table |
| `data` | `Array<any>` | `[]` | Data to display in the table |
| `sortable` | `boolean` | `false` | Whether the table columns can be sorted |
| `pagination` | `PaginationConfig \| false` | `false` | Pagination configuration |
| `onRowClick` | `(row: any) => void` | `undefined` | Function called when a row is clicked |
| `loading` | `boolean` | `false` | Whether the table is in a loading state |
| `emptyMessage` | `string \| React.ReactNode` | `'No data available'` | Message to display when there is no data |
| `headerStyle` | `React.CSSProperties` | `{}` | Additional styles for the table header |
| `rowStyle` | `React.CSSProperties \| (row: any, index: number) => React.CSSProperties` | `{}` | Additional styles for table rows |
| `className` | `string` | `''` | Additional CSS class for the table |
| `style` | `React.CSSProperties` | `{}` | Additional inline styles for the table |

### Column Definition

| Prop | Type | Description |
|------|------|-------------|
| `id` | `string` | Unique identifier for the column |
| `header` | `string \| React.ReactNode` | Content to display in the column header |
| `accessor` | `string \| ((row: any) => any)` | Property name or function to extract data from each row |
| `cell` | `(value: any, row: any) => React.ReactNode` | Custom cell renderer |
| `sortable` | `boolean` | Whether this column can be sorted (overrides table-level setting) |
| `width` | `string \| number` | Width of the column |
| `minWidth` | `string \| number` | Minimum width of the column |
| `maxWidth` | `string \| number` | Maximum width of the column |
| `align` | `'left' \| 'center' \| 'right'` | Text alignment for the column |

### Pagination Configuration

| Prop | Type | Description |
|------|------|-------------|
| `pageSize` | `number` | Number of rows per page |
| `pageSizeOptions` | `Array<number>` | Available options for page size |
| `showPageSizeOptions` | `boolean` | Whether to show page size options |
| `showPageInfo` | `boolean` | Whether to show page information |
| `showFirstLastButtons` | `boolean` | Whether to show first/last page buttons |

### Accessibility

- The table uses proper HTML table elements for semantic structure
- Column headers are properly associated with their cells
- Sortable columns have appropriate ARIA attributes
- Interactive elements within the table are keyboard accessible

### Best Practices

- Use tables for displaying structured data that benefits from row/column organization
- Keep column headers clear and concise
- Use pagination for large datasets
- Consider mobile responsiveness when designing tables
- Use custom cell renderers for complex data or actions
- Provide appropriate loading and empty states

## Navigation

The Navigation component is used to create navigation menus for applications, supporting both horizontal and vertical layouts.

### Usage

```jsx
import { Navigation } from '@relaycore/design-system';

// Basic vertical navigation
const items = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: <DashboardIcon />,
  },
  {
    id: 'requests',
    label: 'Requests',
    icon: <RequestsIcon />,
  },
  {
    id: 'analytics',
    label: 'Analytics',
    icon: <AnalyticsIcon />,
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: <SettingsIcon />,
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
];

<Navigation
  items={items}
  activeItemId="dashboard"
  onItemClick={(itemId) => console.log(`Clicked item: ${itemId}`)}
/>

// Horizontal navigation
<Navigation
  items={items}
  activeItemId="dashboard"
  variant="horizontal"
  onItemClick={(itemId) => console.log(`Clicked item: ${itemId}`)}
/>

// Collapsible navigation
<Navigation
  items={items}
  activeItemId="dashboard"
  variant="vertical"
  collapsible
  collapsed={false}
  onToggleCollapse={() => console.log('Toggle collapse')}
/>
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `items` | `Array<NavigationItem>` | `[]` | Navigation items to display |
| `activeItemId` | `string` | `undefined` | ID of the currently active navigation item |
| `onItemClick` | `(itemId: string) => void` | `undefined` | Function called when a navigation item is clicked |
| `variant` | `'vertical' \| 'horizontal'` | `'vertical'` | The orientation of the navigation |
| `collapsible` | `boolean` | `false` | Whether the navigation can be collapsed (vertical only) |
| `collapsed` | `boolean` | `false` | Whether the navigation is collapsed (vertical only) |
| `onToggleCollapse` | `() => void` | `undefined` | Function called when the collapse state is toggled |
| `className` | `string` | `''` | Additional CSS class for the navigation |
| `style` | `React.CSSProperties` | `{}` | Additional inline styles for the navigation |

### Navigation Item

| Prop | Type | Description |
|------|------|-------------|
| `id` | `string` | Unique identifier for the item |
| `label` | `string` | Text to display for the item |
| `icon` | `React.ReactNode` | Icon to display for the item |
| `subItems` | `Array<NavigationItem>` | Sub-items for nested navigation |
| `badge` | `string \| number \| React.ReactNode` | Badge to display for the item |
| `disabled` | `boolean` | Whether the item is disabled |
| `href` | `string` | URL to navigate to when the item is clicked |
| `external` | `boolean` | Whether the href should open in a new tab |

### Accessibility

- The navigation uses appropriate semantic elements (nav, ul, li)
- Active items are properly indicated for screen readers
- Keyboard navigation is supported
- Expandable sections are properly labeled and support keyboard interaction
- Focus states are clearly visible

### Best Practices

- Keep navigation labels clear and concise
- Use consistent icons that clearly represent their sections
- Limit the number of top-level navigation items
- Group related items under a single parent item
- Consider using badges only for important notifications
- Ensure the navigation is responsive and works well on mobile devices
- Use the collapsible feature for space-constrained interfaces

## Form

The Form component provides a comprehensive solution for building forms with validation, field management, and submission handling.

### Usage

```jsx
import { Form, Button } from '@relaycore/design-system';

// Basic form
<Form
  initialValues={{
    name: '',
    email: '',
    password: '',
  }}
  onSubmit={(values) => {
    console.log('Form submitted:', values);
  }}
>
  {({ values, handleChange, handleBlur, errors, touched }) => (
    <>
      <Form.Group>
        <Form.Label htmlFor="name">Name</Form.Label>
        <Form.Input
          id="name"
          name="name"
          value={values.name}
          onChange={handleChange}
          onBlur={handleBlur}
          error={touched.name && errors.name}
        />
        {touched.name && errors.name && (
          <Form.ErrorMessage>{errors.name}</Form.ErrorMessage>
        )}
      </Form.Group>
      
      <Form.Group>
        <Form.Label htmlFor="email">Email</Form.Label>
        <Form.Input
          id="email"
          name="email"
          type="email"
          value={values.email}
          onChange={handleChange}
          onBlur={handleBlur}
          error={touched.email && errors.email}
        />
        {touched.email && errors.email && (
          <Form.ErrorMessage>{errors.email}</Form.ErrorMessage>
        )}
      </Form.Group>
      
      <Form.Group>
        <Form.Label htmlFor="password">Password</Form.Label>
        <Form.Input
          id="password"
          name="password"
          type="password"
          value={values.password}
          onChange={handleChange}
          onBlur={handleBlur}
          error={touched.password && errors.password}
        />
        {touched.password && errors.password && (
          <Form.ErrorMessage>{errors.password}</Form.ErrorMessage>
        )}
      </Form.Group>
      
      <Form.Group>
        <Button type="submit">Submit</Button>
      </Form.Group>
    </>
  )}
</Form>

// Form with validation
<Form
  initialValues={{
    username: '',
    email: '',
    password: '',
  }}
  validationSchema={{
    username: (value) => {
      if (!value) return 'Username is required';
      if (value.length < 3) return 'Username must be at least 3 characters';
      return null;
    },
    email: (value) => {
      if (!value) return 'Email is required';
      if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(value)) {
        return 'Invalid email address';
      }
      return null;
    },
    password: (value) => {
      if (!value) return 'Password is required';
      if (value.length < 8) return 'Password must be at least 8 characters';
      return null;
    },
  }}
  onSubmit={(values) => {
    console.log('Form submitted:', values);
  }}
>
  {/* Form fields */}
</Form>
```

### Form Component Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `initialValues` | `object` | `{}` | Initial values for form fields |
| `validationSchema` | `object` | `{}` | Validation schema for form fields |
| `onSubmit` | `(values: object) => void` | `undefined` | Function called when the form is submitted |
| `children` | `(formProps: FormProps) => React.ReactNode` | `undefined` | Render prop function that receives form state and helpers |
| `className` | `string` | `''` | Additional CSS class for the form |
| `style` | `React.CSSProperties` | `{}` | Additional inline styles for the form |

### Form.Group Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | `React.ReactNode` | `undefined` | Content of the form group |
| `className` | `string` | `''` | Additional CSS class for the form group |
| `style` | `React.CSSProperties` | `{}` | Additional inline styles for the form group |

### Form.Label Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `htmlFor` | `string` | `undefined` | ID of the form element this label is associated with |
| `children` | `React.ReactNode` | `undefined` | Content of the label |
| `required` | `boolean` | `false` | Whether to show a required indicator |
| `className` | `string` | `''` | Additional CSS class for the label |
| `style` | `React.CSSProperties` | `{}` | Additional inline styles for the label |

### Form.Input Props

Extends all standard HTML input props plus:

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `error` | `string \| boolean` | `undefined` | Error message or boolean indicating error state |
| `leftIcon` | `React.ReactNode` | `undefined` | Icon to display at the left side of the input |
| `rightIcon` | `React.ReactNode` | `undefined` | Icon to display at the right side of the input |
| `className` | `string` | `''` | Additional CSS class for the input |
| `style` | `React.CSSProperties` | `{}` | Additional inline styles for the input |

### Form.Textarea Props

Extends all standard HTML textarea props plus:

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `error` | `string \| boolean` | `undefined` | Error message or boolean indicating error state |
| `className` | `string` | `''` | Additional CSS class for the textarea |
| `style` | `React.CSSProperties` | `{}` | Additional inline styles for the textarea |

### Form.Checkbox Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `name` | `string` | `undefined` | Name of the checkbox |
| `checked` | `boolean` | `false` | Whether the checkbox is checked |
| `onChange` | `(event: React.ChangeEvent<HTMLInputElement>) => void` | `undefined` | Function called when the checkbox value changes |
| `label` | `React.ReactNode` | `undefined` | Label for the checkbox |
| `error` | `string \| boolean` | `undefined` | Error message or boolean indicating error state |
| `disabled` | `boolean` | `false` | Whether the checkbox is disabled |
| `className` | `string` | `''` | Additional CSS class for the checkbox |
| `style` | `React.CSSProperties` | `{}` | Additional inline styles for the checkbox |

### Form.RadioGroup Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `name` | `string` | `undefined` | Name of the radio group |
| `value` | `string` | `undefined` | Currently selected value |
| `onChange` | `(value: string) => void` | `undefined` | Function called when the selection changes |
| `options` | `Array<{ value: string, label: React.ReactNode }>` | `[]` | Options for the radio group |
| `error` | `string \| boolean` | `undefined` | Error message or boolean indicating error state |
| `disabled` | `boolean` | `false` | Whether the radio group is disabled |
| `className` | `string` | `''` | Additional CSS class for the radio group |
| `style` | `React.CSSProperties` | `{}` | Additional inline styles for the radio group |

### Form.CheckboxGroup Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `name` | `string` | `undefined` | Name of the checkbox group |
| `value` | `Array<string>` | `[]` | Currently selected values |
| `onChange` | `(values: Array<string>) => void` | `undefined` | Function called when the selection changes |
| `options` | `Array<{ value: string, label: React.ReactNode }>` | `[]` | Options for the checkbox group |
| `error` | `string \| boolean` | `undefined` | Error message or boolean indicating error state |
| `disabled` | `boolean` | `false` | Whether the checkbox group is disabled |
| `className` | `string` | `''` | Additional CSS class for the checkbox group |
| `style` | `React.CSSProperties` | `{}` | Additional inline styles for the checkbox group |

### Form.ErrorMessage Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | `React.ReactNode` | `undefined` | Content of the error message |
| `className` | `string` | `''` | Additional CSS class for the error message |
| `style` | `React.CSSProperties` | `{}` | Additional inline styles for the error message |

### Accessibility

- Form elements use proper semantic HTML
- Labels are properly associated with form controls
- Error messages are linked to inputs using `aria-describedby`
- Required fields are properly indicated
- Focus order follows a logical sequence
- Form validation errors are properly communicated to screen readers

### Best Practices

- Group related form fields together
- Provide clear, descriptive labels for all form fields
- Show validation errors after the user has interacted with the field
- Use appropriate input types for different data types
- Provide helpful error messages that explain how to fix the issue
- Consider using field masking for formatted inputs (phone numbers, credit cards, etc.)
- Use consistent form layouts throughout the application
- Clearly indicate required fields
- Provide feedback after form submission (success/error messages)