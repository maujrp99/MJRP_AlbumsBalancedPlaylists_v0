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
import { Card } from '../../components/ui/Card.js'
import { SafeDOM } from '../../utils/SafeDOM.js'

export class InventoryGridRenderer {

    static render(state) {
        if (!state) return ''
        const { filteredAlbums, viewMode, isLoading } = state

        if (isLoading) {
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
        const isOwned = album.owned === true
        const isWishlist = album.owned === false

        // Normalize album data for Card
        const cardProps = {
            variant: 'grid',
            entity: album,
            title: album.title,
            subtitle: album.artist,
            image: album.albumData?.coverUrl || album.coverUrl,
            badge: InventoryGridRenderer.getFormatLabel(album.format),
            actions: [
                { icon: 'Eye', label: 'View', action: 'view-modal', class: 'view-album-btn' },
                { icon: 'Edit', label: 'Edit', action: 'edit-modal', class: 'edit-album-btn text-blue-400' },
                { icon: 'Trash2', label: 'Delete', action: 'delete-modal', class: 'delete-album-btn text-red-400' }
            ],
            // Custom click handling for specific targets is managed by View delegation
            // so we don't attach specific onClick props here for the adapter mode
        }

        // We wrap the Card in a relative container to overlay the custom Inventory Status Dropdown
        // This preserves the specific Inventory requirement while reusing the Card UI
        // Fix: Remove h-full from Card to facilitate custom footer stacking without overlap
        const cardHTML = Card.renderHTML(cardProps).replace('h-full', '')

        // Inject Status Dropdown (This is specific to Inventory, so we inject it into the card container)
        // Note: The Card render creates a div. We will wrap it or rely on absolute positioning.
        // To avoid parsing HTML, we can render the status dropdown and append it, 
        // BUT since we are returning a string, we concatenate.

        let borderColor = 'border-gray-600'
        if (isOwned) borderColor = 'border-green-500/50 text-green-400'
        else if (isWishlist) borderColor = 'border-pink-500/50 text-pink-400'

        const statusDropdown = `
        <div class="absolute top-2 right-2 z-20 w-32 user-select-none">
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
            <div class="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-current opacity-70">
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
              </svg>
            </div>
          </div>
        </div>`

        // Hacky but effective: The Card is 1 root element. We put it in a wrapper with relative positioning so the dropdown works.
        // And we ensure data-album-id is on the wrapper for delegation.
        // Updated Layout: Use flex-col to stack Card and Footer properly.
        return `
            <div class="inventory-card-wrapper relative group h-full flex flex-col" data-album-id="${album.id}">
                ${statusDropdown}
                <div class="flex-1 min-h-0 w-full">
                    ${cardHTML}
                </div>
                
                <div class="mt-2 flex justify-between items-center px-1 shrink-0">
                     <span class="font-mono text-accent-primary font-bold">
                        ${InventoryGridRenderer.formatPrice(album.purchasePrice, album.currency)}
                    </span>
                </div>
            </div>
        `
    }

    static renderRow(album) {
        const cardProps = {
            variant: 'list',
            entity: album,
            title: album.title,
            subtitle: album.artist,
            image: album.albumData?.coverUrl || album.coverUrl,
            content: SafeDOM.fromHTML(`
                 <div class="flex items-center gap-4 mt-2">
                    ${InventoryGridRenderer.renderFormatBadge(album.format)}
                    <span class="font-mono text-accent-primary font-bold">
                        ${InventoryGridRenderer.formatPrice(album.purchasePrice, album.currency)}
                    </span>
                 </div>
            `),
            actions: [
                { icon: 'Edit', label: 'Edit', action: 'edit-modal', class: 'edit-album-btn' },
                { icon: 'Trash2', label: 'Delete', action: 'delete-modal', class: 'delete-album-btn text-red-400' }
            ]
        }
        return `
            <div class="inventory-row-wrapper relative cursor-pointer hover:bg-white/5 transition-colors rounded-xl overflow-hidden" data-album-id="${album.id}">
                ${Card.renderHTML(cardProps)}
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

    static getFormatLabel(format) {
        const f = (format || '').toLowerCase()
        if (f.includes('vinyl') || f.includes('lp')) return 'Vinyl'
        if (f.includes('cd')) return 'CD'
        if (f.includes('digital')) return 'Digital'
        return format || 'Unknown'
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
