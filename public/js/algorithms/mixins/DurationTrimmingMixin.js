/**
 * DurationTrimmingMixin - Shared duration trimming logic
 * 
 * Provides methods for trimming playlists that exceed maximum duration.
 * Excess tracks are moved to an "Orphan Tracks" playlist.
 * 
 * Usage:
 *   class MyAlgorithm extends applyMixin(BaseAlgorithm, DurationTrimmingMixin) { ... }
 * 
 * @module algorithms/mixins/DurationTrimmingMixin
 */

/**
 * Mixin that adds duration trimming capabilities
 * @param {Function} Base - Base class to extend
 * @returns {Function} Extended class with trimming methods
 */
export function DurationTrimmingMixin(Base) {
    return class extends Base {
        /**
         * Trim playlists over max duration by moving lowest-rank tracks to Orphan Tracks
         * 
         * @param {Array} playlists - Array of playlist objects with tracks
         * @param {number} firstDeepCutIndex - Index of first Deep Cut playlist to process
         * @param {Object} opts - Options
         * @param {number} opts.maxDuration - Maximum duration in seconds (default: 48 min)
         */
        trimOverDurationPlaylists(playlists, firstDeepCutIndex, opts = {}) {
            const maxDuration = opts.maxDuration || this.deepCutsMax || 48 * 60
            let orphanPlaylist = null

            for (let i = firstDeepCutIndex; i < playlists.length; i++) {
                const playlist = playlists[i]

                // Skip Orphan Tracks playlist if already exists
                if (playlist.title === 'Orphan Tracks') continue

                let duration = this.calculateTotalDuration(playlist.tracks)

                while (duration > maxDuration && playlist.tracks.length > 0) {
                    // Sort by rank descending (lowest rank = highest number = remove first)
                    playlist.tracks.sort((a, b) => (b._rank || b.acclaimRank || 999) - (a._rank || a.acclaimRank || 999))

                    const removed = playlist.tracks.shift()
                    if (removed) {
                        if (!orphanPlaylist) {
                            orphanPlaylist = {
                                id: 'orphan',
                                title: 'Orphan Tracks',
                                subtitle: 'Trimmed due to duration limits',
                                tracks: []
                            }
                            playlists.push(orphanPlaylist)
                        }
                        orphanPlaylist.tracks.push(removed)

                        // Annotate if method exists
                        if (typeof this.annotateTrack === 'function') {
                            this.annotateTrack(removed, 'Trimmed to Orphan Tracks', this.defaultRankingSource, 0.2)
                        }
                    }

                    duration = this.calculateTotalDuration(playlist.tracks)
                }

                // Re-sort by rank ascending for display
                playlist.tracks.sort((a, b) => (a._rank || a.acclaimRank || 0) - (b._rank || b.acclaimRank || 0))
            }
        }
    }
}

export default DurationTrimmingMixin
