
const axios = require('axios');
const cheerio = require('cheerio');

// Mock of the current normalization (strips parens)
const normalizeStrict = s => (s || '').toLowerCase().replace(/\(.*?\)/g, '').replace(/[^a-z0-9]+/g, ' ').trim();

// Proposed normalization (keeps parens content, just handles whitespace/special chars)
const normalizeLoose = s => (s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

async function testPageMatch() {
    const albumTitle = "Led Zeppelin IV";
    const albumArtist = "Led Zeppelin";

    // The specific URL for Led Zeppelin IV on BestEverAlbums
    const url = "https://www.besteveralbums.com/thechart.php?a=144";

    console.log(`Testing match for "${albumTitle}" by "${albumArtist}" against ${url}`);

    try {
        const res = await axios.get(url, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' }
        });
        const html = res.data;
        const $ = cheerio.load(html);

        const titleText = ($('title').text() || '');
        const headerText = (($('h1').text() || '') + ' ' + ($('h2').text() || ''));
        const bodyText = ($('body').text() || '').substring(0, 1000); // Check first 1k chars for efficiency in logs

        console.log(`\nPage Title: "${titleText}"`);
        console.log(`Page H1/H2: "${headerText.trim()}"`);

        // 1. Current Logic Check
        const normTarget = normalizeStrict(albumTitle);
        const normPageStrict = normalizeStrict(titleText + ' ' + headerText);

        console.log(`\n--- Current Logic (Strict) ---`);
        console.log(`Target: "${normTarget}"`);
        console.log(`Page:   "${normPageStrict}"`);
        console.log(`Match?  ${normPageStrict.includes(normTarget)}`);

        // 2. Proposed Logic Check
        const normPageLoose = normalizeLoose(titleText + ' ' + headerText);

        console.log(`\n--- Proposed Logic (Loose Page, Strict Target) ---`);
        console.log(`Target: "${normTarget}"`);
        console.log(`Page:   "${normPageLoose}"`);
        console.log(`Match?  ${normPageLoose.includes(normTarget)}`);

    } catch (e) {
        console.error("Error fetching page:", e.message);
    }
}

testPageMatch();
