import puppeteer from 'puppeteer';

import { parse } from 'node-html-parser';

/**
 * Generates a map of headings from a website.
 * 
 * @param {string} url The URL to audit
 * 
 * @returns {Promise<{
 *   headingMap: Array<{ level: string, text: string }>
 * }>} An object with the headings map.
 */
export async function generateHeadingsMap(url) {
    console.log('🧱 [HeadingsMap] Generando mapa de encabezados...');

    // Initial setup
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle0' });
    await page.addScriptTag({
        url: 'https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.8.2/axe.min.js',
    });

    const htmlContent = await page.content();
    const root = parse(htmlContent);
    const headingMap = [];
    for (let i = 1; i <= 6; i++) {
        root.querySelectorAll(`h${i}`).forEach(el => {
            headingMap.push({ level: `h${i}`, text: el.text.trim() });
        });
    }

    // Close browser
    await browser.close();

    return {
        headingMap,
    }
}