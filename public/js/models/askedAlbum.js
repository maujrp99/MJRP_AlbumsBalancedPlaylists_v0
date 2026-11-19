/**
 * askedAlbum - the app's side of the one identity rule (shared/albumIdentity.js, F55).
 *
 * The rule compares { artist, title, year? } with { artist, title, year? }. This file is where
 * the app turns its own shapes into those three fields: the query a series stores (what was
 * ASKED), and what each source gives back (a CANDIDATE). A call site imports from here, adapts
 * and asks the rule; it compares no text itself (test/architecture/albumIdentityRule.test.js).
 */

import { parseAlbumQuery } from './albumQuery.js'

export { compareAlbumIdentity, pickAlbum, Verdict, Reason } from '@shared/albumIdentity.js'

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
