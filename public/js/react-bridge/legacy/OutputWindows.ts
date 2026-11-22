/**
 * OutputWindows - the ways out of the playlists that stay hand-made (F83 wave 2; TEMPORARY, listed in bridgesOnlyShrink):
 * the Spotify export window (components/SpotifyExportModal.js, 434 lines, used by the export window only and ported on its own) and
 * the file and Apple Music exports (views/playlists/PlaylistsExport.js). Each is asked for when pressed, by `import()`, as the
 * hand-made screen did, so none of them is in the first download of the screen.
 *
 * F83 sync 2: the window that offers them (ui/PlaylistExportWindow.tsx, F90) is React now and hands each one what to export: the
 * playlists, the series, the batch and the position of each playlist in it. None given: the playlists on the edit screen, as always.
 */
import type { ExportJob } from '../../ui/PlaylistExportWindow'

/** What the hand-made exports are given; the keys the export modules know. */
type What = Pick<ExportJob, 'playlists' | 'seriesName' | 'batchName' | 'positions'>

export async function openSpotifyExport(what: What = {}): Promise<void> {
    const { showSpotifyExportModal } = await import('../../components/SpotifyExportModal.js')
    showSpotifyExportModal(what.playlists ? { playlists: what.playlists, seriesName: what.seriesName } : undefined)
}

export async function exportJson(what: What = {}): Promise<void> {
    const { handleExportJson } = await import('../../views/playlists/PlaylistsExport.js')
    handleExportJson(what.playlists ?? [], { batchName: what.batchName }) // none given: the playlists on screen
}

/** `onStatus` is told the progress (a text while it runs, null at the end): the window draws its own button. */
export async function exportToAppleMusic(onStatus: (text: string | null) => void, what: What & { folderName?: string; folderId?: string; noFolder?: boolean } = {}): Promise<void> {
    const { handleExportToAppleMusic } = await import('../../views/playlists/PlaylistsExport.js')
    await handleExportToAppleMusic({ ...what, onStatus })
}

let musicKit: Promise<typeof import('../../services/MusicKitService.js')> | null = null

/** The folders of the person's Apple Music library (the first read asks the person to connect, as the export does). */
export async function listAppleFolders(): Promise<Array<{ id: string; name: string }>> {
    musicKit ??= import('../../services/MusicKitService.js') // one import, however many readers ask at once
    const { musicKitService } = await musicKit
    return musicKitService.listFolders()
}
