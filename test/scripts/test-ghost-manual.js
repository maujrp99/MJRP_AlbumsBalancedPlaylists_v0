import puppeteer from 'puppeteer';

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

(async () => {
    console.log('\n🔍 Ghost Albums Debug Test\n');

    const browser = await puppeteer.launch({ headless: false, slowMo: 50 });
    const page = await browser.newPage();

    // Enable console logging - capture ALL messages
    page.on('console', msg => {
        console.log(`[BROWSER ${msg.type()}]:`, msg.text());
    });

    console.log('Navigating to localhost:5000...');
    await page.goto('http://localhost:5000');
    await sleep(2000);

    console.log('\n=== Creating Series A ===');
    await page.type('#seriesName', 'Series A');
    await sleep(300);

    await page.type('#albumList', 'Pink Floyd - The Wall\nLed Zeppelin - IV');
    await sleep(300);

    console.log('Clicking submit...');
    await page.click('button[type="submit"]');

    console.log('Waiting for Series A albums to load...');
    await sleep(10000);

    console.log('\n=== Creating Series B ===');
    await page.goto('http://localhost:5000');
    await sleep(1500);

    await page.type('#seriesName', 'Series B');
    await sleep(300);

    await page.type('#albumList', 'The Beatles - Abbey Road\nNirvana - Nevermind');
    await sleep(300);

    await page.click('button[type="submit"]');

    console.log('Waiting for Series B albums to load...');
    await sleep(10000);

    console.log('\n=== TEST COMPLETE ===');
    console.log('Check console above for "[AlbumsStore] Rejecting album" messages');
    console.log('Browser will stay open. Close manually when done.\n');

    // Keep browser open for inspection
    // await browser.close();
})();
