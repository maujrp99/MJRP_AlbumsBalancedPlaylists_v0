/**
 * albumsListState.js - what the list area of the albums screen shows (F79, P1-1).
 *
 * The orange line at the top is gone, so the screen says by itself that it is reading the series:
 * until the first read ends with no series known, it is loading, never «No albums in library».
 */

export const ListState = Object.freeze({
    LOADING: 'loading', // the first read of the series is out and no series is known yet
    EMPTY: 'empty', // the read ended and there is nothing to show (or it failed: as before)
    LIST: 'list' // series are known: show them, also while a later read refreshes them
})

/**
 * @param {{ seriesCount: number, read: boolean, failed: boolean }} facts
 *   seriesCount: series known now; read: a read of the series has ended at least once;
 *   failed: the last read failed
 * @returns {'loading'|'empty'|'list'}
 */
export function albumsListState({ seriesCount, read, failed }) {
    if (seriesCount > 0) return ListState.LIST
    if (failed) return ListState.EMPTY
    return read ? ListState.EMPTY : ListState.LOADING
}
