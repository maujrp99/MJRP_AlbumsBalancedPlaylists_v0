/**
 * F62 (UAT-02, UAT-04) - undo and redo of the edits of the playlists on screen, and the title of
 * a playlist: the rule lives in PlaylistsService, the history is the real one, and the state the
 * buttons read (`canUndo`, `canRedo`) is the one of the store.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { PlaylistsService } from '../../public/js/services/PlaylistsService.js'
import { PlaylistHistoryService } from '../../public/js/services/playlists/PlaylistHistoryService.js'
import { playlistsStore } from '../../public/js/stores/playlists.js'

const storage = { save: vi.fn(), load: vi.fn(() => null), remove: vi.fn() }
const flush = () => new Promise(resolve => setTimeout(resolve, 0))

const titles = () => playlistsStore.getPlaylists().map(p => p.tracks.map(t => t.title).join(','))
const names = () => playlistsStore.getPlaylists().map(p => p.name)
const flags = () => { const { canUndo, canRedo } = playlistsStore.getState(); return { canUndo, canRedo } }

describe('PlaylistsService: undo and redo (UAT-02)', () => {
    let service, repository

    /** What the blend does: it writes the generated set straight into the store. */
    const generate = (seriesId = 'sA') => playlistsStore.setPlaylists([
        { name: 'Mix 1', title: 'Mix 1', tracks: [{ title: 'A' }, { title: 'B' }, { title: 'C' }] },
        { name: 'Mix 2', title: 'Mix 2', tracks: [{ title: 'D' }] }
    ], seriesId)

    beforeEach(() => {
        vi.clearAllMocks()
        playlistsStore.reset()
        repository = {
            findAll: vi.fn(async () => []),
            replaceBatch: vi.fn(async (playlists) => playlists.map((p, order) => ({ ...p, order, id: p.id || `id-${order}` })))
        }
        service = new PlaylistsService({}, {}, storage, new PlaylistHistoryService(), {
            playlistRepositoryFor: () => repository, currentUserId: () => 'u1'
        })
    })

    it('has nothing to undo or redo on a set that was just generated', () => {
        generate()

        expect(flags()).toEqual({ canUndo: false, canRedo: false })
        expect(service.undo()).toBe(false)
        expect(service.redo()).toBe(false)
    })

    it('undoes the first change back to the set as it was generated, and redoes it', () => {
        generate()

        service.removeTrack(0, 1)
        expect(titles()).toEqual(['A,C', 'D'])
        expect(flags()).toEqual({ canUndo: true, canRedo: false })

        expect(service.undo()).toBe(true)
        expect(titles()).toEqual(['A,B,C', 'D'])
        expect(flags()).toEqual({ canUndo: false, canRedo: true })

        expect(service.redo()).toBe(true)
        expect(titles()).toEqual(['A,C', 'D'])
        expect(flags()).toEqual({ canUndo: true, canRedo: false })
    })

    it('undoes each kind of change, one step at a time: move, reorder, remove a playlist, rename', () => {
        generate()

        service.moveTrack(0, 1, 0, 1)      // A goes after D
        service.reorderTrack(0, 0, 1)      // B,C -> C,B
        service.renamePlaylist(1, 'Night')
        service.removePlaylist(0)
        expect(names()).toEqual(['Night'])
        expect(titles()).toEqual(['D,A'])

        service.undo()
        expect(names()).toEqual(['Mix 1', 'Night'])
        expect(titles()).toEqual(['C,B', 'D,A'])
        service.undo()
        expect(names()).toEqual(['Mix 1', 'Mix 2'])
        service.undo()
        expect(titles()).toEqual(['B,C', 'D,A'])
        service.undo()
        expect(titles()).toEqual(['A,B,C', 'D'])
        expect(flags()).toEqual({ canUndo: false, canRedo: true })
    })

    it('a change made after an undo drops what could be redone', () => {
        generate()
        service.removeTrack(0, 0)
        service.undo()

        service.removeTrack(1, 0)

        expect(flags()).toEqual({ canUndo: true, canRedo: false })
        expect(titles()).toEqual(['A,B,C', ''])
    })

    it('does not change the set an earlier step holds: each step is a copy', () => {
        generate()
        const generated = playlistsStore.getPlaylists()

        service.removeTrack(0, 0)

        expect(generated[0].tracks.map(t => t.title)).toEqual(['A', 'B', 'C']) // the set before is left as it was
    })

    it('starts the history again when another set comes to the screen (generated again, another batch opened)', async () => {
        generate()
        service.removeTrack(0, 0)
        const stop = service.watchStore()

        generate() // the blend writes a new set straight into the store
        await flush()

        expect(flags()).toEqual({ canUndo: false, canRedo: false })
        expect(service.undo()).toBe(false)
        expect(titles()).toEqual(['A,B,C', 'D']) // the new set is not replaced by a step of the old one
        stop()
    })

    it('never brings back a step of another set, even before the store was heard', () => {
        generate()
        service.removeTrack(0, 0)

        playlistsStore.setPlaylists([{ name: 'Other', tracks: [{ title: 'Z' }] }], 'sB')

        expect(service.undo()).toBe(false)
        expect(names()).toEqual(['Other'])
        expect(flags()).toEqual({ canUndo: false, canRedo: false })
    })

    it('says there is work to save after a change, and nothing to save once every change is undone', () => {
        generate()
        expect(service.hasUnsavedChanges()).toBe(false)

        service.removeTrack(0, 0)
        expect(service.hasUnsavedChanges()).toBe(true)

        service.undo()
        expect(service.hasUnsavedChanges()).toBe(false)
    })

    it('a save is the new starting point: there is nothing to undo right after it', async () => {
        generate()
        service.removeTrack(0, 0)

        await service.saveCurrentBatch({ userId: 'u1', batchName: 'Mix' })

        expect(flags()).toEqual({ canUndo: false, canRedo: false })
        expect(service.undo()).toBe(false)
        expect(titles()).toEqual(['B,C', 'D'])
    })
})

describe('PlaylistsService.renamePlaylist (UAT-04)', () => {
    let service

    beforeEach(() => {
        vi.clearAllMocks()
        playlistsStore.reset()
        service = new PlaylistsService({}, {}, storage, new PlaylistHistoryService(), { currentUserId: () => 'u1' })
        playlistsStore.setPlaylists([{ name: 'Greatest Hits', title: 'Greatest Hits', tracks: [{ title: 'A' }] }], 'sA')
    })

    it('puts the typed title in the playlist, as its name and its title, and marks the set as changed', () => {
        expect(service.renamePlaylist(0, '  Road trip  ')).toBe(true)

        expect(playlistsStore.getPlaylists()[0]).toMatchObject({ name: 'Road trip', title: 'Road trip' })
        expect(playlistsStore.getState().isDirty).toBe(true)
    })

    it('keeps the title through the other changes of the set', () => {
        service.renamePlaylist(0, 'Road trip')

        service.removeTrack(0, 0)

        expect(playlistsStore.getPlaylists()[0].name).toBe('Road trip')
    })

    it('refuses an empty title and a title that did not change: nothing is recorded', () => {
        expect(service.renamePlaylist(0, '   ')).toBe(false)
        expect(service.renamePlaylist(0, 'Greatest Hits')).toBe(false)
        expect(service.renamePlaylist(7, 'Nobody')).toBe(false)

        expect(playlistsStore.getPlaylists()[0].name).toBe('Greatest Hits')
        expect(playlistsStore.getState().canUndo).toBe(false)
        expect(playlistsStore.getState().isDirty).toBe(false)
    })
})
