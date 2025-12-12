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

        this.loadPromise = new Promise(async (resolve, reject) => {
            try {
                // Try to load expanded JSON first (Enriched Data)
                const jsonResponse = await fetch('/assets/data/albums-expanded.json')
                if (jsonResponse.ok) {
                    const data = await jsonResponse.json()
                    this.albums = data
                    this.isLoaded = true
                    console.log(`[AlbumLoader] Loaded ${this.albums.length} albums from Expanded JSON (Enriched)`)
                    resolve(this.albums)
                    return
                }

                // Fallback to CSV (Legacy)
                console.warn('[AlbumLoader] Expanded dataset not found, falling back to CSV')
                const csvResponse = await fetch('/assets/data/albums.csv')
                if (!csvResponse.ok) throw new Error('Failed to load albums data')

                const csvText = await csvResponse.text()
                this.albums = this.parseCSV(csvText)
                this.isLoaded = true
                console.log(`[AlbumLoader] Loaded ${this.albums.length} albums from CSV`)
                resolve(this.albums)

            } catch (err) {
                console.error('[AlbumLoader] Error loading albums:', err)
                this.loadPromise = null
                resolve([]) // Fail gracefully
            }
        })

        return this.loadPromise
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

            // Basic split by comma, respecting potential quotes could be added but 
            // for now simple split is likely sufficient given the data preview.
            // If data gets complex, a regex parser would be safer.
            // Using a regex to handle commas inside quotes just in case.
            const matches = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g)

            // Fallback to simple split if regex fails or matches length is unexpected
            // actually simple split is safer for the specific format we saw unless there are commas in names
            // Let's use a robust "split by comma unless in quotes" regex

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
}

export const albumLoader = new AlbumLoader()
