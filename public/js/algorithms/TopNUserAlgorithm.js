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

    /** Its fixed definition in the blocks of F92 (REQ-05): user, from the top, skip 0, take N (3 to start). */
    static definition = Object.freeze({ source: 'user', direction: 'top', skip: 0, take: 3, minSeconds: 0, grouping: 'by_album' })

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
