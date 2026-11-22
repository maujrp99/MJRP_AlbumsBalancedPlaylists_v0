/**
 * appleFolderChoice - the folder of the Apple Music export (F90): what the person picked last time
 * for a series, and how a pick becomes the name the export uses.
 *
 * The memory is the browser's `localStorage`, key `mjrp_apple_music_folder:<series name>`, value
 * `{"name":"<folder name>"}` or `{"none":true}`: nothing but the folder's name. Every access is in a
 * try/catch (a private window or blocked storage just forgets).
 */

export const FOLDER_KEY_PREFIX = 'mjrp_apple_music_folder:'

const keyOf = (seriesName) => `${FOLDER_KEY_PREFIX}${seriesName}`
const sameName = (a, b) => String(a).trim().toLowerCase() === String(b).trim().toLowerCase()

/** @returns {{ name: string } | { none: true } | null} what was picked last time for the series */
export function readChoice(seriesName, storage = globalThis.localStorage) {
    try {
        const saved = JSON.parse(storage.getItem(keyOf(seriesName)))
        if (saved?.none === true) return { none: true }
        return typeof saved?.name === 'string' && saved.name.trim() ? { name: saved.name } : null
    } catch {
        return null
    }
}

/** Remember the pick for the series. @param {{ name: string } | { none: true }} choice */
export function saveChoice(seriesName, choice, storage = globalThis.localStorage) {
    try {
        storage.setItem(keyOf(seriesName), JSON.stringify(choice.none ? { none: true } : { name: choice.name }))
    } catch {
        // storage blocked: the next export starts from the series' name again
    }
}

/** The folder with that name, ignoring case (as createOrGetFolder reuses one). */
export const findFolder = (folders, name) => folders.find(folder => sameName(folder.name, name)) || null

/**
 * Which row is selected when the step opens: the one remembered for the series if it is still a
 * choice, else the series' own folder.
 * @returns {{ mode: 'series'|'existing'|'new'|'none', name: string }}
 */
export function initialPick({ seriesName, folders, remembered }) {
    if (!remembered) return { mode: 'series', name: seriesName }
    if (remembered.none) return { mode: 'none', name: '' }
    if (sameName(remembered.name, seriesName)) return { mode: 'series', name: seriesName }
    const existing = findFolder(folders, remembered.name)
    return existing ? { mode: 'existing', name: existing.name } : { mode: 'new', name: remembered.name }
}

/**
 * What the export is told for a pick.
 * @returns {{ ok: true, folderName?: string, noFolder?: boolean } | { ok: false, message: string }}
 */
export function folderForExport({ mode, name }) {
    if (mode === 'none') return { ok: true, noFolder: true }
    const trimmed = String(name || '').trim()
    if (!trimmed) return { ok: false, message: 'Type a name for the new folder.' }
    return { ok: true, folderName: trimmed }
}
