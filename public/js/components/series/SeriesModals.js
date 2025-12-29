/**
 * SeriesModals.js
 * 
 * V3 Architecture Component
 * 
 * Responsibility: Handles Edit and Delete Series modals
 * - Renders modal HTML
 * - Manages modal state (open/close)
 * - Handles form submission
 * - Provides autocomplete for album addition
 */

import { getIcon } from '../Icons.js';
import { Autocomplete } from '../Autocomplete.js';
import { optimizedAlbumLoader } from '../../services/OptimizedAlbumLoader.js';
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
        this.initAutocomplete();

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
     * Initialize Autocomplete for adding albums
     */
    initAutocomplete() {
        const wrapper = this.container.querySelector('#editSeriesAutocompleteWrapper');
        if (!wrapper) return;

        wrapper.innerHTML = '';
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
                this.renderAlbumsList();
                toast.success(`Added: ${item.album}`);

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
