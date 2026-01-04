
import { TopNAlgorithm } from './TopNAlgorithm.js'
import { BalancedRankingStrategy } from '../ranking/BalancedRankingStrategy.js'

export class TopNAcclaimedAlgorithm extends TopNAlgorithm {
    static metadata = {
        id: 'top-n-acclaimed',
        name: 'Top Acclaimed Tracks on BestEverAlbums',
        badge: 'BEA',
        description: 'Selecione as faixas aclamadas pela crítica baseadas no BestEverAlbums.',
        isRecommended: false
    }

    constructor(opts = {}) {
        super({
            ...opts,
            rankingStrategy: opts.rankingStrategy || new BalancedRankingStrategy({
                spotifyWeight: 0.0,
                beaWeight: 1.0
            })
        })
    }
}
