/**
 * «Least played» («As menos ouvidas», F92, REQ-04): Spotify popularity, from the bottom, skip 0, take the 3 least popular tracks of each
 * album: the opposite of the top. A track with no popularity is not the least played: it never counts.
 *
 * @module algorithms/LeastPlayedAlgorithm
 */
import { BlockRecipeAlgorithm } from './BlockRecipeAlgorithm.js'

export class LeastPlayedAlgorithm extends BlockRecipeAlgorithm {
    static metadata = {
        id: 'least-played',
        name: 'Least played',
        badge: 'SPOTIFY',
        description: 'The three least popular tracks of each album on Spotify. A track with no popularity is left out.',
        isRecommended: false
    }

    static definition = Object.freeze({ source: 'spotify', direction: 'bottom', skip: 0, take: 3, minSeconds: 0, grouping: 'by_album' })

    getPlaylistTitle() {
        const grouping = this.getGroupingSuffix()
        return `Least Played${grouping ? ' ' + grouping : ''}`
    }
}
