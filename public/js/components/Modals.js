/**
 * Modal Components
 * Reusable modal components for CRUD operations
 */

import toast from './Toast.js'
import { escapeHtml } from '../utils/stringUtils.js'

/**
 * Delete Series Modal
 * Shows confirmation with NO cascade warning (albums stay)
 */
export function showDeleteSeriesModal(seriesId, seriesName, onConfirm) {
  const modal = document.createElement('div')
  modal.className = 'modal-overlay'
  modal.innerHTML = `
    <div class="modal-container glass-panel max-w-md">
      <!-- Header -->
      <div class="modal-header p-6 border-b border-surface-light">
        <div class="flex items-center gap-3 mb-2">
          <svg class="w-6 h-6 text-accent-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
          </svg>
          <h2 class="text-2xl font-bold">Delete Series?</h2>
        </div>
      </div>

      <!-- Content -->
      <div class="modal-content p-6 space-y-4">
        <p class="text-gray-300">Are you sure you want to delete:</p>
        
        <div class="bg-surface-dark p-3 rounded-lg border border-accent-primary">
          <p class="font-semibold text-accent-primary">${escapeHtml(seriesName)}</p>
        </div>

        <div class="bg-blue-900/20 border border-blue-500/30 p-3 rounded-lg">
          <p class="text-sm text-blue-300">
            <strong>Note:</strong> Albums in this series will <strong>NOT</strong> be deleted and can be reassigned to another series.
          </p>
        </div>

        <p class="text-sm text-accent-primary">
          <svg class="w-4 h-4 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
          </svg>
          This action cannot be undone.
        </p>
      </div>

      <!-- Actions -->
      <div class="modal-footer p-6 border-t border-surface-light flex gap-3 justify-end">
        <button class="btn btn-secondary" data-action="cancel">Cancel</button>
        <button class="btn btn-danger" data-action="confirm">Delete Series</button>
      </div>
    </div>
  `

  // Event handlers
  const cancelBtn = modal.querySelector('[data-action="cancel"]')
  const confirmBtn = modal.querySelector('[data-action="confirm"]')

  const close = () => {
    modal.remove()
  }

  cancelBtn.addEventListener('click', close)
  confirmBtn.addEventListener('click', async () => {
    confirmBtn.disabled = true
    confirmBtn.textContent = 'Deleting...'

    try {
      await onConfirm(seriesId)
      close()
    } catch (error) {
      confirmBtn.disabled = false
      confirmBtn.textContent = 'Delete Series'
      toast.error(`Failed to delete series: ${error.message}`)
    }
  })

  // Close on overlay click
  modal.addEventListener('click', (e) => {
    if (e.target === modal) close()
  })

  // Close on Escape
  const handleEscape = (e) => {
    if (e.key === 'Escape') {
      close()
      document.removeEventListener('keydown', handleEscape)
    }
  }
  document.addEventListener('keydown', handleEscape)

  document.body.appendChild(modal)
  return modal
}

/**
 * Edit Series Name Modal
 */
export function showEditSeriesModal(seriesId, currentName, onSave) {
  const modal = document.createElement('div')
  modal.className = 'modal-overlay'
  modal.innerHTML = `
    <div class="modal-container glass-panel max-w-md">
      <!-- Header -->
      <div class="modal-header p-6 border-b border-surface-light">
        <h2 class="text-2xl font-bold flex items-center gap-3">
          <svg class="w-6 h-6 text-accent-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
          </svg>
          Edit Series Name
        </h2>
      </div>

      <!-- Content -->
      <div class="modal-content p-6">
        <label class="block mb-2 text-sm font-medium text-gray-300">Series Name:</label>
        <input 
          type="text" 
          id="seriesNameInput"
          class="form-control w-full"
          value="${escapeHtml(currentName)}"
          placeholder="Enter series name..."
          minlength="3"
        />
        <p class="text-xs text-gray-400 mt-2">Minimum 3 characters</p>
      </div>

      <!-- Actions -->
      <div class="modal-footer p-6 border-t border-surface-light flex gap-3 justify-end">
        <button class="btn btn-secondary" data-action="cancel">Cancel</button>
        <button class="btn btn-primary" data-action="save" disabled>Save Changes</button>
      </div>
    </div>
  `

  const input = modal.querySelector('#seriesNameInput')
  const cancelBtn = modal.querySelector('[data-action="cancel"]')
  const saveBtn = modal.querySelector('[data-action="save"]')

  // Validate input
  const validate = () => {
    const value = input.value.trim()
    saveBtn.disabled = value.length < 3 || value === currentName
  }

  input.addEventListener('input', validate)
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !saveBtn.disabled) {
      saveBtn.click()
    }
  })

  const close = () => {
    modal.remove()
  }

  cancelBtn.addEventListener('click', close)
  saveBtn.addEventListener('click', async () => {
    const newName = input.value.trim()
    if (newName.length < 3) return

    saveBtn.disabled = true
    saveBtn.textContent = 'Saving...'

    try {
      await onSave(seriesId, newName)
      close()
    } catch (error) {
      saveBtn.disabled = false
      saveBtn.textContent = 'Save Changes'
      toast.error(`Failed to save: ${error.message}`)
    }
  })

  modal.addEventListener('click', (e) => {
    if (e.target === modal) close()
  })

  const handleEscape = (e) => {
    if (e.key === 'Escape') {
      close()
      document.removeEventListener('keydown', handleEscape)
    }
  }
  document.addEventListener('keydown', handleEscape)

  document.body.appendChild(modal)

  // Focus and select input
  setTimeout(() => {
    input.focus()
    input.select()
  }, 100)

  return modal
}

/**
 * Delete Album Modal
 */
export function showDeleteAlbumModal(albumId, albumTitle, onConfirm) {
  const modal = document.createElement('div')
  modal.className = 'modal-overlay'
  modal.innerHTML = `
    <div class="modal-container glass-panel max-w-md">
      <div class="modal-header p-6 border-b border-surface-light">
        <div class="flex items-center gap-3">
          <svg class="w-6 h-6 text-accent-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
          </svg>
          <h2 class="text-2xl font-bold">Delete Album?</h2>
        </div>
      </div>

      <div class="modal-content p-6 space-y-4">
        <p class="text-gray-300">Are you sure you want to delete:</p>
        <div class="bg-surface-dark p-3 rounded-lg">
          <p class="font-semibold">${escapeHtml(albumTitle)}</p>
        </div>
        <p class="text-sm text-accent-primary">This will remove the album from this series.</p>
      </div>

      <div class="modal-footer p-6 border-t border-surface-light flex gap-3 justify-end">
        <button class="btn btn-secondary" data-action="cancel">Cancel</button>
        <button class="btn btn-danger" data-action="confirm">Delete</button>
      </div>
    </div>
  `

  const cancelBtn = modal.querySelector('[data-action="cancel"]')
  const confirmBtn = modal.querySelector('[data-action="confirm"]')

  const close = () => modal.remove()

  cancelBtn.addEventListener('click', close)
  confirmBtn.addEventListener('click', async () => {
    confirmBtn.disabled = true
    confirmBtn.textContent = 'Deleting...'

    try {
      await onConfirm(albumId)
      close()
    } catch (error) {
      confirmBtn.disabled = false
      confirmBtn.textContent = 'Delete'
      toast.error(`Failed to delete: ${error.message}`)
    }
  })

  modal.addEventListener('click', (e) => {
    if (e.target === modal) close()
  })

  document.addEventListener('keydown', function handleEscape(e) {
    if (e.key === 'Escape') {
      close()
      document.removeEventListener('keydown', handleEscape)
    }
  })

  document.body.appendChild(modal)
  return modal
}

/**
 * Delete Playlist Modal
 */
/**
 * Delete Playlist Modal
 */
export function showDeletePlaylistModal(playlistId, playlistTitle, trackCount, onConfirm) {
  const modal = document.createElement('div')
  modal.className = 'modal-overlay'
  modal.innerHTML = `
    <div class="modal-container glass-panel max-w-md">
      <div class="modal-header p-6 border-b border-surface-light">
        <div class="flex items-center gap-3">
          <svg class="w-6 h-6 text-accent-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
          </svg>
          <h2 class="text-2xl font-bold">Delete Playlist?</h2>
        </div>
      </div>

      <div class="modal-content p-6 space-y-4">
        <p class="text-gray-300">Are you sure you want to delete:</p>
        <div class="bg-surface-dark p-3 rounded-lg">
          <p class="font-semibold">${escapeHtml(playlistTitle)}</p>
          <p class="text-sm text-gray-400">${trackCount} track${trackCount !== 1 ? 's' : ''}</p>
        </div>
      </div>

      <div class="modal-footer p-6 border-t border-surface-light flex gap-3 justify-end">
        <button class="btn btn-secondary" data-action="cancel">Cancel</button>
        <button class="btn btn-danger" data-action="confirm">Delete</button>
      </div>
    </div>
  `

  const cancelBtn = modal.querySelector('[data-action="cancel"]')
  const confirmBtn = modal.querySelector('[data-action="confirm"]')

  const close = () => modal.remove()

  cancelBtn.addEventListener('click', close)
  confirmBtn.addEventListener('click', async () => {
    confirmBtn.disabled = true
    confirmBtn.textContent = 'Deleting...'

    try {
      await onConfirm(playlistId)
      close()
    } catch (error) {
      confirmBtn.disabled = false
      confirmBtn.textContent = 'Delete'
      toast.error(`Failed to delete: ${error.message}`)
    }
  })

  modal.addEventListener('click', (e) => {
    if (e.target === modal) close()
  })

  document.addEventListener('keydown', function handleEscape(e) {
    if (e.key === 'Escape') {
      close()
      document.removeEventListener('keydown', handleEscape)
    }
  })

  document.body.appendChild(modal)
  return modal
}

/**
 * Delete Batch Modal
 */
export function showDeleteBatchModal(batchName, playlistCount, onConfirm) {
  const modal = document.createElement('div')
  modal.className = 'modal-overlay'
  modal.innerHTML = `
      <div class="modal-container glass-panel max-w-md">
        <div class="modal-header p-6 border-b border-surface-light">
          <div class="flex items-center gap-3">
            <svg class="w-6 h-6 text-accent-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
            </svg>
            <h2 class="text-2xl font-bold">Delete Batch?</h2>
          </div>
        </div>
  
        <div class="modal-content p-6 space-y-4">
          <p class="text-gray-300">Are you sure you want to delete this ENTIRE batch of playlists?</p>
          <div class="bg-surface-dark p-3 rounded-lg">
            <p class="font-semibold">${escapeHtml(batchName)}</p>
            <p class="text-sm text-gray-400">${playlistCount} playlist${playlistCount !== 1 ? 's' : ''}</p>
          </div>
          <p class="text-sm text-red-400">This action cannot be undone.</p>
        </div>
  
        <div class="modal-footer p-6 border-t border-surface-light flex gap-3 justify-end">
          <button class="btn btn-secondary" data-action="cancel">Cancel</button>
          <button class="btn btn-danger" data-action="confirm">Delete Batch</button>
        </div>
      </div>
    `

  const cancelBtn = modal.querySelector('[data-action="cancel"]')
  const confirmBtn = modal.querySelector('[data-action="confirm"]')

  const close = () => modal.remove()

  cancelBtn.addEventListener('click', close)
  confirmBtn.addEventListener('click', async () => {
    confirmBtn.disabled = true
    confirmBtn.textContent = 'Deleting...'

    try {
      await onConfirm()
      close()
    } catch (error) {
      confirmBtn.disabled = false
      confirmBtn.textContent = 'Delete Batch'
      toast.error(`Failed to delete: ${error.message}`)
    }
  })

  modal.addEventListener('click', (e) => {
    if (e.target === modal) close()
  })

  document.addEventListener('keydown', function handleEscape(e) {
    if (e.key === 'Escape') {
      close()
      document.removeEventListener('keydown', handleEscape)
    }
  })

  document.body.appendChild(modal)
  return modal
}

/**
 * Save Playlists Modal - Allows naming the playlist batch before saving
 * @param {string} defaultName - Default name suggestion (series name)
 * @param {number} playlistCount - Number of playlists being saved
 * @param {Function} onSave - Callback with the chosen name
 */
export function showSavePlaylistsModal(defaultName, playlistCount, onSave) {
  const modal = document.createElement('div')
  modal.className = 'modal-overlay'
  modal.innerHTML = `
    <div class="modal-container glass-panel max-w-md">
      <div class="modal-header p-6 border-b border-surface-light">
        <h2 class="text-2xl font-bold flex items-center gap-3">
          <svg class="w-6 h-6 text-accent-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
          </svg>
          Save to History
        </h2>
      </div>

      <div class="modal-content p-6 space-y-4">
        <p class="text-gray-300">Name this playlist batch (${playlistCount} playlists):</p>
        
        <input 
          type="text" 
          id="playlistBatchName"
          class="form-control w-full"
          value="${escapeHtml(defaultName)}"
          placeholder="e.g., Trip Hop - Session 1"
        />
        
        <p class="text-xs text-gray-400">This name will help you identify this set when viewing history.</p>
      </div>

      <div class="modal-footer p-6 border-t border-surface-light flex gap-3 justify-end">
        <button class="btn btn-secondary" data-action="cancel">Cancel</button>
        <button class="btn btn-success" data-action="save">Save Playlists</button>
      </div>
    </div>
  `

  const input = modal.querySelector('#playlistBatchName')
  const cancelBtn = modal.querySelector('[data-action="cancel"]')
  const saveBtn = modal.querySelector('[data-action="save"]')

  const close = () => modal.remove()

  cancelBtn.addEventListener('click', close)

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      saveBtn.click()
    }
  })

  saveBtn.addEventListener('click', async () => {
    const batchName = input.value.trim() || defaultName
    saveBtn.disabled = true
    saveBtn.textContent = 'Saving...'

    try {
      await onSave(batchName)
      close()
    } catch (error) {
      saveBtn.disabled = false
      saveBtn.textContent = 'Save Playlists'
      toast.error(`Failed to save: ${error.message}`)
    }
  })

  modal.addEventListener('click', (e) => {
    if (e.target === modal) close()
  })

  document.addEventListener('keydown', function handleEscape(e) {
    if (e.key === 'Escape') {
      close()
      document.removeEventListener('keydown', handleEscape)
    }
  })

  document.body.appendChild(modal)

  // Focus and select input
  setTimeout(() => {
    input.focus()
    input.select()
  }, 100)

  return modal
}


