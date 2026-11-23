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
vi.mock('../../public/js/stores/toasts.js', () => {
    const toast = { info: vi.fn(), success: vi.fn(), error: vi.fn(), warning: vi.fn() }
    return { default: toast, toast }
})
vi.mock('../../public/js/utils/isPhone.js', () => ({ isPhone: () => kit.phone, onPhoneChange: () => () => { } }))

import { DESTINATIONS } from '../../public/js/ui/PlaylistExportWindow'
import { openPlaylistExport, settle, unmountAll } from '../support/exportWindowHost'
import { AppleMusicExportService } from '../../public/js/services/AppleMusicExportService.js'
import { SpotifyExportService } from '../../public/js/services/SpotifyExportService.js'
import { SpotifyAuthService } from '../../public/js/services/SpotifyAuthService.js'
import { exportLedger } from '../../public/js/services/export/exportLedger.js'
import { playlistsStore } from '../../public/js/stores/playlists.js'
import toast from '../../public/js/stores/toasts.js'
import { setLocale, PREVIEW_KEY } from '../../public/js/i18n/t.js'

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
        searchFails: {},        // title -> the error its search throws (F98)
        findTrackFromAlbum: vi.fn(async (title) => {
            if (fake.searchFails[title]) throw fake.searchFails[title]
            return fake.catalog[title] ? { id: fake.catalog[title] } : null
        }),
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
/** The report of the Apple Music export, drawn in the window (F98). */
const appleReport = () => document.querySelector('[data-apple-report]')
const reportText = () => appleReport().textContent.replace(/\s+/g, ' ')
const reported = () => vi.waitFor(() => expect(appleReport()).not.toBeNull())
const textOf = (blob) => new Promise((resolve) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.readAsText(blob) })

describe('the export window (F90)', () => {
    let musicKit

    beforeEach(() => {
        vi.clearAllMocks()
        unmountAll()
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
    afterEach(() => { unmountAll(); vi.restoreAllMocks() })

    describe('the destinations', () => {
        it('are Apple Music, Spotify, the JSON file, in that order, on the computer and on the phone', () => {
            expect(DESTINATIONS.map(destination => destination.id)).toEqual(['apple', 'spotify', 'json'])

            window_({ playlists: BATCH })
            expect(rows().map(button => button.textContent.trim())).toEqual(['Export to Apple Music', 'Export to Spotify', 'Download JSON'])
            unmountAll()
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

    describe('on the phone, the focus goes back to what opened the window', () => {
        it('the opener given (the «⋯» that a sheet already closed on) gets the focus back on Escape and on Back-less close', () => {
            kit.phone = true
            const opener = document.createElement('button')
            document.body.appendChild(opener)

            window_({ playlists: BATCH, opener })
            document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))

            expect(document.querySelector('.sheet')?.classList.contains('sheet--closing') ?? true).toBe(true)
            expect(document.activeElement).toBe(opener)
        })

        it('the opener given on the computer gets the focus back too', () => {
            const opener = document.createElement('button')
            document.body.appendChild(opener)

            window_({ playlists: BATCH, opener })
            document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))

            expect(document.activeElement).toBe(opener)
        })
    })

    describe('Apple Music', () => {
        it('one playlist: the folder of the series is used and only that playlist is created, named as the batch export names it', async () => {
            window_({ playlists: [BATCH[1]], positions: [2] })
            await exportApple()
            await reported()

            expect(musicKit.createOrGetFolder).toHaveBeenCalledWith(SERIES)
            expect(names(musicKit.library)).toEqual(['2. Mix - Deep Cuts'])
            expect(musicKit.library[0].folderId).toBe('folder-1')
            expect(reportText()).toContain('Export complete')
            expect(reportText()).toContain('Created (1)')
            expect(reportText()).toContain('2. Mix - Deep Cuts')
            expect(reportText()).toContain('In the folder "Road trip"')
        })

        it('the whole batch: every playlist is created, in the folder, in the order of the batch', async () => {
            window_({ playlists: BATCH, positions: [1, 2, 3] })
            await exportApple()
            await reported()

            expect(names(musicKit.library)).toEqual(['1. Mix - Greatest Hits', '2. Mix - Deep Cuts'])
            expect(reportText()).toContain('Created (2)')
        })

        it('one playlist and then the whole batch does not create the first one twice', async () => {
            window_({ playlists: [BATCH[1]], positions: [2] })
            await exportApple()
            await reported()

            unmountAll()
        document.body.innerHTML = ''
            window_({ playlists: BATCH, positions: [1, 2, 3] })
            await exportApple()
            await reported()

            expect(names(musicKit.library)).toEqual(['2. Mix - Deep Cuts', '1. Mix - Greatest Hits'])
            expect(reportText()).toContain('(already exported in this session, not created again)')
        })

        it('the progress is written on the «Export» button, which waits; the window stays open and ends on the report', async () => {
            let release
            musicKit.createOrGetFolder = vi.fn(() => new Promise(resolve => { release = () => resolve('folder-1') }))
            window_({ playlists: [BATCH[0]], positions: [1] })
            await stepOf()
            const button = document.querySelector('[data-apple-export]')
            button.click()
            await vi.waitFor(() => expect(button.textContent).toContain('Creating folder'))
            expect(button.disabled).toBe(true)

            release()
            await reported()
            expect(document.querySelector('[data-apple-export]')).toBeNull()
            expect(document.getElementById('playlist-export-window')).not.toBeNull()
        })

        it('not connected: the prompt to connect is MusicKit\'s, and the refusal is told, nothing is created', async () => {
            musicKit.authorizeError = new Error('User not authorized')
            window_({ playlists: [BATCH[0]], positions: [1] })
            await exportApple()
            await reported()

            expect(musicKit.authorize).toHaveBeenCalledTimes(1)
            expect(reportText()).toContain('Export failed')
            expect(reportText()).toContain('Apple Music was not authorized, so nothing was exported.')
            expect(musicKit.library).toEqual([])
        })

        it('failed: Apple Music refusing the playlist is told with the reason', async () => {
            musicKit.createPlaylistInFolder = vi.fn(async () => { throw new Error('Apple Music said no') })
            window_({ playlists: [BATCH[0]], positions: [1] })
            await exportApple()
            await reported()

            expect(reportText()).toContain('Apple Music did not create (1)')
            expect(reportText()).toContain('1. Mix - Greatest Hits: Apple Music said no')
        })

        it('a playlist with tracks the service could not match: it is created without them, and they are named', async () => {
            window_({ playlists: [{ id: 'p4', name: 'Mixed', tracks: [track('One'), track('Five')] }], positions: [4] })
            await exportApple()
            await reported()

            expect(musicKit.library[0].trackIds).toEqual(['101'])
            expect(reportText()).toContain('1 track not found')
            expect(reportText()).toContain('Artist - Five')
        })

        it('exporting changes nothing of the batch it was given, and writes nothing on the edit screen', async () => {
            const before = JSON.stringify(BATCH)
            window_({ playlists: BATCH, positions: [1, 2, 3] })
            await exportApple()
            await reported()

            expect(JSON.stringify(BATCH)).toBe(before)
            expect(playlistsStore.getPlaylists()).toEqual([])
        })

        it('the report takes the place of the notices: nothing is said twice', async () => {
            window_({ playlists: [BATCH[0]], positions: [1] })
            await exportApple()
            await reported()

            for (const type of ['success', 'info', 'warning', 'error']) expect(toast[type]).not.toHaveBeenCalled()
        })

        it('the window closed while the export runs: the end is still told, in a notice', async () => {
            let release
            musicKit.createOrGetFolder = vi.fn(() => new Promise(resolve => { release = () => resolve('folder-1') }))
            window_({ playlists: [BATCH[0]], positions: [1] })
            await exportApple()
            await vi.waitFor(() => expect(musicKit.createOrGetFolder).toHaveBeenCalled())
            document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
            expect(document.getElementById('playlist-export-window')).toBeNull()

            release()
            await vi.waitFor(() => expect(toast.success).toHaveBeenCalled())
            expect(toast.success.mock.calls[0][0]).toBe('1 playlist exported to Apple Music.')
        })
    })

    describe('Apple Music says why it failed (F98, UAT-307)', () => {
        const down = () => Object.assign(new Error('Search unavailable'), { status: 500 })
        const refusal = () => Object.assign(new Error('Forbidden'), { status: 403 })
        const heading = () => appleReport().querySelector('[data-export-heading]')
        const retry = () => appleReport().querySelector('[data-apple-retry]')
        const NOT_FOUND = /not found|No track found/i
        const inPortuguese = async () => { localStorage.setItem(PREVIEW_KEY, 'pt'); expect(await setLocale('pt')).toBe(true) }

        afterEach(async () => { await setLocale('en'); localStorage.removeItem(PREVIEW_KEY) })

        it('every search failing: «could not be checked», counted, with «Try again», and never «not found» (REQ-01, REQ-03)', async () => {
            musicKit.searchFails.One = down()
            musicKit.searchFails.Two = down()
            window_({ playlists: [BATCH[0]], positions: [1] })
            await exportApple()
            await reported()

            expect(heading().textContent).toBe('Export failed')
            expect(reportText()).toContain('Apple Music could not be reached, so your tracks could not be checked. Nothing was created.')
            expect(reportText()).toContain('2 tracks could not be checked')
            expect(reportText()).toContain('Artist - One')
            expect(reportText()).not.toMatch(NOT_FOUND)
            expect(retry()).not.toBeNull()
            expect(musicKit.library).toEqual([])
        })

        it('«Try again», with Apple Music back, exports to the same folder and ends on a complete report', async () => {
            musicKit.searchFails.One = down()
            musicKit.searchFails.Two = down()
            window_({ playlists: [BATCH[0]], positions: [1] })
            await exportApple()
            await reported()

            musicKit.searchFails = {}
            retry().click()
            await vi.waitFor(() => expect(heading().textContent).toBe('Export complete'))

            expect(names(musicKit.library)).toEqual(['1. Mix - Greatest Hits'])
            expect(musicKit.library[0].folderId).toBe('folder-1')
            expect(retry()).toBeNull()
        })

        it('a mix: created with what was found, the unchecked apart from the not found, and no heading of success (REQ-04)', async () => {
            musicKit.searchFails.Two = down()
            window_({ playlists: [{ id: 'p5', name: 'Mixed', tracks: [track('One'), track('Two'), track('Five')] }], positions: [5] })
            await exportApple()
            await reported()

            expect(musicKit.library[0].trackIds).toEqual(['101'])
            expect(heading().textContent).toBe('Exported, with something left out')
            expect(reportText()).not.toContain('Export complete')
            expect(reportText()).toContain('1 track not found')
            expect(reportText()).toContain('1 track could not be checked')
            const lists = [...appleReport().querySelectorAll('details')].map(box => box.textContent.replace(/\s+/g, ' '))
            expect(lists.find(list => list.includes('could not be checked'))).toContain('Artist - Two')
            expect(lists.find(list => list.includes('not found'))).not.toContain('Artist - Two')
            expect(retry()).not.toBeNull()
            expect(reportText()).toContain('A playlist that gets more tracks this time is created as a new one')
        })

        it('Apple Music refuses the person (403): said plainly, with the next step, and never «not found» (REQ-02)', async () => {
            musicKit.searchFails.One = refusal()
            window_({ playlists: [BATCH[0]], positions: [1] })
            await exportApple()
            await reported()

            expect(heading().textContent).toBe('Export failed')
            expect(reportText()).toContain('Apple Music did not allow this for your account')
            expect(reportText()).toContain('Check that your Apple Music subscription is active')
            expect(reportText()).toContain('connect again')
            expect(reportText()).not.toMatch(NOT_FOUND)
            expect(reportText()).toContain('Not created (1)')
        })

        it('the catalogue answered and has none of the tracks: that, and only that, is «not found»', async () => {
            window_({ playlists: [BATCH[2]], positions: [3] })
            await exportApple()
            await reported()

            expect(heading().textContent).toBe('Export failed')
            expect(reportText()).toContain('None of the tracks was found in Apple Music. Nothing was created.')
            expect(reportText()).toContain('1 track not found')
            expect(reportText()).not.toContain('could not be checked')
            expect(retry()).toBeNull()
        })

        it('the result is a status region and its heading takes the focus (REQ-08)', async () => {
            window_({ playlists: [BATCH[0]], positions: [1] })
            await exportApple()
            await reported()

            expect(heading().closest('[role="status"]').getAttribute('aria-live')).toBe('polite')
            expect(document.activeElement).toBe(heading())
        })

        it('«Close» on the report closes the window', async () => {
            window_({ playlists: [BATCH[0]], positions: [1] })
            await exportApple()
            await reported()

            appleReport().querySelector('[data-apple-report-close]').click()
            expect(document.getElementById('playlist-export-window')).toBeNull()
        })

        it('on the phone the report is drawn in the sheet', async () => {
            kit.phone = true
            musicKit.searchFails.One = down()
            musicKit.searchFails.Two = down()
            window_({ playlists: [BATCH[0]], positions: [1] })
            await exportApple()
            await reported()

            expect(appleReport().closest('.sheet')).not.toBeNull()
            expect(reportText()).toContain('2 tracks could not be checked')
        })

        it('in Portuguese: the progress, the failure and the next step (UAT-308, REQ-06)', async () => {
            await inPortuguese()
            let release
            musicKit.searchFails.One = down()
            musicKit.searchFails.Two = down()
            musicKit.createOrGetFolder = vi.fn(() => new Promise(resolve => { release = () => resolve('folder-1') }))
            window_({ playlists: [BATCH[0]], positions: [1] })
            await stepOf()
            const button = document.querySelector('[data-apple-export]')
            button.click()
            await vi.waitFor(() => expect(button.textContent).toContain('Criando a pasta...'))

            release()
            await reported()
            expect(heading().textContent).toBe('A exportação falhou')
            expect(reportText()).toContain('Não foi possível falar com o Apple Music, então as suas faixas não puderam ser conferidas. Nada foi criado.')
            expect(reportText()).toContain('2 faixas não puderam ser conferidas')
            expect(retry().textContent).toContain('Tentar de novo')
            expect(reportText()).not.toMatch(/could not|Try again|not found/i)
        })

        it('the refusal, in Portuguese', async () => {
            await inPortuguese()
            musicKit.searchFails.One = refusal()
            window_({ playlists: [BATCH[0]], positions: [1] })
            await exportApple()
            await reported()

            expect(reportText()).toContain('O Apple Music não permitiu isto para a sua conta')
            expect(reportText()).toContain('Confira se a sua assinatura do Apple Music está ativa')
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
            SpotifyExportService.exportPlaylists.mockResolvedValue(spotifyReport({ failure: { kind: 'reconnect' }, notCreated: ['Road trip - Greatest Hits'] }))
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
                callbacks.onProgress('MATCHING', 1, 2, { title: 'One' })
                await new Promise(resolve => { finish = resolve })
                return spotifyReport({ failure: { kind: 'error', detail: null } })
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
            await vi.waitFor(() => expect(modal().textContent).toContain('1 track not found'))
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
            await vi.waitFor(() => expect(blobs.length).toBe(1)) // the file is made once the hand-made export module is loaded
            expect(downloads[0]).toMatch(/^playlists_Mix_\d{4}-\d{2}-\d{2}\.json$/)
            const written = JSON.parse(await textOf(blobs[0]))
            expect(written.map(item => item.name)).toEqual(['Deep Cuts'])
            expect(written[0].batchName).toBe('Mix')
        })

        it('the whole batch: every playlist is in the file', async () => {
            window_({ playlists: BATCH, positions: [1, 2, 3] })
            row('json').click()
            await vi.waitFor(() => expect(blobs.length).toBe(1))

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
