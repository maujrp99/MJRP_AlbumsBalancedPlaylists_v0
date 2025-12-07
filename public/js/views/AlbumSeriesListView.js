import { BaseView } from './BaseView.js'
import { albumSeriesStore } from '../stores/albumSeries.js'
import { router } from '../router.js'
import { getIcon } from '../components/Icons.js'
import { Breadcrumb } from '../components/Breadcrumb.js'

/**
 * AlbumSeriesListView
 * Manage all album series (CRUD)
 */
export class AlbumSeriesListView extends BaseView {
  constructor(db) {
    super()
    this.db = db
    this.editingAlbumSeriesId = null
  }

  async render(params) {
    const series = albumSeriesStore.getSeries()

    return `
      <div class="series-list-view container">
        <header class="view-header mb-8 fade-in">
          ${Breadcrumb.render('/series')}
          
          <div class="header-content mt-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <h1 class="text-4xl font-bold flex items-center gap-3">
              ${getIcon('Layers', 'w-8 h-8')} Series Management
            </h1>
            
            <button class="btn btn-primary" id="createSeriesBtn">
              ${getIcon('Plus', 'w-5 h-5')} New Series
            </button>
          </div>
        </header>

        <div id="mainContent" class="fade-in" style="animation-delay: 0.1s">
          ${series.length === 0 ? this.renderEmptyState() : this.renderSeriesList(series)}
        </div>

        <!-- Edit Modal -->
        <div id="editModal" class="modal-overlay hidden">
          <div class="modal-content glass-panel p-6 max-w-md w-full mx-4">
            <h3 class="text-xl font-bold mb-4">Edit Series</h3>
            <form id="editForm">
              <div class="form-group mb-4">
                <label class="block text-sm font-medium mb-2">Series Name</label>
                <input type="text" id="editNameInput" class="form-control w-full" required minlength="3">
              </div>
              <div class="flex justify-end gap-3">
                <button type="button" class="btn btn-secondary" id="cancelEditBtn">Cancel</button>
                <button type="submit" class="btn btn-primary">Save Changes</button>
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
              <span class="badge ${s.status === 'completed' ? 'badge-success' : 'badge-neutral'} text-xs uppercase">
                ${s.status || 'pending'}
              </span>
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
                Open
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

    if (editForm) {
      this.on(editForm, 'submit', async (e) => {
        e.preventDefault()
        const name = this.$('#editNameInput').value
        if (this.editingAlbumSeriesId && name) {
          try {
            await albumSeriesStore.updateSeries(this.editingAlbumSeriesId, { name })
            if (this.db) {
              // Ensure Firestore update happens
              const series = albumSeriesStore.getSeries().find(s => s.id === this.editingAlbumSeriesId)
              if (series) await albumSeriesStore.saveToFirestore(this.db, series)
            }
            this.closeModal(editModal)
          } catch (err) {
            alert('Failed to update series: ' + err.message)
          }
        }
      })
    }

    if (cancelEdit) this.on(cancelEdit, 'click', () => this.closeModal(editModal))

    // Delete Modal
    const deleteModal = this.$('#deleteModal')
    const confirmDelete = this.$('#confirmDeleteBtn')
    const cancelDelete = this.$('#cancelDeleteBtn')

    if (confirmDelete) {
      this.on(confirmDelete, 'click', async () => {
        if (this.deletingAlbumSeriesId) {
          try {
            await albumSeriesStore.deleteSeries(this.deletingAlbumSeriesId, this.db)
            this.closeModal(deleteModal)
          } catch (err) {
            alert('Failed to delete series: ' + err.message)
          }
        }
      })
    }

    if (cancelDelete) this.on(cancelDelete, 'click', () => this.closeModal(deleteModal))
  }

  openEditModal(id) {
    const series = albumSeriesStore.getSeries().find(s => s.id === id)
    if (!series) return

    this.editingAlbumSeriesId = id
    const input = this.$('#editNameInput')
    if (input) input.value = series.name

    const modal = this.$('#editModal')
    if (modal) modal.classList.remove('hidden')
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
    this.deletingAlbumSeriesId = null
  }

  escapeHtml(text) {
    if (!text) return ''
    const div = document.createElement('div')
    div.textContent = text
    return div.innerHTML
  }
}
