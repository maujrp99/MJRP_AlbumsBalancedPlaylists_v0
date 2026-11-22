/**
 * seriesCovers - what a series says about its covers (F83 wave 7b; the reading that components/blend/BlendSeriesSelector.js did inside the loop that asks
 * for them). Pure: no store, no service, no network. A series keeps `albumQueries`, and a query is a text «Artist - Album» or an object with an address
 * for its cover or with a name; the screen asks the local set of albums only for the ones that give no address.
 */

/** The covers a series shows at most (the cascade has three). */
export const COVERS_SHOWN = 3

/** How many albums a series has: its queries, or its albums when it has no queries. */
export const albumCountOf = (series) => (series.albumQueries || series.albums || []).length

/** A text «Artist - Album» as the pair to look for, or null when it is not one: the artist is what comes before the first « - ». */
function pairOf(text) {
    if (typeof text !== 'string' || !text.includes(' - ')) return null
    const [artist, ...albumParts] = text.split(' - ')
    return { artist, album: albumParts.join(' - ') }
}

/**
 * What to do to get the cover of one query: use an address it already carries (`url`), or look an album up (`find`), or neither.
 * @param {unknown} query
 * @returns {{ url: string|null, find: { artist: string, album: string }|null }}
 */
export function coverAskOf(query) {
    if (query && typeof query === 'object') {
        const url = query.imageUrl || query.coverUrl || query.artwork?.url || null
        if (url) return { url, find: null }
        const name = query.name || query.title
        return { url: null, find: pairOf(name) }
    }
    return { url: null, find: pairOf(query) }
}

/** The first queries of a series that show as covers. */
export const queriesShown = (series, max = COVERS_SHOWN) => (series.albumQueries || []).slice(0, max)
