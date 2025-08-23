#!/usr/bin/env node

/**
 * Test runner script to validate vitest configuration
 * Resolves pretty-format module resolution issues
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('🧪 Starting Vitest Test Runner...');
console.log('📁 Working directory:', process.cwd());

// Run vitest with explicit configuration
const vitestProcess = spawn('npx', ['vitest', 'run', '--config', 'vitest.config.ts'], {
  stdio: 'inherit',
  shell: true,
  cwd: __dirname
});

vitestProcess.on('close', (code) => {
  if (code === 0) {
    console.log('✅ All tests passed successfully!');
    console.log('🎉 Module resolution issues resolved');
  } else {
    console.log(`❌ Tests failed with exit code ${code}`);
    process.exit(code);
  }
});

vitestProcess.on('error', (error) => {
  console.error('❌ Failed to start test runner:', error);
  process.exit(1);
});