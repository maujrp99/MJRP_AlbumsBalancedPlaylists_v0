import { TracksTable } from './TracksTable.js'
import { TracksTabs } from './TracksTabs.js'
import { SpotifyService } from '../../services/SpotifyService.js'
import { SafeDOM } from '../../utils/SafeDOM.js'
import toast from '../Toast.js'

/**
 * Smart Container for Multi-Source Ranking Comparison
 * Handles logic, state, and data processing.
 * REFACTORED: SafeDOM implementation (Sprint 15 Phase 4.3)
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
        // Enriched/Ranked source (contains ratings, popularity)
        const enrichedTracks = album.getTracks('acclaim')

        // Create lookup map by title (normalized) for merging
        const enrichedMap = new Map()
        const norm = (str) => str?.toLowerCase().trim().replace(/[^a-z0-9]/g, '') || ''

        enrichedTracks.forEach(t => {
            enrichedMap.set(norm(t.title), t)
        })

        // We use tracksOriginalOrder as base to ensure we have all tracks 1..N
        return album.getTracks('original').map((track, idx) => {
            const enriched = enrichedMap.get(norm(track.title))

            return {
                ...track,
                // Merge enriched fields if available
                rank: enriched?.rank || track.rank || 999,
                rating: enriched?.rating || track.rating || null,
                spotifyPopularity: (enriched?.spotifyPopularity !== undefined && enriched?.spotifyPopularity !== null)
                    ? Number(enriched.spotifyPopularity)
                    : (track.spotifyPopularity !== undefined && track.spotifyPopularity !== null ? Number(track.spotifyPopularity) : -1),
                spotifyId: enriched?.spotifyId || track.spotifyId,
                // FIX: Ensure position fallback to index+1 if data missing
                position: Number(track.position) || (idx + 1),
                // FIX: Ensure duration from enriched source if available, else track, else 0
                duration: enriched?.duration || track.duration || 0
            }
        })
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

    getAverages() {
        const { tracks } = this.state

        // Acclaim Average (Rank)
        const rankedTracks = tracks.filter(t => t.rank && t.rank < 999)
        const avgRank = rankedTracks.length
            ? (rankedTracks.reduce((sum, t) => sum + t.rank, 0) / rankedTracks.length).toFixed(1)
            : '-'

        // Spotify Average (Popularity)
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

        // Enrichment Controls
        if (!this.album.spotifyId) {
            const enrichBtn = SafeDOM.button({
                className: 'enrich-btn px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white text-xs rounded-lg transition-colors',
                textContent: 'Enrich Data'
            })
            // Attach event listener directly here, but we need to match original logic which reused the button.
            // Actually, in `mount`, we can attach it. Or just attach it here and it will persist if re-rendered.
            // But `mount` calls `render` so it creates a fresh button. 
            // The original `mount` code attached the listener. We can keep that pattern or move it here.
            // Let's keep the structure simple and let `mount` handle the specific "enrich" logic binding if we want specifically to control the button ref,
            // OR we can bind it right here. Binding here is cleaner.

            enrichBtn.onclick = async (e) => {
                const btn = e.target
                btn.disabled = true
                btn.textContent = 'Loading...'

                try {
                    await this.enrichWithSpotifyData()
                    toast.success('Spotify data loaded!')

                    // Re-render with new data
                    this.state.tracks = this.normalizeTracks(this.album)

                    // We need to re-mount the whole thing because the "Enrichment Controls" section needs to disappear
                    if (this.container) {
                        this.mount(this.container)

                        // User persisted logic
                        const event = new CustomEvent('album-enriched', {
                            detail: { album: this.album },
                            bubbles: true
                        })
                        this.container.dispatchEvent(event)
                    }

                } catch (err) {
                    console.error('[TracksRankingComparison] Enrichment failed:', err)
                    toast.error(err.message || 'Spotify enrichment failed')
                    btn.disabled = false
                    btn.textContent = 'Enrich Data'
                }
            }

            children.push(SafeDOM.div({
                className: 'bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl flex justify-between items-center mb-4'
            }, [
                SafeDOM.span({ className: 'text-blue-400 text-sm' }, 'Spotify data not linked.'),
                enrichBtn
            ]))
        }

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
     * Fetch Spotify data for this album and update the Album model
     */
    async enrichWithSpotifyData() {
        const { SpotifyAuthService } = await import('../../services/SpotifyAuthService.js')

        // Check if connected to Spotify
        if (!SpotifyAuthService.isAuthenticated()) {
            throw new Error('Connect to Spotify first (click the Spotify button in the header)')
        }

        const spotifyAlbum = await SpotifyService.searchAlbum(this.album.artist, this.album.title)

        if (!spotifyAlbum) {
            throw new Error(`Album not found on Spotify: "${this.album.artist} - ${this.album.title}"`)
        }

        // Validate artist match
        if (!SpotifyService._validateMatch(spotifyAlbum, this.album.artist)) {
            console.warn('[TracksRankingComparison] Artist mismatch, but proceeding with found album')
        }

        // Fetch tracks with popularity
        const spotifyTracks = await SpotifyService.getAlbumTracksWithPopularity(spotifyAlbum.id)

        if (!spotifyTracks || spotifyTracks.length === 0) {
            throw new Error('No tracks found for this album on Spotify')
        }

        // Update Album model with Spotify data
        this.album.spotifyId = spotifyAlbum.id
        this.album.spotifyUrl = spotifyAlbum.external_urls?.spotify || null
        this.album.spotifyPopularity = SpotifyService.calculateAveragePopularity(spotifyTracks)

        // Match tracks by name and update spotifyPopularity
        const normalizeTitle = (str) => str?.toLowerCase().replace(/[^a-z0-9]/g, '') || ''

        // Create lookup map from Spotify tracks
        const spotifyTrackMap = new Map()
        spotifyTracks.forEach((st, idx) => {
            // FIX: Normalization was too strict?
            const key = normalizeTitle(st.name)
            spotifyTrackMap.set(key, {
                popularity: st.popularity,
                spotifyRank: idx + 1, // Rank by original Spotify order
                spotifyId: st.id,
                spotifyUri: st.uri,
                duration: st.duration_ms // Capture Duration!
            })
        })

        // Also create a ranked list by popularity
        const sortedByPop = [...spotifyTracks].sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
        const popRankMap = new Map()
        sortedByPop.forEach((st, idx) => {
            popRankMap.set(st.id, idx + 1)
        })

        // Update each track in album
        const tracks = this.album.tracks || []
        let matchCount = 0

        tracks.forEach(track => {
            const key = normalizeTitle(track.title || track.name)
            const spotifyData = spotifyTrackMap.get(key)

            if (spotifyData) {
                track.spotifyPopularity = spotifyData.popularity
                track.spotifyPopularityRank = popRankMap.get(spotifyData.spotifyId) || null
                track.spotifyId = spotifyData.spotifyId
                track.spotifyUri = spotifyData.spotifyUri
                // Update duration if missing
                if (!track.duration) track.duration = spotifyData.duration
                matchCount++
            } else {
                // Try fuzzy match (first 10 chars)
                const fuzzyKey = key.substring(0, 10)
                for (const [spotifyKey, data] of spotifyTrackMap.entries()) {
                    if (spotifyKey.startsWith(fuzzyKey) || fuzzyKey.startsWith(spotifyKey.substring(0, 10))) {
                        track.spotifyPopularity = data.popularity
                        track.spotifyPopularityRank = popRankMap.get(data.spotifyId) || null
                        track.spotifyId = data.spotifyId
                        track.spotifyUri = data.spotifyUri
                        if (!track.duration) track.duration = data.duration
                        matchCount++
                        break
                    }
                }
            }
        })

        console.log(`[TracksRankingComparison] Matched ${matchCount}/${tracks.length} tracks with Spotify data`)
    }
}
