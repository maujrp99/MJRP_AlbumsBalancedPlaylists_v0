/**
 * savedPlaylists
 *
 * The rules of the saved playlists list (arch.md, "Leitura das playlists guardadas", F61): the states
 * of the list and of each series, how playlists become batches, what a card counts and which covers
 * a series shows. Pure: no network, no store, no screen.
 */

/** The read of the list of series. */
export const ListStatus = Object.freeze({
    IDLE: 'idle',
    LOADING: 'loading',
    READY: 'ready',
    FAILED: 'failed'
})

/** The read of the playlists of one series. */
export const SeriesPlaylistsStatus = Object.freeze({
    LOADING: 'loading',
    READY: 'ready',
    EMPTY: 'empty',
    FAILED: 'failed'
})

/** The batch of a playlist saved before batches had a name. */
export const DEFAULT_BATCH_NAME = 'Saved Playlists'

/** How many covers a series card shows. */
export const COVERS_PER_SERIES = 3

/** The batch a playlist belongs to: one rule for grouping and for deleting. */
export const batchNameOf = (playlist) => playlist?.batchName || DEFAULT_BATCH_NAME

/**
 * A date as stored (Firestore timestamp, Date, ISO text or milliseconds) in milliseconds; 0 when absent.
 * @param {*} value
 * @returns {number}
 */
export function toMillis(value) {
    if (!value) return 0
    if (typeof value.toMillis === 'function') return value.toMillis()
    if (typeof value.seconds === 'number') return value.seconds * 1000
    const millis = new Date(value).getTime()
    return Number.isNaN(millis) ? 0 : millis
}

const byOrderThenName = (a, b) => {
    if (a.order !== undefined && b.order !== undefined) return a.order - b.order
    return (a.name || '').localeCompare(b.name || '', undefined, { numeric: true })
}

/**
 * The playlists of a series as batches: newest batch first, playlists in their saved order.
 * @param {Array<Object>} playlists
 * @returns {Array<{ name: string, savedAt: *, playlists: Array<Object> }>}
 */
export function groupIntoBatches(playlists = []) {
    const batches = new Map()
    playlists.forEach(playlist => {
        const name = batchNameOf(playlist)
        if (!batches.has(name)) batches.set(name, { name, savedAt: playlist.savedAt, playlists: [] })
        batches.get(name).playlists.push(playlist)
    })
    const list = Array.from(batches.values())
    list.forEach(batch => batch.playlists.sort(byOrderThenName))
    return list.sort((a, b) => toMillis(b.savedAt) - toMillis(a.savedAt))
}

/**
 * What a batch card shows without opening it.
 * @param {{ playlists: Array<Object> }} batch
 * @returns {{ playlists: number, tracks: number, albums: number, durationSeconds: number }}
 */
export function batchTotals(batch) {
    const tracks = (batch?.playlists || []).flatMap(playlist => playlist.tracks || [])
    const albums = new Set(tracks.filter(track => track.album).map(track => String(track.album).toLowerCase()))
    return {
        playlists: (batch?.playlists || []).length,
        tracks: tracks.length,
        albums: albums.size,
        durationSeconds: tracks.reduce((sum, track) => sum + (track.duration || 0), 0)
    }
}

/** A duration as the list shows it: whole minutes. */
export const formatMinutes = (seconds) => `${Math.floor((seconds || 0) / 60)}m`

/**
 * The series in the order their playlists are read and listed: most recently updated first, and
 * the order the database gave them among equals. Saving a batch touches its series, so the series
 * the person has just worked on is read first.
 * @param {Array<Object>} seriesList
 * @returns {Array<Object>}
 */
export function inReadOrder(seriesList = []) {
    return seriesList
        .map((series, index) => ({ series, index, at: toMillis(series.updatedAt) }))
        .sort((a, b) => (b.at - a.at) || (a.index - b.index))
        .map(item => item.series)
}

const coverOf = (query) => query.imageUrl || query.coverUrl || query.artwork?.url || null

const coverSource = (query) => {
    if (query && typeof query === 'object') return { url: coverOf(query), lookup: null }
    const text = String(query || '')
    const at = text.indexOf(' - ')
    if (at === -1) return { url: null, lookup: null }
    return { url: null, lookup: { artist: text.slice(0, at).trim(), title: text.slice(at + 3).trim() } }
}

/**
 * Where the covers of a series card come from: the address the series already stores, or the
 * artist and title to look up when it stores only text. Only as many as a card shows.
 * @param {Object} series
 * @param {number} [max]
 * @returns {Array<{ url: string|null, lookup: { artist: string, title: string }|null }>}
 */
export function coverSources(series, max = COVERS_PER_SERIES) {
    const queries = series?.albumQueries || series?.albums || []
    return queries.slice(0, max).map(coverSource)
}

/**
 * How far the list is: counts of series by state.
 * @param {Array<{ status: string }>} entries
 * @returns {{ total: number, loading: number, ready: number, empty: number, failed: number, settled: number }}
 */
export function summarize(entries = []) {
    const count = (status) => entries.filter(entry => entry.status === status).length
    const loading = count(SeriesPlaylistsStatus.LOADING)
    return {
        total: entries.length,
        loading,
        ready: count(SeriesPlaylistsStatus.READY),
        empty: count(SeriesPlaylistsStatus.EMPTY),
        failed: count(SeriesPlaylistsStatus.FAILED),
        settled: entries.length - loading
    }
}
