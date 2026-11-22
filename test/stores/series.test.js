/**
 * AlbumSeriesStore - a pure state store (ADR 0017): it keeps the list of series, the active one and
 * the sync flags, and tells its listeners. Creating, reading and saving series is SeriesService's
 * job (test/services/SeriesService.test.js); nothing here touches the cloud.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { AlbumSeriesStore, albumSeriesStore } from '../../public/js/stores/albumSeries.js'

const one = () => ({ id: '1', name: 'One', albumQueries: ['A - B'] })
const two = () => ({ id: '2', name: 'Two', albumQueries: [] })

describe('AlbumSeriesStore', () => {
    let store

    beforeEach(() => {
        store = new AlbumSeriesStore()
    })

    it('starts empty, for an anonymous person, with no database', () => {
        expect(store.getState()).toEqual({ series: [], activeSeries: null, loading: false, error: null })
        expect(store.getUserId()).toBe('anonymous-user')
        expect(store.getDb()).toBeNull()
    })

    it('knows whether a read of the series has ended (F79): not at first, yes after markRead, not after reset', () => {
        expect(store.hasRead()).toBe(false)
        const listener = vi.fn()
        store.subscribe(listener)
        store.markRead()
        expect(store.hasRead()).toBe(true)
        expect(listener).toHaveBeenCalled()
        store.reset()
        expect(store.hasRead()).toBe(false)
    })

    it('exports one shared instance', () => {
        expect(albumSeriesStore).toBeInstanceOf(AlbumSeriesStore)
    })

    describe('the list of series', () => {
        it('setSeries replaces the list', () => {
            store.setSeries([one(), two()])
            expect(store.getSeries().map(s => s.id)).toEqual(['1', '2'])
        })

        it('addSeries puts the new series first', () => {
            store.setSeries([one()])
            store.addSeries(two())
            expect(store.getSeries().map(s => s.id)).toEqual(['2', '1'])
        })

        it('getById finds a series, or answers undefined', () => {
            store.setSeries([one(), two()])
            expect(store.getById('2').name).toBe('Two')
            expect(store.getById('nope')).toBeUndefined()
        })

        it('updateSeriesById merges the changes and marks the series as updated now', () => {
            store.setSeries([one()])
            store.updateSeriesById('1', { name: 'Renamed' })
            expect(store.getById('1').name).toBe('Renamed')
            expect(store.getById('1').albumQueries).toEqual(['A - B'])
            expect(store.getById('1').updatedAt).toBeInstanceOf(Date)
        })

        it('updateSeriesById leaves the list alone for an unknown id', () => {
            store.setSeries([one()])
            store.updateSeriesById('nope', { name: 'X' })
            expect(store.getSeries()).toEqual([one()])
        })

        it('setAlbumQueries changes only the queries, without marking the series as updated', () => {
            store.setSeries([one()])
            store.setAlbumQueries('1', [{ artist: 'A', title: 'B', facts: { year: 1970 } }])
            expect(store.getById('1').albumQueries[0].facts.year).toBe(1970)
            expect(store.getById('1').updatedAt).toBeUndefined()
        })

        it('removeSeriesById takes the series out', () => {
            store.setSeries([one(), two()])
            store.removeSeriesById('1')
            expect(store.getSeries().map(s => s.id)).toEqual(['2'])
        })
    })

    describe('the active series', () => {
        beforeEach(() => store.setSeries([one(), two()]))

        it('setActiveSeries chooses by id and returns the series', () => {
            expect(store.setActiveSeries('2').name).toBe('Two')
            expect(store.getActiveSeries().id).toBe('2')
        })

        it('an unknown id, or none, leaves no active series', () => {
            store.setActiveSeries('2')
            expect(store.setActiveSeries('nope')).toBeNull()
            store.setActiveSeries('2')
            expect(store.setActiveSeries(null)).toBeNull()
        })

        it('the active series follows an update and a change of queries', () => {
            store.setActiveSeries('1')
            store.updateSeriesById('1', { name: 'Renamed' })
            expect(store.getActiveSeries().name).toBe('Renamed')
            store.setAlbumQueries('1', [])
            expect(store.getActiveSeries().albumQueries).toEqual([])
        })

        it('removing the active series leaves none active', () => {
            store.setActiveSeries('1')
            store.removeSeriesById('1')
            expect(store.getActiveSeries()).toBeNull()
        })
    })

    describe('flags and context', () => {
        it('keeps loading and error', () => {
            store.setLoading(true)
            store.setError('boom')
            expect(store.getState()).toMatchObject({ loading: true, error: 'boom' })
        })

        it('setUserId falls back to the anonymous person', () => {
            store.setUserId('user-123')
            expect(store.getUserId()).toBe('user-123')
            store.setUserId(null)
            expect(store.getUserId()).toBe('anonymous-user')
        })

        it('setDb keeps the database handle without telling the listeners', () => {
            const listener = vi.fn()
            store.subscribe(listener)
            const db = {}
            store.setDb(db)
            expect(store.getDb()).toBe(db)
            expect(listener).not.toHaveBeenCalled()
        })
    })

    describe('listeners', () => {
        it('are told the state on every change', () => {
            const listener = vi.fn()
            store.subscribe(listener)
            store.setSeries([one()])
            expect(listener).toHaveBeenCalledWith(expect.objectContaining({ series: [one()] }))
        })

        it('subscribe returns the way to stop listening', () => {
            const listener = vi.fn()
            const stop = store.subscribe(listener)
            stop()
            store.setSeries([one()])
            expect(listener).not.toHaveBeenCalled()
        })
    })

    it('reset empties the state, tells the listeners, and keeps the person', () => {
        const listener = vi.fn()
        store.setSeries([one()])
        store.setActiveSeries('1')
        store.setUserId('user-123')
        store.subscribe(listener)

        store.reset()

        expect(store.getState()).toEqual({ series: [], activeSeries: null, loading: false, error: null })
        expect(store.getUserId()).toBe('user-123')
        expect(listener).toHaveBeenCalledTimes(1)
    })
})
