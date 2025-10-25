import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],

  // Path resolution for tests
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@auterity/design-system': resolve(__dirname, '../../packages/design-system/src'),
      '@auterity/workflow-contracts': resolve(__dirname, '../../packages/workflow-contracts/src'),
      '@shared': resolve(__dirname, '../../shared/src'),
      '@relaycore': resolve(__dirname, '../../systems/relaycore/src'),
      '@neuroweaver': resolve(__dirname, '../../systems/neuroweaver/src')
    }
  },

  // Test configuration
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: [
      'src/**/*.{test,spec}.{ts,tsx}',
      'packages/**/*.{test,spec}.{ts,tsx}'
    ],
    exclude: [
      'node_modules',
      'dist',
      '**/*.d.ts'
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/test/**/*',
        'src/**/*.d.ts',
        'src/**/*.config.*',
        'src/types/**/*',
        '**/*.stories.tsx'
      ],
      thresholds: {
        global: {
          branches: 70,
          functions: 70,
          lines: 70,
          statements: 70
        }
      }
    },

    // Test environment options
    environmentOptions: {
      jsdom: {
        url: 'http://localhost:5173'
      }
    }
  }
});
