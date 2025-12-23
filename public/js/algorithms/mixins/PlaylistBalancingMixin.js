/**
 * PlaylistBalancingMixin - Shared playlist balancing logic
 * 
 * Provides methods for balancing playlist durations via track swapping.
 * Used by algorithms that need to ensure playlists are within target duration.
 * 
 * Usage:
 *   class MyAlgorithm extends applyMixin(BaseAlgorithm, PlaylistBalancingMixin) { ... }
 * 
 * @module algorithms/mixins/PlaylistBalancingMixin
 */

/**
 * Mixin that adds playlist balancing capabilities
 * @param {Function} Base - Base class to extend
 * @returns {Function} Extended class with balancing methods
 */
export function PlaylistBalancingMixin(Base) {
    return class extends Base {
        /**
         * Balance playlist durations via track swapping
         * Attempts to make all playlists within ±flexibility of target duration.
         * 
         * @param {Array} playlists - Array of playlist objects with tracks
         * @param {Object} opts - Options
         * @param {number} opts.targetSeconds - Target duration in seconds (default: 45 min)
         * @param {number} opts.flexibilitySeconds - Acceptable deviation (default: 7 min)
         * @param {number} opts.maxIterations - Max swap iterations (default: 100)
         */
        runSwapBalancing(playlists, opts = {}) {
            const targetSeconds = opts.targetSeconds || this.targetSeconds || 45 * 60
            const flexibility = opts.flexibilitySeconds || this.flexibilitySeconds || 7 * 60
            const maxIterations = opts.maxIterations || 100

            for (let iteration = 0; iteration < maxIterations; iteration++) {
                const playlistDurations = playlists.map(playlist => ({
                    id: playlist.id,
                    duration: this.calculateTotalDuration(playlist.tracks),
                    playlist
                }))

                playlistDurations.sort((a, b) => a.duration - b.duration)
                const pUnder = playlistDurations[0]
                const pOver = playlistDurations[playlistDurations.length - 1]

                const underOk = pUnder.duration >= (targetSeconds - flexibility)
                const overOk = pOver.duration <= (targetSeconds + flexibility)
                if (underOk && overOk) return

                let bestSwap = {
                    trackOver: null,
                    trackUnder: null,
                    newGap: Math.abs(pOver.duration - pUnder.duration)
                }

                for (const trackOver of pOver.playlist.tracks) {
                    for (const trackUnder of pUnder.playlist.tracks) {
                        if (!this.isSwapValid(pOver.playlist, pUnder.playlist, trackOver, trackUnder)) continue

                        const newOverDuration = pOver.duration - (trackOver.duration || 0) + (trackUnder.duration || 0)
                        const newUnderDuration = pUnder.duration - (trackUnder.duration || 0) + (trackOver.duration || 0)
                        const gap = Math.abs(newOverDuration - newUnderDuration)

                        if (gap < bestSwap.newGap) {
                            bestSwap = { trackOver, trackUnder, newGap: gap }
                        }
                    }
                }

                if (bestSwap.trackOver) {
                    // Annotate if method exists
                    if (typeof this.annotateTrack === 'function') {
                        this.annotateTrack(bestSwap.trackOver, `Swap: moved to ${pUnder.playlist.id}`, this.defaultRankingSource, 0.45)
                        this.annotateTrack(bestSwap.trackUnder, `Swap: moved to ${pOver.playlist.id}`, this.defaultRankingSource, 0.45)
                    }

                    pOver.playlist.tracks = pOver.playlist.tracks.filter(t => t.id !== bestSwap.trackOver.id)
                    pOver.playlist.tracks.push(bestSwap.trackUnder)
                    pUnder.playlist.tracks = pUnder.playlist.tracks.filter(t => t.id !== bestSwap.trackUnder.id)
                    pUnder.playlist.tracks.push(bestSwap.trackOver)
                } else {
                    return // No valid swap found
                }
            }
        }

        /**
         * Check if swap is valid (can be overridden by subclass)
         * Protects Greatest Hits playlists from losing their top tracks.
         * 
         * @param {Object} pOver - Playlist over target
         * @param {Object} pUnder - Playlist under target
         * @param {Object} trackOver - Track from over playlist
         * @param {Object} trackUnder - Track from under playlist
         * @returns {boolean}
         */
        isSwapValid(pOver, pUnder, trackOver, trackUnder) {
            const rankOver = trackOver?.acclaimRank ?? trackOver?.rank ?? null

            // Protect rank #1 in p1 and rank #2 in p2
            if (rankOver === 1 && pOver.id === 'p1') return false
            if (rankOver === 2 && pOver.id === 'p2') return false

            // Check if track is last from its album in playlist
            if (typeof this.isLastTrackOfAlbumInPlaylist === 'function') {
                const isLastOver = this.isLastTrackOfAlbumInPlaylist(pOver, trackOver)
                if (isLastOver && trackOver.originAlbumId !== trackUnder.originAlbumId) return false

                const isLastUnder = this.isLastTrackOfAlbumInPlaylist(pUnder, trackUnder)
                if (isLastUnder && trackUnder.originAlbumId !== trackOver.originAlbumId) return false
            }

            return true
        }

        /**
         * Check if track is the last one from its album in the playlist
         * @param {Object} playlist 
         * @param {Object} track 
         * @returns {boolean}
         */
        isLastTrackOfAlbumInPlaylist(playlist, track) {
            if (!track || !track.originAlbumId) return false
            let count = 0
            for (const existing of playlist.tracks) {
                if (existing.originAlbumId === track.originAlbumId) count++
            }
            return count === 1
        }
    }
}

export default PlaylistBalancingMixin
