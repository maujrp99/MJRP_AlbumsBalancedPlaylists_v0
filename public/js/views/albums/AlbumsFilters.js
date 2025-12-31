/**
 * AlbumsFilters
 * Extracted filter logic for album views
 * Part of Sprint 10 refactoring (AlbumsView modularization)
 */

/**
 * Filter albums based on search query and filter state
 * @param {Array} albums - Array of album objects
 * @param {Object} options - Filter options
 * @param {string} options.searchQuery - Search query string
 * @param {Object} options.filters - Filter state { artist, year, source }
 * @returns {Array} Filtered albums
 */
export function filterAlbums(albums, options = {}) {
    const { searchQuery = '', filters = {} } = options
    let filtered = albums

    // FIX: Expansion Dataset Safety
    // Do not show expanded discography items in the main browsing view (too many items)
    // Only show them when searching or filtering by specific criteria
    const isBrowsingAll = !searchQuery &&
        (filters.artist === 'all' || !filters.artist) &&
        (filters.year === 'all' || !filters.year) &&
        (filters.source === 'all' || !filters.source)

    if (isBrowsingAll) {
        filtered = filtered.filter(album => album.addedBy !== 'expansion')
    }

    // Search filter
    if (searchQuery) {
        const query = searchQuery.toLowerCase()
        filtered = filtered.filter(album =>
            album.title?.toLowerCase().includes(query) ||
            album.artist?.toLowerCase().includes(query)
        )
    }

    // Artist filter
    if (filters.artist && filters.artist !== 'all') {
        filtered = filtered.filter(album => album.artist === filters.artist)
    }

    // Year filter
    if (filters.year && filters.year !== 'all') {
        filtered = filtered.filter(album => {
            const year = album.year
            if (!year) return false

            switch (filters.year) {
                case '1960s': return year >= 1960 && year < 1970
                case '1970s': return year >= 1970 && year < 1980
                case '1980s': return year >= 1980 && year < 1990
                case '1990s': return year >= 1990 && year < 2000
                case '2000s': return year >= 2000
                default: return true
            }
        })
    }

    // Source/Status Filter
    if (filters.source && filters.source !== 'all') {
        filtered = filtered.filter(album => {
            const hasBestEver = !!album.bestEverAlbumId
            const tracks = album.tracks || []
            const hasRatings = tracks.some(t => t.rating > 0)

            // Determine primary source
            // This logic mimics backend priority: BestEver > Popularity > AI
            let source = 'pending'
            if (hasBestEver) source = 'acclaim'
            else if (album.acclaim?.providerType === 'popularity') source = 'popularity'
            else if (hasRatings) source = 'ai'

            return source === filters.source
        })
    }

    return filtered
}

/**
 * Get unique artists from albums list
 * @param {Array} albums - Array of album objects
 * @returns {Array} Sorted array of unique artist names
 */
export function getUniqueArtists(albums) {
    const artists = albums
        .map(album => album.artist)
        .filter(Boolean)
    return [...new Set(artists)].sort()
}

/**
 * Get unique years from albums list
 * @param {Array} albums - Array of album objects  
 * @returns {Array} Sorted array of unique years
 */
export function getUniqueYears(albums) {
    const years = albums
        .map(album => album.year)
        .filter(Boolean)
    return [...new Set(years)].sort((a, b) => b - a)
}

/**
 * Get decade options for year filter
 * @returns {Array} Array of decade options
 */
export function getDecadeOptions() {
    return [
        { value: 'all', label: 'All Years' },
        { value: '2000s', label: '2000s+' },
        { value: '1990s', label: '1990s' },
        { value: '1980s', label: '1980s' },
        { value: '1970s', label: '1970s' },
        { value: '1960s', label: '1960s' }
    ]
}

/**
 * Get source filter options
 * @returns {Array} Array of source options
 */
export function getSourceOptions() {
    return [
        { value: 'all', label: 'All Sources' },
        { value: 'acclaim', label: 'BestEverAlbums' },
        { value: 'popularity', label: 'Popularity (Spotify)' },
        { value: 'ai', label: 'AI Enriched' },
        { value: 'pending', label: 'Pending' }
    ]
}
