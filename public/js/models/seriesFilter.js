/**
 * seriesFilter
 *
 * The filters of the albums screen, as pure functions over the series and their album queries
 * (arch.md, "Carga da tela de álbuns", seção 16; DP-20). They read what is written in the series,
 * never what happens to be loaded, so they answer the same on any page.
 *
 * A query is "Artist - Title" or { artist, title, year, facts: { year, sources: { acclaim, popularity } } }.
 */

import { parseAlbumQuery } from './albumQuery.js'
import { queryKey } from './albumLoadState.js'
import { knownSources } from './albumFacts.js'

export const ALL = 'all'

const isSet = (value) => value !== undefined && value !== null && value !== '' && value !== ALL

/** The decade bucket of the year filter: '1960s' … '1990s', and '2000s' for 2000 onwards. */
export function decadeOf(year) {
    const number = Number(year)
    if (!Number.isFinite(number) || number < 1960) return null
    if (number >= 2000) return '2000s'
    return `${Math.floor(number / 10) * 10}s`
}

/**
 * What the filters know about one query, read from the query itself.
 * `sources` has only what is known of each source (models/albumFacts.js, knownSources).
 * @returns {{ key: string, artist: string, title: string, year: number|null, sources: Object, checked: boolean }}
 */
export function describeQuery(query) {
    const { artist, title } = parseAlbumQuery(query)
    const facts = (typeof query === 'object' && query !== null && query.facts) || null
    const year = Number(facts?.year ?? (typeof query === 'object' && query !== null ? query.year : null))
    return {
        key: queryKey(query),
        artist,
        title,
        year: Number.isFinite(year) && year > 0 ? year : null,
        sources: knownSources(facts),
        checked: !!facts
    }
}

/** True when some filter narrows the list. */
export function isFiltering(criteria = {}) {
    return isSet(criteria.search) || isSet(criteria.artist) || isSet(criteria.year) || isSet(criteria.source)
}

function matches(described, seriesName, criteria, ownRankedKeys) {
    if (isSet(criteria.artist) && described.artist !== criteria.artist) return false
    if (isSet(criteria.year) && decadeOf(described.year) !== criteria.year) return false

    if (isSet(criteria.source)) {
        if (criteria.source === 'user') {
            if (!ownRankedKeys.has(described.key)) return false
        } else if (criteria.source === 'pending') {
            if (Object.values(described.sources).some(Boolean)) return false
        } else if (!described.sources[criteria.source]) {
            return false
        }
    }

    if (isSet(criteria.search)) {
        const needle = String(criteria.search).toLowerCase().trim()
        const haystack = `${described.artist} ${described.title} ${seriesName || ''}`.toLowerCase()
        if (!haystack.includes(needle)) return false
    }
    return true
}

/**
 * Filter the series and, inside each, its queries.
 * With no filter set, every series comes back, an empty one included.
 * With a filter set, only the series that keep at least one query.
 *
 * @param {Array<{ id, name, albumQueries }>} seriesList
 * @param {Object} criteria - { seriesId, artist, year, source, search }
 * @param {Object} [options]
 * @param {Set<string>} [options.ownRankedKeys] - keys of the queries the person has ranked ('My Ranking')
 * @returns {Array<{ series: Object, queries: Array, keys: Set<string> }>}
 */
export function filterSeries(seriesList = [], criteria = {}, { ownRankedKeys = new Set() } = {}) {
    const filtering = isFiltering(criteria)
    const result = []

    seriesList.forEach(series => {
        if (isSet(criteria.seriesId) && series.id !== criteria.seriesId) return

        const queries = (series.albumQueries || []).filter(query =>
            matches(describeQuery(query), series.name, criteria, ownRankedKeys))

        if (filtering && queries.length === 0) return
        result.push({ series, queries, keys: new Set(queries.map(queryKey)) })
    })
    return result
}

/** Every artist named in the queries of the series given, sorted, each once. */
export function listArtists(seriesList = []) {
    const artists = new Set()
    seriesList.forEach(series => (series.albumQueries || []).forEach(query => {
        const { artist } = parseAlbumQuery(query)
        if (artist) artists.add(artist)
    }))
    return [...artists].sort((a, b) => a.localeCompare(b))
}

/** The source filters that read `facts`: the others (all, 'My Ranking') do not depend on a first load. */
const FACT_FILTERS = Object.freeze(['pending', 'acclaim', 'popularity'])

/** True when this value of the source filter is answered from the facts written in the series. */
export function readsFacts(source) {
    return FACT_FILTERS.includes(source)
}

/** The source filters that are one source: for them, "checked" is "that source answered". */
const ONE_SOURCE_FILTERS = Object.freeze(['acclaim', 'popularity'])

/**
 * How many queries of the series given the filter cannot answer for: never checked against the
 * sources or, for the filter of one source, with nothing known of that source (it failed, or the
 * person was not connected to it when the album loaded).
 * @param {Array} seriesList
 * @param {string} [source] - the value of the source filter in use
 */
export function countUnchecked(seriesList = [], source = null) {
    const answered = ONE_SOURCE_FILTERS.includes(source)
        ? (described) => typeof described.sources[source] === 'boolean'
        : () => true
    let count = 0
    seriesList.forEach(series => (series.albumQueries || []).forEach(query => {
        const described = describeQuery(query)
        if (!described.checked || !answered(described)) count++
    }))
    return count
}
