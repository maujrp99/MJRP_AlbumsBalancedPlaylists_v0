/**
 * SharedAlbumRepository
 * The root collection `albums`: one document per album, shared by every account.
 *
 * It has no caller since F56: its only writer was "Refetch Metadata" outside the album load
 * (SeriesService.refetchAlbumMetadata), and the reload of an album now goes through the load
 * service, which writes nothing here. Nothing in the app ever read the collection. The class stays
 * until the owner decides what the shared collection is for.
 * Because the collection is shared, what belongs to one person never goes into the document: the
 * personal ranking lives in users/{uid}/albumRankings (UserRankingRepository).
 */

import { BaseRepository } from './BaseRepository.js'

/** Fields of the album that belong to the person who is logged in. */
const PERSONAL_ALBUM_FIELDS = Object.freeze(['hasUserRanking', 'userRanking'])
/** Fields of each track that belong to the person who is logged in. */
const PERSONAL_TRACK_FIELDS = Object.freeze(['userRank'])
/** The lists of the album that hold tracks. */
const TRACK_LISTS = Object.freeze(['tracks', 'tracksOriginalOrder', 'tracksByAcclaim'])

const without = (source, fields) => {
    const copy = { ...source }
    fields.forEach(field => { delete copy[field] })
    return copy
}

/**
 * The album as plain data, with nothing personal in it.
 * The JSON round trip drops `undefined` (Firestore refuses it) and turns Album and Track into plain objects.
 * @param {Object} album - Album instance or plain data
 * @returns {Object} a new plain object; the album given is not changed
 */
export function toSharedAlbumData(album) {
    const plain = without(JSON.parse(JSON.stringify(album)), PERSONAL_ALBUM_FIELDS)
    TRACK_LISTS.forEach(list => {
        if (Array.isArray(plain[list])) {
            plain[list] = plain[list].map(track => without(track, PERSONAL_TRACK_FIELDS))
        }
    })
    return plain
}

export class SharedAlbumRepository extends BaseRepository {
    /**
     * @param {Firestore} firestore - Firestore instance (modular)
     * @param {Object} [cache] - Cache manager
     */
    constructor(firestore, cache = null) {
        super(firestore, cache)
        this.collectionPath = 'albums'
    }

    /**
     * Create or update the shared document of an album, merging with what is there.
     * @param {Object} album - Album with an id
     * @returns {Promise<string>} the album id
     */
    async saveAlbum(album) {
        if (!album?.id) throw new Error('Cannot save an album without an id')

        return this.save(album.id, toSharedAlbumData(album))
    }
}
