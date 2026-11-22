// @vitest-environment node
/**
 * F83 wave 6c (REQ-08): the models of the inventory give a code and the numbers, never an English sentence. The words are in the
 * dictionary (i18n/en, i18n/pt) and `i18n/inventoryTexts.js` says them; `inventoryTexts.test.js` proves the English is the English the
 * models used to write.
 *
 * Two proofs. (1) A walk over what each model exports and over what its functions answer for typical input: no text with two words in
 * it comes out (the only text a model keeps is «Data provided by Discogs.», the sentence the Discogs terms ask for, the same in every
 * language; a date is a format, not a sentence, and the names of the stores are names). (2) Per model, the code and the numbers it gives.
 */
import { describe, it, expect } from 'vitest'
import * as status from '../../public/js/models/inventoryStatus.js'
import * as sort from '../../public/js/models/inventorySort.js'
import * as value from '../../public/js/models/inventoryValue.js'
import * as run from '../../public/js/models/inventoryValueRun.js'
import * as series from '../../public/js/models/inventoryFromSeries.js'
import * as ratings from '../../public/js/models/inventoryRatings.js'
import * as buy from '../../public/js/models/buyLinks.js'
import * as card from '../../public/js/models/inventoryCard.js'

/** A sentence: two words, or one word and an ending mark. */
const SENTENCE = /[A-Za-z]{2,}[ \u00a0][A-Za-z]{2,}|[A-Za-z]{2,}[.…:?!]\s*$/

/** Every text found in a datum, with where it is. */
function textsIn(datum, where, found = []) {
    if (typeof datum === 'string') found.push([where, datum])
    else if (Array.isArray(datum)) datum.forEach((one, index) => textsIn(one, `${where}[${index}]`, found))
    else if (datum && typeof datum === 'object' && !(datum instanceof Map)) Object.entries(datum).forEach(([name, one]) => textsIn(one, `${where}.${name}`, found))
    return found
}

const sentencesIn = (datum, where, allowed = []) => textsIn(datum, where).filter(([, text]) => SENTENCE.test(text) && !allowed.includes(text)).map(([at, text]) => `${at}: ${text}`)

const CREDIT = ['Data provided by Discogs.']

describe('what a model of the inventory exports is no sentence', () => {
    const MODELS = { status, sort, value, run, series, ratings, buy, card }
    for (const [name, model] of Object.entries(MODELS)) {
        it(`${name}: no exported text, list or table holds an English sentence`, () => {
            const data = Object.entries(model).filter(([, exported]) => typeof exported !== 'function')
            expect(data.flatMap(([key, exported]) => sentencesIn(exported, `${name}.${key}`, CREDIT))).toEqual([])
        })
    }

    it('the sentences that were constants are gone from the models', () => {
        const gone = ['BUY_LINKS_NOTE', 'SELL_TRADE_SOON', 'LOWEST_PRICES_NOTE', 'RATES_MISSING_TEXT', 'DISCOGS_MEAN_TITLE', 'DISCOGS_LOWEST_TITLE', 'UNKEPT_VALUE_TEXT']
        const exported = new Set(Object.values(MODELS).flatMap(model => Object.keys(model)))
        expect(gone.filter(name => exported.has(name))).toEqual([])
    })

    it('the functions that wrote a sentence are gone (the text layer has them now) or give a code', () => {
        const gone = ['statusLabel', 'statusCountLabel', 'statusChangeMessage', 'failureText', 'noValueText', 'valueLabel', 'discogsKindNote', 'discogsHint',
            'ownedNote', 'toBuyNote', 'rateNote', 'valuesProgressText', 'readingNotice', 'waitingNotice', 'readFailedText', 'confirmationText',
            'nothingToAddText', 'progressText', 'outcomeText', 'ratingsQuestion', 'ratingsProgressText']
        const exported = new Set(Object.values(MODELS).flatMap(model => Object.keys(model)))
        expect(gone.filter(name => exported.has(name))).toEqual([])
    })
})

describe('inventoryStatus gives the status and its mark, not its name', () => {
    it('the options carry the value (and the mark), never a label', () => {
        expect(status.STATUS_FILTER_OPTIONS).toEqual([{ value: 'all' }, { value: 'owned' }, { value: 'not-owned' }, { value: 'wishlist' }])
        expect(status.STATUS_SELECT_OPTIONS).toEqual([
            { value: 'not-owned', icon: '' }, { value: 'owned', icon: '✓' }, { value: 'wishlist', icon: '♡' }
        ])
    })

    it('a text is about a status the model knows: an unknown one is Not Owned', () => {
        expect(status.statusCodeOf('wishlist')).toBe('wishlist')
        expect(status.statusCodeOf('sold')).toBe('not-owned')
        expect(status.statusCodeOf(undefined)).toBe('not-owned')
        expect(['owned', 'not-owned', 'wishlist', 'sold', undefined].map(status.statusIconOf)).toEqual(['✓', '', '♡', '', ''])
    })
})

describe('inventorySort gives the code of each choice, not its name', () => {
    it('each choice is a code with its field and its direction', () => {
        expect(sort.SORT_OPTIONS.map(option => Object.keys(option))).toEqual(sort.SORT_OPTIONS.map(() => ['value', 'field', 'direction']))
        expect(sort.SORT_OPTIONS.map(option => option.value)).toEqual([
            'artist', 'artist_desc', 'averageRating', 'averageRating_asc', 'averagePopularity', 'averagePopularity_asc', 'value', 'value_asc', 'addedToInventory', 'addedToInventory_asc'
        ])
    })
})

describe('inventoryValue gives the reason, the failure, the kind and the numbers', () => {
    it('the failure and the reason with no value are codes; what is not known reads as other / never read', () => {
        expect(['no_answer', 'limit', 'token_refused', 'sign_in', 'other', 'something new'].map(value.failureCodeOf)).toEqual(['no_answer', 'limit', 'token_refused', 'sign_in', 'other', 'other'])
        const reasons = ['never_read', 'source_off', 'waiting', 'reading', 'no_cd_edition', 'no_suggestion', 'none_for_sale', 'failed', 'new reason', undefined]
        expect(reasons.map(reason => value.noValueCodeOf({ origin: null, reason }))).toEqual(
            ['never_read', 'never_read', 'waiting', 'reading', 'no_cd_edition', 'no_suggestion', 'none_for_sale', 'failed', 'never_read', 'never_read']
        )
    })

    it('the label of a value is about owned or still to buy', () => {
        expect(value.valueLabelCodeOf({ owned: true })).toBe('owned')
        expect(value.valueLabelCodeOf({ owned: null })).toBe('to_buy')
        expect(value.valueLabelCodeOf({ owned: false })).toBe('to_buy')
    })

    it('the title of an origin line is the kind of the value and the moment it was read (a format, the same in every language)', () => {
        expect(value.discogsKindOf({ basis: 'lowest_for_sale' })).toBe('lowest_for_sale')
        expect(value.discogsKindOf({ basis: 'suggestion' })).toBe('suggestion')
        expect(value.discogsKindOf(null)).toBe('suggestion')
        expect(value.discogsHintOf({ readAt: '2026-11-18T14:05:00.000Z', basis: 'lowest_for_sale' })).toEqual({ kind: 'lowest_for_sale', moment: expect.stringMatching(/^18 Nov 2026, \d\d:\d\d$/) })
        expect(value.discogsHintOf({ readAt: 'bad' })).toEqual({ kind: 'suggestion', moment: '' })
    })

    it('the credit the Discogs terms ask for is the one text a model keeps', () => {
        expect(value.DISCOGS_CREDIT).toBe('Data provided by Discogs.')
    })
})

describe('inventoryValueRun gives numbers and parts, not sentences', () => {
    it('a notice says its numbers (and how many minutes the run takes, at least one)', () => {
        expect(run.readingNoticeOf({ done: 86, total: 211 })).toEqual({ done: 86, total: 211, minutes: 13 })
        expect(run.waitingNoticeOf(2)).toEqual({ count: 2, minutes: 1 })
        expect(run.minutesFor(1)).toBe(1)
        expect(run.minutesFor(100)).toBe(6)
    })

    it('the end of a run is a list of parts, in the order they are said', () => {
        expect(run.valuesOutcome({ ...run.emptyCount(211), done: 211, read: 211 })).toEqual({ ok: true, parts: [{ code: 'read', read: 211, total: 211 }] })

        const mixed = run.valuesOutcome({ ...run.emptyCount(211), done: 211, read: 180, noEdition: 12, noSuggestion: 4, failed: { no_answer: 10, limit: 5 } })
        expect(mixed.ok).toBe(false)
        expect(mixed.parts).toEqual([
            { code: 'read', read: 180, total: 211 },
            { code: 'noEdition', count: 12 },
            { code: 'noSuggestion', count: 4 },
            { code: 'failed', count: 15, failures: [{ failure: 'no_answer', count: 10 }, { failure: 'limit', count: 5 }] }
        ])
        expect(sentencesIn(mixed, 'outcome', [])).toEqual([])
    })

    it('a run that did not finish says why, in a code', () => {
        expect(run.valuesOutcome({ ...run.emptyCount(10), done: 10, read: 10, unkept: 3 })).toEqual({ ok: false, parts: [{ code: 'read', read: 10, total: 10 }, { code: 'unkept', count: 3 }] })
        expect(run.valuesOutcome({ ...run.emptyCount(211), done: 1, failed: { token_refused: 1 }, stopped: 'token_refused' }).parts.at(-1)).toEqual({ code: 'stopped', reason: 'token_refused' })
        expect(run.valuesOutcome({ ...run.emptyCount(10), done: 3, read: 3, stopped: 'off' }).parts.at(-1)).toEqual({ code: 'stopped', reason: 'off' })
        expect(run.valuesOutcome({ ...run.emptyCount(10), done: 3, read: 3, stopped: 'something' }).parts.at(-1)).toEqual({ code: 'stopped', reason: 'limit' })
        expect(run.valuesOutcome({ ...run.emptyCount(10), done: 3, read: 3, aborted: true }).parts.at(-1)).toEqual({ code: 'aborted', done: 3, total: 10 })
    })
})

describe('inventoryFromSeries gives parts and codes, not sentences', () => {
    const plan = { toAdd: new Array(7).fill({}), seriesCount: 3, alreadyThere: 2, repeated: 1, incomplete: 1 }

    it('the question before anything is written is a list of parts', () => {
        expect(series.confirmationOf(plan)).toEqual([
            { code: 'willAdd', count: 7, series: 3 }, { code: 'alreadyThere', count: 2 }, { code: 'repeated', count: 1 }, { code: 'incomplete', count: 1 }
        ])
        expect(series.confirmationOf({ ...plan, alreadyThere: 0, repeated: 0, incomplete: 0 })).toEqual([{ code: 'willAdd', count: 7, series: 3 }])
    })

    it('nothing to add, and the button while the albums are written', () => {
        expect(series.nothingToAddOf({ alreadyThere: 4 })).toBe('alreadyThere')
        expect(series.nothingToAddOf({ alreadyThere: 0 })).toBe('noAlbums')
        expect(series.progressOf({ added: 0, total: 12 })).toEqual({ code: 'counting', total: 12 })
        expect(series.progressOf({ added: 5, total: 12 })).toEqual({ code: 'adding', added: 5, total: 12 })
    })

    it('the end is a list of parts', () => {
        expect(series.outcomeOf({ added: 3, total: 3, error: null })).toEqual({ ok: true, parts: [{ code: 'added', count: 3 }] })
        expect(series.outcomeOf({ added: 3, total: 3, error: null, reloaded: false })).toEqual({ ok: true, parts: [{ code: 'added', count: 3 }, { code: 'reload' }] })
        expect(series.outcomeOf({ added: 0, total: 3, error: 'x' })).toEqual({ ok: false, parts: [{ code: 'noneAdded' }] })
        expect(series.outcomeOf({ added: 2, total: 5, error: 'x' })).toEqual({ ok: false, parts: [{ code: 'partlyAdded', added: 2, total: 5 }, { code: 'notAdded', count: 3 }] })
    })
})

describe('inventoryRatings gives parts, not sentences', () => {
    const done = { total: 211, planned: 209, saved: 209, error: null, notFound: 2, withoutRatings: 0, popularityNotConnected: 150, unanswered: 1, covers: 15 }

    it('the end is a list of parts, in the order the person cares', () => {
        expect(ratings.ratingsOutcome(done)).toEqual({
            ok: true,
            parts: [
                { code: 'updated', saved: 209, total: 211 }, { code: 'notFound', count: 2 }, { code: 'popularityNotConnected', count: 150 },
                { code: 'unanswered', count: 1 }, { code: 'covers', count: 15 }
            ]
        })
        expect(ratings.ratingsOutcome({ ...done, saved: 100, error: 'offline' })).toEqual({ ok: false, parts: [{ code: 'partlySaved', saved: 100, planned: 209 }] })
        expect(ratings.ratingsOutcome({ ...done, saved: 0, error: 'offline' })).toEqual({ ok: false, parts: [{ code: 'noneSaved' }] })
        expect(sentencesIn(ratings.ratingsOutcome(done), 'ratings')).toEqual([])
    })
})

describe('the model of the card gives no text for a value with no reading', () => {
    it('the origin of a row with no value is only its kind: the screen says the reason', () => {
        expect(card.originOf({ origin: null, reason: 'waiting' })).toEqual({ kind: 'none' })
    })
})
