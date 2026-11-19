import { describe, it, expect, beforeEach, vi } from 'vitest'
import { PlaylistsService } from '../../public/js/services/PlaylistsService.js'
import { playlistsStore } from '../../public/js/stores/playlists.js'
import { PlaylistHistoryService } from '../../public/js/services/playlists/PlaylistHistoryService.js'

// Mock dependencies
const mockDb = {}
const mockCache = {}

const mockStorage = {
    save: vi.fn(),
    load: vi.fn().mockReturnValue(null),
    remove: vi.fn()
}

// The history is the real one (F62: the service and the history keep one rule together); the
// calls the service makes to it are watched
let mockHistory

describe('PlaylistsService (Refactored)', () => {
    let service

    beforeEach(() => {
        vi.clearAllMocks()
        playlistsStore.reset()
        mockHistory = new PlaylistHistoryService()
        vi.spyOn(mockHistory, 'createSnapshot')
        vi.spyOn(mockHistory, 'undo')
        // Inject mocks
        service = new PlaylistsService(mockDb, mockCache, mockStorage, mockHistory)
    })

    describe('moveTrack', () => {
        it('should move track and create snapshot', () => {
            // Setup initial state
            const initialPlaylists = [
                { name: 'P1', tracks: [{ title: 'T1' }] },
                { name: 'P2', tracks: [] }
            ]
            playlistsStore.setPlaylists(initialPlaylists, 'series-123')

            // Action
            service.moveTrack(0, 1, 0, 0)

            // Assertions
            const state = playlistsStore.getPlaylists()
            expect(state[0].tracks).toHaveLength(0)
            expect(state[1].tracks).toHaveLength(1)
            expect(state[1].tracks[0].title).toBe('T1')

            expect(mockHistory.createSnapshot).toHaveBeenCalled()
            expect(mockStorage.save).toHaveBeenCalled() // Persistence check
            expect(playlistsStore.getState().isDirty).toBe(true)
        })
    })

    describe('Undo/Redo Delegation', () => {
        it('should delegate createSnapshot to history service', () => {
            const playlists = []
            service.createSnapshot(playlists, 's1', 'desc')
            expect(mockHistory.createSnapshot).toHaveBeenCalledWith(playlists, 's1', 'desc')
        })

        it('should delegate undo to history service and update store', () => {
            playlistsStore.setPlaylists([{ name: 'Restored', tracks: [{ title: 'T1' }] }], 's1')
            service.removePlaylist(0)

            const result = service.undo()

            expect(mockHistory.undo).toHaveBeenCalled()
            expect(result).toBe(true)
            expect(playlistsStore.getPlaylists()[0].name).toBe('Restored')
            expect(playlistsStore.getState().canRedo).toBe(true) // Updates UI state
        })
    })

    describe('LocalStorage Delegation', () => {
        it('should delegate save to storage service', () => {
            playlistsStore.setPlaylists([{ name: 'SaveMe' }], 's1')
            service.saveToLocalStorage()
            expect(mockStorage.save).toHaveBeenCalled()
        })

        it('should not keep a saved batch as a draft', () => {
            playlistsStore.setPlaylists([{ id: 'p1', name: 'Saved' }], 's1')
            service.setEditMode('Rock', 's1', null)
            mockStorage.save.mockClear()

            service.saveToLocalStorage()

            expect(mockStorage.save).not.toHaveBeenCalled()
            expect(mockStorage.remove).toHaveBeenCalled()
        })
    })
})
