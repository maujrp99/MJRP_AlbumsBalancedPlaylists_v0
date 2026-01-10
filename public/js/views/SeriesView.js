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
import { Breadcrumb } from '../components/Breadcrumb.js';
import { getIcon } from '../components/Icons.js';
import { optimizedAlbumLoader } from '../services/OptimizedAlbumLoader.js';
import { toast } from '../components/Toast.js';

import { SeriesViewMounter } from './helpers/SeriesViewMounter.js';
import SeriesEventHandler from '../components/series/SeriesEventHandler.js';
import * as Handlers from './helpers/SeriesViewHandlers.js';
import * as GridHelper from './helpers/SeriesGridHelper.js';
import { SeriesModalsManager } from './helpers/SeriesModalsManager.js';
import { SeriesEmptyState } from '../components/series/SeriesEmptyState.js';

// Utilities
// Utilities
import {
    getUniqueArtists as getUniqueArtistsFn
} from '../services/SeriesFilterService.js';
import { escapeHtml } from '../utils/stringUtils.js';

// Ranking component for expanded view
import { TracksRankingComparison } from '../components/ranking/TracksRankingComparison.js';

// Sprint 12: Enrichment integration - auto-apply cached Spotify data
import { applyEnrichmentToAlbums } from '../helpers/SpotifyEnrichmentHelper.js';

import { SafeDOM } from '../utils/SafeDOM.js';

export default class SeriesView extends BaseView {
    constructor(controller) {
        super();
        this.controller = controller;
        this.components = {};
        this.components = {};
        // State delegated to controller, but viewMode kept local for UI toggle (or sync?)
        // Actually viewMode is also in controller. Let's rely on controller for initial, but keep local logic simple?
        // No, controller has viewMode.
        this.viewMode = localStorage.getItem('albumsViewMode') || 'compact';
        this.isLoading = false;
        this.currentScope = 'ALL';
        this.targetSeriesId = null;
    }

    /**
     * Render - Returns a thin shell with mount points for components
     */
    async render(params) {
        return SafeDOM.div({ className: 'albums-view container' }, [
            // Header Component Mount
            SafeDOM.header({ className: 'view-header mb-8 fade-in' }, [
                SafeDOM.div({ id: 'series-header-mount' }),
                SafeDOM.div({ id: 'series-toolbar-mount' })
            ]),

            // Grid Component Mount
            SafeDOM.div({ id: 'series-grid-mount' }),

            // Empty State
            SafeDOM.div({ id: 'emptyStateContainer' }),

            // Footer
            SafeDOM.footer({ className: 'view-footer mt-12 text-center text-muted text-sm border-t border-white/5 pt-6' }, [
                SafeDOM.p({ className: 'last-update' }, `Last updated: ${new Date().toLocaleTimeString()}`)
            ]),

            // Series Modals Mount Point
            SafeDOM.div({ id: 'series-modals-mount' })
        ]);
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

        // Mount V3 components via Mounter
        const mounted = await SeriesViewMounter.mountAll(this);
        this.components.header = mounted.header;
        this.components.toolbar = mounted.toolbar;
        this.components.grid = mounted.grid;
        this.inlineProgress = mounted.inlineProgress;

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

    // =========================================
    // COMPONENT MOUNTING (Delegated to SeriesViewMounter)
    // =========================================

    // mountHeader, mountToolbar, mountGrid moved to SeriesViewMounter

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

        this.modalsManager = new SeriesModalsManager(this);
        this.modalsManager.mount(mount);
    }

    /**
     * Open Edit Series Modal (delegates to Manager)
     */
    openEditSeriesModal(seriesId) {
        if (this.modalsManager) {
            this.modalsManager.openEdit(seriesId);
        }
    }

    /**
     * Open Delete Series Modal (delegates to Manager)
     */
    openDeleteSeriesModal(seriesId) {
        if (this.modalsManager) {
            this.modalsManager.openDelete(seriesId);
        }
    }

    // =========================================
    // EVENT HANDLERS (delegate to controller or update components)
    // =========================================

    handleSearch(query) {
        if (this.controller) this.controller.handleSearch(query);
    }

    handleSeriesChange(value) {
        Handlers.handleSeriesChange(this, value);
    }

    handleFilter(type, value) {
        if (this.controller) this.controller.handleFilterChange(type, value);
    }

    handleRefresh() {
        Handlers.handleRefresh(this);
    }

    handleToggleView() {
        Handlers.handleToggleView(this);
    }

    handleGeneratePlaylists() {
        Handlers.handleGeneratePlaylists(this);
    }

    // =========================================
    // HELPER METHODS
    // =========================================

    async refreshGrid(providedAlbums = null) {
        await GridHelper.refreshGrid(this, providedAlbums);
    }

    updateEmptyState(albumCount) {
        const container = document.getElementById('emptyStateContainer');
        if (!container) return;

        SafeDOM.clear(container);

        if (albumCount === 0 && !this.isLoading) {
            const emptyState = new SeriesEmptyState({
                message: 'No albums in library',
                subMessage: 'Create a series from the home page to get started',
                ctaText: 'Go to Home',
                ctaHref: '/home'
            });
            emptyState.mount(container);
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
        this.lastRenderedAlbums = albums; // Cache for toggle view
        this.refreshGrid(albums);
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

        if (this.modalsManager) {
            this.modalsManager.unmount();
        }

        if (this.inlineProgress) {
            this.inlineProgress.unmount();
        }

        super.destroy();
    }
}
