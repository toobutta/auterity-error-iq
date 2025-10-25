#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const args = process.argv.slice(2);
if (args.length < 1) {
  console.log('Usage: node scaffold-component.js <ComponentName> [--type=dashboard|form|modal|chart] [--features=websocket,validation,loading]');
  process.exit(1);
}

const componentName = args[0];
const options = {};

// Parse additional options
args.slice(1).forEach(arg => {
  if (arg.startsWith('--type=')) {
    options.type = arg.split('=')[1];
  }
  if (arg.startsWith('--features=')) {
    options.features = arg.split('=')[1].split(',');
  }
});

const baseDir = path.join(__dirname, '..', 'frontend', 'src', 'components');
const componentDir = path.join(baseDir, componentName);

// Create component directory
if (!fs.existsSync(componentDir)) {
  fs.mkdirSync(componentDir, { recursive: true });
}

// Generate component files
const files = {
  [`${componentName}.tsx`]: generateComponentFile(componentName, options),
  [`${componentName}.test.tsx`]: generateTestFile(componentName, options),
  [`${componentName}.stories.tsx`]: generateStoriesFile(componentName, options),
  [`index.ts`]: generateIndexFile(componentName),
  [`README.md`]: generateReadmeFile(componentName, options),
  [`types.ts`]: generateTypesFile(componentName, options),
};

Object.entries(files).forEach(([filename, content]) => {
  const filePath = path.join(componentDir, filename);
  fs.writeFileSync(filePath, content);
  console.log(`✅ Created ${filename}`);
});

// Update main components index
updateMainIndex(componentName);

console.log(`\n🎉 Component ${componentName} scaffolded successfully!`);
console.log(`📁 Location: frontend/src/components/${componentName}`);
console.log(`🚀 Ready to use with ${options.features ? options.features.length : 0} features enabled`);

function generateComponentFile(name, options) {
  const { type = 'basic', features = [] } = options;

  const imports = [
    'import React, { useState, useEffect } from "react";',
    'import { cn } from "../lib/utils";',
  ];

  if (features.includes('websocket')) {
    imports.push('import { useWebSocket } from "../hooks/useWebSocket";');
  }

  if (features.includes('validation')) {
    imports.push('import { useForm } from "react-hook-form";');
    imports.push('import { zodResolver } from "@hookform/resolvers/zod";');
    imports.push('import * as z from "zod";');
  }

  if (features.includes('loading')) {
    imports.push('import { LoadingSpinner } from "../ui/loading-spinner";');
  }

  const componentProps = features.includes('validation')
    ? `export interface ${name}Props {\n  className?: string;\n  onSubmit?: (data: any) => void;\n  initialData?: any;\n}`
    : `export interface ${name}Props {\n  className?: string;\n}`;

  const componentLogic = generateComponentLogic(name, type, features);

  return `${imports.join('\n')}

${componentProps}

export const ${name}: React.FC<${name}Props> = ({
  className,
  ${features.includes('validation') ? 'onSubmit, initialData,' : ''}
}) => {
${componentLogic}
};

export default ${name};
`;
}

function generateComponentLogic(name, type, features) {
  let logic = '';

  if (features.includes('validation')) {
    logic += `
  const form = useForm({
    resolver: zodResolver(validationSchema),
    defaultValues: initialData || {},
  });

  const onFormSubmit = (data: any) => {
    onSubmit?.(data);
  };`;
  }

  if (features.includes('websocket')) {
    logic += `
  const { isConnected, sendMessage, lastMessage } = useWebSocket('/ws/${name.toLowerCase()}');

  useEffect(() => {
    if (lastMessage) {
      // Handle incoming WebSocket messages
      console.log('Received:', lastMessage);
    }
  }, [lastMessage]);`;
  }

  if (features.includes('loading')) {
    logic += `
  const [isLoading, setIsLoading] = useState(false);`;
  }

  // Component JSX based on type
  let jsx = '';
  switch (type) {
    case 'dashboard':
      jsx = generateDashboardJSX(name, features);
      break;
    case 'form':
      jsx = generateFormJSX(name, features);
      break;
    case 'modal':
      jsx = generateModalJSX(name, features);
      break;
    case 'chart':
      jsx = generateChartJSX(name, features);
      break;
    default:
      jsx = generateBasicJSX(name, features);
  }

  logic += `

  return (
    <div className={cn("w-full", className)}>
${jsx}
    </div>
  );`;

  return logic;
}

function generateBasicJSX(name, features) {
  return `      <div className="p-4 border rounded-lg">
        <h3 className="text-lg font-semibold mb-2">${name}</h3>
        <p className="text-gray-600">This is a ${name} component.</p>
        ${features.includes('loading') ? '<LoadingSpinner />' : ''}
      </div>`;
}

function generateDashboardJSX(name, features) {
  return `      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="p-4 bg-white border rounded-lg shadow">
          <h4 className="font-medium mb-2">Metric 1</h4>
          <div className="text-2xl font-bold">1,234</div>
        </div>
        <div className="p-4 bg-white border rounded-lg shadow">
          <h4 className="font-medium mb-2">Metric 2</h4>
          <div className="text-2xl font-bold">5,678</div>
        </div>
        <div className="p-4 bg-white border rounded-lg shadow">
          <h4 className="font-medium mb-2">Metric 3</h4>
          <div className="text-2xl font-bold">9,012</div>
        </div>
      </div>
      ${features.includes('websocket') ? '<div className="mt-4 p-2 bg-green-50 text-green-700 rounded">WebSocket: {isConnected ? "Connected" : "Disconnected"}</div>' : ''}`;
}

function generateFormJSX(name, features) {
  if (!features.includes('validation')) {
    return `      <form className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Field 1</label>
          <input type="text" className="w-full p-2 border rounded" />
        </div>
        <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
          Submit
        </button>
      </form>`;
  }

  return `      <form onSubmit={form.handleSubmit(onFormSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Name</label>
          <input
            {...form.register("name")}
            className="w-full p-2 border rounded"
            placeholder="Enter name"
          />
          {form.formState.errors.name && (
            <p className="text-red-500 text-sm mt-1">{form.formState.errors.name.message}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            {...form.register("email")}
            type="email"
            className="w-full p-2 border rounded"
            placeholder="Enter email"
          />
          {form.formState.errors.email && (
            <p className="text-red-500 text-sm mt-1">{form.formState.errors.email.message}</p>
          )}
        </div>
        <button
          type="submit"
          disabled={form.formState.isSubmitting}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
        >
          {form.formState.isSubmitting ? "Submitting..." : "Submit"}
        </button>
      </form>`;
}

function generateModalJSX(name, features) {
  return `      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
        <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
          <h3 className="text-lg font-semibold mb-4">${name} Modal</h3>
          <p className="text-gray-600 mb-4">Modal content goes here.</p>
          <div className="flex justify-end space-x-2">
            <button className="px-4 py-2 text-gray-600 border rounded hover:bg-gray-50">
              Cancel
            </button>
            <button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
              Confirm
            </button>
          </div>
        </div>
      </div>`;
}

function generateChartJSX(name, features) {
  return `      <div className="p-4 bg-white border rounded-lg">
        <h4 className="font-medium mb-4">${name} Chart</h4>
        <div className="h-64 bg-gray-100 rounded flex items-center justify-center">
          <span className="text-gray-500">Chart visualization will be rendered here</span>
        </div>
      </div>`;
}

function generateTestFile(name, options) {
  const { features = [] } = options;

  return `import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ${name} } from './${name}';

describe('${name}', () => {
  it('renders correctly', () => {
    render(<${name} />);
    expect(screen.getByText('${name}')).toBeInTheDocument();
  });

  ${features.includes('validation') ? `
  it('validates form inputs', async () => {
    render(<${name} onSubmit={jest.fn()} />);
    const submitButton = screen.getByRole('button', { name: /submit/i });

    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/required/i)).toBeInTheDocument();
    });
  });

  it('submits form with valid data', async () => {
    const mockSubmit = jest.fn();
    render(<${name} onSubmit={mockSubmit} />);

    fireEvent.change(screen.getByPlaceholderText('Enter name'), {
      target: { value: 'John Doe' }
    });
    fireEvent.change(screen.getByPlaceholderText('Enter email'), {
      target: { value: 'john@example.com' }
    });

    fireEvent.click(screen.getByRole('button', { name: /submit/i }));

    await waitFor(() => {
      expect(mockSubmit).toHaveBeenCalledWith({
        name: 'John Doe',
        email: 'john@example.com'
      });
    });
  });` : ''}

  ${features.includes('loading') ? `
  it('shows loading state', () => {
    render(<${name} />);
    // Add loading state tests
  });` : ''}

  ${features.includes('websocket') ? `
  it('handles WebSocket connection', () => {
    render(<${name} />);
    // Add WebSocket tests
  });` : ''}
});`;
}

function generateStoriesFile(name, options) {
  const { type = 'basic', features = [] } = options;

  return `import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { ${name} } from './${name}';

const meta: Meta<typeof ${name}> = {
  title: 'Components/${name}',
  component: ${name},
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof ${name}>;

export const Default: Story = {
  args: {
    className: 'max-w-md',
  },
};

${features.includes('validation') ? `
export const WithValidation: Story = {
  args: {
    className: 'max-w-md',
    onSubmit: (data) => console.log('Form submitted:', data),
    initialData: {
      name: 'John Doe',
      email: 'john@example.com',
    },
  },
};` : ''}

${type === 'dashboard' ? `
export const Dashboard: Story = {
  args: {
    className: 'w-full max-w-4xl',
  },
};` : ''}

${type === 'modal' ? `
export const Modal: Story = {
  args: {
    className: 'w-full h-full',
  },
};` : ''}`;
}

function generateIndexFile(name) {
  return `export { ${name}, type ${name}Props } from './${name}';
export type * from './types';`;
}

function generateReadmeFile(name, options) {
  const { type = 'basic', features = [] } = options;

  return `# ${name} Component

A ${type} component with the following features:
${features.map(f => `- ${f}`).join('\n')}

## Usage

\`\`\`tsx
import { ${name} } from './components/${name}';

function App() {
  return (
    <${name}
      className="my-custom-class"
      ${features.includes('validation') ? `onSubmit={(data) => console.log(data)}` : ''}
    />
  );
}
\`\`\`

## Props

${features.includes('validation') ? `- \`onSubmit\`: Function called when form is submitted
- \`initialData\`: Initial form data` : ''}
- \`className\`: Additional CSS classes

## Features

${features.length > 0 ? features.map(f => `- **${f}**: ${getFeatureDescription(f)}`).join('\n') : 'Basic component functionality'}

## Testing

Run tests with:
\`\`\`bash
npm test -- ${name}.test.tsx
\`\`\`

## Stories

View component stories in Storybook:
\`\`\`bash
npm run storybook
\`\`\``;

  function getFeatureDescription(feature) {
    const descriptions = {
      websocket: 'Real-time communication via WebSocket',
      validation: 'Form validation with error handling',
      loading: 'Loading states and async operations',
    };
    return descriptions[feature] || 'Custom feature';
  }
}

function generateTypesFile(name, options) {
  const { features = [] } = options;

  let types = `// ${name} component types
export interface ${name}Data {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}`;

  if (features.includes('validation')) {
    types += `

// Form validation schema
export const validationSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
});

export type ${name}FormData = z.infer<typeof validationSchema>;`;
  }

  if (features.includes('websocket')) {
    types += `

// WebSocket message types
export interface ${name}WebSocketMessage {
  type: 'update' | 'notification' | 'error';
  payload: any;
  timestamp: Date;
}`;
  }

  return types;
}

function updateMainIndex(name) {
  const indexPath = path.join(baseDir, 'index.ts');

  if (!fs.existsSync(indexPath)) {
    fs.writeFileSync(indexPath, `// Component exports\n`);
  }

  let content = fs.readFileSync(indexPath, 'utf8');
  if (!content.includes(`export * from './${name}';`)) {
    content += `export * from './${name}';\n`;
    fs.writeFileSync(indexPath, content);
  }
}
