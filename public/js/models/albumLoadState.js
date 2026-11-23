/**
 * loadState
 *
 * The rules of the album load's state, as pure functions (arch.md, "Carga da tela de álbuns"; DP-20).
 * One entry per album asked for; the state of a series is always derived from its entries, never stored.
 */

import { decodeEntities } from './text.js'

/** Where one album is in the load. */
export const AlbumStatus = Object.freeze({
    PENDING: 'pending',     // asked for, not started
    FINDING: 'finding',     // the catalog is being asked
    FOUND: 'found',         // the album is on screen; enrichment may still be running
    FAILED: 'failed',       // not found, deadline or network - see entry.error.reason
    CANCELLED: 'cancelled'  // its load session ended first
})

/** Why an album failed. "Failed" is never the same as "empty". */
export const FailureReason = Object.freeze({
    NOT_FOUND: 'not-found',
    TIMEOUT: 'timeout',
    NETWORK: 'network'
})

/** Where one enrichment source is, for one album. */
export const EnrichmentStatus = Object.freeze({
    PENDING: 'pending',
    LOADING: 'loading',
    DONE: 'done',       // the source answered with data
    EMPTY: 'empty',     // the source answered: it has nothing for this album
    FAILED: 'failed',   // the source did not answer
    NOT_CONNECTED: 'not-connected' // the person is not connected to the source: nobody was asked (F69)
})

/**
 * Why the load is on hold. Nothing failed:
 *   unauthorized  the app's own server said "sign in" (401)
 *   rate_limited  the app's own server said "you asked too much, wait" (429)
 *   source_busy   the ratings source asked the server to wait, and the server said until when
 *                 (503 upstream_busy with Retry-After)
 *   spotify_busy  Spotify asked the app to wait a little (429 with Retry-After, F69)
 */
export const HoldReason = Object.freeze({ UNAUTHORIZED: 'unauthorized', RATE_LIMITED: 'rate_limited', SOURCE_BUSY: 'source_busy', SPOTIFY_BUSY: 'spotify_busy' })

/**
 * What to tell the person when the load goes on hold.
 * @param {{ reason: string, until: number|null }} hold - `until` is a time in ms, or null
 * @param {Function} [formatTime] - (ms) => text
 * @returns {{ message: string, type: string, durationMs: number }}
 */
export function holdNotice(hold, formatTime = (ms) => new Date(ms).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })) {
    if (hold.reason === HoldReason.UNAUTHORIZED) {
        return { message: 'Your sign-in could not be confirmed. Sign in again to keep loading ratings.', type: 'warning', durationMs: 10000 }
    }
    const when = hold.until ? ` It resumes by itself at ${formatTime(hold.until)}.` : ''
    if (hold.reason === HoldReason.SOURCE_BUSY) {
        return { message: `The ratings source asked to slow down. Loading ratings is paused.${when}`, type: 'info', durationMs: 10000 }
    }
    if (hold.reason === HoldReason.SPOTIFY_BUSY) {
        return { message: `Spotify asked to slow down. Loading popularity is paused.${when}`, type: 'info', durationMs: 10000 }
    }
    return { message: `The server asked to slow down. Loading is paused.${when}`, type: 'info', durationMs: 10000 }
}

/** The enrichment sources of an album. */
export const ENRICHMENT_SOURCES = Object.freeze(['acclaim', 'popularity', 'userRanking'])

/** What a series looks like, derived from its albums. */
export const SeriesStatus = Object.freeze({
    EMPTY: 'empty',         // the series asks for no album
    LOADING: 'loading',     // some album is still pending or being found
    COMPLETE: 'complete',   // every album was found
    FAILED: 'failed'        // nothing is loading any more and at least one album failed
})

/**
 * The key of an album query inside a series: the same query always gives the same key.
 * @param {string|Object} query - "Artist - Title" or { artist, title }
 * @returns {string}
 */
export function queryKey(query) {
    const text = (typeof query === 'object' && query !== null)
        ? `${query.artist || ''} - ${query.title || query.album || ''}`
        : String(query || '')
    // A query stored with HTML entities ("Page &amp; Plant", UAT-180) is the same query as its plain form.
    return decodeEntities(text).toLowerCase().trim().replace(/\s+/g, ' ')
}

/**
 * A fresh entry for an album that was asked for.
 * @param {string} seriesId
 * @param {string|Object} query
 * @returns {Object}
 */
export function createEntry(seriesId, query) {
    return {
        key: queryKey(query),
        seriesId,
        query,
        status: AlbumStatus.PENDING,
        album: null,
        error: null,
        enrichment: Object.fromEntries(ENRICHMENT_SOURCES.map(source => [source, EnrichmentStatus.PENDING]))
    }
}

/** The edition the person chose for a query (the id the series keeps), or null for a query by name. */
const chosenEdition = (query) => {
    const id = (typeof query === 'object' && query !== null) ? query.appleMusicId : null
    return id ? String(id) : null
}

/**
 * Does the query ask for the edition the entry already has? Yes when it names no edition, when it
 * names the one the entry was asked with, or when it names the one the load ended up with (the
 * load corrects a stored id that led elsewhere and writes it back into the series, F55).
 */
function asksSameEdition(entry, query) {
    const wanted = chosenEdition(query)
    if (!wanted || wanted === chosenEdition(entry.query)) return true
    const loaded = entry.album?.metadata?.sourceId
    return Boolean(loaded) && String(loaded) === wanted
}

/**
 * The entry of a query when its series is asked for again: the one it has when the query asks for
 * the same album; a new one when the query is new; and, when the person chose another edition of
 * the same title, a new one marked `fresh`, which is found in the catalog and not in what is kept
 * (what is kept is filed under the name, so it holds the other edition).
 * @param {Object|undefined} existing - the entry the series has for this query's key
 * @param {string} seriesId
 * @param {string|Object} query
 * @returns {Object}
 */
export function reconcileEntry(existing, seriesId, query) {
    if (!existing) return createEntry(seriesId, query)
    if (asksSameEdition(existing, query)) return existing
    return { ...createEntry(seriesId, query), fresh: true }
}

/** True while the album has not reached a final state. */
export function isInFlight(entry) {
    return entry.status === AlbumStatus.PENDING || entry.status === AlbumStatus.FINDING
}

/** True while some enrichment source of a found album has not finished. */
export function isEnriching(entry) {
    if (entry.status !== AlbumStatus.FOUND) return false
    return ENRICHMENT_SOURCES.some(source => {
        const status = entry.enrichment[source]
        return status === EnrichmentStatus.PENDING || status === EnrichmentStatus.LOADING
    })
}

/**
 * The state of a series, from the entries of its albums.
 * @param {Array<Object>} entries
 * @returns {{ status: string, total: number, found: number, failed: number, inFlight: number, enriching: number }}
 */
export function deriveSeriesState(entries = []) {
    const counts = { total: entries.length, found: 0, failed: 0, inFlight: 0, enriching: 0 }
    entries.forEach(entry => {
        if (entry.status === AlbumStatus.FOUND) counts.found++
        if (entry.status === AlbumStatus.FAILED) counts.failed++
        if (isInFlight(entry)) counts.inFlight++
        if (isEnriching(entry)) counts.enriching++
    })

    let status = SeriesStatus.COMPLETE
    if (counts.total === 0) status = SeriesStatus.EMPTY
    else if (counts.inFlight > 0) status = SeriesStatus.LOADING
    else if (counts.failed > 0) status = SeriesStatus.FAILED

    return { status, ...counts }
}
