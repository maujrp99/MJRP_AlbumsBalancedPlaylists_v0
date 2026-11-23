/**
 * F90 (ported in F83 sync 2; TASK-08 of F90): the saved playlists screen exports without «Edit Batch»: an «Export» on each playlist of
 * an open batch (only that playlist) and on the batch, beside «Edit» (all its playlists). Both open the window the edit screen opens
 * (ui/PlaylistExportWindow.tsx, a double here: its own behaviour is in test/ui/PlaylistExportWindow.test.js). Nothing is saved or
 * changed by exporting. Taken over from the test of the hand-made screen on `main` (test/views/SavedPlaylistsView.export.test.js):
 * the scaffold changes, not what each test asserts.
 */
import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest'

vi.mock('../../../public/js/services/playlists/savedPlaylistsReading.js', () => ({ savedPlaylistsReader: {}, savedPlaylistsStore: {} }))
vi.mock('../../../public/js/ui/dialogs/dialogs', () => ({ dialogService: { confirm: vi.fn(() => Promise.resolve(false)) } }))
const exportWindow = vi.hoisted(() => ({ open: vi.fn() }))
vi.mock('../../../public/js/ui/PlaylistExportWindow', () => ({ usePlaylistExport: () => ({ open: exportWindow.open, layer: null }) }))

import { SavedPlaylists } from '../../../public/js/screens/saved-playlists/SavedPlaylists'
import { SavedPlaylistsController } from '../../../public/js/controllers/SavedPlaylistsController.js'
import { SavedPlaylistsStore } from '../../../public/js/stores/savedPlaylists.js'
import { SeriesPlaylistsStatus as Status, groupIntoBatches } from '../../../public/js/models/savedPlaylists.js'
import { renderScreen, type RenderedScreen } from '../../support/renderScreen'
import { asPhone, quietTheRouter } from '../../support/savedPlaylistsScenarios.js'

const track = (title: string) => ({ title, artist: 'Artist', album: 'Album', duration: 180 })
const playlist = (id: string, batchName: string) => ({ id, name: `Playlist ${id}`, batchName, savedAt: '2026-11-01T10:00:00Z', tracks: [track('Song')] })
const PLAYLISTS = [playlist('p1', 'Batch A'), playlist('p2', 'Batch A'), playlist('p3', 'Batch A')]

interface Job { playlists: Array<{ id: string }>; positions: number[]; seriesName: string; batchName: string; title: string; opener?: HTMLElement }

describe('exporting from the saved playlists screen (F90)', () => {
    let rendered: RenderedScreen
    let store: SavedPlaylistsStore
    const app = () => rendered.app
    const one = (selector: string) => app().querySelector(selector) as HTMLElement
    const tap = (element: Element) => rendered.act(() => { (element as HTMLElement).click() })
    const jobOf = (): Job => (exportWindow.open as Mock).mock.calls[0][0]

    const open = async (phone: boolean) => {
        asPhone(phone)
        quietTheRouter()
        store = new SavedPlaylistsStore()
        const reader = { load: vi.fn(() => new Promise(() => {})), refreshSeries: vi.fn(), removeBatch: vi.fn(), removeAll: vi.fn() }
        const controller = new SavedPlaylistsController({ reader, store })
        rendered = await renderScreen(SavedPlaylists, { controller }, { screen: 'saved_playlists' })
        await rendered.act(() => {
            store.begin(1, 'u1')
            store.setSeries([{
                seriesId: 's1', series: { id: 's1', name: 'Plant', updatedAt: '2026-11-01T00:00:00Z' }, status: Status.READY,
                playlists: PLAYLISTS, batches: groupIntoBatches(PLAYLISTS), thumbnails: [], error: null, refreshing: false
            }])
            store.flush()
        })
    }

    beforeEach(() => { vi.clearAllMocks() })
    afterEach(async () => {
        await rendered.leave()
        document.body.innerHTML = ''
    })

    describe('on the computer', () => {
        beforeEach(async () => { await open(false) })

        it('the batch has «Export» beside «Edit Batch», and it exports all its playlists', async () => {
            const buttons = [...app().querySelectorAll('.batch-card-buttons button')].map(button => button.getAttribute('aria-label'))
            expect(buttons).toEqual(['Edit batch Batch A', 'Export batch Batch A', 'Delete batch Batch A'])

            await tap(one('[aria-label="Export batch Batch A"]'))

            expect(exportWindow.open).toHaveBeenCalledTimes(1)
            const job = jobOf()
            expect(job.playlists.map(item => item.id)).toEqual(['p1', 'p2', 'p3'])
            expect(job.positions).toEqual([1, 2, 3])
            expect(job.seriesName).toBe('Plant')
            expect(job.batchName).toBe('Batch A')
            expect(job.title).toBe('Export Batch A')
        })

        it('clicking «Export» on the batch does not open or close the batch', async () => {
            const card = one('.batch-group-card')
            await tap(one('[aria-label="Export batch Batch A"]'))
            expect(card.dataset.collapsed).toBe('true')
        })

        it('each playlist of an open batch has «Export <name>», and it exports only that one, with its place in the batch', async () => {
            await tap(one('.batch-header'))

            const exports = [...app().querySelectorAll('.playlist-row [aria-label^="Export "]')]
            expect(exports.map(button => button.getAttribute('aria-label'))).toEqual(['Export Playlist p1', 'Export Playlist p2', 'Export Playlist p3'])

            await tap(exports[1])

            const job = jobOf()
            expect(job.playlists.map(item => item.id)).toEqual(['p2'])
            expect(job.positions).toEqual([2])
            expect(job.seriesName).toBe('Plant')
            expect(job.batchName).toBe('Batch A')
            expect(job.title).toBe('Export Playlist p2')
        })

        it('exporting does not open the tracks of the playlist and changes nothing in the list', async () => {
            await tap(one('.batch-header'))
            const before = JSON.stringify(PLAYLISTS)

            await tap(one('.playlist-row [aria-label="Export Playlist p1"]'))

            expect(app().querySelector('.playlist-tracks-list:not(.hidden)')).toBeNull()
            expect(JSON.stringify(PLAYLISTS)).toBe(before)
        })
    })

    describe('on the phone', () => {
        beforeEach(async () => {
            await open(true)
            await tap(one('.saved-series-toggle')) // the series opens
            await tap(one('.saved-phone-batch__main')) // the batch opens
        })

        it('each playlist row has an «Export <name>» target of its own, a button beside the row and not inside it', async () => {
            const exports = [...app().querySelectorAll('.saved-phone-playlist-head [aria-label^="Export "]')]
            expect(exports.map(button => button.getAttribute('aria-label'))).toEqual(['Export Playlist p1', 'Export Playlist p2', 'Export Playlist p3'])
            expect(exports[0].closest('.saved-phone-playlist')).toBeNull()
            expect(exports[0].tagName).toBe('BUTTON')

            await tap(exports[2])

            const job = jobOf()
            expect(job.playlists.map(item => item.id)).toEqual(['p3'])
            expect(job.positions).toEqual([3])
            expect(job.opener).toBe(exports[2])
        })

        it('the «⋯» of the batch has «Export» beside «Edit batch», before «Delete batch»', async () => {
            const more = one('[aria-label="Actions for batch Batch A"]')
            await tap(more)

            const labels = [...document.querySelectorAll('.sheet .albums-sheet__label')].map(item => item.textContent!.trim())
            expect(labels).toEqual(['Edit batch', 'Export', 'Delete batch'])

            const exportRow = [...document.querySelectorAll('.sheet .albums-sheet__row')].find(item => item.textContent!.trim() === 'Export')!
            await tap(exportRow)

            const job = jobOf()
            expect(job.playlists.map(item => item.id)).toEqual(['p1', 'p2', 'p3'])
            expect(job.positions).toEqual([1, 2, 3])
            expect(job.opener).toBe(more) // the sheet that held the «⋯» is gone by then: the «⋯» gets the focus back
        })
    })
})
