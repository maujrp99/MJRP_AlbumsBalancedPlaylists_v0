/**
 * SpotifyPopularitySource - the ONE path that asks for the Spotify popularity of an album (F69).
 * PopularityEnricher reads it; nothing else does (test/architecture/spotifyPopularityOnePath.test.js).
 *
 *   read(album) -> Promise<
 *       { kind: 'found', data }              Spotify has the album (or the answer was already stored)
 *     | { kind: 'not_found', reason, rule }  Spotify answered: it has no such album
 *     | { kind: 'not_connected' }            there is no Spotify session: nobody was asked
 *   >
 *   and it THROWS when Spotify could not be asked (network, 5xx, "wait"). A failure is never an answer.
 *
 * The three never merge (UAT-206): before F69 they all ended as "Spotify has no data".
 *
 * - What was stored of an earlier answer (SpotifyEnrichmentStore) answers first, connected or not.
 * - "Not connected" is decided here, before any call: no session, or a session that ended while
 *   it was being used (SpotifyReconnectError: the access could not be renewed).
 * - 'not_found' is decided by the one identity rule (SpotifyService.searchAlbum, pickAlbum), in the
 *   browser, so it carries the version of the rule of the app.
 * - "Wait" (429): Spotify is not asked again before the time it gave. A short wait is thrown with
 *   `hold`, so the album load holds the popularity and asks again by itself; a wait longer than
 *   MAX_SPOTIFY_HOLD_MS, or one with no time, is thrown as the failure it is.
 *
 * Everything it reaches is given (DP-14): the store, the Spotify client, the session, the clock.
 */

import { HoldReason } from '../../../models/albumLoadState.js'
import { IDENTITY_RULE_VERSION } from '../../../models/askedAlbum.js'
import { SpotifyRateLimitError, SpotifyReconnectError } from '../../spotify/spotifyErrors.js'

/**
 * The longest wait of Spotify the album load holds for. Longer than this, the popularity fails
 * with "try again": a hold stops every screen from waiting for a source, and Spotify may ask for
 * hours. Decided by the agent on 2026-11-19 (the same 30 s the export waits) - to be revised.
 */
export const MAX_SPOTIFY_HOLD_MS = 30 * 1000

const FOUND = 'found'
const NOT_FOUND = 'not_found'
const NOT_CONNECTED = Object.freeze({ kind: 'not_connected' })

export class SpotifyPopularitySource {
    /**
     * @param {Object} deps
     * @param {Object} deps.store - { get(artist, title) -> data|null, save(artist, title, data) }
     * @param {Object} deps.spotify - { albumPopularity(artist, title) } (SpotifyService)
     * @param {Function} deps.isConnected - () => boolean, true when Spotify can be asked without the person
     * @param {Function} [deps.now]
     */
    constructor({ store, spotify, isConnected, now = () => Date.now() }) {
        this.store = store
        this.spotify = spotify
        this.isConnected = isConnected
        this.now = now
        this._waitUntil = 0 // Spotify said "wait": the time before which it is not asked again
    }

    async read(album) {
        const stored = await this.store.get(album.artist, album.title)
        if (stored) return { kind: FOUND, data: stored }
        if (!this.isConnected()) return NOT_CONNECTED

        let answer
        try {
            answer = await this._ask(album)
        } catch (error) {
            // The access could not be renewed: the session ended. Nothing failed for this album.
            if (error instanceof SpotifyReconnectError) return NOT_CONNECTED
            throw error
        }
        if (!answer.found) return { kind: NOT_FOUND, reason: answer.reason, rule: IDENTITY_RULE_VERSION }

        await this._keep(album, answer.data)
        return { kind: FOUND, data: answer.data }
    }

    /** Ask Spotify, unless it said "wait" and the time has not come. */
    async _ask(album) {
        const left = this._waitUntil - this.now()
        if (left > 0) throw this._asWait(new SpotifyRateLimitError(Math.ceil(left / 1000)), left)

        try {
            return await this.spotify.albumPopularity(album.artist, album.title)
        } catch (error) {
            if (!(error instanceof SpotifyRateLimitError)) throw error
            const waitMs = (error.retryAfterSeconds || 0) * 1000
            if (waitMs > 0) this._waitUntil = this.now() + waitMs
            throw this._asWait(error, waitMs)
        }
    }

    /** A wait the load can hold for asks for the hold; any other stays the failure it is. */
    _asWait(error, waitMs) {
        if (waitMs > 0 && waitMs <= MAX_SPOTIFY_HOLD_MS) error.hold = { reason: HoldReason.SPOTIFY_BUSY, retryAfterMs: waitMs }
        return error
    }

    /** Store the answer for the next time. Not being able to store it does not undo the answer. */
    async _keep(album, data) {
        try {
            await this.store.save(album.artist, album.title, data)
        } catch (error) {
            console.warn(`[SpotifyPopularitySource] could not store the answer for "${album.artist} - ${album.title}":`, error?.message || error)
        }
    }
}
