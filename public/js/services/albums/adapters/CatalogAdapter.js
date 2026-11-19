/**
 * CatalogAdapter - CatalogPort over Apple Music, with the server as the second source (DP-07, DP-14).
 *
 * find(query, { seriesId }) returns a NEW Album, with no ratings yet: enrichment is another step.
 * Throws AlbumNotFoundError when neither source has the album; any other error means the search failed.
 */

import { Album } from '../../../models/Album.js'
import { askedAlbum, appleCandidate, compareAlbumIdentity, pickAlbum } from '../../../models/askedAlbum.js'
import { parseAlbumQuery, plainAlbumQuery } from '../../../models/albumQuery.js'
import { TrackTransformer } from '../../../transformers/TrackTransformer.js'
import { AlbumNotFoundError } from '../AlbumLoadService.js'

/** How long one Apple Music attempt may take. */
export const APPLE_DEADLINE_MS = 10000

/**
 * Waits before each new attempt when Apple Music fails (it answers 429 when asked too fast).
 * Retry with growing waits and jitter (DP-23); after the last one the search has failed.
 */
export const APPLE_RETRY_WAITS_MS = Object.freeze([700, 1800, 4000])

const pause = (ms) => new Promise(resolve => setTimeout(resolve, ms))
const withJitter = (ms) => ms + Math.floor(Math.random() * ms * 0.3)

const discPosition = (track) => track.position ?? track.trackNumber ?? 0

const isNotFound = (error) => error?.status === 404 || /\b404\b/.test(String(error?.message ?? error))

const withDeadline = (promise, ms, label) => new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`${label} passed ${ms} ms`)), ms)
    promise.then(
        value => { clearTimeout(timer); resolve(value) },
        error => { clearTimeout(timer); reject(error) }
    )
})

export class CatalogAdapter {
    /**
     * @param {Object} deps
     * @param {Object} deps.musicKit - { searchAlbums, getAlbumDetails, getArtworkUrl }
     * @param {Function} deps.fetchFromServer - (query) => Promise<Album>, the second source
     * @param {Function} deps.generateAlbumId - ({ title, artist }) => string, the stable id
     * @param {Function} [deps.findLocalCover] - (artist, title) => Promise<string|null>
     */
    constructor({ musicKit, fetchFromServer, generateAlbumId, findLocalCover = async () => null, retryWaitsMs = APPLE_RETRY_WAITS_MS }) {
        this.retryWaitsMs = retryWaitsMs
        this.musicKit = musicKit
        this.fetchFromServer = fetchFromServer
        this.generateAlbumId = generateAlbumId
        this.findLocalCover = findLocalCover
    }

    async find(storedQuery, { seriesId = null, signal = null } = {}) {
        // The catalogs are asked with plain text, whatever the series has stored (UAT-180).
        const query = plainAlbumQuery(storedQuery)
        // A failure of Apple Music (network, 429) is a failed search: it is retried and then reported.
        // Only "Apple Music has no such album" goes to the second source, which uses paid AI.
        let album = await this._findInAppleWithRetry(query, signal)

        if (!album) album = await this._findInServer(query)
        if (!album) throw new AlbumNotFoundError(`No catalog has "${this._label(query)}"`)

        if (!album.coverUrl && !album.artworkTemplate) {
            album.coverUrl = await this.findLocalCover(album.artist, album.title)
        }
        if (seriesId) album.seriesIds = [seriesId]
        return album
    }

    /**
     * The second source (the app's server, paid AI).
     * @returns {Promise<Album|null>} null when it has no such album or when it failed
     * @throws the error as it came when it carries a `hold`: our own server said "sign in" or "wait"
     *         (F52), which says nothing about the album, so the load holds and asks again
     */
    async _findInServer(query) {
        try {
            return await this.fetchFromServer(query)
        } catch (error) {
            if (error?.hold) throw error
            // The album ends as "not found", but the reason is not hidden: the status is in the message
            console.warn(`[CatalogAdapter] second source failed for "${this._label(query)}":`, error?.message || error)
            return null
        }
    }

    /**
     * The chosen edition, or null when the stored id does not lead to the album asked for: Apple
     * Music no longer has that id here (it answers 404 for an edition of another storefront, or one
     * that was withdrawn), or the id leads to ANOTHER album (F55: the stored id does not win over
     * what was asked). Then the album is searched by name.
     * An id that leads to the title with a subtitle (the rule's second tier) is not believed alone
     * either: only the search sees whether the catalog has the album asked for itself.
     * Any other failure is a failed call and is thrown, to be retried.
     * @returns {Promise<{ details: Object, reason: string } | null>}
     */
    async _detailsOfChosen(appleId, query) {
        let details
        try {
            details = await this.musicKit.getAlbumDetails(appleId)
        } catch (error) {
            if (isNotFound(error)) return null
            throw error
        }
        if (!details) return null
        const verdict = compareAlbumIdentity(askedAlbum(query), details)
        if (verdict.same) return { details, reason: verdict.reason }

        console.warn(`[CatalogAdapter] the stored id ${appleId} leads to "${details.artist} - ${details.title}", not to "${this._label(query)}": searching by name`)
        return null
    }

    /**
     * Search by name and keep a result only if it is the album asked for, by the one identity rule
     * (the results come scored, standard editions first; the rule picks among those that pass).
     * @returns {Promise<{ details: Object, reason: string } | null>}
     */
    async _searchInApple(query) {
        const asked = askedAlbum(query)
        const candidates = await this.musicKit.searchAlbums(asked.artist, asked.title, 5)
        const picked = pickAlbum(asked, candidates, appleCandidate)
        if (!picked.found) return null
        const details = await this.musicKit.getAlbumDetails(picked.candidate.id)
        return details ? { details, reason: picked.verdict.reason } : null
    }

    _label(query) {
        const { artist, title } = parseAlbumQuery(query)
        return artist ? `${artist} - ${title}` : title
    }

    async _findInAppleWithRetry(query, signal) {
        for (let attempt = 0; ; attempt++) {
            try {
                return await withDeadline(this._findInApple(query), APPLE_DEADLINE_MS, 'Apple Music search')
            } catch (error) {
                const wait = this.retryWaitsMs[attempt]
                if (wait === undefined || signal?.aborted) throw error
                await pause(withJitter(wait))
            }
        }
    }

    /** @returns {Promise<Album|null>} null when Apple Music has nothing that matches the query */
    async _findInApple(query) {
        // The series keeps the id of the edition the person chose: load exactly that one, in one call,
        // and check that it is the album asked for. A query without an id (typed or pasted as text),
        // or whose id leads elsewhere, is searched by name.
        const chosenId = (typeof query === 'object' && query !== null) ? query.appleMusicId : null
        const chosen = chosenId ? await this._detailsOfChosen(chosenId, query) : null
        const accepted = chosen || await this._searchInApple(query)
        if (!accepted) return null
        const full = accepted.details

        // What the album says about how it got here (F55): the reason of the rule it was accepted
        // by, and the stored id it did NOT come from. SeriesFactsService writes the new id back.
        const identity = { identityReason: accepted.reason }
        if (chosenId && String(chosenId) !== String(full.id)) identity.replacedSourceId = chosenId

        const id = this.generateAlbumId({ title: full.title, artist: full.artist })
        const context = { artist: full.artist, album: full.title, albumId: id }
        const tracks = full.tracks.map(t => TrackTransformer.toCanonical({
            id: t.id || `track_${id}_${t.trackNumber}`,
            title: t.title,
            artist: t.artist || full.artist,
            duration: t.duration,
            position: t.trackNumber,
            trackNumber: t.trackNumber,
            isrc: t.isrc,
            previewUrl: t.previewUrl,
            appleMusicId: t.id,
            rating: null
        }, context))

        return new Album({
            id,
            title: full.title,
            artist: full.artist,
            year: full.year,
            coverUrl: this.musicKit.getArtworkUrl(full.artworkTemplate, 600),
            tracks: [...tracks],
            tracksOriginalOrder: [...tracks].sort((a, b) => discPosition(a) - discPosition(b)),
            metadata: { source: 'Apple Music', sourceId: full.id, ...identity }
        })
    }
}
