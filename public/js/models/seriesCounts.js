/**
 * seriesCounts - how many series and albums the albums screen holds (F72, S-55).
 *
 * Pure: it reads what the filter already answered (models/seriesFilter.js) and writes the line
 * the header shows. The count is of the albums asked for in the series that pass the filters, on
 * every page, not of the albums already loaded.
 */

/**
 * @param {Array<{ queries: Array }>} matching - the series that pass the filters, each with the
 *        queries of it that pass
 * @returns {number} the albums of all of them
 */
export function countAlbums(matching) {
    return (matching || []).reduce((sum, group) => sum + (group.queries || []).length, 0)
}

const plural = (count, one, many) => `${count} ${count === 1 ? one : many}`

/**
 * The line of the header.
 * @param {Object} counts
 * @param {boolean} counts.single - one series on screen
 * @param {number} counts.series - series that pass the filters
 * @param {number} counts.totalSeries - series the person has
 * @param {number} counts.albums - albums of the series that pass
 * @returns {string} '' when there is nothing to say
 */
export function describeCounts(counts) {
    if (!counts || !counts.totalSeries) return ''
    const albums = plural(counts.albums, 'album', 'albums')
    if (counts.single) return albums
    const series = counts.series === counts.totalSeries
        ? `${counts.totalSeries} series`
        : `${counts.series} of ${counts.totalSeries} series`
    return `${series} · ${albums}`
}
