/**
 * seriesCounts - how many albums the series on screen hold (F72, S-55).
 *
 * Pure: it reads what the filter and the paging already answered. The count is of the albums
 * asked for in the series on screen (this page, or what the scroll has loaded so far), not of
 * the albums already loaded: the pager says it beside "Showing 1–20 of 48 series".
 */

/**
 * @param {Array<{ queries: Array }>} groups - the series on screen, each with the queries of it
 *        that pass the filters
 * @returns {number} the albums of all of them
 */
export function countAlbums(groups) {
    return (groups || []).reduce((sum, group) => sum + (group.queries || []).length, 0)
}
