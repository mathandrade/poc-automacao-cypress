// backend/config/index.js
require('dotenv').config();
const path = require('path');

// Raiz do projeto (dois níveis acima de config/)
const ROOT = path.resolve(__dirname, '..', '..');

module.exports = {
  PORT: parseInt(process.env.PORT, 10) || 3000,
  PATHS: {
    uploads: 'uploads/',
    fixtures: path.join(ROOT, 'cypress', 'fixtures'),
    reports: path.join(ROOT, 'reports'),
    resultsJson: path.join(ROOT, 'reports', 'results.json'),
  },
  CYPRESS: {
    spec: process.env.CYPRESS_SPEC || 'cypress/e2e/auth/login.cy.js',
    cwd: ROOT,
    maxBufferBytes: parseInt(process.env.CYPRESS_MAX_BUFFER, 10) || 10 * 1024 * 1024,
  },
};
