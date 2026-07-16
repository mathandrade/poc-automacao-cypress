// backend/server.js
const { validarPlanilha } = require('./validators/scenarioSchema');
const { executar: executarCypress } = require('./services/cypressRunner');
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

const upload = multer({ dest: config.PATHS.uploads });

let isRunning = false;


// ============================================
// POST /api/upload-and-run
// ============================================
app.post('/api/upload-and-run', upload.single('planilha'), async (req, res) => {

    if (isRunning) {
        return res.status(409).json({
            success: false,
            error: 'Já existe uma execução em andamento. Aguarde terminar.'
        });
    }

    const planilhaPath    = req.file.path;
    const executionId     = `${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const fixtureFileName = `cenarios_run_${executionId}.json`;
    const fixturePath     = path.join(config.PATHS.fixtures, fixtureFileName);
    const reportPath      = config.PATHS.resultsJson;

    isRunning = true;

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
                error: 'Planilha contém erros de formatação',
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
        isRunning = false;
        try { fs.unlinkSync(planilhaPath); } catch (_) {}
        try { fs.unlinkSync(fixturePath); }  catch (_) {}
    }
});


// ============================================
// Endpoints auxiliares
// ============================================
app.get('/api/status', (req, res) => {
    res.json({ running: isRunning, timestamp: new Date().toISOString() });
});

app.get('/api/generate-report', (req, res) => {
    const reportPath = config.PATHS.resultsJson;

    if (!fs.existsSync(reportPath)) {
        return res.status(404).json({ error: 'Nenhum relatório. Execute os testes primeiro.' });
    }

    try {
        const results = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.send(gerarHtml(results));
    } catch (e) {
        res.status(500).json({ error: 'Erro ao gerar relatório.', details: e.message });
    }
});


app.listen(config.PORT, '0.0.0.0', () => {
    console.log(`🚀 Servidor em http://localhost:${config.PORT}`);
});