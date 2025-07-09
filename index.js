import fs from 'fs';
import path from 'path';

import { fileURLToPath } from 'url';

import { auditLighthouse } from './utils/lighthouseAudit.js';
import { auditAxeCore } from './utils/axeCoreAudit.js';
import { auditW3c } from './utils/w3cAudit.js';
import { generateHeadingsMap } from './utils/headingsMapGenerator.js';
import { generateMarkdownSummary } from './utils/markdownSummaryGenerator.js';
import { auditPa11y } from './utils/pa11yAudit.js';

const RESULTS_DIR_NAME = 'results';

async function runAudits() {
    const url = process.argv[2] || 'http://localhost:3000';

    if (!url.startsWith('http')) {
        console.error('❌ [ERROR] Por favor, proporciona una URL válida (ej: http://localhost:3000)');
        process.exit(1);
    }

    // Get the current directory of the script
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);

    // Create results folder if it doesn't exist
    const resultsDir = path.join(__dirname, RESULTS_DIR_NAME);
    if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir);

    // Generate folder filename based on URL and timestamp
    const cleanUrl = url.replace(/^https?:\/\//, '').replace(/[^\w.-]/g, '_');
    const timestamp = new Date().toISOString().slice(0,19).replace(/[:T]/g, '-');
    const folderName = `${cleanUrl}_${timestamp}`;

    // Create audit folder if it doesn't exist
    const outFolder = path.join(resultsDir, folderName);
    if (!fs.existsSync(outFolder)) fs.mkdirSync(outFolder);

    // Run audits
    const lighthouseResult = await auditLighthouse(url, outFolder);
    const axeResult = await auditAxeCore(url, outFolder);
    const pa11yResult = await auditPa11y(url, outFolder);
    const w3cResult = await auditW3c(url);
    const headingsResult = await generateHeadingsMap(url);

    generateMarkdownSummary({
        url,
        outFolder,
        lighthouseResult,
        axeResult,
        pa11yResult,
        w3cResult,
        headingsResult
    });
}

// Run audits
(async () => await runAudits())();