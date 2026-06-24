// cypress.config.js
const { defineConfig } = require('cypress');
const fs = require('fs');
const path = require('path');

module.exports = defineConfig({
  e2e: {
    // ✅ URL DA APLICAÇÃO SOB TESTE (não confundir com o backend Node)
    baseUrl: 'https://automationpratice.com.br',

    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    video: false,
    screenshotOnRunFailure: true,

    // Site público de prática às vezes demora — folga maior nos timeouts
    defaultCommandTimeout: 10000,
    pageLoadTimeout: 60000,

    setupNodeEvents(on, config) {
      // ============================================
      // 1) CARREGA FIXTURE SÍNCRONO → injeta em env
      //    (deprecation do Cypress.env é só WARNING até v16, segue funcionando)
      // ============================================
      const fixtureFile = config.env.fixtureFile || 'cenarios.json';
      const fixturePath = path.join(__dirname, 'cypress', 'fixtures', fixtureFile);

      if (fs.existsSync(fixturePath)) {
        try {
          const raw = fs.readFileSync(fixturePath, 'utf8');
          config.env.cenarios = JSON.parse(raw);
          console.log(`✅ Fixture carregado: ${fixtureFile} (${config.env.cenarios.length} cenários)`);
        } catch (e) {
          console.error(`❌ Erro ao parsear ${fixtureFile}:`, e.message);
          config.env.cenarios = [];
        }
      } else {
        console.warn(`⚠️  Fixture não encontrado: ${fixturePath}`);
        config.env.cenarios = [];
      }

      // ============================================
      // 2) RESET do results.json antes da execução
      // ============================================
      const reportDir  = path.join(__dirname, 'reports');
      const reportPath = path.join(reportDir, 'results.json');

      if (!fs.existsSync(reportDir)) fs.mkdirSync(reportDir, { recursive: true });

      fs.writeFileSync(reportPath, JSON.stringify({
        total: 0, passed: 0, failed: 0, duration: '0s', details: []
      }, null, 2));

      // ============================================
      // 3) TASK: grava cada resultado individualmente
      // ============================================
      on('task', {
        recordResult(result) {
          const current = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
          current.details.push(result);
          current.total  = current.details.length;
          current.passed = current.details.filter(d => d.status === 'passed').length;
          current.failed = current.details.filter(d => d.status === 'failed').length;
          fs.writeFileSync(reportPath, JSON.stringify(current, null, 2));
          return null;
        }
      });

      return config;
    }
  }
});