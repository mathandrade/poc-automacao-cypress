// cypress/pages/LoginPage.js

class LoginPage {

  // ========== SELECTORES ==========
  get iconeLogin()         { return '.fa-user'; }
  get inputEmail()         { return '#user'; }
  get inputSenha()         { return '#password'; }
  get botaoEntrar()        { return '#btnLogin'; }
  get tituloSucesso()      { return '#swal2-title'; }
  get mensagemBoasVindas() { return '#swal2-html-container'; }
  get botaoOk()            { return '.swal2-confirm'; }
  get mensagemErro()       { return '.invalid_input'; }

  // ========== AÇÕES ==========
  acessarLogin() {
    cy.visit('/');
    cy.get(this.iconeLogin).click();
    return this;
  }

  preencherEmail(email) {
    // ✅ Converte para string ANTES de validar
    //    Planilha pode trazer número, null, undefined etc.
    const valor = email == null ? '' : String(email);

    if (valor !== '') {
      cy.get(this.inputEmail).clear().type(valor);
    } else {
      cy.get(this.inputEmail).clear();
      cy.log('⚠️ Email vazio — campo limpo, sem digitação');
    }
    return this;
  }

  preencherSenha(senha) {
    // ✅ MESMA proteção — senha numérica do Excel quebrava .type()
    const valor = senha == null ? '' : String(senha);

    if (valor !== '') {
      cy.get(this.inputSenha).clear().type(valor, { log: false });
    } else {
      cy.get(this.inputSenha).clear();
      cy.log('⚠️ Senha vazia — campo limpo, sem digitação');
    }
    return this;
  }

  clicarEntrar() {
    cy.get(this.botaoEntrar).click();
    return this;
  }

  clicarOk() {
    cy.get(this.botaoOk).click();
    return this;
  }

  fazerLogin(email, senha) {
    this.preencherEmail(email);
    this.preencherSenha(senha);
    this.clicarEntrar();
    return this;
  }

  // ========== VALIDAÇÕES ==========
  validarLoginSucesso(email) {
    const emailStr = String(email);

    cy.get(this.tituloSucesso, { timeout: 10000 })
      .should('be.visible')
      .should('have.text', 'Login realizado');

    cy.get(this.mensagemBoasVindas, { timeout: 10000 })
      .should('be.visible')
      .should('have.text', `Olá, ${emailStr}`);

    return this;
  }

  validarMensagemErro(mensagemEsperada) {
    cy.get(this.mensagemErro, { timeout: 5000 })
      .should('be.visible')
      .should('have.text', mensagemEsperada);
    return this;
  }
}

export default new LoginPage();