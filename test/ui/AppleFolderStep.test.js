/**
 * F90 - the folder step before an export to Apple Music: the series' name is selected (the folder the
 * export always used), the folders the library has can be picked, a new name typed, or no folder; the
 * last choice is remembered per series. MusicKit is a double: no Apple Music is ever called here, so
 * the real folder list and the creation in a chosen folder are still to be proven with the owner's account.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

const kit = vi.hoisted(() => ({ service: null }))
vi.mock('../../public/js/services/MusicKitService.js', () => ({ get musicKitService() { return kit.service } }))
vi.mock('../../public/js/services/SpotifyExportService.js', () => ({ SpotifyExportService: { exportPlaylists: vi.fn() } }))
vi.mock('../../public/js/services/SpotifyAuthService.js', () => ({ SpotifyAuthService: { login: vi.fn() } }))
vi.mock('../../public/js/stores/toasts.js', () => {
    const toast = { info: vi.fn(), success: vi.fn(), error: vi.fn(), warning: vi.fn() }
    return { default: toast, toast }
})
vi.mock('../../public/js/utils/isPhone.js', () => ({ isPhone: () => false, onPhoneChange: () => () => { } }))

import { openPlaylistExport, press, settle, typeInto, unmountAll } from '../support/exportWindowHost'
import { readChoice, saveChoice, initialPick, folderForExport } from '../../public/js/models/appleFolderChoice.js'
import { AppleMusicExportService } from '../../public/js/services/AppleMusicExportService.js'
import { exportLedger } from '../../public/js/services/export/exportLedger.js'
import toast from '../../public/js/stores/toasts.js'

const track = (title) => ({ title, artist: 'Artist', album: 'Album' })
const BATCH = [
    { id: 'p1', name: 'Greatest Hits', tracks: [track('One'), track('Two')] },
    { id: 'p2', name: 'Deep Cuts', tracks: [track('Three'), track('Four')] }
]

function fakeMusicKit() {
    const fake = {
        library: [],
        folders: [],
        listError: null,
        init: vi.fn(async () => { }),
        authorize: vi.fn(async () => { }),
        listFolders: vi.fn(async () => { if (fake.listError) throw fake.listError; return fake.folders }),
        createOrGetFolder: vi.fn(async (name) => fake.folders.find(f => f.name.toLowerCase() === name.toLowerCase())?.id || 'folder-new'),
        findTrackFromAlbum: vi.fn(async (title) => ({ id: { One: '101', Two: '102', Three: '103', Four: '104' }[title] })),
        createPlaylistInFolder: vi.fn(async (name, trackIds, folderId) => {
            const playlist = { id: `p.${fake.library.length + 1}`, name, trackIds, folderId }
            fake.library.push(playlist)
            return playlist
        })
    }
    return fake
}

const open = (job = {}) => openPlaylistExport({ seriesName: 'Road trip', batchName: 'Mix', playlists: [BATCH[0]], positions: [1], ...job })
const stepText = () => document.querySelector('[data-apple-folder-step]').textContent.replace(/\s+/g, ' ')
const labels = () => [...document.querySelectorAll('input[name="apple-folder"]')].map(r => r.closest('label').textContent.trim().replace(/\s+/g, ' '))
const checked = () => document.querySelector('input[name="apple-folder"]:checked')
const typedField = () => document.querySelector('[data-folder-name]')
const type = (value) => typeInto(typedField(), value)
const pick = (mode, value) => {
    const radio = [...document.querySelectorAll('input[name="apple-folder"]')].find(r => r.dataset.mode === mode && (value === undefined || r.value === value))
    radio.click() // a pick is a press: React hears a radio by its click
}

describe('the folder step of the Apple Music export (F90)', () => {
    let musicKit

    const toTheStep = async () => {
        document.querySelector('[data-export="apple"]').click()
        await vi.waitFor(() => expect(document.querySelector('[data-apple-folder-step]')).not.toBeNull())
        await settle()
    }
    const pressExport = async () => {
        document.querySelector('[data-apple-export]').click()
        await vi.waitFor(() => expect(musicKit.library.length).toBeGreaterThan(0))
    }

    beforeEach(() => {
        vi.clearAllMocks()
        unmountAll()
        document.body.innerHTML = ''
        localStorage.clear()
        exportLedger.clear()
        musicKit = fakeMusicKit()
        kit.service = musicKit
        vi.spyOn(AppleMusicExportService, 'pause').mockResolvedValue()
        vi.spyOn(console, 'error').mockImplementation(() => { })
    })
    afterEach(() => { unmountAll(); vi.restoreAllMocks() })

    it('the series name is selected and marked as the default: accepting it is one press, in the series folder', async () => {
        open()
        await toTheStep()

        expect(stepText()).toContain('Folder in Apple Music')
        expect(checked().dataset.mode).toBe('series')
        expect(labels()[0]).toBe('Road trip (default)')
        await pressExport()

        expect(musicKit.createOrGetFolder).toHaveBeenCalledWith('Road trip')
        expect(musicKit.createPlaylistInFolder.mock.calls[0][2]).toBe('folder-new')
    })

    it('lists the folders the library has; the one picked is the folder the playlist is created in', async () => {
        musicKit.folders = [{ id: 'f-7', name: 'Road trip' }, { id: 'f-9', name: 'Favorites' }, { id: 'f-3', name: 'Workout' }]
        open()
        await toTheStep()

        expect(labels()).toEqual(['Road trip (default)', 'Favorites', 'Workout', 'New folder', 'No folder (top of the library)'])
        pick('existing', 'Favorites')
        await pressExport()

        expect(musicKit.createPlaylistInFolder.mock.calls[0][2]).toBe('f-9')
        expect(musicKit.createOrGetFolder).not.toHaveBeenCalled() // the id travels: no second lookup by name
    })

    it('the series folder that the library already has is used by its id, with no lookup by name', async () => {
        musicKit.folders = [{ id: 'f-7', name: 'Road trip' }]
        open()
        await toTheStep()
        await pressExport()

        expect(musicKit.createOrGetFolder).not.toHaveBeenCalled()
        expect(musicKit.createPlaylistInFolder.mock.calls[0][2]).toBe('f-7')
    })

    it('while the folders are read it says so, and the series folder can already be exported to', async () => {
        let release
        musicKit.listFolders = vi.fn(() => new Promise(resolve => { release = () => resolve([]) }))
        open()
        document.querySelector('[data-export="apple"]').click()
        await vi.waitFor(() => expect(document.querySelector('[data-apple-folder-step]')).not.toBeNull())

        expect(stepText()).toContain('Reading your Apple Music folders...')
        await pressExport()
        expect(musicKit.createOrGetFolder).toHaveBeenCalledWith('Road trip')
        release()
    })

    it('none exist: it says so in plain words and the series folder stays the default', async () => {
        open()
        await toTheStep()

        expect(stepText()).toContain('You have no folders in Apple Music yet. Export creates the folder you pick.')
        expect(checked().dataset.mode).toBe('series')
    })

    it('the list could not be read: it says so, and the series folder or a typed name still export', async () => {
        musicKit.listError = new Error('offline')
        open()
        await toTheStep()

        expect(stepText()).toContain('Your Apple Music folders could not be read. You can still export to the folder below, or type a folder name.')
        type('Weekend')
        expect(checked().dataset.mode).toBe('new')
        await pressExport()

        expect(musicKit.createOrGetFolder).toHaveBeenCalledWith('Weekend')
    })

    it('a typed name equal to an existing folder, ignoring case, reuses that folder', async () => {
        musicKit.folders = [{ id: 'f-9', name: 'Favorites' }]
        open()
        await toTheStep()
        type('  favorites ')
        await pressExport()

        expect(musicKit.createOrGetFolder).toHaveBeenCalledWith('favorites')
        expect(musicKit.createPlaylistInFolder.mock.calls[0][2]).toBe('f-9')
    })

    it('an empty name, or only spaces, is refused with a plain notice and nothing is created or remembered', async () => {
        open()
        await toTheStep()
        pick('new')
        type('   ')
        document.querySelector('[data-apple-export]').click()
        await settle()

        expect(document.querySelector('[role="alert"]').textContent).toBe('Type a name for the new folder.')
        expect(musicKit.authorize).not.toHaveBeenCalled()
        expect(musicKit.library).toEqual([])
        expect(localStorage.length).toBe(0)
    })

    it('no folder: the playlist is created outside any folder, and no folder is created', async () => {
        open()
        await toTheStep()
        pick('none')
        await pressExport()
        await vi.waitFor(() => expect(toast.success).toHaveBeenCalled())

        expect(musicKit.createOrGetFolder).not.toHaveBeenCalled()
        expect(musicKit.createPlaylistInFolder.mock.calls[0][2]).toBeNull()
        expect(toast.success.mock.calls[0][0]).toContain('outside any folder')
        expect(toast.warning).not.toHaveBeenCalled()
    })

    it('the last choice is remembered per series (key mjrp_apple_music_folder:<series>) and selected next time', async () => {
        musicKit.folders = [{ id: 'f-9', name: 'Favorites' }]
        open()
        await toTheStep()
        pick('existing', 'Favorites')
        await pressExport()

        expect(JSON.parse(localStorage.getItem('mjrp_apple_music_folder:Road trip'))).toEqual({ name: 'Favorites' })
        unmountAll()
        document.body.innerHTML = ''
        open({ playlists: [BATCH[1]], positions: [2] })
        await toTheStep()
        expect(checked().value).toBe('Favorites')

        unmountAll()
        document.body.innerHTML = ''
        open({ playlists: [BATCH[1]], positions: [2], seriesName: 'Another series' })
        await toTheStep()
        expect(checked().dataset.mode).toBe('series') // another series does not inherit it
    })

    it('«no folder» is remembered too, and a stored value that is garbage is ignored', async () => {
        localStorage.setItem('mjrp_apple_music_folder:Road trip', '{"none":true}')
        open()
        await toTheStep()
        expect(checked().dataset.mode).toBe('none')

        unmountAll()
        document.body.innerHTML = ''
        localStorage.setItem('mjrp_apple_music_folder:Road trip', 'not json')
        open()
        await toTheStep()
        expect(checked().dataset.mode).toBe('series')
    })

    it('Back returns to the three destinations; the edit screen opens straight on the step', async () => {
        open()
        await toTheStep()
        press(document.querySelector('[data-folder-back]'))
        expect(document.querySelectorAll('[data-export]').length).toBe(3)

        unmountAll()
        document.body.innerHTML = ''
        openPlaylistExport({ start: 'apple', title: 'Export to Apple Music' })
        await vi.waitFor(() => expect(document.querySelector('[data-apple-folder-step]')).not.toBeNull())
        expect(document.getElementById('playlist-export-window').textContent).toContain('Export to Apple Music')
    })

    it('Spotify and the JSON file ask nothing about a folder', () => {
        open()
        URL.createObjectURL = vi.fn(() => 'blob:test')
        URL.revokeObjectURL = vi.fn()
        vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => { })
        document.querySelector('[data-export="json"]').click()
        expect(document.querySelector('[data-apple-folder-step]')).toBeNull()
        expect(musicKit.listFolders).not.toHaveBeenCalled()
    })
})

describe('the folder step: focus, the typed name, the title, the look (F90 recheck)', () => {
    let musicKit
    const toTheStep = async () => {
        document.querySelector('[data-export="apple"]').click()
        await vi.waitFor(() => expect(document.querySelector('[data-apple-folder-step]')).not.toBeNull())
    }
    beforeEach(() => {
        vi.clearAllMocks()
        unmountAll()
        document.body.innerHTML = ''
        localStorage.clear()
        exportLedger.clear()
        musicKit = fakeMusicKit()
        kit.service = musicKit
        vi.spyOn(console, 'error').mockImplementation(() => { })
    })
    afterEach(() => { unmountAll(); vi.restoreAllMocks() })

    it('the focus stays on the choice it was on when the list of folders arrives', async () => {
        let release
        musicKit.listFolders = vi.fn(() => new Promise(resolve => { release = () => resolve([{ id: 'f-9', name: 'Favorites' }]) }))
        open()
        await toTheStep()
        const none = [...document.querySelectorAll('input[name="apple-folder"]')].find(r => r.dataset.mode === 'none')
        none.focus()
        await vi.waitFor(() => expect(release).toBeTypeOf('function'))
        release()
        await settle()

        expect(document.activeElement.dataset.mode).toBe('none')
    })

    it('focus on the first choice while it loaded stays on a choice (not the page) when the list arrives', async () => {
        musicKit.folders = [{ id: 'f-9', name: 'Favorites' }]
        open()
        await toTheStep()
        expect(document.activeElement.dataset.mode).toBe('series')
        await settle()

        expect(document.activeElement.name).toBe('apple-folder')
        expect(document.activeElement.dataset.mode).toBe('series')
    })

    it('the focus stays in the typed name while the list arrives', async () => {
        let release
        musicKit.listFolders = vi.fn(() => new Promise(resolve => { release = () => resolve([]) }))
        open()
        await toTheStep()
        typedField().focus()
        await vi.waitFor(() => expect(release).toBeTypeOf('function'))
        release()
        await settle()

        expect(document.activeElement).toBe(typedField())
    })

    it('the «New folder» field starts empty when the remembered choice was an existing folder', async () => {
        localStorage.setItem('mjrp_apple_music_folder:Road trip', '{"name":"Favorites"}')
        musicKit.folders = [{ id: 'f-9', name: 'Favorites' }]
        open()
        await toTheStep()
        await settle()

        expect(checked().value).toBe('Favorites')
        expect(typedField().value).toBe('')
    })

    it('the «New folder» field keeps a remembered typed name for this series', async () => {
        localStorage.setItem('mjrp_apple_music_folder:Road trip', '{"name":"Gone"}')
        musicKit.folders = [{ id: 'f-9', name: 'Favorites' }]
        open()
        await toTheStep()
        await settle()

        expect(checked().dataset.mode).toBe('new')
        expect(typedField().value).toBe('Gone')
    })

    it('the title follows what the window shows: opened on the folder step, Back shows the destinations under a title that fits', async () => {
        openPlaylistExport({ start: 'apple', title: 'Export to Apple Music' })
        await vi.waitFor(() => expect(document.querySelector('[data-apple-folder-step]')).not.toBeNull())
        const title = () => document.querySelector('.app-modal__title').textContent
        expect(title()).toBe('Export to Apple Music')

        press(document.querySelector('[data-folder-back]'))
        expect(document.querySelectorAll('[data-export]').length).toBe(3)
        expect(title()).toBe('Export playlists')

        press(document.querySelector('[data-export="apple"]'))
        expect(title()).toBe('Export to Apple Music')
    })

    it('«Export» and «Back» centre their text like the other buttons', async () => {
        open()
        await toTheStep()

        expect(document.querySelector('[data-apple-export]').className).toContain('justify-center')
        expect(document.querySelector('[data-folder-back]').className).toContain('justify-center')
    })

    it('the window on the computer keeps Tab inside, round in both directions', async () => {
        open()
        const modal = document.getElementById('playlist-export-window')
        const inside = [...modal.querySelectorAll('button:not([disabled])')]
        inside[inside.length - 1].focus()
        const tab = (shiftKey) => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', shiftKey, bubbles: true, cancelable: true }))
        tab(false)
        expect(document.activeElement).toBe(inside[0])
        tab(true)
        expect(document.activeElement).toBe(inside[inside.length - 1])
    })
})

describe('the memory of the folder choice', () => {
    const broken = { getItem: () => { throw new Error('blocked') }, setItem: () => { throw new Error('blocked') } }

    it('forgets without failing when the storage is blocked', () => {
        expect(readChoice('S', broken)).toBeNull()
        expect(() => saveChoice('S', { name: 'X' }, broken)).not.toThrow()
    })

    it('starts from a remembered name that the library no longer has as a typed new folder', () => {
        expect(initialPick({ seriesName: 'S', folders: [], remembered: { name: 'Gone' } })).toEqual({ mode: 'new', name: 'Gone' })
        expect(folderForExport({ mode: 'new', name: ' Gone ' })).toEqual({ ok: true, folderName: 'Gone' })
    })
})
