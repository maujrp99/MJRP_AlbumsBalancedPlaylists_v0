import { TracksTable } from './TracksTable.js'
import { TracksTabs } from './TracksTabs.js'
import { describePopularity } from '../../models/popularityState.js'
import { mergedTracksOf } from '../../models/albumAverages.js'
import { SafeDOM } from '../../utils/SafeDOM.js'

/**
 * Smart Container for Multi-Source Ranking Comparison
 * Handles logic, state, and data processing.
 * It never talks to Spotify (F69): where the popularity of the album is comes in `popularity`,
 * and asking for it again goes out through `popularity.onAsk`, to the album load.
 * REFACTORED: SafeDOM implementation (Sprint 15 Phase 4.3)
 */
export class TracksRankingComparison {
    /**
     * @param {Object} props
     * @param {Album} props.album - The album model
     * @param {{ status: string, onAsk: Function }|null} [props.popularity] - the state of the
     *        album's Spotify popularity in the album load (EnrichmentStatus) and how to ask for it
     *        again: (albumId) => void. Without it (the album window) no line is shown.
     */
    constructor({ album, popularity = null }) {
        this.album = album
        this.popularity = popularity
        this.state = {
            sortField: 'position', // 'position' | 'rank' | 'spotifyPopularity'
            sortDirection: 'asc',  // 'asc' | 'desc'
            activeTab: 'original', // 'original' | 'acclaim' | 'spotify' (Mobile)
            tracks: this.normalizeTracks(album)
        }

        // Bind methods
        this.handleSort = this.handleSort.bind(this)
        this.handleTabChange = this.handleTabChange.bind(this)
        this.render = this.render.bind(this)
    }

    /**
     * Every track of the original order with what the acclaim order knows of it merged in
     * (models/albumAverages.js: the inventory averages the same tracks).
     */
    normalizeTracks(album) {
        return mergedTracksOf(album)
    }

    getSortedTracks() {
        const { tracks, sortField, sortDirection } = this.state

        return [...tracks].sort((a, b) => {
            let valA = a[sortField]
            let valB = b[sortField]

            // Special handling for missing data
            if (valA === -1) valA = -999999

            if (sortField === 'spotifyPopularity') {
                // Higher is better. Default direction for popularity should be DESC.
                if (a.spotifyPopularity === -1) valA = -Infinity
                if (b.spotifyPopularity === -1) valB = -Infinity
            }

            if (valA < valB) return sortDirection === 'asc' ? -1 : 1
            if (valA > valB) return sortDirection === 'asc' ? 1 : -1
            return 0
        })
    }

    handleSort(field) {
        // Toggle direction if clicking same field
        if (this.state.sortField === field) {
            this.state.sortDirection = this.state.sortDirection === 'asc' ? 'desc' : 'asc'
        } else {
            this.state.sortField = field
            // Default directions
            // Rank/Position: Asc (1 is best/first)
            // Popularity: Desc (100 is best)
            this.state.sortDirection = field === 'spotifyPopularity' ? 'desc' : 'asc'
        }
        this.updateUI()
    }

    handleTabChange(tab) {
        this.state.activeTab = tab
        // Auto-sort based on tab context for better UX
        if (tab === 'original') {
            this.state.sortField = 'position'
            this.state.sortDirection = 'asc'
        } else if (tab === 'acclaim') {
            this.state.sortField = 'rank'
            this.state.sortDirection = 'asc'
        } else if (tab === 'spotify') {
            this.state.sortField = 'spotifyPopularity'
            this.state.sortDirection = 'desc'
        }
        this.updateUI()
    }

    updateUI() {
        if (!this.container) return

        // Re-render components
        // FIX: Use scoped queries within this.container instead of global document.querySelector
        // AND use classes, as IDs must be unique
        const tableContainer = this.container.querySelector('.tracks-table-container')
        const tabsContainer = this.container.querySelector('.tracks-tabs-container')

        const sortedTracks = this.getSortedTracks()

        if (tableContainer) {
            // Clear previous content to avoid appending duplicates if not handled by sub-component
            SafeDOM.clear(tableContainer)
            new TracksTable({
                tracks: sortedTracks,
                sortField: this.state.sortField,
                sortDirection: this.state.sortDirection,
                onSort: this.handleSort
            }).mount(tableContainer)
        }

        if (tabsContainer) {
            SafeDOM.clear(tabsContainer)
            new TracksTabs({
                tracks: sortedTracks,
                activeTab: this.state.activeTab,
                onTabChange: this.handleTabChange
            }).mount(tabsContainer)
        }
    }

    render() {
        // Responsive Strategy
        setTimeout(() => this.updateUI(), 0)

        const children = []

        const notice = this.renderPopularityNotice()
        if (notice) children.push(notice)

        // Desktop View Container
        children.push(SafeDOM.div({
            className: 'tracks-table-container hidden md:block'
        }, SafeDOM.div({ className: 'animate-pulse bg-white/5 h-64 rounded-xl' })))

        // Mobile View Container
        children.push(SafeDOM.div({
            className: 'tracks-tabs-container md:hidden'
        }, SafeDOM.div({ className: 'animate-pulse bg-white/5 h-64 rounded-xl' })))

        return SafeDOM.div({
            className: 'tracks-ranking-comparison w-full space-y-6'
        }, children)
    }

    async mount(container) {
        if (!container) return
        this.container = container // Store ref for scoped updates
        SafeDOM.clear(container)
        container.appendChild(this.render())
        // Event listener for enrich button is now handled in render(), simpler.
    }

    /**
     * The one line about the Spotify popularity of an album that has none on it: not connected
     * (quiet, nothing to press), failed ("Try again"), Spotify has none, or being asked.
     * @returns {HTMLElement|null}
     */
    renderPopularityNotice() {
        const line = this.album.spotifyId ? null : describePopularity(this.popularity?.status)
        if (!line) return null

        const children = [SafeDOM.span({ className: line.quiet ? 'text-gray-400 text-sm' : 'text-blue-400 text-sm' }, line.text)]
        if (line.action) children.push(this.renderAskButton(line.action))

        return SafeDOM.div({
            className: `popularity-notice flex justify-between items-center mb-4 ${line.quiet ? 'px-1' : 'bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl'}`
        }, children)
    }

    /** The button that asks the album load for the popularity again; the load redraws the album. */
    renderAskButton(label) {
        const button = SafeDOM.button({
            className: 'enrich-btn px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white text-xs rounded-lg transition-colors',
            textContent: label
        })
        button.onclick = () => {
            button.disabled = true
            button.textContent = 'Asking…'
            this.popularity.onAsk(this.album.id)
        }
        return button
    }
}
