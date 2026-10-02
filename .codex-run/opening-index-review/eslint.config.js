import js from "@eslint/js";
import globals from "globals";
import jsxA11y from "eslint-plugin-jsx-a11y";
import reactHooks from "eslint-plugin-react-hooks";
import react from "eslint-plugin-react";

const maintainedFiles = [
  "scripts/playwrightTestDatabase.mjs",
  "scripts/start-e2e-environment.mjs",
  "scripts/start-stability-server.mjs",
  "server/httpErrors.js",
  "server/loginSessions.js",
  "src/app/modalDismissal.js",
  "src/modals/modalComponents.jsx",
  "src/modals/LeaderboardModal.jsx",
  "src/modals/WatchModal.jsx",
  "src/modals/PersonalizationModal.jsx"
];

export default [
  { ignores: ["dist/**", "node_modules/**", ".tmp/**", ".trellis/**", ".codex-temp/**"] },
  {
    files: maintainedFiles,
    ...js.configs.recommended,
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      parserOptions: { ecmaFeatures: { jsx: true } },
      globals: { ...globals.browser, ...globals.node }
    },
    plugins: {
      "jsx-a11y": jsxA11y,
      react,
      "react-hooks": reactHooks
    },
    rules: {
      ...js.configs.recommended.rules,
      ...jsxA11y.configs.recommended.rules,
      "react/jsx-uses-vars": "error",
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "error",
      "jsx-a11y/click-events-have-key-events": "off",
      "jsx-a11y/no-static-element-interactions": "off",
      "no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }]
    }
  }
];
