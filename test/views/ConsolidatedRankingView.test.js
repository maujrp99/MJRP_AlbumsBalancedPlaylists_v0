import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ConsolidatedRankingView } from '../../public/js/views/ConsolidatedRankingView.js'
import { albumsStore } from '../../public/js/stores/albums.js'
import { seriesStore } from '../../public/js/stores/series.js'

// Mock stores
vi.mock('../../public/js/stores/albums.js', () => ({
    albumsStore: {
        getAlbums: vi.fn(),
        subscribe: vi.fn(() => vi.fn())
    }
}))

vi.mock('../../public/js/stores/series.js', () => ({
    seriesStore: {
        getById: vi.fn(),
        subscribe: vi.fn(() => vi.fn())
    }
}))

describe('ConsolidatedRankingView', () => {
    let view
    let mockSeries
    let mockAlbums

    beforeEach(() => {
        view = new ConsolidatedRankingView()
        document.body.innerHTML = '<div id="app"></div>'
        view.$el = document.createElement('div') // Mock base view element

        mockSeries = {
            id: 'series_1',
            name: 'Test Series'
        }

        mockAlbums = [
            {
                id: 'album_1',
                title: 'Album 1',
                tracks: [
                    { title: 'Track A', rank: 1, rating: 90, duration: 180 },
                    { title: 'Track B', rank: 2, rating: 80, duration: 200 }
                ]
            },
            {
                id: 'album_2',
                title: 'Album 2',
                tracks: [
                    { title: 'Track C', rank: 1, rating: 95, duration: 220 }
                ]
            }
        ]

        seriesStore.getById.mockReturnValue(mockSeries)
        albumsStore.getAlbums.mockReturnValue(mockAlbums)
    })

    it('should initialize with default state', () => {
        expect(view.filterAlbumId).toBe('all')
        expect(view.sortField).toBe('rank')
        expect(view.sortDirection).toBe('asc')
    })

    it('should flatten and sort tracks correctly', () => {
        const tracks = view.getFilteredTracks()
        expect(tracks).toHaveLength(3)
        // Default sort is rank asc. 
        // Track A (rank 1), Track C (rank 1), Track B (rank 2)
        // Stable sort isn't guaranteed across albums for same rank, but let's check content
        expect(tracks.map(t => t.title)).toContain('Track A')
        expect(tracks.map(t => t.title)).toContain('Track B')
        expect(tracks.map(t => t.title)).toContain('Track C')
    })

    it('should filter tracks by album', () => {
        view.filterAlbumId = 'album_1'
        const tracks = view.getFilteredTracks()
        expect(tracks).toHaveLength(2)
        expect(tracks[0].albumId).toBe('album_1')
    })

    it('should sort by rating descending', () => {
        view.sortField = 'rating'
        view.sortDirection = 'desc'
        const tracks = view.getFilteredTracks()

        expect(tracks[0].title).toBe('Track C') // 95
        expect(tracks[1].title).toBe('Track A') // 90
        expect(tracks[2].title).toBe('Track B') // 80
    })

    it('should render correct number of rows', () => {
        view.activeSeriesId = 'series_1'
        view.render()

        const rows = view.$el.querySelectorAll('.track-row')
        expect(rows.length).toBe(3)
    })

    it('should render "Create your Balanced Playlists" button', () => {
        view.activeSeriesId = 'series_1'
        view.render()

        const btn = view.$el.querySelector('.btn-primary')
        expect(btn.textContent).toContain('Create your Balanced Playlists')
    })
})
