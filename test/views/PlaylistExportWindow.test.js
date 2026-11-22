/**
 * F90 - the export window the edit screen and the saved playlists screen share.
 *
 * One playlist or a whole batch, each destination (Apple Music, Spotify, the JSON file), each
 * state the export has (not connected, exporting, done, failed, tracks not found). Every service
 * is a double: no Apple Music and no Spotify is ever called here. The rules of the services
 * themselves are in test/services/musickit/AppleMusicExport.test.js and test/services/spotify.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

const kit = vi.hoisted(() => ({ service: null, phone: false }))
vi.mock('../../public/js/services/MusicKitService.js', () => ({ get musicKitService() { return kit.service } }))
vi.mock('../../public/js/services/SpotifyExportService.js', () => ({ SpotifyExportService: { exportPlaylists: vi.fn() } }))
vi.mock('../../public/js/services/SpotifyAuthService.js', () => ({ SpotifyAuthService: { login: vi.fn() } }))
vi.mock('../../public/js/components/Toast.js', () => {
    const toast = { info: vi.fn(), success: vi.fn(), error: vi.fn(), warning: vi.fn() }
    return { default: toast, toast }
})
vi.mock('../../public/js/utils/isPhone.js', () => ({ isPhone: () => kit.phone, onPhoneChange: () => () => { } }))

import { openPlaylistExport, DESTINATIONS } from '../../public/js/views/playlists/PlaylistExportWindow.js'
import { AppleMusicExportService } from '../../public/js/services/AppleMusicExportService.js'
import { SpotifyExportService } from '../../public/js/services/SpotifyExportService.js'
import { SpotifyAuthService } from '../../public/js/services/SpotifyAuthService.js'
import { exportLedger } from '../../public/js/services/export/exportLedger.js'
import { playlistsStore } from '../../public/js/stores/playlists.js'
import toast from '../../public/js/components/Toast.js'

const track = (title) => ({ title, artist: 'Artist', album: 'Album' })
const BATCH = [
    { id: 'p1', name: 'Greatest Hits', tracks: [track('One'), track('Two')] },
    { id: 'p2', name: 'Deep Cuts', tracks: [track('Three'), track('Four')] },
    { id: 'p3', name: 'B-Sides', tracks: [track('Five')] }
]
const SERIES = 'Road trip'
const BATCH_NAME = 'Mix'

/** A double of MusicKit: the library it built, and switches to make it fail. */
function fakeMusicKit() {
    const fake = {
        library: [],
        catalog: { One: '101', Two: '102', Three: '103', Four: '104' }, // «Five» is not in the catalog
        authorizeError: null,
        init: vi.fn(async () => { }),
        authorize: vi.fn(async () => { if (fake.authorizeError) throw fake.authorizeError }),
        folders: [],            // what the library already has: [{ id, name }]
        listError: null,
        listFolders: vi.fn(async () => { if (fake.listError) throw fake.listError; return fake.folders }),
        createOrGetFolder: vi.fn(async (name) => fake.folders.find(f => f.name.toLowerCase() === name.toLowerCase())?.id || 'folder-1'),
        findTrackFromAlbum: vi.fn(async (title) => (fake.catalog[title] ? { id: fake.catalog[title] } : null)),
        createPlaylistInFolder: vi.fn(async (name, trackIds, folderId) => {
            const playlist = { id: `p.${fake.library.length + 1}`, name, trackIds, folderId }
            fake.library.push(playlist)
            return playlist
        })
    }
    return fake
}

const rows = () => [...document.querySelectorAll('[data-export]')]
const row = (id) => document.querySelector(`[data-export="${id}"]`)
const names = (list) => list.map(item => item.name)
const window_ = (job) => openPlaylistExport({ seriesName: SERIES, batchName: BATCH_NAME, ...job })
/** Apple Music from the window: open the folder step, wait for the folders, press its «Export». */
const stepOf = async () => { row('apple').click(); await vi.waitFor(() => expect(document.querySelector('[data-apple-folder-step]')).not.toBeNull()); await settle() }
const exportApple = async () => { await stepOf(); document.querySelector('[data-apple-export]').click() }
const pickFolder = (mode, value) => { const radio = [...document.querySelectorAll('input[name="apple-folder"]')].find(r => r.dataset.mode === mode && (value === undefined || r.value === value)); radio.checked = true; radio.dispatchEvent(new Event('change', { bubbles: true })) }
const settle = () => new Promise(resolve => setTimeout(resolve, 0))
const textOf = (blob) => new Promise((resolve) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.readAsText(blob) })

describe('the export window (F90)', () => {
    let musicKit

    beforeEach(() => {
        vi.clearAllMocks()
        document.body.innerHTML = ''
        kit.phone = false
        exportLedger.clear()
        musicKit = fakeMusicKit()
        kit.service = musicKit
        playlistsStore.reset()
        vi.spyOn(AppleMusicExportService, 'pause').mockResolvedValue()
        vi.spyOn(console, 'error').mockImplementation(() => { })
        vi.spyOn(console, 'warn').mockImplementation(() => { })
    })
    afterEach(() => vi.restoreAllMocks())

    describe('the destinations', () => {
        it('are Apple Music, Spotify, the JSON file, in that order, on the computer and on the phone', () => {
            expect(DESTINATIONS.map(destination => destination.id)).toEqual(['apple', 'spotify', 'json'])

            window_({ playlists: BATCH })
            expect(rows().map(button => button.textContent.trim())).toEqual(['Export to Apple Music', 'Export to Spotify', 'Download JSON'])
            document.body.innerHTML = ''

            kit.phone = true
            window_({ playlists: BATCH })
            expect(document.querySelector('.sheet')).not.toBeNull()
            expect(rows().map(button => button.textContent.trim())).toEqual(['Export to Apple Music', 'Export to Spotify', 'Download JSON'])
        })

        it('the window has the name it was given and closes on Escape, giving the focus back', () => {
            const opener = document.createElement('button')
            document.body.appendChild(opener)
            opener.focus()

            window_({ playlists: BATCH, title: 'Export Deep Cuts' })
            expect(document.getElementById('playlist-export-window').textContent).toContain('Export Deep Cuts')
            expect(document.activeElement).toBe(row('apple'))

            document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
            expect(document.getElementById('playlist-export-window')).toBeNull()
            expect(document.activeElement).toBe(opener)
        })
    })

    describe('Apple Music', () => {
        it('one playlist: the folder of the series is used and only that playlist is created, named as the batch export names it', async () => {
            window_({ playlists: [BATCH[1]], positions: [2] })
            await exportApple()
            await vi.waitFor(() => expect(toast.success).toHaveBeenCalled())

            expect(musicKit.createOrGetFolder).toHaveBeenCalledWith(SERIES)
            expect(names(musicKit.library)).toEqual(['2. Mix - Deep Cuts'])
            expect(musicKit.library[0].folderId).toBe('folder-1')
            expect(toast.success.mock.calls[0][0]).toContain('1 playlist exported to Apple Music, in the folder "Road trip"')
        })

        it('the whole batch: every playlist is created, in the folder, in the order of the batch', async () => {
            window_({ playlists: BATCH, positions: [1, 2, 3] })
            await exportApple()
            await vi.waitFor(() => expect(toast.success).toHaveBeenCalled())

            expect(names(musicKit.library)).toEqual(['1. Mix - Greatest Hits', '2. Mix - Deep Cuts'])
            expect(toast.success.mock.calls[0][0]).toContain('2 playlists exported')
        })

        it('one playlist and then the whole batch does not create the first one twice', async () => {
            window_({ playlists: [BATCH[1]], positions: [2] })
            await exportApple()
            await vi.waitFor(() => expect(toast.success).toHaveBeenCalledTimes(1))

            document.body.innerHTML = ''
            window_({ playlists: BATCH, positions: [1, 2, 3] })
            await exportApple()
            await vi.waitFor(() => expect(toast.info).toHaveBeenCalled())

            expect(names(musicKit.library)).toEqual(['2. Mix - Deep Cuts', '1. Mix - Greatest Hits'])
            expect(toast.info.mock.calls[0][0]).toContain('1 playlist was already exported in this session')
        })

        it('the progress is written on its row and the row is given back; the window stays open', async () => {
            let release
            musicKit.createOrGetFolder = vi.fn(() => new Promise(resolve => { release = () => resolve('folder-1') }))
            window_({ playlists: [BATCH[0]], positions: [1] })
            await stepOf()
            const button = document.querySelector('[data-apple-export]')
            button.click()
            await vi.waitFor(() => expect(button.textContent).toContain('Creating folder'))
            expect(button.disabled).toBe(true)

            release()
            await vi.waitFor(() => expect(toast.success).toHaveBeenCalled())
            expect(button.disabled).toBe(false)
            expect(button.textContent).toContain('Export')
            expect(document.getElementById('playlist-export-window')).not.toBeNull()
        })

        it('not connected: the prompt to connect is MusicKit\'s, and the refusal is told, nothing is created', async () => {
            musicKit.authorizeError = new Error('User not authorized')
            window_({ playlists: [BATCH[0]], positions: [1] })
            await exportApple()
            await vi.waitFor(() => expect(toast.warning).toHaveBeenCalled())

            expect(musicKit.authorize).toHaveBeenCalledTimes(1)
            expect(toast.warning.mock.calls[0][0]).toBe('Apple Music was not authorized: nothing was exported.')
            expect(musicKit.library).toEqual([])
        })

        it('failed: Apple Music refusing the playlist is told with the reason', async () => {
            musicKit.createPlaylistInFolder = vi.fn(async () => { throw new Error('Apple Music said no') })
            window_({ playlists: [BATCH[0]], positions: [1] })
            await exportApple()
            await vi.waitFor(() => expect(toast.error).toHaveBeenCalled())

            expect(toast.error.mock.calls[0][0]).toContain('"1. Mix - Greatest Hits" (Apple Music said no)')
        })

        it('a playlist with tracks the service could not match: it is created without them, and they are named', async () => {
            window_({ playlists: [{ id: 'p4', name: 'Mixed', tracks: [track('One'), track('Five')] }], positions: [4] })
            await exportApple()
            await vi.waitFor(() => expect(toast.warning).toHaveBeenCalled())

            expect(musicKit.library[0].trackIds).toEqual(['101'])
            expect(toast.warning.mock.calls[0][0]).toContain('1 track was not found in Apple Music and was left out: Artist - Five')
        })

        it('exporting changes nothing of the batch it was given, and writes nothing on the edit screen', async () => {
            const before = JSON.stringify(BATCH)
            window_({ playlists: BATCH, positions: [1, 2, 3] })
            await exportApple()
            await vi.waitFor(() => expect(toast.success).toHaveBeenCalled())

            expect(JSON.stringify(BATCH)).toBe(before)
            expect(playlistsStore.getPlaylists()).toEqual([])
        })
    })

    describe('Spotify', () => {
        const spotifyReport = (over = {}) => ({
            mode: 'merge', totalTracks: 2, matchCount: 2, created: [], incomplete: [], empty: [], notCreated: [], failure: null, createdUrl: null, ...over
        })
        const modal = () => document.getElementById('spotify-export-modal')

        it('one playlist: its own window, one playlist to create, no mode to choose, named after the series and the playlist', async () => {
            SpotifyExportService.exportPlaylists.mockResolvedValue(spotifyReport({ created: [{ name: 'Road trip - Greatest Hits', url: 'https://open.spotify.com/playlist/x', tracks: 2, total: 2, alreadyThere: false }] }))
            window_({ playlists: [BATCH[0]], positions: [1] })
            row('spotify').click()
            await vi.waitFor(() => expect(modal()).not.toBeNull())

            expect(document.getElementById('playlist-export-window')).toBeNull()
            expect(modal().querySelector('input[name="exportMode"]')).toBeNull()
            expect(modal().querySelector('#playlistNameInput').value).toBe('Road trip - Greatest Hits')
            expect(modal().textContent).toContain('This playlist becomes one Spotify playlist')

            modal().querySelector('#startExportBtn').click()
            await vi.waitFor(() => expect(modal().textContent).toContain('Export Complete'))
            const [given, options] = SpotifyExportService.exportPlaylists.mock.calls[0]
            expect(names(given)).toEqual(['Greatest Hits'])
            expect(options).toEqual({ mode: 'merge', name: 'Road trip - Greatest Hits' })
            expect(modal().textContent).toContain('Open in Spotify')
        })

        it('the whole batch: every playlist is given, with the modes the edit screen has', async () => {
            SpotifyExportService.exportPlaylists.mockResolvedValue(spotifyReport())
            window_({ playlists: BATCH, positions: [1, 2, 3] })
            row('spotify').click()
            await vi.waitFor(() => expect(modal()).not.toBeNull())

            expect(modal().querySelectorAll('input[name="exportMode"]').length).toBe(2)
            expect(modal().querySelector('#playlistNameInput').value).toBe(SERIES)
            modal().querySelector('#startExportBtn').click()
            await vi.waitFor(() => expect(SpotifyExportService.exportPlaylists).toHaveBeenCalled())
            expect(names(SpotifyExportService.exportPlaylists.mock.calls[0][0])).toEqual(['Greatest Hits', 'Deep Cuts', 'B-Sides'])
        })

        it('not connected: the same prompt to connect again', async () => {
            SpotifyExportService.exportPlaylists.mockResolvedValue(spotifyReport({ failure: { kind: 'reconnect', message: 'Spotify needs you to connect again' }, notCreated: ['Road trip - Greatest Hits'] }))
            window_({ playlists: [BATCH[0]], positions: [1] })
            row('spotify').click()
            await vi.waitFor(() => expect(modal()).not.toBeNull())
            modal().querySelector('#startExportBtn').click()
            await vi.waitFor(() => expect(modal().querySelector('#reconnectSpotifyBtn')).not.toBeNull())

            modal().querySelector('#reconnectSpotifyBtn').click()
            expect(SpotifyAuthService.login).toHaveBeenCalledTimes(1)
            expect(modal().textContent).toContain('Spotify needs you to connect again')
        })

        it('exporting: the progress is shown and the window cannot be closed; failed: it says so and offers another try', async () => {
            let finish
            SpotifyExportService.exportPlaylists.mockImplementation(async (_playlists, _options, callbacks) => {
                callbacks.onProgress('MATCHING', 1, 2, 'Searching: One')
                await new Promise(resolve => { finish = resolve })
                return spotifyReport({ failure: { kind: 'error', message: 'Spotify did not answer' } })
            })
            window_({ playlists: [BATCH[0]], positions: [1] })
            row('spotify').click()
            await vi.waitFor(() => expect(modal()).not.toBeNull())
            modal().querySelector('#startExportBtn').click()
            await vi.waitFor(() => expect(modal().textContent).toContain('Searching tracks'))
            expect(modal().querySelector('.close-modal-btn')).toBeNull()

            finish()
            await vi.waitFor(() => expect(modal().querySelector('#retryExportBtn')).not.toBeNull())
            expect(modal().textContent).toContain('Spotify did not answer')
        })

        it('tracks the service could not match are listed', async () => {
            SpotifyExportService.exportPlaylists.mockImplementation(async (_playlists, _options, callbacks) => {
                callbacks.onNotFound({ title: 'Five', artist: 'Artist', playlist: 'B-Sides' })
                return spotifyReport({ totalTracks: 2, matchCount: 1 })
            })
            window_({ playlists: [BATCH[2]], positions: [3] })
            row('spotify').click()
            await vi.waitFor(() => expect(modal()).not.toBeNull())
            modal().querySelector('#startExportBtn').click()
            await vi.waitFor(() => expect(modal().textContent).toContain('1 tracks not found'))
            expect(modal().textContent).toContain('Artist - Five')
        })
    })

    describe('the JSON file', () => {
        let blobs, downloads

        beforeEach(() => {
            blobs = []
            downloads = []
            URL.createObjectURL = vi.fn((blob) => { blobs.push(blob); return 'blob:test' })
            URL.revokeObjectURL = vi.fn()
            vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function () { downloads.push(this.download) })
        })

        it('one playlist: only it is in the file, with the batch name, and the window closes', async () => {
            window_({ playlists: [BATCH[1]], positions: [2] })
            row('json').click()

            expect(document.getElementById('playlist-export-window')).toBeNull()
            expect(downloads[0]).toMatch(/^playlists_Mix_\d{4}-\d{2}-\d{2}\.json$/)
            const written = JSON.parse(await textOf(blobs[0]))
            expect(written.map(item => item.name)).toEqual(['Deep Cuts'])
            expect(written[0].batchName).toBe('Mix')
        })

        it('the whole batch: every playlist is in the file', async () => {
            window_({ playlists: BATCH, positions: [1, 2, 3] })
            row('json').click()

            const written = JSON.parse(await textOf(blobs[0]))
            expect(written.map(item => item.name)).toEqual(['Greatest Hits', 'Deep Cuts', 'B-Sides'])
        })
    })

    describe('the edit screen (nothing given)', () => {
        it('exports the playlists it holds, as it always did', async () => {
            playlistsStore.setPlaylists([{ name: 'Held', title: 'Held', tracks: [track('One')] }], 'sA')
            openPlaylistExport()
            await exportApple()
            await settle()
            await vi.waitFor(() => expect(musicKit.library.length).toBe(1))

            expect(musicKit.library[0].name).toContain('Held')
        })
    })
})
