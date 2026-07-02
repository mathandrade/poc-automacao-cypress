// backend/services/spreadsheet.js
const XLSX = require('xlsx');

/**
 * Normaliza valores vindos do Excel:
 *   - Mantém strings como string
 *   - Converte número/boolean para string
 *   - undefined/null vira ''
 * 
 * @param {Array<Object>} rows - Linhas cruas vindas do sheet_to_json
 * @returns {Array<Object>} Cenários normalizados com 5 campos garantidos como string
 */
function normalizarCenarios(rows) {
    return rows.map(r => ({
        cenario:            r.cenario            != null ? String(r.cenario)            : '',
        email:              r.email              != null ? String(r.email)              : '',
        senha:              r.senha              != null ? String(r.senha)              : '',
        resultado_esperado: r.resultado_esperado != null ? String(r.resultado_esperado) : '',
        mensagem_esperada:  r.mensagem_esperada  != null ? String(r.mensagem_esperada)  : ''
    }));
}

/**
 * Lê um arquivo XLSX/XLS/CSV e retorna array de cenários normalizados.
 * 
 * @param {string} caminhoArquivo - Path absoluto ou relativo do arquivo
 * @returns {Array<Object>} Cenários prontos pra validação e execução
 */
function lerPlanilha(caminhoArquivo) {
    const workbook = XLSX.readFile(caminhoArquivo);
    const sheet    = workbook.Sheets[workbook.SheetNames[0]];
    const rows     = XLSX.utils.sheet_to_json(sheet, { raw: false, defval: '' });
    return normalizarCenarios(rows);
}

module.exports = { lerPlanilha, normalizarCenarios };