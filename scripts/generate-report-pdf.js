// scripts/generate-report-pdf.js
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

(async () => {
  const reportPath = path.join(__dirname, '..', 'cypress', 'reports', 'mochawesome', 'index.html');

  if (!fs.existsSync(reportPath)) {
    console.error('❌ Relatório HTML não encontrado. Rode "npx cypress run" primeiro.');
    process.exit(1);
  }

  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto(`file://${reportPath}`, { waitUntil: 'networkidle0' });

  const pdfPath = path.join(__dirname, '..', 'cypress', 'reports', 'mochawesome', 'report.pdf');
  await page.pdf({ path: pdfPath, format: 'A4', printBackground: true });

  await browser.close();
  console.log(`✅ PDF gerado em: ${pdfPath}`);
})();