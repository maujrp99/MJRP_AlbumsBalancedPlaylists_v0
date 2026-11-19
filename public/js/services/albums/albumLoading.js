/**
 * albumLoading - where the album load is put together with its real sources (the app has no
 * Composition Root yet; this is the one place that knows which adapter serves which port).
 *
 * Exports the app's AlbumLoadService and keeps the albums shelf (stores/albums.js) as a
 * projection of the load store, so the screens that read the shelf keep working.
 */

import { albumLoadStore } from '../../stores/albumLoad.js'
import { albumsStore } from '../../stores/albums.js'
import { albumSeriesStore } from '../../stores/albumSeries.js'
import { Album } from '../../models/Album.js'
import { cacheManager } from '../../cache/CacheManager.js'
import { apiClient } from '../../api/client.js'
import { musicKitService } from '../MusicKitService.js'
import { optimizedAlbumLoader } from '../OptimizedAlbumLoader.js'
import { applyBEAData } from '../../helpers/BEAEnrichmentHelper.js'
import { applyEnrichmentToAlbum } from '../../helpers/SpotifyEnrichmentHelper.js'
import { userRankingRepository } from '../../repositories/UserRankingRepository.js'
import { AlbumLoadService } from './AlbumLoadService.js'
import { CatalogAdapter } from './adapters/CatalogAdapter.js'
import { AcclaimEnricher, PopularityEnricher, UserRankingEnricher } from './adapters/enrichers.js'
import { AlbumCacheAdapter } from './adapters/AlbumCacheAdapter.js'

/** The shelf context that holds the albums of every series. */
export const ALL_SERIES_CONTEXT = 'ALL_SERIES_VIEW'
export const ALL_SCOPE = 'ALL'
export const singleScope = (seriesId) => `SINGLE:${seriesId}`

const catalog = new CatalogAdapter({
    musicKit: musicKitService,
    fetchFromServer: (query) => apiClient._fetchAlbumFromAPI(query),
    generateAlbumId: (data) => apiClient.generateAlbumId(data),
    findLocalCover: async (artist, title) => {
        const match = await optimizedAlbumLoader.findAlbum(artist, title)
        return match ? optimizedAlbumLoader.getArtworkUrl(match, 500) : null
    }
})

const enrichers = {
    acclaim: new AcclaimEnricher({
        requestRatings: (albumData) => apiClient.BEAenrichAlbum(albumData),
        applyRatings: applyBEAData
    }),
    popularity: new PopularityEnricher({
        applyPopularity: (album) => applyEnrichmentToAlbum(album, { fetchIfMissing: true, silent: true })
    }),
    userRanking: new UserRankingEnricher({
        getUserId: () => albumSeriesStore.getUserId(),
        getRanking: (userId, albumId) => userRankingRepository.getRanking(userId, albumId)
    })
}

export const albumCachePort = new AlbumCacheAdapter({
    cache: cacheManager,
    createAlbum: (plain) => new Album(plain)
})

export const albumLoadService = new AlbumLoadService({
    store: albumLoadStore,
    catalog,
    enrichers,
    cache: albumCachePort
})

/** Copy what the load store has into the shelf the other screens read. */
export function projectLoadedAlbums(store = albumLoadStore, shelf = albumsStore, service = albumLoadService) {
    const bySeries = Object.fromEntries(store.getSeriesIds().map(id => [id, store.getAlbums(id)]))
    if (service.scopeKey === ALL_SCOPE) bySeries[ALL_SERIES_CONTEXT] = store.getAllAlbums()
    shelf.setAlbumsBySeries(bySeries)
}

albumLoadStore.subscribe(() => projectLoadedAlbums())
