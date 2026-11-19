/**
 * F60 (UAT-198) - when the person on the app changes, the inventory on screen goes with the person
 * who left: nothing of one account is shown to, or copied into, the next one.
 *
 * What happens at sign-out, as Firebase tells it: first "no user", then, a moment later, the new
 * anonymous account the app signs in by itself. The database refuses any read outside the
 * signed-in person's own data (firestore.rules), so the read made while there is no user fails.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'

const db = vi.hoisted(() => ({ repositories: [], findAll: {} }))

vi.mock('../../public/js/repositories/InventoryRepository.js', () => ({
    InventoryRepository: vi.fn().mockImplementation((firestore, cache, userId) => {
        const repository = {
            userId,
            findAll: vi.fn(() => db.findAll[userId]
                ? db.findAll[userId]()
                : Promise.reject(Object.assign(new Error('Missing or insufficient permissions'), { code: 'permission-denied' }))),
            addAlbum: vi.fn(async () => 'copied-id')
        }
        db.repositories.push(repository)
        return repository
    })
}))
vi.mock('../../public/js/cache/CacheManager.js', () => ({ cacheManager: {} }))
vi.mock('../../public/js/app.js', () => ({ db: {}, auth: { currentUser: null } }))
vi.mock('../../public/js/stores/UserStore.js', () => ({
    userStore: { subscribe: vi.fn(), getState: vi.fn(() => ({ currentUser: null })) }
}))

import { InventoryStore } from '../../public/js/stores/inventory.js'
import { dataSyncService } from '../../public/js/services/DataSyncService.js'

const OWNER_ALBUMS = [
    { id: 'inv-1', title: 'Animals', artist: 'Pink Floyd', format: 'vinyl' },
    { id: 'inv-2', title: 'Signals', artist: 'Rush', format: 'cd' }
]
const owner = { uid: 'owner-1', isAnonymous: false }
const nextAnonymous = { uid: 'anon-2', isAnonymous: true }
const copiesMade = () => db.repositories.reduce((count, repository) => count + repository.addAlbum.mock.calls.length, 0)

describe('InventoryStore when the person changes (UAT-198)', () => {
    let store, migrateInventory

    beforeEach(async () => {
        db.repositories.length = 0
        db.findAll = {
            'owner-1': async () => OWNER_ALBUMS.map(album => ({ ...album })),
            'anon-2': async () => []
        }
        // The real migration helper, watched: a copy between accounts would go through it or through addAlbum
        migrateInventory = vi.spyOn(dataSyncService, 'migrateInventory')
        store = new InventoryStore()
        await store.handleUserChange({ currentUser: owner })
        expect(store.getAlbums()).toHaveLength(2) // the owner is signed in, looking at the inventory
    })

    it('empties the inventory on screen at sign-out, even though nothing can be read at that moment', async () => {
        await store.handleUserChange({ currentUser: null })

        expect(store.getAlbums()).toEqual([])
        expect(store.getState().error).toBeNull()
    })

    it('empties it at once: the listeners see an empty inventory before any reading ends', () => {
        const seen = []
        store.subscribe(state => seen.push(state.albums.length))

        store.handleUserChange({ currentUser: null }) // not awaited: what the screen sees first

        expect(seen[0]).toBe(0)
        expect(store.getAlbums()).toEqual([])
    })

    it('copies nothing into the anonymous account that follows the sign-out', async () => {
        await store.handleUserChange({ currentUser: null })
        await store.handleUserChange({ currentUser: nextAnonymous })

        expect(migrateInventory).not.toHaveBeenCalled()
        expect(copiesMade()).toBe(0)
        expect(store.getAlbums()).toEqual([])
        expect(store.userId).toBe('anon-2')
    })

    it('copies nothing when the anonymous account arrives while the sign-out is still being handled', async () => {
        const signOut = store.handleUserChange({ currentUser: null })
        const anonymousSignIn = store.handleUserChange({ currentUser: nextAnonymous })
        await Promise.all([signOut, anonymousSignIn])

        expect(migrateInventory).not.toHaveBeenCalled()
        expect(copiesMade()).toBe(0)
        expect(store.getAlbums()).toEqual([])
    })

    it('does not show the previous account when its slow answer arrives after the change', async () => {
        let answerOwner
        db.findAll['owner-1'] = () => new Promise(resolve => { answerOwner = () => resolve(OWNER_ALBUMS) })
        const slowReload = store.loadAlbums() // the owner's inventory is being read again...

        await store.handleUserChange({ currentUser: nextAnonymous }) // ...and the person changes meanwhile
        answerOwner()
        await slowReload

        expect(store.getAlbums()).toEqual([])
        expect(store.userId).toBe('anon-2')
    })

    it('shows the inventory of the account that signs in next', async () => {
        await store.handleUserChange({ currentUser: null })
        await store.handleUserChange({ currentUser: nextAnonymous })
        await store.handleUserChange({ currentUser: owner })

        expect(store.getAlbums().map(album => album.id)).toEqual(['inv-1', 'inv-2'])
        expect(copiesMade()).toBe(0)
    })
})
