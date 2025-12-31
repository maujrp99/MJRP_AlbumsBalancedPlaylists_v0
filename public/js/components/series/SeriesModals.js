/**
 * SeriesModals.js
 * 
 * V3 Architecture Component
 * 
 * Responsibility: Handles Edit and Delete Series modals
 * - Renders modal HTML
 * - Manages modal state (open/close)
 * - Handles form submission
 * - Provides artist scan + filters for album addition (Phase 6)
 */

import { getIcon } from '../Icons.js';
import { albumSearchService } from '../../services/album-search/AlbumSearchService.js';
import { musicKitService } from '../../services/MusicKitService.js';
import { toast } from '../Toast.js';
import { albumSeriesStore } from '../../stores/albumSeries.js';
import { escapeHtml } from '../../utils/stringUtils.js';

export default class SeriesModals {
    constructor(options = {}) {
        this.container = null;
        this.onSeriesUpdated = options.onSeriesUpdated || (() => { });
        this.onSeriesDeleted = options.onSeriesDeleted || (() => { });

        // Modal state
        this.editingSeriesId = null;
        this.editingAlbumQueries = [];
        this.deletingSeriesId = null;

        // Artist scan state (Phase 6) - use singleton
        this.searchResults = [];
        this.filterState = { albums: true, singles: false, live: false, compilations: false };
    }

    /**
     * Render modals HTML
     */
    render() {
        return `
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
                            
                            <div id="editSeriesAlbumsList" class="space-y-2 max-h-[200px] overflow-y-auto custom-scrollbar mb-4 bg-black/20 rounded-lg p-3">
                                <!-- Albums rendered dynamically -->
                            </div>
                            
                            <!-- Artist Scan Section (Phase 6) -->
                            <div id="artistScanSection" class="mt-4 p-3 bg-white/5 rounded-lg">
                                <div class="flex gap-2 mb-3">
                                    <input type="text" id="artistScanInput" class="form-control flex-1" placeholder="Enter artist name (e.g., Pink Floyd, T-Rex)">
                                    <button type="button" id="btnScanArtist" class="btn btn-primary px-4">
                                        ${getIcon('Search', 'w-4 h-4')} Scan
                                    </button>
                                </div>
                                
                                <!-- Filter Buttons -->
                                <div id="artistScanFilters" class="flex flex-wrap gap-2 mb-3 hidden">
                                    <button type="button" data-filter="albums" class="filter-btn px-3 py-1.5 rounded-lg bg-flame-gradient text-white text-xs font-bold">Albums</button>
                                    <button type="button" data-filter="singles" class="filter-btn px-3 py-1.5 rounded-lg bg-white/5 text-gray-400 text-xs font-bold border border-white/5">Singles/EPs</button>
                                    <button type="button" data-filter="live" class="filter-btn px-3 py-1.5 rounded-lg bg-white/5 text-gray-400 text-xs font-bold border border-white/5">Live</button>
                                    <button type="button" data-filter="compilations" class="filter-btn px-3 py-1.5 rounded-lg bg-white/5 text-gray-400 text-xs font-bold border border-white/5">Compilations</button>
                                </div>
                                
                                <!-- Search Results -->
                                <div id="artistScanResults" class="space-y-1 max-h-[200px] overflow-y-auto custom-scrollbar hidden">
                                    <!-- Results rendered dynamically -->
                                </div>
                                
                                <p id="artistScanHint" class="text-xs text-muted mt-2">Type artist name and click Scan to find albums</p>
                            </div>
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
        `;
    }

    /**
     * Mount and setup event listeners
     */
    mount(container) {
        this.container = container;
        this.setupEventListeners();
    }

    /**
     * Setup modal event listeners
     */
    setupEventListeners() {
        const closeEditBtn = this.container.querySelector('#closeEditSeriesBtn');
        const cancelEditBtn = this.container.querySelector('#cancelEditSeriesBtn');
        const editForm = this.container.querySelector('#editSeriesForm');
        const cancelDeleteBtn = this.container.querySelector('#cancelDeleteSeriesBtn');
        const confirmDeleteBtn = this.container.querySelector('#confirmDeleteSeriesBtn');

        if (closeEditBtn) closeEditBtn.addEventListener('click', () => this.closeModal('editSeriesModal'));
        if (cancelEditBtn) cancelEditBtn.addEventListener('click', () => this.closeModal('editSeriesModal'));
        if (editForm) editForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleEditSubmit();
        });
        if (cancelDeleteBtn) cancelDeleteBtn.addEventListener('click', () => this.closeModal('deleteSeriesModal'));
        if (confirmDeleteBtn) confirmDeleteBtn.addEventListener('click', () => this.handleDeleteConfirm());
    }

    /**
     * Open Edit Series Modal
     */
    openEdit(seriesId) {
        const series = albumSeriesStore.getSeries().find(s => s.id === seriesId);
        if (!series) {
            toast.error('Series not found');
            return;
        }

        this.editingSeriesId = seriesId;
        this.editingAlbumQueries = [...(series.albumQueries || [])];

        const nameInput = this.container.querySelector('#editSeriesNameInput');
        const modal = this.container.querySelector('#editSeriesModal');

        if (nameInput) nameInput.value = series.name || '';
        this.renderAlbumsList();
        this.initArtistSearch();

        if (modal) modal.classList.remove('hidden');
    }

    /**
     * Open Delete Series Modal
     */
    openDelete(seriesId) {
        const series = albumSeriesStore.getSeries().find(s => s.id === seriesId);
        if (!series) {
            toast.error('Series not found');
            return;
        }

        this.deletingSeriesId = seriesId;

        const nameEl = this.container.querySelector('#deleteSeriesName');
        const modal = this.container.querySelector('#deleteSeriesModal');

        if (nameEl) nameEl.textContent = series.name || 'this series';
        if (modal) modal.classList.remove('hidden');
    }

    /**
     * Close modal by ID
     */
    closeModal(modalId) {
        const modal = this.container.querySelector(`#${modalId}`);
        if (modal) modal.classList.add('hidden');

        if (modalId === 'editSeriesModal') {
            this.editingSeriesId = null;
            this.editingAlbumQueries = [];
        }
        if (modalId === 'deleteSeriesModal') {
            this.deletingSeriesId = null;
        }
    }

    /**
     * Render albums list inside Edit Modal
     */
    renderAlbumsList() {
        const albumsList = this.container.querySelector('#editSeriesAlbumsList');
        const countEl = this.container.querySelector('#editSeriesAlbumCount');

        if (countEl) countEl.textContent = `${this.editingAlbumQueries?.length || 0} albums`;

        if (albumsList) {
            if (!this.editingAlbumQueries || this.editingAlbumQueries.length === 0) {
                albumsList.innerHTML = `<p class="text-gray-500 text-sm italic">No albums yet. Use search below to add.</p>`;
                return;
            }

            albumsList.innerHTML = '';
            const fragment = document.createDocumentFragment();

            this.editingAlbumQueries.forEach((query, i) => {
                const row = document.createElement('div');
                row.className = 'album-item flex items-center justify-between p-2 bg-white/5 rounded-lg';

                const span = document.createElement('span');
                span.className = 'text-sm truncate flex-1 mr-2';

                // Handle both String queries and Object queries (V3)
                let displayText = query;
                if (typeof query === 'object' && query !== null) {
                    displayText = `${query.artist} - ${query.title || query.album}`;
                }

                span.textContent = displayText;
                row.appendChild(span);

                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'btn btn-ghost btn-sm text-red-400 hover:text-red-300';
                btn.innerHTML = getIcon('X', 'w-4 h-4'); // Icon is trusted

                // Direct event listener - no delegation needed
                btn.addEventListener('click', () => {
                    this.editingAlbumQueries.splice(i, 1);
                    this.renderAlbumsList();
                });

                row.appendChild(btn);
                fragment.appendChild(row);
            });

            albumsList.appendChild(fragment);
        }
    }

    /**
     * Initialize Artist Search (Phase 6)
     * Uses getArtistDiscography + filters (same logic as Home page)
     */
    initArtistSearch() {
        const scanInput = this.container.querySelector('#artistScanInput');
        const scanBtn = this.container.querySelector('#btnScanArtist');
        const filtersEl = this.container.querySelector('#artistScanFilters');
        const resultsEl = this.container.querySelector('#artistScanResults');
        const hintEl = this.container.querySelector('#artistScanHint');

        if (!scanInput || !scanBtn) return;

        // Clear previous state
        this.searchResults = [];
        this.filterState = { albums: true, singles: false, live: false, compilations: false };
        scanInput.value = '';
        if (filtersEl) filtersEl.classList.add('hidden');
        if (resultsEl) resultsEl.classList.add('hidden');
        if (hintEl) hintEl.classList.remove('hidden');

        // Scan button click
        scanBtn.addEventListener('click', () => this.scanArtist());

        // Enter key in input
        scanInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.scanArtist();
            }
        });

        // Filter buttons
        if (filtersEl) {
            filtersEl.querySelectorAll('.filter-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const filterType = btn.dataset.filter;
                    this.toggleFilter(filterType);
                });
            });
        }
    }

    /**
     * Scan artist discography
     */
    async scanArtist() {
        const scanInput = this.container.querySelector('#artistScanInput');
        const filtersEl = this.container.querySelector('#artistScanFilters');
        const resultsEl = this.container.querySelector('#artistScanResults');
        const hintEl = this.container.querySelector('#artistScanHint');
        const scanBtn = this.container.querySelector('#btnScanArtist');

        const query = scanInput?.value?.trim();
        if (!query) return;

        // Show loading
        if (scanBtn) scanBtn.disabled = true;
        if (scanBtn) scanBtn.innerHTML = `${getIcon('Loader', 'w-4 h-4 animate-spin')} Scanning...`;
        if (hintEl) hintEl.textContent = 'Searching Apple Music...';

        try {
            // Initialize MusicKit if needed
            await musicKitService.init();

            // Use the same method as Home page
            console.log(`[SeriesModals] Scanning discography for: ${query}`);
            this.searchResults = await albumSearchService.getArtistDiscography(query);

            console.log(`[SeriesModals] Found ${this.searchResults?.length || 0} albums`);

            if (this.searchResults && this.searchResults.length > 0) {
                // Show filters and results
                if (filtersEl) filtersEl.classList.remove('hidden');
                if (resultsEl) resultsEl.classList.remove('hidden');
                if (hintEl) hintEl.classList.add('hidden');

                // Update filter UI
                this.updateFilterUI();

                // Apply filters and render
                this.applyFilters();
            } else {
                if (hintEl) {
                    hintEl.textContent = 'No albums found. Try a different artist name.';
                    hintEl.classList.remove('hidden');
                }
                if (filtersEl) filtersEl.classList.add('hidden');
                if (resultsEl) resultsEl.classList.add('hidden');
            }
        } catch (error) {
            console.error('[SeriesModals] Artist scan failed:', error);
            if (hintEl) {
                hintEl.textContent = 'Search failed. Please try again.';
                hintEl.classList.remove('hidden');
            }
            toast.error('Failed to search artist');
        } finally {
            if (scanBtn) {
                scanBtn.disabled = false;
                scanBtn.innerHTML = `${getIcon('Search', 'w-4 h-4')} Scan`;
            }
        }
    }

    /**
     * Toggle filter state
     */
    toggleFilter(type) {
        this.filterState[type] = !this.filterState[type];
        this.updateFilterUI();
        this.applyFilters();
    }

    /**
     * Update filter button UI
     */
    updateFilterUI() {
        const filtersEl = this.container.querySelector('#artistScanFilters');
        if (!filtersEl) return;

        filtersEl.querySelectorAll('.filter-btn').forEach(btn => {
            const type = btn.dataset.filter;
            const active = this.filterState[type];
            if (active) {
                btn.className = 'filter-btn px-3 py-1.5 rounded-lg bg-flame-gradient text-white text-xs font-bold';
            } else {
                btn.className = 'filter-btn px-3 py-1.5 rounded-lg bg-white/5 text-gray-400 text-xs font-bold border border-white/5';
            }
        });
    }

    /**
     * Apply filters and render results
     */
    applyFilters() {
        if (!this.searchResults) return;

        const filtered = this.searchResults.filter(album => {
            const title = (album.title || '').toLowerCase();
            const isSingle = album.isSingle || album.albumType === 'Single';
            const isLive = album.isLive || title.includes('(live') || title.includes('[live');
            const isCompilation = album.isCompilation || title.includes('greatest hits') || title.includes('best of');
            const isEP = album.albumType === 'EP';
            const isStudioAlbum = !isSingle && !isLive && !isCompilation && !isEP;

            if (isStudioAlbum && this.filterState.albums) return true;
            if ((isSingle || isEP) && this.filterState.singles) return true;
            if (isLive && this.filterState.live) return true;
            if (isCompilation && this.filterState.compilations) return true;

            return false;
        });

        this.renderSearchResults(filtered);
    }

    /**
     * Render search results as compact list
     */
    renderSearchResults(results) {
        const resultsEl = this.container.querySelector('#artistScanResults');
        if (!resultsEl) return;

        if (!results || results.length === 0) {
            resultsEl.innerHTML = '<p class="text-gray-500 text-sm italic py-2">No albums match filters</p>';
            return;
        }

        resultsEl.innerHTML = '';
        const fragment = document.createDocumentFragment();

        results.forEach(album => {
            const row = document.createElement('div');
            row.className = 'album-result flex items-center gap-3 p-2 bg-white/5 rounded-lg hover:bg-white/10 cursor-pointer transition-colors';

            // Cover
            const coverUrl = album.coverUrl?.replace('{w}', '50').replace('{h}', '50') || '/assets/images/cover_placeholder.png';
            const img = document.createElement('img');
            img.src = coverUrl;
            img.alt = album.title;
            img.className = 'w-10 h-10 rounded object-cover';
            row.appendChild(img);

            // Info
            const info = document.createElement('div');
            info.className = 'flex-1 min-w-0';
            const titleEl = document.createElement('div');
            titleEl.className = 'text-sm font-medium truncate';
            titleEl.textContent = album.title;
            const yearEl = document.createElement('div');
            yearEl.className = 'text-xs text-gray-400';
            yearEl.textContent = album.year || '';
            info.appendChild(titleEl);
            info.appendChild(yearEl);
            row.appendChild(info);

            // Add button
            const addBtn = document.createElement('button');
            addBtn.type = 'button';
            addBtn.className = 'btn btn-ghost btn-sm text-green-400 hover:text-green-300';
            addBtn.innerHTML = getIcon('Plus', 'w-4 h-4');
            addBtn.title = 'Add to series';
            row.appendChild(addBtn);

            // Click to add
            const handleAdd = () => this.addAlbumToSeries(album);
            row.addEventListener('click', handleAdd);
            addBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                handleAdd();
            });

            fragment.appendChild(row);
        });

        resultsEl.appendChild(fragment);
    }

    /**
     * Add album to series list
     */
    addAlbumToSeries(album) {
        const entry = {
            artist: album.artist,
            title: album.title,
            album: album.title,
            appleMusicId: album.id || album.appleMusicId,
            year: album.year || null,
            coverUrl: album.coverUrl || null
        };

        // Check for duplicates
        const isDuplicate = this.editingAlbumQueries.some(q => {
            if (typeof q === 'object' && q !== null) {
                if (entry.appleMusicId && q.appleMusicId) {
                    return q.appleMusicId === entry.appleMusicId;
                }
                return q.artist === entry.artist && (q.title === entry.title || q.album === entry.title);
            }
            return q === `${entry.artist} - ${entry.title}`;
        });

        if (isDuplicate) {
            toast.warning('This album is already in the list');
            return;
        }

        this.editingAlbumQueries.push(entry);
        this.renderAlbumsList();
        toast.success(`Added: ${entry.title}`);
    }

    /**
     * Handle Edit form submit
     */
    async handleEditSubmit() {
        const nameInput = this.container.querySelector('#editSeriesNameInput');
        const newName = nameInput?.value?.trim();

        if (!newName || !this.editingSeriesId) return;

        try {
            await albumSeriesStore.updateSeries(this.editingSeriesId, {
                name: newName,
                albumQueries: this.editingAlbumQueries || []
            });
            this.closeModal('editSeriesModal');
            toast.success('Series updated successfully');
            this.onSeriesUpdated(this.editingSeriesId);
        } catch (err) {
            console.error('[SeriesModals] Failed to update series:', err);
            toast.error('Failed to update series');
        }
    }

    /**
     * Handle Delete confirmation
     */
    async handleDeleteConfirm() {
        if (!this.deletingSeriesId) return;

        try {
            await albumSeriesStore.deleteSeries(this.deletingSeriesId);
            this.closeModal('deleteSeriesModal');
            toast.success('Series deleted successfully');
            this.onSeriesDeleted(this.deletingSeriesId);
        } catch (err) {
            console.error('[SeriesModals] Failed to delete series:', err);
            toast.error('Failed to delete series');
        }
    }

    /**
     * Unmount and cleanup
     */
    unmount() {
        this.container = null;
        this.editingSeriesId = null;
        this.editingAlbumQueries = [];
        this.deletingSeriesId = null;
    }
}
