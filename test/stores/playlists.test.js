import { describe, it, expect, beforeEach, vi } from 'vitest'
import { PlaylistsStore } from '@stores/playlists.js'

describe('PlaylistsStore', () => {
    let store

    beforeEach(() => {
        store = new PlaylistsStore()
    })

    describe('constructor', () => {
        it('should initialize with empty state', () => {
            expect(store.getPlaylists()).toEqual([])
            expect(store.getConfig()).toEqual({
                playlistCount: 3,
                maxDuration: 75,
                p1p2Rule: true
            })
            expect(store.getState().isDirty).toBe(false)
            expect(store.getState().isSynchronized).toBe(true)
        })
    })

    describe('setPlaylists', () => {
        it('should set playlists and mark as not dirty', () => {
            const playlists = [
                { name: 'P1', tracks: [] },
                { name: 'P2', tracks: [] }
            ]

            store.setPlaylists(playlists)

            expect(store.getPlaylists()).toEqual(playlists)
            expect(store.getState().isDirty).toBe(false)
            expect(store.getState().isSynchronized).toBe(false)
        })

        it('should notify listeners when playlists set', () => {
            const listener = vi.fn()
            store.subscribe(listener)

            store.setPlaylists([{ name: 'P1', tracks: [] }])

            expect(listener).toHaveBeenCalled()
        })
    })

    describe('updateConfig', () => {
        it('should update configuration', () => {
            store.updateConfig({ maxDuration: 90 })

            expect(store.getConfig().maxDuration).toBe(90)
            expect(store.getConfig().playlistCount).toBe(3) // unchanged
        })

        it('should notify listeners when config updated', () => {
            const listener = vi.fn()
            store.subscribe(listener)

            store.updateConfig({ playlistCount: 5 })

            expect(listener).toHaveBeenCalled()
        })
    })

    describe('moveTrack', () => {
        beforeEach(() => {
            store.setPlaylists([
                { name: 'P1', tracks: [{ title: 'Track 1' }, { title: 'Track 2' }] },
                { name: 'P2', tracks: [] }
            ])
        })

        it('should move track between playlists', () => {
            store.moveTrack(0, 1, 0, 0)

            expect(store.getPlaylists()[0].tracks).toHaveLength(1)
            expect(store.getPlaylists()[1].tracks).toHaveLength(1)
            expect(store.getPlaylists()[1].tracks[0].title).toBe('Track 1')
        })

        it('should mark as dirty after move', () => {
            store.moveTrack(0, 1, 0, 0)

            expect(store.getState().isDirty).toBe(true)
            expect(store.getState().isSynchronized).toBe(false)
        })

        it('should notify listeners when track moved', () => {
            const listener = vi.fn()
            store.subscribe(listener)

            store.moveTrack(0, 1, 0, 0)

            expect(listener).toHaveBeenCalled()
        })
    })

    describe('reorderTrack', () => {
        beforeEach(() => {
            store.setPlaylists([
                {
                    name: 'P1', tracks: [
                        { title: 'Track 1' },
                        { title: 'Track 2' },
                        { title: 'Track 3' }
                    ]
                }
            ])
        })

        it('should reorder track within playlist', () => {
            store.reorderTrack(0, 0, 2)

            expect(store.getPlaylists()[0].tracks[0].title).toBe('Track 2')
            expect(store.getPlaylists()[0].tracks[2].title).toBe('Track 1')
        })

        it('should mark as dirty after reorder', () => {
            store.reorderTrack(0, 0, 1)

            expect(store.getState().isDirty).toBe(true)
            expect(store.getState().isSynchronized).toBe(false)
        })

        it('should notify listeners when track reordered', () => {
            const listener = vi.fn()
            store.subscribe(listener)

            store.reorderTrack(0, 0, 1)

            expect(listener).toHaveBeenCalled()
        })
    })

    describe('markSynchronized', () => {
        it('should mark as synchronized and not dirty', () => {
            store.setPlaylists([{ name: 'P1', tracks: [] }])
            store.moveTrack(0, 0, 0, 0) // Make dirty

            store.markSynchronized()

            expect(store.getState().isDirty).toBe(false)
            expect(store.getState().isSynchronized).toBe(true)
        })

        it('should notify listeners when marked synchronized', () => {
            const listener = vi.fn()
            store.subscribe(listener)

            store.markSynchronized()

            expect(listener).toHaveBeenCalled()
        })
    })

    describe('getPlaylistDuration', () => {
        it('should calculate total duration in minutes', () => {
            store.setPlaylists([
                {
                    name: 'P1', tracks: [
                        { title: 'Track 1', durationSeconds: 180 }, // 3 min
                        { title: 'Track 2', durationSeconds: 240 }  // 4 min
                    ]
                }
            ])

            expect(store.getPlaylistDuration(0)).toBe(7)
        })

        it('should return 0 for empty playlist', () => {
            store.setPlaylists([{ name: 'P1', tracks: [] }])

            expect(store.getPlaylistDuration(0)).toBe(0)
        })

        it('should return 0 for non-existent playlist', () => {
            expect(store.getPlaylistDuration(99)).toBe(0)
        })

        it('should handle duration property', () => {
            store.setPlaylists([
                {
                    name: 'P1', tracks: [
                        { title: 'Track 1', duration: 300 } // 5 min in seconds
                    ]
                }
            ])

            expect(store.getPlaylistDuration(0)).toBe(5)
        })
    })

    describe('subscribe', () => {
        it('should add listener', () => {
            const listener = vi.fn()

            store.subscribe(listener)
            store.setPlaylists([{ name: 'P1', tracks: [] }])

            expect(listener).toHaveBeenCalled()
        })

        it('should return unsubscribe function', () => {
            const listener = vi.fn()

            const unsubscribe = store.subscribe(listener)
            unsubscribe()
            store.setPlaylists([{ name: 'P1', tracks: [] }])

            expect(listener).not.toHaveBeenCalled()
        })
    })

    describe('getState', () => {
        it('should return complete state snapshot', () => {
            const playlists = [{ name: 'P1', tracks: [] }]
            store.setPlaylists(playlists)

            const state = store.getState()

            expect(state).toEqual({
                playlists,
                config: {
                    playlistCount: 3,
                    maxDuration: 75,
                    p1p2Rule: true
                },
                isDirty: false,
                isSynchronized: false,
                canUndo: false,
                canRedo: false
            })
        })
    })

    describe('reset', () => {
        it('should reset store to initial state', () => {
            store.setPlaylists([{ name: 'P1', tracks: [] }])
            store.updateConfig({ maxDuration: 90 })

            store.reset()

            expect(store.getPlaylists()).toEqual([])
            expect(store.getConfig()).toEqual({
                playlistCount: 3,
                maxDuration: 75,
                p1p2Rule: true
            })
            expect(store.getState().isDirty).toBe(false)
            expect(store.getState().isSynchronized).toBe(true)
        })

        it('should notify listeners on reset', () => {
            const listener = vi.fn()
            store.subscribe(listener)

            store.reset()

            expect(listener).toHaveBeenCalled()
        })
    })
})
