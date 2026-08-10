// cypress/support/commands.js
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';

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
// COMANDO DE ALTO NÍVEL — orquestra um cenário completo de login
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

// ============================================
// COMANDOS DE CADASTRO — building blocks (granularidade fina)
// ============================================

Cypress.Commands.add('acessarTelaCadastro', () => {
  RegisterPage.acessarCadastro();
});

Cypress.Commands.add('submeterCadastro', (nome, email, senha) => {
  RegisterPage.fazerCadastro(nome, email, senha);
});

Cypress.Commands.add('validarCadastroSucesso', (nome) => {
  RegisterPage.validarCadastroSucesso(nome);
  RegisterPage.clicarOk();
});

Cypress.Commands.add('validarErroCadastro', (campo, mensagemEsperada) => {
  RegisterPage.validarMensagemErroCampo(campo, mensagemEsperada || '');
});

// ============================================
// COMANDO DE ALTO NÍVEL — orquestra um cenário completo de cadastro
// ============================================

Cypress.Commands.add('executarCenarioCadastro', (cenario) => {
  cy.acessarTelaCadastro();
  cy.submeterCadastro(cenario.nome, cenario.email, cenario.senha);

  if (cenario.resultado_esperado === 'sucesso') {
    cy.validarCadastroSucesso(cenario.nome);
  } else {
    cy.validarErroCadastro(cenario.campo_erro, cenario.mensagem_esperada);
  }
});