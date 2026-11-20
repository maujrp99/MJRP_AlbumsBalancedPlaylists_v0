/**
 * StoredSpotifyPopularity - what the app holds of an earlier answer of Spotify about an album.
 *
 * It is the port the popularity source of the album load is given as `store`
 * (services/albums/adapters/spotifyPopularitySource.js), and it answers two questions:
 *
 *   get(artist, title)        "what do we already hold for this album?"  -> the data, or null
 *   save(artist, title, data) "keep this"                                -> throws when it could not
 *
 * It holds no state of its own: the answers live in Firestore (the shared collection
 * `spotify_enrichment`, one document per artist and album) behind SpotifyEnrichmentRepository,
 * which also says when a stored answer is still trusted (30 days, the format, a Spotify id).
 * Until F58 this was `stores/SpotifyEnrichmentStore.js`, a "store" that imported Firestore
 * (UAT-18, ADR-0017). The documents and their address did not change.
 *
 * Everything it reaches is given (DP-14): the repository.
 */
export class StoredSpotifyPopularity {
    /**
     * @param {Object} deps
     * @param {Object} deps.repository - { getByArtistAlbum(artist, title), isValid(data), saveEnrichment(artist, title, data), normalizeKey(artist, title) }
     */
    constructor({ repository }) {
        this.repository = repository
    }

    /**
     * What is held for the album and still trusted, or null: nothing held, held but too old or
     * of another format, or the database could not be read. Never throws: with null the
     * popularity source goes on to ask Spotify.
     * @returns {Promise<Object|null>}
     */
    async get(artist, title) {
        try {
            const data = await this.repository.getByArtistAlbum(artist, title)
            return data && this.repository.isValid(data) ? data : null
        } catch (error) {
            console.error(`[StoredSpotifyPopularity] could not read what is held for ${this.repository.normalizeKey(artist, title)}:`, error)
            return null
        }
    }

    /**
     * Keep what Spotify answered for the album. Throws when it could not be written: who asked
     * decides what a failure to keep means (the popularity source keeps the answer it has).
     * @returns {Promise<void>}
     */
    async save(artist, title, data) {
        await this.repository.saveEnrichment(artist, title, data)
    }
}
