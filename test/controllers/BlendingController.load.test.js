/**
 * F56 (UAT-189) - the blend gets its albums from the load service, through the one door every
 * screen uses (albumAsks.albumsOf): it names the sources its recipe reads, goes on with the albums
 * that are ready, says which ones failed, and stops only when none is ready.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

const mocks = vi.hoisted(() => ({
    albumsOf: vi.fn(),
    generate: vi.fn(() => ({ playlists: [{ name: 'Mix 1', tracks: [] }], stats: {} })),
    setCreateMode: vi.fn()
}))

vi.mock('../../public/js/services/albums/albumLoading.js', () => ({ albumAsks: { albumsOf: mocks.albumsOf } }))
vi.mock('../../public/js/services/PlaylistGenerationService.js', () => ({ playlistGenerationService: { generate: mocks.generate } }))
vi.mock('../../public/js/services/PlaylistsService.js', () => ({ getPlaylistsService: () => ({ setCreateMode: mocks.setCreateMode }) }))
vi.mock('../../public/js/app.js', () => ({ db: {} }))
vi.mock('../../public/js/cache/CacheManager.js', () => ({ cacheManager: {} }))

import { blendingController, BlendCancelledError } from '../../public/js/controllers/BlendingController.js'
import { playlistsStore } from '../../public/js/stores/playlists.js'
import { albumSeriesStore } from '../../public/js/stores/albumSeries.js'
import { albumsStore } from '../../public/js/stores/albums.js'
import { readAsk } from '../../public/js/models/albumAsk.js'
import { createEntry, AlbumStatus } from '../../public/js/models/albumLoadState.js'

const SERIES = { id: 'sA', name: 'Series A', albumQueries: ['Artist - One', 'Artist - Two'] }
const found = (title, enrichment = {}) => ({
    ...createEntry('sA', `Artist - ${title}`),
    status: AlbumStatus.FOUND,
    album: { id: title, artist: 'Artist', title },
    enrichment: { acclaim: 'done', popularity: 'done', userRanking: 'empty', ...enrichment }
})
const failed = (title) => ({
    ...createEntry('sA', `Artist - ${title}`),
    status: AlbumStatus.FAILED,
    error: { reason: 'not-found', message: 'none' }
})
const resultOf = (entries, sources = [], flags = {}) => readAsk([{ seriesId: 'sA', entries }], sources, flags).result
const CONFIG = { algorithmId: 'mjrp-balanced-cascade', rankingId: 'spotify' }

describe('BlendingController and the album load', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        playlistsStore.reset()
        albumsStore.reset()
        albumSeriesStore.setSeries([SERIES, { id: 'sB', name: 'Series B', albumQueries: ['Artist - Nine'] }])
        mocks.albumsOf.mockResolvedValue(resultOf([found('One'), found('Two')]))
    })

    it('asks the load service once for the series, naming the sources of the recipe', async () => {
        const leaving = new AbortController()

        await blendingController.generateFromSeries('sA', CONFIG, { signal: leaving.signal })

        expect(mocks.albumsOf).toHaveBeenCalledTimes(1)
        const request = mocks.albumsOf.mock.calls[0][0]
        expect(request.series).toEqual([SERIES])
        expect(request.sources).toEqual(['popularity'])
        expect(request.signal).toBe(leaving.signal)
    })

    it('a balanced recipe waits for the ratings and for the popularity', async () => {
        await blendingController.generateFromSeries('sA', { algorithmId: 'mjrp-balanced-cascade', rankingId: 'balanced' })

        expect(mocks.albumsOf.mock.calls[0][0].sources).toEqual(['acclaim', 'popularity'])
    })

    it('generates from the albums that are ready and puts the playlists in the series', async () => {
        const result = await blendingController.generateFromSeries('sA', CONFIG)

        expect(mocks.generate.mock.calls[0][0].map(album => album.title)).toEqual(['One', 'Two'])
        expect(playlistsStore.getPlaylists().map(p => p.name)).toEqual(['Mix 1'])
        expect(playlistsStore.getSeriesId()).toBe('sA')
        expect(albumsStore.getActiveAlbumSeriesId()).toBe('sA')
        expect(result.notices).toEqual([])
    })

    it('goes on without the albums that failed and says which ones and how many', async () => {
        mocks.albumsOf.mockResolvedValue(resultOf([found('One'), failed('Two')]))

        const result = await blendingController.generateFromSeries('sA', CONFIG)

        expect(mocks.generate.mock.calls[0][0].map(album => album.title)).toEqual(['One'])
        expect(result.notices).toEqual(['1 of 2 albums could not be loaded and was left out: Artist - Two (not found).'])
        expect(result.load.failed).toHaveLength(1)
    })

    it('says when a source the recipe reads is missing for some albums', async () => {
        mocks.albumsOf.mockResolvedValue(resultOf([found('One', { popularity: 'failed' }), found('Two')], ['popularity']))

        const result = await blendingController.generateFromSeries('sA', CONFIG)

        // F62: the line also names the order the recipe used for those albums instead
        expect(result.notices).toEqual([
            'Spotify popularity is missing for 1 of 2 albums (1 did not answer): Artist - One. ' +
            'Its tracks were ordered by acclaim where there is one, otherwise in album order instead.'
        ])
    })

    it('«My Own Ranking» says which albums have no ranking of the person and the order used for them (F62)', async () => {
        mocks.albumsOf.mockResolvedValue(resultOf([found('One'), found('Two'), found('Three', { userRanking: 'done' })], ['userRanking']))

        const result = await blendingController.generateFromSeries('sA', { algorithmId: 'top-n-user' })

        expect(result.notices).toEqual([
            'Your own ranking is missing for 2 of 3 albums (2 have none at the source): Artist - One, Artist - Two. ' +
            'Their tracks were ordered in album order instead.'
        ])
    })

    it('stops when no album is ready, with the reasons, and generates nothing', async () => {
        mocks.albumsOf.mockResolvedValue(resultOf([failed('One'), failed('Two')]))

        await expect(blendingController.generateFromSeries('sA', CONFIG))
            .rejects.toThrow('None of the 2 albums could be loaded: Artist - One (not found), Artist - Two (not found).')
        expect(mocks.generate).not.toHaveBeenCalled()
        expect(playlistsStore.getPlaylists()).toEqual([])
    })

    it('an ask dropped because the person left the screen generates nothing and says it was cancelled', async () => {
        mocks.albumsOf.mockResolvedValue(resultOf([found('One')], [], { aborted: true }))

        await expect(blendingController.generateFromSeries('sA', CONFIG)).rejects.toBeInstanceOf(BlendCancelledError)
        expect(mocks.generate).not.toHaveBeenCalled()
        expect(playlistsStore.getPlaylists()).toEqual([])
    })

    it('tells the progress of the load in words', async () => {
        const onProgress = vi.fn()
        mocks.albumsOf.mockImplementation(async (request) => {
            request.onProgress({ total: 2, found: 1, failed: 0, waitingSources: 0 })
            return resultOf([found('One'), found('Two')])
        })

        await blendingController.generateFromSeries('sA', CONFIG, { onProgress })

        expect(onProgress).toHaveBeenCalledWith('Loading albums: 1 of 2...')
    })

    it('fails for a series that does not exist', async () => {
        await expect(blendingController.generateFromSeries('nope', CONFIG)).rejects.toThrow('Series not found: nope')
        expect(mocks.albumsOf).not.toHaveBeenCalled()
    })

    describe('regenerate', () => {
        it('asks for the albums of the series of the playlists on screen, with the sources of the new recipe', async () => {
            playlistsStore.setPlaylists([{ id: 'p1', name: 'Old', tracks: [] }], 'sB')
            albumSeriesStore.setActiveSeries('sA')

            const result = await blendingController.regenerate({ algorithmId: 'top-3-acclaimed' })

            const request = mocks.albumsOf.mock.calls[0][0]
            expect(request.series.map(s => s.id)).toEqual(['sB'])
            expect(request.sources).toEqual(['acclaim'])
            expect(playlistsStore.getSeriesId()).toBe('sB')
            expect(result.notices).toEqual([])
        })

        it('says so when there is no series to take the albums from', async () => {
            albumSeriesStore.setSeries([])

            await expect(blendingController.regenerate(CONFIG)).rejects.toThrow('No series to take the albums from. Open the series first.')
        })
    })
})
