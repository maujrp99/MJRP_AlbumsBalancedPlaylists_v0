/**
 * Smoke Test - Basic App Functionality (Revamped Sprint 19)
 * Verifies that the application loads and all core routes are accessible.
 */

import { launchBrowser, createPage, closeBrowser, waitForElement, sleep } from './setup.js';
import { navigateTo, SELECTORS } from './helpers.js';

export async function runSmokeTest() {
    console.log('\n🔥 Running Smoke Test (Revamped)...\n');

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
            console.log('✅ PASS: Page title active');
            passed++;
        } else {
            console.log('❌ FAIL: Title mismatch:', title);
            failed++;
        }

        // Test 2: Core Layout
        console.log('\nTest 2: Core Layout (Header/Nav)');
        const nav = await waitForElement(page, 'nav', 3000);
        if (nav) {
            console.log('✅ PASS: Navigation bar present');
            passed++;
        } else {
            console.log('❌ FAIL: Navigation bar missing');
            failed++;
        }

        // Test 3: Route Availability
        console.log('\nTest 3: Route Availability');
        const routes = [
            { name: 'Home', selector: SELECTORS.nav.home, expected: '/' },
            { name: 'Albums', selector: SELECTORS.nav.albums, expected: '/albums' },
            { name: 'Blend', selector: SELECTORS.nav.blend, expected: '/blend' },
            { name: 'Playlists', selector: SELECTORS.nav.playlists, expected: '/playlists' },
            { name: 'Inventory', selector: SELECTORS.nav.inventory, expected: '/inventory' }
        ];

        for (const route of routes) {
            try {
                // Click nav link
                await page.click(route.selector);
                await sleep(500); // Animation allowance

                const url = page.url();
                if (url.includes(route.expected) || (route.name === 'Albums' && url.includes('/home'))) {
                    console.log(`  ✅ ${route.name}: OK`);
                    passed++;
                } else {
                    console.log(`  ❌ ${route.name}: Redirected to ${url}`);
                    failed++;
                }
            } catch (err) {
                console.log(`  ❌ ${route.name}: Click failed (${err.message})`);
                failed++;
            }
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
