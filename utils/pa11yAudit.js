import path from "path";
import fs from "fs";

import pa11y from "pa11y";
import htmlReporter from "pa11y/lib/reporters/html.js";

const PA11Y_JSON_PATH = 'pa11y.json';
const PA11Y_HTML_PATH = 'pa11y.html';

/**
 * Audits a website using the Pa11y accessibility testing tool.
 * 
 * @param {string} url The URL to audit
 * @param {string} outFolder The folder where to save the audit results
 * 
 * @returns {Promise<{
 *   errorsCount: number,
 *   reportPaths: { pa11yJsonPath: string, pa11yHtmlPath: string }
 * }>} An object with the errors found by the validator.
 */
export async function auditPa11y(url, outFolder) {
    console.log('\n✅ [Pa11y] Auditando con pa11y...');

    // Generate Pa11y report
    const results = await pa11y(url);
    const html = await htmlReporter.results(results);

    console.log(results.issues.length);
    
    // Save reports to file
    const pa11yJsonPath = path.join(outFolder, PA11Y_JSON_PATH);
    const pa11yHtmlPath = path.join(outFolder, PA11Y_HTML_PATH);

    fs.writeFileSync(pa11yJsonPath, JSON.stringify(results, null, 2));
    fs.writeFileSync(pa11yHtmlPath, html);

    console.log(`✅ [Pa11y] Reporte generado: ${pa11yJsonPath}`);
    console.log(`✅ [Pa11y] Reporte HTML generado: ${pa11yHtmlPath}`);

    return {
        errorsCount: results.issues.length,
        reportPaths: {
            pa11yJsonPath: path.basename(pa11yJsonPath),
            pa11yHtmlPath: path.basename(pa11yHtmlPath),
        }
    }
}