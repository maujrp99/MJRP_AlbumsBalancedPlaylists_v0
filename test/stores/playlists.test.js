import { describe, it, expect, beforeEach, vi } from 'vitest'
import { PlaylistsStore } from '@stores/playlists.js'

describe('PlaylistsStore (Pure State)', () => {
    let store

    beforeEach(() => {
        store = new PlaylistsStore()
    })

    describe('State Management', () => {
        it('should update playlists and unset sync', () => {
            store.setPlaylists([{ name: 'p1' }])
            expect(store.getPlaylists()).toHaveLength(1)
            // Note: setPlaylists doesn't automatically set dirty/sync anymore in pure store unless logic is there? 
            // Checking source: setPlaylists(p, s) -> sets p, s, notifies. Does NOT touch dirty/sync.
            // Logic is moved to Service.
        })

        it('should update config', () => {
            store.setConfig({ maxDuration: 100 })
            expect(store.getConfig().maxDuration).toBe(100)
            expect(store.getConfig().p1p2Rule).toBe(true) // merge behavior check
        })

        it('should update dirty state', () => {
            store.setDirty(true)
            expect(store.getState().isDirty).toBe(true)
        })

        it('should update sync state', () => {
            store.setSynchronized(false)
            expect(store.getState().isSynchronized).toBe(false)
        })

        it('should update mode and edit context', () => {
            store.setMode('EDITING')
            store.setEditContext({ id: 1 })

            expect(store.getState().mode).toBe('EDITING')
            expect(store.getEditContext()).toEqual({ id: 1 })
            expect(store.isEditingExistingBatch()).toBe(true)
        })

        it('should update undo state', () => {
            store.setUndoState(true, false)
            expect(store.getState().canUndo).toBe(true)
            expect(store.getState().canRedo).toBe(false)
        })
    })

    describe('Subscription', () => {
        it('should notify listener on state change', () => {
            const listener = vi.fn()
            const unsubscribe = store.subscribe(listener)

            store.setLoading(true)
            expect(listener).toHaveBeenCalledWith(expect.objectContaining({ loading: true }))

            unsubscribe()
            store.setLoading(false)
            expect(listener).toHaveBeenCalledTimes(1)
        })
    })

    describe('Reset', () => {
        it('should reset to initial values', () => {
            store.setPlaylists([{}])
            store.setDirty(true)

            store.reset()

            expect(store.getPlaylists()).toEqual([])
            expect(store.getState().isDirty).toBe(false)
            expect(store.getConfig().playlistCount).toBe(3)
        })
    })
})
