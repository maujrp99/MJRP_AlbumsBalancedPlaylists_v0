/**
 * F82 TASK-04 (REQ-03, REQ-11) and F95 TASK-04: the one validator of the crate of albums the owner publishes for the entry
 * page (shared/content/crate.js). The Painel checks with it before saving and the entry page checks again on reading: an
 * album is what the page needs (id, title, artist, year, the artwork path on Apple's image server, the Apple Music address);
 * a bad album is refused ALONE; a side outside what the crate can draw refuses the whole crate (the page keeps its fixed set).
 */
import { describe, it, expect } from 'vitest'
import {
    CRATE_LIMITS, CRATE_SCHEMA_VERSION, artPathOf, buildCrateSave, coverUrl, flatCrate, readCrateDocument, sameCrate, sidesOfFlat,
    validateAlbum, validateCrate
} from '../../../shared/content/crate.js'

const album = (id, over = {}) => ({
    id: String(id), title: `Album ${id}`, artist: `Artist ${id}`, year: 1990 + (Number(id) % 30),
    art: `Music115/v4/aa/bb/cc/${id}/cover.jpg`, href: `https://music.apple.com/us/album/album-${id}/${id}`, ...over
})
const side = (from, count) => Array.from({ length: count }, (_, i) => album(from + i))

describe('one album of the crate', () => {
    it('is accepted with exactly the six fields the entry page needs, and comes back as a clean copy', () => {
        const result = validateAlbum({ ...album(7), extra: 'x' })
        expect(result).toEqual({ ok: true, album: album(7) })
    })

    it('a title or an artist with markup is refused, and so is an empty or an endless one', () => {
        expect(validateAlbum(album(1, { title: '<img src=x onerror=alert(1)>' }))).toEqual({ ok: false, reason: 'markup' })
        expect(validateAlbum(album(1, { artist: 'A > B' }))).toEqual({ ok: false, reason: 'markup' })
        expect(validateAlbum(album(1, { title: '   ' }))).toEqual({ ok: false, reason: 'empty' })
        expect(validateAlbum(album(1, { title: 12 }))).toEqual({ ok: false, reason: 'not_text' })
        expect(validateAlbum(album(1, { artist: 'x'.repeat(201) }))).toEqual({ ok: false, reason: 'too_long' })
    })

    it('the year is a whole number of four digits', () => {
        for (const year of ['1994', 1994.5, 94, 30000, null]) expect(validateAlbum(album(1, { year })), String(year)).toEqual({ ok: false, reason: 'year' })
        expect(validateAlbum(album(1, { year: 1967 })).ok).toBe(true)
    })

    it('the cover is a PATH on Apple\'s image server: an address, another server, a way out of the folder or odd characters are refused', () => {
        for (const art of [
            'https://evil.example/x.jpg', '//evil.example/x.jpg', '/Music/x.jpg', 'Music/../../x.jpg', 'Music/x y.jpg', 'Music/x.jpg?u=1',
            'Music/x.jpg#f', 'Music\\x.jpg', 'Music/a@b/x.jpg', 'javascript:alert(1)', '', 5, `Music/${'a'.repeat(400)}.jpg`, 'Music/a..b.jpg', 'x.jpg'
        ]) expect(validateAlbum(album(1, { art })), String(art)).toEqual({ ok: false, reason: 'cover' })
    })

    it('the address to listen is an Apple Music one, https, and nothing else', () => {
        for (const href of ['http://music.apple.com/us/album/x/1', 'https://music.apple.com.evil.example/us/album/x/1', 'https://evil.example/', 'javascript:alert(1)', 'music://x', '', null,
            'https://music.apple.com/us/album/<b>/1', 'https://music.apple.com/us/album/álbum/1', 'https://music.apple.com/us/album/x y/1']) {
            expect(validateAlbum(album(1, { href })), String(href)).toEqual({ ok: false, reason: 'link' })
        }
    })

    it('the id is a short name of letters, digits, - and _', () => {
        for (const id of ['', 'a b', '../x', 'x'.repeat(65), 12]) expect(validateAlbum(album(1, { id })), String(id)).toEqual({ ok: false, reason: 'id' })
    })

    it('something that is not a record is refused', () => {
        for (const input of [null, 'x', [], 3]) expect(validateAlbum(input)).toEqual({ ok: false, reason: 'not_an_album' })
    })
})

describe('the address of a cover', () => {
    it('is always on the one image server the entry page allows', () => {
        expect(coverUrl('Music115/v4/aa/x.jpg', 360)).toBe('https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/aa/x.jpg/360x360bb.webp')
    })

    it('the path is taken out of an artwork address of Apple\'s catalogue, whatever its numbered server; anything else gives null', () => {
        expect(artPathOf('https://is3-ssl.mzstatic.com/image/thumb/Music115/v4/e0/4b/c4/x/093624924722.jpg/{w}x{h}bb.jpg')).toBe('Music115/v4/e0/4b/c4/x/093624924722.jpg')
        expect(artPathOf('https://is1-ssl.mzstatic.com/image/thumb/Music5/v4/2f/Court_2500px.jpg/600x600bb.webp')).toBe('Music5/v4/2f/Court_2500px.jpg')
        for (const url of ['https://evil.example/image/thumb/Music/x.jpg/{w}x{h}bb.jpg', 'https://is1-ssl.mzstatic.com.evil.example/image/thumb/M/x.jpg/{w}x{h}bb.jpg', 'http://is1-ssl.mzstatic.com/image/thumb/M/x.jpg/{w}x{h}bb.jpg', 'https://is1-ssl.mzstatic.com/other/x.jpg', '', null]) {
            expect(artPathOf(url), String(url)).toBeNull()
        }
    })
})

describe('the whole crate', () => {
    it('says the limits of each side, from what the crate can draw', () => {
        expect(CRATE_LIMITS).toEqual({ a: { min: 6, max: 10 }, b: { min: 4, max: 10 } })
    })

    it('two sides inside the limits are accepted, in the order given (the front first)', () => {
        const result = validateCrate({ sideA: side(1, 8), sideB: side(20, 7) })
        expect(result.ok).toBe(true)
        expect(result.sides.a.map(a => a.id)).toEqual(['1', '2', '3', '4', '5', '6', '7', '8'])
        expect(result.sides.b).toHaveLength(7)
        expect(result.rejected).toEqual([])
    })

    it('a bad album is refused alone and the others go on', () => {
        const sideA = side(1, 8)
        sideA[2] = album(3, { title: '<b>x</b>' })
        const result = validateCrate({ sideA, sideB: side(20, 7) })
        expect(result.ok).toBe(true)
        expect(result.sides.a.map(a => a.id)).toEqual(['1', '2', '4', '5', '6', '7', '8'])
        expect(result.rejected).toEqual([{ side: 'a', index: 2, reason: 'markup' }])
    })

    it('the same album twice stays once (the second is refused)', () => {
        const sideB = side(20, 7)
        sideB[1] = album(1)
        const result = validateCrate({ sideA: side(1, 8), sideB })
        expect(result.sides.b.map(a => a.id)).not.toContain('1')
        expect(result.rejected).toEqual([{ side: 'b', index: 1, reason: 'repeated' }])
    })

    it('a side with too few or too many good albums refuses the crate, and says which side', () => {
        expect(validateCrate({ sideA: side(1, 5), sideB: side(20, 7) })).toMatchObject({ ok: false, reason: 'side_a_count' })
        expect(validateCrate({ sideA: side(1, 11), sideB: side(20, 7) })).toMatchObject({ ok: false, reason: 'side_a_count' })
        expect(validateCrate({ sideA: side(1, 8), sideB: side(20, 3) })).toMatchObject({ ok: false, reason: 'side_b_count' })
        expect(validateCrate({ sideA: side(1, 8), sideB: side(20, 11) })).toMatchObject({ ok: false, reason: 'side_b_count' })
        // refused albums count as absent
        const sideA = side(1, 6)
        sideA[0] = album(1, { href: 'https://evil.example/' })
        expect(validateCrate({ sideA, sideB: side(20, 7) })).toMatchObject({ ok: false, reason: 'side_a_count' })
    })

    it('what is not two lists is not a crate', () => {
        for (const input of [null, {}, { sideA: side(1, 8) }, { sideA: 'x', sideB: [] }, []]) expect(validateCrate(input)).toMatchObject({ ok: false, reason: 'not_a_crate' })
    })
})

describe('the crate as the entry page stands it', () => {
    it('is one row: side A from the front, then side B from the back (its front record is the last)', () => {
        const sides = { a: side(1, 6), b: side(20, 4) }
        expect(flatCrate(sides).map(a => a.id)).toEqual(['1', '2', '3', '4', '5', '6', '23', '22', '21', '20'])
    })

    it('and a row with its count of side B gives the two sides back', () => {
        const sides = { a: side(1, 6), b: side(20, 4) }
        expect(sidesOfFlat(flatCrate(sides), 4)).toEqual(sides)
    })
})

describe('the published document', () => {
    it('is read by its two lists and its sequence of saves', () => {
        expect(readCrateDocument({ _schemaVersion: 1, rev: 4, sideA: [1], sideB: [2], previous: {} })).toEqual({ ok: true, rev: 4, sideA: [1], sideB: [2] })
        expect(readCrateDocument({ sideA: [], sideB: [] })).toEqual({ ok: true, rev: 0, sideA: [], sideB: [] })
        for (const data of [null, 'x', { rev: 1 }, { sideA: [], sideB: {} }]) expect(readCrateDocument(data).ok).toBe(false)
    })

    it('a save writes the two sides, rev plus one, and the earlier value only of the side that changed', () => {
        const live = { _schemaVersion: 1, rev: 4, sideA: side(1, 6), sideB: side(20, 4) }
        const next = { a: side(1, 6), b: [...side(20, 4)].reverse() }
        const { data, changed } = buildCrateSave(live, next)
        expect(changed).toEqual(['sideB'])
        expect(data).toEqual({ _schemaVersion: CRATE_SCHEMA_VERSION, rev: 5, sideA: next.a, sideB: next.b, previous: { sideB: live.sideB } })
    })

    it('the first save is rev 1 and keeps «nothing» as the earlier value; an equal crate changes nothing', () => {
        const sides = { a: side(1, 6), b: side(20, 4) }
        const first = buildCrateSave(null, sides)
        expect(first.data.rev).toBe(1)
        expect(first.data.previous).toEqual({ sideA: null, sideB: null })
        expect(first.changed).toEqual(['sideA', 'sideB'])
        expect(buildCrateSave(first.data, sides).changed).toEqual([])
    })

    it('two crates are the same when every album of every side is the same, in the same order', () => {
        const sides = { a: side(1, 6), b: side(20, 4) }
        expect(sameCrate(sides, { a: side(1, 6), b: side(20, 4) })).toBe(true)
        expect(sameCrate(sides, { a: side(1, 6), b: side(20, 4).reverse() })).toBe(false)
        expect(sameCrate(sides, { a: [...side(1, 5), album(6, { year: 2001 })], b: side(20, 4) })).toBe(false)
    })
})
