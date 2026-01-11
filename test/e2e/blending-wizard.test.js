/**
 * Blending Wizard E2E Test (Golden Path)
 * Verifies the full user flow: Series Selection -> Recipe -> Config -> Generate.
 */

import { launchBrowser, createPage, closeBrowser, sleep, waitForElement } from './setup.js';
import { navigateTo, SELECTORS, createSeries } from './helpers.js';

export async function runBlendingWizardTest() {
    console.log('\n🧙 Running Blending Wizard Golden Path...\n');

    let browser;
    let passed = 0;
    let failed = 0;

    try {
        browser = await launchBrowser();
        const page = await createPage(browser);

        // Setup: We need a Series to blend
        await createSeries(page, 'Wizard Test Series', ['Daft Punk - Discovery', 'Daft Punk - Homework']);

        // 1. Navigate to Blend
        await navigateTo(page, '/blend');
        await sleep(1000);

        // 2. Select Series (Step 1)
        console.log('Step 1: Select Series');
        // Find the card for "Wizard Test Series"
        // Note: The SeriesSelector renders cards. We look for the text.
        try {
            const seriesCard = await page.waitForXPath('//div[contains(@class, "blend-series-card")][.//h3[contains(text(), "Wizard Test Series")]]', { timeout: 5000 });
            await seriesCard.click();
            console.log('✅ PASS: Series selected');
            passed++;
        } catch (e) {
            console.log('❌ FAIL: Could not find/click Series Card');
            failed++;
            throw e;
        }

        await sleep(1000); // Wait for Step 2 unlock

        // 3. Select Recipe (Step 2)
        console.log('Step 2: Select Recipe (Balanced Cascade)');
        // Click the first recommended recipe or specific one
        try {
            await page.click('.blend-recipe-card'); // Clicking first available One
            console.log('✅ PASS: Recipe selected');
            passed++;
        } catch (e) {
            console.log('❌ FAIL: Could not click Recipe Card');
            failed++;
            throw e;
        }

        await sleep(1000); // Wait for Step 3 unlock

        // 4. Configure Ingredients (Step 3)
        console.log('Step 3: Check Ingredients Panel');
        const panel = await page.$(SELECTORS.blend.ingredientsPanel);
        if (panel) {
            console.log('✅ PASS: Ingredients Panel visible');
            passed++;
        } else {
            console.log('❌ FAIL: Ingredients Panel not visible');
            failed++;
        }

        // 5. Generate (Step 4)
        console.log('Step 4: Generate Playlists');
        const generateBtn = await page.$(SELECTORS.blend.generateButton);
        const prohibited = await generateBtn.evaluate(el => el.disabled);

        if (!prohibited) {
            await generateBtn.click();
            console.log('✅ PASS: Clicked Generate');
            passed++;
        } else {
            console.log('❌ FAIL: Generate button is disabled');
            failed++;
        }

        // 6. Verify Result Navigation
        console.log('Step 5: Verify Redirection');
        try {
            await page.waitForNavigation({ timeout: 10000 }); // Should go to /playlists
            const url = page.url();
            if (url.includes('/playlists')) {
                console.log('✅ PASS: Redirected to Playlists view');
                passed++;
            } else {
                console.log(`❌ FAIL: URL remained ${url}`);
                failed++;
            }
        } catch (e) {
            // Sometimes navigation is fast/handled differently, check URL check
            if (page.url().includes('/playlists')) {
                console.log('✅ PASS: Redirected to Playlists view (caught)');
                passed++;
            } else {
                console.log('❌ FAIL: Navigation timeout/failure');
                failed++;
            }
        }

        // Summary
        console.log('\n' + '='.repeat(50));
        console.log(`Wizard Test Results: ${passed} passed, ${failed} failed`);
        console.log('='.repeat(50) + '\n');

        return { passed, failed, success: failed === 0 };

    } catch (error) {
        console.error('❌ Wizard test error:', error.message);
        return { passed, failed: failed + 1, success: false, error };
    } finally {
        await closeBrowser(browser);
    }
}
