/**
 * homeSeries
 *
 * The rules of the Home that explains itself (F79), as pure functions: the name suggested from the
 * artists of the series (D1), the count of the series, which button carries the fire (D8, one at a
 * time), the labels of the discography, what the empty dock says and what the equalizer means (D6).
 * No DOM. The texts are the agent's proposal approved with the prototype
 * (design/inception/home-transformar-v2.html).
 */

import { PICKER_FILTERS } from './albumPicker.js'
import { ScanStatus } from './scanState.js'
import { decodeEntities } from './text.js'

/** Where the name of the series came from. */
export const NameState = Object.freeze({
    NONE: 'none',           // no album yet: no name
    SUGGESTED: 'suggested', // written by the Home from the artists; it follows the series
    EDITED: 'edited'        // typed by the person: it stays as typed, even empty
})

const plural = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`

/** The artists of the albums, each once, in the order they came in. */
function artistsOf(albums = []) {
    const seen = []
    albums.forEach(album => {
        const artist = decodeEntities(String(album?.artist || '')).trim()
        if (artist && !seen.includes(artist)) seen.push(artist)
    })
    return seen
}

/**
 * @param {Array<{ artist: string }>} albums - the series, in its order
 * @returns {string} «Pink Floyd selection», «Joni Mitchell and Yes», «Joni Mitchell, Yes and more», or ''
 */
export function suggestName(albums) {
    const [first, second, ...rest] = artistsOf(albums)
    if (!first) return ''
    if (!second) return `${first} selection`
    return rest.length ? `${first}, ${second} and more` : `${first} and ${second}`
}

/**
 * The name after the series changed: a suggestion follows the series, a name the person typed stays.
 * @param {{ name: string, state: string }} current
 * @param {Array} albums
 * @returns {{ name: string, state: string }}
 */
export function nameAfterChange(current, albums) {
    if (current.state === NameState.EDITED) return current
    const name = suggestName(albums)
    return { name, state: name ? NameState.SUGGESTED : NameState.NONE }
}

/** «4 albums from 1 artist · the order counts» */
export function seriesCountLine(albums) {
    const artists = Math.max(1, artistsOf(albums).length)
    return `${plural(albums.length, 'album')} from ${plural(artists, 'artist')} · the order counts`
}

/**
 * The one button filled with the fire (HI-05): the next thing to do.
 * @param {{ chosen: number, results: boolean, created: boolean }} state
 * @returns {'search'|'create'|'blend'|'none'}
 */
export function flameOf({ chosen, results, created }) {
    if (created) return 'blend'
    if (chosen > 0) return 'create'
    return results ? 'none' : 'search'
}

/** The noun of the albums of one type, for the labels («studio albums», «live albums»). */
const NOUNS = Object.freeze({
    albums: ['studio album', 'studio albums'],
    eps: ['EP', 'EPs'],
    singles: ['single', 'singles'],
    live: ['live album', 'live albums'],
    compilations: ['compendium', 'compendiums'],
    uncategorized: ['other album', 'other albums']
})

/** The noun for the filters that are on: the type's own when one is on, «albums» otherwise. */
function nounOf(filters, n) {
    const on = PICKER_FILTERS.filter(filter => filters?.[filter.key])
    const [one, many] = on.length === 1 ? NOUNS[on[0].key] : ['album', 'albums']
    return n === 1 ? one : many
}

/**
 * The button that puts what the filters show in the series (D3).
 * @param {Array<{ id: string }>} visible - the albums on screen
 * @param {Array<string>} chosenIds - the ids already in the series
 * @param {Object} filters
 * @returns {string} '' when every album on screen is already in the series
 */
export function addAllLabel(visible, chosenIds, filters) {
    const left = visible.filter(album => !chosenIds.includes(album.id)).length
    if (left === 0) return ''
    if (left < visible.length) return `Add the other ${left}`
    return left === 1 ? `Add the 1 ${nounOf(filters, 1)}` : `Add all ${left} ${nounOf(filters, left)}`
}

/** The line under the artist: «17 studio albums · newest first». */
export function typesLine(filters, n, classifying) {
    const line = `${n} ${nounOf(filters, n)} · newest first`
    return classifying ? `${line} · confirming album types…` : line
}

/** What the empty dock says: the next gesture, never covers that are not on screen. */
export function dockEmptyNote({ phone, covers }) {
    if (phone) return { title: 'No albums yet', note: covers ? 'Tap a cover to add it' : 'Search, then tap a cover' }
    const first = covers ? 'Click a cover to add it.' : 'Search an artist, then click a cover to add it.'
    return { title: 'Your series is empty', note: `${first} You name the series at the end.` }
}

/** The equalizer under the field: moving while the catalog is asked, flat when it did not answer. */
export function equalizerState(scanStatus) {
    if (scanStatus === ScanStatus.SCANNING) return 'live'
    return scanStatus === ScanStatus.FAILED ? 'flat' : 'still'
}

/**
 * The big title and the sentence of the series, only before anything is found. A pasted list keeps
 * them on the computer, until its report; on the phone the list takes their place.
 */
export function stageIsBig({ scan, paste, report, phone }) {
    if (paste) return !report && !phone
    return scan === ScanStatus.IDLE || scan === ScanStatus.EMPTY
}
