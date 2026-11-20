import { sortInventory } from '../../public/js/models/inventorySort.js'

const titles = (items) => items.map(item => item.title)

describe('the order of the inventory', () => {
    it('orders by artist and then by title, whatever the case', () => {
        const items = [
            { artist: 'Yes', title: 'Fragile' },
            { artist: 'david gilmour', title: 'On An Island' },
            { artist: 'David Gilmour', title: 'About Face' },
            { artist: 'AC/DC', title: 'POWER UP' }
        ]
        expect(titles(sortInventory(items, { field: 'artist', direction: 'asc' })))
            .toEqual(['POWER UP', 'About Face', 'On An Island', 'Fragile'])
    })

    it('orders by price as a number, highest first when asked', () => {
        const items = [
            { artist: 'A', title: 'cheap', purchasePrice: '9' },
            { artist: 'A', title: 'dear', purchasePrice: 100 },
            { artist: 'A', title: 'none', purchasePrice: null }
        ]
        expect(titles(sortInventory(items, { field: 'purchasePrice', direction: 'desc' })))
            .toEqual(['dear', 'cheap', 'none'])
    })

    it('falls back to artist and title when the chosen field is equal', () => {
        const items = [
            { artist: 'B', title: 'two', purchasePrice: null },
            { artist: 'A', title: 'one', purchasePrice: null }
        ]
        expect(titles(sortInventory(items, { field: 'purchasePrice', direction: 'desc' })))
            .toEqual(['one', 'two'])
    })

    it('reads an item with no artist as an empty name, first', () => {
        const items = [{ artist: 'A', title: 'x' }, { title: 'y' }]
        expect(titles(sortInventory(items, { field: 'artist', direction: 'asc' }))).toEqual(['y', 'x'])
    })
})
