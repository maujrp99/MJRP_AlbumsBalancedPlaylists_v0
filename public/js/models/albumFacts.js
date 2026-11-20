/**
 * albumFacts
 *
 * What the filters need to know about an album, kept inside the album query of the series
 * (arch.md, seção 16): its year and which sources have data for it. Pure functions.
 * `sources` has one key per source that ANSWERED: true (it has data) or false (it has none). A
 * source that was not asked or did not answer has no key: unknown is not "has none" (F69).
 * The loaded album is the authority; the facts are a copy, rewritten when the album is loaded.
 *
 * The same pass over the queries also corrects the Apple Music id a query stores, when the album
 * asked for was found under another id (F55): withCorrectedSources.
 */

import { parseAlbumQuery, withCorrectedSource } from './albumQuery.js'
import { AlbumStatus, EnrichmentStatus } from './albumLoadState.js'

/** The sources whose facts are kept. The person's own ranking is not: it lives with the user. */
const FACT_SOURCES = Object.freeze(['acclaim', 'popularity'])

/**
 * The version of the facts. 2 (F69): one answer per source and only what the source SAID; a
 * source that failed or that the person is not connected to has no fact. Facts with no version
 * are of before, when "not connected to Spotify" and "the call failed" were written as
 * `popularity: false` (UAT-206).
 */
export const FACTS_VERSION = 2
/** The sources whose `false` of before FACTS_VERSION may be a failure or "not connected". */
const FALSE_WAS_NOT_SURE = new Set(['popularity'])

/** What a source said about the album: it has data, it has none. Any other state says nothing. */
const SAID = new Map([[EnrichmentStatus.DONE, true], [EnrichmentStatus.EMPTY, false]])
const STILL_ASKED = new Set([EnrichmentStatus.PENDING, EnrichmentStatus.LOADING])

/**
 * What the written facts say of each source, leaving out what cannot be believed: a source with
 * no answer, and a "has none" that was written when it could also mean "could not be asked".
 * @param {Object|null} facts - the `facts` of a query
 * @returns {Object<string, boolean>} only the sources that are known
 */
export function knownSources(facts) {
    const known = {}
    FACT_SOURCES.forEach(source => {
        const value = facts?.sources?.[source]
        if (typeof value !== 'boolean') return
        if (!value && FALSE_WAS_NOT_SURE.has(source) && facts.v !== FACTS_VERSION) return
        known[source] = value
    })
    return known
}

/** True when the album is on screen and no fact source of this entry is still being asked. */
export function hasSettledFacts(entry) {
    return entry.status === AlbumStatus.FOUND && !!entry.album &&
        FACT_SOURCES.every(source => !STILL_ASKED.has(entry.enrichment[source]))
}

/**
 * The facts of a loaded entry. A source that answered writes its answer; one that did not (it
 * failed, or the person is not connected to it) keeps what the facts already knew of it, and has
 * no fact when they knew nothing.
 * @param {Object} entry
 * @param {number} [now]
 * @param {Object|null} [current] - the facts the query has today
 */
export function factsOfEntry(entry, now = Date.now(), current = null) {
    const year = Number(entry.album.year)
    const before = knownSources(current)
    const sources = {}
    FACT_SOURCES.forEach(source => {
        const value = SAID.get(entry.enrichment[source]) ?? before[source]
        if (value !== undefined) sources[source] = value
    })
    return {
        year: Number.isFinite(year) && year > 0 ? year : null,
        sources,
        checkedAt: now,
        v: FACTS_VERSION
    }
}

const sameFacts = (a, b) => !!a && !!b && a.year === b.year && a.v === b.v &&
    FACT_SOURCES.every(source => a.sources?.[source] === b.sources?.[source])

/** The facts to write for a query, or null when the load learned nothing new about its album. */
function learnedFacts(query, entry, now) {
    if (!entry || !hasSettledFacts(entry)) return null

    const current = (typeof query === 'object' && query !== null) ? query.facts : null
    const facts = factsOfEntry(entry, now, current)
    if (Object.keys(facts.sources).length === 0 || sameFacts(current, facts)) return null
    return facts
}

/**
 * The album queries of a series with the facts the load settled.
 * A query whose album did not load, whose sources are still being asked, or about which no source
 * said anything, is left as it is.
 *
 * @param {Array} albumQueries
 * @param {Map<string, Object>} entriesByKey - the load entries of that series, by query key
 * @param {Function} keyOf - (query) => key
 * @returns {{ albumQueries: Array, changed: boolean }}
 */
export function withSettledFacts(albumQueries = [], entriesByKey, keyOf, now = Date.now()) {
    let changed = false
    const updated = albumQueries.map(query => {
        const facts = learnedFacts(query, entriesByKey.get(keyOf(query)), now)
        if (!facts) return query

        changed = true
        const base = (typeof query === 'object' && query !== null) ? query : parseAlbumQuery(query)
        return { ...base, facts }
    })
    return { albumQueries: updated, changed }
}

/**
 * The album queries of a series with the Apple Music id each album was really loaded by, where the
 * stored id was not the one (see withCorrectedSource). It does not wait for the facts: an album
 * that is on screen is enough.
 *
 * @param {Array} albumQueries
 * @param {Map<string, Object>} entriesByKey - the load entries of that series, by query key
 * @param {Function} keyOf - (query) => key
 * @returns {{ albumQueries: Array, changed: boolean }}
 */
export function withCorrectedSources(albumQueries = [], entriesByKey, keyOf) {
    let changed = false
    const updated = albumQueries.map(query => {
        const entry = entriesByKey.get(keyOf(query))
        if (entry?.status !== AlbumStatus.FOUND || !entry.album) return query

        const corrected = withCorrectedSource(query, entry.album)
        if (corrected !== query) changed = true
        return corrected
    })
    return { albumQueries: updated, changed }
}
