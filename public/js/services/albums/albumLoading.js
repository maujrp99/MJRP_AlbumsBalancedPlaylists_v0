/**
 * albumLoading - where the album load is put together with its real sources (the app has no
 * Composition Root yet; this is the one place that knows which adapter serves which port).
 *
 * Exports the app's AlbumLoadService and keeps the albums shelf (stores/albums.js) as a
 * projection of the load store, so the screens that read the shelf keep working.
 *
 * Who asks for albums, and how (ADR-0019, decision 1):
 *   - the albums screen: albumLoadService.load({ scopeKey, series, fresh }) and the load store;
 *   - any other screen (blend, playlist edit): albumAsks.albumsOf({ series, sources, signal }),
 *     which waits for the albums of those series and gives a typed result (F56).
 * No screen or controller loops over album queries or calls the API client for an album.
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
import { applySpotifyData } from '../../helpers/SpotifyEnrichmentHelper.js'
import { storedSpotifyPopularity } from '../spotify/spotifyPopularityWiring.js'
import { SpotifyService } from '../SpotifyService.js'
import { SpotifyAuthService } from '../SpotifyAuthService.js'
import { userRankingRepository } from '../../repositories/UserRankingRepository.js'
import { AlbumLoadService } from './AlbumLoadService.js'
import { AlbumAsks } from './AlbumAsks.js'
import { holdNotice, queryKey } from '../../models/albumLoadState.js'
import { auditAlbumIdentity } from './albumIdentityAudit.js'
import { keptAlbum } from '../../models/askedAlbum.js'
import { SeriesFactsService } from '../series/SeriesFactsService.js'
import { getSeriesService } from '../SeriesService.js'
import { CatalogAdapter } from './adapters/CatalogAdapter.js'
import { AcclaimEnricher, PopularityEnricher, UserRankingEnricher } from './adapters/enrichers.js'
import { AlbumCacheAdapter } from './adapters/AlbumCacheAdapter.js'
import { SpotifyPopularitySource } from './adapters/spotifyPopularitySource.js'
import { askPopularityOnConnect } from './popularityOnConnect.js'
import { clearAlbumCaches } from './clearAlbumCaches.js'

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

/** True when Spotify can be asked without the person. False is "not connected": nobody is asked. */
const spotifyIsConnected = () => SpotifyAuthService.hasSession()

/** The one path that asks Spotify for the popularity of an album (F69). */
const popularitySource = new SpotifyPopularitySource({
    store: storedSpotifyPopularity,
    spotify: SpotifyService,
    isConnected: spotifyIsConnected
})

const enrichers = {
    acclaim: new AcclaimEnricher({
        requestRatings: (albumData) => apiClient.requestRatings(albumData),
        applyRatings: applyBEAData
    }),
    popularity: new PopularityEnricher({
        readPopularity: (album) => popularitySource.read(album),
        applyPopularity: applySpotifyData
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

/**
 * The server said "sign in" or "wait" and the load is on hold (F52): one notice says so. The toast
 * is asked for only then, so the load does not bring the screen's code with it.
 */
const showHoldNotice = (hold) => {
    const notice = holdNotice(hold)
    import('../../components/Toast.js')
        .then(({ showToast }) => showToast(notice.message, notice.type, notice.durationMs))
        .catch(error => console.warn(`[albumLoading] ${notice.message}`, error?.message || error))
}

export const albumLoadService = new AlbumLoadService({
    store: albumLoadStore,
    catalog,
    enrichers,
    cache: albumCachePort,
    onHold: showHoldNotice
})

/**
 * The person connected to Spotify: the albums on screen whose popularity was "not connected" are
 * asked, that source only, through the load (F69). Nothing else starts on connect.
 */
askPopularityOnConnect({ store: albumLoadStore, service: albumLoadService, isConnected: spotifyIsConnected })

/** The one way a screen that is not the albums screen gets the albums of a series, ready (F56). */
export const albumAsks = new AlbumAsks({ service: albumLoadService, store: albumLoadStore })

/**
 * F55: how many albums of the signed-in person's series are not the album asked for, today.
 * READ-ONLY: it reads the series already in memory, the album of each query from the load of this
 * session or, failing that, from what the browser keeps (peek: nothing is promoted or removed),
 * and compares the two by the one identity rule. It writes nothing and asks no source.
 * From the browser console, signed in and with the series on screen: `await albumIdentityAudit()`.
 * @returns {Promise<{ rows: Array, summary: Object }>} also printed as a table
 */
export const countWrongAlbums = async () => {
    const report = await auditAlbumIdentity({
        series: albumSeriesStore.getSeries(),
        shownFor: async (query, series) =>
            keptAlbum(albumLoadStore.getEntry(series.id, queryKey(query))?.album) || albumCachePort.peek(query)
    })
    console.table(report.rows)
    console.log('[album identity] asked, same, different, with nothing kept to compare:', report.summary)
    return report
}

/** What the "Clear Cache" button does: stop the load and forget what the browser keeps about albums. */
export const clearAppAlbumCaches = () => clearAlbumCaches({
    loadService: albumLoadService,
    cache: cacheManager,
    storage: localStorage
})

/**
 * Copy what the load store has into the shelf the other screens read: the series of the albums
 * screen and the ones another screen asked for. The shelf has no other writer of albums.
 */
export function projectLoadedAlbums(store = albumLoadStore, shelf = albumsStore, service = albumLoadService) {
    const bySeries = Object.fromEntries(store.getAllSeriesIds().map(id => [id, store.getAlbums(id)]))
    if (service.scopeKey === ALL_SCOPE) bySeries[ALL_SERIES_CONTEXT] = store.getAllAlbums()
    shelf.setAlbumsBySeries(bySeries)
}

albumLoadStore.subscribe(() => projectLoadedAlbums())

/**
 * What the load learns about each album (its year, which sources have data) is written into the
 * series, so the filters answer without loading anything. Only the difference is written, once
 * the series has finished, a little after the last change.
 */
export const seriesFactsService = new SeriesFactsService({
    loadStore: albumLoadStore,
    seriesStore: albumSeriesStore,
    saveAlbumFacts: (seriesId, albumQueries) =>
        getSeriesService(albumSeriesStore.getDb(), null, albumSeriesStore.getUserId())
            .repository.saveAlbumFacts(seriesId, albumQueries)
})

const FACTS_SETTLE_MS = 2000
let factsTimer = null
albumLoadStore.subscribe(() => {
    clearTimeout(factsTimer)
    factsTimer = setTimeout(() => {
        seriesFactsService.syncFinishedSeries().catch(error =>
            console.warn('[albumLoading] saving the album facts failed:', error?.message || error))
    }, FACTS_SETTLE_MS)
})
