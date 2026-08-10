// cypress/pages/RegisterPage.js

class RegisterPage {

  // ========== SELECTORES ==========
  get inputNome() { return '#user'; }
  get inputEmail() { return '#email'; }
  get inputSenha() { return '#password'; }
  get botaoCadastrar() { return '#btnRegister'; }

  get erroNome() { return '#user + .errorLabel'; }
  get erroEmail() { return '#email + .errorLabel'; }
  get erroSenha() { return '#password + .errorLabel'; }

  get tituloSucesso() { return '#swal2-title'; }
  get mensagemBoasVindas() { return '#swal2-html-container'; }
  get botaoOk() { return '.swal2-confirm'; }

  get mapaErros() {
    return {
      nome: this.erroNome,
      email: this.erroEmail,
      senha: this.erroSenha,
    };
  }

  // ========== AÇÕES ==========
  acessarCadastro() {
    cy.visit('/register');
    return this;
  }

  preencherNome(nome) {
    if (nome && nome !== '') {
      cy.get(this.inputNome).clear().type(nome);
    } else {
      cy.get(this.inputNome).clear();
      cy.log('Nome vazio - campo limpo, sem digitacao');
    }
    return this;
  }

  preencherEmail(email) {
    if (email && email !== '') {
      cy.get(this.inputEmail).clear().type(email);
    } else {
      cy.get(this.inputEmail).clear();
      cy.log('Email vazio - campo limpo, sem digitacao');
    }
    return this;
  }

  preencherSenha(senha) {
    if (senha && senha !== '') {
      cy.get(this.inputSenha).clear().type(senha);
    } else {
      cy.get(this.inputSenha).clear();
      cy.log('Senha vazia - campo limpo, sem digitacao');
    }
    return this;
  }

  clicarCadastrar() {
    cy.get(this.botaoCadastrar).click();
    return this;
  }

  clicarOk() {
    cy.get(this.botaoOk).click();
    return this;
  }

  fazerCadastro(nome, email, senha) {
    this.preencherNome(nome);
    this.preencherEmail(email);
    this.preencherSenha(senha);
    this.clicarCadastrar();
    return this;
  }

  // ========== VALIDAÇÕES ==========
  validarCadastroSucesso(nome) {
    cy.get(this.tituloSucesso, { timeout: 10000 })
      .should('be.visible')
      .should('have.text', 'Cadastro realizado!');

    cy.get(this.mensagemBoasVindas, { timeout: 10000 })
      .should('be.visible')
      .should('have.text', `Bem-vindo ${nome}`);

    return this;
  }

  validarMensagemErroCampo(campo, mensagemEsperada) {
    const seletor = this.mapaErros[campo];
    if (!seletor) {
      throw new Error(`Campo de erro desconhecido: "${campo}". Use 'nome', 'email' ou 'senha'.`);
    }
    cy.get(seletor, { timeout: 5000 })
      .should('be.visible')
      .should('have.text', mensagemEsperada);
    return this;
  }
}

export default new RegisterPage();