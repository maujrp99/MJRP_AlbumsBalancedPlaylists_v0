/**
 * F49 (UAT-06) - which series of the "all series" panel show every album: the cut at 12 and the
 * choice of the person, as rules with no screen.
 */
import { describe, it, expect } from 'vitest'
import { SERIES_ALBUM_LIMIT, cutAlbums, SeriesExpansion } from '../../public/js/models/seriesExpansion.js'

const albums = (count) => Array.from({ length: count }, (_, index) => ({ id: `a${index + 1}` }))

describe('cutAlbums', () => {
    it('cuts a series at 12 albums and says how many it holds back', () => {
        expect(SERIES_ALBUM_LIMIT).toBe(12)
        const cut = cutAlbums(albums(15), false)
        expect(cut.shown.map(album => album.id)).toEqual(albums(12).map(album => album.id))
        expect(cut.hidden).toBe(3)
    })

    it('holds nothing back from a series of 12 albums or fewer', () => {
        expect(cutAlbums(albums(12), false)).toEqual({ shown: albums(12), hidden: 0 })
        expect(cutAlbums([], false)).toEqual({ shown: [], hidden: 0 })
    })

    it('shows every album of a series the person opened', () => {
        expect(cutAlbums(albums(40), true)).toEqual({ shown: albums(40), hidden: 0 })
    })
})

describe('SeriesExpansion', () => {
    it('remembers the series the person opened, one by one', () => {
        const expansion = new SeriesExpansion()
        expansion.syncScope('ALL')
        expansion.expand('s1')

        expect(expansion.isExpanded('s1')).toBe(true)
        expect(expansion.isExpanded('s2')).toBe(false)
        expect(expansion.list()).toEqual(['s1'])
    })

    it('keeps the choice while the scope is the same', () => {
        const expansion = new SeriesExpansion()
        expansion.syncScope('ALL')
        expansion.expand('s1')
        expansion.syncScope('ALL')

        expect(expansion.list()).toEqual(['s1'])
    })

    it('forgets every choice when the scope changes', () => {
        const expansion = new SeriesExpansion()
        expansion.syncScope('ALL')
        expansion.expand('s1')
        expansion.syncScope('SINGLE:s1')
        expansion.syncScope('ALL')

        expect(expansion.list()).toEqual([])
    })

    it('ignores a series with no id', () => {
        const expansion = new SeriesExpansion()
        expansion.expand(undefined)
        expansion.expand('')
        expect(expansion.list()).toEqual([])
    })
})
