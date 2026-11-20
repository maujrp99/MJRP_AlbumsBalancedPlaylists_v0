/**
 * AlbumCacheAdapter - AlbumCachePort over the app's two-layer cache (memory + IndexedDB).
 *
 * One record per album QUERY (the resolved name does not exist before the search):
 *   { album: <plain data>, enrichment: { <source>: { status, at, reason? } } }
 * - the base album is saved as soon as it is found; each source adds its own status;
 * - "the source has nothing" ('empty') is believed for a time that depends on WHY (EMPTY_TRUST):
 *   the source said so itself, with the reason, or nobody said why (then a short time only, so a
 *   missing rating does not stick);
 * - "the source has no page" ('empty' with the reason 'not_found') is decided by the identity rule
 *   of the server, so its record keeps the version of the rule that decided it (`rule`) and is
 *   believed only while that is the version of the app (IDENTITY_RULE_VERSION): a rule that learns
 *   to find more albums makes every older "no page" be asked again, once (F68);
 * - a failure is never saved, and "not connected to the source" is not saved either (F69); the
 *   person's own ranking is never saved with the album;
 * - get() always hands out a new Album, never the object it keeps;
 * - get() asks the one identity rule (F55) whether the record is still the album the query asks
 *   for, and drops it when it is not: the key is the query, so a record written when "the right
 *   artist was enough" may hold another album. The check covers both layers (memory, IndexedDB)
 *   and costs no network; only a record that is dropped is searched again;
 * - peek() only reads: it is what a read-only pass over the cache uses, and it drops nothing.
 */

import { queryKey } from '../../../models/albumLoadState.js'
import { askedAlbum, compareKeptAlbum, keptAlbum, IDENTITY_RULE_VERSION } from '../../../models/askedAlbum.js'

export const ALBUM_RECORD_PREFIX = 'albumload:v1:'
const RECORD_TTL_MS = 7 * 24 * 60 * 60 * 1000
const HOUR_MS = 60 * 60 * 1000
/**
 * For how long an 'empty' is believed before the source is asked again, by its reason (F52, slice 3).
 * The reasons are the server's outcomes; `unknown` is every 'empty' that carries none: an answer
 * of the server before F52 (which could be a failure in disguise), a record written before this
 * slice, a reason with no time of its own here (the popularity's 'no_tracks'). An 'empty' of the
 * popularity with no reason at all is not believed for any time: see ALWAYS_SAYS_WHY.
 * Decided by the agent on 2026-11-19 from arch.md, F52, seção 11, item 4 - to be revised.
 */
export const EMPTY_TRUST = Object.freeze({
    // the source has no page for the album: the page may be created any day. The same reason and the
    // same time for "Spotify has no such album" (the popularity, F69): decided by the agent on
    // 2026-11-19, to be revised; it is also believed only under the identity rule that decided it.
    not_found: 24 * HOUR_MS,
    no_ratings: 7 * 24 * HOUR_MS, // the page was read and has no rating: as long as the record itself lives
    unknown: HOUR_MS
})
const emptyTrustOf = (reason) => (Object.hasOwn(EMPTY_TRUST, reason) ? EMPTY_TRUST[reason] : EMPTY_TRUST.unknown)
/** The one "empty" the identity rule decides: the source has no page that is the album asked for. */
const DECIDED_BY_THE_RULE = 'not_found'
/** A "no page" decided with another version of the rule, or with none on record, says nothing today. */
const decidedByTheRuleOfToday = (saved) => saved.reason !== DECIDED_BY_THE_RULE || saved.rule === IDENTITY_RULE_VERSION
/**
 * The sources that always say why they have nothing. An 'empty' of one of them with no reason was
 * written before it did, when "not connected" and "the call failed" were also kept as 'empty'
 * (the popularity before F69, UAT-206): it says nothing, and the source is asked again.
 */
const ALWAYS_SAYS_WHY = new Set(['popularity'])
/** Is this kept "the source has none" still to be believed? */
const emptyStillTrusted = (source, saved, now) => {
    if (!saved.reason && ALWAYS_SAYS_WHY.has(source)) return false
    return (now - saved.at) < emptyTrustOf(saved.reason) && decidedByTheRuleOfToday(saved)
}
/** What the record keeps of one source: the status and when; for an 'empty', why, and by which rule. */
const savedAnswer = (status, at, { reason, rule }) => {
    const saved = { status, at }
    if (status !== 'empty' || !reason) return saved
    saved.reason = reason
    if (reason === DECIDED_BY_THE_RULE && rule !== null) saved.rule = rule
    return saved
}
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
            const stillTrusted = saved.status !== 'empty' || emptyStillTrusted(source, saved, this.now())
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

    /**
     * @param {string|Object} query
     * @param {Album} album
     * @param {string} source
     * @param {string} status - 'done' | 'empty' (a failure is never saved: nobody calls this for one)
     * @param {Object} [options]
     * @param {string|null} [options.reason] - why it is 'empty', when the source said (see EMPTY_TRUST)
     * @param {number|null} [options.rule] - the version of the identity rule a 'not_found' was decided with
     */
    async saveEnrichment(query, album, source, status, { reason = null, rule = null } = {}) {
        if (NEVER_SAVED.has(source)) return
        const key = this._key(query)
        const record = (await this.cache.get(key)) || { enrichment: {} }
        await this.cache.set(key, {
            album: toPlain(album),
            enrichment: { ...record.enrichment, [source]: savedAnswer(status, this.now(), { reason, rule }) }
        }, RECORD_TTL_MS)
    }

    async forget(query) {
        await this.cache.invalidate(this._key(query))
    }
}
