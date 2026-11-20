/**
 * inventoryWiring - where the inventory is put together with its real sources (the app has no
 * Composition Root yet; like services/albums/albumLoading.js, this is the one place that knows
 * which repository serves the inventory).
 *
 * Exports the app's InventoryService. A screen reads the inventory from the store
 * (stores/inventory.js) and asks this service for every change.
 */

import { db } from '../../firebase-init.js'
import { InventoryRepository } from '@shared/data/InventoryRepository.js'
import { firestoreStore } from '../../repositories/firestoreStore.js'
import { cacheManager } from '../../cache/CacheManager.js'
import { inventoryStore } from '../../stores/inventory.js'
import { userStore } from '../../stores/UserStore.js'
import { albumSeriesStore } from '../../stores/albumSeries.js'
import { getSeriesService } from '../SeriesService.js'
import { albumAsks } from '../albums/albumLoading.js'
import { InventoryService } from './InventoryService.js'

/**
 * `albumAsks` is the album load's one door: "Update ratings" asks it for the albums of the
 * inventory, so those albums go through the same queue, holds and browser cache as every screen's.
 */
export const inventoryService = new InventoryService({
    store: inventoryStore,
    createRepository: (userId) => new InventoryRepository(firestoreStore(db), cacheManager, userId),
    albumAsks
})

/**
 * The series of the person whose inventory this is, read from the cloud now (F71: "add the albums
 * of my series" starts from what is stored, whatever screens were opened before).
 *
 * The series and the inventory each follow the person on their own; if they do not name the same
 * person at this moment (a sign-in still on its way), nothing is read: the albums of one person
 * are never planned into the inventory of another.
 * @returns {Promise<Array<Object>>} the series, each with its `albumQueries`
 * @throws when the two do not name the same person, and when the read fails
 */
export async function readSeriesOfThePerson() {
    const userId = albumSeriesStore.getUserId()
    if (userId !== inventoryService.userId) {
        throw new Error('The series and the inventory are not of the same person yet')
    }
    return getSeriesService(db, null, userId).loadFromFirestore()
}

// The inventory follows the person on the app
userStore.subscribe(state => inventoryService.handleUserChange(state))
