/**
 * Issue #16 Test: View Mode Toggle
 */

import { launchBrowser, createPage, takeScreenshot, closeBrowser } from './setup.js';
import { navigateTo, SELECTORS, getAlbumCount } from './helpers.js';

export async function testViewToggle() {
    console.log('\n👁️  Testing Issue #16: View Mode Toggle\n');

    let browser;
    let passed = 0;
    let failed = 0;

    try {
        browser = await launchBrowser();
        const page = await createPage(browser);

        console.log('Step 1: Navigate to Albums page');
        await navigateTo(page, '/albums');
        await page.waitForTimeout(2000);

        const initialGrid = await page.$('#albumsGrid');
        const initialMode = initialGrid ? 'grid' : 'list';
        console.log(`  Initial view mode: ${initialMode}`);

        const initialCount = await getAlbumCount(page);
        console.log(`  Album count: ${initialCount}`);
        await takeScreenshot(page, 'issue-16-initial');

        console.log('\nStep 2: Click View Toggle button');
        const toggleButton = await page.$(SELECTORS.albums.viewToggle);
        if (!toggleButton) {
            console.log('❌ FAIL: View toggle button not found');
            failed++;
            return { passed, failed, success: false };
        }

        await toggleButton.click();
        await page.waitForTimeout(1500);

        const afterGrid = await page.$('#albumsGrid');
        const afterMode = afterGrid ? 'grid' : 'list';

        console.log('\n✓ Verification 1: View mode changed');
        if (afterMode !== initialMode) {
            console.log(`✅ PASS: View changed from ${initialMode} to ${afterMode}`);
            passed++;
        } else {
            console.log(`❌ FAIL: View did not change (still ${initialMode})`);
            failed++;
        }

        await takeScreenshot(page, 'issue-16-toggled');

        console.log('\n✓ Verification 2: No duplicate albums');
        const afterCount = await getAlbumCount(page);
        if (afterCount === initialCount) {
            console.log(`✅ PASS: Album count unchanged (${afterCount})`);
            passed++;
        } else {
            console.log(`❌ FAIL: Album count changed (${initialCount} → ${afterCount})`);
            failed++;
        }

        console.log('\n' + '='.repeat(50));
        console.log(`Issue #16 Results: ${passed} passed, ${failed} failed`);
        console.log('='.repeat(50) + '\n');

        return { passed, failed, success: failed === 0 };

    } catch (error) {
        console.error('❌ View Toggle test error:', error.message);
        return { passed, failed: failed + 1, success: false, error };
    } finally {
        await closeBrowser(browser);
    }
}
