/**
 * Add to Inventory Modal
 * Allows adding an album to physical collection
 */

import { inventoryStore } from '../stores/inventory.js'
import toast from './Toast.js'

export function showAddToInventoryModal(album, onSuccess) {
  const modal = document.createElement('div')
  modal.className = 'modal-overlay'

  modal.innerHTML = `
    <div class="modal-container glass-panel max-w-md">
      <!-- Header -->
      <div class="modal-header p-6 border-b border-surface-light">
        <h2 class="text-2xl font-bold flex items-center gap-3">
          <svg class="w-6 h-6 text-accent-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
          </svg>
          Add to Inventory
        </h2>
        <button class="absolute top-4 right-4 text-gray-400 hover:text-white" data-action="cancel">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>

      <!-- Content -->
      <div class="modal-content p-6 space-y-4">
        <!-- Album Info -->
        <div class="bg-surface-dark p-3 rounded-lg border border-surface-light">
          <p class="font-semibold">${escapeHtml(album.title)}</p>
          <p class="text-sm text-gray-400">${escapeHtml(album.artist)} ${album.year ? `• ${album.year}` : ''}</p>
        </div>

        <!-- Format (Required) -->
        <div>
          <label class="block mb-2 text-sm font-medium text-gray-300">
            Format: <span class="text-accent-primary">*</span>
          </label>
          <div class="relative">
            <select id="formatSelect" class="form-control w-full appearance-none pr-10">
              <option value="cd">CD</option>
              <option value="vinyl">Vinyl</option>
              <option value="cassette">Cassette</option>
              <option value="dvd">DVD</option>
              <option value="bluray">Blu-ray</option>
              <option value="digital">Digital</option>
            </select>
            <svg class="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
            </svg>
          </div>
        </div>

        <!-- Currency -->
        <div>
          <label class="block mb-2 text-sm font-medium text-gray-300">Currency:</label>
          <div class="flex gap-4">
            <label class="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="currency" value="BRL" checked class="text-accent-primary focus:ring-accent-primary">
              BRL
            </label>
            <label class="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="currency" value="USD" class="text-accent-primary focus:ring-accent-primary">
              USD
            </label>
          </div>
        </div>

        <!-- Price -->
        <div>
          <label class="block mb-2 text-sm font-medium text-gray-300">Purchase Price:</label>
          <div class="relative">
            <span id="currencyPrefix" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">R$</span>
            <input type="number" id="priceInput" step="0.01" min="0" placeholder="0.00" class="form-control w-full pl-8">
          </div>
        </div>

        <!-- Notes -->
        <div>
          <label class="block mb-2 text-sm font-medium text-gray-300">Condition / Notes:</label>
          <textarea id="notesInput" rows="3" class="form-control w-full resize-none" placeholder="e.g. Mint condition, Japanese import..."></textarea>
        </div>

        <!-- Actions -->
        <div class="modal-footer p-6 border-t border-surface-light flex gap-3 justify-end">
          <button class="btn btn-secondary" data-action="cancel">Cancel</button>
          <button class="btn btn-primary" data-action="add">Add to Inventory</button>
        </div>
      </div>
    </div>
  `

  // Use scoped queries to ensure we get elements from THIS modal instance
  const formatSelect = modal.querySelector('#formatSelect')
  const currencyRadios = modal.querySelectorAll('input[name="currency"]')
  const currencyPrefix = modal.querySelector('#currencyPrefix')
  const priceInput = modal.querySelector('#priceInput')
  const notesInput = modal.querySelector('#notesInput')
  const cancelBtn = modal.querySelector('[data-action="cancel"]')
  const addBtn = modal.querySelector('[data-action="add"]')

  // Update currency prefix
  currencyRadios.forEach(radio => {
    radio.addEventListener('change', () => {
      currencyPrefix.textContent = radio.value === 'USD' ? '$' : 'R$'
    })
  })

  const close = () => modal.remove()

  cancelBtn.addEventListener('click', close)

  addBtn.addEventListener('click', async () => {
    console.log('[Modal] Add button clicked')
    addBtn.disabled = true
    addBtn.textContent = 'Adding...'

    try {
      const format = formatSelect.value
      // Scoped query for checked radio
      const checkedCurrency = modal.querySelector('input[name="currency"]:checked')
      const currency = checkedCurrency ? checkedCurrency.value : 'BRL'

      const price = priceInput.value ? parseFloat(priceInput.value) : null
      const notes = notesInput.value.trim()

      console.log('[Modal] Payload:', { format, currency, price, notes })

      const options = {
        currency,
        purchasePrice: price,
        notes: notes || ''
      }

      await inventoryStore.addAlbum(album, format, options)

      console.log('[Modal] Success')

      // Visual Feedback
      addBtn.textContent = 'Saved!'
      addBtn.className = 'btn bg-green-600 text-white cursor-default'

      const footer = modal.querySelector('.modal-footer')
      const msg = document.createElement('div')
      msg.className = 'text-green-400 text-sm font-bold text-right px-6 pb-2'
      msg.textContent = 'Success: Album saved to your inventory!'
      footer.before(msg)

      if (onSuccess) onSuccess()

      // Delay closing so user sees the success message
      setTimeout(() => {
        close()
      }, 1500)
    } catch (error) {
      console.error('[Modal] Error:', error)
      addBtn.disabled = false
      addBtn.textContent = 'Add to Inventory'

      if (error && error.message && error.message.includes('already in inventory')) {
        toast.warning('This album is already in your inventory!')
      } else {
        toast.error(`Failed: ${error ? error.message : 'Unknown'}`)
      }
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
 * Show a modal to edit an existing inventory item
 * @param {Object} item - The inventory item to edit
 * @param {Function} onSave - Callback when item is saved
 */
export function showEditInventoryModal(item, onSave) {
  // Normalize: item could be the album directly or have item.album structure
  const album = item.album || item
  const inventoryId = item.id || album.id

  const modal = document.createElement('div')
  modal.className = 'modal-overlay'

  modal.innerHTML = `
    <div class="modal-container glass-panel max-w-md">
      <div class="modal-header p-6 border-b border-surface-light">
        <h2 class="text-2xl font-bold flex items-center gap-3">
          <svg class="w-6 h-6 text-accent-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
          </svg>
          Edit Inventory Item
        </h2>
      </div>

      <div class="modal-content p-6 space-y-4">
        <div class="bg-surface-dark p-3 rounded-lg border border-surface-light">
          <p class="font-semibold">${escapeHtml(album.title || 'Unknown Title')}</p>
          <p class="text-sm text-gray-400">${escapeHtml(album.artist || 'Unknown Artist')}</p>
        </div>

        <div>
          <label class="block mb-2 text-sm font-medium text-gray-300">Format:</label>
          <select id="formatSelect" class="form-control w-full">
            <option value="cd" ${(item.format || album.format) === 'cd' ? 'selected' : ''}>CD</option>
            <option value="vinyl" ${(item.format || album.format) === 'vinyl' ? 'selected' : ''}>Vinyl</option>
            <option value="cassette" ${(item.format || album.format) === 'cassette' ? 'selected' : ''}>Cassette</option>
            <option value="dvd" ${(item.format || album.format) === 'dvd' ? 'selected' : ''}>DVD</option>
            <option value="bluray" ${(item.format || album.format) === 'bluray' ? 'selected' : ''}>Blu-ray</option>
            <option value="digital" ${(item.format || album.format) === 'digital' ? 'selected' : ''}>Digital</option>
          </select>
        </div>

        <!-- Currency -->
        <div>
          <label class="block mb-2 text-sm font-medium text-gray-300">Currency:</label>
          <div class="flex gap-3">
            <label class="flex items-center gap-2">
              <input type="radio" name="currency" value="USD" ${(item.currency || album.currency) === 'USD' ? 'checked' : ''} class="form-radio" />
              <span>USD</span>
            </label>
            <label class="flex items-center gap-2">
              <input type="radio" name="currency" value="BRL" ${(item.currency || album.currency) === 'BRL' ? 'checked' : ''} class="form-radio" />
              <span>BRL</span>
            </label>
          </div>
        </div>

        <!-- Price -->
        <div>
          <label class="block mb-2 text-sm font-medium text-gray-300">Purchase Price:</label>
          <input 
            type="number" 
            id="priceInput"
            class="form-control w-full"
            value="${item.purchasePrice || album.purchasePrice || ''}"
            step="0.01"
            min="0"
          />
        </div>

        <!-- Notes -->
        <div>
          <label class="block mb-2 text-sm font-medium text-gray-300">Notes:</label>
          <textarea 
            id="notesInput"
            class="form-control w-full resize-none"
            rows="3"
          >${escapeHtml(item.notes || album.notes || '')}</textarea>
        </div>
      </div>

      <div class="modal-footer p-6 border-t border-surface-light flex gap-3 justify-end">
        <button class="btn btn-secondary" data-action="cancel">Cancel</button>
        <button class="btn btn-primary" data-action="save">Save Changes</button>
      </div>
    </div>
  `

  const formatSelect = modal.querySelector('#formatSelect')
  const priceInput = modal.querySelector('#priceInput')
  const notesInput = modal.querySelector('#notesInput')
  const cancelBtn = modal.querySelector('[data-action="cancel"]')
  const saveBtn = modal.querySelector('[data-action="save"]')

  const close = () => modal.remove()

  cancelBtn.addEventListener('click', close)

  saveBtn.addEventListener('click', async () => {
    saveBtn.disabled = true
    saveBtn.textContent = 'Saving...'

    try {
      const updates = {
        format: formatSelect.value,
        currency: document.querySelector('input[name="currency"]:checked').value,
        purchasePrice: priceInput.value ? parseFloat(priceInput.value) : null,
        notes: notesInput.value.trim()
      }

      await onSave(inventoryId, updates)
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
 * Create Series from Inventory Modal
 */
export function showCreateSeriesFromInventoryModal(selectedAlbumIds, onConfirm) {
  const modal = document.createElement('div')
  modal.className = 'modal-overlay'
  modal.innerHTML = `
    <div class="modal-container glass-panel max-w-md">
      <div class="modal-header p-6 border-b border-surface-light">
        <h2 class="text-2xl font-bold flex items-center gap-3">
          <svg class="w-6 h-6 text-accent-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
          </svg>
          Create Series from Inventory
        </h2>
      </div>

      <div class="modal-content p-6 space-y-4">
        <p class="text-gray-300">
          Create a new series from <strong class="text-accent-primary">${selectedAlbumIds.length}</strong> selected album${selectedAlbumIds.length !== 1 ? 's' : ''}.
        </p>

        <div>
          <label class="block mb-2 text-sm font-medium text-gray-300">
            Series Name: <span class="text-accent-primary">*</span>
          </label>
          <input 
            type="text" 
            id="seriesNameInput"
            class="form-control w-full"
            placeholder="Enter series name..."
            minlength="3"
          />
          <p class="text-xs text-gray-400 mt-1">Minimum 3 characters</p>
        </div>

        <div class="bg-blue-900/20 border border-blue-500/30 p-3 rounded-lg">
          <p class="text-sm text-blue-300">
            Albums will be copied from your inventory to this new series. Your inventory remains unchanged.
          </p>
        </div>
      </div>

      <div class="modal-footer p-6 border-t border-surface-light flex gap-3 justify-end">
        <button class="btn btn-secondary" data-action="cancel">Cancel</button>
        <button class="btn btn-primary" data-action="create" disabled>Create Series</button>
      </div>
    </div>
  `

  const input = modal.querySelector('#seriesNameInput')
  const cancelBtn = modal.querySelector('[data-action="cancel"]')
  const createBtn = modal.querySelector('[data-action="create"]')

  const validate = () => {
    createBtn.disabled = input.value.trim().length < 3
  }

  input.addEventListener('input', validate)
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !createBtn.disabled) {
      createBtn.click()
    }
  })

  const close = () => modal.remove()

  cancelBtn.addEventListener('click', close)

  createBtn.addEventListener('click', async () => {
    const seriesName = input.value.trim()
    if (seriesName.length < 3) return

    createBtn.disabled = true
    createBtn.textContent = 'Creating...'

    try {
      await onConfirm(selectedAlbumIds, seriesName)
      close()
    } catch (error) {
      createBtn.disabled = false
      createBtn.textContent = 'Create Series'
      toast.error(`Failed to create series: ${error.message}`)
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

  setTimeout(() => {
    input.focus()
  }, 100)

  return modal
}

function escapeHtml(str) {
  const div = document.createElement('div')
  div.textContent = str
  return div.innerHTML
}
