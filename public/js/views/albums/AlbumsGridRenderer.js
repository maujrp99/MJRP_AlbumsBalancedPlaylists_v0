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
  const hasSpotify = !!album.spotifyId
  const providerType = album.acclaim?.providerType || album.rankingSource
  const hasRatings = album.tracks?.some(t => t.rating > 0)
  const hasSpotifyPopularity = album.tracks?.some(t => t.spotifyPopularity > 0)

  // Multiple badges can be shown
  let badges = []

  if (hasBestEver) {
    badges.push(`
      <a href="https://www.besteveralbums.com/thechart.php?a=${album.bestEverAlbumId}" target="_blank" rel="noopener noreferrer" class="badge badge-primary hover:badge-accent transition-colors flex items-center gap-1" title="Ranking by Community Acclaim">
        ${getIcon('ExternalLink', 'w-3 h-3')} Acclaim
      </a>`)
  }

  if (hasSpotify) {
    badges.push(`
      <a href="${album.spotifyUrl || `https://open.spotify.com/album/${album.spotifyId}`}" target="_blank" rel="noopener noreferrer" class="badge flex items-center gap-1 transition-colors hover:opacity-80" style="background: #1DB954; color: white; border: none;" title="Open in Spotify">
        ${getIcon('Spotify', 'w-3 h-3')} Spotify
      </a>`)
  } else if (providerType === 'popularity' || hasSpotifyPopularity) {
    badges.push(`<span class="badge flex items-center gap-1" style="background: #1DB954; color: white;" title="Ranking by Spotify Popularity">${getIcon('TrendingUp', 'w-3 h-3')} Popularity</span>`)
  }

  if (badges.length === 0) {
    if (hasRatings) {
      return `<span class="badge badge-info flex items-center gap-1" title="Ranking by AI Enrichment">${getIcon('Cpu', 'w-3 h-3')} AI</span>`
    }
    // Pending
    return `<span class="badge badge-warning flex items-center gap-1">${getIcon('AlertTriangle', 'w-3 h-3')} Pending</span>`
  }

  return badges.join('')
}

/**
 * Render expanded album card (MODE 3)
 * @param {Object} album - Album object
 * @param {number} idx - Index for animation delay
 * @returns {string} HTML string
 */
export function renderExpandedAlbumCard(album, idx) {
  const coverUrl = albumLoader.getArtworkUrl(album, 150)

  // Prepare props for Card.renderList (Expanded Variant)
  const cardProps = {
    variant: 'expanded',
    entity: album,
    title: album.title,
    subtitle: album.artist,
    image: coverUrl,
    // Content includes the ranking comparison placeholder and extra badges logic
    // we use SafeDOM.fromHTML to prevent specific HTML string from being escaped by Card component
    content: SafeDOM.fromHTML(`
        <div class="flex flex-wrap gap-2 text-sm mb-4">
             ${album.year ? `<span class="badge badge-neutral">${album.year}</span>` : ''}
             <span class="badge badge-neutral">${album.tracks?.length || 0} tracks</span>
             <!-- Badges are handled by Card internally but we can inject extras here if needed -->
        </div>
        <!-- Ranking UI Container (Mounts TracksRankingComparison) -->
        <div class="ranking-comparison-container mt-6" data-album-id="${album.id}"></div>
    `),
    actions: [
      { icon: 'Plus', label: 'Inventory', action: 'add-to-inventory' },
      { icon: 'Trash', label: 'Remove', action: 'remove-album', class: 'tech-btn-danger' }
    ]
  }

  // Animation wrapper
  return `
    <div class="animate-in fade-in slide-in-from-bottom-4 duration-500" style="animation-delay: ${idx * 50}ms">
        ${Card.renderHTML(cardProps)}
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

  // Determine badges
  let badgeText = ''
  if (album.year) badgeText = album.year

  // Warnings
  // If no ratings, we might want to show a warning icon in the card.
  // The Card component doesn't have a generic "status icon" slot other than badges.
  // We can pass a badge prop.

  const cardProps = {
    variant: 'grid',
    entity: album,
    title: album.title,
    subtitle: album.artist,
    image: coverUrl,
    badge: badgeText,
    actions: [
      { icon: 'Plus', label: 'Add', action: 'add-to-inventory' },
      { icon: 'Trash', label: 'Remove', action: 'remove-album' }
    ],
    // OnClick logic is handled by the Card (view-modal by default) or by View delegation
  }

  const cardHTML = Card.renderHTML(cardProps)

  // We need to inject the "View Tracks" button into the footer row if possible, 
  // or simple rely on the main card click 'view-modal'.
  // The original design had a specific "View Tracks" button.
  // The new Card has a "Maximize" overlay which does the same thing.
  // So we can stick with standard Card behavior.

  return cardHTML
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
