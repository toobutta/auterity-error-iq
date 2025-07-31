import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 3000,
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts',
  },
  build: {
    // Increase chunk size warning limit to 600kb (from default 500kb)
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: {
          // React core and routing
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          
          // Heavy visualization libraries
          'workflow-viz': ['reactflow', 'react-flow-renderer'],
          
          // Charts and data visualization
          'charts': ['recharts'],
          
          // Code highlighting (lazy loaded)
          'syntax-highlighter': ['react-syntax-highlighter'],
          
          // HTTP and utilities
          'utils': ['axios'],
        },
      },
    },
  },
})