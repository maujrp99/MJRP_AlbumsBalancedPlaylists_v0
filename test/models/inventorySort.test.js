import { sortInventory, sortingFor, choiceOf, SORT_OPTIONS } from '../../public/js/models/inventorySort.js'
import { sortOptions } from '../../public/js/i18n/inventoryTexts.js'

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

describe('the order of the inventory by the averages and by the date (F71, S-56)', () => {
    const withAverages = (title, rating, popularity, artist = 'A') => ({
        artist, title, averages: { rating, popularity, ratedTracks: 1, popTracks: 1, at: '2026-11-20T10:00:00.000Z' }
    })
    const order = (items, field) => titles(sortInventory(items, sortingFor(field)))

    it('the choices, in order, with the direction each one starts with', () => {
        expect(sortOptions().map(({ value, label }) => [value, label])).toEqual([
            ['artist', 'Artist (A-Z)'], ['artist_desc', 'Artist (Z-A)'], ['averageRating', 'Avg Rating (↓)'], ['averageRating_asc', 'Avg Rating (↑)'],
            ['averagePopularity', 'Avg Pop (↓)'], ['averagePopularity_asc', 'Avg Pop (↑)'], ['value', 'Value (↓)'], ['value_asc', 'Value (↑)'],
            ['addedToInventory', 'Newest'], ['addedToInventory_asc', 'Oldest']
        ])
        expect(sortingFor('artist')).toEqual({ field: 'artist', direction: 'asc' })
        expect(sortingFor('averageRating')).toEqual({ field: 'averageRating', direction: 'desc' })
        expect(sortingFor('averagePopularity')).toEqual({ field: 'averagePopularity', direction: 'desc' })
        expect(sortingFor('addedToInventory')).toEqual({ field: 'addedToInventory', direction: 'desc' })
        expect(sortingFor('nonsense')).toEqual({ field: 'artist', direction: 'asc' })
    })

    it('each criterion is offered in its two directions, and a sorting knows which choice it is (REQ-21)', () => {
        expect(sortingFor('artist_desc')).toEqual({ field: 'artist', direction: 'desc' })
        expect(sortingFor('averageRating_asc')).toEqual({ field: 'averageRating', direction: 'asc' })
        expect(sortingFor('averagePopularity_asc')).toEqual({ field: 'averagePopularity', direction: 'asc' })
        expect(sortingFor('addedToInventory_asc')).toEqual({ field: 'addedToInventory', direction: 'asc' })
        SORT_OPTIONS.forEach(option => expect(choiceOf(sortingFor(option.value))).toBe(option.value))
        expect(choiceOf(undefined)).toBe('artist')
        expect(choiceOf({ field: 'purchasePrice', direction: 'asc' })).toBe('artist')
    })

    it('lowest first puts the lowest average first, and still the item with none last', () => {
        const items = [withAverages('high', 90, 10, 'A'), withAverages('low', 60, 80, 'B'), { artist: 'C', title: 'none' }]
        expect(order(items, 'averageRating_asc')).toEqual(['low', 'high', 'none'])
        expect(order(items, 'averagePopularity_asc')).toEqual(['high', 'low', 'none'])
        expect(order(items, 'artist_desc')).toEqual(['none', 'low', 'high'])
    })

    it('Avg Rating: the highest first; an item with no rating comes last', () => {
        const items = [withAverages('low', 60, 1), { artist: 'A', title: 'never read' }, withAverages('high', 91.5, 1), withAverages('no rating', null, 90)]

        expect(order(items, 'averageRating')).toEqual(['high', 'low', 'never read', 'no rating'])
    })

    it('Avg Pop: the highest first; a popularity of zero is a value and comes before an item with none', () => {
        const items = [withAverages('none', 70, null), withAverages('zero', 70, 0), withAverages('top', 70, 88)]

        expect(order(items, 'averagePopularity')).toEqual(['top', 'zero', 'none'])
    })

    it('an item with no value comes last whatever the direction', () => {
        const items = [{ artist: 'A', title: 'none' }, withAverages('low', 10, 1), withAverages('high', 90, 1)]

        expect(titles(sortInventory([...items], { field: 'averageRating', direction: 'desc' }))).toEqual(['high', 'low', 'none'])
        expect(titles(sortInventory([...items], { field: 'averageRating', direction: 'asc' }))).toEqual(['low', 'high', 'none'])
    })

    it('ties fall back to artist and title', () => {
        const items = [withAverages('b', 80, 1, 'Zed'), withAverages('z', 80, 1, 'Abe'), withAverages('a', 80, 1, 'Abe')]

        expect(order(items, 'averageRating')).toEqual(['a', 'z', 'b'])
    })

    it('an average that is not a number counts as none', () => {
        const items = [withAverages('text', '80', 1), withAverages('real', 50, 1)]

        expect(order(items, 'averageRating')).toEqual(['real', 'text'])
    })

    describe('Recently added reads the date the items really have', () => {
        const added = (title, when, field = 'addedToInventory') => ({ artist: 'A', title, [field]: when })

        it('Firestore timestamps ({ seconds }), the newest first', () => {
            const items = [added('old', { seconds: 1700000000, nanoseconds: 0 }), added('new', { seconds: 1790000000, nanoseconds: 5 }), added('mid', { seconds: 1750000000 })]

            expect(order(items, 'addedToInventory')).toEqual(['new', 'mid', 'old'])
        })

        it('a timestamp object that knows toMillis, a Date, an ISO text and a number of ms', () => {
            const items = [
                added('timestamp', { toMillis: () => 3000 }),
                added('date', new Date(4000)),
                added('iso', new Date(2000).toISOString()),
                added('number', 1000)
            ]

            expect(order(items, 'addedToInventory')).toEqual(['date', 'timestamp', 'iso', 'number'])
        })

        it('falls back to createdAt when the item has no addedToInventory; an item with neither comes last', () => {
            const items = [{ artist: 'A', title: 'undated' }, added('created', { seconds: 2000 }, 'createdAt'), added('added', { seconds: 3000 })]

            expect(order(items, 'addedToInventory')).toEqual(['added', 'created', 'undated'])
        })

        it('a date still waiting for the server (null) or a text that is no date counts as none', () => {
            const items = [added('pending', null), added('garbage', 'not a date'), added('real', { seconds: 10 })]

            expect(order(items, 'addedToInventory')).toEqual(['real', 'garbage', 'pending'])
        })
    })
})
