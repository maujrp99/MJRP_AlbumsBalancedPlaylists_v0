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
