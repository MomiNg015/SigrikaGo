import js from '@eslint/js';
import globals from 'globals';
import react from 'eslint-plugin-react';
import hooks from 'eslint-plugin-react-hooks';

export default [{
  files: ['docs/design-samples/handbook-puzzle/*.{js,mjs}', 'docs/design-samples/handbook-puzzle/app/*.{js,mjs}', 'docs/design-samples/handbook-puzzle/app/src/*.{js,jsx}'],
  languageOptions: { ecmaVersion: 'latest', sourceType: 'module',
    parserOptions: { ecmaFeatures: { jsx: true } }, globals: { ...globals.browser, ...globals.node } },
  plugins: { react, 'react-hooks': hooks },
  rules: { ...js.configs.recommended.rules, 'react/jsx-uses-vars': 'error',
    'react-hooks/rules-of-hooks': 'error', 'react-hooks/exhaustive-deps': 'error' },
}];
