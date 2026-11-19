/**
 * CatalogAdapter - CatalogPort over Apple Music, with the server as the second source (DP-07, DP-14).
 *
 * find(query, { seriesId }) returns a NEW Album, with no ratings yet: enrichment is another step.
 * Throws AlbumNotFoundError when neither source has the album; any other error means the search failed.
 */

import { Album } from '../../../models/Album.js'
import { AlbumIdentity } from '../../../models/AlbumIdentity.js'
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

        if (!album) {
            try {
                album = await this.fetchFromServer(query)
            } catch {
                album = null
            }
        }
        if (!album) throw new AlbumNotFoundError(`No catalog has "${this._label(query)}"`)

        if (!album.coverUrl && !album.artworkTemplate) {
            album.coverUrl = await this.findLocalCover(album.artist, album.title)
        }
        if (seriesId) album.seriesIds = [seriesId]
        return album
    }

    /**
     * The chosen edition, or null when Apple Music no longer has that id here (it answers 404 for an
     * edition of another storefront, or one that was withdrawn): then the album is searched by name.
     * Any other failure is a failed call and is thrown, to be retried.
     */
    async _detailsOfChosen(appleId) {
        try {
            return await this.musicKit.getAlbumDetails(appleId)
        } catch (error) {
            if (isNotFound(error)) return null
            throw error
        }
    }

    /** Search by name and keep the result only if it is the album asked for. */
    async _searchInApple(query) {
        const { artist, title } = parseAlbumQuery(query)
        const candidates = await this.musicKit.searchAlbums(artist, title, 5)
        if (!candidates || candidates.length === 0) return null

        const selected = candidates[0] // already scored: standard editions first
        const identity = new AlbumIdentity(query, {
            title: selected.attributes?.name,
            artist: selected.attributes?.artistName,
            appleId: selected.id
        })
        if (!identity.isValid()) return null

        return this.musicKit.getAlbumDetails(selected.id)
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
        // The series keeps the id of the edition the person chose: load exactly that one, in one call.
        // Only a query without it (typed or pasted as text) is searched by name.
        const chosenId = (typeof query === 'object' && query !== null) ? query.appleMusicId : null
        const full = (chosenId && await this._detailsOfChosen(chosenId)) || await this._searchInApple(query)
        if (!full) return null

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
            metadata: { source: 'Apple Music', sourceId: full.id }
        })
    }
}
