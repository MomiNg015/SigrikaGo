import js from '@eslint/js';
import globals from 'globals';

export default [{
  files: ['docs/prototypes/character-sprites/*.{js,mjs}'],
  ...js.configs.recommended,
  languageOptions: { ecmaVersion: 'latest', sourceType: 'module', globals: { ...globals.browser, ...globals.node } }
}];
