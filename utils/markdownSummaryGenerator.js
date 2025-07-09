import fs from 'fs';
import path from 'path';

const SUMMARY_FILE_NAME = 'resumen.md';

/**
 * Generates a summary in Markdown from the audit results.
 *
 * @param {Object} params
 * @param {string} params.url
 * @param {string} params.outFolder
 * @param {Object} params.lighthouseResult
 * @param {Object} params.axeResult
 * @param {Object} params.w3cResult
 * @param {Object} params.headingsResult
 */
export function generateMarkdownSummary({ url, outFolder, lighthouseResult, axeResult, w3cResult, headingsResult }) {
    console.log('📋 [MarkdownSummary] Generando resumen...');

    const markdown = `# 📋 Auditoría Web - ${url}

**Fecha:** ${new Date().toLocaleString()}

## 📊 Lighthouse
- Accesibilidad Desktop: **${lighthouseResult.scores.lighthouseDesktopScore}**
- Informe completo: [Abrir](./${lighthouseResult.reportPaths.lighthouseDesktopPath})

- Accesibilidad Mobile: **${lighthouseResult.scores.lighthouseMobileScore}**
- Informe completo: [Abrir](./${lighthouseResult.reportPaths.lighthouseMobilePath})

## ✅ axe-core
- Violaciones encontradas: **${axeResult.foundViolations}**
- Informe JSON: [Ver](./${axeResult.reportPaths.axePath})
- Informe detallado (Markdown): [Ver](./${axeResult.reportPaths.violationsMdPath})

## 🧪 Validación W3C
- Errores HTML: **${w3cResult.errorsCount}**

${w3cResult.errorsOutput}

## 🧱 Headings Map
${headingsResult.headingMap.map(h => `- ${h.level}: ${h.text}`).join('\n')}

---

*Generado automáticamente*
`;

    // Write the summary to a file
    const mdPath = path.join(outFolder, SUMMARY_FILE_NAME);
    fs.writeFileSync(mdPath, markdown);
    console.log(`✅ [MarkdownSummary] Resumen generado en ${mdPath}\n\n`);
}