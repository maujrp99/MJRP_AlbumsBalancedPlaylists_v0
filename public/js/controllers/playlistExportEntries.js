/**
 * playlistExportEntries - the four ways out of the playlists, as the export window (ui/PlaylistExportWindow.tsx) and the edit screen ask for
 * them (F83 wave 8a; they were react-bridge/legacy/OutputWindows.ts). The screens hand this module to the window (`usePlaylistExport({ exports })`):
 * a piece of ui/ draws what it is given and imports no controller, so the window never reaches for these by itself.
 *
 * Each is asked for when pressed, by `import()`, so none of them is in the first download of the screen. The window hands each one what to
 * export: the playlists, the series, the batch and the position of each playlist in it. None given: the playlists on the edit screen, as always.
 *
 * The exports themselves (the Apple Music and the file) are playlistExports.js, moved as they were from views/playlists/PlaylistsExport.js.
 */

/**
 * @typedef {Object} What what an export is given; the keys the export modules know
 * @property {unknown[]} [playlists]
 * @property {string} [seriesName]
 * @property {string} [batchName]
 * @property {number[]} [positions]
 * @property {string} [folderName] - Apple Music only
 * @property {string} [folderId] - Apple Music only
 * @property {boolean} [noFolder] - Apple Music only
 */

/** @param {What} [what] */
export async function openSpotifyExport(what = {}) {
    const { showSpotifyExportModal } = await import('../components/SpotifyExportModal.js')
    showSpotifyExportModal(what.playlists ? { playlists: what.playlists, seriesName: what.seriesName } : undefined)
}

/** @param {What} [what] */
export async function exportJson(what = {}) {
    const { handleExportJson } = await import('./playlistExports.js')
    handleExportJson(what.playlists ?? [], { batchName: what.batchName }) // none given: the playlists on screen
}

/**
 * `onStatus` is told the progress (a text while it runs, null at the end): the window draws its own button.
 * @param {(text: string | null) => void} onStatus
 * @param {What} [what]
 */
export async function exportToAppleMusic(onStatus, what = {}) {
    const { handleExportToAppleMusic } = await import('./playlistExports.js')
    await handleExportToAppleMusic({ ...what, onStatus })
}

/** @type {Promise<typeof import('../services/MusicKitService.js')> | null} */
let musicKit = null

/**
 * The folders of the person's Apple Music library (the first read asks the person to connect, as the export does).
 * @returns {Promise<Array<{ id: string, name: string }>>}
 */
export async function listAppleFolders() {
    musicKit ??= import('../services/MusicKitService.js') // one import, however many readers ask at once
    const { musicKitService } = await musicKit
    return musicKitService.listFolders()
}
