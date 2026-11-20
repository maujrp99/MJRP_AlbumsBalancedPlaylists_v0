/**
 * popularityState (F69)
 *
 * The one line a screen shows about the Spotify popularity of an album that has none on it, from
 * the state the album load gives that source. Pure: no store, no network, no screen.
 */

import { EnrichmentStatus } from './albumLoadState.js'

const ASKING = Object.freeze({ text: 'Asking Spotify for popularity…', action: null, quiet: true })

const LINES = Object.freeze({
    // Not an error and not "no data": an invitation, with nothing to press here (the header connects)
    [EnrichmentStatus.NOT_CONNECTED]: Object.freeze({ text: 'Connect Spotify to see popularity.', action: null, quiet: true }),
    [EnrichmentStatus.FAILED]: Object.freeze({ text: 'Spotify did not answer.', action: 'Try again', quiet: false }),
    [EnrichmentStatus.EMPTY]: Object.freeze({ text: 'Spotify has no popularity for this album.', action: 'Ask again', quiet: true }),
    [EnrichmentStatus.PENDING]: ASKING,
    [EnrichmentStatus.LOADING]: ASKING
})

/**
 * @param {string} status - the EnrichmentStatus of the popularity of the album
 * @returns {{ text: string, action: string|null, quiet: boolean } | null} null when there is
 *          nothing to say (the album has its popularity, or nobody told the state); `action` is
 *          the label of the button that asks the source again, when asking again makes sense
 */
export function describePopularity(status) {
    return LINES[status] || null
}
