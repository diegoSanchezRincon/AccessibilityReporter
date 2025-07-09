import lighthouse from 'lighthouse';
import path from 'path';
import fs from 'fs';

import { launch } from 'chrome-launcher';

const LIGHTHOUSE_DESKTOP_FILE_NAME = 'lighthouse-desktop.html';
const LIGHTHOUSE_MOBILE_FILE_NAME = 'lighthouse-mobile.html';

/**
 * Audits a website using Lighthouse.
 * 
 * @param {string} url The URL to audit
 * @param {string} outFolder The folder where to save the audit results
 * 
 * @returns {Promise<{ 
 *   scores: { lighthouseDesktopScore: number, lighthouseMobileScore: number },
 *   reportPaths: { lighthouseDesktopPath: string, lighthouseMobilePath: string }
 * }>} An object with the accessibility scores for desktop and mobile and the paths to the reports.
 */
export async function auditLighthouse(url, outFolder) {
    // Launch Chrome for Lighthouse
    const chrome = await launch({ chromeFlags: ['--headless'] });
    const options = { port: chrome.port, output: 'html' };

    console.log();

    // Lighthouse Desktop >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
    console.log('📊 [Lighthouse] Auditando Desktop...');

    const desktopResult = await lighthouse(url, {...options, emulatedFormFactor: "desktop"});
    const lighthouseDesktopReport = desktopResult.report;

    const lighthouseDesktopPath = path.join(outFolder, LIGHTHOUSE_DESKTOP_FILE_NAME);
    fs.writeFileSync(lighthouseDesktopPath, lighthouseDesktopReport);

    const lighthouseDesktopScore = desktopResult.lhr.categories.accessibility.score * 100;

    // Lighthouse Mobile >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
    console.log('📊 [Lighthouse] Auditando Mobile...');

    const mobileResult = await lighthouse(url, {...options, emulatedFormFactor: "mobile"});
    const lighthouseMobileReport = mobileResult.report;

    const lighthouseMobilePath = path.join(outFolder, LIGHTHOUSE_MOBILE_FILE_NAME);
    fs.writeFileSync(lighthouseMobilePath, lighthouseMobileReport);

    const lighthouseMobileScore = mobileResult.lhr.categories.accessibility.score * 100;

    // Kill Chrome
    chrome.kill();

    return {
        scores: { lighthouseDesktopScore, lighthouseMobileScore },
        reportPaths: { 
            lighthouseDesktopPath: path.basename(lighthouseDesktopPath),
            lighthouseMobilePath: path.basename(lighthouseMobilePath),
        },
    };
}