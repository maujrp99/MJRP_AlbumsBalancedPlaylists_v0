// function { normalizeKey } = require('./shared/normalize.js'); // REMOVED
// I'll inline the normalizeKey logic from shared/normalize.js to be safe and dependency-free for this script.

function normalizeKeyInline(str) {
    if (!str) return '';
    return str.toString()
        .toLowerCase()
        .replace(/[^\w\s]/g, '') // Remove all non-word chars (punctuation)
        .replace(/\s+/g, ' ') // Collapse whitespace
        .trim();
}

function toFuzzyCoreInline(str) {
    // Logic from server/lib/normalize.js (viewed in step 7541)
    const removeDiacritics = (s) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    if (!str) return ''
    let core = str.toLowerCase().split(' by ')[0].split(':')[0].split(' - ')[0]
    core = removeDiacritics(core)
        .replace(/\s*[\(\[][^()]*?[\)\]]/g, '')
        .replace(/[^a-z0-9]/g, '')
        .trim()
    if (core.startsWith('the')) core = core.substring(3)
    if (core.endsWith('e') && core.length > 4) core = core.slice(0, -1)
    return core
}

const officialTrack = "72 Seasons";
const scrapedTrack = "72 Seasons"; // This is what comes out of scraper now

console.log("--- Reproduction ---");
console.log(`Official: "${officialTrack}"`);
console.log(`Scraped:  "${scrapedTrack}"`);

const normOfficial = normalizeKeyInline(officialTrack);
const normScraped = normalizeKeyInline(scrapedTrack);

console.log(`Norm Official: "${normOfficial}"`);
console.log(`Norm Scraped:  "${normScraped}"`);
console.log(`Match? ${normOfficial === normScraped}`);

const fuzzyOfficial = toFuzzyCoreInline(officialTrack);
const fuzzyScraped = toFuzzyCoreInline(scrapedTrack);

console.log(`Fuzzy Official: "${fuzzyOfficial}"`);
console.log(`Fuzzy Scraped:  "${fuzzyScraped}"`);
console.log(`Fuzzy Match? ${fuzzyOfficial === fuzzyScraped}`);

// Test with potential hidden chars (NBSP)
const scraperRaw = "72 Seasons"; // Simulate what might be coming from HTML
console.log(`Raw JS length: ${scraperRaw.length}`);
