/**
 * ownRanking
 *
 * Which album queries the person has ranked, as pure functions (arch.md, "Carga da tela de álbuns",
 * seções 16 e 18; DP-20). The 'My Ranking' filter answers for every series without loading an album.
 *
 * The two sides do not share a key. A ranking is stored under the id of the album that was LOADED
 * (its artist and title as the catalog gave them, in a slug), with `artistName` and `albumTitle`
 * beside it. A series stores what the person ASKED for. They are matched by name, written the same
 * way on both sides: case, accents, punctuation, "&" and "and", HTML entities and the edition note
 * ("(Deluxe Edition)", "(Remastered 2014)") do not count. What a name cannot match (the catalog
 * gave the album another title) is matched exactly once the album is loaded: `loadedKeys`.
 */

import { parseAlbumQuery } from './albumQuery.js'
import { queryKey } from './albumLoadState.js'
import { decodeEntities } from './text.js'

/** A note in brackets that names an edition of the same album, not another album. */
const EDITION_NOTE = /[([][^)\]]*\b(deluxe|remaster(ed)?|edition|expanded|version|anniversary|bonus|reissue|mono|stereo)\b[^)\]]*[)\]]/gi

/** The same note after a dash at the end: "Album - Deluxe Edition". */
const EDITION_TAIL = /\s[-–:]\s[^-–:]*\b(deluxe|remaster(ed)?|edition|expanded|anniversary|reissue)\b[^-–:]*$/i

/** A name as it is compared: plain text, no case, no accents, "&" as "and", no punctuation. */
export function nameIdentity(text) {
    return String(decodeEntities(String(text || '')))
        .normalize('NFD').replace(/[̀-ͯ]/g, '')
        .toLowerCase()
        .replace(/&/g, ' and ')
        .replace(/[^a-z0-9\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
}

/** A title as it is compared: its name identity, without the edition note. */
export function titleIdentity(title) {
    const plain = String(decodeEntities(String(title || '')))
    return nameIdentity(plain.replace(EDITION_NOTE, ' ').replace(EDITION_TAIL, ' ')) || nameIdentity(plain)
}

/** The identity of an album by its names. */
export function albumIdentity(artist, title) {
    return `${nameIdentity(artist)}|${titleIdentity(title)}`
}

/**
 * The id the app gives a loaded album, from its artist and title. The same rule as
 * `generateAlbumId` of the API client, which is where the stored ranking ids come from.
 */
export function stableAlbumId(artist, title) {
    const slug = (text) => String(text || '').toLowerCase().replace(/\s+/g, '-')
    return `${slug(artist)}_${slug(title)}`.replace(/[^\w-]/g, '')
}

/**
 * What is needed to answer "is this query ranked?", built once from the stored rankings.
 * @param {Array<{ albumId?: string, id?: string, artistName?: string, albumTitle?: string }>} records
 * @returns {{ names: Set<string>, ids: Set<string>, size: number }}
 */
export function buildRankedIndex(records = []) {
    const names = new Set()
    const ids = new Set()
    records.forEach(record => {
        const id = record?.albumId || record?.id
        if (id) ids.add(String(id))
        // A record with no title has no name to compare; it is still matched by its id.
        if (record?.albumTitle) names.add(albumIdentity(record.artistName, record.albumTitle))
    })
    return { names, ids, size: records.length }
}

/** True when the query names an album the person has ranked. */
export function isQueryRanked(query, index) {
    if (!index || index.size === 0) return false
    const { artist, title } = parseAlbumQuery(query)
    if (!title) return false
    return index.names.has(albumIdentity(artist, title)) || index.ids.has(stableAlbumId(artist, title))
}

/**
 * The keys of the queries the person has ranked, over every series given.
 * @param {Array<{ albumQueries: Array }>} seriesList
 * @param {{ names: Set, ids: Set, size: number }} index - from buildRankedIndex
 * @param {Iterable<string>} [loadedKeys] - keys of the loaded albums that carry a ranking (exact)
 * @returns {Set<string>}
 */
export function rankedQueryKeys(seriesList = [], index = null, loadedKeys = []) {
    const keys = new Set(loadedKeys)
    seriesList.forEach(series => (series.albumQueries || []).forEach(query => {
        if (isQueryRanked(query, index)) keys.add(queryKey(query))
    }))
    return keys
}
