// backend/server.js
const { validarPlanilha } = require('./validators/scenarioSchema');
const { executar: executarCypress } = require('./services/cypressRunner');
const { guard, isRunningStatus } = require('./middleware/concurrencyGuard');
const statusRoutes = require('./routes/status');
const reportRoutes = require('./routes/report');
const uploadRoutes = require('./routes/upload');
const config = require('./config');
const { gerarHtml } = require('./services/reportGenerator');
const { lerPlanilha } = require('./services/spreadsheet');
const express  = require('express');
const multer   = require('multer');
const fs       = require('fs');
const path     = require('path');
const { exec } = require('child_process');
const cors     = require('cors');
const crypto   = require('crypto');

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api', uploadRoutes);


// ============================================
// Endpoints auxiliares
// ============================================
app.use('/api', statusRoutes);
app.use('/api', reportRoutes);


app.listen(config.PORT, '0.0.0.0', () => {
    console.log(`🚀 Servidor em http://localhost:${config.PORT}`);
});