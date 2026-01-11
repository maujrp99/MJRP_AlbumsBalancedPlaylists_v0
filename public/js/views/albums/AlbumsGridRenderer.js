/**
 * AlbumsGridRenderer
 * Extracted rendering functions for album grids and lists
 * Part of Sprint 10 refactoring (AlbumsView modularization)
 */

import { albumLoader } from '../../services/AlbumLoader.js'
import { getIcon } from '../../components/Icons.js'
import { escapeHtml } from '../../utils/stringUtils.js'
import { Card } from '../../components/ui/Card.js'
import { SafeDOM } from '../../utils/SafeDOM.js'
import { AlbumCardRenderer } from '../../components/ui/AlbumCardRenderer.js'

/**
 * Render loading progress overlay
 * @param {Object} progress - { current, total }
 * @returns {string} HTML string
 */
export function renderLoadingProgress(progress) {
  const { current, total } = progress
  const percentage = total > 0 ? Math.round((current / total) * 100) : 0

  return `
    <div class="loading-overlay fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div class="loading-content glass-panel p-8 max-w-md w-full text-center">
        <div class="loading-spinner w-12 h-12 border-4 border-accent-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p class="loading-text text-xl font-bold mb-2">Loading albums...</p>
        <div class="progress-bar-container bg-white/10 h-2 rounded-full overflow-hidden mb-2">
          <div class="progress-bar bg-accent-primary h-full transition-all duration-300" style="width: ${percentage}%"></div>
        </div>
        <p class="loading-status text-muted">${current} / ${total} (${percentage}%)</p>
      </div>
    </div>
  `
}

/**
 * Render empty state when no albums match filters
 * @returns {string} HTML string
 */
export function renderEmptyState() {
  return `
    <div class="text-center py-12 text-muted">
      <p class="text-xl mb-2">No albums yet</p>
      <p class="text-sm">Add albums from the Home page to get started</p>
    </div>
  `
}

/**
 * Render no-match state when filters return empty
 * @returns {string} HTML string
 */
export function renderNoMatchState() {
  return `
    <div class="text-center py-12 text-muted">
      <p class="text-xl mb-2">No albums match your filters</p>
      <p class="text-sm">Try adjusting your search or filters</p>
    </div>
  `
}



/**
 * Render expanded album card (MODE 3)
 * @param {Object} album - Album object
 * @param {number} idx - Index for animation delay
 * @returns {string} HTML string
 */
export function renderExpandedAlbumCard(album, idx) {
  return AlbumCardRenderer.renderExpanded(album, idx)
}

/**
 * Render expanded list view (MODE 3)
 * @param {Array} albums - Array of album objects
 * @param {Object} context - View context { searchQuery, filters }
 * @returns {string} HTML string
 */
export function renderExpandedList(albums, context = {}) {
  const { searchQuery, filters } = context
  const hasActiveFilters = searchQuery || (filters && Object.values(filters).some(v => v !== 'all' && v !== false))

  if (albums.length === 0 && hasActiveFilters) {
    return renderNoMatchState()
  }

  return albums.map((album, idx) => renderExpandedAlbumCard(album, idx)).join('')
}

/**
 * Render compact album card (MODE 1)
 * @param {Object} album - Album object
 * @returns {string} HTML string
 */
export function renderCompactAlbumCard(album) {
  return AlbumCardRenderer.renderCompact(album)
}

/**
 * Render albums grid (MODE 1)
 * @param {Array} albums - Array of album objects
 * @param {Object} context - View context { searchQuery, filters }
 * @returns {string} HTML string
 */
export function renderAlbumsGrid(albums, context = {}) {
  const { searchQuery, filters } = context
  const hasActiveFilters = searchQuery || (filters && Object.values(filters).some(v => v !== 'all' && v !== false))

  if (albums.length === 0 && hasActiveFilters) {
    return `<div class="col-span-full">${renderNoMatchState()}</div>`
  }

  return albums.map(album => renderCompactAlbumCard(album)).join('')
}

/**
 * Wrap content in grid container
 * @param {string} content - HTML content
 * @returns {string} HTML string wrapped in grid
 */
export function wrapInGrid(content) {
  return `
    <div class="albums-grid grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
      ${content}
    </div>
  `
}
