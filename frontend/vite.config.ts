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

    // Simplified chunk strategy for stability
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React libraries
          "react-vendor": ["react", "react-dom", "react-router-dom"],

          // Workflow visualization
          "workflow-libs": ["@xyflow/react"],

          // UI and utilities
          "ui-libs": ["recharts", "axios"],
        },
      },
    },

    // CSS optimization
    cssCodeSplit: true,
    cssMinify: "esbuild",
  },

  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react-router-dom",
      "@xyflow/react",
      "recharts",
    ],
  },
});
