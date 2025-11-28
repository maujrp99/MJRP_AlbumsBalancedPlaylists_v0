import { describe, it, expect, beforeEach, vi } from 'vitest'
import { PlaylistsView } from '../../public/js/views/PlaylistsView.js'
import { playlistsStore } from '../../public/js/stores/playlists.js'

// Mock store
vi.mock('../../public/js/stores/playlists.js', () => ({
    playlistsStore: {
        getPlaylists: vi.fn(),
        getConfig: vi.fn(),
        subscribe: vi.fn(() => vi.fn()),
        getState: vi.fn(),
        getVersionHistory: vi.fn()
    }
}))

describe('PlaylistsView', () => {
    let view

    beforeEach(() => {
        view = new PlaylistsView()
        document.body.innerHTML = '<div id="app"></div>'
        view.$el = document.createElement('div')

        // Mock store returns
        playlistsStore.getPlaylists.mockReturnValue([])
        playlistsStore.getConfig.mockReturnValue({})
        playlistsStore.getState.mockReturnValue({
            history: [],
            currentVersionIndex: -1,
            canUndo: false,
            canRedo: false
        })
        playlistsStore.getVersionHistory.mockReturnValue({
            versions: [],
            currentIndex: -1,
            canUndo: false,
            canRedo: false
        })
    })

    describe('calculateDuration', () => {
        it('should format seconds to MM:SS', () => {
            const tracks = [
                { duration: 65 }, // 1:05
                { duration: 125 } // 2:05
            ]
            // Total: 190s = 3 min 10 sec
            expect(view.calculateDuration(tracks)).toBe('3:10')
        })

        it('should pad seconds with zero', () => {
            const tracks = [
                { duration: 61 } // 1:01
            ]
            expect(view.calculateDuration(tracks)).toBe('1:01')
        })

        it('should handle empty tracks', () => {
            expect(view.calculateDuration([])).toBe('0:00')
        })

        it('should handle missing duration', () => {
            const tracks = [{ title: 'No Duration' }]
            expect(view.calculateDuration(tracks)).toBe('0:00')
        })
    })
})
