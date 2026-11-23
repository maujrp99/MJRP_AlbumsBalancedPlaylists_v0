/**
 * The doubles the export window's scenarios stand on (F83 sync 2): MusicKit (the folders of a library: some, none, an error, never
 * answering) and the Apple Music export service (it says its progress and waits). They import nothing of the app, so a `vi.mock` factory
 * may load this file (a factory that loads a file that loads the window waits for itself, and the test hangs without a word).
 *
 * Used by test/support/exportWindowScenarios.js and the files that play them: the capture on `main`
 * (reports/evidence/F83/sync-2/capture-export-from-main.test.js) and test/ui/PlaylistExportWindow.sameAsBefore.test.tsx.
 */

export const stand = {
    /** What the library holds when asked: 'folders' | 'none' | 'error' | 'pending'. */
    mode: 'folders',
    folders: [{ id: 'f-1', name: 'Favorites' }, { id: 'f-2', name: 'Workout' }],
    /** What the export asked the service for, in order. */
    calls: /** @type {unknown[][]} */ ([]),
    /** The release of the export that is waiting. */
    finish: /** @type {(() => void) | null} */ (null)
}

export function resetStands() {
    stand.mode = 'folders'
    stand.calls = []
    stand.finish = null
}

export const musicKitService = {
    listFolders: () => {
        stand.calls.push(['listFolders'])
        if (stand.mode === 'pending') return new Promise(() => { })
        if (stand.mode === 'error') return Promise.reject(new Error('blocked'))
        return Promise.resolve(stand.mode === 'none' ? [] : stand.folders)
    }
}

const plain = (value) => JSON.parse(JSON.stringify(value))

export const appleExportService = {
    /**
     * Says a first progress (a step and a name, as the service does since F98), then waits until the scenario lets it finish: every
     * playlist created, in the folder asked for.
     */
    exportPlaylists: (playlists, names, { onProgress } = {}) => {
        stand.calls.push(['exportPlaylists', playlists.map(item => item.name), plain(names)])
        onProgress?.({ step: 'exporting', name: playlists[0].name })
        const report = {
            folder: names.noFolder ? { name: null, created: false, none: true } : { name: names.folderName ?? names.seriesName, created: true },
            created: playlists.map(item => ({ name: item.name, tracks: item.tracks?.length ?? 0, total: item.tracks?.length ?? 0, alreadyThere: false })),
            failed: [], empty: [], notFound: [], unchecked: 0, uncheckedTracks: [], notCreated: [], failure: null
        }
        return new Promise((resolve) => { stand.finish = () => resolve(report) })
    }
}
