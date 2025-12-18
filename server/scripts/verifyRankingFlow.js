
const { fetchRankingForAlbum } = require('../lib/fetchRanking');
const logger = require('../lib/logger');

// Override logger methods to print to console cleanly
logger.info = (msg, meta) => console.log(`[INFO] ${msg}`, meta ? JSON.stringify(meta) : '');
logger.warn = (msg, meta) => console.log(`[WARN] ${msg}`, meta ? JSON.stringify(meta) : '');

async function runTests() {
    console.log('=== TEST 1: BestEver Fix (Led Zeppelin IV) ===');
    const lzResult = await fetchRankingForAlbum('Led Zeppelin IV', 'Led Zeppelin');

    // Check results
    const primarySource = lzResult.sources && lzResult.sources[0];
    console.log('Provider:', primarySource ? primarySource.provider : 'None');
    console.log('Provider Type:', primarySource ? primarySource.providerType : 'None');
    console.log('Tracks Found:', lzResult.entries ? lzResult.entries.length : 0);
    console.log('first entry:', lzResult.entries && lzResult.entries[0] ? lzResult.entries[0].trackTitle : 'None');
    console.log('--------------------------------------------------\n');

    console.log('=== TEST 2: Spotify Fallback (Unknown Album to BestEver) ===');
    // Using an album that should trigger fallback. 
    // "Starboy" by The Weeknd (Likely on BestEver, but let's see)
    // To properly test fallback without mocking, we'd need an album NOT on BestEver.
    // Let's try a fake album title that Spotify might catch via fuzzy match? No.
    // Let's try "The Idol Vol 1" (The Weeknd) - TV Soundtrack, maybe less likely to be on BestEver?

    const popResult = await fetchRankingForAlbum('The Idol Vol 1', 'The Weeknd');
    const popSource = popResult.sources && popResult.sources[0];

    console.log('Provider:', popSource ? popSource.provider : 'None');
    console.log('Provider Type:', popSource ? popSource.providerType : 'None');
    console.log('Tracks Found:', popResult.entries ? popResult.entries.length : 0);
    console.log('first entry:', popResult.entries && popResult.entries[0] ? popResult.entries[0].trackTitle : 'None');
    console.log('--------------------------------------------------\n');
}

runTests().catch(err => console.error(err));
