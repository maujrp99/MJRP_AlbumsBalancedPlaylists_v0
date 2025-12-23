/**
 * Top5PopularAlgorithm - Greatest Hits
 * 
 * Selects top 5 most-played tracks per album based on Spotify popularity.
 * "The ultimate fan favorites - extended selection."
 * 
 * @module algorithms/Top5PopularAlgorithm
 */

import { TopNAlgorithm } from './TopNAlgorithm.js'
import { SpotifyRankingStrategy } from '../ranking/SpotifyRankingStrategy.js'

export class Top5PopularAlgorithm extends TopNAlgorithm {
    static metadata = {
        id: 'top-5-popular',
        name: 'Greatest Hits',
        badge: 'TOP 5',
        description: 'As 5 faixas mais populares de cada álbum - seleção estendida para fãs.',
        isRecommended: false
    }

    constructor(opts = {}) {
        super({
            ...opts,
            trackCount: 5,
            rankingStrategy: new SpotifyRankingStrategy(),
            defaultRankingSource: {
                name: 'Greatest Hits',
                type: 'spotify',
                description: 'Top 5 by Spotify Popularity',
                secure: true
            }
        })
    }

    getPlaylistTitle() {
        return 'Greatest Hits'
    }
}

export default Top5PopularAlgorithm
