/** The shapes the albums screen reads from the controller and the stores. Only the fields the screen uses. */

export interface Album {
    id: string
    title: string
    artist: string
    year?: string | number | null
    hasUserRanking?: boolean
    userRanking?: unknown[]
    bestEverAlbumId?: string | number | null
    spotifyId?: string | null
    spotifyUrl?: string | null
    artworkTemplate?: string | null
    coverUrl?: string | null
    seriesIds?: string[]
    metadata?: { identityReason?: string } | null
    getTracks: (kind: string) => Array<Record<string, unknown>>
}

export interface Series {
    id: string
    name: string
    albumQueries?: Array<string | { album?: string; title?: string; artist?: string }>
}

export interface SeriesState {
    status: string
    found: number
    failed: number
}

export interface Paging {
    mode: string
    size: number
    page: number
    pages: number
    total: number
    from: number
    to: number
    hasMore: boolean
    totalSeries: number
    albums?: number
    single: boolean
    unchecked?: number
}

export interface PageView {
    groups: Array<{ series: Series }>
    paging: Paging
}

export interface HeaderData {
    title: string
    description: string
    seriesList: Series[]
    activeSeriesId: string | null
}

export interface ScreenState {
    currentScope: 'ALL' | 'SINGLE'
    targetSeriesId: string | null
    viewMode: string
    filters: { artist?: string; year?: string; source?: string }
    searchQuery: string
    seriesSortMode: string
}

/** What the screen asks of the controller (controllers/SeriesController.js, hand-written JavaScript). */
export interface AlbumsController {
    setView: (view: unknown) => void
    init: (db: unknown, view: unknown) => void
    detachView: (view: unknown) => void
    loadScope: (scope: string, seriesId: string | null, skipCache?: boolean, options?: { entering?: boolean }) => Promise<void>
    getState: () => ScreenState
    getPageView: () => PageView
    getHeaderData: () => HeaderData
    getSeriesStates: () => Record<string, SeriesState>
    refresh: () => void
    requestLoad: (fresh?: boolean) => void
    handleSearch: (query: string) => void
    handleSort: (key: string) => void
    handleFilterChange: (type: string, value: string) => void
    handleViewModeChange: (mode: string) => void
    handlePage: (page: number) => void
    handlePageSize: (size: number) => void
    handlePagingMode: (mode: string) => void
    handleShowMore: () => void
    handleRefetchMetadata: (album: Album) => void
    retrySeries: (seriesId: string) => void
    saveRanking: (album: Album, rankings: unknown) => Promise<boolean>
    sourcesOf: (albumId: string) => object
}
