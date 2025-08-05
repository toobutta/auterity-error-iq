# NeuroWeaver Frontend

This directory contains the frontend implementation for the NeuroWeaver platform, which provides a user interface for managing AI models, datasets, workflows, and templates for the automotive industry.

## Overview

The NeuroWeaver frontend is built using Next.js and Material-UI, providing a modern, responsive, and accessible user interface. It follows a component-based architecture and uses TypeScript for type safety.

## Key Features

1. **Dashboard**: Provides an overview of the platform's key metrics and activities.
2. **Workflow Builder**: A visual interface for creating and managing AI workflows.
3. **Dataset Manager**: Tools for uploading, managing, and refining datasets.
4. **Model Gallery**: A catalog of AI models and vertical kits for the automotive industry.
5. **YAML Editor**: A specialized editor for creating and modifying YAML configuration files.

## Directory Structure

```
src/frontend/
├── components/        # Reusable UI components
│   ├── dashboard/     # Dashboard-specific components
│   ├── workflow-builder/ # Workflow builder components
│   ├── dataset-manager/ # Dataset manager components
│   ├── model-gallery/ # Model gallery components
│   ├── yaml-editor/   # YAML editor components
│   └── Layout.tsx     # Main layout component
├── pages/             # Next.js pages
│   ├── index.tsx      # Dashboard page
│   ├── workflow-builder.tsx # Workflow builder page
│   ├── dataset-manager.tsx # Dataset manager page
│   ├── model-gallery.tsx # Model gallery page
│   └── yaml-editor.tsx # YAML editor page
├── styles/            # Global styles and theme
│   ├── theme.ts       # Material-UI theme configuration
│   └── createEmotionCache.ts # Emotion cache configuration
├── public/            # Static assets
└── package.json       # Dependencies and scripts
```

## Technologies Used

- **Next.js**: React framework for server-rendered applications
- **Material-UI**: React component library implementing Google's Material Design
- **TypeScript**: Typed superset of JavaScript
- **React Flow**: Library for building node-based editors and workflows
- **Chart.js**: Library for data visualization
- **Monaco Editor**: Code editor for YAML configuration
- **React Query**: Data fetching and state management library

## Getting Started

### Prerequisites

- Node.js 16.x or higher
- npm 8.x or higher

### Installation

```bash
# Navigate to the frontend directory
cd src/frontend

# Install dependencies
npm install
```

### Development

```bash
# Start the development server
npm run dev
```

The development server will start at http://localhost:3000.

### Building for Production

```bash
# Build the application
npm run build

# Start the production server
npm run start
```

## Key Components

### Layout

The `Layout` component provides a consistent layout across all pages, including:

- Top navigation bar
- Side navigation menu
- Content area

### Dashboard

The dashboard provides an overview of the platform's key metrics and activities, including:

- Model statistics
- Dataset statistics
- Inference metrics
- Cost savings
- Performance metrics
- Recent activities
- Quick actions

### Workflow Builder

The workflow builder provides a visual interface for creating and managing AI workflows, including:

- Node-based editor
- Component library
- Property editor
- YAML configuration

### Dataset Manager

The dataset manager provides tools for uploading, managing, and refining datasets, including:

- Dataset catalog
- Dataset upload
- Dataset refinement
- Dataset analytics

### Model Gallery

The model gallery provides a catalog of AI models and vertical kits for the automotive industry, including:

- Model catalog
- Vertical kits
- Training management
- Deployment management

### YAML Editor

The YAML editor provides a specialized editor for creating and modifying YAML configuration files, including:

- Syntax highlighting
- Validation
- Preview
- Template management

## Integration with Backend

The frontend communicates with the backend API using RESTful endpoints. The API base URL is configured in the `next.config.js` file and can be overridden using environment variables.

## Deployment

The frontend can be deployed using the following methods:

1. **Docker**: The frontend is containerized and can be deployed using Docker Compose or Kubernetes.
2. **Static Export**: The frontend can be exported as static HTML/CSS/JS files and deployed to any static hosting service.
3. **Vercel**: The frontend can be deployed directly to Vercel for serverless deployment.

## Future Enhancements

1. **Real-time Collaboration**: Add support for real-time collaboration on workflows and templates.
2. **Advanced Visualization**: Enhance data visualization capabilities with more chart types and interactive features.
3. **Mobile Support**: Optimize the UI for mobile devices.
4. **Offline Mode**: Add support for offline mode with local storage.
5. **Accessibility**: Improve accessibility features for users with disabilities.