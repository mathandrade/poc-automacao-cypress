// cypress/support/commands.js
// Comandos customizados para reutilização nos testes

/**
 * Comando de login
 * Uso: cy.login('email@teste.com', '123456')
 */
Cypress.Commands.add('login', (email, senha) => {
  cy.visit('/');
  cy.get('.fa-lock').click();
  
  if (email && email !== '') {
    cy.get('#email').clear().type(email);
  }
  if (senha && senha !== '') {
    cy.get('#password').clear().type(senha);
  }
  
  cy.get('#btnLogin').click();
});

/**
 * Valida mensagem de erro na tela
 * Uso: cy.validarMensagemErro('Senha obrigatória')
 */
Cypress.Commands.add('validarMensagemErro', (mensagem) => {
  cy.get('.errorLabel, .alert-danger, .invalid_input', { timeout: 5000 })
    .should('be.visible')
    .should('contain', mensagem);
});

/**
 * Valida login realizado com sucesso
 * Uso: cy.validarLoginSucesso()
 */
Cypress.Commands.add('validarLoginSucesso', () => {
  cy.url().should('include', '/my-account');
  cy.contains('Login realizado').should('be.visible');
});