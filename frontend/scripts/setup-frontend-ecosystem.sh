#!/bin/bash

# Auterity Frontend Ecosystem Setup Script
# Installs React & Vite supporting tools for optimal development

echo "⚛️ Setting up Auterity Frontend Ecosystem..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Please run this script from the frontend directory"
    exit 1
fi

echo "📦 Installing core development tools..."
npm install -D vitest @vitest/ui @testing-library/react @testing-library/jest-dom
npm install -D eslint-plugin-react eslint-plugin-react-hooks prettier eslint-config-prettier

echo "🔄 Installing state management & data fetching..."
npm install zustand @tanstack/react-query react-hook-form

echo "🎨 Installing UI utilities..."
npm install clsx react-icons @headlessui/react

echo "🛠️ Installing Vite plugins..."
npm install -D @vitejs/plugin-react vite-plugin-eslint vite-plugin-svgr

echo "🚀 Installing routing & navigation..."
npm install react-router-dom

echo "⚡ Installing performance tools..."
npm install react-window react-helmet-async react-intersection-observer

echo "🛡️ Installing error handling..."
npm install react-error-boundary

echo "📅 Installing utility libraries..."
npm install date-fns

echo "🔧 Installing development workflow tools..."
npm install -D husky

echo "🧪 Installing E2E testing (optional)..."
read -p "Install Playwright for E2E testing? (y/n): " install_e2e
if [ "$install_e2e" = "y" ]; then
    npm install -D @playwright/test
    npx playwright install
fi

echo "📦 Installing deployment tools (optional)..."
read -p "Install Vercel CLI for deployment? (y/n): " install_vercel
if [ "$install_vercel" = "y" ]; then
    npm install -D vercel
fi

echo "✅ Frontend ecosystem setup complete!"
echo ""
echo "🎯 Next steps:"
echo "1. Run 'npm run dev' to start development server"
echo "2. Run 'npm run test' to run tests with Vitest"
echo "3. Run 'npx husky init' to setup git hooks"
echo "4. Configure your ESLint and Prettier rules"
echo ""
echo "📚 Useful commands:"
echo "- npm run build     # Production build"
echo "- npm run preview   # Preview production build"
echo "- npm run test      # Run tests"
echo "- npm run test:ui   # Run tests with UI"
echo ""
echo "🚀 Happy coding!"


