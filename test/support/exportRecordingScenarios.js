/**
 * The scenarios of the Apple Music export recording (F83 wave 8a). Plain data: the golden (jsdom) and the browser proof of the built
 * site play the SAME list. Each scenario is a `behavior` for the MusicKit stand-in (test/support/musicKitRecorder.js) and `steps`:
 *   { apple: {...options} }    an export to Apple Music (what the window hands over: playlists, seriesName, batchName, positions,
 *                              folderName, folderId, noFolder); `playlists` is a recipe, see `playlistsOf`; none: the edit screen's
 *   { again: true }            the same press repeated in the same session (the ledger remembers what was created)
 *   { twice: {...options} }    two presses at once
 *   { folders: true }          the folder step's read of the library's folders (listAppleFolders)
 *   { json: {...} }            the file export (the file the browser is handed)
 */

const track = (title, extra = {}) => ({ title, artist: 'Artist', album: 'Album', ...extra })

/** A playlist recipe → playlists: { names: [...titles], tracks: n (numeric Apple Music ids, no search), searched: n }. */
export function playlistsOf(recipe) {
    return recipe.map(({ title, tracks = [], ids = 0, searched = 0, missing = 0 }, playlistIndex) => ({
        name: title,
        title,
        tracks: [
            ...tracks.map(name => track(name)),
            ...Array.from({ length: ids }, (_, i) => track(`Id ${playlistIndex}-${i}`, { appleMusicId: String(900000 + playlistIndex * 1000 + i) })),
            ...Array.from({ length: searched }, (_, i) => track(`Found ${playlistIndex}-${i}`)),
            ...Array.from({ length: missing }, (_, i) => track(`Nowhere ${playlistIndex}-${i}`))
        ]
    }))
}

/** What the stand-in catalog knows: the named tracks and every «Found n-m» track. */
const catalogOf = (names = [], found = 0, playlistCount = 4) => {
    const catalog = { One: '101', Two: '102', Three: '103', Four: '104' }
    names.forEach((name, i) => { catalog[name] = String(200 + i) })
    for (let p = 0; p < playlistCount; p++) for (let i = 0; i < found; i++) catalog[`Found ${p}-${i}`] = String(300000 + p * 1000 + i)
    return catalog
}

const ONE = [{ title: 'Greatest Hits', tracks: ['One', 'Two'] }]
const BATCH = [
    { title: 'Greatest Hits', tracks: ['One', 'Two'] },
    { title: 'Deep Cuts', tracks: ['Three', 'Four'] },
    { title: 'B-Sides', tracks: ['One', 'Four'] }
]
const manyFolders = (count) => Array.from({ length: count }, (_, i) => ({ id: `f${i + 1}`, name: `Folder ${i + 1}` }))

export const exportRecordingScenarios = [
    { name: 'one playlist, into the folder of the series (not in the library yet: created)',
      behavior: { catalog: catalogOf() },
      steps: [{ apple: { playlists: ONE, seriesName: 'Road trip', batchName: 'Mix' } }] },
    { name: 'one playlist, into the folder of the series (already in the library: found by name, any case)',
      behavior: { catalog: catalogOf(), folders: [{ id: 'f-road', name: 'road TRIP' }] },
      steps: [{ apple: { playlists: ONE, seriesName: 'Road trip', batchName: 'Mix' } }] },
    { name: 'a batch of three into a folder chosen from the library (by id: no lookup)',
      behavior: { catalog: catalogOf() },
      steps: [{ apple: { playlists: BATCH, seriesName: 'Road trip', batchName: 'Mix', folderName: 'Picked', folderId: 'f-42' } }] },
    { name: 'a batch into a NEW folder the person named (looked up by name, missing, created)',
      behavior: { catalog: catalogOf(), folders: [{ id: 'f1', name: 'Other' }] },
      steps: [{ apple: { playlists: BATCH, seriesName: 'Road trip', batchName: 'Mix', folderName: 'Fresh folder' } }] },
    { name: 'a remembered folder (the choice the step remembers reaches the export as the folder name; it exists in the library)',
      behavior: { catalog: catalogOf(), folders: [{ id: 'f-keep', name: 'Remembered' }] },
      steps: [{ apple: { playlists: ONE, seriesName: 'Road trip', batchName: 'Mix', folderName: 'Remembered' } }] },
    { name: 'one playlist of a batch: it keeps the position it has in the batch',
      behavior: { catalog: catalogOf() },
      steps: [{ apple: { playlists: [BATCH[2]], seriesName: 'Road trip', batchName: 'Mix', positions: [3] } }] },
    { name: 'no folder: the top of the library',
      behavior: { catalog: catalogOf() },
      steps: [{ apple: { playlists: BATCH, seriesName: 'Road trip', batchName: 'Mix', noFolder: true } }] },
    { name: 'tracks not found in the catalog, and a playlist with none found',
      behavior: { catalog: catalogOf() },
      steps: [{ apple: { playlists: [{ title: 'Half', tracks: ['One'], missing: 2 }, { title: 'Ghosts', missing: 2 }], seriesName: 'S', batchName: 'Mix' } }] },
    { name: 'a playlist with 300 tracks that carry their Apple Music id (one request holds them all: no chunking)',
      behavior: { catalog: catalogOf() },
      steps: [{ apple: { playlists: [{ title: 'Long', ids: 300 }], seriesName: 'S', batchName: 'Mix' } }] },
    { name: 'a playlist with 120 tracks the catalog is asked about one by one',
      behavior: { catalog: catalogOf([], 120) },
      steps: [{ apple: { playlists: [{ title: 'Searched', searched: 120 }], seriesName: 'S', batchName: 'Mix' } }] },
    { name: 'a library with 250 folders (three pages): the folder of the series is on the last page',
      behavior: { catalog: catalogOf(), folders: [...manyFolders(249), { id: 'f-last', name: 'Road trip' }] },
      steps: [{ apple: { playlists: ONE, seriesName: 'Road trip', batchName: 'Mix' } }] },
    { name: 'the rate limit (429) answers the second creation: the others are still tried',
      behavior: { catalog: catalogOf(), postFails: { 2: { status: 429, message: 'Too Many Requests' } } },
      steps: [{ apple: { playlists: BATCH, seriesName: 'Road trip', batchName: 'Mix' } }] },
    { name: 'every creation fails (401, the token expired in the middle)',
      behavior: { catalog: catalogOf(), postAlwaysFails: { status: 401, message: 'Unauthorized' } },
      steps: [{ apple: { playlists: BATCH, seriesName: 'Road trip', batchName: 'Mix' } }] },
    { name: 'the creation fails, then the same press is repeated: only what was missing is created',
      behavior: { catalog: catalogOf(), postFails: { 1: { status: 500, message: 'Server error' } } },
      steps: [{ apple: { playlists: BATCH.slice(0, 2), seriesName: 'Road trip', batchName: 'Mix' } }, { again: true }] },
    { name: 'the authorization expired: the person says no',
      behavior: { catalog: catalogOf(), authorize: 'expired' },
      steps: [{ apple: { playlists: BATCH, seriesName: 'Road trip', batchName: 'Mix' } }] },
    { name: 'the person denies the authorization',
      behavior: { catalog: catalogOf(), authorize: 'denied' },
      steps: [{ apple: { playlists: ONE, seriesName: 'Road trip', batchName: 'Mix' } }] },
    { name: 'the developer token cannot be had (the site is not set up for Apple Music)',
      behavior: { tokenStatus: 500 },
      steps: [{ apple: { playlists: ONE, seriesName: 'Road trip', batchName: 'Mix' } }] },
    { name: 'the folder cannot be created: the playlists go to the top of the library',
      behavior: { catalog: catalogOf(), folderPostFails: true },
      steps: [{ apple: { playlists: ONE, seriesName: 'Road trip', batchName: 'Mix' } }] },
    { name: 'the same export pressed again after it ended: nothing is created twice',
      behavior: { catalog: catalogOf() },
      steps: [{ apple: { playlists: BATCH.slice(0, 2), seriesName: 'Road trip', batchName: 'Mix' } }, { again: true }] },
    { name: 'pressed twice at once: the second is told one is running',
      behavior: { catalog: catalogOf() },
      steps: [{ twice: { playlists: ONE, seriesName: 'Road trip', batchName: 'Mix' } }] },
    { name: 'nothing to export',
      behavior: {},
      steps: [{ apple: { playlists: [], seriesName: 'Road trip', batchName: 'Mix' } }] },
    { name: 'the edit screen: the playlists, the batch and the series are the screen\'s own',
      behavior: { catalog: catalogOf() },
      steps: [{ apple: { fromScreen: true } }] },
    { name: 'the step reads the folders: some (two pages)',
      behavior: { folders: manyFolders(150) },
      steps: [{ folders: true }] },
    { name: 'the step reads the folders: none',
      behavior: { folders: [] },
      steps: [{ folders: true }] },
    { name: 'the step reads the folders: an error',
      behavior: { folderListFails: true },
      steps: [{ folders: true }] },
    { name: 'the step reads the folders, the person has not authorized',
      behavior: { authorize: 'denied', folders: manyFolders(3) },
      steps: [{ folders: true }] },
    { name: 'the file: playlists given, a batch name with characters the file name cannot hold',
      behavior: {},
      steps: [{ json: { playlists: BATCH.slice(0, 2), batchName: 'My: batch/2' } }] },
    { name: 'the file: the edit screen\'s playlists',
      behavior: {},
      steps: [{ json: { fromScreen: true } }] }
]
