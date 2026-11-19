/**
 * F60 - the save rule of PlaylistsService, without a screen and without Firestore: the repository
 * is a double that records what it was asked to write.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { PlaylistsService } from '../../public/js/services/PlaylistsService.js'
import { playlistsStore } from '../../public/js/stores/playlists.js'

const storage = { save: vi.fn(), load: vi.fn(() => null), remove: vi.fn() }
const history = {
    createSnapshot: vi.fn(), undo: vi.fn(), redo: vi.fn(), clear: vi.fn(),
    getStats: vi.fn(() => ({ canUndo: false, canRedo: false }))
}

describe('PlaylistsService.saveCurrentBatch (F60)', () => {
    let service, repository, repositoryFor

    beforeEach(() => {
        playlistsStore.reset()
        let nextId = 0
        repository = {
            findAll: vi.fn(async () => []),
            replaceBatch: vi.fn(async (playlists) => playlists.map((p, order) => ({ ...p, order, id: p.id || `new-${++nextId}` })))
        }
        repositoryFor = vi.fn(() => repository)
        service = new PlaylistsService({}, {}, storage, history, repositoryFor)
    })

    const generated = () => playlistsStore.setPlaylists([{ name: 'Mix 1', tracks: [{ title: 'T1' }] }], 'sA')
    const editing = () => {
        service.setEditMode('Rock', 'sA', null)
        playlistsStore.setPlaylists([{ id: 'p1', name: 'Rock 1', batchName: 'Rock', tracks: [] }], 'sA')
        repository.findAll.mockResolvedValue([
            { id: 'p1', batchName: 'Rock' }, { id: 'p2', batchName: 'Rock' }, { id: 'j1', batchName: 'Jazz' }
        ])
    }

    it('writes playlists not saved yet as a new batch and replaces nothing', async () => {
        generated()

        const result = await service.saveCurrentBatch({ userId: 'u1', batchName: 'Mix' })

        expect(repositoryFor).toHaveBeenCalledWith('u1', 'sA')
        expect(repository.findAll).not.toHaveBeenCalled()
        const [written, replaced] = repository.replaceBatch.mock.calls[0]
        expect(written).toEqual([expect.objectContaining({ name: 'Mix 1', batchName: 'Mix' })])
        expect(replaced).toEqual([])
        expect(result.status).toBe('saved')
    })

    it('names the stored playlists of the batch being edited as the ones the write replaces', async () => {
        editing()

        await service.saveCurrentBatch({ userId: 'u1', batchName: 'Rock v2' })

        const [written, replaced] = repository.replaceBatch.mock.calls[0]
        expect(written.map(p => p.batchName)).toEqual(['Rock v2'])
        expect(replaced).toEqual(['p1', 'p2']) // «Jazz» is another batch
    })

    it('leaves the screen as it was when the write fails', async () => {
        editing()
        playlistsStore.setDirty(true)
        repository.replaceBatch.mockRejectedValue(new Error('offline'))
        const before = JSON.parse(JSON.stringify(playlistsStore.getState()))

        await expect(service.saveCurrentBatch({ userId: 'u1', batchName: 'Rock v2' })).rejects.toThrow('offline')

        expect(JSON.parse(JSON.stringify(playlistsStore.getState()))).toEqual(before)
        expect(playlistsStore.getState().isSaving).toBe(false)
    })

    it('after a save, the saved batch is the one being edited: a second save replaces the new name', async () => {
        editing()
        await service.saveCurrentBatch({ userId: 'u1', batchName: 'Rock v2' })
        repository.findAll.mockResolvedValue([{ id: 'p1', batchName: 'Rock v2' }])

        await service.saveCurrentBatch({ userId: 'u1', batchName: 'Rock v3' })

        expect(playlistsStore.getEditContext()).toMatchObject({ originalBatchName: 'Rock v3', seriesId: 'sA' })
        expect(repository.replaceBatch.mock.calls[1][1]).toEqual(['p1'])
        expect(playlistsStore.getState()).toMatchObject({ isDirty: false, isSynchronized: true, mode: 'EDITING' })
    })

    it('gives the playlists just saved their ids, so the next save updates them instead of creating again', async () => {
        generated()
        await service.saveCurrentBatch({ userId: 'u1', batchName: 'Mix' })

        expect(playlistsStore.getPlaylists().map(p => p.id)).toEqual(['new-1'])
        expect(playlistsStore.isEditingExistingBatch()).toBe(true)
    })

    it('does nothing when a save is already on its way', async () => {
        generated()
        let finishWrite
        repository.replaceBatch.mockImplementation((playlists) => new Promise(resolve => {
            finishWrite = () => resolve(playlists.map(p => ({ ...p, id: 'x' })))
        }))

        const first = service.saveCurrentBatch({ userId: 'u1', batchName: 'Mix' })
        await vi.waitFor(() => expect(repository.replaceBatch).toHaveBeenCalledTimes(1))
        expect(playlistsStore.getState().isSaving).toBe(true)

        await expect(service.saveCurrentBatch({ userId: 'u1', batchName: 'Mix' })).resolves.toEqual({ status: 'already-saving' })
        finishWrite()
        await first

        expect(repository.replaceBatch).toHaveBeenCalledTimes(1)
        expect(playlistsStore.getState().isSaving).toBe(false)
    })

    it('refuses when the playlists on screen are not from the series of the batch being edited', async () => {
        service.setEditMode('Rock', 'sB', null)
        playlistsStore.setPlaylists([{ id: 'p1', name: 'From A', tracks: [] }], 'sA')

        await expect(service.saveCurrentBatch({ userId: 'u1', batchName: 'Rock' })).rejects.toThrow(/not from the series/)
        expect(repository.replaceBatch).not.toHaveBeenCalled()
    })

    it('refuses to save an empty set, which for a batch being edited would only delete it', async () => {
        editing()
        playlistsStore.setPlaylists([], 'sA')

        await expect(service.saveCurrentBatch({ userId: 'u1', batchName: 'Rock' })).rejects.toThrow(/no playlists to save/)
        expect(repository.replaceBatch).not.toHaveBeenCalled()
    })

    it('says the series is gone when the database refuses the write for that reason', async () => {
        generated()
        repository.replaceBatch.mockRejectedValue(Object.assign(new Error('NOT_FOUND'), { code: 'not-found' }))

        await expect(service.saveCurrentBatch({ userId: 'u1', batchName: 'Mix' })).rejects.toThrow(/no longer exists/)
    })

    describe('resolveBatchName', () => {
        it('uses what was typed, without the spaces around it', () => {
            expect(service.resolveBatchName('  Mix  ')).toBe('Mix')
        })

        it('falls back to the suggested name for playlists not saved yet', () => {
            playlistsStore.setDefaultBatchName('Series A - 2026')
            expect(service.resolveBatchName('')).toBe('Series A - 2026')
        })

        it('has no name for a saved batch whose name was erased', () => {
            editing()
            playlistsStore.setDefaultBatchName('Series A - 2026')
            expect(service.resolveBatchName('   ')).toBeNull()
        })
    })

    describe('hasUnsavedChanges', () => {
        it('is false for playlists just generated or just loaded', () => {
            generated()
            expect(service.hasUnsavedChanges()).toBe(false)
        })

        it('is true after a track is removed, and false again after the save', async () => {
            generated()
            service.removeTrack(0, 0)
            expect(service.hasUnsavedChanges()).toBe(true)

            await service.saveCurrentBatch({ userId: 'u1', batchName: 'Mix' })
            expect(service.hasUnsavedChanges()).toBe(false)
        })

        it('is true after a whole playlist is removed', () => {
            playlistsStore.setPlaylists([{ name: 'Mix 1', tracks: [] }, { name: 'Mix 2', tracks: [] }], 'sA')

            const removed = service.removePlaylist(0)

            expect(removed.name).toBe('Mix 1')
            expect(playlistsStore.getPlaylists().map(p => p.name)).toEqual(['Mix 2'])
            expect(service.hasUnsavedChanges()).toBe(true)
        })

        it('is true when a saved batch was given another name', () => {
            editing()
            expect(service.hasUnsavedChanges()).toBe(false)

            playlistsStore.setBatchName('Rock v2')
            expect(service.hasUnsavedChanges()).toBe(true)
        })

        it('is false when there is nothing on screen', () => {
            playlistsStore.setDirty(true)
            expect(service.hasUnsavedChanges()).toBe(false)
        })
    })
})
