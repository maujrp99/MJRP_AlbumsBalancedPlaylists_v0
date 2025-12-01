/**
 * Smoke Test - Basic App Functionality
 * Verifies that the application loads and core elements are present
 */

import { launchBrowser, createPage, takeScreenshot, closeBrowser, waitForElement } from './setup.js';
import { navigateTo, SELECTORS } from './helpers.js';

export async function runSmokeTest() {
    console.log('\n🔥 Running Smoke Test...\n');

    let browser;
    let passed = 0;
    let failed = 0;

    try {
        browser = await launchBrowser();
        const page = await createPage(browser);

        // Test 1: App loads
        console.log('Test 1: App loads at base URL');
        await navigateTo(page, '/');
        const title = await page.title();
        if (title.includes('MJRP') || title.includes('Playlist')) {
            console.log('✅ PASS: Page title correct:', title);
            passed++;
        } else {
            console.log('❌ FAIL: Expected title with MJRP or Playlist, got:', title);
            failed++;
        }

        // Test 2: Header exists
        console.log('\nTest 2: Header exists');
        const headerExists = await waitForElement(page, SELECTORS.common.header, 3000);
        if (headerExists) {
            console.log('✅ PASS: Header rendered');
            passed++;
        } else {
            console.log('❌ FAIL: Header not found');
            failed++;
        }

        // Test 3: Logo exists
        console.log('\nTest 3: Logo exists');
        const logo = await page.$(SELECTORS.common.logo);
        if (logo) {
            const dimensions = await logo.evaluate(el => ({
                width: el.width || el.offsetWidth,
                height: el.height || el.offsetHeight
            }));
            console.log('✅ PASS: Logo found with dimensions:', dimensions);
            passed++;
        } else {
            console.log('❌ FAIL: Logo not found');
            failed++;
        }

        // Test 4: Navigation links exist
        console.log('\nTest 4: Navigation links');
        const navHome = await page.$(SELECTORS.nav.home);
        const navAlbums = await page.$(SELECTORS.nav.albums);
        if (navHome && navAlbums) {
            console.log('✅ PASS: Navigation links present');
            passed++;
        } else {
            console.log('❌ FAIL: Navigation links missing');
            failed++;
        }

        // Test 5: Navigate to Albums page
        console.log('\nTest 5: Navigate to Albums page');
        await page.click(SELECTORS.nav.albums);
        await page.waitForTimeout(2000);
        const url = page.url();
        if (url.includes('/albums')) {
            console.log('✅ PASS: Navigated to Albums page');
            passed++;
        } else {
            console.log('❌ FAIL: URL incorrect:', url);
            failed++;
        }

        // Summary
        console.log('\n' + '='.repeat(50));
        console.log(`Smoke Test Results: ${passed} passed, ${failed} failed`);
        console.log('='.repeat(50) + '\n');

        return { passed, failed, success: failed === 0 };

    } catch (error) {
        console.error('❌ Smoke test error:', error.message);
        return { passed, failed: failed + 1, success: false, error };
    } finally {
        await closeBrowser(browser);
    }
}
