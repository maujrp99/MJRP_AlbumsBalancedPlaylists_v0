import { describe, it, expect, beforeEach, vi } from 'vitest'
import { SeriesStore } from '@stores/series.js'

describe('SeriesStore', () => {
    let store

    beforeEach(() => {
        store = new SeriesStore()
    })

    describe('constructor', () => {
        it('should initialize with empty state', () => {
            expect(store.getSeries()).toEqual([])
            expect(store.getActiveSeries()).toBeNull()
            expect(store.getState().loading).toBe(false)
            expect(store.getState().error).toBeNull()
        })
    })

    describe('createSeries', () => {
        it('should create new series with provided data', () => {
            const seriesData = {
                name: 'Classic Rock Collection',
                albumQueries: ['Pink Floyd - The Wall', 'Led Zeppelin - IV'],
                notes: 'Test notes'
            }

            const series = store.createSeries(seriesData)

            expect(series.name).toBe('Classic Rock Collection')
            expect(series.albumQueries).toEqual(seriesData.albumQueries)
            expect(series.notes).toBe('Test notes')
            expect(series.status).toBe('pending')
            expect(series.id).toBeDefined()
        })

        it('should set created series as active', () => {
            const series = store.createSeries({ name: 'Test Series' })

            expect(store.getActiveSeries()).toEqual(series)
        })

        it('should add series to beginning of list', () => {
            store.createSeries({ name: 'Series 1' })
            store.createSeries({ name: 'Series 2' })

            expect(store.getSeries()[0].name).toBe('Series 2')
            expect(store.getSeries()[1].name).toBe('Series 1')
        })

        it('should handle series without optional fields', () => {
            const series = store.createSeries({ name: 'Minimal Series' })

            expect(series.albumQueries).toEqual([])
            expect(series.notes).toBe('')
        })

        it('should notify listeners when series created', () => {
            const listener = vi.fn()
            store.subscribe(listener)

            store.createSeries({ name: 'Test' })

            expect(listener).toHaveBeenCalled()
        })
    })

    describe('setActiveSeries', () => {
        it('should set active series by ID', () => {
            const series1 = store.createSeries({ name: 'Series 1' })
            const series1Id = series1.id
            store.createSeries({ name: 'Series 2' }) // This becomes active automatically

            // Now set series1 as active by its ID
            store.setActiveSeries(series1Id)

            expect(store.getActiveSeries().id).toBe(series1Id)
        })
        it('should set active series to null if ID not found', () => {
            store.createSeries({ name: 'Series 1' })

            store.setActiveSeries('non-existent-id')

            expect(store.getActiveSeries()).toBeNull()
        })

        it('should notify listeners when active series changes', () => {
            const series = store.createSeries({ name: 'Test' })
            const listener = vi.fn()
            store.subscribe(listener)

            store.setActiveSeries(series.id)

            expect(listener).toHaveBeenCalled()
        })
    })

    describe('getSeries', () => {
        it('should return all series', () => {
            store.createSeries({ name: 'Series 1' })
            store.createSeries({ name: 'Series 2' })

            expect(store.getSeries()).toHaveLength(2)
        })
    })

    describe('getActiveSeries', () => {
        it('should return active series', () => {
            const series = store.createSeries({ name: 'Test' })

            expect(store.getActiveSeries()).toEqual(series)
        })

        it('should return null if no active series', () => {
            expect(store.getActiveSeries()).toBeNull()
        })
    })

    describe('subscribe', () => {
        it('should add listener', () => {
            const listener = vi.fn()

            store.subscribe(listener)
            store.createSeries({ name: 'Test' })

            expect(listener).toHaveBeenCalled()
        })

        it('should return unsubscribe function', () => {
            const listener = vi.fn()

            const unsubscribe = store.subscribe(listener)
            unsubscribe()
            store.createSeries({ name: 'Test' })

            expect(listener).not.toHaveBeenCalled()
        })
    })

    describe('getState', () => {
        it('should return complete state snapshot', () => {
            const series = store.createSeries({ name: 'Test' })

            const state = store.getState()

            expect(state).toEqual({
                series: [series],
                activeSeries: series,
                loading: false,
                error: null
            })
        })
    })

    describe('reset', () => {
        it('should reset store to initial state', () => {
            store.createSeries({ name: 'Test' })

            store.reset()

            expect(store.getSeries()).toEqual([])
            expect(store.getActiveSeries()).toBeNull()
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
