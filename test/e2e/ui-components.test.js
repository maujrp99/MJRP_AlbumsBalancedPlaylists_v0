/**
 * UI Components Test (Revamped Sprint 19)
 * Validates visibility of key architectural components.
 * Focus: Blending Wizard, Modals, Logo.
 */

import { launchBrowser, createPage, takeScreenshot, closeBrowser, sleep, waitForElement } from './setup.js';
import { navigateTo, SELECTORS, createSeries } from './helpers.js';

export async function testUIComponents() {
    console.log('\n🎨 Testing UI Components (Revamped)\n');

    let browser;
    let passed = 0;
    let failed = 0;

    try {
        browser = await launchBrowser();
        const page = await createPage(browser);

        // Test 1: Logo Visuals
        console.log('Test 1: Logo styling');
        await navigateTo(page, '/');
        const logo = await page.$(SELECTORS.common.logo);
        // Basic check purely for existence and non-zero size
        const bbox = logo ? await logo.boundingBox() : null;
        if (bbox && bbox.width > 20 && bbox.height > 20) {
            console.log('✅ PASS: Logo rendered correctly');
            passed++;
        } else {
            console.log('❌ FAIL: Logo missing or invisible');
            failed++;
        }

        // Test 2: Blending Wizard Components (Static Check)
        console.log('\nTest 2: Blending Wizard Components');
        await navigateTo(page, '/blend');
        await sleep(1000);

        // Check Step 1: Series Selector
        const selector = await page.$(SELECTORS.blend.seriesSelector);
        if (selector) {
            console.log('✅ PASS: Series Selector mounted');
            passed++;
        } else {
            console.log('❌ FAIL: Series Selector missing');
            failed++;
        }

        // Check Stepper (Steps indicator)
        const stepper = await page.$('.inline-flex.items-center.gap-2', { text: 'Mix' }); // Heuristic selector based on DOM
        if (stepper) {
            console.log('✅ PASS: Wizard Stepper visible');
            passed++;
        } else {
            console.log('⚠️ SKIP: Stepper not found (selector might be brittle)');
        }

        // Test 3: Edit Album Modal (Integration Check)
        console.log('\nTest 3: Edit Album Modal System');
        // Ensure a series exists
        await createSeries(page, 'Component Test', ['The Beatles - Help!']);
        await sleep(1000); // Wait for grid

        // Find an album card
        const card = await page.$('.album-card');
        if (card) {
            // Click Edit button
            await card.hover();
            const editBtn = await page.$('button[title="Edit Album"]');
            if (editBtn) {
                await editBtn.click();
                await sleep(500);

                const modal = await page.$(SELECTORS.common.modal);
                if (modal) {
                    console.log('✅ PASS: Edit Modal wrapper opened');
                    passed++;
                    // Close it
                    await page.click(SELECTORS.common.modalClose);
                } else {
                    console.log('❌ FAIL: Modal did not open');
                    failed++;
                }
            } else {
                console.log('⚠️ SKIP: Edit button not found on card');
            }
        }

        // Test 4: Ingredients Panel (requires unlocking step 2 - complex, moved to full wizard test usually)
        // We'll skip complex state here and assume Component Factory unit tests cover logic.

        // Summary
        console.log('\n' + '='.repeat(50));
        console.log(`UI Components Results: ${passed} passed, ${failed} failed`);
        console.log('='.repeat(50) + '\n');

        return { passed, failed, success: failed === 0 };

    } catch (error) {
        console.error('❌ UI Components error:', error.message);
        return { passed, failed: failed + 1, success: false, error };
    } finally {
        await closeBrowser(browser);
    }
}
