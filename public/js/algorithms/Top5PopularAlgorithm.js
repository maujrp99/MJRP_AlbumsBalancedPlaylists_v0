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
        name: 'Top 5 Tracks by Spotify Popularity',
        badge: 'TOP 5',
        description: 'Extended popular selection - the top 5 most played tracks from Spotify.',
        isRecommended: false
    }

    constructor(opts = {}) {
        super({
            ...opts,
            trackCount: 5,
            rankingStrategy: new SpotifyRankingStrategy(),
            defaultRankingSource: {
                name: 'Top 5 Tracks by Spotify Popularity',
                type: 'spotify',
                description: 'Top 5 by Spotify Popularity',
                secure: true
            }
        })
    }

    getPlaylistTitle() {
        return 'Top 5 Tracks by Spotify Popularity'
    }
}

export default Top5PopularAlgorithm
