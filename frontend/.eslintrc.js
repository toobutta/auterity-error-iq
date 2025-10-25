module.exports = {
  root: true,
  ignorePatterns: [
    "node_modules/",
    "dist/",
    "build/",
    "coverage/",
    "*.config.js",
    "*.config.cjs",
    "*.config.ts",
    "*.config.tsx",
    "eslint.config.js",
    "eslint.config.cjs",
    "vite.config.ts",
    "vitest.config.ts",
    "vitest.setup.ts",
    "tailwind.config.js",
    "tailwind-simple.config.js",
    "postcss.config.cjs",
    "fix-all-typescript-errors.js",
    "fix-remaining-types.js",
    "fix-typescript-issues.js",
    "lint_fix.cjs",
    "test-runner.js",
    ".eslintrc.js",
    "eslint.config.js",
    "src/api/workflows.d.ts",
    "src/types/test-utils.tsx",
    "src/types/vitest.d.ts",
  ],
  env: {
    browser: true,
    es2020: true,
    node: true,
  },
  extends: [
    "eslint:recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended",
  ],
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: "module",
    ecmaFeatures: {
      jsx: true,
    },
  },
  plugins: ["react", "react-hooks"],
  settings: {
    react: {
      version: "detect",
    },
  },
  rules: {
    // Core rules - keep minimal and focused
    "no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
    "no-console": ["warn", { allow: ["warn", "error"] }],
    "prefer-const": "error",
    "no-var": "error",
    "no-undef": "error",

    // React rules
    "react/react-in-jsx-scope": "off",
    "react/prop-types": "off",
    "react-hooks/rules-of-hooks": "error",
    "react-hooks/exhaustive-deps": "warn",
  },
  overrides: [
    {
      files: ["src/**/*.{ts,tsx}"],
      parser: "@typescript-eslint/parser",
      plugins: ["@typescript-eslint"],
      extends: ["plugin:@typescript-eslint/recommended"],
      parserOptions: {
        project: "./tsconfig.eslint.json",
        tsconfigRootDir: __dirname,
      },
      rules: {
        // TypeScript rules - gradually re-enable as we fix
        "@typescript-eslint/no-explicit-any": "warn", // Downgrade to warn for systematic fixing
        "@typescript-eslint/explicit-function-return-type": "off", // Temporarily disabled
        "@typescript-eslint/explicit-module-boundary-types": "off", // Temporarily disabled
        "@typescript-eslint/no-unused-vars": [
          "warn",
          { argsIgnorePattern: "^_" },
        ],
        "@typescript-eslint/no-non-null-assertion": "warn", // Downgrade to warn for systematic fixing
        "@typescript-eslint/no-floating-promises": "off", // Temporarily disabled
        "@typescript-eslint/await-thenable": "off", // Temporarily disabled
        "@typescript-eslint/no-misused-promises": "off", // Temporarily disabled
        "@typescript-eslint/prefer-nullish-coalescing": "warn",
        "@typescript-eslint/prefer-optional-chain": "warn",
      },
    },
    {
      files: ["**/*.test.ts", "**/*.test.tsx"],
      env: {
        jest: true,
      },
      rules: {
        "no-console": "off",
        "@typescript-eslint/no-explicit-any": "off",
        "@typescript-eslint/no-non-null-assertion": "off",
      },
    },
  ],
};


