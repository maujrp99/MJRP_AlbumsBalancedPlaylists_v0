/**
 * albumPicker
 *
 * The rules of the one album picker (F57) - "search an artist, see the albums by type, pick some" -
 * as pure functions. The Home and the series edit show the same filters, in the same order, over
 * the same albums. The state of the search itself is models/scanState.js; the type of an album is
 * models/albumType.js.
 */

import { AlbumType, ALBUM_TYPES } from './albumType.js'

/** The filter buttons, in the order they are shown: one for each album type. */
export const PICKER_FILTERS = Object.freeze([
    Object.freeze({ key: 'albums', type: AlbumType.ALBUM, label: 'Studio', icon: 'Disc' }),
    Object.freeze({ key: 'eps', type: AlbumType.EP, label: 'EPs', icon: 'Disc3' }),
    Object.freeze({ key: 'singles', type: AlbumType.SINGLE, label: 'Singles', icon: 'Music2' }),
    Object.freeze({ key: 'live', type: AlbumType.LIVE, label: 'Live', icon: 'Mic2' }),
    Object.freeze({ key: 'compilations', type: AlbumType.COMPILATION, label: 'Compendiums', icon: 'Library' }),
    Object.freeze({ key: 'uncategorized', type: AlbumType.UNKNOWN, label: 'Other', icon: 'HelpCircle' })
])

const FILTER_OF_TYPE = Object.freeze(Object.fromEntries(PICKER_FILTERS.map(filter => [filter.type, filter.key])))

/** The type of an album as the picker counts it: a type that is no known type is unknown. */
const pickerTypeOf = (album) => (ALBUM_TYPES.includes(album?.type) ? album.type : AlbumType.UNKNOWN)

/** @returns {Object} the filters before any click: studio albums only */
export function defaultFilters() {
    return Object.fromEntries(PICKER_FILTERS.map(filter => [filter.key, filter.type === AlbumType.ALBUM]))
}

/** The filters with one of them turned. A key that is no filter changes nothing. */
export function toggleFilter(filters, key) {
    if (!PICKER_FILTERS.some(filter => filter.key === key)) return filters
    return { ...filters, [key]: !filters[key] }
}

/** The albums of the filters that are on. */
export function visibleAlbums(albums = [], filters = defaultFilters()) {
    return albums.filter(album => Boolean(filters[FILTER_OF_TYPE[pickerTypeOf(album)]]))
}

/**
 * How many albums each filter has.
 * @returns {Object} { albums: n, eps: n, singles: n, live: n, compilations: n, uncategorized: n }
 */
export function countByFilter(albums = []) {
    const counts = Object.fromEntries(PICKER_FILTERS.map(filter => [filter.key, 0]))
    albums.forEach(album => { counts[FILTER_OF_TYPE[pickerTypeOf(album)]]++ })
    return counts
}

/** Newest first, by release date. A new list: the one given is not changed. */
export function newestFirst(albums = []) {
    const released = (album) => new Date(album.releaseDate || album.raw?.attributes?.releaseDate || 0)
    return [...albums].sort((a, b) => released(b) - released(a))
}

/** The album of a card, by the id the card carries; null when the list does not have it. */
export function findAlbum(albums, id) {
    return (albums || []).find(album => album.id === id || album.appleMusicId === id) || null
}

const BADGE_OF_TYPE = Object.freeze({
    [AlbumType.LIVE]: 'Live', [AlbumType.SINGLE]: 'Single', [AlbumType.EP]: 'EP', [AlbumType.COMPILATION]: 'Comp'
})

/** The badges of an album card: the edition (from the title), then the type (from the classifier). */
export function badgesOf(album = {}) {
    const title = String(album.title || '').toLowerCase()
    const badges = []
    if (title.includes('deluxe')) badges.push('Deluxe')
    if (title.includes('remaster')) badges.push('Remaster')
    if (BADGE_OF_TYPE[album.type]) badges.push(BADGE_OF_TYPE[album.type])
    return badges
}
