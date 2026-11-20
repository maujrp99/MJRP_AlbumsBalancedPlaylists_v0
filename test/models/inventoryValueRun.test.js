/**
 * F75 (REQ-09, REQ-11, REQ-13) - "Update values" as pure rules (which items a run reads, what an
 * answer of the server is worth, what the person is told), and the links of "Where to buy".
 */
import { describe, it, expect } from 'vitest'
import {
    itemsToRead, askOfItem, readOutcomeOf, editionToKeep, editionOf, emptyCount, countAfter, valuesProgressText, readingNotice,
    waitingNotice, valuesOutcome, readFailedText, LONGEST_WAIT_MS, DEFAULT_WAIT_MS
} from '../../public/js/models/inventoryValueRun.js'
import { buyLinksOf, BUY_LINKS_NOTE, SELL_TRADE_SOON } from '../../public/js/models/buyLinks.js'

const NOW = Date.parse('2026-11-20T12:00:00Z')
const AT = '2026-11-20T12:00:00.000Z'
const RELEASE = { id: 5012948, title: 'Harvest 1984, Europe', url: 'https://www.discogs.com/release/5012948' }
const FOUND = { kind: 'found', data: { release: RELEASE, conditions: { mint: 15, nearMint: 12, veryGoodPlus: 9 }, currency: 'USD', readAt: '2026-11-20T11:59:00.000Z' } }
const failed = (code, hold = null) => ({ kind: 'failed', code, retryable: false, status: 500, hold })

describe('which items a run reads', () => {
    it('the ones with no value written by the person and no fresh reading', () => {
        const items = [{ id: 'written', value: { amount: 9, currency: 'USD' } }, { id: 'fresh' }, { id: 'stale' }, { id: 'never' }]
        const readings = new Map([
            ['fresh', { kind: 'found', readAt: new Date(NOW - 1000).toISOString() }],
            ['stale', { kind: 'found', readAt: new Date(NOW - 7 * 60 * 60 * 1000).toISOString() }]
        ])

        expect(itemsToRead(items, readings, NOW).map(item => item.id)).toEqual(['stale', 'never'])
    })

    it('the server is asked by artist and title, with the year and the edition when the item has them', () => {
        expect(askOfItem({ artist: 'Pink Floyd', title: 'Animals', year: 1977 })).toEqual({ artist: 'Pink Floyd', title: 'Animals', year: 1977 })
        expect(askOfItem({ albumData: { artist: 'Yes', title: 'Fragile', year: '1971' } })).toEqual({ artist: 'Yes', title: 'Fragile', year: '1971' })
        expect(askOfItem({ artist: 'Yes', title: 'Fragile', discogs: { releaseId: 77 } })).toEqual({ artist: 'Yes', title: 'Fragile', releaseId: 77 })
        expect(askOfItem({})).toEqual({ artist: '', title: '' })
    })
})

describe('what an answer of the server is worth', () => {
    it('found, no CD edition and no price suggested are readings the browser keeps', () => {
        expect(readOutcomeOf(FOUND, AT)).toEqual({ reading: { kind: 'found', release: RELEASE, conditions: FOUND.data.conditions, currency: 'USD', readAt: '2026-11-20T11:59:00.000Z' } })
        expect(readOutcomeOf({ kind: 'not_found', data: null }, AT).reading).toEqual({ kind: 'not_found', release: null, conditions: null, currency: null, readAt: AT })
        expect(readOutcomeOf({ kind: 'no_value', data: { release: RELEASE } }, AT).reading).toMatchObject({ kind: 'no_value', release: RELEASE, readAt: AT })
    })

    it('the source turned off is not a failure of the album: it ends the run', () => {
        expect(readOutcomeOf({ kind: 'not_configured', data: null }, AT)).toEqual({ off: true })
    })

    it('each failure has its name; the token refused and "sign in" stop the run, the others do not', () => {
        expect(readOutcomeOf(failed('upstream_unauthorized'), AT)).toEqual({ failure: 'token_refused', waitMs: null, stops: true })
        expect(readOutcomeOf(failed('unauthorized'), AT)).toEqual({ failure: 'sign_in', waitMs: null, stops: true })
        expect(readOutcomeOf(failed('upstream_failed'), AT)).toEqual({ failure: 'no_answer', waitMs: null, stops: false })
        expect(readOutcomeOf(failed('upstream_timeout'), AT)).toMatchObject({ failure: 'no_answer', stops: false })
        expect(readOutcomeOf(failed('no_answer'), AT)).toMatchObject({ failure: 'no_answer', stops: false })
        expect(readOutcomeOf(failed('internal'), AT)).toMatchObject({ failure: 'other', stops: false })
        expect(readOutcomeOf({ kind: 'legacy', body: {} }, AT)).toMatchObject({ failure: 'other', stops: false })
    })

    it('the limit says how long to wait; a wait too long stops the run', () => {
        expect(readOutcomeOf(failed('upstream_busy', { reason: 'source_busy', retryAfterMs: 40000 }), AT)).toEqual({ failure: 'limit', waitMs: 40000, stops: false })
        expect(readOutcomeOf(failed('upstream_busy'), AT)).toEqual({ failure: 'limit', waitMs: DEFAULT_WAIT_MS, stops: false })
        expect(readOutcomeOf(failed('rate_limited', { reason: 'rate_limited', retryAfterMs: LONGEST_WAIT_MS + 1 }), AT)).toMatchObject({ failure: 'limit', stops: true })
    })

    it('the edition is kept in the item when it is new; a re-read with no title keeps the title the item has', () => {
        const reading = { kind: 'found', release: RELEASE }
        expect(editionToKeep({ id: 'a' }, reading)).toEqual({ releaseId: 5012948, title: 'Harvest 1984, Europe', url: RELEASE.url })
        expect(editionToKeep({ id: 'a', discogs: { releaseId: 5012948 } }, reading)).toBe(null)
        expect(editionToKeep({ id: 'a' }, { kind: 'not_found', release: null })).toBe(null)
        const kept = { discogs: { releaseId: 5012948, title: 'Harvest 1984, Europe', url: RELEASE.url } }
        expect(editionOf(kept, { id: 5012948, title: null, url: RELEASE.url })).toEqual(RELEASE)
        expect(editionOf({}, { id: 9, title: null, url: null })).toEqual({ id: 9, title: null, url: null })
        expect(editionOf({}, null)).toBe(null)
    })
})

describe('what the person is told', () => {
    it('the button and the notice of a run under way', () => {
        expect(valuesProgressText({ done: 86, total: 211 })).toBe('Reading values… 86 of 211')
        expect(readingNotice({ done: 86, total: 211 })).toEqual({
            strong: 'Reading values… 86 of 211.',
            rest: 'You can keep using the inventory. This takes about 13 minutes for 211 albums.',
            action: 'Stop'
        })
    })

    it('the notice of the albums that wait: nothing is read until the person asks', () => {
        expect(waitingNotice(2)).toEqual({ strong: '2 albums are waiting for a value.', rest: 'Reading them takes about a minute.', action: 'Read them now' })
        expect(waitingNotice(1)).toEqual({ strong: '1 album is waiting for a value.', rest: 'Reading it takes about a minute.', action: 'Read it now' })
    })

    it('the count of a run, album by album', () => {
        let count = emptyCount(4)
        count = countAfter(count, { reading: { kind: 'found' } })
        count = countAfter(count, { reading: { kind: 'not_found' } })
        count = countAfter(count, { reading: { kind: 'no_value' } })
        count = countAfter(count, { failure: 'no_answer' })

        expect(count).toEqual({ total: 4, done: 4, read: 1, noEdition: 1, noSuggestion: 1, failed: { no_answer: 1 }, stopped: null, aborted: false })
    })

    it('the end says the truth: how many were read, how many have no CD edition, how many failed and why', () => {
        const all = valuesOutcome({ ...emptyCount(211), done: 211, read: 211 })
        expect(all).toEqual({ ok: true, text: 'Values read for 211 of 211 albums.' })

        const mixed = valuesOutcome({ ...emptyCount(211), done: 211, read: 180, noEdition: 12, noSuggestion: 4, failed: { no_answer: 10, limit: 5 } })
        expect(mixed.ok).toBe(false)
        expect(mixed.text).toBe('Values read for 180 of 211 albums. 12 albums have no CD edition on Discogs. Discogs suggests no price for 4 albums. 15 albums could not be read: Discogs did not answer (10), Discogs limit reached (5).')
    })

    it('a run that stopped says why', () => {
        const refused = valuesOutcome({ ...emptyCount(211), done: 1, failed: { token_refused: 1 }, stopped: 'token_refused' })
        expect(refused.ok).toBe(false)
        expect(refused.text).toContain('Discogs refused the token of the app, so the reading stopped.')
        expect(valuesOutcome({ ...emptyCount(10), done: 3, read: 3, stopped: 'off' }).text).toContain('Discogs values were turned off on the server')
        expect(valuesOutcome({ ...emptyCount(10), done: 3, read: 3, aborted: true })).toEqual({ ok: true, text: 'Values read for 3 of 10 albums. Stopped by you after 3 of 10.' })
    })

    it('one album read from its window that failed', () => {
        expect(readFailedText('limit')).toBe('Discogs limit reached. The value was not read.')
    })
})

describe('where to buy (REQ-11)', () => {
    it('three stores, each on a search for the artist, the title and CD; iMusic is the Brazilian one', () => {
        const links = buyLinksOf({ artist: 'Joni Mitchell', title: 'Hejira' })

        expect(links.map(link => link.name)).toEqual(['Discogs', 'Amazon', 'iMusic'])
        expect(links.map(link => link.url)).toEqual([
            'https://www.discogs.com/search/?q=Joni+Mitchell+Hejira&format_exact=CD&type=release',
            'https://www.amazon.com/s?k=Joni+Mitchell+Hejira+CD',
            'https://imusic.br.com/search?query=Joni+Mitchell+Hejira+CD'
        ])
    })

    it('what is written in a name cannot change the address', () => {
        const [discogs, amazon] = buyLinksOf({ artist: 'AC/DC', title: 'Back in Black & "more"?x=1#y' })

        expect(new URL(discogs.url).searchParams.get('q')).toBe('AC/DC Back in Black & "more"?x=1#y')
        expect(new URL(amazon.url).searchParams.get('k')).toBe('AC/DC Back in Black & "more"?x=1#y CD')
        expect([...new URL(amazon.url).searchParams.keys()]).toEqual(['k'])
    })

    it('no address carries an affiliate tag today, and an album with no names has no links', () => {
        buyLinksOf({ artist: 'Yes', title: 'Fragile' }).forEach(({ url }) => expect(url).not.toMatch(/tag=|affiliate|partner|ref=/i))
        expect(buyLinksOf({})).toEqual([])
        expect(buyLinksOf(null)).toEqual([])
    })

    it('the fixed sentences', () => {
        expect(BUY_LINKS_NOTE).toBe('Each link opens the store on this album, on CD. The app earns nothing from these links today.')
        expect(SELL_TRADE_SOON).toBe('Selling and trading between collectors: not in the app yet')
    })
})
