/**
 * Issue #21 Test: Sticky Playlists
 * Reproduces scenario from DEBUG_LOG.md
 * 
 * Scenario: When switching between series using dropdown/arrows in PlaylistsView,
 * playlists from the first series should NOT persist.
 */

import { launchBrowser, createPage, takeScreenshot, closeBrowser, sleep } from './setup.js';
import { navigateTo, createSeries, SELECTORS } from './helpers.js';

export async function testStickyPlaylists() {
    console.log('\n📋 Testing Issue #21: Sticky Playlists\n');

    let browser;
    let passed = 0;
    let failed = 0;

    try {
        browser = await launchBrowser();
        const page = await createPage(browser);

        // Note: This test requires the app to have playlist generation functionality
        // and a series selector in the PlaylistsView

        const seriesA = {
            name: 'Playlists Series A',
            albums: [
                'The Beatles - Sgt. Pepper\'s Lonely Hearts Club Band',
                'Led Zeppelin - IV'
            ]
        };

        const seriesB = {
            name: 'Playlists Series B',
            albums: [
                'Radiohead - Kid A',
                'Nirvana - In Utero'
            ]
        };

        console.log('Step 1: Create Series A and generate playlists');
        await createSeries(page, seriesA.name, seriesA.albums);
        await sleep(2000);

        // Navigate to Playlists view
        await navigateTo(page, '/playlists');
        await sleep(2000);

        // Try to generate playlists (if button exists)
        const generateButton = await page.$(SELECTORS.playlists.generateButton);
        if (generateButton) {
            await generateButton.click();
            await sleep(3000); // Wait for playlist generation
        }

        // Check if playlists exist
        const playlistsA = await page.$$(SELECTORS.playlists.playlist);
        const playlistCountA = playlistsA.length;
        console.log(`  Playlists for Series A: ${playlistCountA}`);

        // Get track count (if playlists exist)
        let trackCountA = 0;
        if (playlistCountA > 0) {
            const tracksA = await page.$$(SELECTORS.playlists.track);
            trackCountA = tracksA.length;
            console.log(`  Tracks in Series A playlists: ${trackCountA}`);
        }

        await takeScreenshot(page, 'issue-21-series-a-playlists');

        console.log('\nStep 2: Go Home and create Series B');
        await navigateTo(page, '/');
        await sleep(1000);

        await createSeries(page, seriesB.name, seriesB.albums);
        await sleep(2000);

        console.log('\nStep 3: Navigate to Playlists view for Series B');
        await navigateTo(page, '/playlists');
        await sleep(2000);

        // Check if Series A playlists are still visible (they shouldn't be)
        const playlistsB = await page.$$(SELECTORS.playlists.playlist);
        const playlistCountB = playlistsB.length;

        let trackCountB = 0;
        if (playlistCountB > 0) {
            const tracksB = await page.$$(SELECTORS.playlists.track);
            trackCountB = tracksB.length;
            console.log(`  Tracks in Series B playlists: ${trackCountB}`);
        }

        await takeScreenshot(page, 'issue-21-series-b-playlists');

        // Verification 1: Playlists were cleared when switching series
        console.log('\n✓ Verification 1: Playlists cleared on series switch');

        // If Series A had playlists and Series B has no generate button clicked,
        // we expect either empty playlists OR different track count
        if (trackCountA > 0 && trackCountB === trackCountA) {
            console.log(`❌ FAIL: Same track count (${trackCountB}) - playlists may be sticky`);
            failed++;
        } else {
            console.log(`✅ PASS: Track count changed or playlists cleared`);
            passed++;
        }

        // Verification 2: Check page content for series identifier
        console.log('\n✓ Verification 2: Correct series context');
        const pageContent = await page.content();

        const hasSeriesAName = pageContent.includes(seriesA.name);
        const hasSeriesBName = pageContent.includes(seriesB.name);

        if (hasSeriesBName && !hasSeriesAName) {
            console.log('✅ PASS: Series B context active, Series A not found');
            passed++;
        } else if (hasSeriesAName) {
            console.log('❌ FAIL: Series A name still found in page');
            failed++;
        } else {
            console.log('⚠️  SKIP: Could not determine series context from page content');
        }

        // Summary
        console.log('\n' + '='.repeat(50));
        console.log(`Issue #21 Results: ${passed} passed, ${failed} failed`);
        console.log('='.repeat(50) + '\n');

        return { passed, failed, success: failed === 0 };

    } catch (error) {
        console.error('❌ Sticky Playlists test error:', error.message);
        return { passed, failed: failed + 1, success: false, error };
    } finally {
        await closeBrowser(browser);
    }
}
