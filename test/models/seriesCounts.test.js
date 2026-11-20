/**
 * F72 (S-55) - the albums screen says how many albums the series on screen hold.
 */
import { describe, it, expect } from 'vitest'
import { countAlbums } from '../../public/js/models/seriesCounts.js'

const group = (n) => ({ series: {}, queries: Array.from({ length: n }, (_, i) => `A - ${i}`) })

describe('countAlbums', () => {
    it('adds the albums of the series it is given: the ones on screen', () => {
        expect(countAlbums([group(3), group(5), group(0)])).toBe(8)
        expect(countAlbums([])).toBe(0)
        expect(countAlbums(undefined)).toBe(0)
    })
})
