
import { TopNAlgorithm } from './TopNAlgorithm.js'
import { BalancedRankingStrategy } from '../ranking/BalancedRankingStrategy.js'

export class TopNPopularAlgorithm extends TopNAlgorithm {
    static metadata = {
        id: 'top-n-popular',
        name: 'Top Tracks by Spotify Popularity',
        badge: 'SPOTIFY',
        description: 'Pick your favorite tracks, based on Spotify popularity.',
        isRecommended: false
    }

    /** Its fixed definition in the blocks of F92 (REQ-05): spotify, from the top, skip 0, take N (3 to start). */
    static definition = Object.freeze({ source: 'spotify', direction: 'top', skip: 0, take: 3, minSeconds: 0, grouping: 'by_album' })

    constructor(opts = {}) {
        super({
            ...opts,
            rankingStrategy: opts.rankingStrategy || new BalancedRankingStrategy({
                spotifyWeight: 1.0,
                beaWeight: 0.0
            })
        })
    }

    /**
     * Override to add SPFY prefix
     */
    getPlaylistTitle() {
        const n = this._currentTrackCount || this.trackCount
        const grouping = this.getGroupingSuffix()
        return `SPFY Top ${n}${grouping ? ' ' + grouping : ''}`
    }
}
