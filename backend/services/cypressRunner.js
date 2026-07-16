// backend/services/cypressRunner.js
const { exec } = require('child_process');
const fs = require('fs');
const config = require('../config');

/**
 * Executa a suíte Cypress com o fixture especificado e retorna resultado estruturado.
 * 
 * Fluxo:
 *   1. Dispara `npx cypress run` como processo filho
 *   2. Aguarda término (independente de sucesso ou falha do Cypress)
 *   3. Lê o results.json gravado pela task recordResult (setupNodeEvents)
 *   4. Se não houver relatório, monta fallback com todos os cenários como failed
 * 
 * @param {Array<Object>} cenarios - Lista de cenários (para fallback e contagem)
 * @param {string} fixtureFileName - Nome do arquivo de fixture (não path completo)
 * @returns {Promise<Object>} { total, passed, failed, duration, details }
 */
function executar(cenarios, fixtureFileName) {
    return new Promise((resolve) => {
        const startTime = Date.now();
        const cmd = `npx cypress run --spec "${config.CYPRESS.spec}" --env fixtureFile=${fixtureFileName}`;

        console.log(`▶️  ${cmd}`);

        exec(
            cmd,
            { cwd: config.CYPRESS.cwd, maxBuffer: config.CYPRESS.maxBufferBytes },
            (error, stdout, stderr) => {
                const duration = ((Date.now() - startTime) / 1000).toFixed(2);

                console.log(stdout);
                if (stderr) console.warn(stderr);

                // Tenta ler o results.json que foi gerado pela task recordResult
                if (fs.existsSync(config.PATHS.resultsJson)) {
                    try {
                        const data = JSON.parse(fs.readFileSync(config.PATHS.resultsJson, 'utf8'));
                        data.duration = `${duration}s`;
                        return resolve(data);
                    } catch (e) {
                        console.error('Erro parseando results.json:', e.message);
                    }
                }

                // Fallback: Cypress quebrou cedo, não gerou relatório
                resolve(buildFallbackResult(cenarios, duration));
            }
        );
    });
}

/**
 * Constrói resultado de fallback quando Cypress não gera relatório.
 * Trata todos os cenários como failed com mensagem genérica.
 * 
 * @param {Array<Object>} cenarios
 * @param {string} duration
 * @returns {Object}
 */
function buildFallbackResult(cenarios, duration) {
    return {
        total:    cenarios.length,
        passed:   0,
        failed:   cenarios.length,
        duration: `${duration}s`,
        details:  cenarios.map(c => ({
            cenario: c.cenario,
            status:  'failed',
            erro:    'Cypress não gerou relatório. Verifique logs do servidor.'
        }))
    };
}

module.exports = { executar };