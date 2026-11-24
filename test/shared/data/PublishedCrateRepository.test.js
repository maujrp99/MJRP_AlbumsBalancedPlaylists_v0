/**
 * F82 TASK-04 (REQ-03, REQ-08, REQ-09): the repository of the entry page's crate, a file of its own beside the texts' (only
 * the Painel downloads it). The crate lives in `published/crate`; the save is ONE transaction, guarded by `rev`: the document with rev = read + 1 and `previous`, and
 * who saved and when in cmsWork/*, never in the public document. Another device that saved in between is a conflict, and
 * nothing is written.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { PublishedCrateRepository, CRATE_ID } from '../../../shared/data/PublishedCrateRepository.js'
import { encodeAlbum } from '../../../shared/content/crate.js'

const album = (id) => ({ id: String(id), title: `Album ${id}`, artist: `Artist ${id}`, year: 1990, art: `Music1/v4/${id}/c.jpg`, href: `https://music.apple.com/us/album/a/${id}` })
const side = (from, count) => Array.from({ length: count }, (_, i) => album(from + i))
/** A side as the document stores it: one line of text an album. */
const lines = (list) => list.map(encodeAlbum)

function fakeStore(initial = {}) {
    const docs = new Map(Object.entries(initial))
    const log = []
    const snapshot = (path) => ({ exists: () => docs.has(path), data: () => docs.get(path) })
    return {
        db: { name: 'db' }, docs, log,
        doc: (db, ...segments) => ({ path: segments.join('/') }),
        getDoc: async (ref) => { log.push(['getDoc', ref.path]); return snapshot(ref.path) },
        serverTimestamp: () => '<server time>',
        runTransaction: async (db, body) => {
            const writes = []
            const result = await body({ get: async (ref) => snapshot(ref.path), set: (ref, data) => { writes.push([ref.path, data]) } })
            writes.forEach(([path, data]) => { log.push(['tx.set', path]); docs.set(path, data) })
            return result
        }
    }
}

describe('the crate in the published content', () => {
    it('is read from published/crate; «not found» is an answer', async () => {
        expect(CRATE_ID).toBe('crate')
        const store = fakeStore({ 'published/crate': { rev: 2, sideA: [], sideB: [] } })
        expect(await new PublishedCrateRepository(store).readCrate()).toEqual({ exists: true, data: { rev: 2, sideA: [], sideB: [] } })
        expect(await new PublishedCrateRepository(fakeStore()).readCrate()).toEqual({ exists: false })
        expect(store.log).toEqual([['getDoc', 'published/crate']])
    })

    it('the first save writes rev 1 with the two sides, and who saved goes to cmsWork, never to the public document', async () => {
        const store = fakeStore()
        const sides = { a: side(1, 6), b: side(20, 4) }
        const answer = await new PublishedCrateRepository(store).saveCrate({ loadedRev: 0, sides, updatedBy: 'owner' })
        expect(answer).toEqual({ status: 'saved', rev: 1, sides })
        // the public document is the crate and nothing else: no earlier value, nobody's name
        expect(store.docs.get('published/crate')).toEqual({ _schemaVersion: 1, rev: 1, sideA: lines(sides.a), sideB: lines(sides.b) })
        expect(JSON.stringify(store.docs.get('published/crate'))).not.toContain('owner')
        expect(store.docs.get('cmsWork/save_crate')).toEqual({ _schemaVersion: 1, doc: 'crate', rev: 1, keys: ['sideA', 'sideB'], previous: { sideA: null, sideB: null }, updatedBy: 'owner', updatedAt: '<server time>' })
    })

    it('a later save follows the rev read and keeps the earlier value of the side that changed', async () => {
        const live = { _schemaVersion: 1, rev: 3, sideA: lines(side(1, 6)), sideB: lines(side(20, 4)) }
        const store = fakeStore({ 'published/crate': live })
        const sides = { a: side(1, 6).reverse(), b: side(20, 4) }
        const answer = await new PublishedCrateRepository(store).saveCrate({ loadedRev: 3, sides, updatedBy: 'owner' })
        expect(answer.status).toBe('saved')
        expect(answer.rev).toBe(4)
        expect(store.docs.get('published/crate').previous).toBeUndefined()
        expect(store.docs.get('cmsWork/save_crate').previous).toEqual({ sideA: live.sideA })
    })

    it('another device saved in between: a conflict, with what is live, and nothing written', async () => {
        const live = { _schemaVersion: 1, rev: 5, sideA: lines(side(1, 6)), sideB: lines(side(20, 4)) }
        const store = fakeStore({ 'published/crate': live })
        const answer = await new PublishedCrateRepository(store).saveCrate({ loadedRev: 4, sides: { a: side(30, 6), b: side(20, 4) }, updatedBy: 'owner' })
        expect(answer).toEqual({ status: 'conflict', rev: 5, sides: { a: side(1, 6), b: side(20, 4) } })
        expect(store.log.filter(([what]) => what === 'tx.set')).toEqual([])
    })

    it('the other device saved the very same crate: no conflict, nothing to write', async () => {
        const live = { _schemaVersion: 1, rev: 5, sideA: lines(side(1, 6)), sideB: lines(side(20, 4)) }
        const store = fakeStore({ 'published/crate': live })
        const answer = await new PublishedCrateRepository(store).saveCrate({ loadedRev: 4, sides: { a: side(1, 6), b: side(20, 4) }, updatedBy: 'owner' })
        expect(answer).toEqual({ status: 'unchanged', rev: 5, sides: { a: side(1, 6), b: side(20, 4) } })
    })

    it('the repositories every visitor or every save of the texts downloads know nothing of the crate', () => {
        for (const file of ['shared/data/PublishedContentRepository.js', 'shared/data/PublishedContentSaveRepository.js']) expect(readFileSync(file, 'utf8')).not.toMatch(/crate/i)
    })

    it('a crate that does not pass the check is never written (the Painel checked first: this is a bug of the caller)', async () => {
        const store = fakeStore()
        const repo = new PublishedCrateRepository(store)
        await expect(repo.saveCrate({ loadedRev: 0, sides: { a: side(1, 2), b: side(20, 4) }, updatedBy: 'owner' })).rejects.toThrow(/side_a_count/)
        await expect(repo.saveCrate({ loadedRev: 0, sides: { a: side(1, 6), b: side(20, 4) }, updatedBy: '' })).rejects.toThrow(/updatedBy/)
        expect(store.docs.size).toBe(0)
    })
})
