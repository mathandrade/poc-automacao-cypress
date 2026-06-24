// cypress/support/commands.js
import LoginPage from '../pages/LoginPage';

// ============================================
// COMANDOS DE LOGIN — building blocks (granularidade fina)
// ============================================

Cypress.Commands.add('acessarTelaLogin', () => {
  LoginPage.acessarLogin();
});

Cypress.Commands.add('submeterLogin', (email, senha) => {
  LoginPage.fazerLogin(email, senha);
});

Cypress.Commands.add('validarLoginSucesso', (email) => {
  LoginPage.validarLoginSucesso(email);
  LoginPage.clicarOk();
});

Cypress.Commands.add('validarErroLogin', (mensagemEsperada) => {
  LoginPage.validarMensagemErro(mensagemEsperada || '');
});

// ============================================
// COMANDO DE ALTO NÍVEL — orquestra um cenário completo
// ============================================

Cypress.Commands.add('executarCenarioLogin', (cenario) => {
  cy.acessarTelaLogin();
  cy.submeterLogin(cenario.email, cenario.senha);

  if (cenario.resultado_esperado === 'sucesso') {
    cy.validarLoginSucesso(cenario.email);
  } else {
    cy.validarErroLogin(cenario.mensagem_esperada);
  }
});