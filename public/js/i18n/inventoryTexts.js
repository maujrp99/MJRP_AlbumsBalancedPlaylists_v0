/**
 * inventoryTexts - the words of the inventory that its rules do not say (F83 wave 6c).
 *
 * The models of the inventory (models/inventory*.js, buyLinks.js) give a CODE and the numbers: a status, a reason, a failure, a list of
 * parts `{ code, ...numbers }`. They never write a sentence, and models/ does not import i18n/. This file is where a screen or a controller
 * turns those codes into the words of the language the site speaks now (`t` and `tPlural`, the dictionaries `en/inventory.js` and
 * `pt/inventory.js`). The English is the English the models used to write, word for word.
 *
 * Nothing here is read at import time: every function asks `t` when it is called, so a screen that listens to the language says the
 * new words at its next drawing.
 */
import { t, tPlural } from './t.js'
import {
    ALL_STATUSES, InventoryStatus, STATUS_FILTER_OPTIONS, STATUS_SELECT_OPTIONS, statusCodeOf, statusIconOf
} from '../models/inventoryStatus.js'
import { SORT_OPTIONS } from '../models/inventorySort.js'
import {
    NoValue, ValueBasis, ValueLabel, discogsHintOf, failureCodeOf, noValueCodeOf, valueLabelCodeOf, ReadFailure
} from '../models/inventoryValue.js'
import { StopReason, readingNoticeOf, waitingNoticeOf, valuesOutcome as valuesOutcomeOf } from '../models/inventoryValueRun.js'
import { confirmationOf, nothingToAddOf, outcomeOf, progressOf } from '../models/inventoryFromSeries.js'
import { ratingsOutcome as ratingsOutcomeOf } from '../models/inventoryRatings.js'

/** The parts of a sentence group are said one after the other, with a space between them. */
const say = (parts, sayOne) => parts.map(sayOne).join(' ')

// ---- The status ------------------------------------------------------------------------------------

const STATUS_KEYS = Object.freeze({
    [ALL_STATUSES]: 'inventory.status.all',
    [InventoryStatus.OWNED]: 'inventory.status.owned',
    [InventoryStatus.NOT_OWNED]: 'inventory.status.notOwned',
    [InventoryStatus.WISHLIST]: 'inventory.status.wishlist'
})

const CHANGED_KEYS = Object.freeze({
    [InventoryStatus.OWNED]: 'inventory.status.changed.owned',
    [InventoryStatus.NOT_OWNED]: 'inventory.status.changed.notOwned',
    [InventoryStatus.WISHLIST]: 'inventory.status.changed.wishlist'
})

/** "Owned", "Not Owned", "Wishlist". */
export const statusLabel = (status) => t(STATUS_KEYS[statusCodeOf(status)])

const withIcon = (icon, text) => (icon ? `${icon} ${text}` : text)

/** "✓ 3 Owned", "176 Not Owned", "♡ 2 Wishlist": what the header of the screen shows. */
export const statusCountLabel = (status, count) => withIcon(statusIconOf(status), `${count} ${statusLabel(status)}`)

/** What the person is told after changing the status of an item. */
export const statusChangeMessage = (status) => t(CHANGED_KEYS[statusCodeOf(status)])

/** The filter of the screen: `{ value, label }` for each choice. */
export const statusFilterOptions = () => STATUS_FILTER_OPTIONS.map(({ value }) => ({ value, label: t(STATUS_KEYS[value]) }))

/** The selector on the card of an item: `{ value, label }`, the mark before the name. */
export const statusSelectOptions = () => STATUS_SELECT_OPTIONS.map(({ value, icon }) => ({ value, label: withIcon(icon, t(STATUS_KEYS[value])) }))

// ---- The order -------------------------------------------------------------------------------------

const SORT_KEYS = Object.freeze({
    artist: 'inventory.sort.option.artist',
    artist_desc: 'inventory.sort.option.artistDesc',
    averageRating: 'inventory.sort.option.averageRating',
    averageRating_asc: 'inventory.sort.option.averageRatingAsc',
    averagePopularity: 'inventory.sort.option.averagePopularity',
    averagePopularity_asc: 'inventory.sort.option.averagePopularityAsc',
    value: 'inventory.sort.option.value',
    value_asc: 'inventory.sort.option.valueAsc',
    addedToInventory: 'inventory.sort.option.addedToInventory',
    addedToInventory_asc: 'inventory.sort.option.addedToInventoryAsc'
})

/** The choices of the order, as the person sees them: `{ value, label }`. */
export const sortOptions = () => SORT_OPTIONS.map(({ value }) => ({ value, label: t(SORT_KEYS[value]) }))

// ---- The value of an album -------------------------------------------------------------------------

const FAILURE_KEYS = Object.freeze({
    [ReadFailure.NO_ANSWER]: 'inventory.value.failure.noAnswer',
    [ReadFailure.LIMIT]: 'inventory.value.failure.limit',
    [ReadFailure.TOKEN_REFUSED]: 'inventory.value.failure.tokenRefused',
    [ReadFailure.SIGN_IN]: 'inventory.value.failure.signIn',
    [ReadFailure.OTHER]: 'inventory.value.failure.other'
})

const NONE_KEYS = Object.freeze({
    [NoValue.NEVER_READ]: 'inventory.value.none.neverRead',
    [NoValue.WAITING]: 'inventory.value.none.waiting',
    [NoValue.READING]: 'inventory.value.none.reading',
    [NoValue.NO_CD_EDITION]: 'inventory.value.none.noCdEdition',
    [NoValue.NO_SUGGESTION]: 'inventory.value.none.noSuggestion',
    [NoValue.NONE_FOR_SALE]: 'inventory.value.none.noneForSale'
})

/** Why a read failed: "Discogs did not answer", "Discogs limit reached"... */
export const failureText = (failure) => t(FAILURE_KEYS[failureCodeOf(failure)])

/** The short line of a card for an item with no value. */
export const noValueText = (value) => (value.reason === NoValue.FAILED ? failureText(value.failure) : t(NONE_KEYS[noValueCodeOf(value)]))

/** The label of the value of a card, by the status of the item. */
export const valueLabel = (item) => t(valueLabelCodeOf(item) === ValueLabel.OWNED ? 'inventory.value.label.owned' : 'inventory.value.label.toBuy')

/** What kind of Discogs value this is, in words: a lowest asking price is never called a mean (and the other way round). */
export const discogsKindNote = (value) => t(discogsHintOf(value).kind === ValueBasis.LOWEST_FOR_SALE ? 'inventory.value.kind.lowest' : 'inventory.value.kind.suggestion')

/** The `title` of an origin line: what the value is, and when it was read, said once. */
export function discogsHint(value) {
    const { moment } = discogsHintOf(value)
    const kind = discogsKindNote(value)
    return moment ? t('inventory.value.hintRead', { kind, moment }) : t('inventory.value.hint', { kind })
}

export const lowestPricesNote = () => t('inventory.totals.lowestNote')
export const ratesMissingText = () => t('inventory.totals.ratesMissing')

/** "3 of 14 owned albums have a value": the words of the prototype, the same for every count. */
export const ownedNote = ({ valued, total }) => t('inventory.totals.ownedNote', { valued, total })
/** "9 of 197 albums have a value". */
export const toBuyNote = ({ valued, total }) => t('inventory.totals.toBuyNote', { valued, total })
/** The line under the totals when the screen is not in USD. */
export const rateNote = (currency, rates) => t('inventory.totals.rateNote', { rate: rates[currency], currency })

/** What the album window says above the links. */
export const buyLinksNote = () => t('inventory.buy.note')
/** Why "Sell" and "Trade" cannot be pressed. */
export const sellTradeSoon = () => t('inventory.buy.sellTradeSoon')

// ---- "Update values" -------------------------------------------------------------------------------

/** What the button says while the run goes. */
export const valuesProgressText = ({ done, total }) => t('inventory.run.progress', { done, total })

const durationText = (minutes) => tPlural('inventory.run.duration', minutes, { minutes })

/** The notice of a run under way. */
export function readingNotice(progress) {
    const { done, total, minutes } = readingNoticeOf(progress)
    return {
        strong: `${valuesProgressText({ done, total })}.`,
        rest: tPlural('inventory.run.readingRest', total, { count: total, duration: durationText(minutes) }),
        action: t('inventory.run.stop')
    }
}

/** The notice of an inventory with albums that have no value and no fresh reading. */
export function waitingNotice(count) {
    const { minutes } = waitingNoticeOf(count)
    return {
        strong: tPlural('inventory.run.waiting', count, { count }),
        rest: tPlural('inventory.run.waitingRest', count, { duration: durationText(minutes) }),
        action: tPlural('inventory.run.readNow', count)
    }
}

const STOP_KEYS = Object.freeze({
    [StopReason.TOKEN_REFUSED]: 'inventory.run.out.stopped.tokenRefused',
    [StopReason.SIGN_IN]: 'inventory.run.out.stopped.signIn',
    [StopReason.LIMIT]: 'inventory.run.out.stopped.limit',
    [StopReason.OFF]: 'inventory.run.out.stopped.off'
})

function sayRunPart(part) {
    switch (part.code) {
        case 'read': return tPlural('inventory.run.out.read', part.total, { read: part.read, total: part.total })
        case 'noEdition': return tPlural('inventory.run.out.noEdition', part.count, { count: part.count })
        case 'noSuggestion': return tPlural('inventory.run.out.noSuggestion', part.count, { count: part.count })
        case 'failed': {
            const list = part.failures.map(({ failure, count }) => `${failureText(failure)} (${count})`).join(', ')
            return tPlural('inventory.run.out.failed', part.count, { count: part.count, list })
        }
        case 'unkept': return tPlural('inventory.run.out.unkept', part.count, { count: part.count })
        case 'stopped': return t(STOP_KEYS[part.reason])
        default: return t('inventory.run.out.aborted', { done: part.done, total: part.total })
    }
}

/**
 * The honest end of a run.
 * @param {Object} count - of emptyCount / countAfter, with `stopped` and `aborted`
 * @returns {{ ok: boolean, text: string }}
 */
export function valuesOutcome(count) {
    const { ok, parts } = valuesOutcomeOf(count)
    return { ok, text: say(parts, sayRunPart) }
}

/** What the person is told of ONE value read but not saved to the inventory (REQ-14). */
export const unkeptValueText = () => t('inventory.run.unkeptValue')

/** What the person is told when one album was read from its window and failed. */
export const readFailedText = (failure) => t('inventory.value.notRead', { reason: failureText(failure) })

// ---- "Add the albums of my series" -----------------------------------------------------------------

function saySeriesPart(part) {
    switch (part.code) {
        case 'willAdd': return tPlural('inventory.series.out.willAdd', part.count, { count: part.count, series: part.series })
        case 'alreadyThere': return tPlural('inventory.series.out.alreadyThere', part.count, { count: part.count })
        case 'repeated': return tPlural('inventory.series.out.repeated', part.count, { count: part.count })
        case 'incomplete': return tPlural('inventory.series.out.incomplete', part.count, { count: part.count })
        case 'added': return tPlural('inventory.series.out.added', part.count, { count: part.count })
        case 'reload': return t('inventory.series.out.reload')
        case 'noneAdded': return t('inventory.series.out.noneAdded')
        case 'partlyAdded': return tPlural('inventory.series.out.partlyAdded', part.total, { added: part.added, total: part.total })
        default: return tPlural('inventory.series.out.notAdded', part.count, { count: part.count })
    }
}

/** The question asked before anything is written. */
export const confirmationText = (plan) => say(confirmationOf(plan), saySeriesPart)

/** What is said when the plan has nothing to add. */
export const nothingToAddText = (plan) => t(nothingToAddOf(plan) === 'alreadyThere' ? 'inventory.series.out.everyOneThere' : 'inventory.series.out.noAlbums')

/** What the button says while the albums are written. */
export function progressText(step) {
    const { code, added, total } = progressOf(step)
    return code === 'adding' ? t('inventory.series.out.adding', { added, total }) : tPlural('inventory.series.out.counting', total, { count: total })
}

/**
 * The honest end.
 * @param {{ added: number, total: number, error: string|null, reloaded?: boolean }} result
 * @returns {{ ok: boolean, text: string }}
 */
export function outcomeText(result) {
    const { ok, parts } = outcomeOf(result)
    return { ok, text: say(parts, saySeriesPart) }
}

// ---- "Update ratings" ------------------------------------------------------------------------------

/** The question asked before a long read. */
export const ratingsQuestion = (count) => ({
    title: t('inventory.ratings.question.title'),
    message: tPlural('inventory.ratings.question.message', count, { count }),
    confirmText: t('inventory.ratings.question.confirm')
})

/** What the button says: `{ phase: 'reading', done, total }` or `{ phase: 'saving' }`. */
export const ratingsProgressText = ({ phase, done, total }) => (phase === 'saving' ? t('inventory.ratings.saving') : t('inventory.ratings.reading', { done, total }))

function sayRatingsPart(part) {
    switch (part.code) {
        case 'updated': return tPlural('inventory.ratings.out.updated', part.total, { saved: part.saved, total: part.total })
        case 'notFound': return tPlural('inventory.ratings.out.notFound', part.count, { count: part.count })
        case 'withoutRatings': return tPlural('inventory.ratings.out.withoutRatings', part.count, { count: part.count })
        case 'popularityNotConnected': return tPlural('inventory.ratings.out.popularityNotConnected', part.count, { count: part.count })
        case 'unanswered': return tPlural('inventory.ratings.out.unanswered', part.count, { count: part.count })
        case 'covers': return tPlural('inventory.ratings.out.covers', part.count, { count: part.count })
        case 'noneSaved': return t('inventory.ratings.out.noneSaved')
        default: return tPlural('inventory.ratings.out.partlySaved', part.planned, { saved: part.saved, planned: part.planned })
    }
}

/**
 * The honest end.
 * @param {Object} result - of InventoryService.updateAverages, with the counts of planAverages
 * @returns {{ ok: boolean, text: string }}
 */
export function ratingsOutcome(result) {
    const { ok, parts } = ratingsOutcomeOf(result)
    return { ok, text: say(parts, sayRatingsPart) }
}
