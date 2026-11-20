/**
 * InventoryGridRenderer.js
 *
 * Handles HTML generation for InventoryView.
 * Pure function style (mostly).
 *
 * @module views/renderers/InventoryGridRenderer
 */

import { escapeHtml } from '../../utils/stringUtils.js'
import { Card } from '../../components/ui/Card.js'
import { SafeDOM } from '../../utils/SafeDOM.js'
import { InventoryStatus, STATUS_SELECT_OPTIONS, statusOf } from '../../models/inventoryStatus.js'
import { averagesLine } from '../../models/albumAverages.js'
import { NoValue } from '../../models/inventoryValue.js'
import { cardValueBlock, rowValue } from './InventoryCardValue.js'

/** The colours of the status selector on a card, and of each of its options. */
const STATUS_BORDER = Object.freeze({
    [InventoryStatus.OWNED]: 'border-green-500/50 text-green-400',
    [InventoryStatus.NOT_OWNED]: 'border-gray-600',
    [InventoryStatus.WISHLIST]: 'border-pink-500/50 text-pink-400'
})
const STATUS_OPTION = Object.freeze({
    [InventoryStatus.OWNED]: 'bg-gray-900 text-green-400',
    [InventoryStatus.NOT_OWNED]: 'bg-gray-900 text-white',
    [InventoryStatus.WISHLIST]: 'bg-gray-900 text-pink-400'
})

/** The card as a surface (F75, prototype v5.1): its own background and a faint edge. */
const CARD_SURFACE = 'background:#15151a;border:1px solid rgba(255,255,255,.08)'
/** The value of an item nothing was said about: the screen draws before the values are known. */
const NOT_KNOWN = Object.freeze({ origin: null, reason: NoValue.NEVER_READ })
const USD_ONLY = Object.freeze({ currency: 'USD', rates: null })

/** What the screen knows of the values, or the little that is true before it knows anything. */
const valuesOf = (state) => state?.value || { values: new Map(), money: USD_ONLY }

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

        const known = valuesOf(state)
        return viewMode === 'list'
            ? InventoryGridRenderer.renderList(filteredAlbums, known)
            : InventoryGridRenderer.renderGrid(filteredAlbums, known)
    }

    static renderGrid(albums, known = valuesOf()) {
        return `
            <div class="albums-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 fade-in">
                ${albums.map(album => InventoryGridRenderer.renderCard(album, known)).join('')}
            </div>
        `
    }

    static renderList(albums, known = valuesOf()) {
        return `
            <div class="albums-list space-y-3 fade-in">
                ${albums.map(album => InventoryGridRenderer.renderRow(album, known)).join('')}
            </div>
        `
    }

    /**
     * The card of the grid, as HTML: the Card of the app made into a surface, the cover reaching
     * its edges, and under the title the five lines every card has (InventoryCardValue.js).
     */
    static cardSurface(cardProps, valueBlock) {
        const card = Card.render(cardProps)
        card.classList.remove('h-full')
        const [cover, info] = card.children
        cover.classList.remove('rounded-xl', 'border', 'border-white/5')
        cover.style.borderRadius = '0'
        cover.style.border = '0'
        // the row of tags gives way to the value block: the format is said there
        Array.from(info.children).slice(1).forEach(node => info.removeChild(node))
        info.style.padding = '0 12px 12px'
        info.appendChild(SafeDOM.fromHTML(valueBlock))
        return card.outerHTML
    }

    /** The status of an item, chosen on its card. */
    static renderStatusSelect(album, status) {
        const statusOptions = STATUS_SELECT_OPTIONS.map(({ value, label }) =>
            `<option value="${value}" ${value === status ? 'selected' : ''} class="${STATUS_OPTION[value]}">${escapeHtml(label)}</option>`).join('')

        return `
        <div class="absolute top-2 right-2 z-20 w-32 user-select-none">
          <div class="relative group/dropdown">
            <select
              class="status-select w-full appearance-none pl-3 pr-8 py-1 rounded-full text-xs font-medium border cursor-pointer focus:outline-none focus:ring-2 focus:ring-accent-primary transition-colors bg-gray-900 ${STATUS_BORDER[status]}"
              data-album-id="${escapeHtml(album.id)}"
              style="background-color: #1f2937;"
              aria-label="Status"
            >
              ${statusOptions}
            </select>
            <div class="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-current opacity-70">
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
              </svg>
            </div>
          </div>
        </div>`
    }

    /**
     * The card of an item (F75, REQ-01): a surface with the cover to its edges, the status
     * selector over the cover, the title, and the five lines of the value block.
     * @param {Object} album - an inventory item
     * @param {{ values: Map, money: Object }} [known] - what the screen knows of the values
     */
    static renderCard(album, known = valuesOf()) {
        const value = known.values.get(album.id) || NOT_KNOWN

        const cardProps = {
            variant: 'grid',
            entity: album,
            title: album.title,
            subtitle: album.artist,
            image: album.albumData?.coverUrl || album.coverUrl,
            actions: [
                { icon: 'Eye', label: 'View', action: 'view-modal', class: 'view-album-btn' },
                { icon: 'Edit', label: 'Edit', action: 'edit-modal', class: 'edit-album-btn text-blue-400' },
                { icon: 'Trash2', label: 'Delete', action: 'delete-modal', class: 'delete-album-btn text-red-400' }
            ]
            // Custom click handling for specific targets is managed by View delegation
        }
        const cardHTML = InventoryGridRenderer.cardSurface(cardProps, cardValueBlock(album, value, known.money))

        // The Card is one root element, wrapped so that the status selector sits over the cover;
        // data-album-id is on the wrapper for the delegation of the view.
        return `
            <div class="inventory-card-wrapper relative group h-full flex flex-col rounded-xl overflow-hidden" data-album-id="${escapeHtml(album.id)}" style="${CARD_SURFACE}">
                ${InventoryGridRenderer.renderStatusSelect(album, statusOf(album))}
                <div class="flex-1 min-h-0 w-full">
                    ${cardHTML}
                </div>
            </div>
        `
    }

    static renderRow(album, known = valuesOf()) {
        const value = known.values.get(album.id) || NOT_KNOWN
        const cardProps = {
            variant: 'list',
            entity: album,
            title: album.title,
            subtitle: album.artist,
            image: album.albumData?.coverUrl || album.coverUrl,
            content: SafeDOM.fromHTML(`
                 <div class="flex flex-wrap items-center gap-4 mt-2">
                    ${InventoryGridRenderer.renderFormatBadge(album.format)}
                    ${rowValue(album, value, known.money)}
                    ${InventoryGridRenderer.renderAverages(album)}
                 </div>
            `),
            actions: [
                { icon: 'Edit', label: 'Edit', action: 'edit-modal', class: 'edit-album-btn' },
                { icon: 'Trash2', label: 'Delete', action: 'delete-modal', class: 'delete-album-btn text-red-400' }
            ]
        }
        return `
            <div class="inventory-row-wrapper relative cursor-pointer hover:bg-white/5 transition-colors rounded-xl overflow-hidden" data-album-id="${escapeHtml(album.id)}">
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

    /**
     * The averages of an item in the list view (F71, S-56): «Avg Rating: 78.4 · Avg Pop: 42.6%», in
     * one small line. An item that was never read shows nothing, not a dash. (The card of the grid
     * shows them in its third line: InventoryCardValue.js.)
     */
    static renderAverages(album) {
        const line = averagesLine(album.averages)
        if (!line) return ''
        return `<span class="text-xs text-gray-400" data-role="averages" title="Mean of the BestEverAlbums rating and of the Spotify popularity of the tracks; in brackets, how many tracks of the album each mean was made of">${escapeHtml(line)}</span>`
    }

    static renderFormatBadge(format) {
        if (!format) return ''
        const f = format.toLowerCase()
        let color = 'bg-gray-700 text-gray-300'
        let text = format

        if (f.includes('vinyl') || f.includes('lp')) { color = 'bg-green-900/50 text-green-400 border border-green-500/30'; text = 'Vinyl' }
        else if (f.includes('cd')) { color = 'bg-blue-900/50 text-blue-400 border border-blue-500/30'; text = 'CD' }
        else if (f.includes('digital')) { color = 'bg-purple-900/50 text-purple-400'; text = 'Digital' }

        return `<span class="px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${color}">${escapeHtml(text)}</span>`
    }
}
