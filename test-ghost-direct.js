import puppeteer from 'puppeteer';

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

(async () => {
    console.log('\n🔍 Ghost Albums Direct Store Test\n');

    const browser = await puppeteer.launch({ headless: false, slowMo: 50 });
    const page = await browser.newPage();

    // Capture console
    page.on('console', msg => {
        const text = msg.text();
        if (text.includes('Rejecting') || text.includes('Ghost') || text.includes('[AlbumsStore]') || text.includes('[TEST]')) {
            console.log(`[BROWSER]:`, text);
        }
    });

    await page.goto('http://localhost:5000');
    await sleep(3000);

    console.log('\n=== Direct Store Test (No API dependency) ===\n');

    // Test 1: Set active series A and add albums
    await page.evaluate(() => {
        console.log('[TEST] Setting active series to A');
        window.albumsStore.setActiveAlbumSeriesId('series-a');

        console.log('[TEST] Adding album A1 to series A');
        window.albumsStore.addAlbum({ id: 'a1', title: 'Album A1', artist: 'Artist A' });

        console.log('[TEST] Adding album A2 to series A');
        window.albumsStore.addAlbum({ id: 'a2', title: 'Album A2', artist: 'Artist A' });

        console.log('[TEST] Current albums:', window.albumsStore.getAlbums().length);
    });

    await sleep(2000);

    // Test 2: Switch to series B and try to add albums
    await page.evaluate(() => {
        console.log('[TEST] Switching active series to B');
        window.albumsStore.setActiveAlbumSeriesId('series-b');

        console.log('[TEST] BEFORE reset - albums count:', window.albumsStore.getAlbums().length);

        console.log('[TEST] Calling reset(true)');
        window.albumsStore.reset(true);

        console.log('[TEST] AFTER reset - albums count:', window.albumsStore.getAlbums().length);

        console.log('[TEST] Adding album B1 to series B');
        window.albumsStore.addAlbum({ id: 'b1', title: 'Album B1', artist: 'Artist B' });

        console.log('[TEST] Adding album B2 to series B');
        window.albumsStore.addAlbum({ id: 'b2', title: 'Album B2', artist: 'Artist B' });

        console.log('[TEST] Current albums for series B:', window.albumsStore.getAlbums().length);
    });

    await sleep(2000);

    // Test 3: Try to add albums from series A (should be rejected!)
    const rejectionTest = await page.evaluate(() => {
        console.log('[TEST] ===== GHOST ALBUM TEST =====');
        console.log('[TEST] Active series is still B');
        console.log('[TEST] Trying to add album from series A (should be REJECTED)');

        // This should fail because activeSeriesId is 'series-b'
        const result = window.albumsStore.addAlbumToSeries('series-a', {
            id: 'a3',
            title: 'Ghost Album A3',
            artist: 'Artist A'
        });

        console.log('[TEST] addAlbumToSeries result:', result);
        console.log('[TEST] Final albums count:', window.albumsStore.getAlbums().length);

        return {
            rejected: !result,
            finalCount: window.albumsStore.getAlbums().length
        };
    });

    console.log('\n=== TEST RESULTS ===');
    console.log('Ghost album rejected:', rejectionTest.rejected ? '✅ PASS' : '❌ FAIL');
    console.log('Final album count:', rejectionTest.finalCount, '(expected: 2)');
    console.log('\nCheck browser console for detailed logs.');
    console.log('Browser will stay open. Close when done.\n');

    // await browser.close();
})();
