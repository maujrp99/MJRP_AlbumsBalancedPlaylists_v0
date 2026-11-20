/**
 * clearAlbumCaches - forget what the app keeps in the browser about albums, and only that.
 *
 * The albums live in the app cache (memory + the IndexedDB `mjrp-cache`), which also keeps the
 * ratings, the personal rankings that were read and the lists the repositories cache. Entries of
 * the old album cache may still be in localStorage (`album_cache_v…`). Nothing else of localStorage
 * is touched: the Spotify login, the saved series and the screen choices stay.
 *
 * The albums in memory (the load store and the shelf) are not emptied here: the caller reloads the page.
 */

/** Entries of the old album cache in localStorage (cache/albumCache.js, removed in F65: a browser may still hold them). */
export const LEGACY_ALBUM_KEY_PREFIX = 'album_cache_v'

/**
 * @param {Object} deps
 * @param {Object} deps.loadService - { stop() }: the album load, stopped first so nothing is written back
 * @param {Object} deps.cache - { clear(): Promise<void> }: the app cache
 * @param {Storage} deps.storage - where the old entries are (localStorage)
 * @returns {Promise<{ legacyEntriesRemoved: number }>}
 * @throws when the cache cannot be cleared: the caller must not say it did
 */
export async function clearAlbumCaches({ loadService, cache, storage }) {
    loadService.stop()

    await cache.clear()

    const legacyKeys = []
    for (let index = 0; index < storage.length; index++) {
        const key = storage.key(index)
        if (key && key.startsWith(LEGACY_ALBUM_KEY_PREFIX)) legacyKeys.push(key)
    }
    legacyKeys.forEach(key => storage.removeItem(key))

    return { legacyEntriesRemoved: legacyKeys.length }
}
