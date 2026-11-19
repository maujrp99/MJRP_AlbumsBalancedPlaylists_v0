/**
 * SeriesFactsService
 *
 * Writes into each series what the album load learned about its albums, and is the ONE writer of
 * it (arch.md, seção 16; DP-12):
 * - the facts (their year and which sources have data), so the filters answer without loading anything;
 * - the Apple Music id the album asked for was found under, when the stored id no longer leads to
 *   it (F55), with the cover and the year stored beside that id.
 *
 * The load service learns; this service writes. It writes only the difference, in one write per
 * series, when the series has finished loading, and nothing at all when nothing changed. A write
 * that fails is reported and tried again on the next pass; it never fails the load.
 */

import { withSettledFacts, withCorrectedSources } from '../../models/albumFacts.js'
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
     * Save what was learned (facts, corrected ids) of every series that has finished loading.
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

        const { albumQueries, changed } = this._withWhatWasLearned(series)
        if (!changed) return false

        this._saving.add(seriesId)
        try {
            await this.saveAlbumFacts(seriesId, albumQueries)
            this.seriesStore.setAlbumQueries(seriesId, albumQueries)
            return true
        } catch (error) {
            console.warn(`[SeriesFactsService] could not save what was learned about series ${seriesId}:`, error?.message || error)
            return false
        } finally {
            this._saving.delete(seriesId)
        }
    }

    /** The album queries of the series with the facts and the corrected ids of this load in place. */
    _withWhatWasLearned(series) {
        const entriesByKey = new Map(this.loadStore.getEntries(series.id).map(entry => [entry.key, entry]))
        const facts = withSettledFacts(series.albumQueries, entriesByKey, queryKey, this.now())
        const sources = withCorrectedSources(facts.albumQueries, entriesByKey, queryKey)
        return { albumQueries: sources.albumQueries, changed: facts.changed || sources.changed }
    }
}
