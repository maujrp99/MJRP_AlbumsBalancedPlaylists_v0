/**
 * Issue #15 Test: Ghost Albums
 */

import { launchBrowser, createPage, takeScreenshot, closeBrowser, sleep } from './setup.js';
import { navigateTo, createSeries, getAlbumCount, getAlbumTitles } from './helpers.js';

export async function testGhostAlbums() {
    console.log('\n👻 Testing Issue #15: Ghost Albums\n');

    let browser;
    let passed = 0;
    let failed = 0;

    try {
        browser = await launchBrowser();
        const page = await createPage(browser);

        const seriesA = {
            name: 'Test Series A',
            albums: ['Pink Floyd - The Wall', 'Led Zeppelin - IV', 'The Beatles - Abbey Road']
        };

        const seriesB = {
            name: 'Test Series B',
            albums: ['Radiohead - OK Computer', 'Nirvana - Nevermind', 'The Smiths - The Queen Is Dead']
        };

        console.log('Step 1: Create Series A');
        await createSeries(page, seriesA.name, seriesA.albums);
        await sleep(3000);

        const countA = await getAlbumCount(page);
        const titlesA = await getAlbumTitles(page);
        console.log(`  Series A loaded: ${countA} albums`);
        console.log(`  Titles:`, titlesA);
        await takeScreenshot(page, 'issue-15-series-a');

        console.log('\nStep 2: Navigate to Home');
        await navigateTo(page, '/');
        await page.waitForTimeout(1000);

        console.log('\nStep 3: Create Series B');
        await createSeries(page, seriesB.name, seriesB.albums);
        await sleep(3000);

        const countB = await getAlbumCount(page);
        const titlesB = await getAlbumTitles(page);
        console.log(`  Series B loaded: ${countB} albums`);
        console.log(`  Titles:`, titlesB);
        await takeScreenshot(page, 'issue-15-series-b');

        console.log('\n✓ Verification 1: Album count');
        if (countB === seriesB.albums.length) {
            console.log(`✅ PASS: Count matches (${countB})`);
            passed++;
        } else {
            console.log(`❌ FAIL: Expected ${seriesB.albums.length}, got ${countB}`);
            failed++;
        }

        console.log('\n✓ Verification 2: No ghost albums from Series A');
        const hasGhosts = titlesA.some(titleA =>
            titlesB.some(titleB => titleB.includes(titleA) || titleA.includes(titleB))
        );

        if (!hasGhosts) {
            console.log('✅ PASS: No ghost albums detected');
            passed++;
        } else {
            console.log('❌ FAIL: Ghost albums from Series A found!');
            failed++;
        }

        console.log('\n' + '='.repeat(50));
        console.log(`Issue #15 Results: ${passed} passed, ${failed} failed`);
        console.log('='.repeat(50) + '\n');

        return { passed, failed, success: failed === 0 };

    } catch (error) {
        console.error('❌ Ghost Albums test error:', error.message);
        return { passed, failed: failed + 1, success: false, error };
    } finally {
        await closeBrowser(browser);
    }
}
