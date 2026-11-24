/**
 * «Deep cuts» (F92, REQ-04, REQ-10): Spotify popularity, from the top, skip the 3 most popular tracks of each album and take the next 3.
 * The person may skip more on the Blend screen (3 + X, inside the limits of REQ-06).
 *
 * @module algorithms/DeepCutsAlgorithm
 */
import { BlockRecipeAlgorithm } from './BlockRecipeAlgorithm.js'

export class DeepCutsAlgorithm extends BlockRecipeAlgorithm {
    static metadata = {
        id: 'deep-cuts',
        name: 'Deep cuts',
        badge: 'SPOTIFY',
        description: 'Skips the most popular tracks of each album on Spotify and takes the next three.',
        isRecommended: false
    }

    static definition = Object.freeze({ source: 'spotify', direction: 'top', skip: 3, take: 3, minSeconds: 0, grouping: 'by_album' })

    static adjustableSkip = true

    getPlaylistTitle() {
        const grouping = this.getGroupingSuffix()
        return `Deep Cuts${grouping ? ' ' + grouping : ''}`
    }
}
