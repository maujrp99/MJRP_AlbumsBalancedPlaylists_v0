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
import { ownRankingsStore } from '../stores/ownRankings.js';
import { ownRankingService } from '../services/ranking/ownRanking.js';
import { filterSeries, countUnchecked, readsFacts } from '../models/seriesFilter.js';
import { countAlbums } from '../models/seriesCounts.js';
import { rankedQueryKeys } from '../models/ownRanking.js';
import { decodeEntities } from '../models/text.js';
import { paginate, takeFirst, normalizePageSize, PagingMode } from '../models/paging.js';
import { AlbumStatus } from '../models/albumLoadState.js';
import toast from '../components/Toast.js';
import { router } from '../router.js';
import { filterUseOf } from '../models/filterUse.js';
import { track } from '../services/usage/track.js';

/** F77: a filter, a search or an order chosen on the albums screen (never what was chosen). */
function measureFilter(type, value, before) {
    const use = filterUseOf('albums', type, value, before);
    if (use) track('filter_used', use);
}

/** The order the albums screen opens in: «Newest», the series created last first (UAT-227). */
const DEFAULT_SERIES_ORDER = 'recent_desc'

/** The address of the albums screen at a scope: one series, or all of them. */
const scopeAddress = (seriesId) => (seriesId ? `/albums?seriesId=${seriesId}` : '/albums');

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
            seriesSortMode: DEFAULT_SERIES_ORDER, // the series created last first (UAT-227)
            isLoading: false,
            loadProgress: { current: 0, total: 0 },
            // Paging of the series on screen: numbered pages or a list that grows on scroll
            pagingMode: localStorage.getItem('albumsPagingMode') === PagingMode.SCROLL ? PagingMode.SCROLL : PagingMode.PAGES,
            pageSize: normalizePageSize(localStorage.getItem('albumsPageSize')),
            page: 1,
            shownCount: normalizePageSize(localStorage.getItem('albumsPageSize'))
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
            albumSeriesStore.subscribe(() => this.onSeriesChange()),
            ownRankingsStore.subscribe(() => this.onOwnRankingsChange())
        ];

        console.log('🧠 [V2] SeriesController Initialized');
    }

    /**
     * Set/Update view reference
     */
    setView(view) {
        this.view = view;
    }

    /**
     * The screen was closed. The controller lives for the whole session, so it lets go of the view
     * and of its subscriptions: nothing is drawn into a screen that is gone. The load itself goes
     * on in the service, and the next visit shows the progress it has made.
     * @param {SeriesView} view - only the view that is attached may detach
     */
    detachView(view) {
        if (this.view !== view) return;
        this._unsubscribers.forEach(unsubscribe => unsubscribe());
        this._unsubscribers = [];
        this.view = null;
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
     * @param {{ entering?: boolean }} [options] - entering: the screen has just been opened at this
     *        scope, so its address is only rewritten the canonical way (no history entry: F63)
     */
    async loadScope(scopeType, seriesId = null, skipCache = false, { entering = false } = {}) {
        console.log(`[SeriesController] loadScope: ${scopeType}, seriesId=${seriesId}`);

        this.state.currentScope = scopeType;
        this.state.targetSeriesId = seriesId;

        // The address follows the scope, through the router (the one owner of the history)
        router.setAddress(scopeAddress(seriesId), { replace: entering });

        albumSeriesStore.setActiveSeries(scopeType === 'ALL' ? null : seriesId);
        albumsStore.setActiveAlbumSeriesId(scopeType === 'ALL' ? ALL_SERIES_CONTEXT : seriesId);

        // Reset filters when switching scope to prevent context contamination
        this.state.filters = { artist: '', year: '', source: '' };
        this.state.searchQuery = '';
        this.resetPaging();
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
        const isAll = this.state.currentScope === 'ALL';
        const { groups } = this.getPageView();

        albumLoadService.load({
            scopeKey: isAll ? ALL_SCOPE : singleScope(this.state.targetSeriesId),
            series: groups.map(group => ({ id: group.series.id, albumQueries: group.series.albumQueries || [] })),
            fresh
        });
        this.renderFromStore();
    }

    /**
     * What the screen shows now: the series that pass the filters, cut to the current page.
     * The filter reads the series themselves, so it answers the same on any page.
     * @returns {{ groups: Array<{ series, queries, keys }>, paging: Object }}
     */
    getPageView() {
        const sorted = this.getSortedSeries(this.getScreenSeries());
        const isAll = this.state.currentScope === 'ALL';
        const source = this.state.filters?.source;
        const matching = filterSeries(sorted, {
            seriesId: isAll ? null : this.state.targetSeriesId,
            artist: this.state.filters?.artist,
            year: this.state.filters?.year,
            source,
            search: this.state.searchQuery
        }, { ownRankedKeys: this.getOwnRankedKeys() });

        // A filter that reads the facts of the series cannot answer for a query never checked
        // against the sources: the screen says how many there are, in the scope it is showing.
        const scoped = isAll ? sorted : sorted.filter(series => series.id === this.state.targetSeriesId);
        const unchecked = readsFacts(source) ? countUnchecked(scoped, source) : 0;

        const { pagingMode, pageSize } = this.state;
        const cut = pagingMode === PagingMode.SCROLL
            ? { ...takeFirst(matching, this.state.shownCount), page: 1, pages: 1 }
            : { ...paginate(matching, { page: this.state.page, size: pageSize }), hasMore: false };
        this.state.page = cut.page;

        return {
            groups: cut.items,
            paging: {
                mode: pagingMode, size: pageSize, page: cut.page, pages: cut.pages,
                total: cut.total, from: cut.from, to: cut.to, hasMore: cut.hasMore,
                totalSeries: sorted.length,
                albums: countAlbums(cut.items), // of the series on screen: this page, or what the scroll has loaded so far (F72)
                single: !isAll, // one series on screen: nothing to page, only the notice may show
                unchecked
            }
        };
    }

    /**
     * The series as the screen shows them: a name stored with HTML entities (UAT-180) is shown plain.
     */
    getScreenSeries() {
        return albumSeriesStore.getSeries().map(series =>
            (typeof series.name === 'string' && series.name.includes('&'))
                ? { ...series, name: decodeEntities(series.name) }
                : series);
    }

    /**
     * Keys of the queries the person has ranked (the 'My Ranking' filter), over every series:
     * the list of ranked albums, read once by OwnRankingService, matched to the queries by name,
     * plus the loaded albums that carry a ranking (exact, whatever their name).
     */
    getOwnRankedKeys() {
        if (this.state.filters?.source !== 'user') return new Set();

        const loadedKeys = [];
        albumLoadStore.getSeriesIds().forEach(id => albumLoadStore.getEntries(id).forEach(entry => {
            if (entry.album?.hasUserRanking) loadedKeys.push(entry.key);
        }));
        return rankedQueryKeys(albumSeriesStore.getSeries(), ownRankingsStore.getIndex(), loadedKeys);
    }

    /**
     * Save the person's ranking of an album (the ranking modal reports here) and ask the load to
     * read that source again for that album, so the screen shows it without loading anything else.
     * @returns {Promise<boolean>} true when it was saved
     */
    async saveRanking(album, rankings) {
        const saved = await ownRankingService.save(album, rankings);
        if (saved) albumLoadService.refreshSource(album.id, 'userRanking');
        return saved;
    }

    /**
     * Where the Spotify popularity of a loaded album is (EnrichmentStatus), for the line the album
     * shows about it (F69). Null when the load does not have that album.
     */
    getPopularityStatus(albumId) {
        for (const seriesId of albumLoadStore.getSeriesIds()) {
            const entry = albumLoadStore.getEntries(seriesId).find(item => item.album?.id === albumId);
            if (entry) return entry.enrichment.popularity;
        }
        return null;
    }

    /** Ask Spotify again for the popularity of one album, through the album load (F69). */
    askPopularity(albumId) {
        return albumLoadService.refreshSource(albumId, 'popularity');
    }

    /** The series on screen, in order (what the grid groups the albums by). */
    getVisibleSeriesList() {
        return this.getPageView().groups.map(group => group.series);
    }

    // =========================================
    // PAGING
    // =========================================

    /** Go to a numbered page. */
    handlePage(page) {
        this.state.page = Number(page) || 1;
        this.requestLoad(false);
    }

    /** Change how many series a page has (10 to 100). */
    handlePageSize(size) {
        this.state.pageSize = normalizePageSize(size);
        localStorage.setItem('albumsPageSize', String(this.state.pageSize));
        this.resetPaging();
        this.requestLoad(false);
    }

    /** Switch between numbered pages and the list that grows on scroll. */
    handlePagingMode(mode) {
        this.state.pagingMode = mode === PagingMode.SCROLL ? PagingMode.SCROLL : PagingMode.PAGES;
        localStorage.setItem('albumsPagingMode', this.state.pagingMode);
        this.resetPaging();
        this.requestLoad(false);
    }

    /** Show one more batch of series (the growing list). */
    handleShowMore() {
        this.state.shownCount += this.state.pageSize;
        this.requestLoad(false);
    }

    /** Back to the first page: called whenever the filters, the order or the size change. */
    resetPaging() {
        this.state.page = 1;
        this.state.shownCount = this.state.pageSize;
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
     * "Refetch" on an album card: the album is loaded again by the album load, through its queue
     * and its state. The card shows as loading, a failure shows as the failure of that album with
     * "Try again", and nothing is written to the screen from here.
     * @param {Object} album
     */
    handleRefetchMetadata(album) {
        if (!album?.id) return;

        const asked = albumLoadService.reloadAlbum(album.id);
        if (asked > 0) toast.info(`Loading "${album.title}" again...`);
        else toast.error(`"${album.title}" is not loaded on this screen`);
    }

    // =========================================
    // FILTERING & SORTING
    // =========================================

    /**
     * Handle search query change
     */
    handleSearch(query) {
        measureFilter('search', query, this.state.searchQuery);
        this.state.searchQuery = query;
        this.resetPaging();
        this.requestLoad(false);
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
        measureFilter(type, value, this.state.filters[type]);
        this.state.filters[type] = value;
        // 'My Ranking' answers from the list of ranked albums: one read, the first time it is asked
        if (type === 'source' && value === 'user') ownRankingService.ensureLoaded();
        this.resetPaging();
        this.requestLoad(false);
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
        measureFilter('sort', sortKey, this.state.seriesSortMode);

        this.state.seriesSortMode = sortKey;
        this.resetPaging();
        this.notifyView('header', this.getHeaderData());
        this.requestLoad(false);
    }

    /**
     * Get sorted series list based on current mode
     */
    getSortedSeries(seriesList) {
        if (!seriesList) return [];
        const mode = this.state.seriesSortMode || DEFAULT_SERIES_ORDER

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
     * Notify the view with the albums of the series on screen that pass the filters.
     * A loaded album is shown when the query it came from passed the filter.
     */
    applyFilters() {
        const { groups } = this.getPageView();
        const albums = groups.flatMap(group =>
            albumLoadStore.getEntries(group.series.id)
                .filter(entry => entry.status === AlbumStatus.FOUND && entry.album && group.keys.has(entry.key))
                .map(entry => entry.album));

        this.notifyView('albums', albums);
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

    /** The list of ranked albums arrived or changed: only the 'My Ranking' filter depends on it. */
    onOwnRankingsChange() {
        if (this.state.filters?.source === 'user' && this.view) this.requestLoad(false);
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
            title: decodeEntities(activeSeries?.name) || 'All Albums Series',
            description: activeSeries?.description || `${allSeries.length} series available`,
            seriesList: this.getVisibleSeriesList(),
            activeSeriesId: activeSeries?.id || null
        };
    }

    getState() {
        return { ...this.state };
    }
}
