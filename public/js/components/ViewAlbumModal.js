/**
 * ViewAlbumModal Component
 * Shows album details including tracks, format, condition, notes
 * MODERNIZED: Uses TracksRankingComparison to match Expanded View UX
 */

import { getIcon } from './Icons.js'
import { TracksRankingComparison } from './ranking/TracksRankingComparison.js'
import { Album } from '../models/Album.js'
import { escapeHtml } from '../utils/stringUtils.js'

export async function showViewAlbumModal(albumInput) {
  const modal = document.createElement('div')
  modal.className = 'modal-overlay'

  // Hydrate Album Model if needed (handle wrappers or POJOs)
  const rawData = albumInput.albumData || albumInput
  const album = rawData instanceof Album ? rawData : new Album(rawData)

  // Render Skeleton Shell
  modal.innerHTML = `
    <div class="modal-container glass-panel max-w-5xl w-full mx-4 max-h-[95vh] min-h-[75vh] overflow-hidden flex flex-col shadow-2xl animate-fade-in-up">
      <!-- Header -->
      <div class="modal-header p-6 border-b border-surface-light flex items-start gap-6 bg-surface-darker/50 backdrop-blur-md">
        <!-- Album Cover -->
        <div class="w-24 h-24 md:w-32 md:h-32 bg-surface-dark rounded-xl shadow-lg flex items-center justify-center flex-shrink-0 overflow-hidden relative group">
          ${album.coverUrl ? `
            <img src="${album.coverUrl}" alt="${escapeHtml(album.title)}" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
            <div class="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors"></div>
          ` : `
            <div class="text-gray-600">
              ${getIcon('Disc', 'w-12 h-12')}
            </div>
          `}
        </div>
        
        <div class="flex-1 min-w-0 pt-1">
          <h2 class="text-2xl md:text-3xl font-bold truncate text-white leading-tight">${escapeHtml(album.title)}</h2>
          <p class="text-xl text-accent-primary font-medium mb-2">${escapeHtml(album.artist)}</p>
          
          <div class="flex flex-wrap items-center gap-3 mt-3 text-sm text-gray-400">
            ${album.year ? `<span class="px-2 py-0.5 bg-surface-light rounded-md border border-white/5">${album.year}</span>` : ''}
            ${album.format ? `<span class="badge badge-neutral uppercase text-xs tracking-wider">${album.format}</span>` : ''}
            ${album.owned !== false ? `<span class="badge badge-success">OWNED</span>` : `<span class="badge badge-neutral">WISHLIST</span>`}
          </div>

          <!-- Metadata Grid (Compact) -->
           <div class="flex flex-wrap gap-4 mt-4 text-xs text-gray-500 font-mono opacity-80">
            ${album.purchasePrice ? `
              <div class="flex items-center gap-1">
                <span class="text-gray-600">Price:</span>
                <span class="text-gray-300">${formatCurrency(album.purchasePrice, album.currency)}</span>
              </div>
            ` : ''}
            ${album.condition ? `
              <div class="flex items-center gap-1">
                <span class="text-gray-600">Cond:</span>
                <span class="text-gray-300">${escapeHtml(album.condition)}</span>
              </div>
            ` : ''}
          </div>
        </div>
        
        <button class="btn btn-ghost btn-circle hover:bg-white/10 text-gray-400 hover:text-white transition-all" data-action="close">
          ${getIcon('X', 'w-8 h-8')}
        </button>
      </div>

      <!-- Notes Section (if notes exist) -->
      ${album.notes ? `
        <div class="px-6 py-4 bg-yellow-500/5 border-b border-white/5">
             <h3 class="text-xs font-bold text-yellow-500/80 uppercase tracking-widest mb-1 flex items-center gap-2">
              ${getIcon('FileText', 'w-3 h-3')} Notes
            </h3>
            <p class="text-sm text-yellow-100/80 italic leading-relaxed">"${escapeHtml(album.notes)}"</p>
        </div>
      ` : ''}

      <!-- Ranking/Tracks Content -->
      <div class="modal-content flex-1 overflow-hidden bg-surface-dark/30 relative">
        <div class="absolute inset-0 overflow-y-auto custom-scrollbar p-6">
           <div id="modal-ranking-container"></div>
        </div>
      </div>

      <!-- Footer -->
      <div class="modal-footer p-4 border-t border-surface-light bg-surface-darker flex justify-end gap-3">
         <button class="btn btn-secondary px-6" data-action="close">Close</button>
      </div>
    </div>
  `

  // Mount logic
  document.body.appendChild(modal)

  // Initialize Comparison Component
  const container = modal.querySelector('#modal-ranking-container')
  if (container) {
    const comparison = new TracksRankingComparison({ album })

    // Defer mount slightly to ensure DOM checks work
    setTimeout(() => {
      comparison.mount(container)
      comparison.updateUI() // Force initial render
    }, 0)
  }

  // Event handlers
  const closeModal = () => {
    modal.classList.add('animate-fade-out-down')
    setTimeout(() => modal.remove(), 200) // Match animation duration
  }

  modal.querySelectorAll('[data-action="close"]').forEach(btn => {
    btn.addEventListener('click', closeModal)
  })

  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal()
  })

  const handleEscape = (e) => {
    if (e.key === 'Escape') {
      closeModal()
      document.removeEventListener('keydown', handleEscape)
    }
  }
  document.addEventListener('keydown', handleEscape)

  return modal
}


function formatCurrency(value, currency = 'USD') {
  if (!value) return currency === 'USD' ? '$0.00' : 'R$ 0,00'
  if (currency === 'BRL') {
    return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }
  return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}
