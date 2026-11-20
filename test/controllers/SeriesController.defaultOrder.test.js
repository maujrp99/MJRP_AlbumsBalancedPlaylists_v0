/**
 * UAT-227 - the albums screen opens with the series created last first («Newest»), on the phone
 * and on the computer. The other orders stay as they were.
 */
import { describe, it, expect, vi } from 'vitest'

vi.mock('../../public/js/services/albums/albumLoading.js', () => ({
    albumLoadService: { load: vi.fn(), refreshSource: vi.fn(), retryFailed: vi.fn(), reloadAlbum: vi.fn() },
    ALL_SERIES_CONTEXT: 'ALL_SERIES_VIEW',
    ALL_SCOPE: 'ALL',
    singleScope: (id) => `SINGLE:${id}`
}))
vi.mock('../../public/js/services/ranking/ownRanking.js', () => ({ ownRankingService: { ensureLoaded: vi.fn(), save: vi.fn() } }))
vi.mock('../../public/js/services/SeriesService.js', () => ({ getSeriesService: vi.fn() }))
vi.mock('../../public/js/stores/albums.js', () => ({
    albumsStore: { subscribe: () => () => { }, setActiveAlbumSeriesId: vi.fn(), getAlbums: () => [] }
}))

import SeriesController from '../../public/js/controllers/SeriesController.js'

const SERIES = [
    { id: 'old', name: 'Old', albumQueries: ['a - b'], createdAt: new Date('2025-01-01') },
    { id: 'new', name: 'New', albumQueries: ['a - b', 'c - d', 'e - f'], createdAt: new Date('2026-11-19') },
    { id: 'mid', name: 'Mid', albumQueries: ['a - b', 'c - d'], createdAt: new Date('2026-03-01') }
]

describe('the albums screen opens in the order «Newest» (UAT-227)', () => {
    it('starts with the sort mode of the option labelled «Newest»', () => {
        expect(new SeriesController().getState().seriesSortMode).toBe('recent_desc')
    })

    it('puts the series created last first', () => {
        expect(new SeriesController().getSortedSeries(SERIES).map(s => s.id)).toEqual(['new', 'mid', 'old'])
    })

    it('with no mode set it still sorts by «Newest»', () => {
        const controller = new SeriesController()
        controller.state.seriesSortMode = null
        expect(controller.getSortedSeries(SERIES).map(s => s.id)).toEqual(['new', 'mid', 'old'])
    })
})
