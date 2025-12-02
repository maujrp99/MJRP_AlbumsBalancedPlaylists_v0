/**
 * Quick Demo - Visual Puppeteer Test
 * Run this to see Puppeteer in action with a visible browser
 * 
 * Usage: node test/e2e/quick-demo.js
 */

import puppeteer from 'puppeteer';

async function quickDemo() {
    console.log('\n🚀 Starting Puppeteer Quick Demo...\n');

    // Launch browser with visible window
    const browser = await puppeteer.launch({
        headless: false,  // Browser visible!
        slowMo: 100,      // Slow down actions so you can see them
        defaultViewport: { width: 1280, height: 800 }
    });

    const page = await browser.newPage();

    console.log('✓ Browser launched (you should see it!)');

    // Navigate to your app
    const url = 'http://localhost:5005';
    console.log(`✓ Navigating to ${url}...`);

    try {
        await page.goto(url, { waitUntil: 'networkidle0', timeout: 10000 });

        // Get page info
        const title = await page.title();
        const currentUrl = page.url();

        console.log('\n📄 Page Info:');
        console.log(`   Title: ${title}`);
        console.log(`   URL: ${currentUrl}`);

        // Take screenshot
        const screenshotPath = 'test/e2e/screenshots/quick-demo.png';
        await page.screenshot({ path: screenshotPath, fullPage: true });
        console.log(`\n📸 Screenshot saved: ${screenshotPath}`);

        // Try to find some elements
        console.log('\n🔍 Looking for UI elements...');

        const header = await page.$('header');
        console.log(`   Header: ${header ? '✅ Found' : '❌ Not found'}`);

        const logo = await page.$('img[alt*="Logo"], .logo, img');
        console.log(`   Logo: ${logo ? '✅ Found' : '❌ Not found'}`);

        const links = await page.$$('a');
        console.log(`   Links: ${links.length} found`);

        const buttons = await page.$$('button');
        console.log(`   Buttons: ${buttons.length} found`);

        // Simulate a click (example)
        const albumsLink = await page.$('a[href="/albums"]');
        if (albumsLink) {
            console.log('\n🖱️  Clicking "Albums" link...');
            await albumsLink.click();
            await new Promise(r => setTimeout(r, 2000));

            const newUrl = page.url();
            console.log(`   New URL: ${newUrl}`);

            // Take another screenshot
            await page.screenshot({ path: 'test/e2e/screenshots/quick-demo-albums.png' });
            console.log('   📸 Screenshot saved');
        }

        console.log('\n✅ Demo completed successfully!');
        console.log('   Browser will close in 5 seconds...');

        await new Promise(r => setTimeout(r, 5000));

    } catch (error) {
        console.error('\n❌ Error:', error.message);

        if (error.message.includes('net::ERR_CONNECTION_REFUSED')) {
            console.log('\n⚠️  App not running! Start it with:');
            console.log('   npm run preview -- --port 5005');
        }
    } finally {
        await browser.close();
        console.log('\n👋 Browser closed\n');
    }
}

// Run the demo
quickDemo();
