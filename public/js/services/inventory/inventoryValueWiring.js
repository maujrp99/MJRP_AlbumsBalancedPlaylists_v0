/**
 * inventoryValueWiring - where the value of the inventory is put together with its real sources
 * (F75; like services/inventory/inventoryWiring.js, the one place that knows which ones they are).
 *
 * Exports the app's InventoryValueService: the app's own server through the one way the app calls
 * it (api/serverFetch.js, with the person's login), the browser cache with its time to live
 * (cache/CacheManager.js), and the InventoryService, which writes to the items.
 *
 * A visitor (the guest login) is never asked for: the route of the values answers only to a
 * person with an account, like the paid routes (api/paidRoutes.js).
 */

import { serverFetch } from '../../api/serverFetch.js'
import { mayUsePaidRoutes } from '../../api/paidRoutes.js'
import { createValueApi } from '../../api/valueApi.js'
import { cacheManager } from '../../cache/CacheManager.js'
import { inventoryService } from './inventoryWiring.js'
import { InventoryValueService } from './InventoryValueService.js'

const API_BASE = window.__api_base || '/api'

export const inventoryValues = new InventoryValueService({
    api: createValueApi({ fetchServer: serverFetch, base: API_BASE }),
    cache: cacheManager,
    inventory: inventoryService,
    mayAsk: mayUsePaidRoutes
})
