/**
 * seriesExpansion
 *
 * The cut of the "all series" panel, with no screen: a series draws its first 12 albums, and the
 * rest when the person asks for them. The cut is only of what is drawn: every album of a series on
 * screen is asked of the load service, whatever the cut (F49, UAT-06).
 */

/** How many albums a series draws in the grid of all the series before the person asks for more. */
export const SERIES_ALBUM_LIMIT = 12

/**
 * What a series draws.
 * @param {Array} albums - the albums of the series that are on screen, in order
 * @param {boolean} expanded - the person asked for every album of this series
 * @returns {{ shown: Array, hidden: number }} `hidden` is how many albums are held back
 */
export function cutAlbums(albums = [], expanded = false) {
    if (expanded || albums.length <= SERIES_ALBUM_LIMIT) return { shown: albums, hidden: 0 }
    return { shown: albums.slice(0, SERIES_ALBUM_LIMIT), hidden: albums.length - SERIES_ALBUM_LIMIT }
}

/**
 * The series the person opened whole, during one visit to the albums screen.
 * One per screen: it lives as long as the screen does, and a change of scope empties it.
 */
export class SeriesExpansion {
    constructor() {
        this.scopeKey = null
        this.seriesIds = new Set()
    }

    /** Say which scope is on screen; a scope other than the last one forgets every choice. */
    syncScope(scopeKey) {
        if (scopeKey === this.scopeKey) return
        this.scopeKey = scopeKey
        this.seriesIds.clear()
    }

    /** The person asked for every album of this series. */
    expand(seriesId) {
        if (seriesId) this.seriesIds.add(seriesId)
    }

    isExpanded(seriesId) {
        return this.seriesIds.has(seriesId)
    }

    /** The ids of the series opened whole. */
    list() {
        return [...this.seriesIds]
    }
}
