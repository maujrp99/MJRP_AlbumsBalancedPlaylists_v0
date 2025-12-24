/**
 * BatchGroupCard Component
 * 
 * Card for displaying a batch of playlists in SavedPlaylistsView.
 * Shows batch header with metadata and playlist list with actions.
 * 
 * @module components/playlists/BatchGroupCard
 * @since Sprint 12.5
 */

import { getIcon } from '../Icons.js'

/**
 * @typedef {Object} BatchGroupCardOptions
 * @property {string} seriesId - Parent series ID
 * @property {string} batchName - Batch name
 * @property {Object[]} playlists - Playlists in this batch
 * @property {Date|string} createdAt - Batch creation date
 */

export class BatchGroupCard {
  /**
   * Render batch group card HTML
   * @param {BatchGroupCardOptions} options
   * @returns {string} - HTML string
   */
  static render(options) {
    const {
      seriesId,
      batchName,
      playlists = [],
      createdAt,
      thumbnails = [] // New prop for cover art
    } = options

    const playlistCount = playlists.length
    const totalTracks = playlists.reduce((sum, p) => sum + (p.tracks?.length || 0), 0)
    const dateStr = this.formatDate(createdAt)

    const playlistsHtml = playlists.map(playlist =>
      this.renderPlaylistRow(seriesId, playlist)
    ).join('')

    // Use AlbumCascade for visual richness
    const cascadeHtml = globalThis.AlbumCascade
      ? globalThis.AlbumCascade.render(thumbnails)
      : `
            <div class="p-3 rounded-lg bg-gradient-to-br from-brand-orange to-red-500 shadow-lg">
                ${getIcon('Music', 'w-6 h-6 text-white')}
            </div>
        `

    return `
      <div class="batch-group-card bg-surface rounded-xl border border-white/10 overflow-hidden mb-6 transition-all duration-300 hover:border-brand-orange/30" 
           data-series-id="${seriesId}" 
           data-batch-name="${this.escapeHtml(batchName)}">
        
        <!-- Rich Batch Header -->
        <div class="batch-header p-5 bg-gradient-to-r from-white/5 to-transparent border-b border-white/10">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-4">
               ${cascadeHtml}
               <div>
                  <h3 class="font-bold text-xl text-white tracking-tight">${this.escapeHtml(batchName)}</h3>
                  <div class="flex items-center gap-3 text-sm text-muted mt-1">
                    <span class="flex items-center gap-1">${getIcon('List', 'w-3 h-3')} ${playlistCount} playlists</span>
                    <span class="flex items-center gap-1">${getIcon('Music', 'w-3 h-3')} ${totalTracks} tracks</span>
                    <span class="flex items-center gap-1">${getIcon('Calendar', 'w-3 h-3')} ${dateStr}</span>
                  </div>
               </div>
            </div>

            <div class="flex items-center gap-2">
              <button class="btn btn-secondary btn-sm flex items-center gap-2 hover:bg-white/20 transition-all shadow-md" 
                      data-action="edit-batch" 
                      data-series-id="${seriesId}" 
                      data-batch-name="${this.escapeHtml(batchName)}"
                      title="Edit this batch">
                ${getIcon('Edit', 'w-4 h-4')} Edit Batch
              </button>
              <button class="btn btn-ghost btn-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors" 
                      data-action="delete-batch" 
                      data-series-id="${seriesId}" 
                      data-batch-name="${this.escapeHtml(batchName)}"
                      data-count="${playlistCount}"
                      title="Delete entire batch">
                ${getIcon('Trash', 'w-4 h-4')}
              </button>
            </div>
          </div>
        </div>

        <!-- Playlist List (Compact & Rich) -->
        <div class="batch-playlists divide-y divide-white/5 bg-black/20">
          ${playlistsHtml || '<div class="p-6 text-center text-muted italic">No playlists in this batch</div>'}
        </div>
        
        <!-- No Footer Button (View All removed as requested) -->
      </div>
    `
  }

  /**
   * Render a single playlist row
   * @private
   */
  static renderPlaylistRow(seriesId, playlist) {
    const trackCount = playlist.tracks?.length || 0
    const duration = this.formatDuration(playlist.tracks)

    return `
      <div class="playlist-row p-4 flex items-center justify-between hover:bg-white/5 transition-colors group">
        <div class="flex items-center gap-4">
          <div class="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-muted group-hover:text-brand-orange group-hover:bg-brand-orange/10 transition-colors">
            ${getIcon('Disc', 'w-4 h-4')}
          </div>
          <div>
            <div class="font-medium text-white group-hover:text-brand-orange transition-colors">${this.escapeHtml(playlist.name)}</div>
            <div class="text-xs text-muted font-mono mt-0.5">${trackCount} tracks • ${duration}</div>
          </div>
        </div>
        
        <div class="flex items-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
           <!-- Individual Edit Removed as requested -->
           <button class="btn btn-ghost btn-sm text-muted hover:text-white" 
                  data-action="view-playlist" 
                  data-series="${seriesId}" 
                  data-id="${playlist.id}"
                  title="View Details">
            ${getIcon('Eye', 'w-4 h-4')}
          </button>
        </div>
      </div>
    `
  }

  /**
   * Format date for display
   * @private
   */
  static formatDate(date) {
    if (!date) return ''
    const d = date instanceof Date ? date : new Date(date)
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  /**
   * Calculate total duration in MM:SS format
   * @private
   */
  static formatDuration(tracks) {
    if (!tracks || tracks.length === 0) return '0:00'
    const totalSeconds = tracks.reduce((sum, t) => sum + (t.duration || 0), 0)
    const mins = Math.floor(totalSeconds / 60)
    const secs = Math.floor(totalSeconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  /**
   * Escape HTML special characters
   * @private
   */
  static escapeHtml(text) {
    if (!text) return ''
    const div = document.createElement('div')
    div.textContent = text
    return div.innerHTML
  }
}
