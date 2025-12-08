/**
 * Edit Album Modal
 * Allows editing album metadata (Title, Artist, Year, Cover)
 */

import toast from './Toast.js'

export function showEditAlbumModal(album, onSave) {
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
          Edit Album Details
        </h2>
      </div>

      <!-- Content -->
      <div class="modal-content p-6 space-y-4">
        
        <!-- Title -->
        <div>
          <label class="block mb-2 text-sm font-medium text-gray-300">Album Title:</label>
          <input 
            type="text" 
            id="titleInput"
            class="form-control w-full"
            value="${escapeHtml(album.title)}"
            required
          />
        </div>

        <!-- Artist -->
        <div>
          <label class="block mb-2 text-sm font-medium text-gray-300">Artist:</label>
          <input 
            type="text" 
            id="artistInput"
            class="form-control w-full"
            value="${escapeHtml(album.artist)}"
            required
          />
        </div>

        <!-- Year -->
        <div>
          <label class="block mb-2 text-sm font-medium text-gray-300">Year:</label>
          <input 
            type="number" 
            id="yearInput"
            class="form-control w-full"
            value="${album.year || ''}"
            placeholder="YYYY"
            min="1900"
            max="${new Date().getFullYear() + 1}"
          />
        </div>

        <!-- Cover URL -->
        <div>
          <label class="block mb-2 text-sm font-medium text-gray-300">Cover Image URL:</label>
          <input 
            type="url" 
            id="coverUrlInput"
            class="form-control w-full"
            value="${escapeHtml(album.coverUrl || '')}"
            placeholder="https://..."
          />
        </div>

      </div>

      <!-- Actions -->
      <div class="modal-footer p-6 border-t border-surface-light flex gap-3 justify-end">
        <button class="btn btn-secondary" data-action="cancel">Cancel</button>
        <button class="btn btn-primary" data-action="save">Save Changes</button>
      </div>
    </div>
  `

  const titleInput = modal.querySelector('#titleInput')
  const artistInput = modal.querySelector('#artistInput')
  const yearInput = modal.querySelector('#yearInput')
  const coverUrlInput = modal.querySelector('#coverUrlInput')
  const cancelBtn = modal.querySelector('[data-action="cancel"]')
  const saveBtn = modal.querySelector('[data-action="save"]')

  const close = () => modal.remove()

  cancelBtn.addEventListener('click', close)

  saveBtn.addEventListener('click', async () => {
    const title = titleInput.value.trim()
    const artist = artistInput.value.trim()

    if (!title || !artist) {
      toast.warning('Title and Artist are required.')
      return
    }

    saveBtn.disabled = true
    saveBtn.textContent = 'Saving...'

    try {
      const updates = {
        title,
        artist,
        year: yearInput.value ? parseInt(yearInput.value) : null,
        coverUrl: coverUrlInput.value.trim() || null
      }

      await onSave(album.id, updates)
      close()
    } catch (error) {
      console.error('Failed to save album:', error)
      saveBtn.disabled = false
      saveBtn.textContent = 'Save Changes'
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

  // Focus title input
  setTimeout(() => titleInput.focus(), 100)

  return modal
}

function escapeHtml(str) {
  if (!str) return ''
  const div = document.createElement('div')
  div.textContent = str
  return div.innerHTML
}
