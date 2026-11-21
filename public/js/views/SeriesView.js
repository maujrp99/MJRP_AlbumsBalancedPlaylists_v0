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
import { Breadcrumb } from '../components/Breadcrumb.js';
import { SeriesComponentFactory } from './helpers/SeriesComponentFactory.js';
import { SeriesViewUpdater } from './helpers/SeriesViewUpdater.js';
import SeriesEventHandler from '../components/series/SeriesEventHandler.js';
import { SeriesModalsManager } from './helpers/SeriesModalsManager.js';

import { SafeDOM } from '../utils/SafeDOM.js';
import Pager from '../components/ui/Pager.js';
import { SeriesExpansion, SERIES_ALBUM_LIMIT } from '../models/seriesExpansion.js';
import { onPhoneChange } from '../utils/isPhone.js';
import { nameThisScreen } from '../components/navigation/PhoneShell.js';

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
        // The series the person opened whole (past the first 12 albums). It lives with this screen:
        // a new visit starts empty, and a change of scope empties it (updateAlbums).
        this.expansion = new SeriesExpansion();
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
            SafeDOM.div({ id: 'series-pager-top-mount' }),
            SafeDOM.div({ id: 'series-grid-mount' }),
            SafeDOM.div({ id: 'series-pager-mount' }),
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
            // The controller's first parameter was the database: it kept it and never read it (UAT-19)
            await this.controller.init(null, this);
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
// The same pager below the list and above it (F72): what one changes, both show
        const pagerProps = {
            paging: null,
            onPage: (page) => { this.controller.handlePage(page); window.scrollTo({ top: 0 }); },
            onSize: (size) => this.controller.handlePageSize(size),
            onMode: (mode) => this.controller.handlePagingMode(mode),
            onMore: () => this.controller.handleShowMore()
        };
        this.components.pager = new Pager({ container: document.getElementById('series-pager-mount'), props: pagerProps });
        this.components.pager.mount();
        this.components.pagerTop = new Pager({ container: document.getElementById('series-pager-top-mount'), props: { ...pagerProps, place: 'top' } });
        this.components.pagerTop.mount();

        // 2. Updater: Initialize
        this.updater = new SeriesViewUpdater(this.components);

        // 3. Modals & Events
        this.mountSeriesModals();
        this.setupEventHandler();
        Breadcrumb.attachListeners(this.container);
        // The phone and the computer draw the albums differently (F76): a turn across the line
        // draws them again, from the store
        this.subscriptions.push(onPhoneChange(() => this.controller?.refresh()));

        // 4. Initial Load
        if (this.controller) {
            await this.controller.loadScope(this.currentScope, this.targetSeriesId, false, { entering: true });
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
                onRefetchMetadata: (album) => this.controller.handleRefetchMetadata(album),
                onRetrySeries: (sid) => this.controller.retrySeries(sid),
                onShowAllAlbums: (sid) => this.showAllAlbums(sid),
                onSaveRanking: (album, rankings) => this.controller.saveRanking(album, rankings),
                sourcesOf: (albumId) => this.controller.sourcesOf(albumId)
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

    /**
     * The person asked for the albums a series holds back («Load N more albums»).
     * The albums are already in the load store (the load asks for every album of a series on
     * screen), so nothing is loaded: the choice is kept and the screen is drawn again from the store.
     */
    showAllAlbums(seriesId) {
        this.expansion.expand(seriesId);
        this.controller.refresh();
        this.components.grid?.focusAlbum(seriesId, SERIES_ALBUM_LIMIT);
    }

    /** Say which scope is on screen: with another scope, the series opened whole are forgotten. */
    syncExpansionScope(scope, seriesId) {
        this.expansion.syncScope(scope === 'ALL' ? 'ALL' : `SINGLE:${seriesId}`);
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

            // The series on screen: the ones that pass the filters, cut to the current page
            sortedSeriesList = this.controller.getVisibleSeriesList();
        }

        const currentState = this.controller ? this.controller.getState() : {};
        const currentScope = currentState.currentScope || this.currentScope; // Fallback to local if no controller (unlikely)
        this.syncExpansionScope(currentScope, currentState.targetSeriesId);

        this.updater?.updateGrid(
            albums,
            this.viewMode,
            currentScope,      // FIX #160: Use authoritative scope from controller
            currentState.filters || {},
            currentState.searchQuery || '',
            sortedSeriesList,
            isLoading,
            this.controller ? this.controller.getSeriesStates() : null,
            this.expansion.list()
        );
        const pageView = this.controller ? this.controller.getPageView() : null;
        this.showPaging(pageView);
        const hasSeriesToShow = (pageView?.paging.totalSeries || 0) > 0;
        this.updater?.updateEmptyState('emptyStateContainer', hasSeriesToShow ? 1 : albums.length, isLoading);
    }

    /** What the page holds, said by the two pagers: the one above the list and the one below (F72). */
    showPaging(pageView) {
        const paging = pageView ? pageView.paging : null;
        [this.components.pagerTop, this.components.pager].filter(Boolean).forEach(pager => pager.update({ paging }));
    }

    // New Method called by Controller
    updateHeader(data) {
        // data = { title, description, seriesList, activeSeriesId }
        this.updater?.updateHeaderPayload(data);
        // The phone's top bar names the series on screen (audit finding 19); all of them: «Albums»
        if (data) nameThisScreen(data.activeSeriesId ? data.title : null);
    }

    // =========================================
    // LIFECYCLE
    // =========================================

    destroy() {
        // The controller outlives the view: it must stop drawing into a screen that is gone
        this.controller?.detachView(this);
        Object.values(this.components).forEach(c => c && c.unmount && c.unmount());
        this.components = {};
        this.modalsManager?.unmount();
        super.destroy();
    }
}
