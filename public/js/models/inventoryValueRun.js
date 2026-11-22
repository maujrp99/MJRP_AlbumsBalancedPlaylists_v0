/**
 * inventoryValueRun - "Update values" (F75, REQ-09), as pure rules: which items a run reads, what
 * an answer of the server is worth, and what the person is told while it runs and when it ends.
 *
 * A run asks the server for one album at a time (services/inventory/InventoryValueService.js).
 * A failure of one album does not stop it; a failure that every album would repeat does (the
 * token was refused, the person is not signed in, the source was turned off, the limit asks for a
 * long wait). The end says what happened, in numbers, and invents nothing.
 */

import { ReadFailure, ReadingKind, failureText, needsKeeping, needsReading, neverRead } from './inventoryValue.js'

/** About how long one album takes: up to three requests to Discogs, one a second, and their answers. */
const SECONDS_PER_ALBUM = 3.5
/** A wait the server asks for is kept only up to this; a longer one stops the run. */
export const LONGEST_WAIT_MS = 5 * 60 * 1000
/** How many times one album is asked again after "wait". */
export const WAITS_PER_ALBUM = 2
/** The wait when the server says "wait" and not for how long. */
export const DEFAULT_WAIT_MS = 60 * 1000

/**
 * The items "Update values" reads: no value written by the person, and no reading younger than six
 * hours (the guard against asking Discogs twice in a row). The reading kept in the item counts, as
 * does the one the browser holds.
 * @param {Array<Object>} items
 * @param {Map<string, Object>} readings - item id -> the reading the browser holds
 * @param {number} now - ms
 */
export const itemsToRead = (items, readings, now) => items.filter(item => needsReading(item, readings.get(item.id), now))

/** The items that never had a reading, kept or held: what the notice counts and "Read them now" reads. */
export const itemsNeverRead = (items, readings) => items.filter(item => neverRead(item, readings.get(item.id)))

/** The readings only the browser has (or has newer), which a run keeps in the items with no question to Discogs. */
export const readingsToKeep = (items, readings) => items
    .filter(item => needsKeeping(item, readings.get(item.id)))
    .map(item => ({ item, reading: readings.get(item.id) }))

const isGiven = (value) => value !== undefined && value !== null

/** What the server is asked for an item: a known edition skips the search. */
export function askOfItem(item, { lowestOnly = false } = {}) {
    const held = item.albumData || {}
    const year = [item.year, held.year].find(isGiven)
    const releaseId = item.discogs ? item.discogs.releaseId : null
    return {
        artist: [item.artist, held.artist].find(Boolean) || '',
        title: [item.title, held.title].find(Boolean) || '',
        ...(isGiven(year) && { year }),
        ...(Number.isInteger(releaseId) && { releaseId }),
        // the suggestions are known to be refused (no seller settings): only the lowest price is asked
        ...(lowestOnly && { prices: 'lowest' })
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
    const reading = { kind: KIND_OF_RESULT[result.kind], release: data.release ?? null, conditions: data.conditions ?? null, currency: data.currency ?? null, readAt: data.readAt || at }
    return isOfLowestForSale(data) ? { ...reading, ...lowestForSaleOf(data) } : reading
}

const LOWEST_FOR_SALE = 'lowest_for_sale'
const NONE_FOR_SALE = 'none_for_sale'
const SELLER_SETTINGS_MISSING = 'seller_settings_missing'

/** The answer is of the weaker reading: the lowest price for sale, or "none for sale". */
const isOfLowestForSale = (data) => data.kind === LOWEST_FOR_SALE || data.reason === NONE_FOR_SALE

/** What a reading of the lowest price for sale keeps beside the rest. */
function lowestForSaleOf(data) {
    const lowest = data.lowest || null
    return { basis: LOWEST_FOR_SALE, lowest, forSale: data.forSale ?? 0, currency: lowest ? lowest.currency : null }
}

const waitOf = (result) => result.hold?.retryAfterMs ?? (result.code === 'upstream_busy' || result.code === 'rate_limited' ? DEFAULT_WAIT_MS : null)

/**
 * What one answer of POST /api/album-value is worth.
 * @param {Object} result - a typed result of api/serverResult.js
 * @param {string} at - ISO time of the answer
 * @returns {Object} { reading } | { off: true } | { failure, waitMs, stops }
 */
export function readOutcomeOf(result, at) {
    if (KIND_OF_RESULT[result.kind]) {
        // Discogs refused the suggestions for the seller settings: said beside the reading, so the run stops asking for them
        const refused = result.data && result.data.suggestions === SELLER_SETTINGS_MISSING
        return { reading: readingOf(result, at), ...(refused && { sellerSettingsMissing: true }) }
    }
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
    const { total, read, failed, stopped, unkept = 0 } = count
    const sentences = [`Values read for ${read} of ${albums(total)}.`, ...answerSentences(count), ...failedSentence(failed), ...unkeptSentence(unkept), ...endSentence(count)]
    const clean = !stopped && unkept === 0 && Object.keys(failed).length === 0
    return { ok: clean, text: sentences.join(' ') }
}

/** The albums Discogs answered with no value: no CD edition, no suggested price. */
function answerSentences({ noEdition, noSuggestion }) {
    const sentences = []
    if (noEdition > 0) sentences.push(`${albums(noEdition)} ${noEdition === 1 ? 'has' : 'have'} no CD edition on Discogs.`)
    if (noSuggestion > 0) sentences.push(`Discogs suggests no price for ${albums(noSuggestion)}.`)
    return sentences
}

/** What the person is told of ONE value read but not saved to the inventory (REQ-14): the browser keeps it six hours (READING_TTL_MS), and «Update values» saves it. */
export const UNKEPT_VALUE_TEXT = 'The value was read but not saved to your inventory. This browser keeps it for six hours; Update values tries to save it again.'

/** Values read but not saved to the inventory: said, and they still show in this browser (REQ-14). */
function unkeptSentence(unkept) {
    if (unkept <= 0) return []
    const [noun, them] = unkept === 1 ? ['value', 'it'] : ['values', 'them']
    return [`${unkept} ${noun} could not be saved to your inventory. This browser keeps ${them} for six hours; Update values tries to save ${them} again.`]
}

/** Why the run ended before the end, when it did. */
function endSentence({ total, done, stopped, aborted }) {
    if (stopped) return [STOP_TEXT[stopped] || STOP_TEXT[ReadFailure.LIMIT]]
    return aborted && done < total ? [`Stopped by you after ${done} of ${total}.`] : []
}

/**
 * How a run ended, in one word, for the measurement of use (F77, `inventory_values_read`). An
 * album with no CD edition or no suggestion is an answer, not a failure.
 * @param {{ read: number, failed: Object, stopped: string|null, aborted: boolean }} count
 * @returns {'complete'|'partial'|'stopped'|'failed'}
 */
export function valuesRunOutcome({ read, failed, stopped, aborted }) {
    if (stopped || Object.keys(failed || {}).length > 0) return read > 0 ? 'partial' : 'failed'
    return aborted ? 'stopped' : 'complete'
}

/** What the person is told when one album was read from its window and failed. */
export const readFailedText = (failure) => `${failureText(failure)}. The value was not read.`
