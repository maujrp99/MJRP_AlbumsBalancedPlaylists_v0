import puppeteer from 'puppeteer';

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

(async () => {
    console.log('\n🔍 Ghost Albums Automated Test (No External API)\n');

    const browser = await puppeteer.launch({
        headless: false,
        slowMo: 100,
        devtools: true  // Open devtools automatically
    });
    const page = await browser.newPage();

    let rejectionDetected = false;

    // Capture console - look for rejection messages
    page.on('console', msg => {
        const text = msg.text();
        console.log(`[BROWSER]:`, text);

        if (text.includes('Rejecting album for inactive series')) {
            rejectionDetected = true;
        }
    });

    console.log('Step 1: Navigate and wait for app initialization...');
    await page.goto('http://localhost:5000');
    await sleep(3000);

    // Wait for stores to be available in window
    console.log('Waiting for stores to load...');
    await page.waitForFunction(() => {
        return window.albumSeriesStore && window.albumsStore;
    }, { timeout: 10000 });
    console.log('✅ Stores loaded!');

    console.log('\nStep 2: Inject mock albums directly...');

    // Create Series A and add mock albums
    const seriesATest = await page.evaluate(() => {
        // Access stores from window (app.js exposes them)
        const { albumSeriesStore, albumsStore, router } = window;

        console.log('[TEST] Creating Series A');
        const seriesA = albumSeriesStore.createSeries({
            id: 'test-series-a',
            name: 'Test Series A',
            albumQueries: ['Mock Album A1', 'Mock Album A2'],
            status: 'active',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        });

        console.log('[TEST] Setting Series A as active');
        albumSeriesStore.setActiveSeries('test-series-a');

        console.log('[TEST] Setting albumsStore active series to A');
        albumsStore.setActiveAlbumSeriesId('test-series-a');

        console.log('[TEST] Adding mock album A1');
        albumsStore.addAlbum({
            id: 'mock-a1',
            title: 'Mock Album A1',
            artist: 'Artist A',
            year: 2020,
            tracks: []
        });

        console.log('[TEST] Adding mock album A2');
        albumsStore.addAlbum({
            id: 'mock-a2',
            title: 'Mock Album A2',
            artist: 'Artist A',
            year: 2021,
            tracks: []
        });

        const countA = albumsStore.getAlbums();
        console.log('[TEST] Series A albums count:', countA.length);

        return { count: countA.length, seriesId: seriesA.id };
    });

    console.log(`Series A created with ${seriesATest.count} albums`);
    await sleep(2000);

    console.log('\nStep 3: Create Series B and test ghost album rejection...');

    const seriesBTest = await page.evaluate(() => {
        const { albumSeriesStore, albumsStore } = window;

        console.log('[TEST] Creating Series B');
        const seriesB = albumSeriesStore.createSeries({
            id: 'test-series-b',
            name: 'Test Series B',
            albumQueries: ['Mock Album B1', 'Mock Album B2'],
            status: 'active',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        });

        console.log('[TEST] Setting Series B as active');
        albumSeriesStore.setActiveSeries('test-series-b');

        console.log('[TEST] Setting albumsStore active series to B');
        albumsStore.setActiveAlbumSeriesId('test-series-b');

        console.log('[TEST] Calling reset(true) - should clear Map but keep activeSeriesId');
        albumsStore.reset(true);

        const afterReset = albumsStore.getAlbums();
        console.log('[TEST] After reset, albums count:', afterReset.length);

        console.log('[TEST] Adding mock album B1');
        albumsStore.addAlbum({
            id: 'mock-b1',
            title: 'Mock Album B1',
            artist: 'Artist B',
            year: 2022,
            tracks: []
        });

        const countB = albumsStore.getAlbums();
        console.log('[TEST] Series B albums count:', countB.length);

        // CRITICAL TEST: Try to add album from Series A (should be rejected!)
        console.log('[TEST] ===== GHOST ALBUM REJECTION TEST =====');
        console.log('[TEST] Active series:', albumsStore.getActiveAlbumSeriesId());
        console.log('[TEST] Attempting to add album from Series A (should REJECT)...');

        const rejectionResult = albumsStore.addAlbumToSeries('test-series-a', {
            id: 'ghost-a3',
            title: 'GHOST Album A3',
            artist: 'Artist A',
            year: 2023,
            tracks: []
        });

        console.log('[TEST] addAlbumToSeries result:', rejectionResult);

        const finalCount = albumsStore.getAlbums();
        console.log('[TEST] Final albums count after rejection test:', finalCount.length);

        return {
            afterResetCount: afterReset.length,
            finalCount: finalCount.length,
            rejected: !rejectionResult
        };
    });

    await sleep(2000);

    console.log('\n' + '='.repeat(60));
    console.log('TEST RESULTS');
    console.log('='.repeat(60));
    console.log('After reset count:', seriesBTest.afterResetCount, '(expected: 0)');
    console.log('Final count:', seriesBTest.finalCount, '(expected: 1)');
    console.log('Ghost album rejected:', seriesBTest.rejected ? '✅ PASS' : '❌ FAIL');
    console.log('Rejection logged:', rejectionDetected ? '✅ YES' : '❌ NO');

    if (seriesBTest.rejected && seriesBTest.finalCount === 1) {
        console.log('\n✅ TEST PASSED: Ghost albums are being rejected!');
    } else {
        console.log('\n❌ TEST FAILED: Ghost albums are NOT being rejected!');
    }

    console.log('\nBrowser will stay open for inspection. Close when done.\n');

    // await browser.close();
})();
