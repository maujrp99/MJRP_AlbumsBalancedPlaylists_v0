/**
 * albumQuery
 *
 * The one place that reads an album query (arch.md, "Carga da tela de álbuns": one definition, R2).
 * A query is "Artist - Title" or { artist, title }. Only the FIRST " - " separates artist from title,
 * so "Artist - Album - Deluxe" keeps "Album - Deluxe" as the title.
 *
 * It is also the one place that undoes HTML entities left in a stored query (UAT-180): whoever reads
 * a query through here gets the text as the person wrote it, and whoever writes one through
 * toAlbumQuery stores it plain.
 */

import { decodeEntities } from './text.js'

const SEPARATOR = ' - '

/**
 * @param {string|Object} query
 * @returns {{ artist: string, title: string }}
 */
export function parseAlbumQuery(query) {
    if (typeof query === 'object' && query !== null) {
        const title = String(decodeEntities(query.title || query.album || '')).trim()
        const artist = String(decodeEntities(query.artist || '')).trim()
        if (artist || !title.includes(SEPARATOR)) return { artist, title }
        return parseAlbumQuery(title)
    }
    const text = String(decodeEntities(String(query || ''))).trim()
    const at = text.indexOf(SEPARATOR)
    if (at === -1) return { artist: '', title: text }
    return { artist: text.slice(0, at).trim(), title: text.slice(at + SEPARATOR.length).trim() }
}

/** Why a pasted line is not an album. */
export const PastedLineProblem = Object.freeze({
    BLANK: 'blank',
    NO_SEPARATOR: 'no-separator',
    NO_ALBUM: 'no-album'
})

// What people paste around "Artist - Album": a list number or a bullet in front, another dash or a
// tab (a sheet) in the middle.
const LIST_MARKER = /^(?:\d+[.)]|[•*·–—-])\s+/
const OTHER_SEPARATORS = /\s+[–—]\s+|\t+/g
const DANGLING_SEPARATOR = /\s[-–—]$/
const ONE_SIDED_HYPHEN = /\s-(?=\S)|(?<=\S)-\s/

/** The line as parseAlbumQuery reads it: no list marker, " - " as the separator. */
function tidyPastedLine(line) {
    return String(line ?? '').trim().replace(LIST_MARKER, '').replace(OTHER_SEPARATORS, SEPARATOR).trim()
}

/** "Artist- Album" or "Artist -Album": the space is missing on one side of the separator. */
function splitAtOneSidedHyphen(text) {
    const found = ONE_SIDED_HYPHEN.exec(text)
    if (!found) return null
    return { artist: text.slice(0, found.index).trim(), title: text.slice(found.index + found[0].length).trim() }
}

/**
 * One line of a pasted list (Home, "Bulk Paste"): "Artist - Album".
 *
 * It is parseAlbumQuery (the first " - " separates, so "Jay-Z - The Blueprint" and
 * "Artist - Album - Deluxe" are read right) plus what only a pasted line has: a list marker, an en
 * or em dash or a tab as the separator, a space missing on one side of the hyphen. A hyphen with no
 * space on either side never separates: "Jay-Z-The Blueprint" is refused, not guessed.
 *
 * @param {string} line
 * @returns {{ ok: true, artist: string, title: string } | { ok: false, problem: string }}
 */
export function parsePastedAlbumLine(line) {
    const text = tidyPastedLine(line)
    if (!text) return { ok: false, problem: PastedLineProblem.BLANK }
    if (DANGLING_SEPARATOR.test(text)) return { ok: false, problem: PastedLineProblem.NO_ALBUM }

    const read = parseAlbumQuery(text)
    const { artist, title } = read.artist ? read : (splitAtOneSidedHyphen(read.title) || read)
    if (!artist || !title) return { ok: false, problem: PastedLineProblem.NO_SEPARATOR }
    return { ok: true, artist, title }
}

/**
 * The same query with its text plain: what is handed to a catalog, which must never be asked for
 * "Page &amp; Plant". Everything else the query carries (the chosen edition, the facts) is kept.
 * @param {string|Object} query
 * @returns {string|Object}
 */
export function plainAlbumQuery(query) {
    if (typeof query !== 'object' || query === null) return decodeEntities(String(query || ''))
    const plain = { ...query }
    ;['artist', 'title', 'album'].forEach(field => {
        if (typeof plain[field] === 'string') plain[field] = decodeEntities(plain[field])
    })
    return plain
}

/**
 * The album query a series stores for an album the person picked (Home, edit series).
 * One shape, written in one place, with plain text.
 * @param {Object} album - { artist, title, id | appleMusicId, year, coverUrl | artworkTemplate }
 * @returns {{ artist: string, title: string, appleMusicId: string|null, year: number|string|null, coverUrl: string|null }}
 */
export function toAlbumQuery(album = {}) {
    return {
        artist: String(decodeEntities(album.artist || '')).trim(),
        title: String(decodeEntities(album.title || album.album || '')).trim(),
        appleMusicId: album.id || album.appleMusicId || null,
        year: album.year ?? null,
        coverUrl: album.coverUrl || album.artworkTemplate || null
    }
}

/** True when the query stores the Apple Music id that the loaded album says it did NOT come from. */
function storedIdWasReplaced(query, album) {
    if (typeof query !== 'object' || query === null) return false
    const { replacedSourceId, sourceId } = album?.metadata || {}
    if (!replacedSourceId || !sourceId) return false
    return String(query.appleMusicId) === String(replacedSourceId)
}

/**
 * The stored query of an album that was found under ANOTHER Apple Music id than the stored one
 * (F55): the catalog no longer has the stored id, or it leads to another album, and the album asked
 * for was found by name. The id the album was loaded by takes the place of the stored one; the
 * cover and the year stored beside it were copied from the album of the old id (toAlbumQuery), so
 * they are replaced too, when the query has them. What was asked for (artist, title) is never changed.
 *
 * @param {string|Object} query - as the series stores it
 * @param {Object} album - the loaded album: { year, coverUrl, metadata: { sourceId, replacedSourceId? } }
 * @returns {string|Object} a new query, or the same one when there is nothing to correct
 */
export function withCorrectedSource(query, album) {
    if (!storedIdWasReplaced(query, album)) return query
    const corrected = { ...query, appleMusicId: album.metadata.sourceId }
    if ('coverUrl' in query) corrected.coverUrl = album.coverUrl || null
    if ('year' in query) corrected.year = album.year ?? null
    return corrected
}
