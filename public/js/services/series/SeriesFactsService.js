/**
 * SeriesFactsService
 *
 * Writes into each series what the album load learned about its albums (their year and which
 * sources have data), so the filters can answer without loading anything (arch.md, seção 16; DP-12).
 *
 * The load service learns; this service writes. It writes only the difference, once per series,
 * when the series has finished loading, and nothing at all when nothing changed.
 */

import { withSettledFacts } from '../../models/albumFacts.js'
import { queryKey } from '../../models/albumLoadState.js'

export class SeriesFactsService {
    /**
     * @param {Object} deps
     * @param {Object} deps.loadStore - AlbumLoadStore
     * @param {Object} deps.seriesStore - { getSeries(), setAlbumQueries(id, queries) }
     * @param {Function} deps.saveAlbumFacts - (seriesId, albumQueries) => Promise, the repository write
     * @param {Function} [deps.now]
     */
    constructor({ loadStore, seriesStore, saveAlbumFacts, now = () => Date.now() }) {
        this.loadStore = loadStore
        this.seriesStore = seriesStore
        this.saveAlbumFacts = saveAlbumFacts
        this.now = now
        this._saving = new Set()
    }

    /**
     * Save the facts of every series that has finished loading and learned something new.
     * @returns {Promise<string[]>} the ids of the series that were written
     */
    async syncFinishedSeries() {
        const written = []
        for (const seriesId of this.loadStore.getSeriesIds()) {
            if (await this._syncSeries(seriesId)) written.push(seriesId)
        }
        return written
    }

    async _syncSeries(seriesId) {
        if (this._saving.has(seriesId)) return false

        const state = this.loadStore.getSeriesState(seriesId)
        if (state.total === 0 || state.inFlight > 0 || state.enriching > 0) return false

        const series = this.seriesStore.getSeries().find(item => item.id === seriesId)
        if (!series) return false

        const entriesByKey = new Map(this.loadStore.getEntries(seriesId).map(entry => [entry.key, entry]))
        const { albumQueries, changed } = withSettledFacts(series.albumQueries, entriesByKey, queryKey, this.now())
        if (!changed) return false

        this._saving.add(seriesId)
        try {
            await this.saveAlbumFacts(seriesId, albumQueries)
            this.seriesStore.setAlbumQueries(seriesId, albumQueries)
            return true
        } catch (error) {
            console.warn(`[SeriesFactsService] could not save the facts of series ${seriesId}:`, error?.message || error)
            return false
        } finally {
            this._saving.delete(seriesId)
        }
    }
}
