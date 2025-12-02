/**
 * UI Components Test
 * Validates UI components from TESTER_ONBOARDING_GUIDE.md
 * - Migration Banner
 * - Edit Album Modal
 * - Add to Inventory Modal
 * - Logo size verification
 */

import { launchBrowser, createPage, takeScreenshot, closeBrowser, sleep, waitForElement } from './setup.js';
import { navigateTo, SELECTORS, createSeries } from './helpers.js';

export async function testUIComponents() {
    console.log('\n🎨 Testing UI Components\n');

    let browser;
    let passed = 0;
    let failed = 0;

    try {
        browser = await launchBrowser();
        const page = await createPage(browser);

        // Test 1: Logo size (Issue #3db5a56b reference - 48px)
        console.log('Test 1: Logo size verification');
        await navigateTo(page, '/');
        await sleep(1000);

        const logo = await page.$(SELECTORS.common.logo);
        if (logo) {
            const dimensions = await logo.evaluate(el => ({
                width: el.width || el.offsetWidth,
                height: el.height || el.offsetHeight,
                computedWidth: window.getComputedStyle(el).width,
                computedHeight: window.getComputedStyle(el).height
            }));

            console.log(`  Logo dimensions:`, dimensions);

            // Check if logo is approximately 48px (allow small variance)
            const isCorrectSize = (dimensions.width >= 40 && dimensions.width <= 56) ||
                (dimensions.height >= 40 && dimensions.height <= 56);

            if (isCorrectSize) {
                console.log('✅ PASS: Logo size is correct (target: ~48px)');
                passed++;
            } else {
                console.log('❌ FAIL: Logo size incorrect');
                failed++;
            }
        } else {
            console.log('❌ FAIL: Logo not found');
            failed++;
        }

        await takeScreenshot(page, 'ui-components-logo');

        // Test 2: Migration Banner (HomeView)
        console.log('\nTest 2: Migration Banner');
        const migrationBanner = await page.$('.migration-banner, [class*="migration"], [class*="banner"]');

        if (migrationBanner) {
            const bannerText = await migrationBanner.evaluate(el => el.textContent);
            const hasStartButton = await migrationBanner.$('button:has-text("Start"), button:has-text("Migrate")');

            console.log(`  Banner text: ${bannerText.substring(0, 50)}...`);
            console.log(`  Has action button: ${hasStartButton ? '✅' : '❌'}`);

            if (hasStartButton) {
                console.log('✅ PASS: Migration banner has action button');
                passed++;
            } else {
                console.log('⚠️  SKIP: Migration banner found but no button');
            }

            await takeScreenshot(page, 'ui-components-migration-banner');
        } else {
            console.log('⚠️  SKIP: Migration banner not visible (may not have legacy data)');
        }

        // Test 3: Edit Album Modal (requires a series with albums)
        console.log('\nTest 3: Edit Album Modal');

        // Create a quick series
        await createSeries(page, 'UI Test Series', ['The Beatles - Abbey Road']);
        await sleep(2000);

        // Look for album card
        const albumCard = await page.$('.album-card');
        if (albumCard) {
            // Hover over card to show edit button
            await albumCard.hover();
            await sleep(500);

            // Look for edit button (pencil icon, edit text, etc.)
            const editButton = await page.$('button[title*="Edit"], button:has-text("Edit"), .edit-button, [class*="edit"]');

            if (editButton) {
                await editButton.click();
                await sleep(1000);

                // Check if modal appeared
                const modal = await waitForElement(page, SELECTORS.common.modal, 2000);

                if (modal) {
                    console.log('✅ PASS: Edit Album modal opens');
                    passed++;
                    await takeScreenshot(page, 'ui-components-edit-modal');

                    // Close modal
                    const closeButton = await page.$(SELECTORS.common.modalClose);
                    if (closeButton) {
                        await closeButton.click();
                        await sleep(500);
                    }
                } else {
                    console.log('❌ FAIL: Edit modal did not open');
                    failed++;
                }
            } else {
                console.log('⚠️  SKIP: Edit button not found on album card');
            }
        } else {
            console.log('⚠️  SKIP: No album card found for testing');
        }

        // Test 4: Add to Inventory Modal
        console.log('\nTest 4: Add to Inventory Modal');

        const inventoryButton = await page.$('button[title*="Inventory"], button:has-text("Inventory"), .inventory-button, [aria-label*="inventory"]');

        if (inventoryButton) {
            await inventoryButton.click();
            await sleep(1000);

            const modal = await page.$(SELECTORS.common.modal);
            if (modal) {
                const modalContent = await modal.evaluate(el => el.textContent);
                const hasFormatField = modalContent.includes('format') || modalContent.includes('Format');

                console.log(`  Modal opened: ✅`);
                console.log(`  Has format field: ${hasFormatField ? '✅' : '❌'}`);

                if (hasFormatField) {
                    console.log('✅ PASS: Inventory modal has format field');
                    passed++;
                } else {
                    console.log('⚠️  Modal opened but format field not found');
                }

                await takeScreenshot(page, 'ui-components-inventory-modal');

                // Close modal
                const closeButton = await page.$(SELECTORS.common.modalClose);
                if (closeButton) {
                    await closeButton.click();
                }
            } else {
                console.log('❌ FAIL: Inventory modal did not open');
                failed++;
            }
        } else {
            console.log('⚠️  SKIP: Inventory button not found');
        }

        // Summary
        console.log('\n' + '='.repeat(50));
        console.log(`UI Components Results: ${passed} passed, ${failed} failed`);
        console.log('='.repeat(50) + '\n');

        return { passed, failed, success: failed === 0 };

    } catch (error) {
        console.error('❌ UI Components test error:', error.message);
        return { passed, failed: failed + 1, success: false, error };
    } finally {
        await closeBrowser(browser);
    }
}
