/**
 * InventoryGridRenderer.js
 * 
 * Handles HTML generation for InventoryView. 
 * Pure function style (mostly).
 * 
 * @module views/renderers/InventoryGridRenderer
 */

import { escapeHtml } from '../../utils/stringUtils.js'
import { getIcon } from '../../components/Icons.js'

export class InventoryGridRenderer {

    static render(state) {
        if (!state) return ''
        const { filteredAlbums, viewMode, isLoading } = state

        if (isLoading) {
            // Use existing skeletons
            return InventoryGridRenderer.renderLoading()
        }

        if (filteredAlbums.length === 0) {
            return InventoryGridRenderer.renderEmptyState()
        }

        return viewMode === 'list'
            ? InventoryGridRenderer.renderList(filteredAlbums)
            : InventoryGridRenderer.renderGrid(filteredAlbums)
    }

    static renderGrid(albums) {
        return `
            <div class="albums-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 fade-in">
                ${albums.map(album => InventoryGridRenderer.renderCard(album)).join('')}
            </div>
        `
    }

    static renderList(albums) {
        return `
            <div class="albums-list space-y-3 fade-in">
                ${albums.map(album => InventoryGridRenderer.renderRow(album)).join('')}
            </div>
        `
    }

    static renderCard(album) {
        // Logic: 
        // 3-way dropdown for status
        const isOwned = album.owned === true
        const isWishlist = album.owned === false
        // null/undefined is "Not Owned" (Backlog/Inbox)

        let borderColor = 'border-gray-600 text-gray-400'
        if (isOwned) borderColor = 'border-green-500/50 text-green-400'
        else if (isWishlist) borderColor = 'border-pink-500/50 text-pink-400'

        return `
      <div class="album-card glass-panel p-4 relative group" data-album-id="${album.id}">
        <!-- Status Dropdown (top right) -->
        <div class="absolute top-2 right-2 z-10 w-32">
          <div class="relative group/dropdown">
            <select 
              class="status-select w-full appearance-none pl-3 pr-8 py-1 rounded-full text-xs font-medium border cursor-pointer focus:outline-none focus:ring-2 focus:ring-accent-primary transition-colors bg-gray-900 ${borderColor}"
              data-album-id="${album.id}"
              style="background-color: #1f2937;"
            >
              <option value="not-owned" ${!isOwned && !isWishlist ? 'selected' : ''} class="bg-gray-900 text-white">Not Owned</option>
              <option value="owned" ${isOwned ? 'selected' : ''} class="bg-gray-900 text-green-400">✓ Owned</option>
              <option value="wishlist" ${isWishlist ? 'selected' : ''} class="bg-gray-900 text-pink-400">♡ Wishlist</option>
            </select>
            <!-- Custom Arrow -->
            <div class="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-current opacity-70">
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
              </svg>
            </div>
          </div>
        </div>
        
        <!-- Album Cover -->
        <div class="album-cover mb-4 aspect-square bg-surface-light rounded-lg flex items-center justify-center cursor-pointer overflow-hidden relative view-album-btn"
             data-album-id="${album.id}">
            ${album.albumData?.coverUrl ? `
                <img src="${album.albumData.coverUrl}" alt="${escapeHtml(album.title)}" 
                     class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
            ` : `
                <div class="text-gray-600">${getIcon('Disc', 'w-12 h-12')}</div>
            `}
            
            <!-- Quick Actions Overlay -->
            <div class="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-sm">
                 <button class="btn btn-sm btn-ghost view-album-btn text-white" data-album-id="${album.id}" title="View Details">
                    ${getIcon('Eye', 'w-5 h-5')}
                 </button>
                 <button class="btn btn-sm btn-ghost edit-album-btn text-blue-400" data-album-id="${album.id}" title="Edit">
                    ${getIcon('Edit', 'w-5 h-5')}
                 </button>
                 <button class="btn btn-sm btn-ghost delete-album-btn text-red-400" data-album-id="${album.id}" title="Delete">
                    ${getIcon('Trash2', 'w-5 h-5')}
                 </button>
            </div>
        </div>
        
        <!-- Info -->
        <div class="album-info">
            <h3 class="font-bold text-lg mb-1 truncate text-white" title="${escapeHtml(album.title)}">${escapeHtml(album.title)}</h3>
            <p class="text-sm text-gray-400 truncate mb-2">${escapeHtml(album.artist)}</p>
            
            <div class="flex items-center justify-between mt-3">
                ${InventoryGridRenderer.renderFormatBadge(album.format)}
                <span class="font-mono text-accent-primary font-bold">
                    ${InventoryGridRenderer.formatPrice(album.purchasePrice, album.currency)}
                </span>
            </div>
        </div>
      </div>
        `
    }

    static renderRow(album) {
        // Logic for List Mode
        // ... (Simplified for brevity, following similar patterns)
        return `
            <div class="album-row glass-panel p-3 flex items-center gap-4 hover:bg-white/5 transition-colors" data-album-id="${album.id}">
                <div class="w-12 h-12 bg-surface-light rounded flex items-center justify-center flex-shrink-0 overflow-hidden">
                     ${album.albumData?.coverUrl ? `
                        <img src="${album.albumData.coverUrl}" class="w-full h-full object-cover" />
                    ` : getIcon('Disc', 'w-6 h-6 text-gray-600')}
                </div>
                
                <div class="flex-1 min-w-0">
                    <h4 class="font-bold truncate">${escapeHtml(album.title)}</h4>
                    <p class="text-xs text-muted truncate">${escapeHtml(album.artist)}</p>
                </div>

                <div class="hidden md:block">
                     ${InventoryGridRenderer.renderFormatBadge(album.format)}
                </div>

                <div class="font-mono text-accent-primary font-bold whitespace-nowrap">
                    ${InventoryGridRenderer.formatPrice(album.purchasePrice, album.currency)}
                </div>

                <div class="actions flex gap-1">
                     <button class="btn btn-icon btn-sm btn-ghost edit-album-btn" data-album-id="${album.id}">${getIcon('Edit', 'w-4 h-4')}</button>
                     <button class="btn btn-icon btn-sm btn-ghost text-red-400 delete-album-btn" data-album-id="${album.id}">${getIcon('Trash2', 'w-4 h-4')}</button>
                </div>
            </div>
         `
    }

    static renderLoading() {
        return `<div class="p-8 text-center text-muted">Loading inventory...</div>`
    }

    static renderEmptyState() {
        return `<div class="p-12 text-center text-muted border border-dashed border-white/10 rounded-xl">No albums found matching your filters.</div>`
    }

    static formatPrice(price, currency = 'USD') {
        const val = Number(price) || 0
        if (currency === 'BRL') return `R$ ${val.toFixed(2)}`
        return `$${val.toFixed(2)}`
    }

    static renderFormatBadge(format) {
        const f = (format || '').toLowerCase()
        let color = 'bg-gray-700 text-gray-300'
        let text = format || 'Unknown'

        if (f.includes('vinyl') || f.includes('lp')) { color = 'bg-green-900/50 text-green-400 border border-green-500/30'; text = 'Vinyl' }
        else if (f.includes('cd')) { color = 'bg-blue-900/50 text-blue-400 border border-blue-500/30'; text = 'CD' }
        else if (f.includes('digital')) { color = 'bg-purple-900/50 text-purple-400'; text = 'Digital' }

        return `<span class="px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${color}">${text}</span>`
    }
}
