/**
 * SeriesView.js
 * 
 * V3 Architecture: THIN ORCHESTRATOR
 * 
 * This view is a thin shell that:
 * 1. Renders the basic page structure (header, toolbar mount, grid mount)
 * 2. Mounts V3 components (SeriesHeader, SeriesToolbar, SeriesGridRenderer)
 * 3. Delegates all rendering to components (which use existing production functions)
 * 
 * The components internally reuse AlbumsGridRenderer/AlbumsScopedRenderer functions,
 * ensuring 100% feature parity with AlbumsView.
 */

import { BaseView } from './BaseView.js';
import { db } from '../firebase-init.js';
import { albumsStore } from '../stores/albums.js';
import { albumSeriesStore } from '../stores/albumSeries.js';
import { router } from '../router.js';
import { InlineProgress } from '../components/InlineProgress.js';
import { Breadcrumb } from '../components/Breadcrumb.js';
import { getIcon } from '../components/Icons.js';
import { Autocomplete } from '../components/Autocomplete.js';
import { optimizedAlbumLoader } from '../services/OptimizedAlbumLoader.js';
import { toast } from '../components/Toast.js';

// V3 Components
import SeriesHeader from '../components/series/SeriesHeader.js';
import SeriesToolbar from '../components/series/SeriesToolbar.js';
import SeriesGridRenderer from '../components/series/SeriesGridRenderer.js';
import SeriesEventHandler from '../components/series/SeriesEventHandler.js';
import SeriesModals from '../components/series/SeriesModals.js';

// Utilities (for filtering)
import {
    filterAlbums as filterAlbumsFn,
    getUniqueArtists as getUniqueArtistsFn
} from './albums/index.js';
import { escapeHtml } from '../utils/stringUtils.js';

// Ranking component for expanded view
import { TracksRankingComparison } from '../components/ranking/TracksRankingComparison.js';

// Sprint 12: Enrichment integration - auto-apply cached Spotify data
import { applyEnrichmentToAlbums } from '../helpers/SpotifyEnrichmentHelper.js';

export default class SeriesView extends BaseView {
    constructor(controller) {
        super();
        this.controller = controller;
        this.components = {};

        // State
        this.currentScope = 'ALL';
        this.targetSeriesId = null;
        this.searchQuery = '';
        this.filters = { artist: 'all', year: 'all', source: 'all' };
        this.viewMode = localStorage.getItem('albumsViewMode') || 'compact';
        this.isLoading = false;

        // Progress
        this.inlineProgress = null;
    }

    /**
     * Render - Returns a thin shell with mount points for components
     */
    async render(params) {
        return `
            <div class="albums-view container">
                <!-- Header Component Mount -->
                <header class="view-header mb-8 fade-in">
                    <div id="series-header-mount"></div>
                    <div id="series-toolbar-mount"></div>
                </header>

                <!-- Grid Component Mount -->
                <div id="series-grid-mount"></div>

                <!-- Empty State (shown when no albums) -->
                <div id="emptyStateContainer"></div>
                
                <!-- Footer -->
                <footer class="view-footer mt-12 text-center text-muted text-sm border-t border-white/5 pt-6">
                    <p class="last-update">Last updated: ${new Date().toLocaleTimeString()}</p>
                </footer>

                <!-- Series Modals Mount Point -->
                <div id="series-modals-mount"></div>
            </div>
        `;
    }

    /**
     * Mount - Initialize and mount all V3 components
     */
    async mount(params) {
        console.log('[SeriesView] Mounting...', params);

        // Initialize container reference
        this.container = document.getElementById('app');

        // Determine scope from URL
        const urlParams = new URLSearchParams(window.location.search);
        const seriesId = params?.seriesId || urlParams.get('seriesId');

        if (seriesId && seriesId !== 'undefined' && seriesId !== 'null') {
            this.currentScope = 'SINGLE';
            this.targetSeriesId = seriesId;
        } else {
            this.currentScope = 'ALL';
            this.targetSeriesId = null;
        }

        // Link controller
        if (this.controller) {
            this.controller.setView(this);
            this.controller.init(db, this);
        }

        // Mount V3 components
        await this.mountHeader();
        await this.mountToolbar();
        await this.mountGrid();

        // Setup event handler for card actions (CRUD)
        this.setupEventHandler();

        // Mount SeriesModals component (Edit/Delete)
        this.mountSeriesModals();

        // Attach breadcrumb listeners
        Breadcrumb.attachListeners(this.container);

        // Load data via controller
        if (this.controller) {
            await this.controller.loadScope(this.currentScope, this.targetSeriesId);
        }

        console.log('[SeriesView] All components mounted ✅');
    }

    // =========================================
    // COMPONENT MOUNTING
    // =========================================

    async mountHeader() {
        const mount = document.getElementById('series-header-mount');
        if (!mount) return;

        const activeSeries = albumSeriesStore.getActiveSeries();
        const albums = albumsStore.getAlbums();
        const pageTitle = this.currentScope === 'ALL'
            ? 'All Albums Series'
            : (activeSeries ? escapeHtml(activeSeries.name) : 'Albums');

        this.components.header = new SeriesHeader({
            container: mount,
            props: {
                pageTitle,
                albumCount: albums.length,
                onGeneratePlaylists: () => {
                    const activeSeries = albumSeriesStore.getActiveSeries();
                    if (activeSeries) {
                        router.navigate(`/blend?seriesId=${activeSeries.id}`);
                    } else {
                        router.navigate('/blend');
                    }
                }
            }
        });
        this.components.header.mount();
    }

    async mountToolbar() {
        const mount = document.getElementById('series-toolbar-mount');
        if (!mount) return;

        const albums = albumsStore.getAlbums();
        const activeSeries = albumSeriesStore.getActiveSeries();
        const allSeries = albumSeriesStore.getSeries();

        this.components.toolbar = new SeriesToolbar({
            container: mount,
            props: {
                searchQuery: this.searchQuery,
                filters: this.filters,
                viewMode: this.viewMode,
                artists: getUniqueArtistsFn(albums),
                seriesList: allSeries,
                activeSeries,
                onSearch: (q) => this.handleSearch(q),
                onSeriesChange: (v) => this.handleSeriesChange(v),
                onArtistFilter: (v) => this.handleFilter('artist', v),
                onYearFilter: (v) => this.handleFilter('year', v),
                onSourceFilter: (v) => this.handleFilter('source', v),
                onRefresh: () => this.handleRefresh(),
                onToggleView: () => this.handleToggleView()
            }
        });
        this.components.toolbar.mount();

        // FIX: Setup inline progress container AFTER toolbar is mounted (so DOM exists)
        const progressContainer = document.getElementById('loading-progress-container');
        if (progressContainer) {
            this.inlineProgress = new InlineProgress(progressContainer);
        }
    }

    async mountGrid() {
        const mount = document.getElementById('series-grid-mount');
        if (!mount) return;

        const albums = albumsStore.getAlbums();
        const filteredAlbums = this.filterAlbums(albums);
        const allSeries = albumSeriesStore.getSeries();

        this.components.grid = new SeriesGridRenderer({
            container: mount,
            props: {
                items: filteredAlbums,
                layout: this.viewMode === 'compact' ? 'grid' : 'list',
                scope: this.currentScope,
                seriesList: allSeries,
                context: { searchQuery: this.searchQuery, filters: this.filters }
            }
        });
        this.components.grid.mount();

        // Show empty state if needed
        this.updateEmptyState(filteredAlbums.length);
    }

    // =========================================
    // EVENT HANDLER & MODALS SETUP
    // =========================================

    /**
     * Setup global event handler for card actions (CRUD)
     * Uses SeriesEventHandler component for clean separation
     */
    setupEventHandler() {
        this.components.eventHandler = new SeriesEventHandler({
            container: this.container,
            props: {
                onEditSeries: (seriesId) => this.openEditSeriesModal(seriesId),
                onDeleteSeries: (seriesId) => this.openDeleteSeriesModal(seriesId),
                onAlbumRemoved: () => this.refreshGrid()
            }
        });
        this.components.eventHandler.mount();
    }

    /**
     * Mount SeriesModals component (Edit/Delete series modals)
     */
    mountSeriesModals() {
        const mount = this.$('#series-modals-mount');
        if (!mount) return;

        this.components.modals = new SeriesModals({
            onSeriesUpdated: (seriesId) => {
                // ARCH-6: Invalidate cache to prevent stale data
                albumsStore.clearAlbumSeries(seriesId);
                albumsStore.clearAlbumSeries('ALL_SERIES_VIEW');

                this.updateHeader();
                if (this.controller) {
                    this.controller.loadScope(this.currentScope, this.targetSeriesId, true);
                }
            },
            onSeriesDeleted: (seriesId) => {
                // ARCH-6: Invalidate cache
                albumsStore.clearAlbumSeries(seriesId);
                albumsStore.clearAlbumSeries('ALL_SERIES_VIEW');

                if (this.targetSeriesId === seriesId) {
                    router.navigate('/albums');
                } else {
                    this.refreshGrid();
                }
            },
            escapeHtml: escapeHtml
        });

        mount.innerHTML = this.components.modals.render();
        this.components.modals.mount(mount);
    }

    /**
     * Open Edit Series Modal (delegates to SeriesModals)
     */
    openEditSeriesModal(seriesId) {
        if (this.components.modals) {
            this.components.modals.openEdit(seriesId);
        }
    }

    /**
     * Open Delete Series Modal (delegates to SeriesModals)
     */
    openDeleteSeriesModal(seriesId) {
        if (this.components.modals) {
            this.components.modals.openDelete(seriesId);
        }
    }

    // =========================================
    // EVENT HANDLERS (delegate to controller or update components)
    // =========================================

    handleSearch(query) {
        this.searchQuery = query;
        this.refreshGrid();
    }

    handleSeriesChange(value) {
        const seriesId = value === 'all' ? null : value;
        const scopeType = seriesId ? 'SINGLE' : 'ALL';

        // ARCH-6: Direct call, no router remount
        if (this.controller) {
            this.controller.loadScope(scopeType, seriesId);
        }

        // Update URL without navigation
        const url = seriesId ? `/albums?seriesId=${seriesId}` : '/albums';
        window.history.replaceState({}, '', url);

        // Update internal state
        this.currentScope = scopeType;
        this.targetSeriesId = seriesId;
    }

    handleFilter(type, value) {
        this.filters[type] = value;
        this.refreshGrid();
    }

    handleRefresh() {
        if (this.controller) {
            this.controller.loadScope(this.currentScope, this.targetSeriesId, true);
        }
    }

    handleToggleView() {
        this.viewMode = this.viewMode === 'compact' ? 'expanded' : 'compact';
        localStorage.setItem('albumsViewMode', this.viewMode);

        // Re-mount toolbar with new mode state
        this.mountToolbar();

        // Refresh grid with new layout
        this.refreshGrid();
    }

    handleGeneratePlaylists() {
        const activeSeries = albumSeriesStore.getActiveSeries();
        if (activeSeries) {
            router.navigate(`/playlists?seriesId=${activeSeries.id}`);
        } else {
            router.navigate('/playlists');
        }
    }

    // =========================================
    // HELPER METHODS
    // =========================================

    filterAlbums(albums) {
        return filterAlbumsFn(albums, {
            searchQuery: this.searchQuery,
            filters: this.filters
        });
    }

    async refreshGrid() {
        if (!this.components.grid) return;

        const albums = albumsStore.getAlbums();
        let filteredAlbums = this.filterAlbums(albums);
        const allSeries = albumSeriesStore.getSeries();

        // Sprint 12: Apply cached Spotify enrichment to albums before rendering
        // This uses data from background enrichment service
        try {
            await applyEnrichmentToAlbums(filteredAlbums, {
                fetchIfMissing: false, // Don't fetch live - only use cache
                silent: true
            });
        } catch (e) {
            console.warn('[SeriesView] Enrichment application failed:', e.message);
        }

        this.components.grid.update({
            items: filteredAlbums,
            layout: this.viewMode === 'compact' ? 'grid' : 'list',
            scope: this.currentScope,
            seriesList: allSeries,
            context: { searchQuery: this.searchQuery, filters: this.filters }
        });

        // Hydrate TracksRankingComparison components for expanded view
        if (this.viewMode === 'expanded') {
            const gridMount = document.getElementById('series-grid-mount');
            if (gridMount) {
                const rankingContainers = gridMount.querySelectorAll('.ranking-comparison-container');
                console.log(`[SeriesView] Hydrating ${rankingContainers.length} ranking containers`);
                rankingContainers.forEach(el => {
                    const albumId = el.dataset.albumId;
                    const album = filteredAlbums.find(a => a.id === albumId);
                    if (album) {
                        new TracksRankingComparison({ album }).mount(el);
                    }
                });
            }
        }

        this.updateEmptyState(filteredAlbums.length);
    }

    updateEmptyState(albumCount) {
        const container = document.getElementById('emptyStateContainer');
        if (!container) return;

        if (albumCount === 0 && !this.isLoading) {
            container.innerHTML = `
                <div class="empty-state text-center py-16 glass-panel">
                    <div class="text-6xl mb-6 opacity-30">${getIcon('Music', 'w-24 h-24 mx-auto')}</div>
                    <h2 class="text-2xl font-bold mb-2">No albums in library</h2>
                    <p class="text-muted mb-8">Create a series from the home page to get started</p>
                    <button class="btn btn-primary" onclick="window.location.href='/home'">
                        ${getIcon('ArrowLeft', 'w-4 h-4 mr-2')} Go to Home
                    </button>
                </div>
            `;
        } else {
            container.innerHTML = '';
        }
    }

    // =========================================
    // UPDATE METHODS (called by Controller)
    // =========================================

    setLoading(isLoading) {
        this.isLoading = isLoading;
        if (this.inlineProgress) {
            isLoading ? this.inlineProgress.start() : this.inlineProgress.finish();
        }
    }

    updateProgress(progress) {
        if (this.inlineProgress) {
            this.inlineProgress.update(progress.current, progress.total, progress.label);
        }
    }

    updateAlbums(albums) {
        console.log('[SeriesView] updateAlbums:', albums?.length);
        this.refreshGrid();
        this.updateHeader();
    }

    updateHeader() {
        if (!this.components.header) return;

        const activeSeries = albumSeriesStore.getActiveSeries();
        const albums = albumsStore.getAlbums();
        const pageTitle = this.currentScope === 'ALL'
            ? 'All Albums Series'
            : (activeSeries ? escapeHtml(activeSeries.name) : 'Albums');

        this.components.header.update({
            pageTitle,
            albumCount: albums.length
        });
    }

    // =========================================
    // LIFECYCLE
    // =========================================

    destroy() {
        console.log('[SeriesView] Destroying...');

        // Unmount all components
        Object.values(this.components).forEach(c => {
            if (c && typeof c.unmount === 'function') c.unmount();
        });
        this.components = {};

        if (this.inlineProgress) {
            this.inlineProgress.finish();
        }

        super.destroy();
    }
}
