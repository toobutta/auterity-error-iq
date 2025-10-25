/// <reference types="vitest" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { visualizer } from "rollup-plugin-visualizer";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Bundle analyzer - only in analyze mode
    process.env.ANALYZE &&
      visualizer({
        filename: "dist/bundle-analysis.html",
        open: true,
        gzipSize: true,
        brotliSize: true,
      }),
  ].filter(Boolean),

  css: {
    postcss: "./postcss.config.cjs",
    devSourcemap: true,
  },

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@shared": path.resolve(__dirname, "../shared"),
      "@components": path.resolve(__dirname, "./src/components"),
      "@pages": path.resolve(__dirname, "./src/pages"),
      "@hooks": path.resolve(__dirname, "./src/hooks"),
      "@utils": path.resolve(__dirname, "./src/utils"),
      "@types": path.resolve(__dirname, "./src/types"),
      "@enhanced": path.resolve(__dirname, "./src/services/enhanced"),
      "@workflow-studio": path.resolve(__dirname, "./src/components/workflow-studio"),
      "@canvas": path.resolve(__dirname, "./src/components/canvas"),
      "@ai": path.resolve(__dirname, "./src/components/ai"),
      "@collaboration": path.resolve(__dirname, "./src/collaboration"),
      "@professional": path.resolve(__dirname, "./src/utils/professionalIcons"),
    },
  },

  server: {
    host: "0.0.0.0",
    port: 3000,
    hmr: {
      overlay: true,
    },
  },

  build: {
    // Optimize for production
    target: "es2020",
    minify: "esbuild",
    sourcemap: process.env.NODE_ENV === "development",

    // Increase chunk size warning limit
    chunkSizeWarningLimit: 600,

    // Enhanced chunk strategy for better caching
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React libraries
          "react-vendor": ["react", "react-dom", "react-router-dom"],

          // Workflow visualization
          "workflow-libs": ["@xyflow/react"],

          // UI and utilities
          "ui-libs": ["recharts", "axios"],

          // Performance optimizations
          "performance-libs": ["lodash-es", "date-fns"],
        },
        // Optimize asset naming for caching
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name?.split('.') ?? [];
          const ext = info[info.length - 1];
          if (/\.(png|jpe?g|svg|gif|tiff|bmp|ico)$/i.test(assetInfo.name ?? '')) {
            return `assets/images/[name]-[hash][extname]`;
          }
          if (/\.(woff2?|eot|ttf|otf)$/i.test(assetInfo.name ?? '')) {
            return `assets/fonts/[name]-[hash][extname]`;
          }
          return `assets/[name]-[hash][extname]`;
        },
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
      },
    },

    // CSS optimization
    cssCodeSplit: true,
    cssMinify: "esbuild",

    // Enable compression
    reportCompressedSize: true,
  },

  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react-router-dom",
      "@xyflow/react",
      "recharts",
      "lodash-es",
      "date-fns",
      "pixi.js",
      "@ai-sdk/openai",
      "@ai-sdk/anthropic",
      "framer-motion",
      "zod",
      "zustand",
      "yjs",
    ],
  },

  // Performance optimizations
  esbuild: {
    drop: process.env.NODE_ENV === 'production' ? ['console', 'debugger'] : [],
    // Enable JSX runtime for better performance
    jsxFactory: 'React.createElement',
    jsxFragment: 'React.Fragment',
  },
});



