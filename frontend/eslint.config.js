import eslint from "@eslint/js";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    // Global ignores
    ignores: [
      "dist/",
      "build/",
      "node_modules/",
      "*.min.js",
      "coverage/",
      ".next/",
      "src/tests/**",
      "**/__tests__/**",
      // Exclude config files that cause parsing issues
      "*.config.js",
      "*.config.ts",
      ".eslintrc*",
      "vite.config.ts",
      "vitest.config.ts",
      "vitest.setup.ts",
      "tailwind*.config.js",
      "postcss.config.cjs",
      "src/types/test-utils.tsx",
      "src/api/workflows.d.ts",
    ],
  },

  // Base configuration
  eslint.configs.recommended,

  // TypeScript recommended rules (non type-checked for speed)
  ...tseslint.configs.recommended,

  // React + project rules
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    plugins: {
      react,
      "react-hooks": reactHooks,
    },
    languageOptions: {
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
        // Avoid type-aware linting here to reduce config friction
        // (type-check happens in `npm run type-check`)
        // project: "./tsconfig.json",
      },
      globals: {
        // Test globals so "jest/vi is not defined" is not flagged
        jest: "readonly",
        vi: "readonly",
      },
    },
    rules: {
      // React rules
      "react/react-in-jsx-scope": "off",

      // React Hooks rules
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",

      // TypeScript rules (relaxed to reduce noise)
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/explicit-function-return-type": "off",
      "@typescript-eslint/explicit-module-boundary-types": "off",
      "@typescript-eslint/no-non-null-assertion": "warn",
      "@typescript-eslint/ban-types": "warn",
      "@typescript-eslint/no-inferrable-types": "off",
      "prefer-spread": "off",
      "react/prop-types": "off",

      // General rules
      "no-unused-vars": "off", // Use TypeScript version instead
      "no-undef": "off", // TypeScript handles this better
    },
    settings: {
      react: {
        version: "detect",
      },
    },
  },

  // Additional configuration for test files
  {
    files: ["**/*.test.{ts,tsx}", "**/*.{spec,test}.{ts,tsx}"],
    languageOptions: {
      globals: {
        jest: "readonly",
        vi: "readonly",
      },
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/explicit-function-return-type": "off",
      "@typescript-eslint/explicit-module-boundary-types": "off",
      "@typescript-eslint/no-unused-vars": "off",
    },
  },

  // Node/CJS config files
  {
    files: ["*.cjs", "**/*.config.cjs", ".eslintrc.*"],
    languageOptions: {
      globals: {
        module: "readonly",
        require: "readonly",
        __dirname: "readonly",
        process: "readonly",
      },
    },
    rules: {
      "no-undef": "off",
    },
  },
);


