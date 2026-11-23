/**
 * F82 TASK-14 (REQ-06, REQ-08), the judge's P2-1: the save of the Painel without the database's transaction code, which
 * every visitor was downloading. One batch writes the published document and who saved; the lock is the rule of the
 * database that only accepts `rev` equal to the stored one plus one, so a save that lost a race is refused whole, and the
 * save reads again and tries again. The rules themselves are run in the emulator (test/security/firestoreRules.emulator.js).
 */
import { describe, it, expect, vi } from 'vitest'
import fs from 'node:fs'
import { batchTransaction, MAX_ATTEMPTS } from '../../../shared/data/batchTransaction.js'

const refused = () => Object.assign(new Error('refused'), { code: 'permission-denied' })

function fakeStore({ commits = [] } = {}) {
    const batches = []
    const store = {
        db: { name: 'db' },
        getDoc: vi.fn(async (ref) => ({ ref })),
        writeBatch: vi.fn(() => {
            const batch = { sets: [], set: vi.fn((ref, data) => { batch.sets.push([ref, data]) }), commit: vi.fn(async () => { const next = commits.shift(); if (next) throw next }) }
            batches.push(batch)
            return batch
        })
    }
    return { store, batches }
}

describe('a save as one batch, locked by the rules', () => {
    it('reads through the store, writes everything in ONE batch and gives back what the body answers', async () => {
        const { store, batches } = fakeStore()
        const result = await batchTransaction(store)(store.db, async (transaction) => {
            const snapshot = await transaction.get('published/texts_pt')
            transaction.set('published/texts_pt', { rev: 2 })
            transaction.set('cmsWork/save_texts_pt', { rev: 2 })
            return { status: 'saved', read: snapshot.ref }
        })
        expect(result).toEqual({ status: 'saved', read: 'published/texts_pt' })
        expect(store.writeBatch).toHaveBeenCalledWith(store.db)
        expect(batches).toHaveLength(1)
        expect(batches[0].sets).toEqual([['published/texts_pt', { rev: 2 }], ['cmsWork/save_texts_pt', { rev: 2 }]])
        expect(batches[0].commit).toHaveBeenCalledTimes(1)
    })

    it('a body that writes nothing (a conflict, nothing changed) commits nothing', async () => {
        const { store, batches } = fakeStore()
        expect(await batchTransaction(store)(store.db, async () => ({ status: 'conflict' }))).toEqual({ status: 'conflict' })
        expect(batches[0].commit).not.toHaveBeenCalled()
    })

    it('a batch the rules refuse (another device saved in between) is read again and tried again, from scratch', async () => {
        const { store, batches } = fakeStore({ commits: [refused()] })
        let runs = 0
        const result = await batchTransaction(store)(store.db, async (transaction) => {
            runs++
            await transaction.get('published/texts_pt')
            transaction.set('published/texts_pt', { rev: runs + 1 })
            return { status: 'saved', rev: runs + 1 }
        })
        expect(result).toEqual({ status: 'saved', rev: 3 })
        expect(store.getDoc).toHaveBeenCalledTimes(2)
        expect(batches[1].sets).toEqual([['published/texts_pt', { rev: 3 }]])
    })

    it('gives up after the attempts and hands the refusal on, so the Painel says the rules refused it', async () => {
        const { store, batches } = fakeStore({ commits: Array.from({ length: MAX_ATTEMPTS }, refused) })
        await expect(batchTransaction(store)(store.db, async (transaction) => { transaction.set('a', {}); return 1 })).rejects.toMatchObject({ code: 'permission-denied' })
        expect(batches).toHaveLength(MAX_ATTEMPTS)
    })

    it('any other failure (no network) is not tried again', async () => {
        const down = Object.assign(new Error('down'), { code: 'unavailable' })
        const { store, batches } = fakeStore({ commits: [down] })
        await expect(batchTransaction(store)(store.db, async (transaction) => { transaction.set('a', {}); return 1 })).rejects.toBe(down)
        expect(batches).toHaveLength(1)
    })
})

describe('the save stays out of what every visitor downloads', () => {
    it('the file that saves imports no Firestore: it uses what the site store already has', () => {
        const source = fs.readFileSync('public/js/repositories/publishedContentWriter.js', 'utf8')
        expect(source).not.toMatch(/from 'firebase\//)
        expect(source).toContain('batchTransaction(store)')
        expect(fs.readFileSync('shared/data/batchTransaction.js', 'utf8')).not.toMatch(/\bimport\b[^\n]*from/)
    })
})
