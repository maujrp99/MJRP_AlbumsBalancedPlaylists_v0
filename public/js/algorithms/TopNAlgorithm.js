/**
 * TopNAlgorithm - Base class for Top N selection algorithms
 * 
 * Selects top N tracks from each album based on a ranking strategy.
 * Used by Blending Menu "flavor" algorithms.
 * 
 * @module algorithms/TopNAlgorithm
 */

import { BaseAlgorithm } from './BaseAlgorithm.js'
import { BalancedRankingStrategy } from '../ranking/BalancedRankingStrategy.js'

const DEFAULT_TARGET_SECONDS = 45 * 60 // 45 minutes

export class TopNAlgorithm extends BaseAlgorithm {
    static metadata = {
        id: 'top-n-base',
        name: 'Top N Algorithm',
        badge: 'BASE',
        description: 'Base class for Top N selection - do not use directly',
        isRecommended: false
    }

    /**
     * @param {Object} opts - Algorithm options
     * @param {number} opts.trackCount - Number of tracks per album (3 or 5)
     * @param {Object} opts.rankingStrategy - Strategy to rank tracks (Spotify/BEA)
     * @param {number} opts.targetDuration - Target playlist duration in seconds
     * @param {string} opts.outputMode - 'single' | 'multiple' | 'auto'
     */
    constructor(opts = {}) {
        super(opts)
        this.trackCount = opts.trackCount || 3
        this.rankingStrategy = opts.rankingStrategy || new BalancedRankingStrategy()
        this.targetDuration = opts.targetDuration || DEFAULT_TARGET_SECONDS
        this.outputMode = opts.outputMode || 'auto' // 'single' | 'multiple' | 'auto'

        this.defaultRankingSource = this.registerRankingSource(opts.defaultRankingSource || {
            name: 'Top N Algorithm',
            type: 'internal',
            description: `Top ${this.trackCount} selection`,
            secure: true
        })
    }

    /**
     * Generate playlists selecting top N tracks from each album
     * @param {Array} albums - Albums with tracks
     * @param {Object} opts - Generation options
     * @returns {Object} { playlists, rankingSummary, rankingSources }
     */
    generate(albums, opts = {}) {
        const targetDuration = opts.targetDuration || this.targetDuration
        const outputMode = opts.outputMode || this.outputMode
        const groupingStrategy = opts.groupingStrategy || 'by_album'

        // Sprint 17: Determine N (allow override from opts)
        const trackCount = opts.trackCount || this.trackCount
        this._currentTrackCount = trackCount // Sprint 20: Store for getPlaylistTitle()
        this._currentGroupingStrategy = groupingStrategy // Sprint 20: Store for title suffix

        // Collect top N tracks from each album
        const allSelectedTracks = []

        for (const album of albums || []) {
            if (!album || !album.id) continue
            this.albumLookup.set(album.id, album)

            // Register ranking sources
            if (Array.isArray(album.rankingSources)) {
                album.rankingSources.forEach(s => this.registerRankingSource(s))
            }

            // Rank tracks using the injected strategy (allow override from opts)
            const rankingStrategy = opts.rankingStrategy || this.rankingStrategy
            const rankedTracks = rankingStrategy.rank(album)
            if (!Array.isArray(rankedTracks) || rankedTracks.length === 0) continue

            // Select top N
            const topN = rankedTracks.slice(0, trackCount)

            for (let i = 0; i < topN.length; i++) {
                const track = { ...topN[i] }
                this.markTrackOrigin(track, album.id)
                this.annotateTrack(track, `Top ${i + 1} of ${trackCount}`, this.defaultRankingSource, 1 - (i * 0.1))
                track._rank = i + 1
                allSelectedTracks.push(track)
            }
        }

        // Apply grouping/sorting
        this._applyGrouping(allSelectedTracks, groupingStrategy)

        // Calculate total duration
        const totalDuration = this.calculateTotalDuration(allSelectedTracks)

        // Determine how many playlists
        let playlists = []

        if (outputMode === 'single' || (outputMode === 'auto' && totalDuration <= targetDuration)) {
            // Single playlist
            playlists.push({
                id: 'p1',
                title: this.getPlaylistTitle(),
                subtitle: `Top ${trackCount} from each album`,
                tracks: allSelectedTracks
            })
        } else {
            // Multiple playlists based on target duration
            const numPlaylists = Math.max(1, Math.ceil(totalDuration / targetDuration))

            for (let i = 0; i < numPlaylists; i++) {
                playlists.push({
                    id: `p${i + 1}`,
                    title: `${this.getPlaylistTitle()} Vol. ${i + 1}`,
                    subtitle: `Top ${trackCount} from each album`,
                    tracks: []
                })
            }

            // Distribute tracks sequentially to fill playlists (preserves grouping)
            let currentPlaylistIdx = 0

            for (const track of allSelectedTracks) {
                // If current playlist is full (over target) AND not the last playlist, move to next
                const currentPlaylist = playlists[currentPlaylistIdx]
                const currentDuration = this.calculateTotalDuration(currentPlaylist.tracks)

                if (currentDuration >= targetDuration && currentPlaylistIdx < numPlaylists - 1) {
                    currentPlaylistIdx++
                }

                playlists[currentPlaylistIdx].tracks.push(track)
            }
        }

        // Build summary
        const rankingSummary = this.buildRankingSummary(playlists)

        return {
            playlists,
            rankingSummary,
            rankingSources: this.getRankingSources()
        }
    }

    /**
     * Put the selected tracks in the order of the grouping chosen in the menu (in place).
     * An unknown grouping, like «By Album», keeps the order of the albums.
     * @param {Array} tracks
     * @param {string} strategy
     */
    _applyGrouping(tracks, strategy) {
        const groupings = {
            flat_ranked: () => this._byRank(tracks),
            artist_rank: () => this._byArtistThenRank(tracks),
            shuffle: () => this._shuffled(tracks),
            ranked_interleave: () => this._interleavedByRank(tracks)
        }
        const ordered = groupings[strategy]?.()
        if (ordered) tracks.splice(0, tracks.length, ...ordered)
    }

    /** Every first place, then every second place... (the albums keep their order inside a place). */
    _byRank(tracks) {
        return [...tracks].sort((a, b) => (a._rank || 0) - (b._rank || 0))
    }

    /** The tracks of one artist together (artists in alphabetical order), by rank inside the artist. */
    _byArtistThenRank(tracks) {
        const artistOf = new Map(tracks.map(track => [track, this._getArtistName(track).toLowerCase()]))
        return [...tracks].sort((a, b) =>
            artistOf.get(a).localeCompare(artistOf.get(b)) || (a._rank || 0) - (b._rank || 0))
    }

    /** An even shuffle (Fisher-Yates): every order is as likely as any other. */
    _shuffled(tracks) {
        const shuffled = [...tracks]
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1))
            ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
        }
        return shuffled
    }

    /** Place by place, taking one track of each artist in turn. */
    _interleavedByRank(tracks) {
        const byRank = new Map()
        tracks.forEach(track => {
            const rank = track._rank || 999
            if (!byRank.has(rank)) byRank.set(rank, [])
            byRank.get(rank).push(track)
        })
        return [...byRank.keys()].sort((a, b) => a - b).flatMap(rank => this._roundRobinByArtist(byRank.get(rank)))
    }

    /** One track of each artist in turn, the artists in the order they first appear. */
    _roundRobinByArtist(tracks) {
        const byArtist = new Map()
        tracks.forEach(track => {
            const artist = this._getArtistName(track)
            if (!byArtist.has(artist)) byArtist.set(artist, [])
            byArtist.get(artist).push(track)
        })
        const groups = [...byArtist.values()]
        const longest = Math.max(0, ...groups.map(group => group.length))
        const turns = []
        for (let turn = 0; turn < longest; turn++) {
            groups.forEach(group => { if (group[turn]) turns.push(group[turn]) })
        }
        return turns
    }

    /**
     * Helper to safely get artist name
     */
    _getArtistName(t) {
        // Tactic 1: Explicit Track Artist
        if (t.artist) return t.artist // Common property on Apple Music/Spotify objects
        if (t.artistName) return t.artistName
        if (Array.isArray(t.artists) && t.artists[0]) return t.artists[0].name

        // Tactic 2: Album Artist (fallback)
        if (t._originAlbumId && this.albumLookup) {
            const album = this.albumLookup.get(t._originAlbumId)
            if (album && album.artist) return album.artist
        }

        return 'Unknown Artist'
    }

    /**
     * Get grouping strategy suffix for playlist title
     * @returns {string}
     */
    getGroupingSuffix() {
        const strategyMap = {
            'by_album': 'By Album',
            'flat_ranked': 'By Rank',
            'artist_rank': 'By Artist',
            'ranked_interleave': 'Bal.Intv.',
            'shuffle': 'Shuffle'
        }
        return strategyMap[this._currentGroupingStrategy] || ''
    }

    /**
     * Get playlist title - override in subclass
     * @returns {string}
     */
    getPlaylistTitle() {
        const n = this._currentTrackCount || this.trackCount
        const grouping = this.getGroupingSuffix()
        return `Top ${n}${grouping ? ' ' + grouping : ''}`
    }
}

export default TopNAlgorithm
