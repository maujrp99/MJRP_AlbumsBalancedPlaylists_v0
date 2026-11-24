
import { TopNAlgorithm } from './TopNAlgorithm.js'
import { BalancedRankingStrategy } from '../ranking/BalancedRankingStrategy.js'

export class TopNAcclaimedAlgorithm extends TopNAlgorithm {
    static metadata = {
        id: 'top-n-acclaimed',
        name: 'Top Acclaimed Tracks on BestEverAlbums',
        badge: 'BEA',
        description: 'Pick the critically acclaimed tracks, based on BestEverAlbums.',
        isRecommended: false
    }

    /** Its fixed definition in the blocks of F92 (REQ-05): bea, from the top, skip 0, take N (3 to start). */
    static definition = Object.freeze({ source: 'bea', direction: 'top', skip: 0, take: 3, minSeconds: 0, grouping: 'by_album' })

    constructor(opts = {}) {
        super({
            ...opts,
            rankingStrategy: opts.rankingStrategy || new BalancedRankingStrategy({
                spotifyWeight: 0.0,
                beaWeight: 1.0
            })
        })
    }

    /**
     * Override to add BEA prefix
     */
    getPlaylistTitle() {
        const n = this._currentTrackCount || this.trackCount
        const grouping = this.getGroupingSuffix()
        return `BEA Top ${n}${grouping ? ' ' + grouping : ''}`
    }
}
