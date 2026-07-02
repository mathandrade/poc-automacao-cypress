// backend/config/index.js
const path = require('path');

// Raiz do projeto (dois níveis acima de config/)
const ROOT = path.resolve(__dirname, '..', '..');

module.exports = {
    // ============================================
    // SERVIDOR
    // ============================================
    PORT: 3000,

    // ============================================
    // CAMINHOS DE ARQUIVOS
    // ============================================
    PATHS: {
        uploads:     'uploads/',                                       // relativo ao cwd do multer
        fixtures:    path.join(ROOT, 'cypress', 'fixtures'),
        reports:     path.join(ROOT, 'reports'),
        resultsJson: path.join(ROOT, 'reports', 'results.json')
    },

    // ============================================
    // CYPRESS
    // ============================================
    CYPRESS: {
        spec:            'cypress/e2e/auth/login.cy.js',
        cwd:             ROOT,
        maxBufferBytes:  10 * 1024 * 1024
    }
};