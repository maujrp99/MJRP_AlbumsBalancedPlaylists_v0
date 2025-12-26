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
import { apiClient } from '../api/client.js';
import { optimizedAlbumLoader } from '../services/OptimizedAlbumLoader.js';
import { globalProgress } from '../components/GlobalProgress.js';
import toast from '../components/Toast.js';

export default class SeriesController {
    constructor() {
        // State
        this.state = {
            currentScope: 'ALL',       // 'ALL' | 'SINGLE'
            targetSeriesId: null,
            viewMode: 'grid',          // 'grid' | 'list'
            filterMode: 'all',
            searchQuery: '',
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
        this.handleFilter = this.handleFilter.bind(this);
        this.handleSort = this.handleSort.bind(this);
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

        console.log('🧠 SeriesController Initialized');
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

        try {
            const storeContextId = scopeType === 'ALL' ? 'ALL_SERIES_VIEW' : seriesId;

            // ARCH-6: Check store cache BEFORE loading
            if (!skipCache && albumsStore.hasAlbumsForSeries(storeContextId)) {
                console.log('[SeriesController] ✅ Cache HIT - instant render');
                albumsStore.setActiveAlbumSeriesId(storeContextId);
                albumSeriesStore.setActiveSeries(scopeType === 'ALL' ? null : seriesId);
                this.notifyView('header', this.getHeaderData());
                this.notifyView('albums', albumsStore.getAlbumsForSeries(storeContextId));
                this.notifyView('loading', false);
                this.state.isLoading = false;
                return;
            }

            // Cache MISS - proceed with loading
            this.state.isLoading = true;
            this.notifyView('loading', true);

            albumsStore.setActiveAlbumSeriesId(storeContextId);
            albumsStore.clearAlbumSeries(storeContextId); // Clear only this series

            this.notifyView('albums', []);

            // Resolve queries to load
            let queriesToLoad = [];

            if (scopeType === 'ALL') {
                await albumSeriesStore.loadFromFirestore();
                const allSeries = albumSeriesStore.getSeries();
                allSeries.forEach(s => {
                    if (s.albumQueries) queriesToLoad.push(...s.albumQueries);
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
                            await albumSeriesStore.loadFromFirestore();
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
                    queriesToLoad = series.albumQueries || [];
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

        albumsStore.reset(true);
        this.notifyView('albums', []);

        this.state.isLoading = true;
        this.state.loadProgress = { current: 0, total: queries.length };
        this.notifyView('loading', true);
        this.notifyView('progress', this.state.loadProgress);

        try {
            const { results, errors } = await apiClient.fetchMultipleAlbums(
                queries,
                (current, total, result) => {
                    if (this.abortController.signal.aborted) return;

                    this.state.loadProgress = { current, total };
                    const progressLabel = result.album
                        ? `Loading: ${result.album.artist} - ${result.album.title}`
                        : `Processing... (${Math.round((current / total) * 100)}%)`;

                    this.notifyView('progress', { current, total, label: progressLabel });

                    if (result.status === 'success' && result.album) {
                        this.hydrateAndAddAlbum(result.album);
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

            const finalAlbums = albumsStore.getAlbums();
            console.log('[SeriesController] Load complete:', finalAlbums?.length, 'albums');

            this.notifyView('loading', false);
            this.notifyView('albums', finalAlbums);
        }
    }

    /**
     * Hydrate album with cover and add to store
     */
    async hydrateAndAddAlbum(album) {
        if (!album.coverUrl && !album.artworkTemplate) {
            const localMatch = await optimizedAlbumLoader.findAlbum(album.artist, album.title);
            if (localMatch) {
                album.coverUrl = optimizedAlbumLoader.getArtworkUrl(localMatch, 500);
            }
        }

        albumsStore.addAlbum(album);

        // Save to Firestore (non-blocking)
        if (this.db) {
            albumsStore.saveToFirestore(this.db, album).catch(console.warn);
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
     * Handle filter mode change
     */
    handleFilter(mode) {
        this.state.filterMode = mode;
        this.applyFilters();
    }

    /**
     * Handle sort change
     */
    handleSort(sortKey) {
        console.log('[SeriesController] Sort by:', sortKey);
        // TODO: Implement sorting logic
        this.applyFilters();
    }

    /**
     * Apply current filters to albums and notify view
     */
    applyFilters() {
        const allAlbums = albumsStore.getAlbums();
        let filtered = [...allAlbums];

        // Text search
        if (this.state.searchQuery) {
            const q = this.state.searchQuery.toLowerCase();
            filtered = filtered.filter(a =>
                a.title?.toLowerCase().includes(q) ||
                a.artist?.toLowerCase().includes(q)
            );
        }

        // Filter mode
        if (this.state.filterMode === 'ranked') {
            filtered = filtered.filter(a => a.rankingStatus === 'RANKED');
        } else if (this.state.filterMode === 'unranked') {
            filtered = filtered.filter(a => a.rankingStatus !== 'RANKED');
        }

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
                if (this.view.updateAlbums) this.view.updateAlbums(data);
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
            // Only update if not in middle of loading
            this.notifyView('albums', albumsStore.getAlbums());
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
            seriesList: allSeries,
            activeSeriesId: activeSeries?.id || null
        };
    }

    getState() {
        return { ...this.state };
    }
}
