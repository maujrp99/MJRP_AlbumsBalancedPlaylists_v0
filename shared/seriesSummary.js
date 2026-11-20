/**
 * seriesSummary - what a list of series shows of each one before any album is loaded (F78, the
 * Albums tab of the app): its name, how many albums it asks for, and the covers it already keeps.
 *
 * Read from the series document alone (docs/specs/data-model.md, Series): `albumQueries` is a list
 * of texts («Artist - Title») or of objects that may carry `coverUrl`. The count is of the albums
 * asked for, as the site's pager counts them (public/js/models/seriesCounts.js, F72); a cover is
 * shown only when the query keeps one (no album is loaded to find it).
 *
 * Pure: no import, no global.
 */

/** How many covers a summary keeps: the row of the list shows at most this many. */
export const MAX_SUMMARY_COVERS = 4

const isHttpUrl = (value) => typeof value === 'string' && /^https:\/\//.test(value)

/**
 * @param {{ id: string, name?: unknown, albumQueries?: unknown }} series - a series document, with its id
 * @returns {{ id: string, name: string, albumCount: number, covers: string[] }}
 */
export function summarizeSeries(series) {
    const queries = Array.isArray(series.albumQueries) ? series.albumQueries : []
    const covers = queries
        .map(query => (query && typeof query === 'object' ? query.coverUrl : null))
        .filter(isHttpUrl)
        .slice(0, MAX_SUMMARY_COVERS)
    const name = typeof series.name === 'string' && series.name.trim() !== '' ? series.name : 'Untitled series'
    return { id: series.id, name, albumCount: queries.length, covers }
}
