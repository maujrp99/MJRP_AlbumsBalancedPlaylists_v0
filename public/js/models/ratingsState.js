/**
 * ratingsState (F52, UAT-244)
 *
 * The one line a screen shows about the ratings (the acclaim) of an album when BestEverAlbums did
 * not answer, from the state the album load gives that source; and, while the source is asked
 * again, the line that says so. A source that did not answer is never read as "this album has no
 * ratings". Pure: no store, no network, no screen.
 */

import { EnrichmentStatus } from './albumLoadState.js'

const FAILED_LINE = Object.freeze({ text: 'BestEverAlbums did not answer.', action: 'Try again', quiet: false })
const ASKING_LINE = Object.freeze({ text: 'Asking BestEverAlbums for ratings…', action: null, quiet: true })

const LINES = Object.freeze({
    [EnrichmentStatus.FAILED]: FAILED_LINE,
    [EnrichmentStatus.PENDING]: ASKING_LINE,
    [EnrichmentStatus.LOADING]: ASKING_LINE
})

/**
 * @param {string} status - the EnrichmentStatus of the ratings of the album
 * @returns {{ text: string, action: string|null, quiet: boolean } | null} null when there is
 *          nothing to say (the source answered, or nobody told the state)
 */
export function describeRatings(status) {
    return LINES[status] || null
}
