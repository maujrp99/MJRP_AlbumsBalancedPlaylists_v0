
const { getBestEverRanking } = require('../lib/scrapers/bestever');

async function debug() {
    const artist = 'Led Zeppelin';
    const album = 'Led Zeppelin IV';

    console.log(`Testing BestEver for: ${artist} - ${album}`);
    try {
        const result = await getBestEverRanking(album, artist);
        console.log('Result:', JSON.stringify(result, null, 2));
    } catch (e) {
        console.error('Error:', e);
    }
}

debug();
