// backend/server.js
const { validarPlanilha } = require('./validators/scenarioSchema');
const config = require('./config');
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
        res.send(generateHtmlReport(results));
    } catch (e) {
        res.status(500).json({ error: 'Erro ao gerar relatório.', details: e.message });
    }
});

// ============================================
// Gerador de relatório HTML
// ============================================
function generateHtmlReport(results) {
    const total    = results.total  || 0;
    const passed   = results.passed || 0;
    const failed   = results.failed || 0;
    const passRate = total > 0 ? Math.round((passed / total) * 100) : 0;
    const passedH  = total > 0 ? Math.round((passed / total) * 180) : 0;
    const failedH  = total > 0 ? Math.round((failed / total) * 180) : 0;

    return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><title>Relatório Cypress</title>
<style>
* { margin:0; padding:0; box-sizing:border-box; font-family:'Segoe UI',sans-serif; }
body { background:#f4f6f9; padding:40px; }
.container { max-width:1200px; margin:0 auto; }
.header { background:linear-gradient(135deg,#667eea,#764ba2); color:white; padding:30px; border-radius:16px; margin-bottom:30px; }
.stats { display:grid; grid-template-columns:repeat(4,1fr); gap:20px; margin-bottom:30px; }
.stat-card { background:white; padding:20px; border-radius:12px; box-shadow:0 2px 8px rgba(0,0,0,.08); text-align:center; }
.stat-card .number { font-size:36px; font-weight:bold; }
.stat-card.total .number  { color:#667eea; }
.stat-card.passed .number { color:#22c55e; }
.stat-card.failed .number { color:#ef4444; }
.stat-card.rate .number   { color:#f59e0b; }
.chart-container { background:white; padding:20px; border-radius:12px; box-shadow:0 2px 8px rgba(0,0,0,.08); margin-bottom:30px; }
.bar-chart { display:flex; gap:30px; align-items:flex-end; justify-content:center; height:200px; }
.bar { width:80px; border-radius:8px 8px 0 0; }
.bar.passed { background:#22c55e; height:${passedH}px; }
.bar.failed { background:#ef4444; height:${failedH}px; }
.details { background:white; border-radius:12px; box-shadow:0 2px 8px rgba(0,0,0,.08); overflow:hidden; }
.details table { width:100%; border-collapse:collapse; }
.details th { background:#f8fafc; padding:14px 20px; text-align:left; border-bottom:2px solid #e2e8f0; }
.details td { padding:12px 20px; border-bottom:1px solid #e2e8f0; }
.status-badge { padding:4px 12px; border-radius:20px; font-size:13px; font-weight:600; }
.status-badge.passed { background:#dcfce7; color:#166534; }
.status-badge.failed { background:#fee2e2; color:#991b1b; }
</style></head><body><div class="container">
<div class="header"><h1>📊 Relatório de Testes</h1><p>${new Date().toLocaleString('pt-BR')} | Duração: ${results.duration || 'N/A'}</p></div>
<div class="stats">
<div class="stat-card total"><div class="number">${total}</div><div>Total</div></div>
<div class="stat-card passed"><div class="number">${passed}</div><div>✅ Passaram</div></div>
<div class="stat-card failed"><div class="number">${failed}</div><div>❌ Falharam</div></div>
<div class="stat-card rate"><div class="number">${passRate}%</div><div>Taxa</div></div>
</div>
<div class="chart-container"><h3>Distribuição</h3>
<div class="bar-chart">
<div><div class="bar passed"></div><div>✅ ${passed}</div></div>
<div><div class="bar failed"></div><div>❌ ${failed}</div></div>
</div></div>
<div class="details"><table><thead><tr><th>Cenário</th><th>Status</th><th>Erro</th></tr></thead><tbody>
${(results.details || []).map(d => `<tr><td>${d.cenario}</td><td><span class="status-badge ${d.status}">${d.status === 'passed' ? '✅ PASSED' : '❌ FAILED'}</span></td><td>${d.erro || '-'}</td></tr>`).join('')}
</tbody></table></div></div></body></html>`;
}

// ============================================
// Boot
// ============================================
app.listen(config.PORT, '0.0.0.0', () => {
    console.log(`🚀 Servidor em http://localhost:${config.PORT}`);
});