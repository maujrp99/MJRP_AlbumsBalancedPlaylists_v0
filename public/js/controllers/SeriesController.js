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
import { albumLoadStore } from '../stores/albumLoad.js';
import { albumLoadService, ALL_SERIES_CONTEXT, ALL_SCOPE, singleScope } from '../services/albums/albumLoading.js';
import { filterAlbums } from '../services/SeriesFilterService.js';
import toast from '../components/Toast.js';

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

        // Subscriptions of the current visit (ended on the next init, so they never pile up)
        this._unsubscribers = [];
        this._renderScheduled = false;

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

        // Subscribe to store changes, ending the subscriptions of the previous visit first
        this._unsubscribers.forEach(unsubscribe => unsubscribe());
        this._unsubscribers = [
            albumLoadStore.subscribe(() => this.renderFromStore()),
            albumsStore.subscribe(() => this.onAlbumsChange()),
            albumSeriesStore.subscribe(() => this.onSeriesChange())
        ];

        console.log('🧠 [V2] SeriesController Initialized');
    }

    /**
     * Set/Update view reference
     */
    setView(view) {
        this.view = view;
    }

    // =========================================
    // DATA LOADING
    // =========================================

    /**
     * Load a scope (ALL series or a SINGLE series).
     * The controller only says what the screen wants; the load belongs to AlbumLoadService.
     * @param {'ALL'|'SINGLE'} scopeType
     * @param {string|null} seriesId
     * @param {boolean} skipCache - search everything again (the Refresh button)
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

        albumSeriesStore.setActiveSeries(scopeType === 'ALL' ? null : seriesId);
        albumsStore.setActiveAlbumSeriesId(scopeType === 'ALL' ? ALL_SERIES_CONTEXT : seriesId);

        // Reset filters when switching scope to prevent context contamination
        this.state.filters = { artist: '', year: '', source: '' };
        this.state.searchQuery = '';
        this.notifyView('header', this.getHeaderData());

        try {
            // What is already known is shown at once; the list of series is then read again,
            // so a series created, edited or removed elsewhere is reconciled.
            if (albumSeriesStore.getSeries().length > 0) this.requestLoad(skipCache);
            await this.refreshSeriesList();
            this.requestLoad(albumSeriesStore.getSeries().length > 0 ? false : skipCache);
            this.notifyView('header', this.getHeaderData());
        } catch (err) {
            console.error('[SeriesController] loadScope failed:', err);
            toast.error('Failed to load series data');
            this.renderFromStore();
        }
    }

    /** Read the list of series again from the database. */
    async refreshSeriesList() {
        const db = albumSeriesStore.getDb();
        if (!db) return;
        const service = getSeriesService(db, null, albumSeriesStore.getUserId());
        await service.loadFromFirestore();
    }

    /**
     * Ask the load service for the series of the current scope, in the order the screen shows them.
     * Safe to call again at any time: the service keeps what it has and loads only what is new.
     * @param {boolean} fresh - search everything again, ignoring the cache
     */
    requestLoad(fresh = false) {
        const sorted = this.getSortedSeries(albumSeriesStore.getSeries());
        const isAll = this.state.currentScope === 'ALL';
        const series = isAll ? sorted : sorted.filter(s => s.id === this.state.targetSeriesId);

        albumLoadService.load({
            scopeKey: isAll ? ALL_SCOPE : singleScope(this.state.targetSeriesId),
            series: series.map(s => ({ id: s.id, albumQueries: s.albumQueries || [] })),
            fresh
        });
        this.renderFromStore();
    }

    /** Try again the albums of a series that did not load. */
    retrySeries(seriesId) {
        albumLoadService.retryFailed(seriesId);
    }

    /** The load state of each series on screen: loading, complete, failed or empty, with counts. */
    getSeriesStates() {
        return albumLoadStore.getSeriesStates();
    }

    /**
     * Refresh the current view
     * Re-applies filters and notifies view.
     */
    refresh() {
        this.applyFilters();
    }

    /** One redraw per tick, however many stores changed in it. */
    renderFromStore() {
        if (this._renderScheduled) return;
        this._renderScheduled = true;
        queueMicrotask(() => {
            this._renderScheduled = false;
            this.state.isLoading = albumLoadStore.isLoading();
            this.notifyView('loading', this.state.isLoading);
            this.applyFilters();
        });
    }

    /**
     * Handle refetching metadata for an album
     * @param {Object} album 
     */
    async handleRefetchMetadata(album) {
        if (!album || !album.title) return;

        try {
            this.notifyView('loading', true);
            toast.info(`Refetching metadata for "${album.title}"...`);

            // Use SeriesService directly as it now encapsulates the logic
            // Get service instance (using current user ID)
            const userId = albumSeriesStore.getUserId();
            const db = albumSeriesStore.getDb();
            const seriesService = getSeriesService(db, null, userId);

            // Fetch!
            // Note: We use the current target series ID context if available, or just null for general update
            // Passing seriesId ensures if the album is in a specific series cache context, it gets updated there too.
            const seriesId = this.state.targetSeriesId || 'ALL_SERIES_VIEW';

            const enrichedAlbum = await seriesService.refetchAlbumMetadata(album, seriesId);
            await albumLoadService.adoptAlbum(enrichedAlbum);

            toast.success(`Metadata updated for "${enrichedAlbum.title}"`);

            // UI should update automatically via store subscription (onAlbumsChange -> applyFilters -> notifyView)

        } catch (error) {
            console.error('[SeriesController] Refetch failed:', error);
            toast.error(`Refetch failed: ${error.message}`);
        } finally {
            this.notifyView('loading', false);
        }
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
                case 'recent_desc':
                case 'recent': // legacy support
                    // Fallback to ID or created date if available
                    return (b.createdAt || 0) - (a.createdAt || 0);
                case 'recent_asc':
                    return (a.createdAt || 0) - (b.createdAt || 0);
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
        this.renderFromStore();
    }

    /** The series changed (created, renamed, an album added or removed): reconcile the load. */
    onSeriesChange() {
        this.notifyView('header', this.getHeaderData());
        const known = JSON.stringify(albumSeriesStore.getSeries().map(s => [s.id, s.albumQueries || []]));
        if (known !== this._knownSeries) {
            this._knownSeries = known;
            if (this.view) this.requestLoad(false);
        }
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

    getState() {
        return { ...this.state };
    }
}
