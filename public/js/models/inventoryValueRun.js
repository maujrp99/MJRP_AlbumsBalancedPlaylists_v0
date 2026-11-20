/**
 * inventoryValueRun - "Update values" (F75, REQ-09), as pure rules: which items a run reads, what
 * an answer of the server is worth, and what the person is told while it runs and when it ends.
 *
 * A run asks the server for one album at a time (services/inventory/InventoryValueService.js).
 * A failure of one album does not stop it; a failure that every album would repeat does (the
 * token was refused, the person is not signed in, the source was turned off, the limit asks for a
 * long wait). The end says what happened, in numbers, and invents nothing.
 */

import { ReadFailure, ReadingKind, failureText, needsReading } from './inventoryValue.js'

/** About how long one album takes: up to three requests to Discogs, one a second, and their answers. */
const SECONDS_PER_ALBUM = 3.5
/** A wait the server asks for is kept only up to this; a longer one stops the run. */
export const LONGEST_WAIT_MS = 5 * 60 * 1000
/** How many times one album is asked again after "wait". */
export const WAITS_PER_ALBUM = 2
/** The wait when the server says "wait" and not for how long. */
export const DEFAULT_WAIT_MS = 60 * 1000

/** The items a run reads: no value written by the person, and no fresh reading. */
export const itemsToRead = (items, readings, now) => items.filter(item => needsReading(item, readings.get(item.id), now))

const isGiven = (value) => value !== undefined && value !== null

/** What the server is asked for an item: a known edition skips the search. */
export function askOfItem(item) {
    const held = item.albumData || {}
    const year = [item.year, held.year].find(isGiven)
    const releaseId = item.discogs ? item.discogs.releaseId : null
    return {
        artist: [item.artist, held.artist].find(Boolean) || '',
        title: [item.title, held.title].find(Boolean) || '',
        ...(isGiven(year) && { year }),
        ...(Number.isInteger(releaseId) && { releaseId })
    }
}

const FAILURE_OF_CODE = Object.freeze({
    upstream_unauthorized: ReadFailure.TOKEN_REFUSED,
    upstream_busy: ReadFailure.LIMIT,
    rate_limited: ReadFailure.LIMIT,
    unauthorized: ReadFailure.SIGN_IN,
    upstream_timeout: ReadFailure.NO_ANSWER,
    upstream_failed: ReadFailure.NO_ANSWER,
    no_answer: ReadFailure.NO_ANSWER,
    deadline: ReadFailure.NO_ANSWER
})

/** The failures every other album would repeat: the run stops at the first one. */
const STOPS_THE_RUN = new Set([ReadFailure.TOKEN_REFUSED, ReadFailure.SIGN_IN])

/** The kinds of a typed result of the server (api/serverResult.js) that are a reading. */
const KIND_OF_RESULT = Object.freeze({
    found: ReadingKind.FOUND,
    not_found: ReadingKind.NOT_FOUND,
    no_value: ReadingKind.NO_VALUE
})
const NOT_CONFIGURED = 'not_configured'
const FAILED = 'failed'

/** The reading the browser keeps for an answer of the source. `at`: when it was read, for an answer that carries no time. */
function readingOf(result, at) {
    const data = result.data || {}
    return { kind: KIND_OF_RESULT[result.kind], release: data.release ?? null, conditions: data.conditions ?? null, currency: data.currency ?? null, readAt: data.readAt || at }
}

const waitOf = (result) => result.hold?.retryAfterMs ?? (result.code === 'upstream_busy' || result.code === 'rate_limited' ? DEFAULT_WAIT_MS : null)

/**
 * What one answer of POST /api/album-value is worth.
 * @param {Object} result - a typed result of api/serverResult.js
 * @param {string} at - ISO time of the answer
 * @returns {Object} { reading } | { off: true } | { failure, waitMs, stops }
 */
export function readOutcomeOf(result, at) {
    if (KIND_OF_RESULT[result.kind]) return { reading: readingOf(result, at) }
    if (result.kind === NOT_CONFIGURED) return { off: true }
    const failure = (result.kind === FAILED && FAILURE_OF_CODE[result.code]) || ReadFailure.OTHER
    const waitMs = failure === ReadFailure.LIMIT ? waitOf(result) : null
    return { failure, waitMs, stops: STOPS_THE_RUN.has(failure) || (waitMs !== null && waitMs > LONGEST_WAIT_MS) }
}

/** The edition to keep in the item (catalogue data), when the answer names one the item does not have yet. */
export function editionToKeep(item, reading) {
    const release = reading?.release
    if (!release || !Number.isInteger(release.id)) return null
    const kept = item?.discogs
    if (kept?.releaseId === release.id) return null
    return { releaseId: release.id, title: release.title ?? null, url: release.url ?? null }
}

/** What the item keeps of the edition with this id; nothing when it keeps another one, or none. */
const keptEditionOf = (item, id) => (item.discogs && item.discogs.releaseId === id ? item.discogs : {})

/** The edition a reading is of: what the answer says, completed by what the item already keeps (a re-read has no title). */
export function editionOf(item, release) {
    if (!release) return null
    const kept = keptEditionOf(item, release.id)
    return { id: release.id, title: release.title || kept.title || null, url: release.url || kept.url || null }
}

// ---- The count of a run ----------------------------------------------------------------------------

export const emptyCount = (total) => ({ total, done: 0, read: 0, noEdition: 0, noSuggestion: 0, failed: {}, stopped: null, aborted: false })

/** The count after one more album. */
export function countAfter(count, outcome) {
    const next = { ...count, done: count.done + 1, failed: { ...count.failed } }
    if (outcome.failure) next.failed[outcome.failure] = (next.failed[outcome.failure] || 0) + 1
    else if (outcome.reading?.kind === ReadingKind.FOUND) next.read += 1
    else if (outcome.reading?.kind === ReadingKind.NOT_FOUND) next.noEdition += 1
    else next.noSuggestion += 1
    return next
}

// ---- What the person is told -----------------------------------------------------------------------

const albums = (number) => `${number} ${number === 1 ? 'album' : 'albums'}`

function durationText(count) {
    const minutes = Math.ceil((count * SECONDS_PER_ALBUM) / 60)
    return minutes <= 1 ? 'about a minute' : `about ${minutes} minutes`
}

/** What the button says while the run goes. */
export const valuesProgressText = ({ done, total }) => `Reading values… ${done} of ${total}`

/** The notice of a run under way. */
export const readingNotice = ({ done, total }) => ({
    strong: `${valuesProgressText({ done, total })}.`,
    rest: `You can keep using the inventory. This takes ${durationText(total)} for ${albums(total)}.`,
    action: 'Stop'
})

/** The notice of an inventory with albums that have no value and no fresh reading. Nothing is read until the person asks. */
export const waitingNotice = (count) => ({
    strong: `${albums(count)} ${count === 1 ? 'is' : 'are'} waiting for a value.`,
    rest: `Reading ${count === 1 ? 'it' : 'them'} takes ${durationText(count)}.`,
    action: count === 1 ? 'Read it now' : 'Read them now'
})

const STOP_TEXT = Object.freeze({
    [ReadFailure.TOKEN_REFUSED]: 'Discogs refused the token of the app, so the reading stopped. The token on the server has to be replaced.',
    [ReadFailure.SIGN_IN]: 'Reading values needs you signed in with an account, so the reading stopped.',
    [ReadFailure.LIMIT]: 'The limit of requests was reached and asks for a long wait, so the reading stopped. Try again later.',
    off: 'Discogs values were turned off on the server, so the reading stopped.'
})

const failedSentence = (failed) => {
    const parts = Object.entries(failed).map(([failure, number]) => `${failureText(failure)} (${number})`)
    const total = Object.values(failed).reduce((sum, number) => sum + number, 0)
    return total > 0 ? [`${albums(total)} could not be read: ${parts.join(', ')}.`] : []
}

/**
 * The honest end of a run.
 * @param {Object} count - of emptyCount / countAfter, with `stopped` and `aborted`
 * @returns {{ ok: boolean, text: string }}
 */
export function valuesOutcome(count) {
    const { total, done, read, noEdition, noSuggestion, failed, stopped, aborted } = count
    const sentences = [`Values read for ${read} of ${albums(total)}.`]
    if (noEdition > 0) sentences.push(`${albums(noEdition)} ${noEdition === 1 ? 'has' : 'have'} no CD edition on Discogs.`)
    if (noSuggestion > 0) sentences.push(`Discogs suggests no price for ${albums(noSuggestion)}.`)
    sentences.push(...failedSentence(failed))
    if (stopped) sentences.push(STOP_TEXT[stopped] || STOP_TEXT[ReadFailure.LIMIT])
    else if (aborted && done < total) sentences.push(`Stopped by you after ${done} of ${total}.`)
    const clean = !stopped && Object.keys(failed).length === 0
    return { ok: clean, text: sentences.join(' ') }
}

/** What the person is told when one album was read from its window and failed. */
export const readFailedText = (failure) => `${failureText(failure)}. The value was not read.`
