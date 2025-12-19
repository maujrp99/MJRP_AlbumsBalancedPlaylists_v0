import { TracksTable } from './TracksTable.js'
import { TracksTabs } from './TracksTabs.js'
import { SpotifyService } from '../../services/SpotifyService.js'
import toast from '../Toast.js'

/**
 * Smart Container for Multi-Source Ranking Comparison
 * Handles logic, state, and data processing.
 */
export class TracksRankingComparison {
    /**
     * @param {Object} props
     * @param {Album} props.album - The album model
     */
    constructor({ album }) {
        this.album = album
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
     * Ensures all tracks have necessary fields for sorting/display
     * (Track model should already provide this, but this is a safety layer)
     */
    normalizeTracks(album) {
        // We use tracksOriginalOrder as base to ensure we have all tracks
        // (sometimes acclaim list might filter out stuff? unlikely but safe)
        return album.getTracks('original').map(track => ({
            ...track,
            // Ensure numeric values for sorting
            position: Number(track.position) || 999,
            rank: Number(track.rank) || 999, // 999 = unranked
            spotifyPopularity: track.spotifyPopularity !== null ? Number(track.spotifyPopularity) : -1
        }))
    }

    getSortedTracks() {
        const { tracks, sortField, sortDirection } = this.state

        return [...tracks].sort((a, b) => {
            let valA = a[sortField]
            let valB = b[sortField]

            // Special handling for missing data
            if (valA === -1) valA = -999999 // Always push missing spotify to bottom (if desc) or top (if asc)? 
            // Actually: -1 means "no data".
            // For Popularity (Desc is good): missing should be last. (0 is better than -1).
            // For Rank (Asc is good): missing (999) should be last.

            if (sortField === 'spotifyPopularity') {
                // Higher is better. Default direction for popularity should be DESC.
                // If val is -1 (missing), treat as -Infinity
                if (a.spotifyPopularity === -1) valA = -Infinity
                if (b.spotifyPopularity === -1) valB = -Infinity
            }

            if (valA < valB) return sortDirection === 'asc' ? -1 : 1
            if (valA > valB) return sortDirection === 'asc' ? 1 : -1
            return 0
        })
    }

    getAverages() {
        const { tracks } = this.state

        // Acclaim Average (Rank) - Lower is better? Or usually Rating?
        // Let's use Rating if available, otherwise Rank?
        // Plan said "Acclaim Index". Let's use Average Rank for now.
        const rankedTracks = tracks.filter(t => t.rank && t.rank < 999)
        const avgRank = rankedTracks.length
            ? (rankedTracks.reduce((sum, t) => sum + t.rank, 0) / rankedTracks.length).toFixed(1)
            : '-'

        // Spotify Average (Popularity) - Higher is better
        const popTracks = tracks.filter(t => t.spotifyPopularity >= 0)
        const avgPop = popTracks.length
            ? (popTracks.reduce((sum, t) => sum + t.spotifyPopularity, 0) / popTracks.length).toFixed(1)
            : '-'

        return { avgRank, avgPop, rankedCount: rankedTracks.length, popCount: popTracks.length }
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
        // Re-render components
        const tableContainer = document.querySelector('#tracks-table-container')
        const tabsContainer = document.querySelector('#tracks-tabs-container')
        const averagesContainer = document.querySelector('#ranking-averages')

        const sortedTracks = this.getSortedTracks()
        const averages = this.getAverages()

        if (tableContainer) {
            new TracksTable({
                tracks: sortedTracks,
                sortField: this.state.sortField,
                sortDirection: this.state.sortDirection,
                onSort: this.handleSort
            }).mount(tableContainer)
        }

        if (tabsContainer) {
            new TracksTabs({
                tracks: sortedTracks,
                activeTab: this.state.activeTab,
                onTabChange: this.handleTabChange
            }).mount(tabsContainer)
        }

        // Update Averages/Footer if separate
        // For now, presenters might render their own footers, 
        // but plan mentions a shared "Total Score" footer.
        // Let's pass averages to presenters.
    }

    render() {
        const sortedTracks = this.getSortedTracks()
        const averages = this.getAverages()

        // Responsive Strategy: Render BOTH containers, hide/show via CSS
        // This avoids complex JS resize listeners

        // We defer mounting to after render
        setTimeout(() => this.updateUI(), 0)

        return `
            <div class="tracks-ranking-comparison w-full space-y-6">
                
                <!-- Debug / Enrichment Controls (Temporary Placement) -->
                ${this.album.spotifyId ? '' : `
                    <div class="bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl flex justify-between items-center mb-4">
                        <span class="text-blue-400 text-sm">Spotify data not linked.</span>
                        <button id="enrichBtn" class="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white text-xs rounded-lg transition-colors">
                            Enrich Data
                        </button>
                    </div>
                `}

                <!-- Desktop View -->
                <div id="tracks-table-container" class="hidden md:block">
                    <!-- TracksTable mounts here -->
                    <div class="animate-pulse bg-white/5 h-64 rounded-xl"></div>
                </div>

                <!-- Mobile View -->
                <div id="tracks-tabs-container" class="md:hidden">
                    <!-- TracksTabs mounts here -->
                    <div class="animate-pulse bg-white/5 h-64 rounded-xl"></div>
                </div>

            </div>
        `
    }

    async mount(container) {
        if (!container) return
        container.innerHTML = this.render()

        // Bind Enrichment Button
        const enrichBtn = container.querySelector('#enrichBtn')
        if (enrichBtn) {
            enrichBtn.addEventListener('click', async () => {
                toast.info('Fetching Spotify data...')
                try {
                    // Call SpotifyService logic here (Phase 2 integration)
                    // For now just toast
                    toast.warning('Enrichment logic pending implementation')
                } catch (err) {
                    console.error(err)
                    toast.error('Enrichment failed')
                }
            })
        }
    }
}
