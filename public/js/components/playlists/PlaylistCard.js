/**
 * PlaylistCard Component
 * 
 * Card wrapper for a single playlist with header and track list.
 * Supports editable name and Sortable.js integration.
 * 
 * @module components/playlists/PlaylistCard
 * @since Sprint 12.5
 */

import { getIcon } from '../Icons.js'
import { TrackItem } from './TrackItem.js'

/**
 * @typedef {Object} PlaylistCardOptions
 * @property {Object} playlist - Playlist data
 * @property {number} index - Playlist index
 * @property {boolean} [editable=true] - Enable name editing
 * @property {'spotify' | 'acclaim'} [primaryRanking='spotify'] - Ranking order for TrackItems
 * @property {Function} [onNameChange] - Callback for name change
 */

export class PlaylistCard {
    /**
     * Render playlist card HTML
     * @param {PlaylistCardOptions} options
     * @returns {string} - HTML string
     */
    static render(options) {
        const {
            playlist,
            index,
            editable = true,
            primaryRanking = 'spotify'
        } = options

        const tracks = playlist.tracks || []
        const totalDuration = this.calculateDuration(tracks)
        const trackCount = tracks.length

        const tracksHtml = tracks.map((track, trackIndex) =>
            TrackItem.render({
                track,
                playlistIndex: index,
                trackIndex,
                primaryRanking,
                draggable: true
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
                  spellcheck="false">${this.escapeHtml(playlist.name)}</h3>
            ` : `
              <h3 class="text-lg font-bold">${this.escapeHtml(playlist.name)}</h3>
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
        
        <div class="playlist-tracks p-3 space-y-2 max-h-[500px] overflow-y-auto" data-playlist-index="${index}">
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
