/**
 * RepositoryPlaylistsSource
 *
 * The source port of SavedPlaylistsReader served by the repositories: the series of a person and
 * the playlists stored under each series. Firestore stays inside the repositories (ADR-0016);
 * this file only says which repository answers which question.
 *
 * Round trips: `listSeries` is one read of the series collection; `listPlaylists` is one read of
 * the `playlists` collection of that series (playlists live under their series, so there is no
 * single read for the playlists of every series); `deletePlaylists` is one atomic write.
 */

import { SeriesRepository } from '@shared/data/SeriesRepository.js'
import { PlaylistRepository } from '@shared/data/PlaylistRepository.js'
import { firestoreStore } from '../../../repositories/firestoreStore.js'

export class RepositoryPlaylistsSource {
    /**
     * @param {Object} deps
     * @param {Object} deps.db - Firestore instance
     * @param {Object} [deps.cache] - cache manager handed to the repositories
     */
    constructor({ db, cache = null }) {
        this.db = db
        this.cache = cache
    }

    /** @returns {Promise<Array<Object>>} every series of that person */
    listSeries(userId) {
        return new SeriesRepository(firestoreStore(this.db), this.cache, userId).findAll()
    }

    /** @returns {Promise<Array<Object>>} the saved playlists of that series, tracks included */
    listPlaylists(userId, seriesId) {
        return this._playlists(userId, seriesId).findAll()
    }

    /** Delete those playlists of the series in one write: all of them go or none does. */
    deletePlaylists(userId, seriesId, ids) {
        return this._playlists(userId, seriesId).deleteMany(ids)
    }

    _playlists(userId, seriesId) {
        return new PlaylistRepository(firestoreStore(this.db), this.cache, userId, seriesId)
    }
}
