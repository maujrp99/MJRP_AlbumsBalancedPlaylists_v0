
import { TopNAlgorithm } from './TopNAlgorithm.js'
import { BalancedRankingStrategy } from '../ranking/BalancedRankingStrategy.js'

export class TopNPopularAlgorithm extends TopNAlgorithm {
    static metadata = {
        id: 'top-n-popular',
        name: 'Top Tracks by Spotify Popularity',
        badge: 'SPOTIFY',
        description: 'Selecione suas faixas favoritas baseadas na popularidade do Spotify.',
        isRecommended: false
    }

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
        return `SPFY Top ${n}`
    }
}
