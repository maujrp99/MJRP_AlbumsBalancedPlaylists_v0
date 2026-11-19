/**
 * F51 - the facts the filters read are written into the series, only when something was learned.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { SeriesFactsService } from '../../../public/js/services/series/SeriesFactsService.js'
import { AlbumLoadStore } from '../../../public/js/stores/albumLoad.js'
import { createEntry, AlbumStatus, EnrichmentStatus } from '../../../public/js/models/albumLoadState.js'

const loaded = (seriesId, query, { year = 1971, acclaim = 'done', popularity = 'empty', status = AlbumStatus.FOUND } = {}) => ({
    ...createEntry(seriesId, query),
    status,
    album: status === AlbumStatus.FOUND ? { title: 'x', year } : null,
    enrichment: { acclaim, popularity, userRanking: EnrichmentStatus.EMPTY }
})

describe('SeriesFactsService', () => {
    let loadStore, seriesStore, saveAlbumFacts, service
    const NOW = 1700000000000

    const setup = (series, entries) => {
        loadStore = new AlbumLoadStore()
        loadStore.startGeneration(1)
        loadStore.setSeriesOrder(series.map(s => s.id))
        series.forEach(s => loadStore.setSeriesEntries(s.id, entries[s.id] || []))
        const list = series.map(s => ({ ...s }))
        seriesStore = {
            getSeries: () => list,
            setAlbumQueries: vi.fn((id, albumQueries) => { list.find(s => s.id === id).albumQueries = albumQueries })
        }
        saveAlbumFacts = vi.fn(async () => { })
        service = new SeriesFactsService({ loadStore, seriesStore, saveAlbumFacts, now: () => NOW })
    }

    beforeEach(() => {
        setup(
            [{ id: 's1', name: 'One', albumQueries: [{ artist: 'Yes', title: 'Fragile', year: '1971' }, 'Genesis - Foxtrot'] }],
            { s1: [loaded('s1', { artist: 'Yes', title: 'Fragile' }), loaded('s1', 'Genesis - Foxtrot', { year: 1972, popularity: 'done' })] }
        )
    })

    it('writes the year and the sources of each album into its query, once the series has finished', async () => {
        const written = await service.syncFinishedSeries()

        expect(written).toEqual(['s1'])
        expect(saveAlbumFacts).toHaveBeenCalledTimes(1)
        const [, queries] = saveAlbumFacts.mock.calls[0]
        expect(queries[0]).toEqual({
            artist: 'Yes', title: 'Fragile', year: '1971',
            facts: { year: 1971, sources: { acclaim: true, popularity: false }, checkedAt: NOW }
        })
        expect(queries[1]).toEqual({
            artist: 'Genesis', title: 'Foxtrot',
            facts: { year: 1972, sources: { acclaim: true, popularity: true }, checkedAt: NOW }
        })
        expect(seriesStore.setAlbumQueries).toHaveBeenCalledWith('s1', queries)
    })

    it('writes nothing the second time: nothing new was learned', async () => {
        await service.syncFinishedSeries()
        saveAlbumFacts.mockClear()

        expect(await service.syncFinishedSeries()).toEqual([])
        expect(saveAlbumFacts).not.toHaveBeenCalled()
    })

    it('waits for the series to finish: nothing is written while an album is loading or being enriched', async () => {
        loadStore.patchEntry('s1', 'yes - fragile', { enrichment: { acclaim: EnrichmentStatus.LOADING } })
        expect(await service.syncFinishedSeries()).toEqual([])

        loadStore.patchEntry('s1', 'yes - fragile', { enrichment: { acclaim: EnrichmentStatus.DONE } })
        loadStore.patchEntry('s1', 'genesis - foxtrot', { status: AlbumStatus.FINDING })
        expect(await service.syncFinishedSeries()).toEqual([])
        expect(saveAlbumFacts).not.toHaveBeenCalled()
    })

    it('leaves alone the query whose album failed, or whose source did not answer', async () => {
        setup(
            [{ id: 's1', name: 'One', albumQueries: ['A - Failed', 'B - Source Down', 'C - Fine'] }],
            { s1: [
                loaded('s1', 'A - Failed', { status: AlbumStatus.FAILED }),
                loaded('s1', 'B - Source Down', { acclaim: EnrichmentStatus.FAILED }),
                loaded('s1', 'C - Fine')
            ] }
        )

        await service.syncFinishedSeries()

        const [, queries] = saveAlbumFacts.mock.calls[0]
        expect(queries[0]).toBe('A - Failed')
        expect(queries[1]).toBe('B - Source Down')
        expect(queries[2].facts.sources).toEqual({ acclaim: true, popularity: false })
    })

    it('rewrites the facts when the album changed, for instance when it gained ratings', async () => {
        setup(
            [{ id: 's1', name: 'One', albumQueries: [{ artist: 'Yes', title: 'Fragile', facts: { year: 1971, sources: { acclaim: false, popularity: false }, checkedAt: 1 } }] }],
            { s1: [loaded('s1', { artist: 'Yes', title: 'Fragile' })] }
        )

        expect(await service.syncFinishedSeries()).toEqual(['s1'])
        expect(saveAlbumFacts.mock.calls[0][1][0].facts.sources.acclaim).toBe(true)
    })

    it('never keeps the person\'s own ranking among the facts', async () => {
        loadStore.patchEntry('s1', 'yes - fragile', { enrichment: { userRanking: EnrichmentStatus.DONE } })

        await service.syncFinishedSeries()

        expect(JSON.stringify(saveAlbumFacts.mock.calls[0][1])).not.toContain('userRanking')
    })

    it('a failed write is reported and does not change the series in memory', async () => {
        saveAlbumFacts.mockRejectedValue(new Error('offline'))
        const quiet = vi.spyOn(console, 'warn').mockImplementation(() => { })

        expect(await service.syncFinishedSeries()).toEqual([])
        expect(seriesStore.setAlbumQueries).not.toHaveBeenCalled()
        quiet.mockRestore()
    })
})
