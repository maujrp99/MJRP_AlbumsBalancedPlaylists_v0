import { BaseView } from './BaseView.js'
import { albumSeriesStore } from '../stores/albumSeries.js'
import { router } from '../router.js'
import { getIcon } from '../components/Icons.js'
import { Breadcrumb } from '../components/Breadcrumb.js'
import toast from '../components/Toast.js'
import { confirm } from '../components/ConfirmationModal.js'
import { Autocomplete } from '../components/Autocomplete.js'
import { optimizedAlbumLoader as albumLoader } from '../services/OptimizedAlbumLoader.js'

/**
 * AlbumSeriesListView
 * Manage all album series (CRUD)
 */
export class AlbumSeriesListView extends BaseView {
  constructor(db) {
    super()
    this.db = db
    this.editingAlbumSeriesId = null
    this.editingAlbumQueries = []
    this.deletingAlbumSeriesId = null
  }

  async render(params) {
    const series = albumSeriesStore.getSeries()

    return `
      <div class="series-list-view container">
        <header class="view-header mb-8 fade-in">
          ${Breadcrumb.render('/series')}
          
          <div class="header-content mt-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <h1 class="text-4xl font-bold flex items-center gap-3">
              ${getIcon('Layers', 'w-8 h-8')} Albums Series Management
            </h1>
            
            <button class="btn btn-primary" id="createSeriesBtn">
              ${getIcon('Plus', 'w-5 h-5')} New Series
            </button>
          </div>
        </header>

        <div id="mainContent" class="fade-in" style="animation-delay: 0.1s">
          ${series.length === 0 ? this.renderEmptyState() : this.renderSeriesList(series)}
        </div>

        <!-- Enhanced Edit Modal -->
        <div id="editModal" class="modal-overlay hidden">
          <div class="modal-content glass-panel p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div class="flex items-center justify-between mb-6 border-b border-white/10 pb-4">
              <h3 class="text-xl font-bold flex items-center gap-2">
                ${getIcon('Edit', 'w-5 h-5 text-accent-primary')} Edit Series
              </h3>
              <button type="button" class="btn btn-ghost btn-circle" id="closeEditBtn">
                ${getIcon('X', 'w-5 h-5')}
              </button>
            </div>
            
            <form id="editForm">
              <!-- Series Name -->
              <div class="form-group mb-6">
                <label class="block text-sm font-medium mb-2">Series Name</label>
                <input type="text" id="editNameInput" class="form-control w-full" required minlength="3" placeholder="Enter series name...">
              </div>
              
              <!-- Albums List -->
              <div class="form-group mb-6">
                <div class="flex items-center justify-between mb-3">
                  <label class="text-sm font-medium">Albums in Series</label>
                  <span id="albumCount" class="badge badge-neutral text-xs">0 albums</span>
                </div>
                
                <div id="albumsList" class="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar mb-4 bg-black/20 rounded-lg p-3">
                  <!-- Albums rendered dynamically -->
                </div>
                
                <!-- Add Album Input -->
                <!-- Autocomplete Container -->
                <div id="seriesAutocompleteWrapper" class="mb-4 relative z-50"></div>
                <p class="text-xs text-muted mt-1">Format: Artist - Album Title (e.g., Pink Floyd - The Wall)</p>
              </div>
              
              <div class="flex justify-end gap-3 pt-4 border-t border-white/10">
                <button type="button" class="btn btn-secondary" id="cancelEditBtn">Cancel</button>
                <button type="submit" class="btn btn-primary">${getIcon('Check', 'w-4 h-4')} Save Changes</button>
              </div>
            </form>
          </div>
        </div>

        <!-- Delete Modal -->
        <div id="deleteModal" class="modal-overlay hidden">
          <div class="modal-content glass-panel p-6 max-w-md w-full mx-4 border-l-4 border-red-500">
            <h3 class="text-xl font-bold mb-2 text-red-400">Delete Series?</h3>
            <p class="mb-4 text-muted">
              Are you sure you want to delete <strong id="deleteSeriesName" class="text-white"></strong>?
            </p>
            <div class="alert alert-info mb-6 text-sm">
              ${getIcon('Info', 'w-4 h-4 inline mr-1')}
              <strong>Safe Delete:</strong> Albums associated with this series will NOT be deleted. They will remain in your inventory.
            </div>
            <div class="flex justify-end gap-3">
              <button type="button" class="btn btn-secondary" id="cancelDeleteBtn">Cancel</button>
              <button type="button" class="btn btn-danger" id="confirmDeleteBtn">Delete Series</button>
            </div>
          </div>
        </div>
      </div>
    `
  }

  renderEmptyState() {
    return `
      <div class="text-center py-12 opacity-50">
        ${getIcon('Layers', 'w-16 h-16 mx-auto mb-4 opacity-50')}
        <h3 class="text-xl font-bold mb-2">No Series Found</h3>
        <p>Create your first series to get started.</p>
      </div>
    `
  }

  renderSeriesList(series) {
    return `
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        ${series.map(s => `
          <div class="series-card glass-panel group hover:border-accent-primary/30 transition-all duration-300 flex flex-col h-full">
            <div class="card-header flex justify-between items-start mb-4">
              <div class="flex-1 min-w-0 pr-4">
                <h3 class="text-lg font-bold truncate" title="${this.escapeHtml(s.name)}">${this.escapeHtml(s.name)}</h3>
                <div class="text-xs text-muted mt-1">
                  Created: ${new Date(s.createdAt).toLocaleDateString()}
                </div>
              </div>
              ${s.status === 'completed' ? `<span class="badge badge-success text-xs uppercase">Completed</span>` : ''}
            </div>

            <div class="card-body flex-1">
              <div class="stats grid grid-cols-2 gap-2 text-sm mb-4">
                <div class="bg-white/5 p-2 rounded">
                  <span class="block text-xs text-muted">Albums</span>
                  <span class="font-mono font-bold">${(s.albumQueries || []).length}</span>
                </div>
                <!-- Placeholder for playlist count if available -->
              </div>
            </div>

            <div class="card-actions flex gap-2 mt-auto pt-4 border-t border-white/5">
              <button class="btn btn-primary btn-sm flex-1" data-action="continue" data-id="${s.id}">
                View
              </button>
              <button class="btn btn-secondary btn-sm btn-icon" data-action="edit" data-id="${s.id}" title="Edit">
                ${getIcon('Edit', 'w-4 h-4')}
              </button>
              <button class="btn btn-danger btn-sm btn-icon" data-action="delete" data-id="${s.id}" title="Delete">
                ${getIcon('Trash', 'w-4 h-4')}
              </button>
            </div>
          </div>
        `).join('')}
      </div>
    `
  }

  update() {
    const series = albumSeriesStore.getSeries()
    const mainContent = this.$('#mainContent')
    if (mainContent) {
      mainContent.innerHTML = series.length === 0 ? this.renderEmptyState() : this.renderSeriesList(series)
    }
  }

  async mount() {
    this.container = document.getElementById('app')

    // Subscribe to store
    const unsubscribe = albumSeriesStore.subscribe(() => this.update())
    this.subscriptions.push(unsubscribe)

    // Load from Firestore if needed (and not already loaded)
    if (this.db && albumSeriesStore.getSeries().length === 0) {
      albumSeriesStore.loadFromFirestore(this.db).catch(console.warn)
    }

    // Event Delegation
    this.on(this.container, 'click', (e) => {
      const btn = e.target.closest('button[data-action]')
      if (!btn) return

      const action = btn.dataset.action
      const id = btn.dataset.id

      if (action === 'continue') router.navigate(`/albums?seriesId=${id}`)
      if (action === 'edit') this.openEditModal(id)
      if (action === 'delete') this.openDeleteModal(id)
    })

    // Create Button
    const createBtn = this.$('#createSeriesBtn')
    if (createBtn) {
      this.on(createBtn, 'click', () => router.navigate('/home'))
    }

    // Modal Controls
    this.setupModals()
  }

  setupModals() {
    // Edit Modal
    const editModal = this.$('#editModal')
    const editForm = this.$('#editForm')
    const cancelEdit = this.$('#cancelEditBtn')
    const closeEdit = this.$('#closeEditBtn')

    if (editForm) {
      this.on(editForm, 'submit', async (e) => {
        e.preventDefault()
        const name = this.$('#editNameInput').value.trim()
        const saveBtn = editForm.querySelector('button[type="submit"]')

        if (!name || name.length < 3) {
          toast.warning('Series name must be at least 3 characters')
          return
        }

        if (this.editingAlbumQueries.length < 2) {
          toast.warning('Series must have at least 2 albums')
          return
        }

        if (this.editingAlbumSeriesId) {
          const saveBtn = editForm.querySelector('button[type="submit"]')
          const originalBtnContent = saveBtn.innerHTML

          try {
            // Show loading state
            saveBtn.disabled = true
            saveBtn.innerHTML = `${getIcon('Loader', 'w-4 h-4 animate-spin')} Saving...`

            // Store handles BOTH localStorage + Firestore persistence via Repository
            await albumSeriesStore.updateSeries(
              this.editingAlbumSeriesId,
              {
                name,
                albumQueries: this.editingAlbumQueries
              }
            )

            toast.success('Series updated successfully!')
            this.closeModal(editModal)
          } catch (err) {
            console.error('Failed to update series:', err)
            toast.error('Failed to update series: ' + err.message)
          } finally {
            if (saveBtn) {
              saveBtn.disabled = false
              saveBtn.innerHTML = originalBtnContent
            }
          }
        }
      })
    }

    // Remove album event delegation on albums list
    const albumsList = this.$('#albumsList')
    if (albumsList) {
      this.on(albumsList, 'click', (e) => {
        const btn = e.target.closest('[data-action="remove-album"]')
        if (btn) {
          const index = parseInt(btn.dataset.index)
          this.removeAlbumFromList(index)
        }
      })
    }

    if (cancelEdit) this.on(cancelEdit, 'click', () => this.closeModal(editModal))
    if (closeEdit) this.on(closeEdit, 'click', () => this.closeModal(editModal))

    // Delete Modal
    const deleteModal = this.$('#deleteModal')
    const confirmDelete = this.$('#confirmDeleteBtn')
    const cancelDelete = this.$('#cancelDeleteBtn')

    if (confirmDelete) {
      this.on(confirmDelete, 'click', async () => {
        if (this.deletingAlbumSeriesId) {
          try {
            await albumSeriesStore.deleteSeries(this.deletingAlbumSeriesId)
            toast.success('Series deleted')
            this.closeModal(deleteModal)
          } catch (err) {
            toast.error('Failed to delete series: ' + err.message)
          }
        }
      })
    }

    if (cancelDelete) this.on(cancelDelete, 'click', () => this.closeModal(deleteModal))
  }

  // Helper to init autocomplete inside the modal when it opens (or once)
  initSeriesAutocomplete() {
    const wrapper = this.$('#seriesAutocompleteWrapper')
    if (!wrapper || wrapper.hasChildNodes()) return // Already initialized

    albumLoader.load().catch(console.error)

    const autocomplete = new Autocomplete({
      placeholder: 'Search to add album...',
      loader: albumLoader,
      onSelect: (item) => {
        const entry = `${item.artist} - ${item.album}`

        if (this.editingAlbumQueries.includes(entry)) {
          toast.warning('This album is already in the list')
          return
        }

        this.editingAlbumQueries.push(entry)
        this.renderAlbumsList()
        toast.success(`Added: ${item.album}`)

        // Clear input by re-rendering component or calling internal clear if available
        // For now, simpler to just clear the input value manually if exposed, 
        // but Autocomplete component handles its own state. 
        // We can force value clear by finding the input.
        const input = wrapper.querySelector('input')
        if (input) {
          input.value = ''
          input.focus()
        }
      }
    })

    wrapper.innerHTML = ''
    wrapper.appendChild(autocomplete.render())
  }

  openEditModal(id) {
    const series = albumSeriesStore.getSeries().find(s => s.id === id)
    if (!series) return

    this.editingAlbumSeriesId = id
    this.editingAlbumQueries = [...(series.albumQueries || [])]

    const input = this.$('#editNameInput')
    if (input) input.value = series.name

    this.renderAlbumsList()

    // Initialize Autocomplete if not already done
    requestAnimationFrame(() => {
      this.initSeriesAutocomplete()
    })

    const modal = this.$('#editModal')
    if (modal) modal.classList.remove('hidden')
  }

  renderAlbumsList() {
    const container = this.$('#albumsList')
    const countBadge = this.$('#albumCount')

    if (!container) return

    if (this.editingAlbumQueries.length === 0) {
      container.innerHTML = `
        <div class="text-center py-4 text-muted">
          ${getIcon('Music', 'w-8 h-8 mx-auto mb-2 opacity-50')}
          <p class="text-sm">No albums in this series</p>
        </div>
      `
    } else {
      container.innerHTML = this.editingAlbumQueries.map((query, idx) => `
        <div class="album-item flex items-center justify-between bg-white/5 rounded-lg px-3 py-2 group hover:bg-white/10 transition-colors">
          <div class="flex items-center gap-3 flex-1 min-w-0">
            <span class="text-accent-primary font-mono text-xs w-6">${idx + 1}</span>
            <span class="truncate" title="${this.escapeHtml(query)}">${this.escapeHtml(query)}</span>
          </div>
          <button type="button" class="btn btn-ghost btn-sm text-red-400 opacity-60 hover:opacity-100 transition-opacity" data-action="remove-album" data-index="${idx}" title="Remove album">
            ${getIcon('Trash', 'w-4 h-4')}
          </button>
        </div>
      `).join('')
    }

    if (countBadge) {
      countBadge.textContent = `${this.editingAlbumQueries.length} album${this.editingAlbumQueries.length !== 1 ? 's' : ''}`
    }
  }

  // addAlbumToList removed - logic moved to Autocomplete onSelect

  removeAlbumFromList(index) {
    if (index >= 0 && index < this.editingAlbumQueries.length) {
      const albumName = this.editingAlbumQueries[index]

      // Direct removal - no nested modal to avoid overlay conflicts
      // User can undo by clicking Cancel on the edit form
      this.editingAlbumQueries.splice(index, 1)
      this.renderAlbumsList()
      toast.info(`Removed: ${albumName}`)
    }
  }

  openDeleteModal(id) {
    const series = albumSeriesStore.getSeries().find(s => s.id === id)
    if (!series) return

    this.deletingAlbumSeriesId = id
    const nameSpan = this.$('#deleteSeriesName')
    if (nameSpan) nameSpan.textContent = series.name

    const modal = this.$('#deleteModal')
    if (modal) modal.classList.remove('hidden')
  }

  closeModal(modal) {
    if (modal) modal.classList.add('hidden')
    this.editingAlbumSeriesId = null
    this.editingAlbumQueries = []
    this.deletingAlbumSeriesId = null
  }

  escapeHtml(text) {
    if (!text) return ''
    const div = document.createElement('div')
    div.textContent = text
    return div.innerHTML
  }
}
