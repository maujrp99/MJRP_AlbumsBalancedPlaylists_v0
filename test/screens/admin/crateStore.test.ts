/**
 * F82 TASK-04 (REQ-03): the two ports of the Painel's crate section. The storage: what was read as the crate to work on (the
 * published one, the fixed set when nothing is published, a published one that does not pass the check), the administrator's
 * record, and the save handed to the repository. The search: the server's route, its albums checked again, its failures named.
 */
import { describe, it, expect, vi } from 'vitest'
import { searchAlbums, searchReasonOf } from '../../../public/js/screens/admin/appleAlbums'
import { encodeAlbum, validateCrate } from '../../../shared/content/crate.js'
import { COVER_SETS } from '../../../public/splash/covers.js'
import { crateOf, crateStore, type CrateRepository } from '../../../public/js/screens/admin/crateStore'
import { fixedCrateOf } from '../../../public/js/screens/admin/fixedCrate'
import { album, entryPage, fixedCrate, side } from './support'

const fixed = async () => fixedCrate()
/** A side as the document stores it: one line of text an album. */
const lines = (list: Parameters<typeof encodeAlbum>[0][]): string[] => list.map((entry) => encodeAlbum(entry))

describe('the fixed set, read from the entry page itself', () => {
    it('is the real set the page shows: side A from the front, side B from ITS front (the last sleeve of the page)', () => {
        const real: Array<{ k: string; art: string; href: string }> = COVER_SETS.real
        const sides = fixedCrate()
        expect(sides.a.map((entry) => entry.id)).toEqual(real.slice(0, real.length - 7).map((entry) => entry.k))
        expect(sides.b.map((entry) => entry.id)).toEqual(real.slice(-7).reverse().map((entry) => entry.k))
        expect(sides.a[0]).toEqual({ id: 'vu-nico', title: 'The Velvet Underground & Nico', artist: 'The Velvet Underground & Nico', year: 1967, art: real[0].art, href: real[0].href })
    })

    it('passes the check of the crate whole: it can be saved as it is', () => {
        const sides = fixedCrate()
        const checked = validateCrate({ sideA: sides.a, sideB: sides.b })
        expect(checked.ok).toBe(true)
        expect(checked.rejected).toEqual([])
    })

    it('a page of fictional albums, or a page with no crate, offers no fixed set: the two sides come empty', () => {
        expect(fixedCrateOf(entryPage('fictional'))).toEqual({ a: [], b: [] })
        expect(fixedCrateOf('<html><body><p>nothing</p></body></html>')).toEqual({ a: [], b: [] })
    })

    it('the page is read as an inert document: nothing of it becomes part of this one', () => {
        const before = document.querySelectorAll('*').length
        fixedCrateOf(entryPage())
        expect(document.querySelectorAll('*').length).toBe(before)
    })
})

const repository = (over: Partial<CrateRepository> = {}): CrateRepository => ({
    readCrate: async () => ({ exists: false }),
    readAdmin: async () => ({ role: 'super' }),
    saveCrate: async (ask) => ({ status: 'saved', rev: ask.loadedRev + 1, sides: ask.sides }),
    ...over,
})

describe('the crate that was read', () => {
    it('nothing published: the fixed set of the entry page, revision 0', async () => {
        expect(await crateOf({ exists: false }, fixed)).toEqual({ sides: fixedCrate(), rev: 0, source: 'fixed', rejected: 0 })
    })

    it('a published crate that passes the check: its two sides and its revision, and the entry page is not even asked', async () => {
        const data = { _schemaVersion: 1, rev: 4, sideA: lines(side(1, 6)), sideB: lines(side(20, 4)) }
        const never = vi.fn(fixed)
        expect(await crateOf({ exists: true, data }, never)).toEqual({ sides: { a: side(1, 6), b: side(20, 4) }, rev: 4, source: 'published', rejected: 0 })
        expect(never).not.toHaveBeenCalled()
    })

    it('a published crate with a bad album, or with a side outside the limits: its good albums, to mend, on its revision', async () => {
        const bad = { rev: 4, sideA: lines([album(1, { art: 'https://evil.example/x.jpg' }), ...side(2, 6)]), sideB: lines(side(20, 4)) }
        expect(await crateOf({ exists: true, data: bad }, fixed)).toEqual({ sides: { a: side(2, 6), b: side(20, 4) }, rev: 4, source: 'mend', rejected: 1 })
        const short = { rev: 9, sideA: lines(side(1, 2)), sideB: lines(side(20, 4)) }
        expect(await crateOf({ exists: true, data: short }, fixed)).toEqual({ sides: { a: side(1, 2), b: side(20, 4) }, rev: 9, source: 'mend', rejected: 0 })
    })

    it('a document that is not a crate: the fixed set to start from, on the document\'s revision so the next save follows it', async () => {
        expect(await crateOf({ exists: true, data: { rev: 3, something: 'else' } }, fixed)).toEqual({ sides: fixedCrate(), rev: 3, source: 'mend', rejected: 0 })
    })
})

describe('the storage', () => {
    it('reads the crate and the person\'s own administrator record', async () => {
        const readAdmin = vi.fn(async () => ({ role: 'super' }))
        const store = crateStore({ repository: async () => repository({ readAdmin }), uid: () => 'owner', fixed })
        expect(await store.read()).toMatchObject({ source: 'fixed', allowed: true })
        expect(readAdmin).toHaveBeenCalledWith('owner')
        const other = crateStore({ repository: async () => repository({ readAdmin: async () => null }), uid: () => 'someone', fixed })
        expect((await other.read()).allowed).toBe(false)
    })

    it('hands the save to the repository with who saves', async () => {
        const saveCrate = vi.fn(async (ask: { loadedRev: number; sides: object }) => ({ status: 'saved' as const, rev: 5, sides: ask.sides }))
        const store = crateStore({ repository: async () => repository({ saveCrate }), uid: () => 'owner', fixed })
        const sides = { a: side(1, 6), b: side(20, 4) }
        expect(await store.save({ loadedRev: 4, sides })).toEqual({ status: 'saved', rev: 5, sides })
        expect(saveCrate).toHaveBeenCalledWith({ loadedRev: 4, sides, updatedBy: 'owner' })
    })
})

describe('the search of Apple Music\'s catalogue, by the server', () => {
    it('posts the query to the administrator\'s route and gives the albums back', async () => {
        const post = vi.fn(async () => ({ status: 200, body: { data: { albums: [album(1), album(2)] }, outcome: 'found' } }))
        expect(await searchAlbums({ post }, 'harvest')).toEqual({ ok: true, albums: [album(1), album(2)] })
        expect(post).toHaveBeenCalledWith('/api/admin/apple-albums', { query: 'harvest' })
    })

    it('checks each album again: one the entry page could not show is left out, whatever the server said', async () => {
        const post = async () => ({ status: 200, body: { data: { albums: [album(1, { title: '<b>x</b>' }), album(2, { art: '//evil.example/x.jpg' }), album(3), 'nonsense'] } } })
        expect(await searchAlbums({ post }, 'x')).toEqual({ ok: true, albums: [album(3)] })
    })

    it('nothing found is an empty list; a body that is not the contract is an empty list too', async () => {
        expect(await searchAlbums({ post: async () => ({ status: 200, body: { data: { albums: [] }, outcome: 'not_found' } }) }, 'x')).toEqual({ ok: true, albums: [] })
        expect(await searchAlbums({ post: async () => ({ status: 200, body: null }) }, 'x')).toEqual({ ok: true, albums: [] })
    })

    it('a failure names its reason: the server\'s name first, the status after, «did not answer» last', async () => {
        expect(searchReasonOf(502, { error: { reason: 'search-not-configured' } })).toBe('notConfigured')
        expect(searchReasonOf(400, { error: { reason: 'not-an-album-link' } })).toBe('notALink')
        expect(searchReasonOf(429, { error: { reason: 'too-many-requests' } })).toBe('tooMany')
        expect(searchReasonOf(401, null)).toBe('session')
        expect(searchReasonOf(403, {})).toBe('notAdmin')
        expect(searchReasonOf(500, 'x')).toBe('service')
        expect(await searchAlbums({ post: async () => ({ status: 503, body: { error: { code: 'upstream_busy', reason: 'service-unavailable' } } }) }, 'x')).toEqual({ ok: false, reason: 'service' })
        expect(await searchAlbums({ post: async () => { throw new Error('offline') } }, 'x')).toEqual({ ok: false, reason: 'service' })
    })
})
