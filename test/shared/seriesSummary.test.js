/**
 * What the app's list of series shows of each one (F78): shared/seriesSummary.js.
 */
import { describe, it, expect } from 'vitest'
import { summarizeSeries, MAX_SUMMARY_COVERS } from '../../shared/seriesSummary.js'

describe('the summary of a series, read from its document alone (F78)', () => {
    it('counts the albums asked for, texts and objects alike', () => {
        const summary = summarizeSeries({
            id: 's1',
            name: 'Prog',
            albumQueries: ['Rush - Moving Pictures', { artist: 'Yes', title: 'Fragile' }, { artist: 'Genesis', title: 'Selling England by the Pound' }]
        })
        expect(summary).toEqual({ id: 's1', name: 'Prog', albumCount: 3, covers: [] })
    })

    it('keeps the covers the queries already carry, https only, at most four', () => {
        const albumQueries = Array.from({ length: 6 }, (_, i) => ({ artist: 'A', title: `T${i}`, coverUrl: `https://img.example/${i}.jpg` }))
        albumQueries.splice(1, 0, { artist: 'B', title: 'X', coverUrl: 'javascript:alert(1)' }, { artist: 'C', title: 'Y', coverUrl: null })
        const { covers, albumCount } = summarizeSeries({ id: 's2', name: 'Covers', albumQueries })
        expect(albumCount).toBe(8)
        expect(covers).toHaveLength(MAX_SUMMARY_COVERS)
        expect(covers[0]).toBe('https://img.example/0.jpg')
        expect(covers.every(url => url.startsWith('https://'))).toBe(true)
    })

    it('a series with no queries and no name still has a row', () => {
        expect(summarizeSeries({ id: 's3' })).toEqual({ id: 's3', name: 'Untitled series', albumCount: 0, covers: [] })
        expect(summarizeSeries({ id: 's4', name: '   ', albumQueries: 'not a list' })).toEqual({ id: 's4', name: 'Untitled series', albumCount: 0, covers: [] })
    })
})
