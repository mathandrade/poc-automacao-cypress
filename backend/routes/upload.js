// backend/routes/upload.js
const express = require('express');
const multer  = require('multer');
const fs      = require('fs');
const path    = require('path');
const crypto  = require('crypto');

const config = require('../config');
const { guard } = require('../middleware/concurrencyGuard');
const { validarPlanilha } = require('../validators/scenarioSchema');
const { lerPlanilha } = require('../services/spreadsheet');
const { executar: executarCypress } = require('../services/cypressRunner');

const router = express.Router();
const upload = multer({ dest: config.PATHS.uploads });

// ============================================
// POST /api/upload-and-run
// Recebe planilha, valida, executa Cypress e retorna resultados
// ============================================
router.post('/upload-and-run', guard, upload.single('planilha'), async (req, res) => {

    const planilhaPath    = req.file.path;
    const executionId     = `${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const fixtureFileName = `cenarios_run_${executionId}.json`;
    const fixturePath     = path.join(config.PATHS.fixtures, fixtureFileName);
    const reportPath      = config.PATHS.resultsJson;

    try {
        console.log(`📁 Planilha: ${req.file.originalname}`);
        console.log(`🆔 Execution ID: ${executionId}`);

        // 1. Limpa results.json anterior
        if (fs.existsSync(reportPath)) {
            fs.unlinkSync(reportPath);
            console.log('🧹 results.json anterior removido');
        }

        // 2. Lê e normaliza a planilha
        const cenarios = lerPlanilha(planilhaPath);

        // 3. Validação de schema antes de prosseguir
        const { valido, erros } = validarPlanilha(cenarios);
        if (!valido) {
            console.error('❌ Planilha inválida:', erros);
            return res.status(400).json({
                success: false,
                error:   'Planilha contém erros de formatação',
                detalhes: erros
            });
        }

        console.log(`📊 ${cenarios.length} cenários após normalização`);
        console.log(JSON.stringify(cenarios, null, 2));

        // 4. Salva fixture isolado (UTF-8 explícito)
        fs.mkdirSync(path.dirname(fixturePath), { recursive: true });
        fs.writeFileSync(fixturePath, JSON.stringify(cenarios, null, 2), 'utf8');

        // 5. Executa Cypress
        const resultados = await executarCypress(cenarios, fixtureFileName);

        res.json({
            success:  true,
            executionId,
            total:    resultados.total,
            passed:   resultados.passed,
            failed:   resultados.failed,
            duration: resultados.duration,
            details:  resultados.details
        });

    } catch (error) {
        console.error('❌ Erro:', error);
        res.status(500).json({ success: false, error: error.message });
    } finally {
        try { fs.unlinkSync(planilhaPath); } catch (_) {}
        try { fs.unlinkSync(fixturePath); }  catch (_) {}
    }
});

module.exports = router;