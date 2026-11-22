/**
 * F90 - the saved playlists screen exports without «Edit Batch»: an «Export» on each playlist of an
 * open batch (only that playlist) and on the batch, beside «Edit» (all its playlists). Both open the
 * window the edit screen opens (views/playlists/PlaylistExportWindow.js, a double here: its own
 * behaviour is in PlaylistExportWindow.test.js). Nothing is saved or changed by exporting.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const state = vi.hoisted(() => ({ phone: false }))
vi.mock('../../public/js/services/playlists/savedPlaylistsReading.js', () => ({ savedPlaylistsReader: {}, savedPlaylistsStore: {} }))
vi.mock('../../public/js/views/playlists/PlaylistExportWindow.js', () => ({ openPlaylistExport: vi.fn() }))
vi.mock('../../public/js/utils/isPhone.js', () => ({ isPhone: () => state.phone, onPhoneChange: () => () => { } }))

import { SavedPlaylistsView } from '../../public/js/views/SavedPlaylistsView.js'
import { SavedPlaylistsController } from '../../public/js/components/playlists/SavedPlaylistsController.js'
import { SavedPlaylistsStore } from '../../public/js/stores/savedPlaylists.js'
import { SeriesPlaylistsStatus as Status, groupIntoBatches } from '../../public/js/models/savedPlaylists.js'
import { openPlaylistExport } from '../../public/js/views/playlists/PlaylistExportWindow.js'

const track = (title) => ({ title, artist: 'Artist', album: 'Album', duration: 180 })
const playlist = (id, batchName) => ({ id, name: `Playlist ${id}`, batchName, savedAt: '2026-11-01T10:00:00Z', tracks: [track('Song')] })
const PLAYLISTS = [playlist('p1', 'Batch A'), playlist('p2', 'Batch A'), playlist('p3', 'Batch A')]

describe('exporting from the saved playlists screen (F90)', () => {
    let app, view, store

    const open = async () => {
        app.appendChild(view.render())
        await view.mount()
    }
    const load = () => {
        store.begin(1, 'u1')
        store.setSeries([{
            seriesId: 's1', series: { id: 's1', name: 'Plant', updatedAt: '2026-11-01T00:00:00Z' }, status: Status.READY,
            playlists: PLAYLISTS, batches: groupIntoBatches(PLAYLISTS), thumbnails: [], error: null, refreshing: false
        }])
        store.flush()
    }

    beforeEach(() => {
        vi.clearAllMocks()
        state.phone = false
        app = document.createElement('div')
        app.id = 'app'
        document.body.appendChild(app)
        store = new SavedPlaylistsStore()
        view = new SavedPlaylistsView()
        view.controller = new SavedPlaylistsController(view, {
            reader: { load: vi.fn(() => new Promise(() => { })), refreshSeries: vi.fn(), removeBatch: vi.fn(), removeAll: vi.fn() },
            store
        })
    })
    afterEach(() => {
        view.destroy()
        app.remove()
    })

    describe('on the computer', () => {
        beforeEach(async () => {
            await open()
            load()
        })

        it('the batch has «Export» beside «Edit Batch», and it exports all its playlists', () => {
            const buttons = [...app.querySelectorAll('.batch-card-buttons button')].map(button => button.getAttribute('aria-label'))
            expect(buttons).toEqual(['Edit batch Batch A', 'Export batch Batch A', 'Delete batch Batch A'])

            app.querySelector('[aria-label="Export batch Batch A"]').click()

            expect(openPlaylistExport).toHaveBeenCalledTimes(1)
            const job = openPlaylistExport.mock.calls[0][0]
            expect(job.playlists.map(item => item.id)).toEqual(['p1', 'p2', 'p3'])
            expect(job.positions).toEqual([1, 2, 3])
            expect(job.seriesName).toBe('Plant')
            expect(job.batchName).toBe('Batch A')
        })

        it('clicking «Export» on the batch does not open or close the batch', () => {
            const card = app.querySelector('.batch-group-card')
            app.querySelector('[aria-label="Export batch Batch A"]').click()
            expect(card.dataset.collapsed).toBe('true')
        })

        it('each playlist of an open batch has «Export <name>», and it exports only that one, with its place in the batch', () => {
            app.querySelector('.batch-header').click()

            const exports = [...app.querySelectorAll('.playlist-row [aria-label^="Export "]')]
            expect(exports.map(button => button.getAttribute('aria-label'))).toEqual(['Export Playlist p1', 'Export Playlist p2', 'Export Playlist p3'])

            exports[1].click()

            const job = openPlaylistExport.mock.calls[0][0]
            expect(job.playlists.map(item => item.id)).toEqual(['p2'])
            expect(job.positions).toEqual([2])
            expect(job.seriesName).toBe('Plant')
            expect(job.batchName).toBe('Batch A')
            expect(job.title).toBe('Export Playlist p2')
        })

        it('exporting does not open the tracks of the playlist and changes nothing in the list', () => {
            app.querySelector('.batch-header').click()
            const before = JSON.stringify(store.getList?.() ?? PLAYLISTS)

            app.querySelector('.playlist-row [aria-label="Export Playlist p1"]').click()

            expect(app.querySelector('.playlist-tracks-list:not(.hidden)')).toBeNull()
            expect(JSON.stringify(store.getList?.() ?? PLAYLISTS)).toBe(before)
        })
    })

    describe('on the phone', () => {
        beforeEach(async () => {
            state.phone = true
            await open()
            load()
            app.querySelector('.saved-series-toggle').click() // the series opens
            app.querySelector('.saved-phone-batch__main').click() // the batch opens
        })

        it('each playlist row has an «Export <name>» target of its own, a button beside the row and not inside it', () => {
            const exports = [...app.querySelectorAll('.saved-phone-playlist-head [aria-label^="Export "]')]
            expect(exports.map(button => button.getAttribute('aria-label'))).toEqual(['Export Playlist p1', 'Export Playlist p2', 'Export Playlist p3'])
            expect(exports[0].closest('.saved-phone-playlist')).toBeNull()
            expect(exports[0].tagName).toBe('BUTTON')

            exports[2].click()

            const job = openPlaylistExport.mock.calls[0][0]
            expect(job.playlists.map(item => item.id)).toEqual(['p3'])
            expect(job.positions).toEqual([3])
        })

        it('the «⋯» of the batch has «Export» beside «Edit batch», before «Delete batch»', () => {
            app.querySelector('[aria-label="Actions for batch Batch A"]').click()

            const labels = [...document.querySelectorAll('.sheet .albums-sheet__label')].map(item => item.textContent.trim())
            expect(labels).toEqual(['Edit batch', 'Export', 'Delete batch'])

            const exportRow = [...document.querySelectorAll('.sheet .albums-sheet__row')].find(item => item.textContent.trim() === 'Export')
            exportRow.click()

            const job = openPlaylistExport.mock.calls[0][0]
            expect(job.playlists.map(item => item.id)).toEqual(['p1', 'p2', 'p3'])
            expect(job.positions).toEqual([1, 2, 3])
        })
    })
})
