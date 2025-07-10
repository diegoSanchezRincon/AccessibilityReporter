import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';


const AXE_FILE_NAME = 'axe.json';
const AXE_REPORT_FILE_NAME = 'reporte-violaciones.md';

/**
 * Audits a website using axe-core.
 * 
 * @param {string} url The URL to audit
 * @param {string} outFolder The folder where to save the audit results
 * 
 * @returns {Promise<{
 *   foundViolations: number,
 *   reportPaths: { axePath: string, violationsMdPath: string }
 * }>} An object with the number of violations found and the paths to the reports.
 */
export async function auditAxeCore(url, outFolder) {
    console.log('\n✅ [AxeCore] Auditando con axe-core...');

    // Initial setup
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle0' });
    await page.addScriptTag({
        url: 'https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.8.2/axe.min.js',
    });

    // Run axe-core
    const axeResults = await page.evaluate(async () => await axe.run());
    const axePath = path.join(outFolder, AXE_FILE_NAME);
    fs.writeFileSync(axePath, JSON.stringify(axeResults, null, 2));

    // Generate a readable Markdown report with violations
    console.log('📋 [AxeCore] Generando reporte de violaciones...');
    const { md, count } = parseAxeResults(axeResults);

    // Write report to file
    const violationsMdPath = path.join(outFolder, AXE_REPORT_FILE_NAME);
    fs.writeFileSync(violationsMdPath, md);
    console.log(`✅ [AxeCore] Reporte de violaciones generado: ${violationsMdPath}`);

    // Close browser
    await browser.close();

    return {
        foundViolations: count,
        reportPaths: {
            axePath: path.basename(axePath),
            violationsMdPath: path.basename(violationsMdPath),
        },
    };
}

/**
 * Parses the axe-core results and generates a Markdown report.
 * 
 * @param {Object} axeResults The axe-core results
 * @returns {{
 *   md: string,
 *   count: number
 * }} The Markdown report and the number of violations found.
 */
function parseAxeResults(axeResults) {
    const violations = axeResults.violations;
    let count = 0;

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
                count++;
            });
            violationsMd += `\n`;
        });
        violationsMd += `---\n\n`;
    });

    return {
        md: violationsMd,
        count: count,
    };
}