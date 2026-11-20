/**
 * AlbumLoader.js
 * Service to load and search pre-defined albums from CSV
 */

export class AlbumLoader {
    constructor() {
        this.albums = []
        this.isLoaded = false
        this.loadPromise = null
    }

    /**
     * Initializes the loader by fetching and parsing the CSV
     * Returns a promise that resolves when data is ready
     */
    async load() {
        if (this.isLoaded) return Promise.resolve(this.albums)
        if (this.loadPromise) return this.loadPromise

        this.loadPromise = this._read()
        return this.loadPromise
    }

    /**
     * Read the dataset: the expanded JSON first, the CSV when it is not there. Never rejects:
     * when neither can be read the answer is an empty list, and the next load() tries again.
     */
    async _read() {
        try {
            // Try to load expanded JSON first (Enriched Data)
            const jsonResponse = await fetch('/assets/data/albums-expanded.json')
            if (jsonResponse.ok) {
                this.albums = await jsonResponse.json()
                this.isLoaded = true
                console.log(`[AlbumLoader] Loaded ${this.albums.length} albums from Expanded JSON (Enriched)`)
                return this.albums
            }

            // Fallback to CSV (Legacy)
            console.warn('[AlbumLoader] Expanded dataset not found, falling back to CSV')
            const csvResponse = await fetch('/assets/data/albums.csv')
            if (!csvResponse.ok) throw new Error('Failed to load albums data')

            this.albums = this.parseCSV(await csvResponse.text())
            this.isLoaded = true
            console.log(`[AlbumLoader] Loaded ${this.albums.length} albums from CSV`)
            return this.albums
        } catch (err) {
            console.error('[AlbumLoader] Error loading albums:', err)
            this.loadPromise = null
            return [] // Fail gracefully
        }
    }

    /**
     * Simple CSV parser
     * Assumes header: i,PLACE,Artist,Album,Year
     */
    parseCSV(text) {
        const lines = text.split('\n')
        const result = []

        // Skip header (index 0)
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim()
            if (!line) continue

            // Split by comma, unless the comma is inside quotes
            const parts = this.splitCSVLine(line)

            if (parts.length >= 5) {
                // i, PLACE, Artist, Album, Year
                // We want Artist, Album, Year
                result.push({
                    artist: parts[2].replace(/^"|"$/g, '').trim(),
                    album: parts[3].replace(/^"|"$/g, '').trim(),
                    year: parts[4].replace(/^"|"$/g, '').trim()
                })
            }
        }
        return result
    }

    splitCSVLine(str) {
        const result = [];
        let current = '';
        let inQuotes = false;

        for (let i = 0; i < str.length; i++) {
            const char = str[i];
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                result.push(current);
                current = '';
            } else {
                current += char;
            }
        }
        result.push(current);
        return result;
    }

    /**
     * Search albums by query (Artist or Album)
     * @param {string} query 
     * @param {number} limit 
     */
    search(query, limit = 10) {
        if (!query || query.length < 2) return []

        const lowerQuery = query.toLowerCase()

        // Filter matching albums, then sort by year (newest first)
        return this.albums
            .filter(item =>
                item.album.toLowerCase().includes(lowerQuery) ||
                item.artist.toLowerCase().includes(lowerQuery)
            )
            .sort((a, b) => {
                // Sort by year descending (newest first)
                const yearA = parseInt(a.year) || 0
                const yearB = parseInt(b.year) || 0
                return yearB - yearA
            })
            .slice(0, limit)
    }

    /**
     * Get artwork URL for an album at specified size
     * Uses Apple Music artworkTemplate if available, falls back to coverUrl
     * @param {Object} album - Album object with artworkTemplate or coverUrl
     * @param {number} size - Desired size in pixels (default 500)
     * @returns {string|null} Artwork URL or null
     */
    getArtworkUrl(album, size = 500) {
        if (!album) return null

        // Prefer Apple Music artwork template (supports dynamic sizing)
        if (album.artworkTemplate) {
            return album.artworkTemplate
                .replace('{w}', size)
                .replace('{h}', size)
        }

        // Fallback to Discogs cover URL
        if (album.coverUrl) {
            return album.coverUrl
        }

        return null
    }
}

export const albumLoader = new AlbumLoader()
