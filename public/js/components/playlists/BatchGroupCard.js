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
      createdAt
    } = options

    const playlistCount = playlists.length
    const totalTracks = playlists.reduce((sum, p) => sum + (p.tracks?.length || 0), 0)
    const dateStr = this.formatDate(createdAt)

    const playlistsHtml = playlists.map(playlist =>
      this.renderPlaylistRow(seriesId, playlist)
    ).join('')

    return `
      <div class="batch-group-card bg-surface rounded-xl border border-white/10 overflow-hidden" 
           data-series-id="${seriesId}" 
           data-batch-name="${this.escapeHtml(batchName)}">
        
        <!-- Batch Header -->
        <div class="batch-header p-4 bg-white/5 border-b border-white/10">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="font-bold text-lg">${this.escapeHtml(batchName)}</h3>
              <p class="text-sm text-muted mt-1">
                ${playlistCount} playlist${playlistCount !== 1 ? 's' : ''} • ${totalTracks} tracks • ${dateStr}
              </p>
            </div>
            <div class="flex items-center gap-2">
              <button class="btn btn-ghost btn-sm" 
                      data-action="edit-batch" 
                      data-series-id="${seriesId}" 
                      data-batch-name="${this.escapeHtml(batchName)}"
                      title="Edit Batch">
                ${getIcon('Edit', 'w-4 h-4')}
              </button>
              <button class="btn btn-ghost btn-sm text-red-400 hover:text-red-300" 
                      data-action="delete-batch" 
                      data-series-id="${seriesId}" 
                      data-batch-name="${this.escapeHtml(batchName)}"
                      data-count="${playlistCount}"
                      title="Delete Batch">
                ${getIcon('Trash', 'w-4 h-4')}
              </button>
            </div>
          </div>
        </div>

        <!-- Playlist List -->
        <div class="batch-playlists divide-y divide-white/5">
          ${playlistsHtml || '<div class="p-4 text-center text-muted">No playlists</div>'}
        </div>

        <!-- Batch Actions -->
        <div class="batch-actions p-3 bg-white/5 border-t border-white/10 flex justify-end gap-2">
          <button class="btn btn-secondary btn-sm" 
                  data-action="view-batch"
                  data-series-id="${seriesId}"
                  data-batch-name="${this.escapeHtml(batchName)}">
            View All
          </button>
        </div>
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
      <div class="playlist-row p-3 flex items-center justify-between hover:bg-white/5 transition-colors">
        <div class="flex items-center gap-3">
          ${getIcon('Music', 'w-5 h-5 text-muted')}
          <div>
            <div class="font-medium">${this.escapeHtml(playlist.name)}</div>
            <div class="text-xs text-muted">${trackCount} tracks • ${duration}</div>
          </div>
        </div>
        <div class="flex items-center gap-1">
          <button class="btn btn-ghost btn-xs" 
                  data-action="edit-playlist" 
                  data-series-id="${seriesId}" 
                  data-playlist-id="${playlist.id}"
                  title="Edit Playlist">
            ${getIcon('Edit', 'w-3 h-3')}
          </button>
          <button class="btn btn-ghost btn-xs text-red-400 hover:text-red-300" 
                  data-action="delete-playlist" 
                  data-series-id="${seriesId}" 
                  data-playlist-id="${playlist.id}"
                  data-playlist-name="${this.escapeHtml(playlist.name)}"
                  data-track-count="${trackCount}"
                  title="Delete Playlist">
            ${getIcon('Trash', 'w-3 h-3')}
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
