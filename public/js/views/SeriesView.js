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
    getUniqueArtists as getUniqueArtistsFn,
    escapeHtml
} from './albums/index.js';

// Ranking component for expanded view
import { TracksRankingComparison } from '../components/ranking/TracksRankingComparison.js';

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

                <!-- Edit Series Modal -->
                <div id="editSeriesModal" class="modal-overlay hidden">
                    <div class="modal-content glass-panel p-6 max-w-2xl w-full mx-4 rounded-xl">
                        <div class="flex items-center justify-between mb-6 border-b border-white/10 pb-4">
                            <h3 class="text-xl font-bold flex items-center gap-2">
                                ${getIcon('Edit', 'w-5 h-5 text-accent-primary')} Edit Series
                            </h3>
                            <button type="button" class="btn btn-ghost btn-circle" id="closeEditSeriesBtn">
                                ${getIcon('X', 'w-5 h-5')}
                            </button>
                        </div>
                        <form id="editSeriesForm">
                            <div class="form-group mb-6">
                                <label class="block text-sm font-medium mb-2">Series Name</label>
                                <input type="text" id="editSeriesNameInput" class="form-control w-full" required minlength="3" placeholder="Enter series name...">
                            </div>
                            
                            <div class="form-group mb-6">
                                <div class="flex items-center justify-between mb-3">
                                    <label class="text-sm font-medium">Albums in Series</label>
                                    <span id="editSeriesAlbumCount" class="badge badge-neutral text-xs">0 albums</span>
                                </div>
                                
                                <div id="editSeriesAlbumsList" class="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar mb-4 bg-black/20 rounded-lg p-3">
                                    <!-- Albums rendered dynamically -->
                                </div>
                                
                                <div id="editSeriesAutocompleteWrapper" class="mb-4 relative z-50"></div>
                                <p class="text-xs text-muted mt-1">Format: Artist - Album Title (e.g., Pink Floyd - The Wall)</p>
                            </div>
                            
                            <div class="flex justify-end gap-3 pt-4 border-t border-white/10">
                                <button type="button" class="btn btn-secondary" id="cancelEditSeriesBtn">Cancel</button>
                                <button type="submit" class="btn btn-primary">${getIcon('Check', 'w-4 h-4')} Save Changes</button>
                            </div>
                        </form>
                    </div>
                </div>

                <!-- Delete Series Modal -->
                <div id="deleteSeriesModal" class="modal-overlay hidden">
                    <div class="modal-content glass-panel p-6 max-w-md w-full mx-4 border-l-4 border-red-500 rounded-xl">
                        <h3 class="text-xl font-bold mb-2 text-red-400">Delete Series?</h3>
                        <p class="mb-4 text-muted">
                            Are you sure you want to delete <strong id="deleteSeriesName" class="text-white"></strong>?
                        </p>
                        <div class="alert alert-info mb-6 text-sm">
                            ${getIcon('Info', 'w-4 h-4 inline mr-1')}
                            <strong>Safe Delete:</strong> Albums will NOT be deleted. They will remain in your inventory.
                        </div>
                        <div class="flex justify-end gap-3">
                            <button type="button" class="btn btn-secondary" id="cancelDeleteSeriesBtn">Cancel</button>
                            <button type="button" class="btn btn-danger" id="confirmDeleteSeriesBtn">Delete Series</button>
                        </div>
                    </div>
                </div>
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

        // Setup modal event listeners
        this.setupSeriesModals();

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
                onGeneratePlaylists: () => this.handleGeneratePlaylists()
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

        // Setup inline progress container
        const progressContainer = document.getElementById('loading-progress-container');
        if (progressContainer) {
            this.inlineProgress = new InlineProgress(progressContainer);
        }

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
     * Setup series modal event listeners (Edit/Delete)
     */
    setupSeriesModals() {
        // Edit modal buttons
        const closeEditBtn = this.$('#closeEditSeriesBtn');
        const cancelEditBtn = this.$('#cancelEditSeriesBtn');
        const editForm = this.$('#editSeriesForm');

        if (closeEditBtn) this.on(closeEditBtn, 'click', () => this.closeModal('editSeriesModal'));
        if (cancelEditBtn) this.on(cancelEditBtn, 'click', () => this.closeModal('editSeriesModal'));
        if (editForm) {
            this.on(editForm, 'submit', async (e) => {
                e.preventDefault();
                await this.handleEditSeriesSubmit();
            });
        }

        // Delete modal buttons
        const cancelDeleteBtn = this.$('#cancelDeleteSeriesBtn');
        const confirmDeleteBtn = this.$('#confirmDeleteSeriesBtn');

        if (cancelDeleteBtn) this.on(cancelDeleteBtn, 'click', () => this.closeModal('deleteSeriesModal'));
        if (confirmDeleteBtn) this.on(confirmDeleteBtn, 'click', () => this.handleDeleteSeriesConfirm());
    }

    /**
     * Open Edit Series Modal
     */
    openEditSeriesModal(seriesId) {
        const series = albumSeriesStore.getSeries().find(s => s.id === seriesId);
        if (!series) {
            toast.error('Series not found');
            return;
        }

        this.editingSeriesId = seriesId;
        this.editingAlbumQueries = [...(series.albumQueries || [])];

        const nameInput = this.$('#editSeriesNameInput');
        const modal = this.$('#editSeriesModal');

        if (nameInput) nameInput.value = series.name || '';
        this.renderSeriesAlbumsList();
        this.initSeriesAutocomplete();

        if (modal) modal.classList.remove('hidden');
    }

    /**
     * Open Delete Series Modal
     */
    openDeleteSeriesModal(seriesId) {
        const series = albumSeriesStore.getSeries().find(s => s.id === seriesId);
        if (!series) return;

        this.deletingSeriesId = seriesId;

        const nameEl = this.$('#deleteSeriesName');
        const modal = this.$('#deleteSeriesModal');

        if (nameEl) nameEl.textContent = series.name || 'this series';
        if (modal) modal.classList.remove('hidden');
    }

    /**
     * Close any modal by ID
     */
    closeModal(modalId) {
        const modal = this.$(`#${modalId}`);
        if (modal) modal.classList.add('hidden');

        // Reset editing state when closing edit modal
        if (modalId === 'editSeriesModal') {
            this.editingSeriesId = null;
            this.editingAlbumQueries = [];
        }
        if (modalId === 'deleteSeriesModal') {
            this.deletingSeriesId = null;
        }
    }

    /**
     * Render Albums List inside Edit Modal
     */
    renderSeriesAlbumsList() {
        const albumsList = this.$('#editSeriesAlbumsList');
        const countEl = this.$('#editSeriesAlbumCount');

        if (countEl) countEl.textContent = `${this.editingAlbumQueries?.length || 0} albums`;

        if (albumsList) {
            if (!this.editingAlbumQueries || this.editingAlbumQueries.length === 0) {
                albumsList.innerHTML = `<p class="text-gray-500 text-sm italic">No albums yet. Use search below to add.</p>`;
                return;
            }

            albumsList.innerHTML = this.editingAlbumQueries.map((query, i) => `
                <div class="album-item flex items-center justify-between p-2 bg-white/5 rounded-lg">
                    <span class="text-sm truncate flex-1 mr-2">${escapeHtml(query)}</span>
                    <button type="button" class="btn btn-ghost btn-sm text-red-400 hover:text-red-300" data-action="remove-album-from-edit" data-index="${i}">
                        ${getIcon('X', 'w-4 h-4')}
                    </button>
                </div>
            `).join('');

            // Add remove handlers
            albumsList.querySelectorAll('[data-action="remove-album-from-edit"]').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const index = parseInt(e.currentTarget.dataset.index, 10);
                    this.editingAlbumQueries.splice(index, 1);
                    this.renderSeriesAlbumsList();
                });
            });
        }
    }

    /**
     * Initialize Autocomplete for adding albums in Edit Series Modal
     */
    initSeriesAutocomplete() {
        const wrapper = this.$('#editSeriesAutocompleteWrapper');
        if (!wrapper) return;

        // Clear existing autocomplete if re-opening modal
        wrapper.innerHTML = '';

        // Load album data for autocomplete
        optimizedAlbumLoader.load().catch(console.error);

        const autocomplete = new Autocomplete({
            placeholder: 'Search to add album...',
            loader: optimizedAlbumLoader,
            onSelect: (item) => {
                const entry = `${item.artist} - ${item.album}`;

                if (this.editingAlbumQueries.includes(entry)) {
                    toast.warning('This album is already in the list');
                    return;
                }

                this.editingAlbumQueries.push(entry);
                this.renderSeriesAlbumsList();
                toast.success(`Added: ${item.album}`);

                // Clear input
                const input = wrapper.querySelector('input');
                if (input) {
                    input.value = '';
                    input.focus();
                }
            }
        });

        wrapper.appendChild(autocomplete.render());
    }

    /**
     * Handle Edit Series form submit
     */
    async handleEditSeriesSubmit() {
        const nameInput = this.$('#editSeriesNameInput');
        const newName = nameInput?.value?.trim();

        if (!newName || !this.editingSeriesId) return;

        try {
            await albumSeriesStore.updateSeries(this.editingSeriesId, {
                name: newName,
                albumQueries: this.editingAlbumQueries || []
            });
            this.closeModal('editSeriesModal');
            this.updateHeader();
            toast.success('Series updated successfully');

            // Reload to reflect changes
            if (this.controller) {
                this.controller.loadScope(this.currentScope, this.targetSeriesId, true);
            }
        } catch (err) {
            console.error('[SeriesView] Failed to update series:', err);
            toast.error('Failed to update series');
        }
    }

    /**
     * Handle Delete Series confirmation
     */
    async handleDeleteSeriesConfirm() {
        if (!this.deletingSeriesId) return;

        try {
            await albumSeriesStore.deleteSeries(this.deletingSeriesId);
            this.closeModal('deleteSeriesModal');

            // Navigate away if we just deleted the current series
            if (this.targetSeriesId === this.deletingSeriesId) {
                router.navigate('/albums');
            } else {
                this.refreshGrid();
            }

            const { toast } = await import('../components/Toast.js');
            toast.success('Series deleted successfully');
        } catch (err) {
            console.error('[SeriesView] Failed to delete series:', err);
            const { toast } = await import('../components/Toast.js');
            toast.error('Failed to delete series');
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
        if (value === 'all') {
            router.navigate('/albums');
        } else {
            router.navigate(`/albums?seriesId=${value}`);
        }
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

    refreshGrid() {
        if (!this.components.grid) return;

        const albums = albumsStore.getAlbums();
        const filteredAlbums = this.filterAlbums(albums);
        const allSeries = albumSeriesStore.getSeries();

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
