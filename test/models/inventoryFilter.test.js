/**
 * F71 (S-54) - what the inventory screen shows for a search, a format and a status, and the
 * three counts of its header.
 */
import { describe, it, expect } from 'vitest'
import { filterInventory, statusCountsFor } from '../../public/js/models/inventoryFilter.js'

const items = [
    { id: 'core', title: 'Core', artist: 'Stone Temple Pilots', format: 'cd', owned: true, notes: 'japanese import' },
    { id: 'purple', title: 'Purple', artist: 'Stone Temple Pilots', format: 'Vinyl LP', owned: false },
    { id: 'ten', title: 'Ten', artist: 'Pearl Jam', format: 'vinyl', owned: null },
    { id: 'vs', title: 'Vs.', artist: 'Pearl Jam', owned: null }, // from a series: no format, no notes
    { id: 'dirt', title: 'Dirt', artist: 'Alice in Chains', format: 'digital' }
]
const ids = (list) => list.map(item => item.id)

describe('the items the inventory screen shows', () => {
    it('with no filter, all of them, in the order given', () => {
        expect(ids(filterInventory(items))).toEqual(['core', 'purple', 'ten', 'vs', 'dirt'])
        expect(ids(filterInventory(items, { search: '', format: 'all', ownership: 'all' }))).toEqual(['core', 'purple', 'ten', 'vs', 'dirt'])
    })

    it('the status filter keeps one status: Owned, Not Owned or Wishlist', () => {
        expect(ids(filterInventory(items, { ownership: 'owned' }))).toEqual(['core'])
        expect(ids(filterInventory(items, { ownership: 'not-owned' }))).toEqual(['ten', 'vs', 'dirt'])
        expect(ids(filterInventory(items, { ownership: 'wishlist' }))).toEqual(['purple'])
    })

    it('the search reads the title, the artist and the notes, whatever the case', () => {
        expect(ids(filterInventory(items, { search: '  PEARL ' }))).toEqual(['ten', 'vs'])
        expect(ids(filterInventory(items, { search: 'purple' }))).toEqual(['purple'])
        expect(ids(filterInventory(items, { search: 'import' }))).toEqual(['core'])
    })

    it('the format filter reads the format as written ("Vinyl LP" is vinyl); an item with no format is in no format', () => {
        expect(ids(filterInventory(items, { format: 'vinyl' }))).toEqual(['purple', 'ten'])
        expect(ids(filterInventory(items, { format: 'cd' }))).toEqual(['core'])
        expect(ids(filterInventory(items, { format: 'digital' }))).toEqual(['dirt'])
    })

    it('the status filter works together with the search and the format', () => {
        expect(ids(filterInventory(items, { search: 'pearl', ownership: 'not-owned' }))).toEqual(['ten', 'vs'])
        expect(ids(filterInventory(items, { search: 'pearl', format: 'vinyl', ownership: 'not-owned' }))).toEqual(['ten'])
        expect(ids(filterInventory(items, { search: 'stone', ownership: 'not-owned' }))).toEqual([])
        expect(ids(filterInventory(items, { format: 'vinyl', ownership: 'wishlist' }))).toEqual(['purple'])
    })

    it('does not change the list it was given', () => {
        const before = [...items]
        filterInventory(items, { ownership: 'owned' })
        expect(items).toEqual(before)
    })
})

describe('the three counts of the header', () => {
    it('count the items that pass the search and the format, by status', () => {
        expect(statusCountsFor(items, {})).toEqual({ owned: 1, 'not-owned': 3, wishlist: 1 })
        expect(statusCountsFor(items, { search: 'pearl' })).toEqual({ owned: 0, 'not-owned': 2, wishlist: 0 })
        expect(statusCountsFor(items, { format: 'vinyl' })).toEqual({ owned: 0, 'not-owned': 1, wishlist: 1 })
    })

    it('do not go to zero when a status is chosen: they say how many each status has', () => {
        expect(statusCountsFor(items, { ownership: 'owned' })).toEqual({ owned: 1, 'not-owned': 3, wishlist: 1 })
        expect(statusCountsFor(items, { search: 'stone', ownership: 'wishlist' })).toEqual({ owned: 1, 'not-owned': 0, wishlist: 1 })
    })
})
