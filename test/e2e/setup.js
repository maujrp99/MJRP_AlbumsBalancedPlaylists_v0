/**
 * Puppeteer E2E Test Setup
 * Base utilities for launching browser and managing test lifecycle
 */

import puppeteer from 'puppeteer';

/**
 * Launch browser with optimal settings for testing
 * @param {object} options - Browser launch options
 * @returns {Promise<Browser>} Puppeteer browser instance
 */
export async function launchBrowser(options = {}) {
    const headless = process.env.HEADLESS !== 'false';
    const slowMo = process.env.SLOW_MO ? parseInt(process.env.SLOW_MO) : 0;

    return await puppeteer.launch({
        headless,
        slowMo,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
        ],
        ...options
    });
}

/**
 * Create a new page with common configuration
 * @param {Browser} browser - Puppeteer browser instance
 * @param {object} options - Page options
 * @returns {Promise<Page>} Configured page
 */
export async function createPage(browser, options = {}) {
    const page = await browser.newPage();

    // Set viewport (default desktop)
    await page.setViewport({
        width: options.width || 1920,
        height: options.height || 1080,
        deviceScaleFactor: options.deviceScaleFactor || 1
    });

    // Enable console logging from browser
    page.on('console', msg => {
        const type = msg.type();
        if (type === 'error' || type === 'warning') {
            console.log(`[Browser ${type}]:`, msg.text());
        }
    });

    // Log page errors
    page.on('pageerror', error => {
        console.error('[Page Error]:', error.message);
    });

    return page;
}

/**
 * Take screenshot and save to screenshots directory
 * @param {Page} page - Puppeteer page
 * @param {string} name - Screenshot name (without extension)
 */
export async function takeScreenshot(page, name) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `test/e2e/screenshots/${name}-${timestamp}.png`;

    await page.screenshot({
        path: filename,
        fullPage: true
    });

    console.log(`📸 Screenshot saved: ${filename}`);
    return filename;
}

/**
 * Wait for navigation to complete
 * @param {Page} page - Puppeteer page
 * @param {Function} action - Action that triggers navigation
 */
export async function waitForNavigation(page, action) {
    await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle0' }),
        action()
    ]);
}

/**
 * Wait for element to be visible
 * @param {Page} page - Puppeteer page
 * @param {string} selector - CSS selector
 * @param {number} timeout - Timeout in ms (default 5000)
 */
export async function waitForElement(page, selector, timeout = 5000) {
    try {
        await page.waitForSelector(selector, {
            visible: true,
            timeout
        });
        return true;
    } catch (error) {
        console.error(`❌ Element not found: ${selector}`);
        return false;
    }
}

/**
 * Clean up: close browser
 * @param {Browser} browser - Puppeteer browser instance
 */
export async function closeBrowser(browser) {
    if (browser) {
        await browser.close();
    }
}

/**
 * Sleep/delay utility (replacement for deprecated page.waitForTimeout)
 * @param {number} ms - Milliseconds to wait
 */
export async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
