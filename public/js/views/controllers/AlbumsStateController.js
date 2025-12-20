/**
 * AlbumsStateController.js
 * Manages the UI state for the Albums View, decoupling logic from rendering.
 * Implements Observer pattern for state changes.
 */
export class AlbumsStateController {
    constructor() {
        this.state = {
            albums: [], // Raw albums
            filteredAlbums: [], // Albums after filter/search
            filters: {
                searchQuery: '',
                genre: null,
                yearRange: null
            },
            viewMode: 'COMPACT', // 'COMPACT' | 'EXPANDED' | 'LIST'
            loading: false,
            error: null,
            scope: {
                type: 'SINGLE', // 'SINGLE' | 'ALL'
                seriesId: null
            }
        }

        this.listeners = new Set()
    }

    // --- State Accessors ---

    get albums() { return this.state.filteredAlbums }
    get allAlbums() { return this.state.albums }
    get viewMode() { return this.state.viewMode }
    get isLoading() { return this.state.loading }

    // --- Actions ---

    setAlbums(albums) {
        this.state.albums = albums || []
        this._applyFilters() // Auto-update filtered list
        this._notify('albums_updated')
    }

    setFilters(newFilters) {
        this.state.filters = { ...this.state.filters, ...newFilters }
        this._applyFilters()
        this._notify('filters_changed')
    }

    setViewMode(mode) {
        if (this.state.viewMode !== mode) {
            this.state.viewMode = mode
            this._notify('view_mode_changed')
        }
    }

    setLoading(isLoading) {
        this.state.loading = isLoading
        this._notify('loading_changed')
    }

    // --- Logic ---

    /**
     * Applies current filters to the raw album list
     * Extracted from AlbumsView.filterAlbums
     */
    _applyFilters() {
        let result = [...this.state.albums]
        const q = this.state.filters.searchQuery.toLowerCase().trim()

        if (q) {
            result = result.filter(a =>
                a.title.toLowerCase().includes(q) ||
                a.artist.toLowerCase().includes(q)
            )
        }

        // Future: Add Genre/Year filters here

        this.state.filteredAlbums = result
    }

    /**
     * Validates if the current series is ready for playlist generation.
     * "Ultimate Goal": Every album must have a ranking source.
     */
    /**
     * Validates AND Fixes series readiness.
     * "Ultimate Goal": Every album must have a ranking source.
     * IMPROVEMENT: Proactively attempts to fallback to Original Order if data is missing.
     * @returns {Object} { isReady: boolean, warnings: Array<string> }
     */
    checkSeriesReadiness() {
        const warnings = []
        let hasModifications = false

        this.state.filteredAlbums.forEach(album => {
            // 1. Attempt Auto-Fix (Fallback to Original Order if needed)
            // Ensure we are calling the method on the model instance
            if (typeof album.ensureRankingIntegrity === 'function') {
                if (album.ensureRankingIntegrity()) {
                    hasModifications = true
                }
            }

            // 2. Validate Result
            // A "valid" strategy is: BestEver OR Spotify OR 'original' fallback
            const validStrategy = album.bestEverAlbumId || album.spotifyId || album.rankingSource === 'original' || album.rankingSource === 'popularity'

            if (!validStrategy) {
                warnings.push(`${album.title}: No ranking source`)
            }
        })

        if (hasModifications) {
            console.log('[AlbumsStateController] Integrity check applied automatic fallbacks.')
        }

        // Now we rarely block, unless something is catastrophic
        return {
            isReady: warnings.length === 0,
            unrankedCount: warnings.length,
            unrankedAlbums: warnings, // String array now
            warnings: warnings
        }
    }

    /**
     * Persist updated album to store/database
     * @param {Album} album 
     */
    async persistAlbum(album) {
        try {
            // Lazy import store to avoid circular deps if needed, 
            // Better: Pass store in constructor or use global store singleton pattern used in app.
            const { albumsStore } = await import('../../stores/albums.js')
            const { db } = await import('../../firebase-init.js')

            await albumsStore.updateAlbum(db, album)
            console.log(`[AlbumsStateController] Persisted album: ${album.title}`)

            // FIX: Update L2 Cache (APIClient Cache) to prevent stale data on reload/fetch
            try {
                const { apiClient } = await import('../../api/client.js')
                const query = `${album.artist} - ${album.title}`
                apiClient.cache.set(query, album)
                console.log('[AlbumsStateController] Updated L2 Cache for:', query)
            } catch (cacheErr) {
                console.warn('[AlbumsStateController] Failed to update cache:', cacheErr)
            }

            // Re-trigger readiness check?
            this._notify('albums_updated')
        } catch (err) {
            console.error('[AlbumsStateController] Failed to persist album:', err)
            // Ideally notify view of error via state
        }
    }

    // --- Observer Pattern ---

    subscribe(listener) {
        this.listeners.add(listener)
        return () => this.listeners.delete(listener) // Unsubscribe
    }

    _notify(event) {
        this.listeners.forEach(listener => listener(this.state, event))
    }
}
