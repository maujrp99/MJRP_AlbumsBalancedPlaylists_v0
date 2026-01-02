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

        // Collect top N tracks from each album
        const allSelectedTracks = []

        for (const album of albums || []) {
            if (!album || !album.id) continue
            this.albumLookup.set(album.id, album)

            // Register ranking sources
            if (Array.isArray(album.rankingSources)) {
                album.rankingSources.forEach(s => this.registerRankingSource(s))
            }

            // Rank tracks using the injected strategy
            const rankedTracks = this.rankingStrategy.rank(album)
            if (!Array.isArray(rankedTracks) || rankedTracks.length === 0) continue

            // Select top N
            const topN = rankedTracks.slice(0, this.trackCount)

            for (let i = 0; i < topN.length; i++) {
                const track = { ...topN[i] }
                this.markTrackOrigin(track, album.id)
                this.annotateTrack(track, `Top ${i + 1} of ${this.trackCount}`, this.defaultRankingSource, 1 - (i * 0.1))
                track._rank = i + 1
                allSelectedTracks.push(track)
            }
        }

        // DEBUG: Log what grouping strategy is being applied
        console.log('[TopNAlgorithm] Applying groupingStrategy:', groupingStrategy)

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
                subtitle: `Top ${this.trackCount} de cada álbum`,
                tracks: allSelectedTracks
            })
        } else {
            // Multiple playlists based on target duration
            const numPlaylists = Math.max(1, Math.ceil(totalDuration / targetDuration))

            for (let i = 0; i < numPlaylists; i++) {
                playlists.push({
                    id: `p${i + 1}`,
                    title: `${this.getPlaylistTitle()} Vol. ${i + 1}`,
                    subtitle: `Top ${this.trackCount} de cada álbum`,
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
     * Sort tracks based on grouping strategy
     * @param {Array} tracks 
     * @param {string} strategy 
     */
    _applyGrouping(tracks, strategy) {
        switch (strategy) {
            case 'flat_ranked': // Determine by local rank (interleaved: 1s, 2s, 3s...)
                tracks.sort((a, b) => (a._rank || 0) - (b._rank || 0))
                break

            case 'artist_rank': // Cluster by Artist, then by Rank
                tracks.sort((a, b) => {
                    const artistA = (a.artistName || '').toLowerCase()
                    const artistB = (b.artistName || '').toLowerCase()
                    if (artistA < artistB) return -1
                    if (artistA > artistB) return 1
                    return (a._rank || 0) - (b._rank || 0)
                })
                break

            case 'shuffle':
                tracks.sort(() => Math.random() - 0.5)
                break

            case 'by_album':
            default:
                // Preserve original order (by album index)
                break
        }
    }

    /**
     * Get playlist title - override in subclass
     * @returns {string}
     */
    getPlaylistTitle() {
        return `Top ${this.trackCount}`
    }
}

export default TopNAlgorithm
