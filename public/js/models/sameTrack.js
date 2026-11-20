/**
 * sameTrack - the app's side of the one track rule (shared/trackIdentity.js, F74).
 *
 * The rule says when a track of an album and a track a source lists are the same track, and gives
 * each entry of the source to one track only (`matchTracks`). Every place of the app that puts
 * what a source says of a track on the tracks of an album (the ratings, the popularity, the two
 * orders of one album) imports from here and compares no title itself
 * (test/architecture/trackIdentityRule.test.js).
 */

import { matchTracks } from '@shared/trackIdentity.js'

export { matchTracks, compareTrackTitles, TRACK_IDENTITY_RULE_VERSION } from '@shared/trackIdentity.js'

/**
 * For each track of the album, the entry of the source that is the same track, or null.
 * @param {Array<{ title?: string }>} tracks - in album order
 * @param {Array<Object>} [entries] - what the source lists: { title | trackTitle | name, ... }
 * @returns {Array<Object|null>} one item per track
 */
export function entryOfEachTrack(tracks, entries) {
    return matchTracks(tracks, entries).map(match => (match ? match.entry : null))
}
