/**
 * seriesDraft
 *
 * The rules of a series being edited (the "Edit Series" window), as pure functions (F57): what is
 * in the list of albums before it is saved, and where the save is (on its way, failed and why). The
 * words are the window's (dictionary `albums.edit.*`, F83 wave 5b). Nothing here writes: the window asks the series service.
 */

/** Where the save of the draft is. */
export const SaveStatus = Object.freeze({
    IDLE: 'idle',       // nothing on its way
    SAVING: 'saving',   // the write was asked and has not answered
    FAILED: 'failed'    // the last ask did not save - see the problem
})

/** Why a save did not happen. */
export const SaveProblem = Object.freeze({
    NO_NAME: 'no-name',
    NO_DATABASE: 'no-database',
    WRITE_FAILED: 'write-failed'
})

/** @returns {{ status: string, problem: string|null }} the save before any ask */
export function idleSave() {
    return { status: SaveStatus.IDLE, problem: null }
}

/** True when a save may be asked: none is on its way. */
export function canSave(save) {
    return save.status !== SaveStatus.SAVING
}

export function saveStarted() {
    return { status: SaveStatus.SAVING, problem: null }
}

/** @param {string} [problem] one of SaveProblem */
export function saveFailed(problem = SaveProblem.WRITE_FAILED) {
    return { status: SaveStatus.FAILED, problem }
}

/**
 * What stops the draft from being saved before any write is asked, or null.
 * @param {{ name: string, hasDatabase: boolean }} draft
 */
export function problemBeforeSave({ name, hasDatabase }) {
    if (!String(name || '').trim()) return SaveProblem.NO_NAME
    if (!hasDatabase) return SaveProblem.NO_DATABASE
    return null
}

/** True when the stored query (an object) is the album of the entry. */
function isSameStoredAlbum(query, entry) {
    if (entry.appleMusicId && query.appleMusicId) return query.appleMusicId === entry.appleMusicId
    return query.artist === entry.artist && (query.title === entry.title || query.album === entry.title)
}

/**
 * True when the list already has the album of this entry.
 * @param {Array<string|Object>} queries - the album queries of the draft
 * @param {{ artist: string, title: string, appleMusicId: string|null }} entry - of toAlbumQuery
 */
export function hasAlbumQuery(queries, entry) {
    return (queries || []).some(query => {
        if (typeof query === 'object' && query !== null) return isSameStoredAlbum(query, entry)
        return query === `${entry.artist} - ${entry.title}`
    })
}
