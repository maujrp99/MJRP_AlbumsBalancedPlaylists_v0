/**
 * F69 (UAT-206) - what the series facts, the filters and the blend understand of the three
 * outcomes of the popularity: "not connected" and "failed" are never written as "has no data".
 */
import { describe, it, expect } from 'vitest'
import { FACTS_VERSION, factsOfEntry, hasSettledFacts, withSettledFacts } from '../../public/js/models/albumFacts.js'
import { countUnchecked, describeQuery, filterSeries } from '../../public/js/models/seriesFilter.js'
import { SourceGap, readAsk } from '../../public/js/models/albumAsk.js'
import { askNotices } from '../../public/js/i18n/askTexts.js'
import { AlbumStatus, createEntry, queryKey } from '../../public/js/models/albumLoadState.js'
import { hasAnswered, sourceOutcome } from '../../public/js/models/albumSourceAsk.js'

const NOW = 1700000000000
const entryOf = (query, { acclaim = 'done', popularity = 'done', year = 1971 } = {}) => ({
    ...createEntry('s1', query),
    status: AlbumStatus.FOUND,
    album: { artist: 'Yes', title: 'Fragile', year },
    enrichment: { acclaim, popularity, userRanking: 'empty' }
})
const settle = (query, statuses) => {
    const entry = entryOf(query, statuses)
    return withSettledFacts([query], new Map([[entry.key, entry]]), queryKey, NOW)
}
const QUERY = { artist: 'Yes', title: 'Fragile' }

describe('what the answer of a source means for the load (sourceOutcome)', () => {
    it('"not connected" is shown as it is and has no note: nothing is kept for it, and the source is asked again', () => {
        expect(sourceOutcome({ status: 'not-connected' })).toEqual({ status: 'not-connected', note: null })
        expect(hasAnswered('not-connected')).toBe(false)
    })

    it('"Spotify has no such album" is empty with its reason and the rule; data is done', () => {
        expect(sourceOutcome({ status: 'empty', reason: 'not_found', rule: 2 })).toEqual({ status: 'empty', note: { reason: 'not_found', rule: 2 } })
        expect(sourceOutcome({ status: 'done' })).toEqual({ status: 'done', note: { reason: null } })
    })
})

describe('the facts of the series: one answer per source, and only what a source said', () => {
    it('done is "has data", empty is "has none"; the facts carry their version', () => {
        expect(factsOfEntry(entryOf(QUERY, { acclaim: 'done', popularity: 'empty' }), NOW)).toEqual({
            year: 1971, sources: { acclaim: true, popularity: false }, checkedAt: NOW, v: FACTS_VERSION
        })
    })

    it('not connected: the popularity is not written at all; the ratings are', () => {
        const { albumQueries, changed } = settle(QUERY, { popularity: 'not-connected' })

        expect(changed).toBe(true)
        expect(albumQueries[0].facts.sources).toEqual({ acclaim: true })
        expect('popularity' in albumQueries[0].facts.sources).toBe(false)
    })

    it('a failed source is not written either, and does not stop the facts of the other', () => {
        expect(settle(QUERY, { popularity: 'failed' }).albumQueries[0].facts.sources).toEqual({ acclaim: true })
        expect(settle(QUERY, { acclaim: 'failed', popularity: 'empty' }).albumQueries[0].facts.sources).toEqual({ popularity: false })
    })

    it('while a source is still being asked, or when no source said anything, nothing is written', () => {
        expect(hasSettledFacts(entryOf(QUERY, { popularity: 'loading' }))).toBe(false)
        expect(hasSettledFacts(entryOf(QUERY, { acclaim: 'pending' }))).toBe(false)
        expect(settle(QUERY, { acclaim: 'failed', popularity: 'not-connected' })).toEqual({ albumQueries: [QUERY], changed: false })
    })

    it('what a source said before is kept while it cannot be asked: connected yesterday, not connected today', () => {
        const known = { ...QUERY, facts: { year: 1971, sources: { acclaim: true, popularity: true }, checkedAt: 1, v: FACTS_VERSION } }

        expect(settle(known, { popularity: 'not-connected' })).toEqual({ albumQueries: [known], changed: false })

        const none = { ...QUERY, facts: { year: 1971, sources: { acclaim: true, popularity: false }, checkedAt: 1, v: FACTS_VERSION } }
        expect(settle(none, { popularity: 'failed' })).toEqual({ albumQueries: [none], changed: false })
    })

    it('a "popularity: false" written before F69 may be "not connected": it is dropped, once, when the album loads', () => {
        const old = { ...QUERY, facts: { year: 1971, sources: { acclaim: true, popularity: false }, checkedAt: 1 } }

        const { albumQueries, changed } = settle(old, { popularity: 'not-connected' })
        expect(changed).toBe(true)
        expect(albumQueries[0].facts).toEqual({ year: 1971, sources: { acclaim: true }, checkedAt: NOW, v: FACTS_VERSION })

        // and when Spotify really has none, the same "false" comes back with the version
        expect(settle(old, { popularity: 'empty' }).albumQueries[0].facts.sources).toEqual({ acclaim: true, popularity: false })
        // a "true" of before is true: it was written from an album that had its Spotify id
        const oldTrue = { ...QUERY, facts: { year: 1971, sources: { acclaim: true, popularity: true }, checkedAt: 1 } }
        expect(settle(oldTrue, { popularity: 'not-connected' }).albumQueries[0].facts.sources).toEqual({ acclaim: true, popularity: true })
    })
})

describe('the filters read "unknown" as unknown', () => {
    const fact = (sources, v) => ({ artist: 'A', title: 'T', facts: { year: 1971, sources, ...(v ? { v } : {}) } })
    const list = (...queries) => [{ id: 's1', name: 'One', albumQueries: queries }]

    it('an old "popularity: false" is read as not known; a versioned one as "has none"', () => {
        expect(describeQuery(fact({ acclaim: true, popularity: false })).sources).toEqual({ acclaim: true })
        expect(describeQuery(fact({ acclaim: true, popularity: false }, FACTS_VERSION)).sources).toEqual({ acclaim: true, popularity: false })
    })

    it('the popularity filter does not show an album whose popularity is not known, and counts it as not checked', () => {
        const queries = [fact({ acclaim: true }, FACTS_VERSION), fact({ acclaim: true, popularity: true }, FACTS_VERSION), fact({ acclaim: true, popularity: false })]

        expect(filterSeries(list(...queries), { source: 'popularity' })[0].queries).toEqual([queries[1]])
        expect(countUnchecked(list(...queries), 'popularity')).toBe(2)
        expect(countUnchecked(list(...queries), 'acclaim')).toBe(0)
        expect(countUnchecked(list(...queries, 'B - Never loaded'), 'acclaim')).toBe(1)
        expect(countUnchecked(list(...queries, 'B - Never loaded'))).toBe(1)
    })
})

describe('the blend says "Spotify is not connected", never "none at the source"', () => {
    const asked = (...statuses) => [{
        seriesId: 's1',
        entries: statuses.map((popularity, index) => ({
            ...entryOf(`Yes - Album ${index}`, { popularity }),
            album: { artist: 'Yes', title: `Album ${index}` }
        }))
    }]

    it('a named source that is not connected is a gap of its own, and the ask does not wait for it', () => {
        const { settled, result } = readAsk(asked('not-connected', 'done'), ['popularity'])

        expect(settled).toBe(true)
        expect(result.albums).toHaveLength(2)
        expect(result.missingSources).toEqual([{ source: 'popularity', seriesId: 's1', key: 'yes - album 0', label: 'Yes - Album 0', gap: SourceGap.NOT_CONNECTED }])
    })

    it('the notice tells the three gaps apart', () => {
        const { result } = readAsk(asked('not-connected', 'not-connected', 'empty', 'failed', 'done'), ['popularity'])

        expect(askNotices(result)).toEqual([
            'Spotify popularity is missing for 4 of 5 albums (1 did not answer, 1 has none at the source, 2 because Spotify is not connected): Yes - Album 0, Yes - Album 1, Yes - Album 2 and 1 more.'
        ])
    })

    it('when it is the only reason, the line says just that', () => {
        const { result } = readAsk(asked('not-connected'), ['popularity'])

        expect(askNotices(result, { popularity: 'by their album order' })).toEqual([
            'Spotify popularity is missing for 1 of 1 album (1 because Spotify is not connected): Yes - Album 0. Its tracks were ordered by their album order instead.'
        ])
    })
})
