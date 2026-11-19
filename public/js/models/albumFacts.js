/**
 * albumFacts
 *
 * What the filters need to know about an album, kept inside the album query of the series
 * (arch.md, seção 16): its year and which sources have data for it. Pure functions.
 * The loaded album is the authority; the facts are a copy, rewritten when the album is loaded.
 */

import { parseAlbumQuery } from './albumQuery.js'
import { AlbumStatus, EnrichmentStatus } from './albumLoadState.js'

const FINISHED = new Set([EnrichmentStatus.DONE, EnrichmentStatus.EMPTY])
/** The sources whose facts are kept. The person's own ranking is not: it lives with the user. */
const FACT_SOURCES = Object.freeze(['acclaim', 'popularity'])

/** True when the load has a final answer from every fact source of this entry. */
export function hasSettledFacts(entry) {
    return entry.status === AlbumStatus.FOUND && !!entry.album &&
        FACT_SOURCES.every(source => FINISHED.has(entry.enrichment[source]))
}

/** The facts of a loaded entry. */
export function factsOfEntry(entry, now = Date.now()) {
    const year = Number(entry.album.year)
    return {
        year: Number.isFinite(year) && year > 0 ? year : null,
        sources: Object.fromEntries(FACT_SOURCES.map(source => [source, entry.enrichment[source] === EnrichmentStatus.DONE])),
        checkedAt: now
    }
}

const sameFacts = (a, b) => !!a && !!b && a.year === b.year &&
    FACT_SOURCES.every(source => !!a.sources?.[source] === !!b.sources?.[source])

/**
 * The album queries of a series with the facts the load settled.
 * A query whose album did not load, or whose sources did not all answer, is left as it is.
 *
 * @param {Array} albumQueries
 * @param {Map<string, Object>} entriesByKey - the load entries of that series, by query key
 * @param {Function} keyOf - (query) => key
 * @returns {{ albumQueries: Array, changed: boolean }}
 */
export function withSettledFacts(albumQueries = [], entriesByKey, keyOf, now = Date.now()) {
    let changed = false
    const updated = albumQueries.map(query => {
        const entry = entriesByKey.get(keyOf(query))
        if (!entry || !hasSettledFacts(entry)) return query

        const facts = factsOfEntry(entry, now)
        const current = (typeof query === 'object' && query !== null) ? query.facts : null
        if (sameFacts(current, facts)) return query

        changed = true
        const base = (typeof query === 'object' && query !== null) ? query : parseAlbumQuery(query)
        return { ...base, facts }
    })
    return { albumQueries: updated, changed }
}
