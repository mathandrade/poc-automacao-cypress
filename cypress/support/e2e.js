// cypress/support/e2e.js
// Este arquivo é carregado automaticamente antes de cada teste

import './commands';

// Suprime erros não tratados (evita quebra por erros de terceiros)
Cypress.on('uncaught:exception', (err, runnable) => {
  console.log('⚠️ Erro não tratado capturado:', err.message);
  return false;
});

// Log quando o teste começa
Cypress.on('test:before:run', () => {
  console.log('🚀 Iniciando teste...');
});