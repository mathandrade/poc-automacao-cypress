// backend/routes/report.js
const express = require('express');
const fs = require('fs');
const config = require('../config');
const { gerarHtml } = require('../services/reportGenerator');

const router = express.Router();

// ============================================
// GET /api/generate-report
// Lê o results.json e retorna HTML formatado do relatório de execução
// ============================================
router.get('/generate-report', (req, res) => {
    const reportPath = config.PATHS.resultsJson;

    if (!fs.existsSync(reportPath)) {
        return res.status(404).json({
            error: 'Nenhum relatório. Execute os testes primeiro.'
        });
    }

    try {
        const results = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.send(gerarHtml(results));
    } catch (e) {
        res.status(500).json({
            error:   'Erro ao gerar relatório.',
            details: e.message
        });
    }
});

module.exports = router;