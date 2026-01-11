import { describe, it, expect, beforeEach, vi } from 'vitest'
import { SeriesComponentFactory } from '../../../public/js/views/helpers/SeriesComponentFactory.js'
import { albumSeriesStore } from '../../../public/js/stores/albumSeries.js'
import { albumsStore } from '../../../public/js/stores/albums.js'

// Mocks for components
const mockHeaderMount = vi.fn()
const mockToolbarMount = vi.fn()
const mockGridMount = vi.fn()
const mockProgressMount = vi.fn()

vi.mock('../../../public/js/components/series/SeriesHeader.js', () => ({
    default: class MockHeader {
        constructor(opts) { this.props = opts.props }
        mount() { mockHeaderMount() }
    }
}))

vi.mock('../../../public/js/components/series/SeriesToolbar.js', () => ({
    default: class MockToolbar {
        constructor(opts) { this.props = opts.props }
        mount() { mockToolbarMount() }
    }
}))

vi.mock('../../../public/js/components/series/SeriesGridRenderer.js', () => ({
    default: class MockGrid {
        constructor(opts) { this.props = opts.props }
        mount() { mockGridMount() }
    }
}))

vi.mock('../../../public/js/components/series/SeriesProgressBar.js', () => ({
    SeriesProgressBar: class MockProgress {
        constructor() { }
        mount() { mockProgressMount() }
    }
}))

// Mock Stores & Router
vi.mock('../../../public/js/stores/albumSeries.js', () => ({
    albumSeriesStore: {
        getActiveSeries: vi.fn(),
        getSeries: vi.fn().mockReturnValue([])
    }
}))

vi.mock('../../../public/js/stores/albums.js', () => ({
    albumsStore: {
        getAlbums: vi.fn().mockReturnValue([])
    }
}))

vi.mock('../../../public/js/router.js', () => ({
    router: { navigate: vi.fn() }
}))

// Mock Service
vi.mock('../../../public/js/services/SeriesFilterService.js', () => ({
    getUniqueArtists: vi.fn().mockReturnValue(['Artist A'])
}))

describe('SeriesComponentFactory', () => {
    let mockContainer
    let mockView
    let mockController

    beforeEach(() => {
        vi.clearAllMocks()
        mockContainer = document.createElement('div')
        mockView = {
            currentScope: 'SERIES',
            searchQuery: '',
            filters: {},
            viewMode: 'grid',
            targetSeriesId: 's1'
        }
        mockController = {
            getState: () => ({ searchQuery: '', filters: {}, viewMode: 'grid' }),
            handleSearch: vi.fn(),
            handleSeriesChange: vi.fn(),
            handleFilterChange: vi.fn(),
            loadScope: vi.fn(),
            handleViewModeChange: vi.fn()
        }
    })

    describe('createHeader', () => {
        it('should create and mount header with correct title', () => {
            albumSeriesStore.getActiveSeries.mockReturnValue({ id: 's1', name: 'My Series' })

            const header = SeriesComponentFactory.createHeader(mockContainer, { view: mockView })

            expect(mockHeaderMount).toHaveBeenCalled()
            expect(header.props.pageTitle).toBe('My Series')
            expect(header.props.albumCount).toBeDefined()
        })

        it('should use default title for ALL scope', () => {
            mockView.currentScope = 'ALL'
            const header = SeriesComponentFactory.createHeader(mockContainer, { view: mockView })
            expect(header.props.pageTitle).toBe('All Albums Series')
        })
    })

    describe('createToolbar', () => {
        it('should create and mount toolbar with props', () => {
            const toolbar = SeriesComponentFactory.createToolbar(mockContainer, { view: mockView, controller: mockController })

            expect(mockToolbarMount).toHaveBeenCalled()
            expect(toolbar.props.artists).toEqual(['Artist A'])
            expect(toolbar.props.onSearch).toBeInstanceOf(Function)
        })
    })

    describe('createGrid', () => {
        it('should create and mount grid with props', () => {
            const grid = SeriesComponentFactory.createGrid(mockContainer, { view: mockView, controller: mockController })

            expect(mockGridMount).toHaveBeenCalled()
            expect(grid.props.layout).toBe('list') // default for viewMode=grid in test context logic is weird, let's check source: 'compact' ? 'grid' : 'list' -> so 'grid' mode in view gives 'list'? Wait, line 104: layout: view.viewMode === 'compact' ? 'grid' : 'list'
            // My mockView has viewMode: 'grid', so layout should be 'list'.
            expect(grid.props.scope).toBe('SERIES')
        })
    })
})
