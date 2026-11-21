/**
 * OutputWindows - the ways out of the playlists screen that stay hand-made (F83 wave 2; TEMPORARY, listed in bridgesOnlyShrink):
 * the Spotify export window (components/SpotifyExportModal.js, 434 lines, used by this screen only and ported on its own) and the file
 * and Apple Music exports (views/playlists/PlaylistsExport.js). Each is asked for when pressed, by `import()`, as the hand-made screen
 * did, so none of them is in the first download of the screen.
 */
export async function openSpotifyExport(): Promise<void> {
    const { showSpotifyExportModal } = await import('../../components/SpotifyExportModal.js')
    showSpotifyExportModal()
}

export async function exportJson(): Promise<void> {
    const { handleExportJson } = await import('../../views/playlists/PlaylistsExport.js')
    handleExportJson([]) // none given: the playlists on screen
}

/** `onStatus` is told the progress (a text while it runs, null at the end): the screen draws its own button. */
export async function exportToAppleMusic(onStatus: (text: string | null) => void): Promise<void> {
    const { handleExportToAppleMusic } = await import('../../views/playlists/PlaylistsExport.js')
    await handleExportToAppleMusic({ onStatus })
}
