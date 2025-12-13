/**
 * Search Worker
 * Handles background fetching and fuzzy searching of albums
 */

importScripts('../vendor/uFuzzy.js');

let albums = [];
let haystack = []; // Array of strings for uFuzzy: "Artist - Album"
let uf = null;
let isReady = false;

// Initialize uFuzzy
// https://github.com/leeoniya/uFuzzy#options
uf = new uFuzzy({
    intraMode: 1, // 0:any, 1:prefix (better for autocomplete)
    intraIns: 1,  // Max insertions (typos)
    intraChars: "[a-z\\d']", // Allow apostrophes
});

// Fetch data
async function loadData() {
    try {
        console.log('Worker: Fetching data...');
        const response = await fetch('/assets/data/albums-autocomplete.json');

        if (!response.ok) throw new Error('Network error');

        const data = await response.json();

        // Transform for search
        // We want to search by "Artist Album" or "Album Artist"
        // But uFuzzy works on a single array of strings.
        // Strategy: "Artist - Album"

        albums = data;
        haystack = data.map(item => `${item.a} - ${item.b}`);

        isReady = true;
        console.log(`Worker: Ready with ${albums.length} albums`);

        postMessage({ type: 'READY', count: albums.length });

    } catch (err) {
        console.error('Worker Error:', err);
        postMessage({ type: 'ERROR', message: err.message });
    }
}

// Handle messages
self.onmessage = function (e) {
    const { type, query, limit = 20, requestId } = e.data;

    if (type === 'INIT') {
        loadData();
    } else if (type === 'SEARCH') {
        if (!isReady) {
            // Alternatively, could queue requests, but UI should handle loading state
            postMessage({ type: 'RESULTS', results: [], requestId });
            return;
        }

        if (!query || query.length < 2) {
            postMessage({ type: 'RESULTS', results: [], requestId });
            return;
        }

        // Perform search
        // uFuzzy returns [idxs, info, order]
        // search(haystack, needle, outOfOrder)
        const [idxs, info, order] = uf.search(haystack, query);

        // Sort/limit results
        const gathered = [];
        const max = Math.min(idxs.length, limit);

        for (let i = 0; i < max; i++) {
            const index = idxs[i];
            const item = albums[index];

            gathered.push({
                artist: item.a,
                album: item.b,
                year: item.c,
                id: item.d,
                artworkTemplate: item.e // Lightweight thumb logic? item.e is url
            });
        }

        postMessage({ type: 'RESULTS', results: gathered, query, requestId });
    }
};
