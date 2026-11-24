/**
 * F45/F46 (UAT-172, 173, 174) - the rules of the album load's state. Pure: no store, no network, no screen.
 */
import { describe, it, expect } from 'vitest'
import {
    AlbumStatus, EnrichmentStatus, SeriesStatus, FailureReason, HoldReason, holdNotice,
    queryKey, createEntry, isInFlight, isEnriching, deriveSeriesState
} from '../../public/js/models/albumLoadState.js'

const entry = (status, enrichment = {}) => ({
    ...createEntry('s1', { artist: 'A', title: status + Math.random() }),
    status,
    enrichment: { acclaim: 'done', popularity: 'done', userRanking: 'done', ...enrichment }
})

describe('queryKey', () => {
    it('gives the same key for the text and the object form of one query', () => {
        expect(queryKey('Pink Floyd - Animals')).toBe(queryKey({ artist: 'Pink Floyd', title: 'Animals' }))
    })

    it('ignores case and repeated spaces', () => {
        expect(queryKey('  PINK   Floyd - animals ')).toBe('pink floyd - animals')
    })

    it('keeps a title that has " - " inside it whole', () => {
        expect(queryKey({ artist: 'Artist', title: 'Album - Deluxe' })).toBe('artist - album - deluxe')
    })

    it('never throws on an empty query', () => {
        expect(queryKey(null)).toBe('')
        expect(queryKey({})).toBe('-')
    })
})

describe('createEntry', () => {
    it('starts pending, with no album, no error, and every enrichment source pending', () => {
        const fresh = createEntry('series-1', 'Artist - Album')

        expect(fresh.status).toBe(AlbumStatus.PENDING)
        expect(fresh.seriesId).toBe('series-1')
        expect(fresh.album).toBeNull()
        expect(fresh.error).toBeNull()
        expect(fresh.enrichment).toEqual({
            acclaim: EnrichmentStatus.PENDING,
            popularity: EnrichmentStatus.PENDING,
            userRanking: EnrichmentStatus.PENDING
        })
    })
})

describe('deriveSeriesState', () => {
    it('a series that asks for no album is empty', () => {
        expect(deriveSeriesState([]).status).toBe(SeriesStatus.EMPTY)
    })

    it('is loading while any album is pending or being found, even if another failed', () => {
        const state = deriveSeriesState([entry(AlbumStatus.FOUND), entry(AlbumStatus.FAILED), entry(AlbumStatus.FINDING)])

        expect(state.status).toBe(SeriesStatus.LOADING)
        expect(state).toMatchObject({ total: 3, found: 1, failed: 1, inFlight: 1 })
    })

    it('is complete when every album was found', () => {
        expect(deriveSeriesState([entry(AlbumStatus.FOUND), entry(AlbumStatus.FOUND)]).status).toBe(SeriesStatus.COMPLETE)
    })

    it('is failed, never hidden, when nothing is loading and at least one album failed', () => {
        const state = deriveSeriesState([entry(AlbumStatus.FOUND), entry(AlbumStatus.FAILED)])

        expect(state.status).toBe(SeriesStatus.FAILED)
        expect(state.failed).toBe(1)
        expect(state.found).toBe(1)
    })

    it('is failed when every album failed (today such a series disappears)', () => {
        expect(deriveSeriesState([entry(AlbumStatus.FAILED), entry(AlbumStatus.FAILED)]).status).toBe(SeriesStatus.FAILED)
    })

    it('a found album that is still being enriched does not keep the series loading, but is counted', () => {
        const state = deriveSeriesState([entry(AlbumStatus.FOUND, { acclaim: EnrichmentStatus.LOADING })])

        expect(state.status).toBe(SeriesStatus.COMPLETE)
        expect(state.enriching).toBe(1)
    })
})

describe('isInFlight and isEnriching', () => {
    it('pending and finding are in flight; found, failed and cancelled are not', () => {
        expect(isInFlight(entry(AlbumStatus.PENDING))).toBe(true)
        expect(isInFlight(entry(AlbumStatus.FINDING))).toBe(true)
        expect(isInFlight(entry(AlbumStatus.FOUND))).toBe(false)
        expect(isInFlight(entry(AlbumStatus.FAILED))).toBe(false)
        expect(isInFlight(entry(AlbumStatus.CANCELLED))).toBe(false)
    })

    it('"the source has nothing" and "the source failed" both end the enrichment, and stay distinct', () => {
        const empty = entry(AlbumStatus.FOUND, { acclaim: EnrichmentStatus.EMPTY })
        const failed = entry(AlbumStatus.FOUND, { acclaim: EnrichmentStatus.FAILED })

        expect(isEnriching(empty)).toBe(false)
        expect(isEnriching(failed)).toBe(false)
        expect(empty.enrichment.acclaim).not.toBe(failed.enrichment.acclaim)
    })

    it('an album that was not found is not enriching', () => {
        expect(isEnriching(entry(AlbumStatus.FAILED, { acclaim: EnrichmentStatus.PENDING }))).toBe(false)
    })
})

describe('FailureReason', () => {
    it('names not-found, timeout and network apart', () => {
        expect(new Set(Object.values(FailureReason)).size).toBe(3)
    })
})

describe('holdNotice (F52): what the person is told when the server said "sign in" or "wait"', () => {
    // F98 (UAT-308): the model gives the reason, the hour and the kind of notice; the words are said in the language of the app
    // by i18n/holdTexts.js (test/i18n/exportTexts.test.js holds the sentences, the English word for word as the model wrote it).
    it('"sign in" is a warning, with no hour to resume at', () => {
        expect(holdNotice({ reason: HoldReason.UNAUTHORIZED, until: null })).toEqual({ reason: 'unauthorized', until: null, type: 'warning', durationMs: 10000 })
    })

    it('"wait" is information, with the hour it resumes at', () => {
        expect(holdNotice({ reason: HoldReason.RATE_LIMITED, until: 1000 })).toEqual({ reason: 'rate_limited', until: 1000, type: 'info', durationMs: 10000 })
    })

    it('"the ratings source asked to wait" and "Spotify asked to wait" keep their own reason', () => {
        expect(holdNotice({ reason: HoldReason.SOURCE_BUSY, until: 1000 }).reason).toBe('source_busy')
        expect(holdNotice({ reason: HoldReason.SPOTIFY_BUSY, until: 1000 }).reason).toBe('spotify_busy')
    })

    it('a reason it does not know is told as the server asking to wait', () => {
        expect(holdNotice({ reason: 'something-new', until: null }).reason).toBe('rate_limited')
    })

    it('writes no sentence: the model does not speak (F98, REQ-06)', () => {
        for (const reason of Object.values(HoldReason)) {
            const notice = holdNotice({ reason, until: 1000 })
            expect(notice.message).toBeUndefined()
            expect(Object.values(notice).filter(value => typeof value === 'string' && /\s/.test(value))).toEqual([])
        }
    })
})
