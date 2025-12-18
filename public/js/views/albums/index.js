/**
 * Albums View Modules
 * Barrel export for modular AlbumsView components
 * Part of Sprint 10 refactoring
 */

// Rendering components
export {
    escapeHtml,
    renderLoadingProgress,
    renderEmptyState,
    renderNoMatchState,
    renderRankedTracklist,
    renderOriginalTracklist,
    renderRankingBadge,
    renderExpandedAlbumCard,
    renderExpandedList,
    renderCompactAlbumCard,
    renderAlbumsGrid,
    wrapInGrid
} from './AlbumsGridRenderer.js'

// Filter utilities
export {
    filterAlbums,
    getUniqueArtists,
    getUniqueYears,
    getDecadeOptions,
    getSourceOptions
} from './AlbumsFilters.js'
