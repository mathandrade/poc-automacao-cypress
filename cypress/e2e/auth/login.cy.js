// cypress/e2e/auth/login.cy.js

// ✅ Dados vêm do setupNodeEvents (carregados síncronos via cypress.config.js)
const cenarios = Cypress.env('cenarios') || [];

describe('Testes Dinâmicos de Login', () => {

  before(() => {
    cy.log(`📂 Total de cenários: ${cenarios.length}`);
    if (cenarios.length === 0) {
      throw new Error('Nenhum cenário carregado. Verifique --env fixtureFile=...');
    }
  });

  // ✅ Grava o resultado de cada teste no relatório
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
      cy.executarCenarioLogin(cenario);
    });
  });
});