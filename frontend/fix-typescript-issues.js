#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔧 Starting TypeScript Issues Resolution...\n');

// Phase 1: Install missing dependencies
console.log('📦 Installing missing dependencies...');
try {
  execSync('npm install --save-dev @types/react @types/react-dom lucide-react', { stdio: 'inherit' });
  console.log('✅ Dependencies installed\n');
} catch (error) {
  console.log('⚠️  Some dependencies may already be installed\n');
}

// Phase 2: Fix common import issues
console.log('🔄 Fixing common import issues...');

const fixImports = (filePath, fixes) => {
  if (!fs.existsSync(filePath)) return;
  
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;
  
  fixes.forEach(({ from, to }) => {
    if (content.includes(from)) {
      content = content.replace(from, to);
      changed = true;
    }
  });
  
  if (changed) {
    fs.writeFileSync(filePath, content);
    console.log(`✅ Fixed: ${path.basename(filePath)}`);
  }
};

// Fix axios imports
fixImports('./src/api/client.ts', [
  {
    from: "import axios, { AxiosResponse, AxiosError } from 'axios';",
    to: "import axios, { AxiosResponse, AxiosError, AxiosRequestConfig } from 'axios';"
  }
]);

// Phase 3: Remove unused React imports (React 17+ JSX Transform)
console.log('\n🧹 Removing unused React imports...');

const removeUnusedReactImports = (dir) => {
  const files = fs.readdirSync(dir, { withFileTypes: true });
  
  files.forEach(file => {
    const fullPath = path.join(dir, file.name);
    
    if (file.isDirectory() && !file.name.startsWith('.')) {
      removeUnusedReactImports(fullPath);
    } else if (file.name.endsWith('.tsx') || file.name.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      // Remove unused React import if JSX transform is used
      if (content.includes("import React from 'react';") && 
          !content.includes('React.') && 
          !content.includes('React,')) {
        content = content.replace("import React from 'react';\n", '');
        fs.writeFileSync(fullPath, content);
        console.log(`✅ Removed unused React import: ${path.relative('.', fullPath)}`);
      }
    }
  });
};

removeUnusedReactImports('./src');

// Phase 4: Fix common type issues
console.log('\n🔧 Applying type fixes...');

// Add type exports to main types index
const typesIndexPath = './src/types/index.ts';
if (!fs.existsSync(typesIndexPath)) {
  fs.writeFileSync(typesIndexPath, `// Auto-generated type exports
export * from './workflow';
export * from './template';
export * from './execution';
export * from './error';
export * from './api';
export * from './components';
export * from './performance';
`);
  console.log('✅ Created types index file');
}

// Phase 5: Run TypeScript check
console.log('\n🔍 Running TypeScript check...');
try {
  execSync('npx tsc --noEmit --skipLibCheck', { stdio: 'inherit' });
  console.log('\n✅ TypeScript check passed!');
} catch (error) {
  console.log('\n⚠️  Some TypeScript errors remain. Check the output above.');
}

console.log('\n🎉 TypeScript resolution complete!');
console.log('\nNext steps:');
console.log('1. Review remaining errors manually');
console.log('2. Run: npm run lint -- --fix');
console.log('3. Run: npm run test');