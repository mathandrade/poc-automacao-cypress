// cypress/e2e/dynamic-testes.cy.js
import LoginPage from '../../pages/LoginPage';

// ✅ Dados vêm do setupNodeEvents (carregados síncronos)
//    Por isso conseguimos gerar it() em loop ANTES da execução
const cenarios = Cypress.env('cenarios') || [];

describe('Testes Dinâmicos de Login', () => {

  before(() => {
    cy.log(`📂 Total de cenários: ${cenarios.length}`);
    if (cenarios.length === 0) {
      throw new Error('Nenhum cenário carregado. Verifique --env fixtureFile=...');
    }
  });

  // ✅ Grava o resultado de CADA teste — passou ou falhou
  afterEach(function () {
    const test = this.currentTest;
    cy.task('recordResult', {
      cenario: test.title,
      status:  test.state, // 'passed' | 'failed'
      erro:    test.err ? test.err.message : null
    });
  });

  // ✅ UM it() POR CENÁRIO — Cypress agora conta corretamente
  //    Se um falhar, os outros continuam rodando (isolamento)
  cenarios.forEach((cenario, index) => {
    it(`[${index + 1}] ${cenario.cenario}`, () => {
      LoginPage.acessarLogin();
      LoginPage.fazerLogin(cenario.email, cenario.senha);

      if (cenario.resultado_esperado === 'sucesso') {
        LoginPage.validarLoginSucesso(cenario.email);
        LoginPage.clicarOk();
      } else {
        LoginPage.validarMensagemErro(cenario.mensagem_esperada || '');
      }
    });
  });
});