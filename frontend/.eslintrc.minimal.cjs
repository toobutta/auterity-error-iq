/* eslint-env node */
module.exports = {
  env: { 
    browser: true, 
    es2020: true,
    node: true
  },
  extends: ["eslint:recommended", "@typescript-eslint/recommended"],
  ignorePatterns: ["dist", ".eslintrc.js", "*.config.js", "*.config.ts"],
  parser: "@typescript-eslint/parser",
  plugins: ["react-refresh"],
  rules: {
    "@typescript-eslint/no-explicit-any": "warn",
    "@typescript-eslint/no-unused-vars": "warn",
    "@typescript-eslint/explicit-function-return-type": "off",
    "@typescript-eslint/explicit-module-boundary-types": "off",
    "@typescript-eslint/no-non-null-assertion": "warn",
    "react-refresh/only-export-components": [
      "warn",
      { allowConstantExport: true },
    ],
  },
};
