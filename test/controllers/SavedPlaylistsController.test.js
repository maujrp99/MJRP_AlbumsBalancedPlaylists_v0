/**
 * F61 - SavedPlaylistsController: it asks the reader and hands the screen what the store holds.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../public/js/services/playlists/savedPlaylistsReading.js', () => ({
    savedPlaylistsReader: {},
    savedPlaylistsStore: {}
}))
vi.mock('../../public/js/stores/toasts.js', () => ({
    default: { success: vi.fn(), error: vi.fn() }
}))

import toast from '../../public/js/stores/toasts.js'
import { SavedPlaylistsController } from '../../public/js/controllers/SavedPlaylistsController.js'
import { SavedPlaylistsStore } from '../../public/js/stores/savedPlaylists.js'
import { ListStatus, SeriesPlaylistsStatus as Status } from '../../public/js/models/savedPlaylists.js'

const entry = (id, status, playlists = null) => ({
    seriesId: id, series: { id, name: id }, status, playlists, batches: [], thumbnails: [], error: null, refreshing: false
})

describe('SavedPlaylistsController', () => {
    let store, reader, controller

    beforeEach(() => {
        vi.clearAllMocks()
        store = new SavedPlaylistsStore()
        reader = {
            load: vi.fn(() => Promise.resolve()),
            refreshSeries: vi.fn(() => Promise.resolve()),
            removeBatch: vi.fn(() => Promise.resolve(2)),
            removeAll: vi.fn(() => Promise.resolve(3))
        }
        controller = new SavedPlaylistsController({ reader, store })
    })

    it('open joins or starts the read; reload starts over; retry reads one series', () => {
        controller.open()
        controller.reload()
        controller.retrySeries('s1')

        expect(reader.load.mock.calls).toEqual([[], [{ fresh: true }]])
        expect(reader.refreshSeries).toHaveBeenCalledWith('s1')
    })

    it('the list is the series with playlists or with a failure, in the order of the store', () => {
        store.begin(1, 'u1')
        store.setSeries([
            entry('s1', Status.LOADING),
            entry('s2', Status.READY, [{ id: 'p1' }]),
            entry('s3', Status.EMPTY, []),
            entry('s4', Status.FAILED)
        ])

        const list = controller.getList()

        expect(list.groups.map(group => group.seriesId)).toEqual(['s2', 's4'])
        expect(list).toMatchObject({ status: ListStatus.READY, busy: true, error: null })
        expect(list.summary).toMatchObject({ total: 4, loading: 1, settled: 3 })
    })

    it('it is the first load until the list of series arrives', () => {
        expect(controller.isFirstLoad()).toBe(true)
        store.begin(1, 'u1')
        expect(controller.isFirstLoad()).toBe(true)

        store.setSeries([entry('s1', Status.LOADING)])
        expect(controller.isFirstLoad()).toBe(false)

        store.begin(2, 'u1') // coming back: the list is already there
        expect(controller.isFirstLoad()).toBe(false)
    })

    it('finds a playlist on the list by series and id', () => {
        store.begin(1, 'u1')
        store.setSeries([entry('s2', Status.READY, [{ id: 'p1', name: 'One' }])])

        expect(controller.findPlaylist('s2', 'p1')).toEqual({ id: 'p1', name: 'One' })
        expect(controller.findPlaylist('s2', 'nope')).toBeNull()
        expect(controller.findPlaylist('gone', 'p1')).toBeNull()
    })

    it('tells the screen when the store changes, until it stops listening', () => {
        const listener = vi.fn()
        const stop = controller.subscribe(listener)

        store.begin(1, 'u1')
        store.flush()
        stop()
        store.begin(2, 'u1')
        store.flush()

        expect(listener).toHaveBeenCalledTimes(1)
    })

    it('deleting a batch goes through the reader and reads nothing else', async () => {
        await expect(controller.deleteBatch('s1', 'Batch A')).resolves.toBe(true)

        expect(reader.removeBatch).toHaveBeenCalledWith('s1', 'Batch A')
        expect(reader.load).not.toHaveBeenCalled()
        expect(toast.success).toHaveBeenCalledWith('Deleted batch: Batch A')
    })

    it('a delete that fails says so and returns false', async () => {
        reader.removeBatch.mockRejectedValueOnce(new Error('write refused'))
        reader.removeAll.mockRejectedValueOnce(new Error('write refused'))

        await expect(controller.deleteBatch('s1', 'Batch A')).resolves.toBe(false)
        await expect(controller.deleteAllPlaylists('s1', 'Plant')).resolves.toBe(false)

        expect(toast.error.mock.calls).toEqual([['Failed to delete batch'], ['Failed to delete playlists']])
    })

    it('deleting all the playlists of a series goes through the reader', async () => {
        await expect(controller.deleteAllPlaylists('s1', 'Plant')).resolves.toBe(true)

        expect(reader.removeAll).toHaveBeenCalledWith('s1')
        expect(toast.success).toHaveBeenCalledWith('Deleted playlists for Plant')
    })
})
