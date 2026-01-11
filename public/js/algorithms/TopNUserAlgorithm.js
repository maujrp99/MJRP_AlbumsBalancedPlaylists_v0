/**
 * TopNUserAlgorithm
 * 
 * Top N algorithm using user-generated track rankings.
 * Part of the Blending Menu recipes alongside TopNPopularAlgorithm and TopNAcclaimedAlgorithm.
 * 
 * Generates playlists with "UGR Top N" prefix (User-Generated-Rank)
 * Color: Incandescent Blue (#0EA5E9 / sky-500)
 * 
 * @module algorithms/TopNUserAlgorithm
 * @since Sprint 20
 */

import { TopNAlgorithm } from './TopNAlgorithm.js'
import { UserRankingStrategy } from '../ranking/UserRankingStrategy.js'

export class TopNUserAlgorithm extends TopNAlgorithm {
    static metadata = {
        id: 'top-n-user',
        name: 'Top Tracks by My Own Ranking',
        badge: 'USER',
        badgeColor: 'sky',
        description: 'Create playlists from your personal track rankings.',
        isRecommended: false
    }

    constructor(opts = {}) {
        super({
            ...opts,
            rankingStrategy: opts.rankingStrategy || new UserRankingStrategy()
        })
    }

    /**
     * Override to add UGR prefix (User-Generated-Rank)
     * @returns {string} Playlist title
     */
    getPlaylistTitle() {
        const n = this._currentTrackCount || this.trackCount
        const grouping = this.getGroupingSuffix()
        return `UGR Top ${n}${grouping ? ' ' + grouping : ''}`
    }
}
