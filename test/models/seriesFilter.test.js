/**
 * F51 (UAT-179) - the filters of the albums screen read the series, not what is loaded.
 */
import { describe, it, expect } from 'vitest'
import { filterSeries, listArtists, decadeOf, describeQuery, isFiltering, countUnchecked } from '../../public/js/models/seriesFilter.js'
import { queryKey } from '../../public/js/models/albumLoadState.js'

const q = (artist, title, year, sources) => ({ artist, title, year, ...(sources ? { facts: { year, sources } } : {}) })
const SERIES = [
    { id: 's1', name: 'Robert Plant 80-90s', albumQueries: [q('Robert Plant', 'Now and Zen', 1988, { acclaim: true }), q('Robert Plant', 'Fate of Nations', 1993, { acclaim: true, popularity: true })] },
    { id: 's2', name: 'Prog Classics', albumQueries: [q('Yes', 'Fragile', 1971, { acclaim: true }), 'Genesis - Foxtrot', q('Jethro Tull', 'Aqualung', 1971, {})] },
    { id: 's3', name: 'Empty one', albumQueries: [] }
]
const names = (result) => result.map(r => r.series.name)
const titles = (result) => result.flatMap(r => r.queries.map(x => describeQuery(x).title))

describe('filterSeries', () => {
    it('with no filter, gives every series back, the empty one included', () => {
        expect(names(filterSeries(SERIES, {}))).toEqual(['Robert Plant 80-90s', 'Prog Classics', 'Empty one'])
        expect(isFiltering({ artist: 'all', year: '', source: 'all', search: '' })).toBe(false)
    })

    it('by artist: only the series that have that artist, and only their albums of that artist', () => {
        const result = filterSeries(SERIES, { artist: 'Yes' })

        expect(names(result)).toEqual(['Prog Classics'])
        expect(titles(result)).toEqual(['Fragile'])
    })

    it('by decade, reading the year written in the query', () => {
        expect(titles(filterSeries(SERIES, { year: '1970s' }))).toEqual(['Fragile', 'Aqualung'])
        expect(titles(filterSeries(SERIES, { year: '1990s' }))).toEqual(['Fate of Nations'])
    })

    it('by source, reading the facts written in the query', () => {
        expect(titles(filterSeries(SERIES, { source: 'popularity' }))).toEqual(['Fate of Nations'])
        expect(titles(filterSeries(SERIES, { source: 'acclaim' }))).toEqual(['Now and Zen', 'Fate of Nations', 'Fragile'])
    })

    it('"pending" is the query with no source found yet, checked or not', () => {
        expect(titles(filterSeries(SERIES, { source: 'pending' }))).toEqual(['Foxtrot', 'Aqualung'])
    })

    it('"my ranking" uses the keys of the albums the person has ranked', () => {
        const ownRankedKeys = new Set([queryKey(SERIES[0].albumQueries[0])])

        expect(titles(filterSeries(SERIES, { source: 'user' }, { ownRankedKeys }))).toEqual(['Now and Zen'])
    })

    it('the search looks at the album, the artist and the name of the series, whatever the case', () => {
        expect(titles(filterSeries(SERIES, { search: 'foxtrot' }))).toEqual(['Foxtrot'])
        expect(titles(filterSeries(SERIES, { search: 'PLANT' }))).toEqual(['Now and Zen', 'Fate of Nations'])
        expect(names(filterSeries(SERIES, { search: 'prog' }))).toEqual(['Prog Classics'])
    })

    it('filters add up', () => {
        expect(titles(filterSeries(SERIES, { year: '1970s', source: 'acclaim' }))).toEqual(['Fragile'])
        expect(filterSeries(SERIES, { artist: 'Yes', year: '1990s' })).toEqual([])
    })

    it('one series only, when a series is chosen', () => {
        expect(names(filterSeries(SERIES, { seriesId: 's2' }))).toEqual(['Prog Classics'])
    })

    it('gives the keys of the queries that passed, to pick the loaded albums by', () => {
        const [only] = filterSeries(SERIES, { artist: 'Yes' })

        expect([...only.keys]).toEqual(['yes - fragile'])
    })
})

describe('listArtists', () => {
    it('lists every artist of every series, from the queries, sorted and once each', () => {
        expect(listArtists(SERIES)).toEqual(['Genesis', 'Jethro Tull', 'Robert Plant', 'Yes'])
    })
})

describe('decadeOf and describeQuery', () => {
    it('buckets the year the way the year filter names it', () => {
        expect(decadeOf(1969)).toBe('1960s')
        expect(decadeOf('1988')).toBe('1980s')
        expect(decadeOf(2011)).toBe('2000s')
        expect(decadeOf(1955)).toBeNull()
        expect(decadeOf(undefined)).toBeNull()
    })

    it('reads a text query, which has no year and was never checked', () => {
        expect(describeQuery('Genesis - Foxtrot')).toMatchObject({ artist: 'Genesis', title: 'Foxtrot', year: null, checked: false })
    })

    it('counts the queries never checked against the sources', () => {
        expect(countUnchecked(SERIES)).toBe(1)
    })
})
