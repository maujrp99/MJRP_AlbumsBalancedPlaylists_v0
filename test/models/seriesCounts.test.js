/**
 * F72 (S-55) - the albums screen says how many series and albums it holds.
 */
import { describe, it, expect } from 'vitest'
import { countAlbums, describeCounts } from '../../public/js/models/seriesCounts.js'

const group = (n) => ({ series: {}, queries: Array.from({ length: n }, (_, i) => `A - ${i}`) })

describe('countAlbums', () => {
    it('adds the albums of every series that passed the filters, on every page', () => {
        expect(countAlbums([group(3), group(5), group(0)])).toBe(8)
        expect(countAlbums([])).toBe(0)
        expect(countAlbums(undefined)).toBe(0)
    })
})

describe('describeCounts', () => {
    it('all series, nothing filtered: the series and the albums', () => {
        expect(describeCounts({ single: false, series: 47, totalSeries: 47, albums: 227 })).toBe('47 series · 227 albums')
    })

    it('a filter or a search on: how many pass, and of how many', () => {
        expect(describeCounts({ single: false, series: 12, totalSeries: 47, albums: 60 })).toBe('12 of 47 series · 60 albums')
    })

    it('one series on screen: its albums', () => {
        expect(describeCounts({ single: true, series: 1, totalSeries: 47, albums: 5 })).toBe('5 albums')
    })

    it('one album and one series are written in the singular', () => {
        expect(describeCounts({ single: false, series: 1, totalSeries: 1, albums: 1 })).toBe('1 series · 1 album')
        expect(describeCounts({ single: true, series: 1, totalSeries: 3, albums: 1 })).toBe('1 album')
    })

    it('nothing passes the filter: says so with the total', () => {
        expect(describeCounts({ single: false, series: 0, totalSeries: 47, albums: 0 })).toBe('0 of 47 series · 0 albums')
    })

    it('no series at all: nothing to say', () => {
        expect(describeCounts({ single: false, series: 0, totalSeries: 0, albums: 0 })).toBe('')
        expect(describeCounts(null)).toBe('')
    })
})
