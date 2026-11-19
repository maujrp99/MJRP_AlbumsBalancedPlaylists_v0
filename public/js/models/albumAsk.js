/**
 * albumAsk
 *
 * The rules of "give me the albums of these series, ready" (F56), as pure functions: when an ask
 * is settled, what it gives back and what the person is told. No store, no network, no screen.
 *
 * The result of an ask (AlbumsResult):
 *   albums          the albums that are ready, series by series, in the order they were asked for
 *   bySeries        the same albums, by series id
 *   failed          [{ seriesId, key, label, reason, message }] - the albums left out, and why
 *   missingSources  [{ source, seriesId, key, label, gap }] - a source the asker named that has
 *                   nothing to give for an album that is ready
 *   total           how many albums were asked for
 *   aborted         true when the asker dropped the ask before it was served
 */

import { AlbumStatus, EnrichmentStatus, FailureReason } from './albumLoadState.js'
import { parseAlbumQuery } from './albumQuery.js'

/** Why an album is not in the result: the reasons of the load, plus the one only an ask has. */
export const AskFailure = Object.freeze({
    ...FailureReason,
    ON_HOLD: 'on-hold' // the server asked to sign in or to wait, for longer than a search may take
})

/** Why a named source has nothing for an album that is ready. */
export const SourceGap = Object.freeze({
    FAILED: 'failed',   // the source did not answer
    EMPTY: 'empty',     // the source answered: it has nothing for this album
    WAITING: 'waiting'  // the server holds the load; the ask did not wait for the source
})

const REASON_TEXT = Object.freeze({
    [AskFailure.NOT_FOUND]: 'not found',
    [AskFailure.TIMEOUT]: 'took too long',
    [AskFailure.NETWORK]: 'network error',
    [AskFailure.ON_HOLD]: 'the server is waiting for your sign-in'
})

const SOURCE_TEXT = Object.freeze({
    acclaim: { name: 'Acclaim ratings', verb: 'are' },
    popularity: { name: 'Spotify popularity', verb: 'is' },
    userRanking: { name: 'Your own ranking', verb: 'is' }
})

const GAP_TEXT = Object.freeze({
    [SourceGap.FAILED]: 'did not answer',
    [SourceGap.EMPTY]: 'none at the source',
    [SourceGap.WAITING]: 'not waited for: the server paused the load'
})

/** How many albums a notice names before it counts the rest. */
const NAMED_AT_MOST = 3

const labelOf = (entry) => {
    const { artist, title } = entry.album
        ? { artist: entry.album.artist || '', title: entry.album.title || '' }
        : parseAlbumQuery(entry.query)
    return artist ? `${artist} - ${title}` : title
}

const place = (entry) => ({ seriesId: entry.seriesId, key: entry.key, label: labelOf(entry) })

const SOURCE_STILL_ASKED = new Set([EnrichmentStatus.PENDING, EnrichmentStatus.LOADING])

/** What one named source has for one found album: null when it has data. */
function gapOf(status, onHold) {
    if (status === EnrichmentStatus.DONE) return { gap: null, waiting: false }
    if (status === EnrichmentStatus.EMPTY) return { gap: SourceGap.EMPTY, waiting: false }
    if (!SOURCE_STILL_ASKED.has(status)) return { gap: SourceGap.FAILED, waiting: false }
    return onHold ? { gap: SourceGap.WAITING, waiting: false } : { gap: null, waiting: true }
}

/** A found album: ready once every named source has answered, failed, or is not waited for. */
function readFound(entry, sources, onHold) {
    const read = sources.map(source => ({ source, ...gapOf(entry.enrichment[source], onHold) }))
    return {
        waiting: read.some(item => item.waiting),
        album: entry.album,
        missing: read.filter(item => item.gap).map(item => ({ source: item.source, ...place(entry), gap: item.gap }))
    }
}

/** An album that was not found: failed with its reason, or still on its way. */
function readNotFound(entry, heldTooLong) {
    if (entry.status === AlbumStatus.FAILED) {
        return { failure: { ...place(entry), reason: entry.error?.reason || AskFailure.NETWORK, message: entry.error?.message || '' } }
    }
    if (heldTooLong) {
        return { failure: { ...place(entry), reason: AskFailure.ON_HOLD, message: 'The server paused the load before this album was found' } }
    }
    return { waiting: true }
}

/**
 * How long an ask has been under a hold of the server, and when to look at it again. A hold
 * changes no album, so nothing else tells the ask that an album held for as long as a search may
 * take is to be given as failed: this says in how many ms that will be.
 *
 * @param {number|null} heldSince - when this ask first saw the hold in force, or null
 * @param {Object|null} hold - the hold of the load (AlbumLoadStore.getHold())
 * @param {number} now - ms
 * @param {number} limitMs - as long as the search of one album may take
 * @returns {{ heldSince: number|null, heldTooLong: boolean, lookAgainInMs: number|null }}
 */
export function holdWait(heldSince, hold, now, limitMs) {
    if (!hold) return { heldSince: null, heldTooLong: false, lookAgainInMs: null }
    const since = heldSince === null ? now : heldSince
    const left = limitMs - (now - since)
    return { heldSince: since, heldTooLong: left <= 0, lookAgainInMs: left > 0 ? left : null }
}

/**
 * Read where an ask is, from the entries of the series it asked for.
 *
 * @param {Array<{ seriesId: string, entries: Array<Object> }>} asked - in the order asked
 * @param {string[]} sources - the enrichment sources the asker needs; the others are not waited for
 * @param {Object} [flags]
 * @param {boolean} [flags.onHold] - the server holds the load ("sign in" or "wait")
 * @param {boolean} [flags.heldTooLong] - and it has held it for longer than a search may take
 * @param {boolean} [flags.aborted] - the asker dropped the ask
 * @returns {{ settled: boolean, progress: Object, result: Object }}
 */
export function readAsk(asked, sources = [], { onHold = false, heldTooLong = false, aborted = false } = {}) {
    const result = { albums: [], bySeries: {}, failed: [], missingSources: [], total: 0, aborted }
    const progress = { total: 0, found: 0, failed: 0, waitingSources: 0 }
    let waitingAlbums = 0

    asked.forEach(({ seriesId, entries }) => {
        result.bySeries[seriesId] = []
        entries.forEach(entry => {
            progress.total++
            if (entry.status !== AlbumStatus.FOUND || !entry.album) {
                const read = readNotFound(entry, onHold && heldTooLong)
                if (read.failure) { result.failed.push(read.failure); progress.failed++ } else waitingAlbums++
                return
            }
            const read = readFound(entry, sources, onHold)
            progress.found++
            if (read.waiting) progress.waitingSources++
            result.albums.push(read.album)
            result.bySeries[seriesId].push(read.album)
            result.missingSources.push(...read.missing)
        })
    })

    result.total = progress.total
    return { settled: waitingAlbums === 0 && progress.waitingSources === 0, progress, result }
}

const named = (items, text) => {
    const shown = items.slice(0, NAMED_AT_MOST).map(text).join(', ')
    const rest = items.length - NAMED_AT_MOST
    return rest > 0 ? `${shown} and ${rest} more` : shown
}

const failureText = (failure) => `${failure.label} (${REASON_TEXT[failure.reason] || failure.reason})`

const plural = (count) => (count === 1 ? 'album' : 'albums')

function sourceNotice(source, gaps, ready, fallback) {
    const text = SOURCE_TEXT[source] || { name: source, verb: 'is' }
    const counts = Object.values(SourceGap)
        .map(gap => ({ gap, count: gaps.filter(item => item.gap === gap).length }))
        .filter(item => item.count > 0)
        .map(item => (item.gap === SourceGap.EMPTY
            ? `${item.count} ${item.count === 1 ? 'has' : 'have'} ${GAP_TEXT[item.gap]}`
            : `${item.count} ${GAP_TEXT[item.gap]}`))
        .join(', ')
    const missing = `${text.name} ${text.verb} missing for ${gaps.length} of ${ready} ${plural(ready)} (${counts}): ${named(gaps, item => item.label)}.`
    if (!fallback) return missing
    return `${missing} ${gaps.length === 1 ? 'Its' : 'Their'} tracks were ordered ${fallback} instead.`
}

/**
 * What to tell the person about an ask that was served with something missing: one line for the
 * albums left out, one line per source that is missing for some album. Empty when nothing is.
 * @param {Object} result - AlbumsResult
 * @param {Object<string, string>} [fallbacks] - for an asker that orders tracks by a source: how
 *        the tracks of an album are ordered without it (models/recipeSources.js); the line of that
 *        source says it
 * @returns {string[]}
 */
export function askNotices(result, fallbacks = {}) {
    const notices = []
    if (result.failed.length > 0) {
        const left = result.failed.length === 1 ? 'was' : 'were'
        notices.push(`${result.failed.length} of ${result.total} ${plural(result.total)} could not be loaded and ${left} left out: ${named(result.failed, failureText)}.`)
    }
    const sources = [...new Set(result.missingSources.map(item => item.source))]
    sources.sort((a, b) => Object.keys(SOURCE_TEXT).indexOf(a) - Object.keys(SOURCE_TEXT).indexOf(b))
    sources.forEach(source => {
        notices.push(sourceNotice(source, result.missingSources.filter(item => item.source === source), result.albums.length, fallbacks[source]))
    })
    return notices
}

/** What to say when an ask ended with no album at all. */
export function noAlbumsMessage(result) {
    if (result.total === 0) return 'This series has no albums.'
    return `None of the ${result.total} ${plural(result.total)} could be loaded: ${named(result.failed, failureText)}.`
}

/** The line a screen shows while it waits for an ask. */
export function askProgressText(progress) {
    const settled = progress.found + progress.failed
    if (settled < progress.total) return `Loading albums: ${settled} of ${progress.total}...`
    return `Waiting for the ratings of ${progress.waitingSources} of ${progress.total} ${plural(progress.total)}...`
}
