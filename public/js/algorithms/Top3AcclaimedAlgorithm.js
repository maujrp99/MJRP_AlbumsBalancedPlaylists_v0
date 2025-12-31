/**
 * Top3AcclaimedAlgorithm - Critics' Choice
 * 
 * Selects top 3 most acclaimed tracks per album based on BEA ratings.
 * "The critics' picks - highly rated by music experts."
 * 
 * @module algorithms/Top3AcclaimedAlgorithm
 */

import { TopNAlgorithm } from './TopNAlgorithm.js'
import { BEARankingStrategy } from '../ranking/BEARankingStrategy.js'

export class Top3AcclaimedAlgorithm extends TopNAlgorithm {
    static metadata = {
        id: 'top-3-acclaimed',
        name: "Top 3 Acclaimed songs on BestEverAlbums",
        badge: 'TOP 3',
        description: 'The definitive critical selection - best rated tracks from BestEverAlbums.',
        isRecommended: false
    }

    constructor(opts = {}) {
        super({
            ...opts,
            trackCount: 3,
            rankingStrategy: new BEARankingStrategy(),
            defaultRankingSource: {
                name: "Critics' Choice",
                type: 'bea',
                description: 'Top 3 by BEA Rating',
                secure: true
            }
        })
    }

    getPlaylistTitle() {
        return "Critics' Choice"
    }
}

export default Top3AcclaimedAlgorithm
