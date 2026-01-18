/**
 * SeriesView.js
 * 
 * V3 Architecture: THIN ORCHESTRATOR
 * 
 * This view is a thin shell that:
 * 1. Renders the basic page structure (header, toolbar, mount grid)
 * 2. Mounts V3 components (SeriesHeader, SeriesToolbar, SeriesGridRenderer)
 * 3. Delegates all rendering to components (which use existing production functions)
 * 
 * The components internally reuse AlbumsGridRenderer/AlbumsScopedRenderer functions,
 * ensuring 100% feature parity with AlbumsView.
 */

import { BaseView } from './BaseView.js';
import { db } from '../firebase-init.js';
import { Breadcrumb } from '../components/Breadcrumb.js';
import { SeriesComponentFactory } from './helpers/SeriesComponentFactory.js';
import { SeriesViewUpdater } from './helpers/SeriesViewUpdater.js';
import SeriesEventHandler from '../components/series/SeriesEventHandler.js';
import { SeriesModalsManager } from './helpers/SeriesModalsManager.js';

import { SafeDOM } from '../utils/SafeDOM.js';

export default class SeriesView extends BaseView {
    constructor(controller) {
        super();
        this.controller = controller;
        this.components = {};
        // State delegated to controller, but viewMode kept local for UI toggle (or sync?)
        // Actually viewMode is also in controller.
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
            SafeDOM.header({ className: 'view-header mb-8 fade-in' }, [
                SafeDOM.div({ id: 'series-header-mount' }),
                SafeDOM.div({ id: 'series-toolbar-mount' })
            ]),
            SafeDOM.div({ id: 'series-grid-mount' }),
            SafeDOM.div({ id: 'emptyStateContainer' }),
            SafeDOM.footer({ className: 'view-footer mt-12 text-center text-muted text-sm border-t border-white/5 pt-6' }, [
                SafeDOM.p({ className: 'last-update' }, `Last updated: ${new Date().toLocaleTimeString()}`)
            ]),
            SafeDOM.div({ id: 'series-modals-mount' })
        ]);
    }

    /**
     * Mount - Initialize and mount all V3 components
     */
    async mount(params) {
        console.log('[SeriesView] Mounting...', params);
        this.container = document.getElementById('app');

        this.resolveScope(params);

        // Link controller
        if (this.controller) {
            this.controller.setView(this);
            await this.controller.init(db, this);
        }

        // 1. Factory: Instance Components
        this.components.header = SeriesComponentFactory.createHeader(
            document.getElementById('series-header-mount'),
            { view: this }
        );
        this.components.toolbar = SeriesComponentFactory.createToolbar(
            document.getElementById('series-toolbar-mount'),
            { view: this, controller: this.controller }
        );
        this.components.grid = SeriesComponentFactory.createGrid(
            document.getElementById('series-grid-mount'),
            { view: this, controller: this.controller }
        );
        // FIX #152B: Progress bar removed - skeletons provide loading feedback

        // 2. Updater: Initialize
        this.updater = new SeriesViewUpdater(this.components);

        // 3. Modals & Events
        this.mountSeriesModals();
        this.setupEventHandler();
        Breadcrumb.attachListeners(this.container);

        // 4. Initial Load
        if (this.controller) {
            await this.controller.loadScope(this.currentScope, this.targetSeriesId);
        }
        console.log('[SeriesView] Mounted ✅');
    }

    resolveScope(params) {
        const urlParams = new URLSearchParams(window.location.search);
        const seriesId = params?.seriesId || urlParams.get('seriesId');
        if (seriesId && seriesId !== 'undefined' && seriesId !== 'null') {
            this.currentScope = 'SINGLE';
            this.targetSeriesId = seriesId;
        } else {
            this.currentScope = 'ALL';
            this.targetSeriesId = null;
        }
    }

    setupEventHandler() {
        this.components.eventHandler = new SeriesEventHandler({
            container: this.container,
            props: {
                onEditSeries: (sid) => this.modalsManager?.openEdit(sid),
                onDeleteSeries: (sid) => this.modalsManager?.openDelete(sid),
                onAlbumRemoved: () => this.controller.refresh(),
                onRefetchMetadata: (album) => this.controller.handleRefetchMetadata(album)
            }
        });
        this.components.eventHandler.mount();
    }

    mountSeriesModals() {
        const mount = document.getElementById('series-modals-mount');
        if (mount) {
            this.modalsManager = new SeriesModalsManager(this);
            this.modalsManager.mount(mount);
        }
    }

    // =========================================
    // UPDATE METHODS (Delegated to Updater)
    // =========================================

    setLoading(isLoading) {
        this.isLoading = isLoading;
        // FIX #152B: updateLoading removed - skeletons provide loading feedback via isLoading prop
    }

    // FIX #152B: updateProgress removed - skeletons provide loading feedback

    updateAlbums(albums, isLoading = false) {
        // FIX #152: Accept isLoading from controller to distinguish loading vs filtered state
        // console.log('[SeriesView] updateAlbums:', albums?.length, 'isLoading:', isLoading);

        let sortedSeriesList = null;

        // Sync state from controller
        if (this.controller) {
            const state = this.controller.getState();
            this.viewMode = state.viewMode || this.viewMode;

            // ARCH-FIX: Ensure Toolbar is synced with Controller state (Filters, Active Series)
            this.updater?.updateToolbar(state, state.currentScope, this.controller);

            // ARCH-FIX: Retrieve SORTED series list from controller state/helper
            const allSeries = this.controller.getHeaderData().seriesList;
            sortedSeriesList = allSeries;
        }

        const currentState = this.controller ? this.controller.getState() : {};
        const currentScope = currentState.currentScope || this.currentScope; // Fallback to local if no controller (unlikely)

        this.updater?.updateGrid(
            albums,
            this.viewMode,
            currentScope,      // FIX #160: Use authoritative scope from controller
            currentState.filters || {},
            currentState.searchQuery || '',
            sortedSeriesList,
            isLoading
        );
        this.updater?.updateEmptyState('emptyStateContainer', albums.length, isLoading);
    }

    // New Method called by Controller
    updateHeader(data) {
        // data = { title, description, seriesList, activeSeriesId }
        this.updater?.updateHeaderPayload(data);
    }

    // =========================================
    // LIFECYCLE
    // =========================================

    destroy() {
        Object.values(this.components).forEach(c => c && c.unmount && c.unmount());
        this.components = {};
        this.modalsManager?.unmount();
        super.destroy();
    }
}
