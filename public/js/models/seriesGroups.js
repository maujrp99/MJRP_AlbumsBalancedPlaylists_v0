/**
 * seriesGroups - which series an album of the albums screen belongs to (F83 wave 5a; the rule the screen's renderer kept in
 * views/albums/AlbumsScopedRenderer.js, with no drawing in it).
 *
 * An album names its series (`seriesIds`); an album that does not is matched by its title against the queries of each series (the
 * first that contains it, or that it contains, wins); what matches none is «other» (shown as Uncategorized).
 */

/**
 * @param {Array<Object>} albums
 * @param {Array<Object>} seriesList - the series on screen, in the order they are shown
 * @returns {{ seriesGroups: Map<string, { series: Object, albums: Array<Object> }>, otherAlbums: Array<Object> }}
 */
const queryText = (query) => (typeof query === 'string' ? query : (query.album || query.title || ''))

/** Does one of the series' queries contain the title of the album, or the title contain it? */
function asksForTitle(series, title) {
    const wanted = title.toLowerCase()
    return (series.albumQueries || []).some(query => {
        const text = queryText(query).toLowerCase()
        return text !== '' && (text.includes(wanted) || wanted.includes(text))
    })
}

/** The series an album names (`seriesIds`); none when it names none of the series on screen. */
const namedSeries = (album, seriesList) => (Array.isArray(album.seriesIds) ? seriesList.filter(series => album.seriesIds.includes(series.id)) : [])

export function groupAlbumsBySeries(albums, seriesList) {
    const seriesGroups = new Map()
    seriesList.forEach(series => {
        seriesGroups.set(series.id, { series, albums: [] })
    })
    const otherAlbums = []

    albums.forEach(album => {
        const named = namedSeries(album, seriesList)
        // the strict match worked: no fuzzy fallback; else the first series whose queries match the title
        const matched = named.length > 0 ? named : [seriesList.find(series => asksForTitle(series, album.title))].filter(Boolean)
        if (matched.length === 0) otherAlbums.push(album)
        matched.forEach(series => seriesGroups.get(series.id)?.albums.push(album))
    })

    return { seriesGroups, otherAlbums }
}
