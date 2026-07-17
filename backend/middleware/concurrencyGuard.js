// backend/middleware/concurrencyGuard.js

// Estado interno do módulo — encapsulado, ninguém acessa direto
let isRunning = false;

/**
 * Middleware Express que impede execuções concorrentes.
 * 
 * Comportamento:
 *   1. Se já há execução ativa, responde HTTP 409 e não passa adiante
 *   2. Se não há, marca isRunning=true e passa para o próximo middleware
 *   3. Ao final da requisição (quando res.json é chamado), libera o lock
 * 
 * Uso:
 *   app.post('/rota', guard, outroMiddleware, handler);
 */
function guard(req, res, next) {
    if (isRunning) {
        return res.status(409).json({
            success: false,
            error: 'Já existe uma execução em andamento. Aguarde terminar.'
        });
    }

    isRunning = true;

    // ⚡ Method wrapping: intercepta res.json para liberar o lock automaticamente
    //    quando a resposta for enviada (independente de sucesso ou erro).
    //    Isso evita que o endpoint precise se preocupar com try/finally.
    const originalJson = res.json.bind(res);
    res.json = (body) => {
        isRunning = false;
        return originalJson(body);
    };

    next(); // 👉 passa para o próximo middleware ou handler
}

/**
 * Retorna se há execução em andamento.
 * Usado pelo endpoint GET /api/status.
 */
function isRunningStatus() {
    return isRunning;
}

module.exports = { guard, isRunningStatus };