/**
 * BatchGroupCard Component
 * 
 * Card for displaying a batch of playlists in SavedPlaylistsView.
 * Shows batch header with metadata and playlist list with actions.
 * 
 * Features:
 * - Collapsible header (default: collapsed)
 * - Album count in header
 * - Expandable playlist rows with tracks
 * 
 * @module components/playlists/BatchGroupCard
 * @since Sprint 12.5, Enhanced ARCH-3
 */

import { BaseCard } from '../base/BaseCard.js'
import { getIcon } from '../Icons.js'

/**
 * @typedef {Object} BatchGroupCardOptions
 * @property {string} seriesId - Parent series ID
 * @property {string} batchName - Batch name
 * @property {Object[]} playlists - Playlists in this batch
 * @property {Date|string} createdAt - Batch creation date
 * @property {string[]} [thumbnails] - Album artwork URLs
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
      thumbnails = []
    } = options

    const playlistCount = playlists.length
    const totalTracks = playlists.reduce((sum, p) => sum + (p.tracks?.length || 0), 0)
    const albumCount = this.countUniqueAlbums(playlists)
    const dateStr = BaseCard.formatDate(createdAt)

    // Calculate total duration from all tracks
    const allTracks = playlists.flatMap(p => p.tracks || [])
    const totalDuration = BaseCard.formatDuration(allTracks)

    const playlistsHtml = playlists.map((playlist, idx) =>
      this.renderPlaylistRow(seriesId, playlist, idx)
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
           data-batch-name="${BaseCard.escapeHtml(batchName)}"
           data-collapsed="true">
        
        <!-- Collapsible Batch Header -->
        <div class="batch-header p-5 bg-gradient-to-r from-white/5 to-transparent border-b border-white/10 cursor-pointer"
             data-action="toggle-collapse">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-4">
               <span class="collapse-icon text-muted transition-transform duration-200">
                 ${getIcon('ChevronRight', 'w-5 h-5')}
               </span>
               ${cascadeHtml}
               <div>
                  <h3 class="font-bold text-xl text-white tracking-tight">${BaseCard.escapeHtml(batchName)}</h3>
                  <div class="flex items-center gap-3 text-sm text-muted mt-1">
                    <span class="flex items-center gap-1">${getIcon('List', 'w-3 h-3')} ${playlistCount} playlists</span>
                    <span class="flex items-center gap-1">${getIcon('Music', 'w-3 h-3')} ${totalTracks} tracks</span>
                    <span class="flex items-center gap-1">${getIcon('Disc', 'w-3 h-3')} ${albumCount} albums</span>
                    <span class="flex items-center gap-1 font-mono">${getIcon('Clock', 'w-3 h-3')} ${totalDuration}</span>
                    <span class="flex items-center gap-1">${getIcon('Calendar', 'w-3 h-3')} ${dateStr}</span>
                  </div>
               </div>
            </div>

            <div class="batch-card-buttons flex items-center gap-2">
              <button class="btn btn-secondary btn-sm flex items-center gap-2 hover:bg-white/20 transition-all shadow-md" 
                      data-action="edit-batch" 
                      data-series-id="${seriesId}" 
                      data-batch-name="${BaseCard.escapeHtml(batchName)}"
                      title="Edit this batch">
                ${getIcon('Edit', 'w-4 h-4')} Edit Batch
              </button>
              <button class="btn btn-ghost btn-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors" 
                      data-action="delete-batch" 
                      data-series-id="${seriesId}" 
                      data-batch-name="${BaseCard.escapeHtml(batchName)}"
                      data-count="${playlistCount}"
                      title="Delete entire batch">
                ${getIcon('Trash', 'w-4 h-4')}
              </button>
            </div>
          </div>
        </div>

        <!-- Playlist List (Collapsible - Hidden by default) -->
        <div class="batch-playlists divide-y divide-white/5 bg-black/20 hidden">
          ${playlistsHtml || '<div class="p-6 text-center text-muted italic">No playlists in this batch</div>'}
        </div>
      </div>
    `
  }

  /**
   * Count unique albums from all playlists
   * @private
   */
  static countUniqueAlbums(playlists) {
    const albumSet = new Set()
    playlists.forEach(playlist => {
      playlist.tracks?.forEach(track => {
        if (track.album) {
          albumSet.add(track.album.toLowerCase())
        }
      })
    })
    return albumSet.size
  }

  /**
   * Render a single playlist row (expandable)
   * @private
   */
  static renderPlaylistRow(seriesId, playlist, index) {
    const trackCount = playlist.tracks?.length || 0
    const duration = BaseCard.formatDuration(playlist.tracks)

    return `
      <div class="playlist-row-wrapper" data-playlist-index="${index}">
        <div class="playlist-row p-4 flex items-center justify-between hover:bg-white/5 transition-colors group cursor-pointer"
             data-action="toggle-playlist-tracks"
             data-playlist-id="${playlist.id}">
          <div class="flex items-center gap-4">
            <span class="expand-icon text-muted transition-transform duration-200">
              ${getIcon('ChevronRight', 'w-4 h-4')}
            </span>
            <div class="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-muted group-hover:text-brand-orange group-hover:bg-brand-orange/10 transition-colors">
              ${getIcon('Disc', 'w-4 h-4')}
            </div>
            <div>
              <div class="font-medium text-white group-hover:text-brand-orange transition-colors">${BaseCard.escapeHtml(playlist.name)}</div>
              <div class="text-xs text-muted font-mono mt-0.5">${trackCount} tracks • ${duration}</div>
            </div>
          </div>
          
          <div class="playlist-row-buttons flex items-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
             <button class="btn btn-ghost btn-sm text-muted hover:text-white" 
                    data-action="view-playlist" 
                    data-series="${seriesId}" 
                    data-id="${playlist.id}"
                    title="View Details">
              ${getIcon('Eye', 'w-4 h-4')}
            </button>
          </div>
        </div>
        
        <!-- Expandable Tracks List (Hidden by default) -->
        <div class="playlist-tracks-list hidden bg-black/30 pl-16 pr-4 py-2">
          ${this.renderTracksList(playlist.tracks)}
        </div>
      </div>
    `
  }

  /**
   * Render tracks list for expandable playlist
   * @private
   */
  static renderTracksList(tracks) {
    if (!tracks || tracks.length === 0) {
      return '<div class="text-sm text-muted italic py-2">No tracks</div>'
    }

    return tracks.map((track, i) => `
      <div class="flex items-center gap-3 py-1.5 text-sm border-l-2 border-white/10 pl-3 hover:border-brand-orange/50 transition-colors">
        <span class="text-muted font-mono w-5 text-right">${i + 1}.</span>
        <span class="text-white truncate flex-1">${BaseCard.escapeHtml(track.title || track.name)}</span>
        <span class="text-muted truncate max-w-[150px]">${BaseCard.escapeHtml(track.artist || '')}</span>
      </div>
    `).join('')
  }
}
