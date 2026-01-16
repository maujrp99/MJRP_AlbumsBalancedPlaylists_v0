/**
 * SeriesController.js
 * 
 * V3 Architecture - The Brain Layer
 * 
 * Responsibilities:
 * 1. Data Orchestration: Fetching, filtering, sorting entities
 * 2. State Management: Current scope, active series, view mode
 * 3. Event Routing: Handles user actions, updates store, notifies view
 * 
 * DOES NOT: Manipulate DOM directly. Calls View.update() methods instead.
 */

import { albumsStore } from '../stores/albums.js';
import { albumSeriesStore } from '../stores/albumSeries.js';
import { getSeriesService } from '../services/SeriesService.js';
import { apiClient } from '../api/client.js';
import { optimizedAlbumLoader } from '../services/OptimizedAlbumLoader.js';
import { filterAlbums } from '../services/SeriesFilterService.js';
import { globalProgress } from '../components/GlobalProgress.js';
import toast from '../components/Toast.js';
import { userRankingRepository } from '../repositories/UserRankingRepository.js'; // Sprint 20

export default class SeriesController {
    constructor() {
        // State
        this.state = {
            currentScope: 'ALL',       // 'ALL' | 'SINGLE'
            targetSeriesId: null,
            // ARCH-FIX: Default to 'compact' (Grid) and persist user preference
            viewMode: localStorage.getItem('albumsViewMode') || 'compact',
            filterMode: 'all',         // 'all' | 'ranked' | 'unranked'
            filters: { artist: '', year: '', source: '' }, // Detailed filters
            searchQuery: '',
            seriesSortMode: 'count_asc', // Default: Smallest (Performance)
            isLoading: false,
            loadProgress: { current: 0, total: 0 }
        };

        // Abort controller for cancelling requests
        this.abortController = null;

        // View reference (set via setView)
        this.view = null;

        // Firestore db reference (set via init)
        this.db = null;

        // Bind methods
        this.handleSearch = this.handleSearch.bind(this);
        this.handleFilterMode = this.handleFilterMode.bind(this);
        this.handleFilterChange = this.handleFilterChange.bind(this);
        this.handleSort = this.handleSort.bind(this);
        this.handleViewModeChange = this.handleViewModeChange.bind(this);
    }

    /**
     * Initialize controller with dependencies
     * @param {Firestore} db - Firestore instance
     * @param {SeriesView} view - View reference for updates
     */
    init(db, view = null) {
        this.db = db;
        this.view = view;

        // Subscribe to store changes
        albumsStore.subscribe(() => this.onAlbumsChange());
        albumSeriesStore.subscribe(() => this.onSeriesChange());

        console.log('🧠 [V2] SeriesController Initialized');
    }

    /**
     * Set/Update view reference
     */
    setView(view) {
        this.view = view;
    }

    /**
     * Switch series without remounting the view (FIX #159)
     * Updates URL and loads new scope in-place
     * @param {string} seriesIdOrAll - 'all' or a specific series ID
     */
    switchSeries(seriesIdOrAll) {
        console.log(`[SeriesController] 🔄 switchSeries called: ${seriesIdOrAll}`);

        const scopeType = seriesIdOrAll === 'all' ? 'ALL' : 'SINGLE';
        const seriesId = seriesIdOrAll === 'all' ? null : seriesIdOrAll;

        // Update URL without triggering router remount
        const newUrl = seriesId ? `/albums?seriesId=${seriesId}` : '/albums';
        window.history.pushState({}, '', newUrl);

        // Load new scope - keeps View instance alive
        this.loadScope(scopeType, seriesId, false);
    }

    // =========================================
    // DATA LOADING
    // =========================================

    /**
     * Load a scope (ALL series or a SINGLE series)
     * @param {'ALL'|'SINGLE'} scopeType 
     * @param {string|null} seriesId 
     * @param {boolean} skipCache 
     */
    async loadScope(scopeType, seriesId = null, skipCache = false) {
        console.log(`[SeriesController] loadScope: ${scopeType}, seriesId=${seriesId}`);

        this.state.currentScope = scopeType;
        this.state.targetSeriesId = seriesId;

        // Update URL without reload
        const newUrl = seriesId ? `/albums?seriesId=${seriesId}` : '/albums';
        if (window.location.pathname + window.location.search !== newUrl) {
            window.history.pushState({}, '', newUrl);
        }

        // ARCH-FIX: Reset filters when switching scope to prevent context contamination
        this.state.filters = { artist: '', year: '', source: '' };
        this.state.searchQuery = '';
        this.notifyView('header', this.getHeaderData()); // Update header to clear any filter indicators

        try {
            const storeContextId = scopeType === 'ALL' ? 'ALL_SERIES_VIEW' : seriesId;

            // ARCH-SPEC: Check store cache BEFORE any clearing
            if (!skipCache && albumsStore.hasAlbumsForSeries(storeContextId)) {
                console.log(`[SeriesController] ✅ Cache HIT for ${storeContextId} - preventing reload`);
                albumsStore.setActiveAlbumSeriesId(storeContextId);

                // Sprint 20 Fix: Even on cache hit, we should ensure rankings are up to date
                // This prevents "lost" rankings after navigation if the store was preserved
                const cachedAlbums = albumsStore.getAlbumsForSeries(storeContextId);
                await this.refreshRankings(cachedAlbums); // Await ranking refresh

                if (scopeType === 'ALL') {
                    // Start background sync without clearing view
                    this.syncAllSeriesInBackground();
                } else if (seriesId) {
                    // Set active series for context
                    const series = albumSeriesStore.getSeries().find(s => s.id === seriesId);
                    if (series) albumSeriesStore.setActiveSeries(series.id);
                }

                // Notify view immediately with cached data
                this.notifyView('header', this.getHeaderData());
                this.notifyView('albums', albumsStore.getAlbumsForSeries(storeContextId));
                this.notifyView('loading', false);
                this.state.isLoading = false;
                return;
            }

            // Cache MISS - Only now do we clear and load
            // console.log(`[SeriesController] ⚠️ Cache MISS for ${storeContextId} - fetching fresh data`);
            this.state.isLoading = true;
            this.notifyView('loading', true);

            albumsStore.setActiveAlbumSeriesId(storeContextId);
            // albumsStore.clearAlbumSeries(storeContextId); // Safe to clear only if we are truly reloading

            // ARCH-FIX: Soft Loading - Do NOT clear albums immediately
            // this.notifyView('albums', []); 

            // Resolve queries to load
            let queriesToLoad = [];

            if (scopeType === 'ALL') {
                const db = albumSeriesStore.getDb()
                if (db) {
                    const service = getSeriesService(db, null, albumSeriesStore.getUserId())
                    await service.loadFromFirestore()
                }
                const allSeries = albumSeriesStore.getSeries();
                allSeries.forEach(s => {
                    // ARCH-FIX: Attach _sourceSeriesId to query to preserve context
                    if (s.albumQueries) {
                        const queriesWithContext = s.albumQueries.map(q => {
                            if (typeof q === 'string') {
                                // FIX: Parse string queries ensuring Artist field is populated
                                if (q.includes(' - ')) {
                                    const [artist, title] = q.split(' - ')
                                    return { artist: artist.trim(), title: title.trim(), _sourceSeriesId: s.id }
                                }
                                return { title: q, _sourceSeriesId: s.id }
                            }
                            return { ...q, _sourceSeriesId: s.id };
                        });
                        queriesToLoad.push(...queriesWithContext);
                    }
                });
                albumSeriesStore.setActiveSeries(null);
            } else {
                // Single series
                let series = albumSeriesStore.getSeries().find(s => s.id === seriesId);

                if (!series) {
                    // Retry logic for init race condition
                    let retries = 0;
                    while (retries < 5) {
                        try {
                            const db = albumSeriesStore.getDb()
                            if (db) {
                                const service = getSeriesService(db, null, albumSeriesStore.getUserId())
                                await service.loadFromFirestore()
                            }
                            break;
                        } catch (err) {
                            if (err.message.includes('Repository not initialized')) {
                                console.warn(`[SeriesController] Store not ready, retrying (${retries + 1}/5)...`);
                                await new Promise(r => setTimeout(r, 300));
                                retries++;
                            } else {
                                throw err;
                            }
                        }
                    }
                    if (retries >= 5) throw new Error('AlbumStore failed to initialize');
                    series = albumSeriesStore.getSeries().find(s => s.id === seriesId);
                }

                if (series) {
                    albumSeriesStore.setActiveSeries(series.id);
                    // ARCH-FIX: Attach context even for single series for consistency
                    queriesToLoad = (series.albumQueries || []).map(q => {
                        if (typeof q === 'string') {
                            // FIX: Parse string queries ensuring Artist field is populated
                            if (q.includes(' - ')) {
                                const [artist, title] = q.split(' - ')
                                return { artist: artist.trim(), title: title.trim(), _sourceSeriesId: series.id }
                            }
                            return { title: q, _sourceSeriesId: series.id }
                        }
                        return { ...q, _sourceSeriesId: series.id };
                    });
                }
            }

            // Notify view about header/series change
            this.notifyView('header', this.getHeaderData());

            // Load albums
            if (queriesToLoad.length > 0) {
                await this.loadAlbumsFromQueries(queriesToLoad, skipCache);
            } else {
                this.state.isLoading = false;
                this.notifyView('albums', []);
                this.notifyView('loading', false);
            }

        } catch (err) {
            console.error('[SeriesController] loadScope failed:', err);
            this.state.isLoading = false;
            this.notifyView('loading', false);
            toast.error('Failed to load series data');
        }
    }

    /**
     * Load albums from queries (with progress tracking)
     * @param {Array} queries - List of album queries
     * @param {boolean} skipCache 
     */
    async loadAlbumsFromQueries(queries, skipCache = false) {
        // Cancel previous requests
        if (this.abortController) {
            console.log('[SeriesController] Aborting previous fetch');
            this.abortController.abort();
            this.abortController = null;
        }
        this.abortController = new AbortController();

        // Set context for ghost prevention
        const targetSeries = albumSeriesStore.getActiveSeries();
        if (targetSeries) {
            albumsStore.setLastLoadedAlbumSeriesId(targetSeries.id);
        }

        this.state.isLoading = true;
        this.notifyView('loading', true);

        // albumsStore.reset(true);
        // ARCH-FIX: Soft Loading - Do NOT clear albums immediately
        // this.notifyView('albums', []);

        this.state.loadProgress = { current: 0, total: queries.length };
        // FIX #152B: notifyView('progress') removed - skeletons provide loading feedback

        try {
            const { results, errors } = await apiClient.fetchMultipleAlbums(
                queries,
                async (current, total, result) => {
                    if (this.abortController.signal.aborted) return;

                    this.state.loadProgress = { current, total };
                    const progressLabel = result.album
                        ? `Loading: ${result.album.artist} - ${result.album.title}`
                        : `Processing... (${Math.round((current / total) * 100)}%)`;
                    // FIX #152B: notifyView('progress') removed - skeletons provide loading feedback


                    if (result.status === 'success' && result.album) {
                        // ARCH-FIX: Pass sourceSeriesId from query context
                        const sourceSeriesId = result.query?._sourceSeriesId;
                        // Sprint 20 FIX: MUST AWAIT hydration to avoid race conditions with UI
                        await this.hydrateAndAddAlbum(result.album, sourceSeriesId);

                        // ARCH-6: Incremental render - sync with progress bar
                        this.notifyView('albums', albumsStore.getAlbums());
                    }
                },
                skipCache,
                this.abortController.signal
            );

            if (errors.length > 0) {
                console.warn(`${errors.length} albums failed to load`);
            }

        } catch (error) {
            console.error('[SeriesController] loadAlbumsFromQueries failed:', error);
            toast.error('Error loading albums. Please try again.');
        } finally {
            this.state.isLoading = false;
            globalProgress.finish();


            this.notifyView('loading', false);
            this.applyFilters();
        }
    }

    /**
     * Refresh the current view
     * Re-applies filters and notifies view.
     */
    refresh() {

        this.applyFilters();
    }

    /**
     * Hydrate album with cover and add to store
     * @param {Object} album - Album object
     * @param {string} sourceSeriesId - Series ID this album belongs to
     */
    async hydrateAndAddAlbum(album, sourceSeriesId) {
        if (!album.coverUrl && !album.artworkTemplate) {
            const localMatch = await optimizedAlbumLoader.findAlbum(album.artist, album.title);
            if (localMatch) {
                album.coverUrl = optimizedAlbumLoader.getArtworkUrl(localMatch, 500);
            }
        }

        // ARCH-FIX: Multi-series ownership support
        // Attach the source ID to the album instance so the View can strict-match it
        if (sourceSeriesId) {
            if (!album.seriesIds) album.seriesIds = [];
            if (!album.seriesIds.includes(sourceSeriesId)) {
                album.seriesIds.push(sourceSeriesId);
                // Also add legacy property for single-series backward compat if needed (optional)
                // album._seriesId = sourceSeriesId 
            }
        }

        // Sprint 20: Inject User Ranking
        try {
            const userId = albumSeriesStore.getUserId();
            const ranking = await userRankingRepository.getRanking(userId, album.id);
            if (ranking) {
                // rankings record contains a '.rankings' array
                const rankArray = ranking.rankings || (Array.isArray(ranking) ? ranking : [])
                album.setUserRankings(rankArray);
            }
        } catch (err) {
            console.error('[SeriesController] Failed to inject user ranking:', err);
        }

        albumsStore.addAlbum(album);

        // Save to Firestore (non-blocking)
        if (this.db) {
            albumsStore.saveToFirestore(this.db, album).catch(console.warn);
        }
    }

    /**
     * Refresh rankings for a list of albums (e.g. after cache hit)
     * @param {Album[]} albums 
     */
    async refreshRankings(albums) {
        if (!albums || albums.length === 0) return;
        const userId = albumSeriesStore.getUserId();
        if (!userId) {
            console.warn('[SeriesController] Cannot refresh rankings - no user ID');
            return;
        }

        console.log(`[SeriesController] Refreshing rankings for ${albums.length} albums...`);
        const promises = albums.map(async (album) => {
            try {
                const ranking = await userRankingRepository.getRanking(userId, album.id);
                if (ranking) {
                    const rankArray = ranking.rankings || (Array.isArray(ranking) ? ranking : [])
                    album.setUserRankings(rankArray);
                }
            } catch (err) {

            }
        });

        await Promise.all(promises);
        this.notifyView('albums', albumsStore.getAlbums()); // Refresh view
    }

    // =========================================
    // FILTERING & SORTING
    // =========================================

    /**
     * Handle search query change
     */
    handleSearch(query) {
        this.state.searchQuery = query;
        this.applyFilters();
    }

    /**
     * Handle filter mode change (Ranked/Unranked)
     */
    handleFilterMode(mode) {
        this.state.filterMode = mode;
        this.applyFilters();
    }

    /**
     * Handle explicit filter change (Artist, Year, Source)
     * @param {string} type - 'artist' | 'year' | 'source'
     * @param {string} value 
     */
    handleFilterChange(type, value) {
        if (!this.state.filters) this.state.filters = {};
        this.state.filters[type] = value;
        this.applyFilters();
    }

    /**
     * Handle view mode change (Grid/List/Expanded)
     * @param {string} mode - 'grid' | 'list' | 'compact' | 'expanded'
     */
    handleViewModeChange(mode) {

        this.state.viewMode = mode;
        localStorage.setItem('albumsViewMode', mode);

        // Trigger re-render by re-applying filters (which notifies view 'albums')
        // We also explicitly notify 'header' just in case view depends on mode there
        this.applyFilters();
    }

    /**
     * Handle sort change
     */
    /**
     * Handle sort change
     */
    handleSort(sortKey) {

        this.state.seriesSortMode = sortKey;
        this.notifyView('header', this.getHeaderData());
    }

    /**
     * Get sorted series list based on current mode
     */
    getSortedSeries(seriesList) {
        if (!seriesList) return [];
        const mode = this.state.seriesSortMode || 'count_asc'; // Default: Smallest first (Performance)

        return [...seriesList].sort((a, b) => {
            switch (mode) {
                case 'alpha':
                    return a.name.localeCompare(b.name);
                case 'alpha_desc':
                    return b.name.localeCompare(a.name);
                case 'count_asc':
                    // ARCH-FIX: Use albumQueries as proxy for series size (more reliable than hydrating albums)
                    return (a.albumQueries?.length || 0) - (b.albumQueries?.length || 0);
                case 'count_desc':
                    return (b.albumQueries?.length || 0) - (a.albumQueries?.length || 0);
                case 'recent':
                    // Fallback to ID or created date if available
                    return (b.createdAt || 0) - (a.createdAt || 0);
                default:
                    return 0;
            }
        });
    }

    /**
     * Apply current filters to albums and notify view
     */
    applyFilters() {
        // ARCH-FIX: Select data source based on scope to prevent ghosting
        let allAlbums;
        if (this.state.currentScope === 'SINGLE' && this.state.targetSeriesId) {
            // Explicitly fetch only this series' albums from store map
            allAlbums = albumsStore.getAlbumsForSeries(this.state.targetSeriesId);
        } else {
            // Use default behavior (relies on ActiveAlbumSeriesId being set in Store)
            allAlbums = albumsStore.getAlbums();
        }

        // Sprint 17: Use pure service for filtering (T17-202)
        const filtered = filterAlbums(allAlbums, {
            searchQuery: this.state.searchQuery,
            filters: this.state.filters || {},
            // Wait, this.state.filters was not explicit in constructor but SeriesView had it.
            // I need to ensure SeriesController tracks 'filters'.
            // In Constructor, only 'filterMode' was there.
            // SeriesToolbar props passed `filters: this.filters` from View.
            // I need to add filters to Controller state!
            filterMode: this.state.filterMode
        });

        this.notifyView('albums', filtered);
    }

    // =========================================
    // VIEW NOTIFICATIONS
    // =========================================

    /**
     * Notify view of state changes
     * @param {string} type - Update type (loading, albums, progress, header)
     * @param {*} data - Update data
     */
    notifyView(type, data) {
        if (!this.view) return;

        switch (type) {
            case 'loading':
                if (this.view.setLoading) this.view.setLoading(data);
                break;
            case 'albums':
                // FIX #152: Pass isLoading to view so GridRenderer can distinguish:
                // - Empty + isLoading = Show Skeleton
                // - Empty + !isLoading = Filtered out (hide)
                if (this.view.updateAlbums) this.view.updateAlbums(data, this.state.isLoading);
                break;
            case 'progress':
                if (this.view.updateProgress) this.view.updateProgress(data);
                break;
            case 'header':
                if (this.view.updateHeader) this.view.updateHeader(data);
                break;
        }
    }

    // =========================================
    // STORE SUBSCRIPTIONS
    // =========================================

    onAlbumsChange() {
        if (!this.state.isLoading) {
            // ARCH-FIX: Ensure we fetch the correct scope's data to avoid "flashing" wrong sets
            let albums;
            if (this.state.currentScope === 'SINGLE' && this.state.targetSeriesId) {
                albums = albumsStore.getAlbumsForSeries(this.state.targetSeriesId);
                // Apply filters manually since getAlbumsForSeries returns raw data
                // Wait, notifyView('albums') expects filtered data if we rely on applyFilters?
                // Actually applyFilters() gets albumsStore.getAlbums().
                // Let's defer to applyFilters() but ensure store active ID is correct?
                // Safer: Just call applyFilters() which is the central point for "Get From Store -> Filter -> Notify".
                this.applyFilters();
                return;
            }

            // Fallback for ALL scope or general updates
            this.applyFilters();
        }
    }

    onSeriesChange() {
        this.notifyView('header', this.getHeaderData());
    }

    // =========================================
    // HELPERS
    // =========================================

    getHeaderData() {
        const activeSeries = albumSeriesStore.getActiveSeries();
        const allSeries = albumSeriesStore.getSeries();

        return {
            title: activeSeries?.name || 'All Albums Series',
            description: activeSeries?.description || `${allSeries.length} series available`,
            seriesList: this.getSortedSeries(allSeries),
            activeSeriesId: activeSeries?.id || null
        };
    }

    /**
     * Background Sync for ALL Series View
     * Fetches series definitions without clearing the view.
     */
    async syncAllSeriesInBackground() {

        const db = albumSeriesStore.getDb();
        if (db) {
            const service = getSeriesService(db, null, albumSeriesStore.getUserId())
            await service.loadFromFirestore()
            // Notify header in case series list changed size
            this.notifyView('header', this.getHeaderData());
        }
    }

    getState() {
        return { ...this.state };
    }
}
