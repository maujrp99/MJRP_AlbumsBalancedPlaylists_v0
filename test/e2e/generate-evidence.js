/**
 * Quick Evidence Generator
 * Generates screenshots and demonstration for testing evidence
 */

import puppeteer from 'puppeteer';

const BASE_URL = 'http://localhost:5000';  // Dev server

async function generateEvidence() {
    console.log('\n📸 Generating Test Evidence...\n');

    const browser = await puppeteer.launch({
        headless: false,
        slowMo: 200,
        defaultViewport: { width: 1920, height: 1080 }
    });

    const page = await browser.newPage();

    try {
        // 1. Homepage
        console.log('✓ Capturing HomePage...');
        await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle0' });
        await new Promise(r => setTimeout(r, 2000));
        await page.screenshot({
            path: 'test/e2e/screenshots/evidence-01-homepage.png',
            fullPage: true
        });

        // 2. Navigate to Albums
        console.log('✓ Navigating to Albums...');
        const albumsLink = await page.$('a[href="/albums"]');
        if (albumsLink) {
            await albumsLink.click();
            await new Promise(r => setTimeout(r, 2000));
            await page.screenshot({
                path: 'test/e2e/screenshots/evidence-02-albums-page.png',
                fullPage: true
            });
        }

        // 3. Navigate to Playlists
        console.log('✓ Navigating to Playlists...');
        await page.goto(`${BASE_URL}/playlists`, { waitUntil: 'networkidle0' });
        await new Promise(r => setTimeout(r, 2000));
        await page.screenshot({
            path: 'test/e2e/screenshots/evidence-03-playlists-page.png',
            fullPage: true
        });

        // 4. Back to home for UI elements
        console.log('✓ Capturing UI Elements...');
        await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle0' });
        await new Promise(r => setTimeout(r, 1000));

        // Take screenshot of header area
        const header = await page.$('header');
        if (header) {
            await header.screenshot({
                path: 'test/e2e/screenshots/evidence-04-header-ui.png'
            });
        }

        console.log('\n✅ Evidence generated successfully!');
        console.log('   Screenshots saved in test/e2e/screenshots/\n');

        // Wait before closing
        await new Promise(r => setTimeout(r, 3000));

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await browser.close();
    }
}

generateEvidence();
