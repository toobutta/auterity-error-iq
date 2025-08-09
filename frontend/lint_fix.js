#!/usr/bin/env node
/**
 * Script to automatically fix common TypeScript linting issues in the frontend code.
 * 
 * This script:
 * 1. Installs required dependencies
 * 2. Runs ESLint with TypeScript plugin to fix auto-fixable issues
 * 3. Runs Prettier to format code
 * 4. Runs TypeScript compiler to check for remaining issues
 * 
 * Usage:
 *    node lint_fix.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const srcDir = path.join(__dirname, 'src');
const eslintConfigPath = path.join(__dirname, '.eslintrc.js');
const prettierConfigPath = path.join(__dirname, '.prettierrc');

// Install dependencies if needed
function installDependencies() {
  console.log('Installing required dependencies...');
  try {
    execSync('npm install --save-dev eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin prettier eslint-config-prettier eslint-plugin-react', { stdio: 'inherit' });
    console.log('✅ Dependencies installed successfully');
  } catch (error) {
    console.error('❌ Failed to install dependencies:', error.message);
    process.exit(1);
  }
}

// Create ESLint config if it doesn't exist
function createEslintConfig() {
  if (!fs.existsSync(eslintConfigPath)) {
    console.log('Creating ESLint configuration...');
    const eslintConfig = `
module.exports = {
  parser: '@typescript-eslint/parser',
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'prettier'
  ],
  plugins: ['@typescript-eslint', 'react'],
  env: {
    browser: true,
    es6: true,
    node: true
  },
  settings: {
    react: {
      version: 'detect'
    }
  },
  rules: {
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-unused-vars': 'error',
    'react/prop-types': 'off'
  }
};
`;
    fs.writeFileSync(eslintConfigPath, eslintConfig);
    console.log('✅ ESLint configuration created');
  }
}

// Create Prettier config if it doesn't exist
function createPrettierConfig() {
  if (!fs.existsSync(prettierConfigPath)) {
    console.log('Creating Prettier configuration...');
    const prettierConfig = `
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2
}
`;
    fs.writeFileSync(prettierConfigPath, prettierConfig);
    console.log('✅ Prettier configuration created');
  }
}

// Run ESLint to fix issues
function runEslint() {
  console.log('Running ESLint to fix issues...');
  try {
    execSync('npx eslint --fix "src/**/*.{ts,tsx}"', { stdio: 'inherit' });
    console.log('✅ ESLint completed successfully');
  } catch (error) {
    console.warn('⚠️ ESLint found issues that need manual fixing');
  }
}

// Run Prettier to format code
function runPrettier() {
  console.log('Running Prettier to format code...');
  try {
    execSync('npx prettier --write "src/**/*.{ts,tsx}"', { stdio: 'inherit' });
    console.log('✅ Prettier completed successfully');
  } catch (error) {
    console.error('❌ Prettier failed:', error.message);
  }
}

// Run TypeScript compiler to check for remaining issues
function runTypeScriptCheck() {
  console.log('Running TypeScript compiler to check for remaining issues...');
  try {
    const result = execSync('npx tsc --noEmit', { encoding: 'utf8' });
    console.log('✅ TypeScript check completed successfully');
    return 0;
  } catch (error) {
    const output = error.stdout || '';
    const errorCount = (output.match(/error TS\d+:/g) || []).length;
    console.warn(`⚠️ TypeScript found ${errorCount} issues that need manual fixing`);
    return errorCount;
  }
}

// Fix specific known issues in test files
function fixKnownIssues() {
  console.log('Fixing known issues in test files...');
  
  // List of files with known issues
  const filesToFix = [
    'src/components/__tests__/ExecutionLogViewer.test.tsx',
    'src/components/__tests__/WorkflowErrorDisplay.test.tsx',
    'src/components/__tests__/WorkflowExecutionInterface.test.tsx'
  ];
  
  for (const file of filesToFix) {
    const filePath = path.join(__dirname, file);
    if (fs.existsSync(filePath)) {
      let content = fs.readFileSync(filePath, 'utf8');
      
      // Fix 1: Replace 'unknown' with proper types
      content = content.replace(/\}: unknown\)/g, '}: any)'); // Temporary fix, should be replaced with proper types
      
      // Fix 2: Add React import if missing
      if (!content.includes('import React')) {
        content = 'import React from \'react\';\n' + content;
      }
      
      fs.writeFileSync(filePath, content);
      console.log(`✅ Fixed known issues in ${file}`);
    }
  }
}

// Main function
function main() {
  if (!fs.existsSync(srcDir)) {
    console.error(`❌ Directory not found: ${srcDir}`);
    process.exit(1);
  }

  // Setup
  installDependencies();
  createEslintConfig();
  createPrettierConfig();
  
  // Fix issues
  fixKnownIssues();
  runEslint();
  runPrettier();
  
  // Check remaining issues
  const issues = runTypeScriptCheck();
  
  if (issues === 0) {
    console.log('✅ All TypeScript issues fixed!');
  } else {
    console.log(`⚠️ ${issues} TypeScript issues remain. Manual fixes may be required.`);
  }
}

main();