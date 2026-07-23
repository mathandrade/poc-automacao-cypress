// backend/routes/status.js
const express = require('express');
const { isRunningStatus } = require('../middleware/concurrencyGuard');

const router = express.Router();

// ============================================
// GET /api/status
// Retorna se há execução em andamento (usado para healthcheck)
// ============================================
router.get('/status', (req, res) => {
    res.json({
        running:   isRunningStatus(),
        timestamp: new Date().toISOString()
    });
});

module.exports = router;