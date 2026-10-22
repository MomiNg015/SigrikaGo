import projectConfig from '../../../eslint.config.js';

// Apply the same maintained-source rules to this isolated JSX sample without
// changing the root's maintained-file list or unrelated pending configuration.
export default projectConfig.map(config=>config.files ? {...config,files:['**/*.js','**/*.jsx','**/*.mjs']} : config);
