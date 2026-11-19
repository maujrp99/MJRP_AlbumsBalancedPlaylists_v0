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

/**
 * F55, slice 2 - the album asked for was found under ANOTHER Apple Music id than the one the series
 * has stored: the new id is written into the series, by this same writer, in the same write.
 */
describe('SeriesFactsService: the corrected Apple Music id', () => {
    let loadStore, seriesStore, saveAlbumFacts, service
    const NOW = 1700000000000
    const STP = 'Stone Temple Pilots'

    const entry = (seriesId, query, album, enrichment = {}) => ({
        ...createEntry(seriesId, query),
        status: AlbumStatus.FOUND,
        album,
        enrichment: { acclaim: 'done', popularity: 'empty', userRanking: EnrichmentStatus.EMPTY, ...enrichment }
    })
    const coreLoaded = (metadata) => ({
        title: 'Core (Remastered)', artist: STP, year: '1992', coverUrl: 'https://cover/core',
        metadata: { source: 'Apple Music', sourceId: 'apple-core', identityReason: 'edition-of-title', ...metadata }
    })
    const setup = (albumQueries, entries) => {
        loadStore = new AlbumLoadStore()
        loadStore.startGeneration(1)
        loadStore.setSeriesOrder(['s1'])
        loadStore.setSeriesEntries('s1', entries)
        const list = [{ id: 's1', name: 'Grunge Rock - Classics', albumQueries }]
        seriesStore = {
            getSeries: () => list,
            setAlbumQueries: vi.fn((id, queries) => { list.find(s => s.id === id).albumQueries = queries })
        }
        saveAlbumFacts = vi.fn(async () => { })
        service = new SeriesFactsService({ loadStore, seriesStore, saveAlbumFacts, now: () => NOW })
    }
    const settled = { year: 1992, sources: { acclaim: true, popularity: false }, checkedAt: 1 }

    it('writes the id the album was found under, with the cover and the year that were stored beside the old one', async () => {
        const stored = { artist: STP, title: 'Core', appleMusicId: 'apple-shangri', year: 2001, coverUrl: 'https://cover/shangri', facts: settled }
        setup([stored, 'Pearl Jam - Ten'], [entry('s1', stored, coreLoaded({ replacedSourceId: 'apple-shangri' }))])

        expect(await service.syncFinishedSeries()).toEqual(['s1'])

        expect(saveAlbumFacts).toHaveBeenCalledTimes(1)
        expect(saveAlbumFacts.mock.calls[0]).toEqual(['s1', [
            { artist: STP, title: 'Core', appleMusicId: 'apple-core', year: '1992', coverUrl: 'https://cover/core', facts: settled },
            'Pearl Jam - Ten'
        ]])
        expect(seriesStore.setAlbumQueries).toHaveBeenCalledWith('s1', saveAlbumFacts.mock.calls[0][1])
    })

    it('writes it once: the next pass finds the series already corrected', async () => {
        const stored = { artist: STP, title: 'Core', appleMusicId: 'apple-shangri', facts: settled }
        setup([stored], [entry('s1', stored, coreLoaded({ replacedSourceId: 'apple-shangri' }))])

        await service.syncFinishedSeries()
        saveAlbumFacts.mockClear()

        expect(await service.syncFinishedSeries()).toEqual([])
        expect(saveAlbumFacts).not.toHaveBeenCalled()
    })

    it('goes in the same write as the facts, and adds no field the query did not have', async () => {
        const stored = { artist: STP, title: 'Core', appleMusicId: 'gone-1' }
        setup([stored], [entry('s1', stored, coreLoaded({ replacedSourceId: 'gone-1' }))])

        await service.syncFinishedSeries()

        expect(saveAlbumFacts).toHaveBeenCalledTimes(1)
        expect(saveAlbumFacts.mock.calls[0][1]).toEqual([{
            artist: STP, title: 'Core', appleMusicId: 'apple-core',
            facts: { year: 1992, sources: { acclaim: true, popularity: false }, checkedAt: NOW }
        }])
    })

    it('does not wait for the facts: a source that failed does not hold the id back', async () => {
        const stored = { artist: STP, title: 'Core', appleMusicId: 'apple-shangri' }
        setup([stored], [entry('s1', stored, coreLoaded({ replacedSourceId: 'apple-shangri' }), { acclaim: EnrichmentStatus.FAILED })])

        await service.syncFinishedSeries()

        expect(saveAlbumFacts.mock.calls[0][1]).toEqual([{ artist: STP, title: 'Core', appleMusicId: 'apple-core' }])
    })

    it('an album accepted by the second tier of the rule gets its id written too: it is the album the person sees', async () => {
        const stored = { artist: 'Jimmy Page & Robert Plant', title: 'No Quarter', appleMusicId: 'apple-sand', facts: settled }
        const unledded = {
            title: 'No Quarter: Jimmy Page & Robert Plant Unledded', artist: 'Jimmy Page & Robert Plant', year: '1994',
            metadata: { source: 'Apple Music', sourceId: 'apple-unledded', identityReason: 'title-before-subtitle', replacedSourceId: 'apple-sand' }
        }
        setup([stored], [entry('s1', stored, unledded, { acclaim: 'done' })])

        await service.syncFinishedSeries()

        expect(saveAlbumFacts.mock.calls[0][1][0]).toMatchObject({ title: 'No Quarter', appleMusicId: 'apple-unledded' })
    })

    it('writes nothing when the stored id was obeyed, when the query stores no id, and when the series already has another id', async () => {
        const obeyed = { artist: STP, title: 'Core', appleMusicId: 'apple-core', facts: settled }
        const changedMeanwhile = { artist: 'Pearl Jam', title: 'Ten', appleMusicId: 'picked-by-the-person', facts: settled }
        setup([obeyed, 'Nirvana - Nevermind', changedMeanwhile], [
            entry('s1', obeyed, coreLoaded()),
            { ...entry('s1', 'Nirvana - Nevermind', { title: 'Nevermind', year: 1992, metadata: { sourceId: 'apple-nevermind' } }), enrichment: { acclaim: 'failed', popularity: 'empty', userRanking: 'empty' } },
            entry('s1', changedMeanwhile, { title: 'Ten', year: 1992, metadata: { sourceId: 'apple-ten', replacedSourceId: 'an-older-id' } })
        ])

        expect(await service.syncFinishedSeries()).toEqual([])
        expect(saveAlbumFacts).not.toHaveBeenCalled()
    })

    it('a failed write does not fail anything: it is reported, the series in memory stays, and the next pass tries again', async () => {
        const stored = { artist: STP, title: 'Core', appleMusicId: 'apple-shangri', facts: settled }
        setup([stored], [entry('s1', stored, coreLoaded({ replacedSourceId: 'apple-shangri' }))])
        saveAlbumFacts.mockRejectedValueOnce(new Error('offline'))
        const quiet = vi.spyOn(console, 'warn').mockImplementation(() => { })

        expect(await service.syncFinishedSeries()).toEqual([])
        expect(seriesStore.setAlbumQueries).not.toHaveBeenCalled()
        expect(await service.syncFinishedSeries()).toEqual(['s1'])
        quiet.mockRestore()
    })
})
