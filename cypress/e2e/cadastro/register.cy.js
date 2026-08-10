// cypress/e2e/cadastro/register.cy.js

// ✅ Dados vêm do setupNodeEvents (carregados síncronos via cypress.config.js)
const cenarios = Cypress.env('cenariosCadastro') || [];

describe('Testes Dinâmicos de Cadastro', () => {

  before(() => {
    cy.log(`📂 Total de cenários: ${cenarios.length}`);
    if (cenarios.length === 0) {
      throw new Error('Nenhum cenário de cadastro carregado. Verifique cypress/fixtures/cenarios_cadastro.json');
    }
  });

  // ✅ Grava o resultado de cada teste no relatório (mesmo task usado no login)
  afterEach(function () {
    const test = this.currentTest;
    cy.task('recordResult', {
      cenario: test.title,
      status:  test.state,
      erro:    test.err ? test.err.message : null
    });
  });

  // ✅ Um it() por cenário, executado via comando customizado
  cenarios.forEach((cenario, index) => {
    it(`[${index + 1}] ${cenario.cenario}`, () => {
      cy.executarCenarioCadastro(cenario);
    });
  });
});