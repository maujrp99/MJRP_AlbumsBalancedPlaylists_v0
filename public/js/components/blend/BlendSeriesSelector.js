/**
 * BlendSeriesSelector.js
 * 
 * Step 1: 🍹 Choose Your Blend
 * Entity type dropdown + Series selector
 * 
 * @module components/blend/BlendSeriesSelector
 */

import { getIcon } from '../Icons.js'
import { escapeHtml } from '../../utils/stringUtils.js'
import { albumSeriesStore } from '../../stores/albumSeries.js'
import { getSeriesService } from '../../services/SeriesService.js'
import { AlbumCascade } from '../common/AlbumCascade.js'
import { optimizedAlbumLoader } from '../../services/OptimizedAlbumLoader.js'
import { BlendSeriesPhonePicker } from './BlendSeriesPhonePicker.js'
import { isPhone } from '../../utils/isPhone.js'

export class BlendSeriesSelector {
    constructor(opts = {}) {
        this.onEntityChange = opts.onEntityChange || (() => { })
        this.onSeriesSelect = opts.onSeriesSelect || (() => { })
        this.selectedEntity = opts.selectedEntity || 'albums'
        this.selectedSeries = opts.selectedSeries || null
        this.series = []
        this.isLoading = false
        // Cache for album cover thumbnails (keyed by series ID)
        this.thumbnailCache = new Map()
        // The phone (F76): one row in the page and a sheet with search, instead of the box that scrolls
        this.phonePicker = new BlendSeriesPhonePicker({
            getSeries: () => this.series,
            getChosen: () => this.selectedSeries,
            thumbnailsOf: (series) => this.getSeriesThumbnails(series, 3),
            onChoose: (series) => this.choose(series)
        })
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
                const db = albumSeriesStore.getDb()
                if (db) {
                    const service = getSeriesService(db, null, albumSeriesStore.getUserId())
                    await service.loadFromFirestore()
                }
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

        // Preload thumbnails (async, non-blocking)
        this.preloadAllThumbnails()
    }

    /**
     * Preload thumbnails for all series
     * Non-blocking - updates UI as thumbnails become available
     */
    async preloadAllThumbnails() {
        for (const series of this.series) {
            if (!this.thumbnailCache.has(series.id)) {
                this.preloadSeriesThumbnails(series).then(() => {
                    this.render() // Re-render to show loaded thumbnails
                })
            }
        }
    }

    /**
     * Preload thumbnails for a single series
     * Parses "Artist - Album" strings and fetches real covers
     */
    async preloadSeriesThumbnails(series, max = 3) {
        const queries = series.albumQueries || []
        const thumbs = []
        const count = Math.min(queries.length, max)

        for (let i = 0; i < count; i++) {
            const query = queries[i]
            let coverUrl = null

            // Handle various query formats
            if (typeof query === 'object') {
                // Direct properties
                if (query.imageUrl) coverUrl = query.imageUrl
                else if (query.coverUrl) coverUrl = query.coverUrl
                else if (query.artwork?.url) coverUrl = query.artwork.url

                // Fallback to name parsing if object but no image
                const name = query.name || query.title
                if (!coverUrl && name && typeof name === 'string' && name.includes(' - ')) {
                    const [artist, ...albumParts] = name.split(' - ')
                    try {
                        const found = await optimizedAlbumLoader.findAlbum(artist, albumParts.join(' - '))
                        if (found) coverUrl = optimizedAlbumLoader.getArtworkUrl(found, 100)
                    } catch {
                        console.debug(`[BlendSeriesSelector] Could not find cover for: ${name}`)
                    }
                }
            }
            else if (typeof query === 'string' && query.includes(' - ')) {
                // Parse "Artist - Album" format
                const [artist, ...albumParts] = query.split(' - ')
                const album = albumParts.join(' - ')

                try {
                    const found = await optimizedAlbumLoader.findAlbum(artist, album)
                    if (found) {
                        coverUrl = optimizedAlbumLoader.getArtworkUrl(found, 100)
                    }
                } catch {
                    console.debug(`[BlendSeriesSelector] Could not find cover for: ${query}`)
                }
            }

            thumbs.push(coverUrl)
        }

        this.thumbnailCache.set(series.id, thumbs)
        return thumbs
    }

    /**
     * Render the component
     */
    render() {
        const container = document.getElementById('blend-series-selector')
        if (!container) return
        if (isPhone()) return this.renderPhone(container)

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
                <div class="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                    ${seriesCards}
                </div>
            </div>
        `

        this.attachListeners()
        this.revealChosenCard(container)
    }

    /**
     * The phone (F76, REQ-10): the same «Blend your Music by» select, then one row with the series
     * chosen that opens the sheet with every series and a search. No list with its own scroll.
     */
    renderPhone(container) {
        const entityOptions = BlendSeriesSelector.ENTITY_TYPES.map(t => `
            <option value="${t.id}" ${t.id === this.selectedEntity ? 'selected' : ''} ${!t.available ? 'disabled' : ''}>
                ${t.label}${!t.available ? ' (Coming Soon)' : ''}
            </option>
        `).join('')
        container.innerHTML = `
            <div class="blend-entity">
                <label for="blend-entity-select" class="blend-entity__label">Blend your Music by</label>
                <select id="blend-entity-select" class="w-full bg-surface/60 border border-white/10 rounded-lg px-4 py-3">${entityOptions}</select>
            </div>
            <p class="blend-pick__label">Series</p>
        `
        container.appendChild(this.phonePicker.renderRow({ loading: this.isLoading }))
        this.phonePicker.refresh()
        this.attachListeners()
    }

    /** A series was chosen (a card on the computer, a row of the sheet on the phone). */
    choose(series) {
        this.selectedSeries = series
        this.onSeriesSelect(series)
        this.render()
    }

    /**
     * Choose a series by its id, without a click: the menu was opened from that series
     * (/blend?seriesId=<id>, F63). Call it after loadSeries().
     * @param {string|undefined} seriesId
     * @returns {Object|null} the series, or null when the id is not one of the person's series
     */
    selectById(seriesId) {
        const series = seriesId ? this.series.find(s => s.id === seriesId) : null
        if (!series) return null
        this.selectedSeries = series
        this.revealChosen = true
        return series
    }

    /** The list scrolls: a series chosen by the address may be below what shows. Once. */
    revealChosenCard(container) {
        if (!this.revealChosen) return
        const chosen = container.querySelector('.blend-series-card[aria-pressed="true"]')
        if (!chosen) return
        this.revealChosen = false
        if (typeof chosen.scrollIntoView === 'function') chosen.scrollIntoView({ block: 'nearest' })
    }

    /**
     * Render individual series card
     */
    renderSeriesCard(series) {
        const isSelected = this.selectedSeries?.id === series.id
        // Use albumQueries which is the actual array of album references
        const albumQueries = series.albumQueries || series.albums || []
        const albumCount = albumQueries.length

        // Get album thumbnails for cascade display (max 3)
        const thumbnails = this.getSeriesThumbnails(series, 3)

        return `
            <div class="blend-series-card group cursor-pointer p-4 rounded-lg border transition-all duration-200
                ${isSelected
                ? 'border-orange-400 bg-orange-400/10 ring-1 ring-orange-400'
                : 'border-white/10 bg-white/5 hover:border-orange-400/50 hover:bg-white/10'}"
                role="button" tabindex="0" aria-pressed="${isSelected}"
                data-series-id="${escapeHtml(series.id)}">
                <div class="flex items-center gap-3">
                    ${this.renderThumbnailsCascade(thumbnails)}
                    <div class="flex-1 min-w-0">
                        <h4 class="font-medium truncate ${isSelected ? 'text-orange-400' : ''}">${escapeHtml(series.name)}</h4>
                        <p class="text-xs text-muted">${albumCount} album${albumCount !== 1 ? 's' : ''}</p>
                    </div>
                    ${isSelected ? `<div class="text-orange-400">${getIcon('Check', 'w-5 h-5')}</div>` : ''}
                </div>
            </div>
        `
    }

    /**
     * Get thumbnails from series albumQueries
     * Uses cached thumbnails if available (preloaded with real covers)
     * Returns array of imageUrls or nulls (for placeholders)
     */
    getSeriesThumbnails(series, max = 3) {
        // Check cache first (populated by preloadSeriesThumbnails)
        if (this.thumbnailCache.has(series.id)) {
            return this.thumbnailCache.get(series.id).slice(0, max)
        }

        // Fallback: return nulls for placeholders (will be replaced when cache loads)
        const queries = series.albumQueries || []
        const count = Math.min(queries.length, max)
        return new Array(count).fill(null)
    }

    /**
     * Render cascade thumbnails component
     * Diagonal layout: each cover offset both horizontally and vertically
     */
    // DIAGONAL LAYOUT EXTRACTED TO COMPONENT
    renderThumbnailsCascade(thumbnails) {
        return AlbumCascade.render(thumbnails)
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
            const choose = () => {
                const seriesId = card.dataset.seriesId
                this.choose(this.series.find(s => s.id === seriesId))
            }
            card.addEventListener('click', choose)
            // The card is a button for the keyboard too
            card.addEventListener('keydown', (e) => {
                if (e.key !== 'Enter' && e.key !== ' ') return
                e.preventDefault()
                choose()
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
