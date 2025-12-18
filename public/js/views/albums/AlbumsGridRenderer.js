/**
 * AlbumsGridRenderer
 * Extracted rendering functions for album grids and lists
 * Part of Sprint 10 refactoring (AlbumsView modularization)
 */

import { albumLoader } from '../../services/AlbumLoader.js'
import { getIcon } from '../../components/Icons.js'

/**
 * Escape HTML special characters
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
export function escapeHtml(text) {
    const div = document.createElement('div')
    div.textContent = text || ''
    return div.innerHTML
}

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
 * Render ranked tracklist (sorted by rating)
 * @param {Object} album - Album object
 * @returns {string} HTML string
 */
export function renderRankedTracklist(album) {
    const tracks = album.tracks || []
    if (tracks.length === 0) {
        return '<p class="text-muted text-sm">No tracks available</p>'
    }

    // Sort by rating (descending)
    const rankedTracks = [...tracks].sort((a, b) => (b.rating || 0) - (a.rating || 0))

    return `
    <div class="tracklist-section">
      <h4 class="text-sm font-bold mb-3 flex items-center gap-2 text-accent-primary">
        ${getIcon('TrendingUp', 'w-4 h-4')}
        Ranked by Acclaim
      </h4>
      <div class="tracks-list-compact space-y-1 text-sm">
        ${rankedTracks.map((track, idx) => {
        const rating = track.rating || 0
        const medal = idx < 3 ? (idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉') : ''
        return `
            <div class="track-row-compact flex items-center gap-2 py-1 px-2 rounded hover:bg-white/5">
              <span class="track-pos w-6 text-xs text-muted text-center">${medal || (idx + 1)}</span>
              <span class="track-name flex-1 truncate">${escapeHtml(track.title || track.name)}</span>
              ${rating > 0 ? `<span class="track-rating badge badge-sm ${rating >= 90 ? 'badge-success' : rating >= 80 ? 'badge-primary' : 'badge-neutral'}">⭐ ${rating}</span>` : ''}
            </div>
          `
    }).join('')}
      </div>
    </div>
  `
}

/**
 * Render original tracklist (disk order)
 * @param {Object} album - Album object
 * @returns {string} HTML string
 */
export function renderOriginalTracklist(album) {
    const tracks = album.tracksOriginalOrder || album.tracks || []
    if (tracks.length === 0) {
        return '<p class="text-muted text-sm">No tracks available</p>'
    }

    return `
    <div class="tracklist-section">
      <h4 class="text-sm font-bold mb-3 flex items-center gap-2 text-accent-secondary">
        ${getIcon('List', 'w-4 h-4')}
        Original Album Order
      </h4>
      <div class="tracks-list-compact space-y-1 text-sm">
        ${tracks.map((track, idx) => {
        const rating = track.rating || 0
        const position = track.position || (idx + 1)
        return `
            <div class="track-row-compact flex items-center gap-2 py-1 px-2 rounded hover:bg-white/5">
              <span class="track-pos w-6 text-xs text-muted text-center">${position}</span>
              <span class="track-name flex-1 truncate">${escapeHtml(track.title || track.name)}</span>
              ${rating > 0 ? `<span class="track-rating badge badge-sm badge-neutral opacity-70">⭐ ${rating}</span>` : ''}
            </div>
          `
    }).join('')}
      </div>
    </div>
  `
}

/**
 * Render ranking source badge
 * @param {Object} album - Album object
 * @returns {string} HTML string for badge
 */
export function renderRankingBadge(album) {
    const hasBestEver = !!album.bestEverAlbumId
    const providerType = album.acclaim?.providerType
    const hasRatings = album.tracks?.some(t => t.rating > 0)

    if (hasBestEver) {
        return `
      <a href="https://www.besteveralbums.com/thechart.php?a=${album.bestEverAlbumId}" target="_blank" rel="noopener noreferrer" class="badge badge-primary hover:badge-accent transition-colors flex items-center gap-1" title="Ranking by Community Acclaim">
        ${getIcon('ExternalLink', 'w-3 h-3')} Acclaim
      </a>`
    }
    if (providerType === 'popularity') {
        return `<span class="badge badge-success flex items-center gap-1" title="Ranking by Spotify Popularity">${getIcon('TrendingUp', 'w-3 h-3')} Popularity</span>`
    }
    if (hasRatings) {
        return `<span class="badge badge-info flex items-center gap-1" title="Ranking by AI Enrichment">${getIcon('Cpu', 'w-3 h-3')} AI</span>`
    }
    // Pending
    return `<span class="badge badge-warning flex items-center gap-1">${getIcon('AlertTriangle', 'w-3 h-3')} Pending</span>`
}

/**
 * Render expanded album card (MODE 3)
 * @param {Object} album - Album object
 * @param {number} idx - Index for animation delay
 * @returns {string} HTML string
 */
export function renderExpandedAlbumCard(album, idx) {
    const coverUrl = albumLoader.getArtworkUrl(album, 150)

    return `
    <div class="expanded-album-card glass-panel p-6 mb-6 rounded-2xl animate-in fade-in slide-in-from-bottom-4 duration-500" style="animation-delay: ${idx * 50}ms" data-album-id="${album.id || ''}">
      <div class="flex flex-col md:flex-row gap-6 items-start">
        <!-- Album Cover & Actions Column -->
        <div class="flex flex-col gap-4 shrink-0">
          <div class="relative group">
            <div class="w-32 h-32 md:w-40 md:h-40 rounded-xl overflow-hidden shadow-lg bg-gray-800 border border-white/10">
              <img
                src="${coverUrl}"
                alt="${escapeHtml(album.title)}"
                class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
              />
            </div>
          </div>
          <!-- Action Buttons -->
          <div class="flex flex-wrap gap-2 justify-center md:justify-start">
            <button class="tech-btn tech-btn-secondary text-xs px-4 py-2 flex items-center gap-2 hover:bg-white/20"
              data-action="add-to-inventory"
              data-album-id="${album.id || ''}">
              ${getIcon('Plus', 'w-3 h-3')} Inventory
            </button>
            <button class="tech-btn tech-btn-danger text-xs px-4 py-2 flex items-center gap-2"
              data-action="remove-album"
              data-album-id="${album.id || ''}">
              ${getIcon('Trash', 'w-3 h-3')} Remove
            </button>
          </div>
        </div>
        <!-- Content Column -->
        <div class="flex-1 w-full min-w-0">
          <h3 class="text-2xl font-bold mb-1 flex items-center gap-2">
            ${getIcon('Music', 'w-6 h-6 text-accent-primary')}
            ${escapeHtml(album.title)}
          </h3>
          <p class="text-accent-primary text-lg mb-3">${escapeHtml(album.artist)}</p>
          <!-- Badges -->
          <div class="flex flex-wrap gap-2 text-sm mb-4">
            ${album.year ? `<span class="badge badge-neutral">${album.year}</span>` : ''}
            <span class="badge badge-neutral">${album.tracks?.length || 0} tracks</span>
            ${renderRankingBadge(album)}
          </div>
          <!-- Dual Tracklists -->
          <div class="dual-tracklists-compact grid md:grid-cols-2 gap-6">
            ${renderOriginalTracklist(album)}
            ${renderRankedTracklist(album)}
          </div>
        </div>
      </div>
    </div>
  `
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
    const coverUrl = albumLoader.getArtworkUrl(album, 300)
    const hasRatings = album.acclaim?.hasRatings || album.tracks?.some(t => t.rating > 0)

    return `
    <div class="album-card-compact flex flex-col gap-3 h-full relative" data-album-id="${album.id || ''}">
      <!-- Image Container -->
      <div 
        class="relative w-full aspect-square rounded-xl overflow-hidden bg-gray-800 border border-white/5 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group"
        data-action="view-modal"
        data-album-id="${album.id || ''}"
      >
        ${coverUrl ?
            `<img src="${coverUrl}" alt="${escapeHtml(album.title)}" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />` :
            `<div class="flex items-center justify-center w-full h-full text-white/20">${getIcon('Music', 'w-24 h-24')}</div>`
        }
        <!-- Hover Overlay -->
        <div class="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center pointer-events-none">
          <span class="bg-black/50 p-3 rounded-full backdrop-blur text-white">
            ${getIcon('Maximize2', 'w-6 h-6')}
          </span>
        </div>
      </div>
      
      <!-- Metadata Container -->
      <div class="flex flex-col gap-1 px-1">
        <div class="flex justify-between items-start gap-2">
          <div class="min-w-0 flex-1">
            <h3 class="font-bold text-white text-base truncate leading-tight" title="${escapeHtml(album.title)}">
              ${escapeHtml(album.title)}
            </h3>
            <p class="text-gray-400 text-sm truncate hover:text-white transition-colors">
              ${escapeHtml(album.artist)}
            </p>
          </div>
          <!-- Action Buttons -->
          <div class="flex items-center gap-1 shrink-0">
            <button class="p-1.5 text-gray-400 hover:text-green-400 hover:bg-white/10 rounded-lg transition-colors" 
              title="Add to Inventory" 
              data-action="add-to-inventory" 
              data-album-id="${album.id || ''}">
              ${getIcon('Plus', 'w-4 h-4')}
            </button>
            <button class="p-1.5 text-gray-400 hover:text-red-400 hover:bg-white/10 rounded-lg transition-colors" 
              title="Remove" 
              data-action="remove-album" 
              data-album-id="${album.id || ''}">
              ${getIcon('Trash', 'w-4 h-4')}
            </button>
          </div>
        </div>
        <!-- Badges Row -->
        <div class="flex items-center justify-between mt-2 gap-2">
          <div class="flex flex-wrap gap-2">
            <span class="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-gray-400 border border-white/5">
              ${album.year || 'N/A'}
            </span>
            <span class="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-gray-400 border border-white/5">
              ${album.tracks?.length || 0}
            </span>
            ${!hasRatings ? `<span class="text-[10px] px-1.5 py-0.5 rounded bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 flex items-center gap-1">${getIcon('AlertTriangle', 'w-3 h-3')}</span>` : ''}
          </div>
          <button
            class="text-xs px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 text-accent-primary hover:bg-white/10 hover:border-accent-primary/50 transition-all flex items-center gap-1 whitespace-nowrap"
            data-action="view-modal"
            data-album-id="${album.id || ''}">
            View Tracks
          </button>
        </div>
      </div>
    </div>
  `
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
