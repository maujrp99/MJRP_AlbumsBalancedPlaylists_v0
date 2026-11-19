/**
 * seriesDraft
 *
 * The rules of a series being edited (the "Edit Series" modal), as pure functions (F57): what is
 * in the list of albums before it is saved, and what the modal shows while the save is on its way
 * and when it failed. Nothing here writes: the modal asks the series service.
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

const PROBLEM_MESSAGES = Object.freeze({
    [SaveProblem.NO_NAME]: 'Give the series a name before saving.',
    [SaveProblem.NO_DATABASE]: 'The database is not ready yet. Nothing was saved; your changes are still here.',
    [SaveProblem.WRITE_FAILED]: 'The series could not be saved. Your changes are still here: you can try again.'
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

export function saveFailed(problem = SaveProblem.WRITE_FAILED) {
    return { status: SaveStatus.FAILED, problem }
}

/**
 * What the modal shows for a save: the one place its texts live.
 * @returns {{ busy: boolean, confirmLabel: string, message: string }}
 */
export function describeSave(save) {
    const busy = save.status === SaveStatus.SAVING
    return {
        busy,
        confirmLabel: busy ? 'Saving…' : 'Save Changes',
        message: save.status === SaveStatus.FAILED ? (PROBLEM_MESSAGES[save.problem] || PROBLEM_MESSAGES[SaveProblem.WRITE_FAILED]) : ''
    }
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
