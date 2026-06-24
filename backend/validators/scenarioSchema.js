// backend/validators/scenarioSchema.js
const { z } = require('zod');

// ============================================
// SCHEMA DE UM CENÁRIO INDIVIDUAL
// ============================================
const cenarioSchema = z.object({
  cenario: z
    .string({ required_error: "Coluna 'cenario' é obrigatória" })
    .min(1, "O nome do cenário não pode estar vazio"),

  email: z
    .string({ required_error: "Coluna 'email' é obrigatória" })
    // ✅ Aceita string vazia (é caso de teste válido) — não força formato de email
    .default(''),

  senha: z
    .string({ required_error: "Coluna 'senha' é obrigatória" })
    .default(''),

  resultado_esperado: z
    .enum(['sucesso', 'erro'], {
      errorMap: () => ({
        message: "Coluna 'resultado_esperado' deve ser 'sucesso' ou 'erro'"
      })
    }),

  mensagem_esperada: z
    .string()
    .optional()
    .default('')
});

// ============================================
// SCHEMA DA PLANILHA INTEIRA (array de cenários)
// ============================================
const planilhaSchema = z
  .array(cenarioSchema)
  .min(1, "A planilha deve ter pelo menos 1 cenário");

// ============================================
// FUNÇÃO DE VALIDAÇÃO — retorna resultado estruturado
// ============================================
function validarPlanilha(cenarios) {
  const resultado = planilhaSchema.safeParse(cenarios);

  if (resultado.success) {
    return { valido: true, dados: resultado.data };
  }

  // Transforma os erros do zod em formato amigável
  const erros = resultado.error.issues.map(issue => ({
    linha: typeof issue.path[0] === 'number' ? issue.path[0] + 2 : null, // +2: linha 1 é cabeçalho, e o array é 0-indexed
    campo: issue.path[issue.path.length - 1],
    mensagem: issue.message
  }));

  return { valido: false, erros };
}

module.exports = { validarPlanilha };