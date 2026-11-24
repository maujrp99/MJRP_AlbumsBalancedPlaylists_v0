/**
 * F82 TASK-04 (REQ-03, REQ-11) and F95 TASK-04: the one validator of the crate of albums the owner publishes for the entry
 * page (shared/content/crate.js). The Painel checks with it before saving and the entry page checks again on reading: an
 * album is what the page needs (id, title, artist, year, the artwork path on Apple's image server, the Apple Music address);
 * a bad album is refused ALONE; a side outside what the crate can draw refuses the whole crate (the page keeps its fixed set).
 */
import { describe, it, expect } from 'vitest'
import {
    CRATE_LIMITS, CRATE_SCHEMA_VERSION, artPathOf, buildCrateSave, coverUrl, decodeAlbum, encodeAlbum, flatCrate, readCrateDocument, sameCrate, sidesOfFlat,
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

    it('a name with a control character or a mark that changes the direction of the text is refused; one made only of invisible characters is empty', () => {
        for (const title of ['line\nbreak', 'tab\there', 'bell\u0007', 'nul\u0000', 'evil\u202Egnp.exe', 'a\u2066b', 'mark\u200F']) {
            expect(validateAlbum(album(1, { title })), JSON.stringify(title)).toEqual({ ok: false, reason: 'characters' })
        }
        expect(validateAlbum(album(1, { artist: 'x\u202Ey' }))).toEqual({ ok: false, reason: 'characters' })
        for (const title of ['\u200B', '\u200B \u200D\uFEFF', '\u00AD\u2060']) expect(validateAlbum(album(1, { title })), JSON.stringify(title)).toEqual({ ok: false, reason: 'empty' })
        // letters of any language, accents and a zero-width joiner inside a name are a name
        for (const title of ['Admirável Chip Novo', 'ジャズ', 'Ænima', 'Sigur Rós ( )', 'a\u200Db']) expect(validateAlbum(album(1, { title })).ok, title).toBe(true)
    })

    it('the year is a whole number of four digits', () => {
        for (const year of ['1994', 1994.5, 94, 30000, null]) expect(validateAlbum(album(1, { year })), String(year)).toEqual({ ok: false, reason: 'year' })
        expect(validateAlbum(album(1, { year: 1967 })).ok).toBe(true)
    })

    it('the cover is a PATH on Apple\'s image server: an address, another server, a way out of the folder or odd characters are refused', () => {
        for (const art of [
            'https://evil.example/x.jpg', '//evil.example/x.jpg', '/Music/x.jpg', 'Music/../../x.jpg', 'Music/x y.jpg', 'Music/x.jpg?u=1',
            'Music/x.jpg#f', 'Music\\x.jpg', 'Music/a@b/x.jpg', 'javascript:alert(1)', '', 5, `Music/${'a'.repeat(400)}.jpg`, 'Music/a..b.jpg', 'x.jpg',
            // a dot written as %2e is a dot for the image server: nothing encoded may leave the folder either (the judge of 2026-11-23)
            'a/%2e%2e/%2e%2e/x', 'Music/%2E%2E/x.jpg', 'Music/a%2fb/x.jpg', 'Music/.hidden/x.jpg', 'Music/x.jpg.', 'Music//x.jpg', 'Music/x.jpg/'
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
    it('an album is stored as one line of text, its six values joined by «<», which none of them can hold; the line reads back as the album', () => {
        const line = encodeAlbum(album(7, { title: 'A "quoted" & odd title', year: 1972 }))
        expect(line).toBe('A "quoted" & odd title<Artist 7<1972<7<Music115/v4/aa/bb/cc/7/cover.jpg<https://music.apple.com/us/album/album-7/7')
        expect(decodeAlbum(line)).toEqual(album(7, { title: 'A "quoted" & odd title', year: 1972 }))
        expect(validateAlbum(decodeAlbum(line)).ok).toBe(true)
    })

    it('what is not a line of six values comes back as it is, and the check refuses it', () => {
        for (const line of ['only<five<1990<id<art', 'a<b<c<d<e<f<g', '', 7, null, { id: '1' }]) {
            expect(decodeAlbum(line)).toBe(line)
            expect(validateAlbum(decodeAlbum(line)).ok).toBe(false)
        }
        // a year that is not four digits stays text, and the check refuses it
        expect(validateAlbum(decodeAlbum('T<A<19x0<1<Music/x.jpg<https://music.apple.com/us/album/a/1'))).toEqual({ ok: false, reason: 'year' })
    })

    it('is read by its two lists of lines and its sequence of saves', () => {
        const lines = (list) => list.map(encodeAlbum)
        expect(readCrateDocument({ _schemaVersion: 1, rev: 4, sideA: lines(side(1, 2)), sideB: lines(side(20, 1)) })).toEqual({ ok: true, rev: 4, sideA: side(1, 2), sideB: side(20, 1) })
        expect(readCrateDocument({ sideA: [], sideB: [] })).toEqual({ ok: true, rev: 0, sideA: [], sideB: [] })
        for (const data of [null, 'x', { rev: 1 }, { sideA: [], sideB: {} }]) expect(readCrateDocument(data).ok).toBe(false)
        // a crate read and checked: the albums of the lines
        const read = readCrateDocument({ rev: 1, sideA: lines(side(1, 6)), sideB: lines(side(20, 4)) })
        expect(validateCrate({ sideA: read.sideA, sideB: read.sideB })).toEqual({ ok: true, sides: { a: side(1, 6), b: side(20, 4) }, rejected: [] })
    })

    it('a save writes the two sides as lines and rev plus one, and NOTHING else; the earlier value of the side that changed comes apart, for the work area', () => {
        const lines = (list) => list.map(encodeAlbum)
        const live = { _schemaVersion: 1, rev: 4, sideA: lines(side(1, 6)), sideB: lines(side(20, 4)) }
        const next = { a: side(1, 6), b: [...side(20, 4)].reverse() }
        const { data, previous, changed } = buildCrateSave(live, next)
        expect(changed).toEqual(['sideB'])
        expect(data).toEqual({ _schemaVersion: CRATE_SCHEMA_VERSION, rev: 5, sideA: lines(next.a), sideB: lines(next.b) })
        expect(previous).toEqual({ sideB: live.sideB })
    })

    it('the first save is rev 1 and keeps «nothing» as the earlier value; an equal crate changes nothing', () => {
        const sides = { a: side(1, 6), b: side(20, 4) }
        const first = buildCrateSave(null, sides)
        expect(first.data.rev).toBe(1)
        expect(Object.keys(first.data).sort()).toEqual(['_schemaVersion', 'rev', 'sideA', 'sideB'])
        expect(first.previous).toEqual({ sideA: null, sideB: null })
        expect(first.changed).toEqual(['sideA', 'sideB'])
        expect(buildCrateSave(first.data, sides).changed).toEqual([])
    })

    it('the longest album the check accepts is a line the database\'s rules accept: at most 1300 characters', () => {
        const longest = album(1, { id: 'i'.repeat(64), title: 'T'.repeat(200), artist: 'A'.repeat(200), art: `Music1/${'a'.repeat(288)}.jpg`, href: `https://music.apple.com/${'x'.repeat(470)}` })
        expect(validateAlbum(longest).ok).toBe(true)
        expect(encodeAlbum(longest).length).toBeLessThanOrEqual(1300)
        expect(validateAlbum({ ...longest, href: `${longest.href}x` })).toEqual({ ok: false, reason: 'link' })
    })

    it('two crates are the same when every album of every side is the same, in the same order', () => {
        const sides = { a: side(1, 6), b: side(20, 4) }
        expect(sameCrate(sides, { a: side(1, 6), b: side(20, 4) })).toBe(true)
        expect(sameCrate(sides, { a: side(1, 6), b: side(20, 4).reverse() })).toBe(false)
        expect(sameCrate(sides, { a: [...side(1, 5), album(6, { year: 2001 })], b: side(20, 4) })).toBe(false)
    })
})
