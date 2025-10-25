#!/bin/bash

# Auterity Design System Setup Script
# Installs essential tools for our design system implementation

echo "🎨 Setting up Auterity Design System..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Please run this script from the frontend directory"
    exit 1
fi

echo "📦 Installing core utilities..."
npm install class-variance-authority clsx tailwind-merge

echo "🎭 Installing animation library..."
npm install framer-motion

echo "🧩 Installing component primitives..."
npm install @radix-ui/react-slot @radix-ui/react-dialog @radix-ui/react-dropdown-menu

echo "🛠️ Installing development tools..."
npm install -D @storybook/react chromatic @storybook/test-runner

echo "🎨 Installing design token tools..."
npm install -D style-dictionary

echo "✅ Installing accessibility tools..."
npm install -D @axe-core/react axe-playwright

echo "📚 Installing additional utilities..."
npm install @radix-ui/react-icons lucide-react

echo "🎯 Setup complete! Next steps:"
echo "1. Run 'npx storybook init' to set up Storybook"
echo "2. Run 'npx style-dictionary init' for token management"
echo "3. Run 'npm run storybook' to start the component library"

echo "🚀 Happy designing!"


