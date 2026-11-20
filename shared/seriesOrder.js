/**
 * seriesOrder - the order a person's series are listed in by default: the newest first (UAT-227).
 *
 * One rule for the site (public/js/controllers/SeriesController.js, the «Newest» sort of Albums) and
 * the phone app (F78, its Albums tab). A series' `createdAt` arrives in more than one shape: a Date
 * (the site's SeriesService turns the stored value into one), a Firestore Timestamp (the app reads
 * it from the repository as it is stored: an object with `toMillis()`), or a number. All are read
 * as milliseconds; a series with no date counts as the oldest, as on the site before this file.
 *
 * Pure: no import, no global.
 */

/** The default order of the series list: the series created last first. */
export const DEFAULT_SERIES_ORDER = 'recent_desc'

/**
 * A creation date in milliseconds, whatever its shape; 0 when there is none.
 * @param {unknown} value
 * @returns {number}
 */
export function createdAtMillis(value) {
    const finite = (ms) => (Number.isFinite(ms) ? ms : 0)
    if (typeof value === 'number') return finite(value)
    if (value instanceof Date) return finite(value.getTime())
    if (typeof value?.toMillis === 'function') return finite(value.toMillis())
    if (typeof value?.toDate === 'function') return finite(value.toDate().getTime())
    return 0
}

/**
 * Compares two series for the «recent» orders.
 * @param {{ createdAt?: unknown }} a
 * @param {{ createdAt?: unknown }} b
 * @param {'recent_desc' | 'recent_asc'} [mode] - newest first (the default) or oldest first
 * @returns {number}
 */
export function compareByCreation(a, b, mode = DEFAULT_SERIES_ORDER) {
    const difference = createdAtMillis(b.createdAt) - createdAtMillis(a.createdAt)
    return mode === 'recent_asc' ? -difference : difference
}

/**
 * The series, newest first, in a new list (the one given is not changed).
 * @template {{ createdAt?: unknown }} T
 * @param {T[]} seriesList
 * @returns {T[]}
 */
export function newestFirst(seriesList) {
    return [...seriesList].sort((a, b) => compareByCreation(a, b, 'recent_desc'))
}
