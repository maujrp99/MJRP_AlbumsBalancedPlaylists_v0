/**
 * OwnRankingService
 *
 * The one owner of the person's album rankings on the client (Service, DP-12): it saves a ranking
 * and keeps the list of ranked albums, read once per person. The screen and the controllers never
 * talk to the ranking repository; they ask here.
 *
 * Ports (injected, DP-14), so this file imports no Firestore, no store and no screen:
 *   getUserId()                              -> string|null
 *   getAllRankings(userId)                   -> Promise<Array<{ albumId|id, artistName, albumTitle }>>
 *   saveRanking(userId, albumId, { albumTitle, artistName, rankings }) -> Promise<boolean>
 */

const READY = 'ready'
const LOADING = 'loading'

export class OwnRankingService {
    /**
     * @param {Object} deps
     * @param {OwnRankingsStore} deps.store
     * @param {Function} deps.getUserId
     * @param {Function} deps.getAllRankings
     * @param {Function} deps.saveRanking
     */
    constructor({ store, getUserId, getAllRankings, saveRanking }) {
        this.store = store
        this.getUserId = getUserId
        this.getAllRankings = getAllRankings
        this.saveRanking = saveRanking
        this._reading = null // { userId, promise }
    }

    /**
     * Make sure the list of ranked albums of the current person is known: one read, shared by
     * whoever asks while it runs, and not repeated once it has answered. A read that failed is
     * tried again on the next call.
     * @returns {Promise<boolean>} true when the list is known
     */
    async ensureLoaded() {
        const userId = this.getUserId()
        if (!userId) return false

        const sameUser = this.store.getUserId() === userId
        if (sameUser && this.store.getStatus() === READY) return true
        if (sameUser && this.store.getStatus() === LOADING && this._reading?.userId === userId) return this._reading.promise

        this.store.startLoading(userId)
        const promise = this._read(userId)
        this._reading = { userId, promise }
        return promise
    }

    async _read(userId) {
        try {
            const records = await this.getAllRankings(userId)
            if (this.getUserId() !== userId) return false // the person changed meanwhile: not theirs to keep
            this.store.setRecords(userId, records || [])
            return true
        } catch (error) {
            console.warn('[OwnRankingService] reading the rankings failed:', error?.message || error)
            if (this.getUserId() === userId) this.store.setFailed(userId)
            return false
        }
    }

    /**
     * Save the person's ranking of the tracks of an album.
     * @param {{ id: string, title: string, artist: string }} album
     * @param {Array<{ trackTitle: string, userRank: number }>} rankings
     * @returns {Promise<boolean>} true when it was saved
     */
    async save(album, rankings) {
        const userId = this.getUserId()
        if (!userId || !album?.id || !Array.isArray(rankings)) return false

        const saved = await this.saveRanking(userId, album.id, {
            albumTitle: album.title || '',
            artistName: album.artist || '',
            rankings
        })
        if (!saved) return false

        this.store.upsert(userId, { albumId: album.id, artistName: album.artist, albumTitle: album.title })
        return true
    }
}
