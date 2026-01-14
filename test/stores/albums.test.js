import { describe, it, expect, beforeEach, vi } from 'vitest'
import { AlbumsStore } from '../../public/js/stores/albums.js'

describe('AlbumsStore', () => {
    let store
    const MOCK_SERIES_ID = 'mock-series-id'

    beforeEach(() => {
        store = new AlbumsStore()
        store.setActiveAlbumSeriesId(MOCK_SERIES_ID)
    })

    describe('constructor', () => {
        it('should initialize with empty state', () => {
            // Note: getAlbums() returns albums for active series
            expect(store.getAlbums()).toEqual([])
            expect(store.getCurrentAlbum()).toBeNull()
            expect(store.getState().loading).toBe(false)
            expect(store.getState().error).toBeNull()
        })
    })

    describe('addAlbum', () => {
        it('should add new album to store', () => {
            const album = {
                title: 'The Wall',
                artist: 'Pink Floyd',
                year: 1979
            }

            store.addAlbum(album)

            expect(store.getAlbums()).toHaveLength(1)
            expect(store.getAlbums()[0]).toEqual(album)
        })

        it('should not duplicate existing album', () => {
            const album = {
                title: 'The Wall',
                artist: 'Pink Floyd',
                year: 1979
            }

            store.addAlbum(album)
            store.addAlbum(album)

            expect(store.getAlbums()).toHaveLength(1)
        })

        it('should update existing album with same title/artist', () => {
            const album1 = {
                title: 'The Wall',
                artist: 'Pink Floyd',
                year: 1979
            }
            const album2 = {
                title: 'The Wall',
                artist: 'Pink Floyd',
                year: 1979,
                id: '123', // Upgrade with ID
                tracks: []
            }

            store.addAlbum(album1)
            store.addAlbum(album2)

            expect(store.getAlbums()).toHaveLength(1)
            // It should upgrade to the version with ID
            expect(store.getAlbums()[0].id).toBe('123')
        })

        it('should notify listeners when album added', () => {
            const listener = vi.fn()
            store.subscribe(listener)

            store.addAlbum({ title: 'Test', artist: 'Test' })

            expect(listener).toHaveBeenCalled()
        })
    })

    describe('setCurrentAlbum', () => {
        it('should set current album', () => {
            const album = { title: 'Test Album', artist: 'Test' }

            store.setCurrentAlbum(album)

            expect(store.getCurrentAlbum()).toEqual(album)
        })

        it('should notify listeners when current album changes', () => {
            const listener = vi.fn()
            store.subscribe(listener)

            const album = { title: 'Test Album' }
            store.setCurrentAlbum(album)

            expect(listener).toHaveBeenCalledWith(
                expect.objectContaining({ currentAlbum: album })
            )
        })
    })

    describe('removeAlbum', () => {
        it('should remove album from store', () => {
            const album = { id: '123', title: 'Test', artist: 'Test' }
            store.addAlbum(album)

            store.removeAlbum('123')

            expect(store.getAlbums()).toHaveLength(0)
        })

        it('should clear current album if removed', () => {
            const album = { id: '123', title: 'Test', artist: 'Test' }
            store.addAlbum(album)
            store.setCurrentAlbum(album)

            store.removeAlbum('123')

            expect(store.getCurrentAlbum()).toBeNull()
        })

        it('should not affect current album if different album removed', () => {
            const album1 = { id: '123', title: 'Test 1', artist: 'Test' }
            const album2 = { id: '456', title: 'Test 2', artist: 'Test' }
            store.addAlbum(album1)
            store.addAlbum(album2)
            store.setCurrentAlbum(album1)

            store.removeAlbum('456')

            expect(store.getCurrentAlbum()).toEqual(album1)
        })

        it('should notify listeners when album removed', () => {
            const listener = vi.fn()
            const album = { id: '123', title: 'Test', artist: 'Test' }
            store.addAlbum(album)
            store.subscribe(listener)

            store.removeAlbum('123')

            expect(listener).toHaveBeenCalled()
        })
    })

    describe('subscribe', () => {
        it('should add listener', () => {
            const listener = vi.fn()

            store.subscribe(listener)
            store.addAlbum({ title: 'Test', artist: 'Test' })

            expect(listener).toHaveBeenCalled()
        })

        it('should return unsubscribe function', () => {
            const listener = vi.fn()

            const unsubscribe = store.subscribe(listener)
            unsubscribe()
            store.addAlbum({ title: 'Test', artist: 'Test' })

            expect(listener).not.toHaveBeenCalled()
        })
    })

    describe('getState', () => {
        it('should return complete state snapshot', () => {
            const album = { title: 'Test', artist: 'Test' }
            store.addAlbum(album)
            store.setCurrentAlbum(album)

            const state = store.getState()

            expect(state).toEqual({
                albums: [album],
                currentAlbum: album,
                loading: false,
                error: null,
                activeAlbumSeriesId: MOCK_SERIES_ID
            })
        })
    })

    describe('reset', () => {
        it('should reset store to initial state', () => {
            store.addAlbum({ title: 'Test', artist: 'Test' })
            store.setCurrentAlbum({ title: 'Test', artist: 'Test' })

            store.reset()

            // After reset, active series is null unless preserved
            expect(store.getAlbums()).toEqual([]) // Default empty [] if no series
            expect(store.getCurrentAlbum()).toBeNull()
            expect(store.getState().loading).toBe(false)
            expect(store.getState().error).toBeNull()
        })

        it('should notify listeners on reset', () => {
            const listener = vi.fn()
            store.subscribe(listener)

            store.reset()

            expect(listener).toHaveBeenCalled()
        })
    })
})
