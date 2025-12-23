/**
 * BlendSeriesSelector.js
 * 
 * Step 1: 🍹 Choose Your Blend
 * Entity type dropdown + Series selector
 * 
 * @module components/blend/BlendSeriesSelector
 */

import { getIcon } from '../Icons.js'
import { albumSeriesStore } from '../../stores/albumSeries.js'

export class BlendSeriesSelector {
    constructor(opts = {}) {
        this.onEntityChange = opts.onEntityChange || (() => { })
        this.onSeriesSelect = opts.onSeriesSelect || (() => { })
        this.selectedEntity = opts.selectedEntity || 'albums'
        this.selectedSeries = opts.selectedSeries || null
        this.series = []
        this.isLoading = false
    }

    /**
     * Entity types available
     */
    static ENTITY_TYPES = [
        { id: 'albums', label: 'Albums', icon: 'Disc', available: true },
        { id: 'artists', label: 'Artists', icon: 'User', available: false },
        { id: 'genres', label: 'Genres', icon: 'Tag', available: false },
        { id: 'tracks', label: 'Tracks', icon: 'Music', available: false }
    ]

    /**
     * Load series for selected entity type
     */
    async loadSeries() {
        this.isLoading = true
        this.render()

        try {
            if (this.selectedEntity === 'albums') {
                await albumSeriesStore.loadFromFirestore()
                this.series = albumSeriesStore.getSeries()
            } else {
                // Other entity types not yet implemented
                this.series = []
            }
        } catch (err) {
            console.error('[BlendSeriesSelector] Error loading series:', err)
            this.series = []
        }

        this.isLoading = false
        this.render()
    }

    /**
     * Render the component
     */
    render() {
        const container = document.getElementById('blend-series-selector')
        if (!container) return

        const entityOptions = BlendSeriesSelector.ENTITY_TYPES.map(t => `
            <option value="${t.id}" ${t.id === this.selectedEntity ? 'selected' : ''} ${!t.available ? 'disabled' : ''}>
                ${t.label}${!t.available ? ' (Coming Soon)' : ''}
            </option>
        `).join('')

        const seriesCards = this.isLoading
            ? `<div class="flex items-center justify-center py-8">
                   <div class="animate-spin rounded-full h-8 w-8 border-2 border-orange-400 border-t-transparent"></div>
               </div>`
            : this.series.length === 0
                ? `<p class="text-muted text-center py-4">No series found for this entity type</p>`
                : this.series.map(s => this.renderSeriesCard(s)).join('')

        container.innerHTML = `
            <div class="mb-6">
                <label class="block text-sm font-medium mb-2 text-muted">Blend your Music by</label>
                <select id="blend-entity-select" class="w-full bg-surface/60 border border-white/10 rounded-lg px-4 py-3 focus:border-orange-400 focus:ring-1 focus:ring-orange-400 transition-all">
                    ${entityOptions}
                </select>
            </div>
            
            <div>
                <label class="block text-sm font-medium mb-3 text-muted">Select Series</label>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-64 overflow-y-auto pr-2">
                    ${seriesCards}
                </div>
            </div>
        `

        this.attachListeners()
    }

    /**
     * Render individual series card
     */
    renderSeriesCard(series) {
        const isSelected = this.selectedSeries?.id === series.id
        const albumCount = series.albums?.length || 0

        return `
            <div class="blend-series-card group cursor-pointer p-4 rounded-lg border transition-all duration-200
                ${isSelected
                ? 'border-orange-400 bg-orange-400/10 ring-1 ring-orange-400'
                : 'border-white/10 bg-white/5 hover:border-orange-400/50 hover:bg-white/10'}"
                data-series-id="${series.id}">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500/20 to-amber-500/10 flex items-center justify-center">
                        ${getIcon('FolderOpen', 'w-5 h-5 text-orange-400')}
                    </div>
                    <div class="flex-1 min-w-0">
                        <h4 class="font-medium truncate ${isSelected ? 'text-orange-400' : ''}">${series.name}</h4>
                        <p class="text-xs text-muted">${albumCount} album${albumCount !== 1 ? 's' : ''}</p>
                    </div>
                    ${isSelected ? `<div class="text-orange-400">${getIcon('Check', 'w-5 h-5')}</div>` : ''}
                </div>
            </div>
        `
    }

    /**
     * Attach event listeners
     */
    attachListeners() {
        // Entity type change
        const entitySelect = document.getElementById('blend-entity-select')
        if (entitySelect) {
            entitySelect.addEventListener('change', (e) => {
                this.selectedEntity = e.target.value
                this.selectedSeries = null
                this.onEntityChange(this.selectedEntity)
                this.loadSeries()
            })
        }

        // Series selection
        document.querySelectorAll('.blend-series-card').forEach(card => {
            card.addEventListener('click', () => {
                const seriesId = card.dataset.seriesId
                const series = this.series.find(s => s.id === seriesId)
                this.selectedSeries = series
                this.onSeriesSelect(series)
                this.render()
            })
        })
    }

    /**
     * Get current selection
     */
    getSelection() {
        return {
            entityType: this.selectedEntity,
            series: this.selectedSeries
        }
    }
}

export default BlendSeriesSelector
