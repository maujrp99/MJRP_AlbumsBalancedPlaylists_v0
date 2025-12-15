/**
 * ViewAlbumModal Component
 * Shows album details including tracks, format, condition, notes
 */

import { getIcon } from './Icons.js'

export function showViewAlbumModal(album) {
  const modal = document.createElement('div')
  modal.className = 'modal-overlay'
  const activeData = album.albumData || album // FIX: Handle both inventory wrappers and raw album objects
  modal.innerHTML = `
    <div class="modal-container glass-panel max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
      <!-- Header -->
      <div class="modal-header p-6 border-b border-surface-light flex items-start gap-4">
        <!-- Album Cover -->
        <div class="w-24 h-24 bg-surface-dark rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
          ${activeData?.coverUrl ? `
            <img src="${activeData.coverUrl}" alt="${escapeHtml(album.title)}" class="w-full h-full object-cover" />
          ` : `
            <div class="text-gray-600">
              ${getIcon('Disc', 'w-12 h-12')}
            </div>
          `}
        </div>
        
        <div class="flex-1 min-w-0">
          <h2 class="text-2xl font-bold truncate">${escapeHtml(album.title)}</h2>
          <p class="text-lg text-gray-400">${escapeHtml(album.artist)}</p>
          <div class="flex items-center gap-3 mt-2 text-sm text-gray-500">
            ${album.year ? `<span>${album.year}</span>` : ''}
            ${album.format ? `<span class="badge badge-neutral">${album.format.toUpperCase()}</span>` : ''}
            ${album.owned !== false ? `<span class="badge badge-success">OWNED</span>` : `<span class="badge badge-neutral">WISHLIST</span>`}
          </div>
        </div>
        
        <button class="btn btn-ghost btn-circle ml-auto" data-action="close">
          ${getIcon('X', 'w-6 h-6')}
        </button>
      </div>

      <!-- Content -->
      <div class="modal-content p-6 overflow-y-auto custom-scrollbar flex-1">
        <!-- Album Info Grid -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          ${album.purchasePrice ? `
            <div class="stat-card bg-surface-dark p-3 rounded-lg">
              <p class="text-xs text-gray-500 mb-1">Purchase Price</p>
              <p class="font-bold text-accent-primary">${formatCurrency(album.purchasePrice, album.currency)}</p>
            </div>
          ` : ''}
          ${album.condition ? `
            <div class="stat-card bg-surface-dark p-3 rounded-lg">
              <p class="text-xs text-gray-500 mb-1">Condition</p>
              <p class="font-semibold">${escapeHtml(album.condition)}</p>
            </div>
          ` : ''}
          ${album.purchaseDate ? `
            <div class="stat-card bg-surface-dark p-3 rounded-lg">
              <p class="text-xs text-gray-500 mb-1">Purchased</p>
              <p class="font-semibold">${new Date(album.purchaseDate).toLocaleDateString()}</p>
            </div>
          ` : ''}
          ${activeData?.tracks?.length ? `
            <div class="stat-card bg-surface-dark p-3 rounded-lg">
              <p class="text-xs text-gray-500 mb-1">Tracks</p>
              <p class="font-semibold">${activeData.tracks.length}</p>
            </div>
          ` : ''}
        </div>

        <!-- Notes -->
        ${album.notes ? `
          <div class="notes-section mb-6">
            <h3 class="text-sm font-bold text-gray-400 mb-2 flex items-center gap-2">
              ${getIcon('FileText', 'w-4 h-4')} Notes
            </h3>
            <p class="text-gray-300 bg-surface-dark p-3 rounded-lg">${escapeHtml(album.notes)}</p>
          </div>
        ` : ''}

        <!-- Tracks Lists -->
        ${(activeData?.tracksOriginalOrder?.length || activeData?.tracks?.length) ? `
          <div class="tracks-section space-y-6">
            <!-- Original Track Order (use tracksOriginalOrder if available) -->
            <div>
              <h3 class="text-sm font-bold text-gray-400 mb-3 flex items-center gap-2">
                ${getIcon('Music', 'w-4 h-4')} Original Track Order
              </h3>
              <div class="tracks-list bg-surface-dark rounded-lg overflow-hidden">
                ${(activeData.tracksOriginalOrder || activeData.tracks).map((track, idx) => {
    const trackTitle = track?.title || track?.name || 'Unknown Track'
    const hasRating = track?.rating != null && track?.rating !== undefined
    const hasDuration = track?.duration != null && track?.duration > 0
    return `
                  <div class="track-row flex items-center gap-3 px-4 py-2 border-b border-white/5 last:border-0 hover:bg-white/5">
                    <span class="text-xs text-gray-500 w-6 text-right">${idx + 1}</span>
                    <span class="flex-1 truncate">${escapeHtml(trackTitle)}</span>
                    ${hasRating ? `<span class="text-xs text-accent-primary">★ ${track.rating}</span>` : ''}
                    ${hasDuration ? `<span class="text-xs text-gray-500">${formatDuration(track.duration)}</span>` : ''}
                  </div>
                `}).join('')}
              </div>
            </div>

            <!-- Ranked Tracks (sorted by rating) - use tracks which is already sorted -->
            ${(activeData.tracks || []).some(t => t?.rating != null) ? `
              <div>
                <h3 class="text-sm font-bold text-accent-primary mb-3 flex items-center gap-2">
                  ${getIcon('Star', 'w-4 h-4')} Ranked by Rating
                </h3>
                <div class="tracks-list bg-surface-dark rounded-lg overflow-hidden">
                  ${[...(activeData.tracks || [])]
          .filter(t => t?.rating != null)
          .sort((a, b) => (b.rating || 0) - (a.rating || 0))
          .map((track, idx) => {
            const trackTitle = track?.title || track?.name || 'Unknown Track'
            const hasDuration = track?.duration != null && track?.duration > 0
            return `
                    <div class="track-row flex items-center gap-3 px-4 py-2 border-b border-white/5 last:border-0 hover:bg-white/5">
                      <span class="text-xs font-bold w-6 text-right ${idx < 3 ? 'text-accent-primary' : 'text-gray-400'}">#${idx + 1}</span>
                      <span class="flex-1 truncate">${escapeHtml(trackTitle)}</span>
                      <span class="text-sm font-bold text-accent-primary">★ ${track.rating}</span>
                      ${hasDuration ? `<span class="text-xs text-gray-500">${formatDuration(track.duration)}</span>` : ''}
                    </div>
                  `}).join('')}
                </div>
              </div>
            ` : ''}
          </div>
        ` : `
          <div class="text-center py-8 text-gray-500">
            ${getIcon('Music', 'w-12 h-12 mx-auto mb-2 opacity-50')}
            <p>No track listing available</p>
          </div>
        `}
      </div>

      <!-- Footer -->
      <div class="modal-footer p-4 border-t border-surface-light flex justify-end">
        <button class="btn btn-secondary" data-action="close">Close</button>
      </div>
    </div>
  `

  // Event handlers
  const closeModal = () => modal.remove()

  modal.querySelectorAll('[data-action="close"]').forEach(btn => {
    btn.addEventListener('click', closeModal)
  })

  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal()
  })

  document.addEventListener('keydown', function handleEscape(e) {
    if (e.key === 'Escape') {
      closeModal()
      document.removeEventListener('keydown', handleEscape)
    }
  })

  document.body.appendChild(modal)
  return modal
}

function escapeHtml(str) {
  if (!str) return ''
  const div = document.createElement('div')
  div.textContent = str
  return div.innerHTML
}

function formatCurrency(value, currency = 'USD') {
  if (!value) return currency === 'USD' ? '$0.00' : 'R$ 0,00'
  if (currency === 'BRL') {
    return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }
  return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function formatDuration(seconds) {
  if (!seconds) return ''
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}
