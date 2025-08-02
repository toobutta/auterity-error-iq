import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Bundle analyzer - only in analyze mode
    process.env.ANALYZE && visualizer({
      filename: 'dist/bundle-analysis.html',
      open: true,
      gzipSize: true,
      brotliSize: true,
    }),
  ].filter(Boolean),
  server: {
    host: '0.0.0.0',
    port: 3000,
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts',
    // Memory optimization
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: true,
      },
    },
    // Coverage configuration (using c8 for vitest 0.34.6)
    coverage: {
      reporter: ['text', 'json-summary'],
      exclude: [
        'node_modules/',
        'src/setupTests.ts',
        '**/*.d.ts',
        '**/*.test.{ts,tsx}',
        '**/__tests__/**',
      ],
    },
    // Increase timeout for slow tests
    testTimeout: 10000,
    // Optimize memory usage
    logHeapUsage: true,
  },
  build: {
    // Increase chunk size warning limit to 600kb (from default 500kb)
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // React core and routing
          if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) {
            return 'react-vendor';
          }
          
          // Heavy visualization libraries
          if (id.includes('reactflow') || id.includes('react-flow-renderer')) {
            return 'workflow-viz';
          }
          
          // Charts and data visualization - split into smaller chunks
          if (id.includes('recharts')) {
            return 'charts';
          }
          
          // Code highlighting (lazy loaded) - split syntax highlighter and styles
          if (id.includes('react-syntax-highlighter')) {
            if (id.includes('styles') || id.includes('dark')) {
              return 'syntax-styles';
            }
            return 'syntax-highlighter';
          }
          
          // HTTP and utilities
          if (id.includes('axios')) {
            return 'utils';
          }
          
          // Split large node_modules into separate chunks
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        },
      },
    },
  },
})