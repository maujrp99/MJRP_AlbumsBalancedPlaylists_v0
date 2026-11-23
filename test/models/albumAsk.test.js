/**
 * F56 (UAT-189) - what an asker of albums gets back, as pure rules: when the ask is settled, which
 * albums are ready, which failed and why, which sources are missing, and what to tell the person (as data).
 */
import { describe, it, expect } from 'vitest'
import { readAsk, holdWait, askNoticeParts, noAlbumsPart, askProgressPart, AskFailure, SourceGap } from '../../public/js/models/albumAsk.js'
import { createEntry, reconcileEntry, AlbumStatus, EnrichmentStatus, FailureReason } from '../../public/js/models/albumLoadState.js'

const found = (title, enrichment = {}) => ({
    ...createEntry('s1', `Artist - ${title}`),
    status: AlbumStatus.FOUND,
    album: { id: title, artist: 'Artist', title },
    enrichment: { acclaim: 'done', popularity: 'done', userRanking: 'empty', ...enrichment }
})
const failed = (title, reason = FailureReason.NOT_FOUND) => ({
    ...createEntry('s1', `Artist - ${title}`),
    status: AlbumStatus.FAILED,
    error: { reason, message: `no ${title}` }
})
const pending = (title) => createEntry('s1', `Artist - ${title}`)
const ask = (entries, sources = [], flags = {}) => readAsk([{ seriesId: 's1', entries }], sources, flags)

describe('holdWait: how long an ask has been under a hold of the server (F58)', () => {
    const LIMIT = 45000

    it('with no hold there is nothing to count, and no reason to look again', () => {
        expect(holdWait(null, null, 1000, LIMIT)).toEqual({ heldSince: null, heldTooLong: false, lookAgainInMs: null })
    })

    it('the hold that ended is forgotten: the next one counts from its own start', () => {
        expect(holdWait(500, null, 1000, LIMIT).heldSince).toBeNull()
    })

    it('the first time the ask sees a hold it starts counting, and looks again when a search would have ended', () => {
        const hold = { reason: 'unauthorized', until: null }

        expect(holdWait(null, hold, 1000, LIMIT)).toEqual({ heldSince: 1000, heldTooLong: false, lookAgainInMs: 45000 })
    })

    it('while the hold goes on it keeps counting from the first time, whatever the hold became', () => {
        const stretched = { reason: 'rate_limited', until: 99000 }

        expect(holdWait(1000, stretched, 31000, LIMIT)).toEqual({ heldSince: 1000, heldTooLong: false, lookAgainInMs: 15000 })
    })

    it('held for as long as a search may take is too long, and there is nothing more to wait for', () => {
        const hold = { reason: 'unauthorized', until: null }

        expect(holdWait(1000, hold, 46000, LIMIT)).toEqual({ heldSince: 1000, heldTooLong: true, lookAgainInMs: null })
        expect(holdWait(1000, hold, 90000, LIMIT).heldTooLong).toBe(true)
    })
})

describe('readAsk', () => {
    it('is settled when every album was found or failed, and gives the found ones in the order asked', () => {
        const reading = ask([found('One'), failed('Two'), found('Three')])

        expect(reading.settled).toBe(true)
        expect(reading.result.albums.map(a => a.title)).toEqual(['One', 'Three'])
        expect(reading.result.bySeries).toEqual({ s1: reading.result.albums })
        expect(reading.result.total).toBe(3)
        expect(reading.result.aborted).toBe(false)
        expect(reading.result.failed).toEqual([
            { seriesId: 's1', key: 'artist - two', label: 'Artist - Two', reason: FailureReason.NOT_FOUND, message: 'no Two' }
        ])
    })

    it('waits while an album is pending or being found', () => {
        const finding = { ...pending('Two'), status: AlbumStatus.FINDING }

        expect(ask([found('One'), pending('Two')]).settled).toBe(false)
        expect(ask([found('One'), finding]).settled).toBe(false)
        expect(ask([found('One'), finding]).progress).toEqual({ total: 2, found: 1, failed: 0, waitingSources: 0 })
    })

    it('does not wait for a source the asker did not name', () => {
        const reading = ask([found('One', { acclaim: EnrichmentStatus.LOADING })], ['popularity'])

        expect(reading.settled).toBe(true)
        expect(reading.result.missingSources).toEqual([])
    })

    it('waits for the sources the asker named', () => {
        const reading = ask([found('One', { acclaim: EnrichmentStatus.LOADING }), found('Two', { acclaim: EnrichmentStatus.PENDING })], ['acclaim'])

        expect(reading.settled).toBe(false)
        expect(reading.progress.waitingSources).toBe(2)
    })

    it('a named source that failed or has nothing does not hold the ask: the album is ready and the gap is told', () => {
        const reading = ask([
            found('One', { acclaim: EnrichmentStatus.FAILED }),
            found('Two', { acclaim: EnrichmentStatus.EMPTY }),
            found('Three')
        ], ['acclaim'])

        expect(reading.settled).toBe(true)
        expect(reading.result.albums).toHaveLength(3)
        expect(reading.result.missingSources).toEqual([
            { source: 'acclaim', seriesId: 's1', key: 'artist - one', label: 'Artist - One', gap: SourceGap.FAILED },
            { source: 'acclaim', seriesId: 's1', key: 'artist - two', label: 'Artist - Two', gap: SourceGap.EMPTY }
        ])
    })

    it('while the server holds the load, a named source that has not answered is not waited for', () => {
        const reading = ask([found('One', { acclaim: EnrichmentStatus.LOADING })], ['acclaim'], { onHold: true })

        expect(reading.settled).toBe(true)
        expect(reading.result.missingSources[0].gap).toBe(SourceGap.WAITING)
    })

    it('an album still not found when the hold has lasted too long is a failure with its own reason', () => {
        expect(ask([pending('One')], [], { onHold: true }).settled).toBe(false)

        const reading = ask([pending('One')], [], { onHold: true, heldTooLong: true })
        expect(reading.settled).toBe(true)
        expect(reading.result.failed[0].reason).toBe(AskFailure.ON_HOLD)
    })

    it('a cancelled album is waited for (it is asked again), and a series with no album is settled and empty', () => {
        expect(ask([{ ...pending('One'), status: AlbumStatus.CANCELLED }]).settled).toBe(false)

        const empty = ask([])
        expect(empty.settled).toBe(true)
        expect(empty.result.albums).toEqual([])
    })

    it('keeps the series apart and in the order asked', () => {
        const reading = readAsk([
            { seriesId: 's2', entries: [found('Two')] },
            { seriesId: 's1', entries: [found('One')] }
        ], [])

        expect(reading.result.albums.map(a => a.title)).toEqual(['Two', 'One'])
        expect(Object.keys(reading.result.bySeries)).toEqual(['s2', 's1'])
    })

    it('an ask that was dropped says so in its result', () => {
        expect(ask([found('One'), pending('Two')], [], { aborted: true }).result.aborted).toBe(true)
    })
})

describe('what the person is told, as data (the words are i18n/askTexts.js, test/i18n/askTexts.test.js)', () => {
    it('says nothing when every album is ready with its sources', () => {
        expect(askNoticeParts(ask([found('One')], ['acclaim']).result)).toEqual([])
    })

    it('gives how many albums failed, which, and the reason of each (a code, not a sentence)', () => {
        const result = ask([found('One'), failed('Two'), failed('Three', FailureReason.TIMEOUT)]).result

        expect(askNoticeParts(result)).toEqual([{
            code: 'failed', count: 2, total: 3,
            names: { shown: [{ label: 'Artist - Two', reason: 'not-found' }, { label: 'Artist - Three', reason: 'timeout' }], more: 0 }
        }])
    })

    it('names at most three albums and counts the rest', () => {
        const result = ask([failed('A'), failed('B'), failed('C'), failed('D'), failed('E')]).result

        expect(askNoticeParts(result)[0].names.shown).toHaveLength(3)
        expect(askNoticeParts(result)[0].names.more).toBe(2)
    })

    it('gives which source is missing, for how many albums, and the gaps by kind', () => {
        const result = ask([
            found('One', { acclaim: EnrichmentStatus.FAILED, popularity: EnrichmentStatus.EMPTY }),
            found('Two', { acclaim: EnrichmentStatus.EMPTY }),
            found('Three')
        ], ['acclaim', 'popularity']).result

        expect(askNoticeParts(result)).toEqual([
            { code: 'source', source: 'acclaim', ready: 3, count: 2, names: { shown: [{ label: 'Artist - One' }, { label: 'Artist - Two' }], more: 0 }, gaps: [{ gap: 'failed', count: 1 }, { gap: 'empty', count: 1 }], fallback: null },
            { code: 'source', source: 'popularity', ready: 3, count: 1, names: { shown: [{ label: 'Artist - One' }], more: 0 }, gaps: [{ gap: 'empty', count: 1 }], fallback: null }
        ])
    })

    it('carries the way a recipe orders the tracks without the missing source', () => {
        const result = ask([found('One', { popularity: EnrichmentStatus.NOT_CONNECTED })], ['popularity']).result

        expect(askNoticeParts(result, { popularity: 'by album order' })[0].fallback).toBe('by album order')
    })

    it('says an ask with no album at all is empty, or none could be loaded and why', () => {
        expect(noAlbumsPart(ask([]).result)).toEqual({ code: 'empty' })
        expect(noAlbumsPart(ask([failed('One'), failed('Two', FailureReason.NETWORK)]).result)).toEqual({
            code: 'none', total: 2, names: { shown: [{ label: 'Artist - One', reason: 'not-found' }, { label: 'Artist - Two', reason: 'network' }], more: 0 }
        })
    })

    it('the progress counts what is ready, then what it still waits for', () => {
        expect(askProgressPart({ total: 4, found: 1, failed: 1, waitingSources: 0 })).toEqual({ code: 'loading', settled: 2, total: 4 })
        expect(askProgressPart({ total: 4, found: 4, failed: 0, waitingSources: 3 })).toEqual({ code: 'waiting', waiting: 3, total: 4 })
    })
})

describe('reconcileEntry: what stays when a series is asked for again', () => {
    const loaded = {
        ...createEntry('s1', { artist: 'A', title: 'One', appleMusicId: '111' }),
        status: AlbumStatus.FOUND,
        album: { title: 'One', metadata: { sourceId: '111' } }
    }

    it('a new query gets a new entry', () => {
        expect(reconcileEntry(undefined, 's1', 'A - One').status).toBe(AlbumStatus.PENDING)
        expect(reconcileEntry(undefined, 's1', 'A - One').fresh).toBeUndefined()
    })

    it('the same query keeps its entry, whatever else the series wrote into the query', () => {
        expect(reconcileEntry(loaded, 's1', { artist: 'A', title: 'One', appleMusicId: '111', year: 1999 })).toBe(loaded)
        expect(reconcileEntry(loaded, 's1', 'A - One')).toBe(loaded)
    })

    it('another edition of the same title is a new entry that does not read what is kept', () => {
        const next = reconcileEntry(loaded, 's1', { artist: 'A', title: 'One', appleMusicId: '222' })

        expect(next).not.toBe(loaded)
        expect(next.status).toBe(AlbumStatus.PENDING)
        expect(next.fresh).toBe(true)
        expect(next.query.appleMusicId).toBe('222')
    })

    it('the id the load itself corrected in the series (F55) is the same edition: nothing is loaded again', () => {
        const corrected = { ...loaded, album: { title: 'One', metadata: { sourceId: '999' } } }

        expect(reconcileEntry(corrected, 's1', { artist: 'A', title: 'One', appleMusicId: '999' })).toBe(corrected)
    })
})
