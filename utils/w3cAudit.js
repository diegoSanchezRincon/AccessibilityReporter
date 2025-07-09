import axios from 'axios';

/**
 * Audits a website using the W3C validator.
 * 
 * @param {string} url The URL to audit
 * 
 * @returns {Promise<{
 *   errorsCount: number,
 *   errorsOutput: string
 * }>} An object with the errors found by the validator.
 */
export async function auditW3c(url) {
    console.log('\n🧪 [W3C] Validando HTML con W3C...');

    const w3cRes = await axios.get('https://validator.w3.org/nu/', {
        params: { doc: url, out: 'json' },
        headers: { 'User-Agent': 'Mozilla/5.0' }
    });

    const w3cErrors = w3cRes.data.messages.filter(msg => msg.type === 'error');

    return {
        errorsCount: w3cErrors.length,
        errorsOutput: parseW3cErrors(w3cErrors),
    };
}

function parseW3cErrors(w3cErrors) {
    if (w3cErrors.length === 0) return '';
    
    w3cErrors.map(e => {
        // Format the line and column
        let lineColumn = `**Línea:** ${e.lastLine}`;
        if (e.firstColumn && e.lastColumn) {
            lineColumn += `, **Columna:** ${e.firstColumn}-${e.lastColumn}`;
        } else if (e.lastColumn) {
            lineColumn += `, **Columna:** ${e.lastColumn}`;
        }

        // Code block with the full extract
        let extractBlock = '';
        if (e.extract) extractBlock = `\n\`\`\`html\n${e.extract}\n\`\`\``;

        // Highlighted code block
        let hiliteBlock = '';
        if (typeof e.hiliteStart === 'number' && typeof e.hiliteLength === 'number' && e.extract) {
            const before = e.extract.substring(0, e.hiliteStart);
            const highlight = e.extract.substring(e.hiliteStart, e.hiliteStart + e.hiliteLength);
            const after = e.extract.substring(e.hiliteStart + e.hiliteLength);
            hiliteBlock = `\n**Fragmento destacado:**\n\`\`\`html\n${before}<mark>${highlight}</mark>${after}\n\`\`\``;
        }

        return `
---
${lineColumn}
**Mensaje:** ${e.message}
${extractBlock}
${hiliteBlock}
`.trim();
    }).join('\n\n')
}