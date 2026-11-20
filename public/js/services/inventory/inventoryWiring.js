/**
 * inventoryWiring - where the inventory is put together with its real sources (the app has no
 * Composition Root yet; like services/albums/albumLoading.js, this is the one place that knows
 * which repository serves the inventory).
 *
 * Exports the app's InventoryService. A screen reads the inventory from the store
 * (stores/inventory.js) and asks this service for every change.
 */

import { db } from '../../firebase-init.js'
import { InventoryRepository } from '../../repositories/InventoryRepository.js'
import { cacheManager } from '../../cache/CacheManager.js'
import { inventoryStore } from '../../stores/inventory.js'
import { userStore } from '../../stores/UserStore.js'
import { InventoryService } from './InventoryService.js'

export const inventoryService = new InventoryService({
    store: inventoryStore,
    createRepository: (userId) => new InventoryRepository(db, cacheManager, userId)
})

// The inventory follows the person on the app
userStore.subscribe(state => inventoryService.handleUserChange(state))
