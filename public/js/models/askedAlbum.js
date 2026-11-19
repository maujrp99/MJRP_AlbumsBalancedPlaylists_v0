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

import { Reason } from '@shared/albumIdentity.js'

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
 * The one line an album shows when it is not, to the letter, the title that was asked for.
 * @param {Object} album - a loaded album
 * @returns {string|null} null when there is nothing to say
 */
export function identityNotice(album) {
    if (album?.metadata?.identityReason !== Reason.TITLE_BEFORE_SUBTITLE) return null
    return 'Asked for by its short title: the catalog only has this one, with a subtitle.'
}
