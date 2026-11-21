/**
 * clearAlbumCaches - forget what the app keeps in the browser about albums, and only that.
 *
 * The albums live in the app cache (memory + the IndexedDB `mjrp-cache`), which also keeps the
 * ratings, the personal rankings that were read and the lists the repositories cache. They are
 * cleared BY NAME (ALBUM_CACHE_KEY_PREFIXES), never the whole cache: the Discogs value readings of the
 * inventory (`inventoryvalue:`, six hours) and the day's exchange rates (`exchangerates:`) stay, and a
 * future store stays too until someone names it here (F75, UAT-267). Entries of
 * the old album cache may still be in localStorage (`album_cache_v…`). Nothing else of localStorage
 * is touched: the Spotify login, the saved series and the screen choices stay.
 *
 * The albums in memory (the load store and the shelf) are not emptied here: the caller reloads the page.
 */

import { ALBUM_RECORD_PREFIX } from './adapters/AlbumCacheAdapter.js'

/** Entries of the old album cache in localStorage (cache/albumCache.js, removed in F65: a browser may still hold them). */
export const LEGACY_ALBUM_KEY_PREFIX = 'album_cache_v'

/**
 * The cache keys "Clear Cache" clears, by prefix: the kept albums, the personal rankings, the Spotify
 * enrichment and the repository documents (series, playlists, inventory: keyed by their Firestore path).
 */
export const ALBUM_CACHE_KEY_PREFIXES = [
    ALBUM_RECORD_PREFIX,
    'userRanking:',
    'spotify_enrichment:',
    'artifacts/'
]

/**
 * @param {Object} deps
 * @param {Object} deps.loadService - { stop() }: the album load, stopped first so nothing is written back
 * @param {Object} deps.cache - { clearPrefixes(prefixes): Promise<void> }: the app cache
 * @param {Storage} deps.storage - where the old entries are (localStorage)
 * @returns {Promise<{ legacyEntriesRemoved: number }>}
 * @throws when the cache cannot be cleared: the caller must not say it did
 */
export async function clearAlbumCaches({ loadService, cache, storage }) {
    loadService.stop()

    await cache.clearPrefixes(ALBUM_CACHE_KEY_PREFIXES)

    const legacyKeys = []
    for (let index = 0; index < storage.length; index++) {
        const key = storage.key(index)
        if (key && key.startsWith(LEGACY_ALBUM_KEY_PREFIX)) legacyKeys.push(key)
    }
    legacyKeys.forEach(key => storage.removeItem(key))

    return { legacyEntriesRemoved: legacyKeys.length }
}
