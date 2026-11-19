/**
 * The albums shelf: the albums each series has, for the screens that read it. Its albums have one
 * writer, the album load, through setAlbumsBySeries (F56: the methods that added or removed one
 * album are gone, so nothing can put an album on screen around the load).
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { AlbumsStore } from '../../public/js/stores/albums.js'

describe('AlbumsStore', () => {
    let store
    const SERIES = 'mock-series-id'
    const album = (title) => ({ id: title, title, artist: 'Test' })

    beforeEach(() => {
        store = new AlbumsStore()
        store.setActiveAlbumSeriesId(SERIES)
    })

    it('starts empty', () => {
        expect(store.getAlbums()).toEqual([])
        expect(store.getCurrentAlbum()).toBeNull()
        expect(store.getState().loading).toBe(false)
        expect(store.getState().error).toBeNull()
    })

    describe('setAlbumsBySeries (the projection of the album load)', () => {
        it('replaces the albums of the series given and leaves the other series as they are', () => {
            store.setAlbumsBySeries({ [SERIES]: [album('One')], other: [album('Nine')] })

            store.setAlbumsBySeries({ [SERIES]: [album('Two'), album('Three')] })

            expect(store.getAlbums().map(a => a.title)).toEqual(['Two', 'Three'])
            expect(store.getAlbumsForSeries('other').map(a => a.title)).toEqual(['Nine'])
            expect(store.hasAlbumsForSeries('other')).toBe(true)
            expect(store.hasAlbumsForSeries('unknown')).toBe(false)
        })

        it('keeps its own list: changing the list given afterwards changes nothing here', () => {
            const given = [album('One')]
            store.setAlbumsBySeries({ [SERIES]: given })
            given.push(album('Two'))

            expect(store.getAlbums()).toHaveLength(1)
        })

        it('tells the listeners once', () => {
            const listener = vi.fn()
            store.subscribe(listener)

            store.setAlbumsBySeries({ [SERIES]: [album('One')], other: [album('Nine')] })

            expect(listener).toHaveBeenCalledTimes(1)
        })
    })

    it('has no way to add or remove one album: only the album load writes albums (F56)', () => {
        const writers = ['addAlbumToSeries', 'addAlbum', 'removeAlbum', 'clearAlbumSeries', 'removeAlbumsBySeriesIdFromContext']

        expect(writers.filter(name => typeof store[name] === 'function')).toEqual([])
    })

    describe('which series the shelf answers for', () => {
        it('gives the albums of the active series, and none without one', () => {
            store.setAlbumsBySeries({ [SERIES]: [album('One')], other: [album('Nine')] })

            store.setActiveAlbumSeriesId('other')
            expect(store.getAlbums().map(a => a.title)).toEqual(['Nine'])

            store.setActiveAlbumSeriesId(null)
            expect(store.getAlbums()).toEqual([])
        })
    })

    describe('setCurrentAlbum', () => {
        it('sets the current album and tells the listeners', () => {
            const listener = vi.fn()
            store.subscribe(listener)
            const current = album('One')

            store.setCurrentAlbum(current)

            expect(store.getCurrentAlbum()).toEqual(current)
            expect(listener).toHaveBeenCalledWith(expect.objectContaining({ currentAlbum: current }))
        })
    })

    describe('subscribe', () => {
        it('stops telling a listener that unsubscribed', () => {
            const listener = vi.fn()
            const unsubscribe = store.subscribe(listener)

            unsubscribe()
            store.setAlbumsBySeries({ [SERIES]: [album('One')] })

            expect(listener).not.toHaveBeenCalled()
        })
    })

    describe('getState', () => {
        it('returns the whole state', () => {
            const one = album('One')
            store.setAlbumsBySeries({ [SERIES]: [one] })
            store.setCurrentAlbum(one)

            expect(store.getState()).toEqual({
                albums: [one],
                currentAlbum: one,
                loading: false,
                error: null,
                activeAlbumSeriesId: SERIES
            })
        })
    })

    describe('reset', () => {
        it('goes back to the initial state and tells the listeners', () => {
            const listener = vi.fn()
            store.setAlbumsBySeries({ [SERIES]: [album('One')] })
            store.setCurrentAlbum(album('One'))
            store.subscribe(listener)

            store.reset()

            expect(store.getAlbums()).toEqual([])
            expect(store.getCurrentAlbum()).toBeNull()
            expect(listener).toHaveBeenCalled()
        })

        it('keeps the series and its albums when asked to', () => {
            store.setAlbumsBySeries({ [SERIES]: [album('One')] })

            store.reset(true)

            expect(store.getActiveAlbumSeriesId()).toBe(SERIES)
            expect(store.getAlbums()).toHaveLength(1)
        })
    })
})
