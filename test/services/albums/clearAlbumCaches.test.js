/**
 * "Clear Cache" clears what the app keeps about albums, and only that (F48, UAT-177).
 */
import { describe, it, expect, vi } from 'vitest'
import { clearAlbumCaches, ALBUM_CACHE_KEY_PREFIXES } from '../../../public/js/services/albums/clearAlbumCaches.js'

/** A Storage with the part of the browser contract the function uses. */
const makeStorage = (initial) => {
    const data = new Map(Object.entries(initial))
    return {
        get length() { return data.size },
        key: (index) => [...data.keys()][index] ?? null,
        getItem: (key) => data.get(key) ?? null,
        removeItem: (key) => { data.delete(key) },
        keys: () => [...data.keys()]
    }
}

const build = (overrides = {}) => {
    const order = []
    const deps = {
        loadService: { stop: vi.fn(() => order.push('stop')) },
        cache: { clearPrefixes: vi.fn(async () => { order.push('clear') }), clear: vi.fn(async () => {}) },
        storage: makeStorage({
            'album_cache_v3.1_artist_-_album': '{}',
            'album_cache_v3.1_other': '{}',
            album_cache_migration_start: '1700000000000',
            spotify_access_token: 'token',
            mjrp_series: '[]',
            albumsViewMode: 'grid'
        }),
        ...overrides
    }
    return { deps, order }
}

describe('clearAlbumCaches (F48, UAT-177)', () => {
    it('stops the load in flight before clearing, so nothing is written back', async () => {
        const { deps, order } = build()

        await clearAlbumCaches(deps)

        expect(order).toEqual(['stop', 'clear'])
    })

    it('clears the album, ranking and repository entries of the cache by name, never the whole cache', async () => {
        const { deps } = build()

        await clearAlbumCaches(deps)

        expect(deps.cache.clearPrefixes).toHaveBeenCalledTimes(1)
        expect(deps.cache.clearPrefixes).toHaveBeenCalledWith(ALBUM_CACHE_KEY_PREFIXES)
        expect(deps.cache.clear).not.toHaveBeenCalled()
    })

    it('does not name the Discogs value readings or the exchange rates (F75, UAT-267): they expire by themselves', () => {
        const kept = ['inventoryvalue:v2:user-1:item-1', 'exchangerates:v1']

        for (const key of kept) {
            expect(ALBUM_CACHE_KEY_PREFIXES.some(prefix => key.startsWith(prefix))).toBe(false)
        }
    })

    it('names the entries of the albums, the rankings, the Spotify enrichment and the repositories', () => {
        const cleared = ['albumload:v1:abc', 'userRanking:u:a', 'spotify_enrichment:x', 'artifacts/app/users/u/curator/data/series:s']

        for (const key of cleared) {
            expect(ALBUM_CACHE_KEY_PREFIXES.some(prefix => key.startsWith(prefix))).toBe(true)
        }
    })

    it('removes the old album entries of localStorage and says how many', async () => {
        const { deps } = build()

        const result = await clearAlbumCaches(deps)

        expect(deps.storage.keys().filter(key => key.startsWith('album_cache_v'))).toEqual([])
        expect(result).toEqual({ legacyEntriesRemoved: 2 })
    })

    it('keeps everything else: the Spotify login, the saved series, the screen choices, the migration date', async () => {
        const { deps } = build()

        await clearAlbumCaches(deps)

        expect(deps.storage.keys().sort()).toEqual(['album_cache_migration_start', 'albumsViewMode', 'mjrp_series', 'spotify_access_token'])
    })

    it('fails, and says so, when the cache cannot be cleared', async () => {
        const { deps } = build({ cache: { clearPrefixes: vi.fn(async () => { throw new Error('blocked') }) } })

        await expect(clearAlbumCaches(deps)).rejects.toThrow('blocked')
    })
})
