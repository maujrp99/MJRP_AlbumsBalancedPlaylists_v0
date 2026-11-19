/**
 * Optimized Album Loader (Service)
 * Uses Web Worker + uFuzzy for high-performance autocomplete on 30k+ albums.
 */

import SearchWorker from '../workers/search.worker.js?worker';
import { pickAlbum, localCandidate } from '../models/askedAlbum.js';

/** How many rows of the dataset are read when one album is looked up. */
const LOOKUP_ROWS = 20;

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
            this.worker = new SearchWorker();

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

    /**
     * Find all albums by specific artist (Exact match)
     * @param {string} artistName 
     * @returns {Promise<Array>}
     */
    findByArtist(artistName) {
        if (!this.worker) return Promise.resolve([]);

        return new Promise((resolve) => {
            const requestId = ++this.requestIdCounter;
            this.pendingRequests.set(requestId, resolve);

            this.worker.postMessage({
                type: 'FIND_BY_ARTIST',
                query: artistName,
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
     * Parse artwork URL from optimized item
     * @param {object} item 
     * @param {number} size 
     * @returns {string|null}
     */
    getArtworkUrl(item, size = 100) {
        if (!item) return null;
        // Handle both optimized (d/e) and full (artworkTemplate) formats
        const template = item.e || item.artworkTemplate;
        if (!template) return item.coverUrl || null;

        return template
            .replace('{w}', size)
            .replace('{h}', size);
    }

    /**
     * The row of the dataset that is the album asked for, or null (used for the cover of an album
     * that came without one). The search only lists rows; which one is accepted is decided by the
     * one identity rule (shared/albumIdentity.js, F55). No row passes: null, never the first row.
     * @param {string} artist
     * @param {string} album
     * @returns {Promise<object|null>}
     */
    async findAlbum(artist, album) {
        if (!artist || !album) return null
        const rows = await this.search(`${artist} ${album}`, LOOKUP_ROWS)
        return pickAlbum({ artist, title: album }, rows, localCandidate).candidate
    }
}

// Singleton instance
export const optimizedAlbumLoader = new OptimizedAlbumLoader();
