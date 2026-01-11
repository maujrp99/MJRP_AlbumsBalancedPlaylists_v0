/**
 * Top5AcclaimedAlgorithm - Deep Cuts
 * 
 * Selects top 5 most acclaimed tracks per album based on BEA ratings.
 * "The deep cuts - for the true music connoisseur."
 * 
 * @module algorithms/Top5AcclaimedAlgorithm
 */

import { TopNAlgorithm } from './TopNAlgorithm.js'
import { BEARankingStrategy } from '../ranking/BEARankingStrategy.js'

export class Top5AcclaimedAlgorithm extends TopNAlgorithm {
    static metadata = {
        id: 'top-5-acclaimed',
        name: 'Deep Cuts',
        badge: 'TOP 5',
        description: 'Deep dive critical selection - top 5 best rated tracks from BestEverAlbums.',
        isRecommended: false
    }

    constructor(opts = {}) {
        super({
            ...opts,
            trackCount: 5,
            rankingStrategy: new BEARankingStrategy(),
            defaultRankingSource: {
                name: 'Top 5 Acclaimed Tracks on BestEverAlbums',
                type: 'bea',
                description: 'Top 5 by BEA Rating',
                secure: true
            }
        })
    }

    getPlaylistTitle() {
        return 'Top 5 Acclaimed Tracks on BestEverAlbums'
    }
}

export default Top5AcclaimedAlgorithm
