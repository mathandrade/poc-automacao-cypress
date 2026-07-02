// backend/server.js
const { validarPlanilha } = require('./validators/scenarioSchema');
const config = require('./config');
const { gerarHtml } = require('./services/reportGenerator');
const express  = require('express');
const multer   = require('multer');
const XLSX     = require('xlsx');
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
// HELPER: normaliza valores vindos do Excel
//   - Mantém strings como string
//   - Converte número/boolean para string
//   - undefined/null vira ''
// ============================================
function normalizarCenarios(rows) {
    return rows.map(r => ({
        cenario:            r.cenario            != null ? String(r.cenario)            : '',
        email:              r.email              != null ? String(r.email)              : '',
        senha:              r.senha              != null ? String(r.senha)              : '',
        resultado_esperado: r.resultado_esperado != null ? String(r.resultado_esperado) : '',
        mensagem_esperada:  r.mensagem_esperada  != null ? String(r.mensagem_esperada)  : ''
    }));
}

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

        // 2. Excel → JSON (raw:false força valores como string)
        const workbook = XLSX.readFile(planilhaPath);
        const sheet    = workbook.Sheets[workbook.SheetNames[0]];
        const rows     = XLSX.utils.sheet_to_json(sheet, { raw: false, defval: '' });
        const cenarios = normalizarCenarios(rows);

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
        const resultados = await executarCypressReal(cenarios, fixtureFileName);

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
// Executa `cypress run --env fixtureFile=...`
// ============================================
function executarCypressReal(cenarios, fixtureFileName) {
    return new Promise((resolve) => {
        const startTime = Date.now();
        // ✅ Caminho atualizado para o spec reorganizado na Camada 1.A.1
        const cmd = `npx cypress run --spec "${config.CYPRESS.spec}" --env fixtureFile=${fixtureFileName}`;
        console.log(`▶️  ${cmd}`);

        exec(cmd, { cwd: config.CYPRESS.cwd, maxBuffer: config.CYPRESS.maxBufferBytes },
            (error, stdout, stderr) => {
                const duration   = ((Date.now() - startTime) / 1000).toFixed(2);
                const reportPath = config.PATHS.resultsJson;

                console.log(stdout);
                if (stderr) console.warn(stderr);

                if (fs.existsSync(reportPath)) {
                    try {
                        const data = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
                        data.duration = `${duration}s`;
                        return resolve(data);
                    } catch (e) {
                        console.error('Erro parseando results.json:', e.message);
                    }
                }

                // Fallback: Cypress não gerou relatório (provavelmente quebrou cedo)
                resolve({
                    total:    cenarios.length,
                    passed:   0,
                    failed:   cenarios.length,
                    duration: `${duration}s`,
                    details:  cenarios.map(c => ({
                        cenario: c.cenario,
                        status:  'failed',
                        erro:    'Cypress não gerou relatório. Verifique logs do servidor.'
                    }))
                });
            }
        );
    });
}

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