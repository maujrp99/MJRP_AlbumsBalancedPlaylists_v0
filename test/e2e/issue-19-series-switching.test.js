/**
 * Issue #19 Test: Wrong Series Display (Series with Same Album Count)
 * Reproduces scenario from TESTER_ONBOARDING_GUIDE.md and DEBUG_LOG.md
 * 
 * Scenario: When switching between series that have the SAME number of albums,
 * the app should still load the correct series (not assume "already loaded").
 */

import { launchBrowser, createPage, takeScreenshot, closeBrowser, sleep } from './setup.js';
import { navigateTo, createSeries, getAlbumCount, getAlbumTitles } from './helpers.js';

export async function testSeriesSwitching() {
    console.log('\n🔄 Testing Issue #19: Series Switching (Same Count)\n');

    let browser;
    let passed = 0;
    let failed = 0;

    try {
        browser = await launchBrowser();
        const page = await createPage(browser);

        // Create two series with SAME album count (3 each)
        const seriesA = {
            name: 'tc1',
            albums: [
                'Led Zeppelin - Led Zeppelin IV',
                'The Beatles - Abbey Road',
                'Pink Floyd - The Wall'
            ]
        };

        const seriesB = {
            name: 'tc1b',
            albums: [
                'Radiohead - OK Computer',
                'Nirvana - Nevermind',
                'The Smiths - The Queen Is Dead'
            ]
        };

        console.log('Step 1: Load Series A (3 albums)');
        await createSeries(page, seriesA.name, seriesA.albums);
        await sleep(3000);

        const countA = await getAlbumCount(page);
        const titlesA = await getAlbumTitles(page);
        console.log(`  Series A loaded: ${countA} albums`);
        console.log(`  Titles:`, titlesA);
        await takeScreenshot(page, 'issue-19-series-a');

        console.log('\nStep 2: Go Home');
        await navigateTo(page, '/');
        await sleep(1000);

        console.log('\nStep 3: Load Series B (also 3 albums)');
        await createSeries(page, seriesB.name, seriesB.albums);
        await sleep(3000);

        const countB = await getAlbumCount(page);
        const titlesB = await getAlbumTitles(page);
        console.log(`  Series B loaded: ${countB} albums`);
        console.log(`  Titles:`, titlesB);
        await takeScreenshot(page, 'issue-19-series-b');

        // Verification 1: Album count matches expected
        console.log('\n✓ Verification 1: Album count correct');
        if (countB === seriesB.albums.length) {
            console.log(`✅ PASS: Count matches (${countB})`);
            passed++;
        } else {
            console.log(`❌ FAIL: Expected ${seriesB.albums.length}, got ${countB}`);
            failed++;
        }

        // Verification 2: Series B albums are displayed (NOT Series A)
        console.log('\n✓ Verification 2: Correct series displayed');

        // Check if any Series B album names appear in the displayed titles
        const seriesBAlbumNames = seriesB.albums.map(a => {
            const parts = a.split(' - ');
            return parts[1]; // Extract album name (e.g., "OK Computer")
        });

        const foundSeriesB = seriesBAlbumNames.filter(albumName =>
            titlesB.some(title => title.includes(albumName))
        );

        // Check if any Series A album names appear (they shouldn't)
        const seriesAAlbumNames = seriesA.albums.map(a => a.split(' - ')[1]);
        const foundSeriesA = seriesAAlbumNames.filter(albumName =>
            titlesB.some(title => title.includes(albumName))
        );

        console.log(`  Series B albums found: ${foundSeriesB.length}/${seriesBAlbumNames.length}`);
        console.log(`  Series A albums found: ${foundSeriesA.length} (should be 0)`);

        if (foundSeriesB.length >= 2 && foundSeriesA.length === 0) {
            console.log('✅ PASS: Series B loaded correctly, no Series A albums');
            passed++;
        } else {
            console.log('❌ FAIL: Wrong series displayed');
            console.log('   Expected Series B albums:', seriesBAlbumNames);
            console.log('   Found:', titlesB);
            failed++;
        }

        // Summary
        console.log('\n' + '='.repeat(50));
        console.log(`Issue #19 Results: ${passed} passed, ${failed} failed`);
        console.log('='.repeat(50) + '\n');

        return { passed, failed, success: failed === 0 };

    } catch (error) {
        console.error('❌ Series Switching test error:', error.message);
        return { passed, failed: failed + 1, success: false, error };
    } finally {
        await closeBrowser(browser);
    }
}
