/**
 * Removing an album from the inventory also forgets the "already in inventory" answer kept for
 * that album, so adding it again right after works (it used to say "already in inventory" for
 * as long as the cache lived).
 */
import { describe, it, expect, vi } from 'vitest'

vi.mock('firebase/firestore', () => ({
    collection: vi.fn(), doc: vi.fn(), getDoc: vi.fn(), getDocs: vi.fn(), addDoc: vi.fn(), setDoc: vi.fn(),
    updateDoc: vi.fn(), deleteDoc: vi.fn(), query: vi.fn(), where: vi.fn(), orderBy: vi.fn(), limit: vi.fn(),
    serverTimestamp: vi.fn(), writeBatch: vi.fn(), runTransaction: vi.fn(), startAfter: vi.fn(), Timestamp: {}
}))

import { InventoryRepository } from '../../public/js/repositories/InventoryRepository.js'

const build = () => {
    const cache = { get: vi.fn(async () => null), set: vi.fn(async () => { }), invalidate: vi.fn(async () => { }) }
    const repository = new InventoryRepository({}, cache, 'user-1')
    repository.delete = vi.fn(async () => { })
    return { repository, cache }
}

describe('InventoryRepository.removeAlbum', () => {
    it('deletes the item and forgets what was kept for the album it held', async () => {
        const { repository, cache } = build()
        repository.findById = vi.fn(async () => ({ id: 'inv-1', albumData: { id: 'kendrick-lamar_gnx' } }))

        await repository.removeAlbum('inv-1')

        expect(repository.delete).toHaveBeenCalledWith('inv-1')
        expect(cache.invalidate).toHaveBeenCalledWith(repository.getCacheKey('album_kendrick-lamar_gnx'))
    })

    it('still deletes when the item cannot be read first', async () => {
        const { repository } = build()
        repository.findById = vi.fn(async () => { throw new Error('offline') })

        await repository.removeAlbum('inv-1')

        expect(repository.delete).toHaveBeenCalledWith('inv-1')
    })
})
