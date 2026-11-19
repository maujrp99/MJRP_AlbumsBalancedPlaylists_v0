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

      // The title of the playlist is its own (the person can type over it); the position and the
      // batch name are shown beside it and are not part of it: "1. Batch 555 - " + "Greatest Hits Vol. 1"
      const playlistTitle = playlist.title || playlist.name || `Playlist ${index + 1}`
      const titlePrefix = batchName ? `${index + 1}. ${batchName} - ` : `${index + 1}. `

      return this.renderCard({
        playlist,
        index,
        editable,
        primaryRanking: playlistSpecificRanking,
        playlistTitle,
        titlePrefix
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
      playlistTitle = playlist.title || playlist.name || '',
      titlePrefix = ''
    } = options

    const tracks = playlist.tracks || []
    const totalDuration = this.calculateDuration(tracks)
    const trackCount = tracks.length

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
          // Whether it shows is the row's business (TrackRow: always on touch, on hover with a mouse)
          class: 'text-muted hover:text-red-400 p-1'
        }] : []
      })
    ).join('')

    return `
      <div class="playlist-card bg-surface rounded-xl border border-white/10 overflow-hidden" data-playlist-index="${index}">
        <div class="playlist-header p-4 bg-white/5 border-b border-white/10 flex items-center justify-between gap-3">
          <div class="flex-1 min-w-0">
            ${this.renderTitle({ editable, index, playlistTitle, titlePrefix })}
          </div>
          <div class="flex items-center gap-3 text-sm text-muted">
            <span class="flex items-center gap-1">
              ${getIcon('Music', 'w-4 h-4')}
              ${trackCount}
            </span>
            <span class="font-mono">${totalDuration}</span>
            ${editable ? `
              <button type="button" class="text-muted hover:text-red-400 p-1 rounded"
                      data-action="delete-playlist" data-playlist-index="${index}"
                      aria-label="Delete playlist ${escapeHtml(playlistTitle)}" title="Delete this playlist">
                ${getIcon('Trash2', 'w-4 h-4')}
              </button>
            ` : ''}
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
   * The title of a card: the position and the batch name, then the title of the playlist. When
   * the grid is editable the title (and only it) can be typed over; what is typed is taken by the
   * screen when the field loses the focus (views/playlists/playlistEditActions.js).
   * @private
   */
  static renderTitle({ editable, index, playlistTitle, titlePrefix }) {
    const prefix = `<span class="playlist-title-prefix text-muted">${escapeHtml(titlePrefix)}</span>`
    if (!editable) {
      return `<h3 class="text-lg font-bold">${prefix}${escapeHtml(playlistTitle)}</h3>`
    }
    return `
      <h3 class="text-lg font-bold">${prefix}<span class="playlist-name cursor-text hover:bg-white/5 focus:bg-white/10 rounded px-1 outline-none"
            contenteditable="true" role="textbox" aria-label="Title of playlist ${index + 1}"
            data-playlist-index="${index}" spellcheck="false">${escapeHtml(playlistTitle)}</span></h3>
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
