import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],

  // Path resolution for workspace imports
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

  // Build configuration
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          ui: ['@xyflow/react', 'framer-motion'],
          ai: ['ai', '@ai-sdk/openai', '@ai-sdk/anthropic'],
          charts: ['recharts']
        }
      }
    },
    chunkSizeWarningLimit: 1000
  },

  // Development server configuration
  server: {
    port: 5173,
    host: true,
    open: true,
    cors: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false
      },
      '/ws': {
        target: 'ws://localhost:8080',
        changeOrigin: true,
        ws: true
      }
    }
  },

  // Test configuration
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: true,
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/types/**'
      ]
    }
  },

  // Environment variables
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version)
  },

  // Optimize dependencies
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@xyflow/react',
      'framer-motion',
      'ai',
      '@ai-sdk/openai'
    ],
    exclude: ['@auterity/design-system', '@auterity/workflow-contracts']
  }
});
