/**
 * askedAlbum - the app's side of the one identity rule (shared/albumIdentity.js, F55).
 *
 * The rule compares { artist, title, year? } with { artist, title, year? }. This file is where
 * the app turns its own shapes into those three fields: the query a series stores (what was
 * ASKED), and what each source gives back (a CANDIDATE). A call site imports from here, adapts
 * and asks the rule; it compares no text itself (test/architecture/albumIdentityRule.test.js).
 *
 * An album the app loaded carries, in `metadata.identityReason`, the reason of the rule it was
 * accepted by. `keptAlbum` reads it back, so the rule can say whether an album that is kept (a
 * cache record, the album on screen) is still the album asked for (`compareKeptAlbum`).
 */

import { parseAlbumQuery } from './albumQuery.js'

import { Reason, compareKeptAlbum } from '@shared/albumIdentity.js'

export { compareAlbumIdentity, compareKeptAlbum, pickAlbum, Verdict, Reason } from '@shared/albumIdentity.js'

/**
 * What a query asks for.
 * @param {string|Object} query - "Artist - Title" or { artist, title, year? }
 * @returns {{ artist: string, title: string, year: number|string|null }}
 */
export function askedAlbum(query) {
    const { artist, title } = parseAlbumQuery(query)
    const year = (typeof query === 'object' && query !== null) ? (query.year ?? null) : null
    return { artist, title, year }
}

/** An album of the Apple Music search: { id, attributes: { name, artistName, releaseDate } }. */
export const appleCandidate = (item) => ({
    artist: item?.attributes?.artistName,
    title: item?.attributes?.name,
    year: item?.attributes?.releaseDate
})

/** An album of the Spotify search: { name, release_date, artists: [{ name }] }. */
export const spotifyCandidate = (item) => ({
    artist: (item?.artists || []).map(artist => artist?.name).filter(Boolean).join(' & '),
    title: item?.name,
    year: item?.release_date
})

/** An album of the local dataset (the search worker): { artist, album, year }. */
export const localCandidate = (item) => ({
    artist: item?.artist,
    title: item?.album ?? item?.title,
    year: item?.year
})

/**
 * An album the app keeps (an Album, or the plain data of a cache record), as the rule reads it.
 * @param {Object|null} album - { artist, title, year, metadata?: { identityReason? } }
 * @returns {{ artist: string, title: string, year: *, identityReason: string|null } | null}
 */
export const keptAlbum = (album) => (album ? {
    artist: album.artist,
    title: album.title,
    year: album.year,
    identityReason: album.metadata?.identityReason ?? null
} : null)

/**
 * Which of the queries of a series asked for this album (the album on screen)? Each query is what
 * was ASKED and the album is the candidate. A query with the album's own title comes before a
 * query the album is only an edition of.
 * @param {Array<string|Object>} albumQueries
 * @param {Object} album - a loaded album
 * @returns {number} the position of the query, or -1 when no query asked for this album
 */
export function indexOfQueryFor(albumQueries, album) {
    const kept = keptAlbum(album)
    const verdicts = (albumQueries || []).map(query => compareKeptAlbum(askedAlbum(query), kept))
    const exact = verdicts.findIndex(verdict => verdict.reason === Reason.EXACT_TITLE)
    return exact !== -1 ? exact : verdicts.findIndex(verdict => verdict.same)
}

/**
 * Does a series already ask for this very album? An edition of an album the series asks for is
 * something else to ask for, so only the album's own title counts.
 * @param {Array<string|Object>} albumQueries
 * @param {Object} album - { artist, title }
 * @returns {boolean}
 */
export function alreadyAskedFor(albumQueries, album) {
    const kept = keptAlbum(album)
    return (albumQueries || []).some(query => compareKeptAlbum(askedAlbum(query), kept).reason === Reason.EXACT_TITLE)
}

/**
 * The one line an album shows when it is not, to the letter, the title that was asked for.
 * @param {Object} album - a loaded album
 * @returns {string|null} null when there is nothing to say
 */
export function identityNotice(album) {
    if (album?.metadata?.identityReason !== Reason.TITLE_BEFORE_SUBTITLE) return null
    return 'Asked for by its short title: the catalog only has this one, with a subtitle.'
}
