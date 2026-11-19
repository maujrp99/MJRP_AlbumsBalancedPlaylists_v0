/**
 * AlbumCacheAdapter - AlbumCachePort over the app's two-layer cache (memory + IndexedDB).
 *
 * One record per album QUERY (the resolved name does not exist before the search):
 *   { album: <plain data>, enrichment: { <source>: { status, at } } }
 * - the base album is saved as soon as it is found; each source adds its own status;
 * - "the source has nothing" is trusted for a short time only, so a missing rating does not stick;
 * - a failure is never saved; the person's own ranking is never saved with the album;
 * - get() always hands out a new Album, never the object it keeps;
 * - get() asks the one identity rule (F55) whether the record is still the album the query asks
 *   for, and drops it when it is not: the key is the query, so a record written when "the right
 *   artist was enough" may hold another album. The check covers both layers (memory, IndexedDB)
 *   and costs no network; only a record that is dropped is searched again;
 * - peek() only reads: it is what a read-only pass over the cache uses, and it drops nothing.
 */

import { queryKey } from '../../../models/albumLoadState.js'
import { askedAlbum, compareKeptAlbum, keptAlbum } from '../../../models/askedAlbum.js'

export const ALBUM_RECORD_PREFIX = 'albumload:v1:'
const RECORD_TTL_MS = 7 * 24 * 60 * 60 * 1000
const EMPTY_TRUSTED_FOR_MS = 60 * 60 * 1000
const NEVER_SAVED = new Set(['userRanking'])

const toPlain = (album) => {
    const plain = JSON.parse(JSON.stringify(album))
    delete plain.hasUserRanking
    delete plain.userRanking
    delete plain.seriesIds
    ;[...(plain.tracks || []), ...(plain.tracksOriginalOrder || [])].forEach(track => { delete track.userRank })
    return plain
}

export class AlbumCacheAdapter {
    /**
     * @param {Object} deps
     * @param {Object} deps.cache - { get(key), peek(key), set(key, value, ttl), invalidate(key) }
     * @param {Function} deps.createAlbum - (plain) => Album
     * @param {Function} [deps.now]
     */
    constructor({ cache, createAlbum, now = () => Date.now() }) {
        this.cache = cache
        this.createAlbum = createAlbum
        this.now = now
    }

    _key(query) {
        return ALBUM_RECORD_PREFIX + queryKey(query)
    }

    /** @returns {Promise<{ album, enrichment: Object<string,string> } | null>} */
    async get(query, { seriesId = null } = {}) {
        const record = await this.cache.get(this._key(query))
        if (!record?.album) return null
        if (!compareKeptAlbum(askedAlbum(query), keptAlbum(record.album)).same) {
            await this.forget(query)
            return null
        }

        const enrichment = {}
        Object.entries(record.enrichment || {}).forEach(([source, saved]) => {
            const stillTrusted = saved.status !== 'empty' || (this.now() - saved.at) < EMPTY_TRUSTED_FOR_MS
            if (stillTrusted) enrichment[source] = saved.status
        })

        const album = this.createAlbum(JSON.parse(JSON.stringify(record.album)))
        if (seriesId) album.seriesIds = [seriesId]
        return { album, enrichment }
    }

    /**
     * What is kept for the query, as the identity rule reads it, without changing anything: no
     * Album is built, nothing is promoted, removed or saved. For the album identity count (F55).
     * @returns {Promise<{ artist: string, title: string, year: *, identityReason: string|null } | null>}
     */
    async peek(query) {
        const record = await this.cache.peek(this._key(query))
        return keptAlbum(record?.album)
    }

    async saveBase(query, album) {
        await this.cache.set(this._key(query), { album: toPlain(album), enrichment: {} }, RECORD_TTL_MS)
    }

    async saveEnrichment(query, album, source, status) {
        if (NEVER_SAVED.has(source)) return
        const key = this._key(query)
        const record = (await this.cache.get(key)) || { enrichment: {} }
        await this.cache.set(key, {
            album: toPlain(album),
            enrichment: { ...record.enrichment, [source]: { status, at: this.now() } }
        }, RECORD_TTL_MS)
    }

    async forget(query) {
        await this.cache.invalidate(this._key(query))
    }
}
