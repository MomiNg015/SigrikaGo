import base from '../../../playwright.config.js';
export default { ...base, testDir: '../../../tests/e2e', use: { ...base.use, baseURL: 'http://127.0.0.1:5278' }, webServer: undefined };

