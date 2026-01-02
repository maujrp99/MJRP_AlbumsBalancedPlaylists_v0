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
        name: 'Top 3 Tracks by Spotify Popularity',
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
                name: 'Top 3 Songs by Spotify Popularity',
                type: 'spotify',
                description: 'Top 3 by Spotify Popularity',
                secure: true
            }
        })
    }

    getPlaylistTitle() {
        return 'Top 3 Tracks by Spotify Popularity'
    }
}

export default Top3PopularAlgorithm
