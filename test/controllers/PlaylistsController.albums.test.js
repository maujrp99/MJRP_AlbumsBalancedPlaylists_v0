/**
 * F56 (UAT-189) - the playlists screen (edit mode, generate again) gets its albums from the load
 * service through the one door every screen uses, and tells the person what is missing.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

const mocks = vi.hoisted(() => ({
    albumsOf: vi.fn(),
    regenerate: vi.fn(),
    loadFromFirestore: vi.fn()
}))

vi.mock('../../public/js/services/albums/albumLoading.js', () => ({ albumAsks: { albumsOf: mocks.albumsOf } }))
vi.mock('../../public/js/controllers/BlendingController.js', () => ({ blendingController: { regenerate: mocks.regenerate } }))
vi.mock('../../public/js/services/SeriesService.js', () => ({ getSeriesService: () => ({ loadFromFirestore: mocks.loadFromFirestore }) }))
vi.mock('../../public/js/services/PlaylistsService.js', () => ({ getPlaylistsService: vi.fn() }))
vi.mock('../../public/js/components/Toast.js', () => {
    const toast = { info: vi.fn(), success: vi.fn(), error: vi.fn(), warning: vi.fn() }
    return { default: toast, toast }
})

import { PlaylistsController } from '../../public/js/controllers/PlaylistsController.js'
import { albumSeriesStore } from '../../public/js/stores/albumSeries.js'
import { albumsStore } from '../../public/js/stores/albums.js'
import toast from '../../public/js/components/Toast.js'
import { readAsk } from '../../public/js/models/albumAsk.js'
import { createEntry, AlbumStatus, ENRICHMENT_SOURCES } from '../../public/js/models/albumLoadState.js'

const SERIES = { id: 'sA', name: 'Series A', albumQueries: ['Artist - One', 'Artist - Two'] }
const found = (title) => ({
    ...createEntry('sA', `Artist - ${title}`),
    status: AlbumStatus.FOUND,
    album: { id: title, artist: 'Artist', title },
    enrichment: { acclaim: 'done', popularity: 'done', userRanking: 'empty' }
})
const failed = (title) => ({ ...createEntry('sA', `Artist - ${title}`), status: AlbumStatus.FAILED, error: { reason: 'timeout', message: 'slow' } })
const resultOf = (entries, flags = {}) => readAsk([{ seriesId: 'sA', entries }], [], flags).result

describe('PlaylistsController and the album load', () => {
    let controller, view

    beforeEach(() => {
        vi.clearAllMocks()
        albumsStore.reset()
        albumSeriesStore.setDb(null)
        albumSeriesStore.setSeries([SERIES])
        mocks.albumsOf.mockResolvedValue(resultOf([found('One'), found('Two')]))
        view = { isGenerating: false, update: vi.fn() }
        controller = new PlaylistsController(view)
    })

    describe('loadAlbumsForSeries (opening the edit of a saved set)', () => {
        it('asks the load service for the albums of the series; it is ready when they are found', async () => {
            const result = await controller.loadAlbumsForSeries('sA')

            const ready = mocks.albumsOf.mock.calls.find(([request]) => request.sources.length === 0)[0]
            expect(ready.series).toEqual([SERIES])
            expect(ready.signal).toBeInstanceOf(AbortSignal)
            expect(result.albums.map(album => album.title)).toEqual(['One', 'Two'])
            expect(albumsStore.getActiveAlbumSeriesId()).toBe('sA')
            expect(toast.warning).not.toHaveBeenCalled()
        })

        it('keeps every source coming while the screen is open, so generating again does not start from nothing', async () => {
            await controller.loadAlbumsForSeries('sA')

            const warm = mocks.albumsOf.mock.calls.find(([request]) => request.sources.length > 0)[0]
            expect(warm.sources).toEqual([...ENRICHMENT_SOURCES])
            expect(warm.series).toEqual([SERIES])
        })

        it('says which albums failed and how many', async () => {
            mocks.albumsOf.mockResolvedValue(resultOf([found('One'), failed('Two')]))

            await controller.loadAlbumsForSeries('sA')

            expect(toast.warning).toHaveBeenCalledWith('1 of 2 albums could not be loaded and was left out: Artist - Two (took too long).')
        })

        it('says so when no album could be loaded', async () => {
            mocks.albumsOf.mockResolvedValue(resultOf([failed('One'), failed('Two')]))

            await controller.loadAlbumsForSeries('sA')

            expect(toast.warning).toHaveBeenCalledWith('None of the 2 albums could be loaded: Artist - One (took too long), Artist - Two (took too long).')
        })

        it('reads the list of series first when the series is not in memory (a reload of the page)', async () => {
            albumSeriesStore.setSeries([])
            albumSeriesStore.setDb({ fake: true })
            mocks.loadFromFirestore.mockImplementation(async () => { albumSeriesStore.setSeries([SERIES]) })

            await controller.loadAlbumsForSeries('sA')

            expect(mocks.loadFromFirestore).toHaveBeenCalledTimes(1)
            expect(mocks.albumsOf.mock.calls[0][0].series).toEqual([SERIES])
        })

        it('asks for nothing when the series has no album, and says it', async () => {
            albumSeriesStore.setSeries([{ id: 'sA', name: 'Empty', albumQueries: [] }])

            await controller.loadAlbumsForSeries('sA')

            expect(mocks.albumsOf).not.toHaveBeenCalled()
            expect(toast.warning).toHaveBeenCalledWith('This series has no albums to generate playlists from.')
        })

        it('leaving the screen drops the asks, and a dropped ask tells nothing', async () => {
            mocks.albumsOf.mockImplementation(({ signal }) => new Promise(resolve => {
                signal.addEventListener('abort', () => resolve(resultOf([], { aborted: true })))
            }))

            const loading = controller.loadAlbumsForSeries('sA')
            await Promise.resolve()
            controller.destroy()
            const result = await loading

            expect(result.aborted).toBe(true)
            expect(toast.warning).not.toHaveBeenCalled()
        })
    })

    describe('handleGenerate (generate again with another recipe)', () => {
        it('generates through the blend controller and tells what the load left out', async () => {
            mocks.regenerate.mockResolvedValue({ playlists: [{}, {}], notices: ['Acclaim ratings are missing for 1 of 2 albums (1 did not answer): Artist - One.'] })

            await controller.handleGenerate({ algorithmId: 'top-3-acclaimed' })

            expect(mocks.regenerate).toHaveBeenCalledWith({ algorithmId: 'top-3-acclaimed' }, { signal: expect.any(AbortSignal) })
            expect(toast.warning).toHaveBeenCalledWith('Acclaim ratings are missing for 1 of 2 albums (1 did not answer): Artist - One.')
            expect(toast.success).toHaveBeenCalledWith('Generated 2 playlists')
            expect(view.isGenerating).toBe(false)
        })

        it('says why when nothing could be generated', async () => {
            mocks.regenerate.mockRejectedValue(new Error('None of the 2 albums could be loaded: ...'))

            await controller.handleGenerate({ algorithmId: 'x' })

            expect(toast.error).toHaveBeenCalledWith('None of the 2 albums could be loaded: ...')
            expect(toast.success).not.toHaveBeenCalled()
        })

        it('says nothing when the person left the screen meanwhile', async () => {
            mocks.regenerate.mockRejectedValue(Object.assign(new Error('The blend was cancelled'), { name: 'BlendCancelledError' }))

            await controller.handleGenerate({ algorithmId: 'x' })

            expect(toast.error).not.toHaveBeenCalled()
        })
    })
})
