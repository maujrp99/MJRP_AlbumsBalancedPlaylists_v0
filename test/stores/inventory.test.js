/**
 * The inventory store holds the inventory on screen and tells whoever subscribed. Since F58
 * (UAT-18) it only holds state: reading and writing are InventoryService's
 * (test/services/inventory/).
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { InventoryStore } from '../../public/js/stores/inventory.js'

describe('InventoryStore', () => {
    let store, seen

    beforeEach(() => {
        store = new InventoryStore()
        seen = []
        store.subscribe(state => seen.push(state))
    })

    it('starts empty, not loading, with no error', () => {
        expect(store.getState()).toEqual({ albums: [], loading: false, error: null })
        expect(store.getAlbums()).toEqual([])
    })

    it('setLoading says a read started and clears the last error', () => {
        store.setError('Load failed')

        store.setLoading()

        expect(store.getState()).toMatchObject({ loading: true, error: null })
        expect(seen).toHaveLength(2)
    })

    it('setAlbums holds what was read and ends the loading', () => {
        store.setLoading()

        store.setAlbums([{ id: '1' }])

        expect(store.getState()).toEqual({ albums: [{ id: '1' }], loading: false, error: null })
    })

    it('setError holds the message, ends the loading and keeps the albums it had', () => {
        store.setAlbums([{ id: '1' }])
        store.setLoading()

        store.setError('Load failed')

        expect(store.getState()).toEqual({ albums: [{ id: '1' }], loading: false, error: 'Load failed' })
    })

    it('replaceAlbums changes the list and nothing else', () => {
        store.setLoading()

        store.replaceAlbums([{ id: '2' }])

        expect(store.getState()).toEqual({ albums: [{ id: '2' }], loading: true, error: null })
    })

    it('reset drops everything: the inventory in memory belongs to whoever was here', () => {
        store.setAlbums([{ id: '1' }])
        store.setError('x')

        store.reset()

        expect(store.getState()).toEqual({ albums: [], loading: false, error: null })
    })

    it('every setter tells whoever subscribed, once; an unsubscribed listener hears nothing', () => {
        const listener = vi.fn()
        const unsubscribe = store.subscribe(listener)

        store.setLoading()
        store.setAlbums([])
        store.setError('x')
        store.replaceAlbums([])
        store.reset()
        expect(listener).toHaveBeenCalledTimes(5)

        unsubscribe()
        store.reset()
        expect(listener).toHaveBeenCalledTimes(5)
    })

    it('getStatistics is derived from the albums it holds', () => {
        store.setAlbums([
            { format: 'cd', purchasePrice: 10, currency: 'USD' },
            { format: 'vinyl', purchasePrice: 20, currency: 'USD' },
            { format: 'cd', purchasePrice: 50, currency: 'BRL' }
        ])

        const stats = store.getStatistics()

        expect(stats.totalAlbums).toBe(3)
        expect(stats.byFormat.cd).toBe(2)
        expect(stats.byFormat.vinyl).toBe(1)
        expect(stats.totalValueUSD).toBe(30)
        expect(stats.totalValueBRL).toBe(50)
        expect(stats.averagePriceUSD).toBe(15)
        expect(stats.averagePriceBRL).toBe(50)
    })
})
