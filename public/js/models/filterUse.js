/**
 * filterUse - when choosing a filter, a search or an order is a use worth measuring (F77, the
 * event `filter_used`). Pure. The screen's own name of a filter becomes the name of the shared
 * list (shared/usageEvents.js, FILTERS); what was chosen or typed is never part of the answer.
 *
 * A use is counted when a filter is set to something that filters (not '', not 'all') and is not
 * what it already was. A search is counted once, when it starts: from an empty box to some text,
 * not at every letter.
 */

/** The name a screen gives a filter -> the name the measurement gives it. */
const WHICH = Object.freeze({
    search: 'search',
    artist: 'artist',
    year: 'year',
    source: 'source',
    format: 'format',
    ownership: 'status',
    sort: 'sort',
    seriesId: 'series',
    batchName: 'batch'
})

const filters = (value) => value !== undefined && value !== null && value !== '' && value !== 'all'

/**
 * @param {string} screen - 'albums' | 'inventory' | 'saved_playlists'
 * @param {string} type - the screen's name of the filter
 * @param {*} value - what it is now
 * @param {*} before - what it was
 * @returns {{ screen: string, which: string }|null} null when this is not a use to count
 */
export function filterUseOf(screen, type, value, before) {
    const which = Object.hasOwn(WHICH, type) ? WHICH[type] : null
    if (!which || !filters(value)) return null
    const repeated = which === 'search' ? filters(before) : value === before
    return repeated ? null : { screen, which }
}
