/**
 * albumQuery
 *
 * The one place that reads an album query (arch.md, "Carga da tela de álbuns": one definition, R2).
 * A query is "Artist - Title" or { artist, title }. Only the FIRST " - " separates artist from title,
 * so "Artist - Album - Deluxe" keeps "Album - Deluxe" as the title.
 */

const SEPARATOR = ' - '

/**
 * @param {string|Object} query
 * @returns {{ artist: string, title: string }}
 */
export function parseAlbumQuery(query) {
    if (typeof query === 'object' && query !== null) {
        const title = String(query.title || query.album || '').trim()
        const artist = String(query.artist || '').trim()
        if (artist || !title.includes(SEPARATOR)) return { artist, title }
        return parseAlbumQuery(title)
    }
    const text = String(query || '').trim()
    const at = text.indexOf(SEPARATOR)
    if (at === -1) return { artist: '', title: text }
    return { artist: text.slice(0, at).trim(), title: text.slice(at + SEPARATOR.length).trim() }
}
