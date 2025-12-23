/**
 * Top3PopularAlgorithm - Crowd Favorites
 * 
 * Selects top 3 most-played tracks per album based on Spotify popularity.
 * "The crowd favorites - what people actually listen to."
 * 
 * @module algorithms/Top3PopularAlgorithm
 */

import { TopNAlgorithm } from './TopNAlgorithm.js'
import { SpotifyRankingStrategy } from '../ranking/SpotifyRankingStrategy.js'

export class Top3PopularAlgorithm extends TopNAlgorithm {
    static metadata = {
        id: 'top-3-popular',
        name: 'Crowd Favorites',
        badge: 'TOP 3',
        description: 'As 3 faixas mais populares de cada álbum - o que as pessoas realmente ouvem.',
        isRecommended: false
    }

    constructor(opts = {}) {
        super({
            ...opts,
            trackCount: 3,
            rankingStrategy: new SpotifyRankingStrategy(),
            defaultRankingSource: {
                name: 'Crowd Favorites',
                type: 'spotify',
                description: 'Top 3 by Spotify Popularity',
                secure: true
            }
        })
    }

    getPlaylistTitle() {
        return 'Crowd Favorites'
    }
}

export default Top3PopularAlgorithm
