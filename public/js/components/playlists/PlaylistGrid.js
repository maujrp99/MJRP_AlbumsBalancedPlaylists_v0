/**
 * PlaylistGrid Component
 * 
 * Responsive grid layout for PlaylistCards.
 * 
 * @module components/playlists/PlaylistGrid
 * @since Sprint 12.5
 */

import { getIcon } from '../Icons.js'
import { escapeHtml } from '../../utils/stringUtils.js'
import { TrackRow } from '../ui/TrackRow.js'

/**
 * @typedef {Object} PlaylistGridOptions
 * @property {Object[]} playlists - Array of playlists
 * @property {boolean} [editable=true] - Enable editing
 * @property {'spotify' | 'acclaim'} [primaryRanking='spotify'] - Ranking order
 * @property {string} [batchName] - Batch name for title formatting (Sprint 15.5)
 */

export class PlaylistGrid {
  /**
   * Render playlist grid HTML
   * @param {PlaylistGridOptions} options
   * @returns {string} - HTML string
   */
  static render(options) {
    const {
      playlists,
      editable = true,
      primaryRanking = 'spotify',
      batchName = ''
    } = options

    if (!playlists || playlists.length === 0) {
      return `
        <div class="text-center py-12 text-muted">
          <p class="text-lg">No playlists generated yet.</p>
          <p class="text-sm mt-2">Use the settings above to generate playlists.</p>
        </div>
      `
    }

    const cardsHtml = playlists.map((playlist, index) => {
      // Determine ranking order for this specific playlist
      // Check metadata first, then fall back to grid default
      const rankingId = playlist._meta?.rankingId
      const playlistSpecificRanking = rankingId ? ((rankingId === 'spotify') ? 'spotify' : 'acclaim') : primaryRanking

      // Sprint 15.5: Build display title with batch name and index
      // Note: Algorithm-generated title (e.g., "Greatest Hits Vol. 1") doesn't have index prefix
      const playlistTitle = playlist.title || playlist.name || `Playlist ${index + 1}`

      let displayTitle
      if (batchName) {
        // Format: "1. BatchName - Title" (e.g., "1. Batch 555 - Greatest Hits Vol. 1")
        displayTitle = `${index + 1}. ${batchName} - ${playlistTitle}`
      } else {
        // Without batch name, show index + original title for visual clarity
        displayTitle = `${index + 1}. ${playlistTitle}`
      }

      return this.renderCard({
        playlist,
        index,
        editable,
        primaryRanking: playlistSpecificRanking,
        displayTitle // Sprint 15.5: Pass formatted title
      })
    }).join('')

    // Responsive grid: 1 col on mobile, 2 on md, 3 on lg
    return `
      <div class="playlist-grid grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        ${cardsHtml}
      </div>
    `
  }

  /**
   * Render single playlist card
   * @private
   */
  static renderCard(options) {
    const {
      playlist,
      index,
      editable = true,
      primaryRanking = 'spotify',
      displayTitle = null
    } = options

    const tracks = playlist.tracks || []
    const totalDuration = this.calculateDuration(tracks)
    const trackCount = tracks.length

    const titleToShow = displayTitle || playlist.name

    const tracksHtml = tracks.map((track, trackIndex) =>
      TrackRow.renderHTML({
        track,
        index: trackIndex + 1, // Visual index (1-based)
        playlistIndex: index,
        trackIndex,
        primaryRanking,
        draggable: true,
        variant: 'compact',
        // Sprint 17.75: Add Delete Action
        actions: editable ? [{
          icon: 'X',
          label: 'Remove Track',
          action: 'remove-track',
          class: 'text-muted hover:text-red-400 p-1 opacity-0 group-hover:opacity-100 transition-opacity'
        }] : []
      })
    ).join('')

    return `
      <div class="playlist-card bg-surface rounded-xl border border-white/10 overflow-hidden" data-playlist-index="${index}">
        <div class="playlist-header p-4 bg-white/5 border-b border-white/10 flex items-center justify-between">
          <div class="flex-1">
            ${editable ? `
              <h3 class="playlist-name text-lg font-bold cursor-text hover:bg-white/5 rounded px-2 py-1 -ml-2"
                  contenteditable="true" 
                  data-playlist-index="${index}" 
                  spellcheck="false">${escapeHtml(titleToShow)}</h3>
            ` : `
              <h3 class="text-lg font-bold">${escapeHtml(titleToShow)}</h3>
            `}
          </div>
          <div class="flex items-center gap-3 text-sm text-muted">
            <span class="flex items-center gap-1">
              ${getIcon('Music', 'w-4 h-4')}
              ${trackCount}
            </span>
            <span class="font-mono">${totalDuration}</span>
          </div>
        </div>
        
        <style>
          .custom-scrollbar-${index}::-webkit-scrollbar {
            width: 6px;
          }
          .custom-scrollbar-${index}::-webkit-scrollbar-track {
            background: rgba(255, 255, 255, 0.05);
            border-radius: 4px;
          }
          .custom-scrollbar-${index}::-webkit-scrollbar-thumb {
            background: rgba(249, 115, 22, 0.3); /* brand-orange with opacity */
            border-radius: 4px;
          }
          .custom-scrollbar-${index}::-webkit-scrollbar-thumb:hover {
            background: rgba(249, 115, 22, 0.6);
          }
        </style>
        
        <div class="playlist-tracks custom-scrollbar-${index} p-3 space-y-2 max-h-[260px] overflow-y-auto md:max-h-none md:overflow-visible" 
             data-playlist-index="${index}">
          ${tracksHtml || '<div class="text-center text-muted py-8">No tracks</div>'}
        </div>
      </div>
    `
  }

  /**
   * Calculate total duration in MM:SS format
   * @private
   */
  static calculateDuration(tracks) {
    const totalSeconds = tracks.reduce((sum, t) => sum + (t.duration || 0), 0)
    const mins = Math.floor(totalSeconds / 60)
    const secs = Math.floor(totalSeconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }
}
