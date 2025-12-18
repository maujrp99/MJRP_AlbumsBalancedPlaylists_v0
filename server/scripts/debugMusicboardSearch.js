
const puppeteer = require('puppeteer');

async function debugSearch() {
    const artist = process.argv[2] || 'Led Zeppelin';
    const album = process.argv[3] || 'Led Zeppelin IV';

    console.log(`Searching for: ${artist} - ${album}`);

    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1920,1080']
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });

    // Capture logs
    page.on('console', msg => console.log('BROWSER LOG:', msg.text()));

    const searchQuery = encodeURIComponent(`${artist} ${album}`);
    const searchUrl = `https://musicboard.app/search/?q=${searchQuery}`;
    console.log(`Navigating to: ${searchUrl}`);

    await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 30000 });

    // Capture state
    await page.screenshot({ path: 'search_debug.png', fullPage: true });
    const fs = require('fs');
    fs.writeFileSync('search_debug.html', await page.content());

    try {
        await page.waitForSelector('a[href*="/album/"]', { timeout: 10000 });
        console.log('Search results loaded.');

        const links = await page.evaluate(() => {
            return Array.from(document.querySelectorAll('a[href*="/album/"]')).map(a => ({
                text: a.innerText,
                href: a.href
            }));
        });

        console.log('Found album links:', links.length);
        links.forEach(l => console.log(`- ${l.text.replace(/\n/g, ' ')} -> ${l.href}`));

    } catch (err) {
        console.error('Error waiting for results:', err.message);
    }

    await browser.close();
}

debugSearch();
