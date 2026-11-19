/**
 * F51 (UAT-180) - text stored with HTML entities is read plain, in one place, and the album query
 * keeps one key whatever form it was stored in.
 */
import { describe, it, expect } from 'vitest'
import { decodeEntities } from '../../public/js/models/text.js'
import { parseAlbumQuery, plainAlbumQuery, toAlbumQuery } from '../../public/js/models/albumQuery.js'
import { queryKey } from '../../public/js/models/albumLoadState.js'
import { filterSeries, listArtists } from '../../public/js/models/seriesFilter.js'

describe('decodeEntities', () => {
    it('undoes the common entities', () => {
        expect(decodeEntities('Jimmy Page &amp; Robert Plant')).toBe('Jimmy Page & Robert Plant')
        expect(decodeEntities('&lt;Album&gt; &quot;One&quot; &#39;Two&#39; &apos;Three&apos;')).toBe('<Album> "One" \'Two\' \'Three\'')
        expect(decodeEntities('Guns N&#x27; Roses')).toBe("Guns N' Roses")
        expect(decodeEntities('Sigur R&#243;s')).toBe('Sigur Rós')
    })
    it('undoes text that was escaped more than once', () => {
        expect(decodeEntities('Gilmour &amp;amp; Plant')).toBe('Gilmour & Plant')
    })
    it('leaves plain text exactly as it is, a lone "&" included', () => {
        expect(decodeEntities('Simon & Garfunkel')).toBe('Simon & Garfunkel')
        expect(decodeEntities('AT&T; live')).toBe('AT&T; live')
        expect(decodeEntities('R&B &unknownthing; ok')).toBe('R&B &unknownthing; ok')
        expect(decodeEntities('')).toBe('')
    })
    it('gives back what is not text untouched', () => {
        expect(decodeEntities(null)).toBe(null)
        expect(decodeEntities(undefined)).toBe(undefined)
        expect(decodeEntities(1975)).toBe(1975)
    })
})

describe('album query stored with HTML entities (UAT-180)', () => {
    const stored = 'Jimmy Page &amp; Robert Plant - No Quarter'
    const plain = 'Jimmy Page & Robert Plant - No Quarter'

    it('parseAlbumQuery reads it plain, in the text form and in the object form', () => {
        expect(parseAlbumQuery(stored)).toEqual({ artist: 'Jimmy Page & Robert Plant', title: 'No Quarter' })
        expect(parseAlbumQuery({ artist: 'Jimmy Page &amp; Robert Plant', title: 'Walking Into Clarksdale' }))
            .toEqual({ artist: 'Jimmy Page & Robert Plant', title: 'Walking Into Clarksdale' })
        expect(parseAlbumQuery({ title: 'Page &amp; Plant - No Quarter' })).toEqual({ artist: 'Page & Plant', title: 'No Quarter' })
    })

    it('the key is the same for the stored form and for the plain form, text or object', () => {
        expect(queryKey(stored)).toBe(queryKey(plain))
        expect(queryKey({ artist: 'Jimmy Page &amp; Robert Plant', title: 'No Quarter' })).toBe(queryKey(plain))
        expect(queryKey(plain)).toBe('jimmy page & robert plant - no quarter')
    })

    it('the key of a query that never had an entity is what it always was', () => {
        expect(queryKey('Pink Floyd - Animals')).toBe('pink floyd - animals')
        expect(queryKey({ artist: 'Simon & Garfunkel', title: 'Bookends' })).toBe('simon & garfunkel - bookends')
        expect(queryKey('  AC/DC   -  Back in   Black ')).toBe('ac/dc - back in black')
    })

    it('plainAlbumQuery hands the catalog plain text and keeps the rest of the query', () => {
        expect(plainAlbumQuery(stored)).toBe(plain)
        const query = { artist: 'Page &amp; Plant', title: 'No Quarter', appleMusicId: '42', facts: { year: 1994 } }
        expect(plainAlbumQuery(query)).toEqual({ artist: 'Page & Plant', title: 'No Quarter', appleMusicId: '42', facts: { year: 1994 } })
        expect(query.artist).toBe('Page &amp; Plant') // the stored query is not changed
    })

    it('the filters and the list of artists see the plain name', () => {
        const series = [{ id: 's1', name: 'Plant', albumQueries: [stored, 'Robert Plant - Pictures at Eleven'] }]
        expect(listArtists(series)).toEqual(['Jimmy Page & Robert Plant', 'Robert Plant'])
        expect(filterSeries(series, { artist: 'Jimmy Page & Robert Plant' })[0].queries).toEqual([stored])
        expect(filterSeries(series, { search: 'page & robert' })[0].queries).toEqual([stored])
    })
})

describe('toAlbumQuery: what a series stores for an album the person picked', () => {
    it('stores the names plain, with the chosen edition, the year and the cover', () => {
        expect(toAlbumQuery({ id: '123', artist: 'Jimmy Page & Robert Plant', title: 'No Quarter', year: 1994, coverUrl: 'c.jpg' }))
            .toEqual({ artist: 'Jimmy Page & Robert Plant', title: 'No Quarter', appleMusicId: '123', year: 1994, coverUrl: 'c.jpg' })
    })
    it('never stores an entity, even when the album it was given carries one', () => {
        const query = toAlbumQuery({ appleMusicId: '9', artist: 'Page &amp; Plant', title: 'Rock &amp; Roll', artworkTemplate: 't.jpg' })
        expect(query).toEqual({ artist: 'Page & Plant', title: 'Rock & Roll', appleMusicId: '9', year: null, coverUrl: 't.jpg' })
        expect(JSON.stringify(query)).not.toContain('&amp;')
    })
    it('has no undefined field (Firestore refuses them)', () => {
        expect(Object.values(toAlbumQuery({ artist: 'A', title: 'B' })).includes(undefined)).toBe(false)
    })
})
