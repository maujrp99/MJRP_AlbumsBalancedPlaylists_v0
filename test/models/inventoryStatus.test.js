/**
 * F71 (S-54) - one model for the status of an inventory item. The stored value stays what it was
 * (`owned`: true, false, null or missing); every screen asks this module what it means.
 */
import { describe, it, expect } from 'vitest'
import {
    InventoryStatus, ALL_STATUSES, STATUS_FILTER_OPTIONS, STATUS_SELECT_OPTIONS,
    statusOf, ownedValueOf, statusLabel, statusCountLabel, statusChangeMessage, passesStatusFilter, countByStatus
} from '../../public/js/models/inventoryStatus.js'

const items = [
    { id: 'a', owned: true },
    { id: 'b', owned: false },
    { id: 'c', owned: null },
    { id: 'd' },
    { id: 'e', owned: true }
]

describe('the status of an inventory item', () => {
    it('reads the stored value: true is owned, false is wishlist, null or missing is not owned', () => {
        expect(items.map(statusOf)).toEqual(['owned', 'wishlist', 'not-owned', 'not-owned', 'owned'])
        expect(statusOf(null)).toBe('not-owned')
        expect(statusOf({ owned: 'yes' })).toBe('not-owned')
    })

    it('writes the value the cloud already holds for each status: no data migration', () => {
        expect(ownedValueOf(InventoryStatus.OWNED)).toBe(true)
        expect(ownedValueOf(InventoryStatus.WISHLIST)).toBe(false)
        expect(ownedValueOf(InventoryStatus.NOT_OWNED)).toBe(null)
        expect(ownedValueOf('anything else')).toBe(null)
    })

    it('a status written and read back is the same status', () => {
        Object.values(InventoryStatus).forEach(status => {
            expect(statusOf({ owned: ownedValueOf(status) })).toBe(status)
        })
    })

    it('names each status, with its icon on the card and in the counts', () => {
        expect(Object.values(InventoryStatus).map(statusLabel)).toEqual(['Owned', 'Not Owned', 'Wishlist'])
        expect(STATUS_SELECT_OPTIONS).toEqual([
            { value: 'not-owned', label: 'Not Owned' },
            { value: 'owned', label: '✓ Owned' },
            { value: 'wishlist', label: '♡ Wishlist' }
        ])
        expect(statusCountLabel('owned', 3)).toBe('✓ 3 Owned')
        expect(statusCountLabel('not-owned', 176)).toBe('176 Not Owned')
        expect(statusCountLabel('wishlist', 0)).toBe('♡ 0 Wishlist')
    })

    it('says what happened when the person changes the status of an item', () => {
        expect(statusChangeMessage('owned')).toBe('Moved to Collection')
        expect(statusChangeMessage('wishlist')).toBe('Moved to Wishlist')
        expect(statusChangeMessage('not-owned')).toBe('Marked as Not Owned')
    })
})

describe('the status filter', () => {
    it('offers All, Owned, Not Owned and Wishlist, in this order, with plain names', () => {
        expect(STATUS_FILTER_OPTIONS).toEqual([
            { value: 'all', label: 'All' },
            { value: 'owned', label: 'Owned' },
            { value: 'not-owned', label: 'Not Owned' },
            { value: 'wishlist', label: 'Wishlist' }
        ])
        expect(ALL_STATUSES).toBe('all')
    })

    it('keeps the items of the chosen status, and all of them with "all"', () => {
        const kept = (filter) => items.filter(item => passesStatusFilter(item, filter)).map(item => item.id)

        expect(kept('all')).toEqual(['a', 'b', 'c', 'd', 'e'])
        expect(kept('owned')).toEqual(['a', 'e'])
        expect(kept('not-owned')).toEqual(['c', 'd'])
        expect(kept('wishlist')).toEqual(['b'])
    })

    it('a filter it does not know hides nothing', () => {
        expect(items.filter(item => passesStatusFilter(item, 'sold')).length).toBe(5)
        expect(items.filter(item => passesStatusFilter(item, undefined)).length).toBe(5)
    })
})

describe('the counts by status', () => {
    it('counts every item once, in one of the three', () => {
        expect(countByStatus(items)).toEqual({ owned: 2, 'not-owned': 2, wishlist: 1 })
        expect(countByStatus([])).toEqual({ owned: 0, 'not-owned': 0, wishlist: 0 })
    })
})
