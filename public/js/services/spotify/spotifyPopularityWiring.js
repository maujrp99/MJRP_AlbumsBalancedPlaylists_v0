/**
 * spotifyPopularityWiring - where what the app holds of Spotify's answers is put together with
 * its real database (the app has no Composition Root yet; like services/inventory/inventoryWiring.js,
 * this is the one place that knows which repository serves it).
 *
 * Exports the app's StoredSpotifyPopularity. The one reader is the composition of the album load
 * (services/albums/albumLoading.js), which hands it to the popularity source.
 */

import { db } from '../../firebase-init.js'
import { SpotifyEnrichmentRepository } from '../../repositories/SpotifyEnrichmentRepository.js'
import { CacheManager } from '../../cache/CacheManager.js'
import { StoredSpotifyPopularity } from './StoredSpotifyPopularity.js'

/**
 * A cache manager of its own, as it always had: its memory layer is not the one of the album
 * load (the IndexedDB under both is the same one).
 */
export const storedSpotifyPopularity = new StoredSpotifyPopularity({
    repository: new SpotifyEnrichmentRepository(db, new CacheManager())
})
