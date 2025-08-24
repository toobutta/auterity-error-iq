#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing remaining TypeScript issues...\n');

// Fix React imports in shared components
const fixSharedComponents = () => {
  const sharedDir = path.join(__dirname, '..', 'shared', 'components');
  if (!fs.existsSync(sharedDir)) return;

  const files = fs.readdirSync(sharedDir);
  files.forEach(file => {
    if (file.endsWith('.tsx')) {
      const filePath = path.join(sharedDir, file);
      let content = fs.readFileSync(filePath, 'utf8');
      
      // Fix React imports for JSX transform
      if (content.includes("import React") && !content.includes('React.')) {
        content = content.replace(/import React,?\s*{([^}]+)}/g, 'import {$1}');
        content = content.replace(/import React from 'react';\s*/g, '');
        fs.writeFileSync(filePath, content);
        console.log(`✅ Fixed React import: ${file}`);
      }
    }
  });
};

// Fix test data interfaces
const fixTestData = () => {
  const testFiles = [
    './src/components/__tests__/TemplateCard.test.tsx',
    './src/components/__tests__/WorkflowErrorDisplay.test.tsx',
    './src/components/__tests__/WorkflowExecutionResults.test.tsx'
  ];

  testFiles.forEach(filePath => {
    if (fs.existsSync(filePath)) {
      let content = fs.readFileSync(filePath, 'utf8');
      
      // Fix null assignments to template parameters
      content = content.replace(/defaultValue: null,/g, 'defaultValue: undefined,');
      content = content.replace(/validationRules: null,/g, 'validationRules: undefined,');
      
      // Fix outputData null assignments
      content = content.replace(/outputData: null,/g, 'outputData: undefined,');
      
      fs.writeFileSync(filePath, content);
      console.log(`✅ Fixed test data: ${path.basename(filePath)}`);
    }
  });
};

// Add missing imports
const addMissingImports = () => {
  const filesToFix = [
    {
      path: './src/components/__tests__/setup.ts',
      imports: "import { ErrorSeverity } from '../../types/error';"
    }
  ];

  filesToFix.forEach(({ path: filePath, imports }) => {
    if (fs.existsSync(filePath)) {
      let content = fs.readFileSync(filePath, 'utf8');
      if (!content.includes(imports)) {
        content = imports + '\n' + content;
        fs.writeFileSync(filePath, content);
        console.log(`✅ Added imports: ${path.basename(filePath)}`);
      }
    }
  });
};

// Run all fixes
fixSharedComponents();
fixTestData();
addMissingImports();

console.log('\n🎉 Remaining TypeScript fixes complete!');
console.log('\nRun: npm run type-check to verify fixes');