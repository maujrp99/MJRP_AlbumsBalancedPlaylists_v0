/**
 * TrackItem Component
 * 
 * Reusable track item component with drag handle, badges, and metadata.
 * Implements badge order logic: LEFT = chosen ranking, RIGHT = alternative.
 * 
 * @module components/playlists/TrackItem
 * @since Sprint 12.5
 */

import { getIcon } from '../Icons.js'

/**
 * @typedef {Object} Track
 * @property {string} id
 * @property {string} title
 * @property {string} artist
 * @property {string} [album]
 * @property {number} [duration] - Duration in seconds
 * @property {number} [rating] - Acclaim rating
 * @property {number} [rank] - Acclaim rank
 * @property {number} [spotifyRank] - Spotify popularity rank
 * @property {number} [spotifyPopularity] - Spotify popularity 0-100
 */

/**
 * @typedef {Object} TrackItemOptions
 * @property {Track} track - Track data
 * @property {number} playlistIndex - Index of parent playlist
 * @property {number} trackIndex - Index within playlist
 * @property {'spotify' | 'acclaim'} [primaryRanking='spotify'] - Which ranking to show on LEFT
 * @property {boolean} [draggable=true] - Show drag handle
 * @property {Function} [onRemove] - Callback when remove clicked
 */

export class TrackItem {
    /**
     * Render track item HTML
     * @param {TrackItemOptions} options
     * @returns {string} - HTML string
     */
    static render(options) {
        const {
            track,
            playlistIndex,
            trackIndex,
            primaryRanking = 'spotify',
            draggable = true
        } = options

        const hasAcclaimRank = track.rank && track.rank < 999
        const hasAcclaimRating = track.rating && track.rating > 0
        const hasSpotifyRank = track.spotifyRank && track.spotifyRank < 999
        const hasSpotifyPop = track.spotifyPopularity != null && track.spotifyPopularity > -1

        // Build badges based on primaryRanking order
        // LEFT = primaryRanking (used for generation)
        // RIGHT = secondary (alternative, for reference)
        const badges = this.buildBadges({
            primaryRanking,
            hasAcclaimRank,
            hasAcclaimRating,
            acclaimRank: track.rank,
            acclaimRating: track.rating,
            hasSpotifyRank,
            hasSpotifyPop,
            spotifyRank: track.spotifyRank,
            spotifyPopularity: track.spotifyPopularity
        })

        const duration = this.formatDuration(track.duration)

        return `
      <div 
        class="track-item bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg p-3 cursor-move transition-all group relative" 
        draggable="${draggable}"
        data-playlist-index="${playlistIndex}"
        data-track-index="${trackIndex}">
        
        ${draggable ? `
          <div class="track-drag-handle absolute left-2 top-1/2 -translate-y-1/2 text-muted opacity-0 group-hover:opacity-50 hover:!opacity-100 cursor-grab">
            ${getIcon('GripVertical', 'w-4 h-4')}
          </div>
        ` : ''}

        <div class="track-info ${draggable ? 'pl-6' : ''}">
          <div class="flex justify-between items-start gap-2">
            <div class="track-title font-medium text-sm line-clamp-1" title="${this.escapeHtml(track.title)}">${this.escapeHtml(track.title)}</div>
            <div class="flex items-center gap-1.5 flex-shrink-0">
              <span class="text-xs text-muted font-mono">${duration}</span>
              ${badges.primary}
              ${badges.secondary}
            </div>
          </div>
          
          <div class="track-meta text-xs text-muted mt-1">
            <div class="truncate">
              ${track.artist ? this.escapeHtml(track.artist) : ''}
              ${track.album ? `<span class="opacity-70"> • ${this.escapeHtml(track.album)}</span>` : ''}
            </div>
          </div>
        </div>
      </div>
    `
    }

    /**
     * Build badge HTML based on ranking order
     * @private
     */
    static buildBadges({ primaryRanking, hasAcclaimRank, hasAcclaimRating, acclaimRank, acclaimRating, hasSpotifyRank, hasSpotifyPop, spotifyRank, spotifyPopularity }) {
        // Acclaim badge (orange)
        const acclaimBadge = hasAcclaimRank
            ? `<span class="inline-flex items-center justify-center w-6 h-6 rounded-full bg-brand-orange/10 text-brand-orange text-[10px] font-bold border border-brand-orange/20" title="Acclaim Rank">#${acclaimRank}</span>`
            : hasAcclaimRating
                ? `<span class="flex items-center gap-0.5 text-[10px] font-bold text-brand-orange" title="Acclaim Rating">★${acclaimRating}</span>`
                : ''

        // Spotify badge (green)
        const spotifyBadge = hasSpotifyRank
            ? `<span class="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#1DB954]/10 text-[#1DB954] text-[10px] font-bold border border-[#1DB954]/20" title="Spotify Rank">#${spotifyRank}</span>`
            : hasSpotifyPop
                ? `<span class="text-[10px] font-bold text-[#1DB954]" title="Spotify Popularity">${spotifyPopularity}%</span>`
                : ''

        // Order based on primaryRanking
        if (primaryRanking === 'spotify') {
            return { primary: spotifyBadge, secondary: acclaimBadge }
        } else {
            return { primary: acclaimBadge, secondary: spotifyBadge }
        }
    }

    /**
     * Format duration in MM:SS
     * @private
     */
    static formatDuration(seconds) {
        if (!seconds || seconds <= 0) return '0:00'
        const mins = Math.floor(seconds / 60)
        const secs = Math.floor(seconds % 60)
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
