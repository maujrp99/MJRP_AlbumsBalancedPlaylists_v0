/**
 * F82 TASK-11 and TASK-14 (REQ-06, REQ-08, REQ-09): the repository of the published content. It knows the paths and the
 * shape; the store (the read, the transaction) comes from outside. The save is ONE transaction: the document with rev =
 * read + 1 and `previous`, and who saved and when in cmsWork/*, never in the public document.
 */
import { describe, it, expect } from 'vitest'
import { PublishedContentRepository } from '../../../shared/data/PublishedContentRepository.js'
import { PublishedContentSaveRepository } from '../../../shared/data/PublishedContentSaveRepository.js'

/** A store over a plain map of path -> data, with the modular SDK's names. */
function fakeStore(initial = {}) {
    const docs = new Map(Object.entries(initial))
    const log = []
    const snapshot = (path) => ({ exists: () => docs.has(path), data: () => docs.get(path) })
    return {
        db: { name: 'db' },
        docs,
        log,
        doc: (db, ...segments) => ({ path: segments.join('/') }),
        getDoc: async (ref) => { log.push(['getDoc', ref.path]); return snapshot(ref.path) },
        setDoc: async (ref, data) => { log.push(['setDoc', ref.path]); docs.set(ref.path, data) },
        serverTimestamp: () => '<server time>',
        runTransaction: async (db, body) => {
            const writes = []
            const result = await body({
                get: async (ref) => { log.push(['tx.get', ref.path]); return snapshot(ref.path) },
                set: (ref, data) => { writes.push([ref.path, data]) }
            })
            writes.forEach(([path, data]) => { log.push(['tx.set', path]); docs.set(path, data) })
            return result
        }
    }
}

describe('reading', () => {
    it('reads the texts of a language from published/texts_<language>', async () => {
        const store = fakeStore({ 'published/texts_pt': { rev: 2, texts: { a: 'A' } } })
        const repo = new PublishedContentRepository(store)

        expect(await repo.readTexts('pt')).toEqual({ exists: true, data: { rev: 2, texts: { a: 'A' } } })
        expect(await repo.readTexts('en')).toEqual({ exists: false })
        expect(store.log).toEqual([['getDoc', 'published/texts_pt'], ['getDoc', 'published/texts_en']])
    })

    it('refuses a language that is not of the site', async () => {
        await expect(new PublishedContentRepository(fakeStore()).readTexts('../x')).rejects.toThrow(/language/)
    })

    it('reads the site document and the record of an administrator', async () => {
        const repo = new PublishedContentRepository(fakeStore({ 'published/site': { rev: 1, switches: {} }, 'cmsAdmins/u1': { role: 'super' } }))

        expect(await repo.readSite()).toEqual({ exists: true, data: { rev: 1, switches: {} } })
        expect(await repo.readAdmin('u1')).toEqual({ role: 'super' })
        expect(await repo.readAdmin('u2')).toBe(null)
        expect(await repo.readAdmin('')).toBe(null)
    })

    it('the record that the rules refuse to show is no record', async () => {
        const store = fakeStore()
        store.getDoc = async () => { throw Object.assign(new Error('no'), { code: 'permission-denied' }) }
        expect(await new PublishedContentRepository(store).readAdmin('u1')).toBe(null)
    })

    it('a read that fails is told, not turned into «not found»', async () => {
        const store = fakeStore()
        store.getDoc = async () => { throw new Error('offline') }
        await expect(new PublishedContentRepository(store).readTexts('en')).rejects.toThrow('offline')
        await expect(new PublishedContentRepository(store).readAdmin('u1')).rejects.toThrow('offline')
    })

    it('reading asks the store for the read only, and the repository that reads does not save', async () => {
        const { db, doc, getDoc } = fakeStore({ 'published/texts_en': { rev: 1, texts: {} } })
        const repo = new PublishedContentRepository({ db, doc, getDoc })
        expect((await repo.readTexts('en')).exists).toBe(true)
        expect(repo.saveTexts).toBeUndefined()
        await expect(new PublishedContentSaveRepository({ db, doc, getDoc }).saveTexts('en', { loadedRev: 1, loadedTexts: {}, edits: { a: 'A' }, updatedBy: 'u1' }))
            .rejects.toThrow(/runTransaction/)
    })

    it('a repository with no read fails when it is made', () => {
        expect(() => new PublishedContentRepository({ db: {} })).toThrow(/doc, getDoc/)
    })
})

describe('the save of the Painel: one transaction', () => {
    it('writes rev = read + 1 with the previous of the changed keys, and who saved in cmsWork', async () => {
        const store = fakeStore({ 'published/texts_pt': { _schemaVersion: 1, rev: 4, texts: { a: 'A', b: 'B' }, previous: { old: 'x' } } })
        const repo = new PublishedContentSaveRepository(store)

        const result = await repo.saveTexts('pt', { loadedRev: 4, loadedTexts: { a: 'A', b: 'B' }, edits: { a: 'A2' }, updatedBy: 'u1' })

        expect(result).toEqual({ status: 'saved', rev: 5, changed: ['a'], texts: { a: 'A2', b: 'B' } })
        expect(store.docs.get('published/texts_pt')).toEqual({ _schemaVersion: 1, rev: 5, texts: { a: 'A2', b: 'B' }, previous: { a: 'A' } })
        expect(store.docs.get('cmsWork/save_texts_pt')).toEqual({ _schemaVersion: 1, doc: 'texts_pt', rev: 5, keys: ['a'], updatedBy: 'u1', updatedAt: '<server time>' })
        expect(store.log).toEqual([['tx.get', 'published/texts_pt'], ['tx.set', 'published/texts_pt'], ['tx.set', 'cmsWork/save_texts_pt']])
    })

    it('the public document never says who saved', async () => {
        const store = fakeStore()
        await new PublishedContentSaveRepository(store).saveTexts('en', { loadedRev: 0, loadedTexts: {}, edits: { a: 'A' }, updatedBy: 'u1' })
        expect(JSON.stringify(store.docs.get('published/texts_en'))).not.toContain('u1')
        expect(store.docs.get('published/texts_en').rev).toBe(1)
    })

    it('the same key saved on another device: conflict, and nothing is written', async () => {
        const store = fakeStore({ 'published/texts_pt': { _schemaVersion: 1, rev: 5, texts: { a: 'A-other', b: 'B' } } })
        const repo = new PublishedContentSaveRepository(store)

        const result = await repo.saveTexts('pt', { loadedRev: 4, loadedTexts: { a: 'A', b: 'B' }, edits: { a: 'A-mine' }, updatedBy: 'u1' })

        expect(result).toEqual({ status: 'conflict', rev: 5, texts: { a: 'A-other', b: 'B' }, conflicts: [{ key: 'a', loaded: 'A', other: 'A-other', yours: 'A-mine' }] })
        expect(store.docs.get('published/texts_pt').rev).toBe(5)
        expect(store.docs.has('cmsWork/save_texts_pt')).toBe(false)
    })

    it('another key saved on another device: this save goes over the live document', async () => {
        const store = fakeStore({ 'published/texts_pt': { _schemaVersion: 1, rev: 5, texts: { a: 'A', b: 'B-other' } } })
        const result = await new PublishedContentSaveRepository(store).saveTexts('pt', { loadedRev: 4, loadedTexts: { a: 'A', b: 'B' }, edits: { a: 'A-mine' }, updatedBy: 'u1' })

        expect(result).toEqual({ status: 'saved', rev: 6, changed: ['a'], texts: { a: 'A-mine', b: 'B-other' } })
    })

    it('the conflict is solved by saving again over what came back', async () => {
        const store = fakeStore({ 'published/texts_pt': { _schemaVersion: 1, rev: 5, texts: { a: 'A-other' } } })
        const repo = new PublishedContentSaveRepository(store)
        const conflict = await repo.saveTexts('pt', { loadedRev: 4, loadedTexts: { a: 'A' }, edits: { a: 'A-mine' }, updatedBy: 'u1' })
        const again = await repo.saveTexts('pt', { loadedRev: conflict.rev, loadedTexts: conflict.texts, edits: { a: 'A-mine' }, updatedBy: 'u1' })

        expect(again.status).toBe('saved')
        expect(store.docs.get('published/texts_pt')).toEqual({ _schemaVersion: 1, rev: 6, texts: { a: 'A-mine' }, previous: { a: 'A-other' } })
    })

    it('nothing changed: nothing is written', async () => {
        const store = fakeStore({ 'published/texts_pt': { _schemaVersion: 1, rev: 5, texts: { a: 'A' } } })
        const result = await new PublishedContentSaveRepository(store).saveTexts('pt', { loadedRev: 5, loadedTexts: { a: 'A' }, edits: { a: 'A' }, updatedBy: 'u1' })

        expect(result).toEqual({ status: 'unchanged', rev: 5, texts: { a: 'A' } })
        expect(store.log.filter(([what]) => what === 'tx.set')).toEqual([])
    })

    it('a save with nobody to name is refused before the transaction', async () => {
        const store = fakeStore()
        await expect(new PublishedContentSaveRepository(store).saveTexts('pt', { loadedRev: 0, loadedTexts: {}, edits: { a: 'A' }, updatedBy: '' })).rejects.toThrow(/updatedBy/)
        expect(store.log).toEqual([])
    })

    it('a refusal of the rules comes out as it is', async () => {
        const store = fakeStore()
        store.runTransaction = async () => { throw Object.assign(new Error('denied'), { code: 'permission-denied' }) }
        await expect(new PublishedContentSaveRepository(store).saveTexts('pt', { loadedRev: 0, loadedTexts: {}, edits: { a: 'A' }, updatedBy: 'u1' }))
            .rejects.toMatchObject({ code: 'permission-denied' })
    })
})

describe('the work area of the Painel', () => {
    it('reads and writes a document of cmsWork', async () => {
        const store = fakeStore()
        const repo = new PublishedContentRepository(store)

        expect(await repo.readWork('approvals_pt')).toBe(null)
        await repo.writeWork('approvals_pt', { approved: { a: 3 } })
        expect(await repo.readWork('approvals_pt')).toEqual({ _schemaVersion: 1, approved: { a: 3 } })
        expect(store.log.at(-2)).toEqual(['setDoc', 'cmsWork/approvals_pt'])
    })

    it('the repository that saves reads too', async () => {
        const repo = new PublishedContentSaveRepository(fakeStore({ 'published/texts_pt': { rev: 2, texts: { a: 'A' } } }))
        expect(await repo.readTexts('pt')).toEqual({ exists: true, data: { rev: 2, texts: { a: 'A' } } })
    })

    it('refuses an id that is a path', async () => {
        await expect(new PublishedContentRepository(fakeStore()).writeWork('a/b', {})).rejects.toThrow(/id/)
    })
})
