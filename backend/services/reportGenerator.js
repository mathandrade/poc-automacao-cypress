// backend/services/reportGenerator.js

/**
 * Gera o HTML completo do relatório de execução dos testes.
 * Função pura: recebe resultados, retorna string HTML.
 * 
 * @param {Object} results - Objeto com total, passed, failed, duration e details
 * @returns {string} HTML completo do relatório
 */
function gerarHtml(results) {
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

module.exports = { gerarHtml };