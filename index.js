import fs from 'fs';
import path from 'path';
import axios from 'axios';
import puppeteer from 'puppeteer';
import lighthouse from 'lighthouse';

import { fileURLToPath } from 'url';
import { parse } from 'node-html-parser';
import { launch } from 'chrome-launcher';

const url = 'http://localhost:3000';

// Get the current directory of the script
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create results folder if it doesn't exist
const resultsDir = path.join(__dirname, 'results');
if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir);

(async () => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

    // Create audit folder if it doesn't exist
    const outFolder = path.join(resultsDir, timestamp);
    if (!fs.existsSync(outFolder)) fs.mkdirSync(outFolder);

    // Launch Chrome for Lighthouse
    const chrome = await launch({ chromeFlags: ['--headless'] });
    const options = {
        port: chrome.port,
        output: 'html',
    };

    // [1] - Lighthouse Desktop >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
    console.log('📊 Auditando Desktop...');

    const desktopResult = await lighthouse(url, {...options, emulatedFormFactor: "desktop"});
    const lighthouseDesktopReport = desktopResult.report;

    const lighthouseDesktopPath = path.join(outFolder, `lighthouse-desktop.html`);
    fs.writeFileSync(lighthouseDesktopPath, lighthouseDesktopReport);

    const lighthouseDesktopScore = desktopResult.lhr.categories.accessibility.score * 100;

    // [2] - Lighthouse Mobile >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
    console.log('📊 Auditando Mobile...');

    const mobileResult = await lighthouse(url, {...options, emulatedFormFactor: "mobile"});
    const lighthouseMobileReport = mobileResult.report;

    const lighthouseMobilePath = path.join(outFolder, `lighthouse-mobile.html`);
    fs.writeFileSync(lighthouseMobilePath, lighthouseMobileReport);

    const lighthouseMobileScore = mobileResult.lhr.categories.accessibility.score * 100;

    // [3] - Puppeteer + axe-core >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
    console.log('✅ Auditando con axe-core...');

    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle0' });
    await page.addScriptTag({
        url: 'https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.8.2/axe.min.js',
    });

    const axeResults = await page.evaluate(async () => await axe.run());
    const axePath = path.join(outFolder, `axe.json`);
    fs.writeFileSync(axePath, JSON.stringify(axeResults, null, 2));

    // Generate a readable Markdown report with violations
    console.log('📋 Generando reporte de violaciones...');

    const violations = axeResults.violations;
    let violationsMd = `# Reporte de Violaciones de Accesibilidad (axe-core)\n\n`;
    violations.forEach((v, i) => {
        violationsMd += `## ${i + 1}. ${v.id} - ${v.help}\n`;
        violationsMd += `**Impacto:** ${v.impact}\n\n`;
        violationsMd += `\`${v.description}\`\n\n`;
        violationsMd += `### Más info\n[${v.helpUrl}](${v.helpUrl})\n\n`;
        v.nodes.forEach((node, j) => {
            violationsMd += `#### Elemento afectado ${j + 1}\n`;
            violationsMd += `- Selector: \`${node.target.join(', ')}\`\n`;
            violationsMd += `- HTML: \`${node.html}\`\n`;
            node.any.forEach((check) => {
                violationsMd += `- ❗ ${check.message} (${check.id})\n`;
            });
            violationsMd += `\n`;
        });
        violationsMd += `---\n\n`;
    });

    const violationsMdPath = path.join(outFolder, `reporte-violaciones.md`);
    fs.writeFileSync(violationsMdPath, violationsMd);
    console.log(`✅ Reporte de violaciones generado: ${violationsMdPath}`);

    // [4] - Validate HTML with W3C >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
    console.log('🧪 Validando HTML con W3C...');

    const w3cRes = await axios.get('https://validator.w3.org/nu/', {
        params: { doc: url, out: 'json' },
        headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    const w3cErrors = w3cRes.data.messages.filter(msg => msg.type === 'error');

    // [5] - Map of headings >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
    console.log('🧱 Generando mapa de encabezados...');

    const htmlContent = await page.content();
    const root = parse(htmlContent);
    const headingMap = [];
    for (let i = 1; i <= 6; i++) {
        root.querySelectorAll(`h${i}`).forEach(el => {
            headingMap.push({ level: `h${i}`, text: el.text.trim() });
        });
    }

    await browser.close();
    await chrome.kill();

    // [6] - Generate a summary in Markdown
    console.log('📋 Generando resumen...');
    
    const markdown = `# 📋 Auditoría Web - ${url}

**Fecha:** ${new Date().toLocaleString()}

## 📊 Lighthouse
- Accesibilidad Desktop: **${lighthouseDesktopScore}**
- Informe completo: [Abrir](./${path.basename(lighthouseDesktopPath)})

- Accesibilidad Mobile: **${lighthouseMobileScore}**
- Informe completo: [Abrir](./${path.basename(lighthouseMobilePath)})

## ✅ axe-core
- Violaciones encontradas: **${axeResults.violations.length}**
- Informe JSON: [Ver](./${path.basename(axePath)})
- Informe detallado (Markdown): [Ver](./${path.basename(violationsMdPath)})

## 🧪 Validación W3C
- Errores HTML: **${w3cErrors.length}**

## 🧱 Headings Map
${headingMap.map(h => `- ${h.level}: ${h.text}`).join('\n')}

---

*Generado automáticamente*
`;

    // [7] - Write summary to file
    const mdPath = path.join(outFolder, `resumen.md`);
    fs.writeFileSync(mdPath, markdown);
    console.log(`✅ Resumen generado: ${mdPath}`);
})();
