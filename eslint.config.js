import js from "@eslint/js";
import globals from "globals";

export default [
  {
    ignores: [
      "dist/**",
      "node_modules/**",
      "test-results/**",
      "playwright-report/**",
      "supabase/functions/**",
      "tests/account-deletion/**",
    ],
  },
  js.configs.recommended,
  {
    files: ["app.js", "modules/**/*.js", "planner-rules.mjs"],
    languageOptions: {
      globals: { ...globals.browser, L: "readonly", maplibregl: "readonly" },
    },
    rules: {
      "no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
  {
    files: ["scripts/**/*.mjs", "*.config.js", "tests/**/*.js"],
    languageOptions: {
      globals: { ...globals.node, ...globals.browser, ...globals.vitest },
    },
    rules: {
      "no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
];
