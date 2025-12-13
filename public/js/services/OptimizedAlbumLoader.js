/**
 * Optimized Album Loader (Service)
 * Uses Web Worker + uFuzzy for high-performance autocomplete on 30k+ albums.
 */

class OptimizedAlbumLoader {
    constructor() {
        this.worker = null;
        this.pendingRequests = new Map();
        this.requestIdCounter = 0;
        this.isReady = false;

        this.init();
    }

    init() {
        if (window.Worker) {
            this.worker = new Worker('/js/workers/search.worker.js');

            this.worker.onmessage = (e) => {
                const { type, results, requestId } = e.data;

                if (type === 'READY') {
                    console.log(`✅ OptimizedAlbumLoader: Worker ready (${e.data.count} albums)`);
                    this.isReady = true;
                } else if (type === 'RESULTS') {
                    if (this.pendingRequests.has(requestId)) {
                        const resolve = this.pendingRequests.get(requestId);
                        this.pendingRequests.delete(requestId);
                        resolve(results);
                    }
                }
            };

            // Start loading data immediately
            this.worker.postMessage({ type: 'INIT' });
        } else {
            console.error('❌ Web Workers not supported in this browser');
        }
    }

    /**
     * Search for albums
     * @param {string} query 
     * @param {number} limit 
     * @returns {Promise<Array>}
     */
    search(query, limit = 50) {
        if (!this.worker) return Promise.resolve([]);

        return new Promise((resolve) => {
            const requestId = ++this.requestIdCounter;
            this.pendingRequests.set(requestId, resolve);

            this.worker.postMessage({
                type: 'SEARCH',
                query,
                limit,
                requestId
            });
        });
    }

    // Load method kept for compatibility with old interface (HomeView calls it)
    async load() {
        // No-op, worker initializes itself in constructor
        return Promise.resolve();
    }

    /**
     * Helper to generate artwork URL
     * @param {object} item 
     * @param {number} size 
     * @returns {string|null}
     */
    getArtworkUrl(item, size = 100) {
        if (!item.artworkTemplate) return null;
        return item.artworkTemplate
            .replace('{w}', size)
            .replace('{h}', size);
    }
}

// Singleton instance
export const optimizedAlbumLoader = new OptimizedAlbumLoader();
