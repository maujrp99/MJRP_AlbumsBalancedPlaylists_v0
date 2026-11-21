/**
 * F57 - the rules of the one album picker (Home and series edit): the same filters, the same
 * order, the same badges, as pure functions.
 */
import { describe, it, expect } from 'vitest'
import {
    PICKER_FILTERS, defaultFilters, toggleFilter, visibleAlbums, countByFilter, newestFirst, findAlbum, badgesOf
} from '../../public/js/models/albumPicker.js'
import { ALBUM_TYPES } from '../../public/js/models/albumType.js'

const album = (title, type = 'Album', releaseDate = '2000-01-01') => ({ id: title, title, type, releaseDate })

describe('albumPicker: filters', () => {
    it('one filter for each album type, the unknown one included, in the order of the buttons', () => {
        expect(PICKER_FILTERS.map(filter => filter.label)).toEqual(['Studio', 'EPs', 'Singles', 'Live', 'Compendiums', 'Other'])
        expect(PICKER_FILTERS.map(filter => filter.type).sort()).toEqual([...ALBUM_TYPES].sort())
    })

    it('starts with the studio albums only', () => {
        expect(defaultFilters()).toEqual({ albums: true, eps: false, singles: false, live: false, compilations: false, uncategorized: false })
    })

    it('a toggle gives a new state; a key that is no filter changes nothing', () => {
        const start = defaultFilters()
        const next = toggleFilter(start, 'eps')

        expect(next).toEqual({ ...start, eps: true })
        expect(start.eps).toBe(false)
        expect(toggleFilter(next, 'eps')).toEqual(start)
        expect(toggleFilter(start, 'nothing')).toBe(start)
    })

    it('shows the albums of the filters that are on; an album with no known type is unknown', () => {
        const albums = [album('A'), album('B', 'EP'), album('C', 'Uncategorized'), album('D', 'Weird'), { id: 'E', title: 'E' }]

        expect(visibleAlbums(albums, defaultFilters()).map(a => a.title)).toEqual(['A'])
        expect(visibleAlbums(albums, { ...defaultFilters(), albums: false, uncategorized: true }).map(a => a.title)).toEqual(['C', 'D', 'E'])
        expect(visibleAlbums(albums, toggleFilter(defaultFilters(), 'eps')).map(a => a.title)).toEqual(['A', 'B'])
    })
})

describe('albumPicker: counts', () => {
    it('counts the albums of each filter; an album with no known type counts as unknown', () => {
        const counts = countByFilter([album('A'), album('B'), album('C', 'EP'), album('D', 'Weird'), { title: 'E' }])

        expect(counts).toEqual({ albums: 2, eps: 1, singles: 0, live: 0, compilations: 0, uncategorized: 2 })
        expect(countByFilter()).toEqual({ albums: 0, eps: 0, singles: 0, live: 0, compilations: 0, uncategorized: 0 })
    })
})

describe('albumPicker: the list', () => {
    it('newest first, without changing the list given', () => {
        const albums = [album('Old', 'Album', '1992-04-20'), album('New', 'Album', '1994-02-14'), { id: 'x', title: 'No date' }]

        expect(newestFirst(albums).map(a => a.title)).toEqual(['New', 'Old', 'No date'])
        expect(albums[0].title).toBe('Old')
    })

    it('finds the album of a card by its id', () => {
        const albums = [album('A'), { appleMusicId: '77', title: 'B' }]

        expect(findAlbum(albums, 'A').title).toBe('A')
        expect(findAlbum(albums, '77').title).toBe('B')
        expect(findAlbum(albums, 'nope')).toBeNull()
        expect(findAlbum(undefined, 'A')).toBeNull()
    })

    it('badges: the edition from the title, the type from the classifier', () => {
        expect(badgesOf(album('good kid, m.A.A.d city (Deluxe Version)'))).toEqual(['Deluxe'])
        expect(badgesOf(album('Loaded (Remastered)', 'Live'))).toEqual(['Remaster', 'Live'])
        expect(badgesOf(album('Watery, Domestic', 'EP'))).toEqual(['EP'])
        expect(badgesOf(album('Hits', 'Compilation'))).toEqual(['Comp'])
        expect(badgesOf(album('One', 'Single'))).toEqual(['Single'])
        expect(badgesOf(album('Plain'))).toEqual([])
    })
})
