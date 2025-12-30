/**
 * Universal TrackRow Component
 * 
 * Standardizes track list items across the application.
 * Replaces: TrackItem.js (Components), manual track HTML (SavedPlaylists, Rankings).
 * 
 * @module components/ui/TrackRow
 * @since Sprint 15 (ARCH-12)
 */

import { getIcon } from '../Icons.js'
import { escapeHtml } from '../../utils/stringUtils.js'

/**
 * @typedef {Object} TrackRowProps
 * @property {Object} track - The track data object
 * @property {number} index - Visual index (1-based)
 * @property {'compact' | 'detailed' | 'ranking'} [variant='compact'] - Visual style
 * @property {'spotify' | 'acclaim'} [primaryRanking='spotify'] - Which ranking badge is primary
 * @property {boolean} [draggable=false] - Show drag handle?
 * @property {Array<{icon: string, label: string, action: string, class?: string}>} [actions] - Hover actions
 * @property {number} [playlistIndex] - For DragDrop contexts
 * @property {number} [trackIndex] - For DragDrop contexts
 */

export class TrackRow {
    /**
     * Render the TrackRow HTML
     * @param {TrackRowProps} props
     * @returns {string} HTML string
     */
    static render(props) {
        const {
            track,
            index,
            variant = 'compact',
            primaryRanking = 'spotify',
            draggable = false,
            actions = [],
            playlistIndex,
            trackIndex
        } = props

        const duration = this.formatDuration(track.duration)
        const isRanking = variant === 'ranking'

        // Badges Logic
        const badges = this.buildBadges({
            primaryRanking,
            track,
            variant // Pass variant to potential modify badge logic
        })

        // Position Logic (Medals for Ranking variant)
        let positionContent = `<span class="text-muted font-bold text-sm w-8 text-center">${index}</span>`
        if (isRanking && index <= 3) {
            const medal = index === 1 ? '🥇' : index === 2 ? '🥈' : '🥉'
            positionContent = `<span class="text-xl w-8 text-center">${medal}</span>`
        }

        // Drag Handle
        const dragHandle = draggable ? `
            <div class="track-drag-handle absolute left-2 top-1/2 -translate-y-1/2 text-muted opacity-0 group-hover:opacity-50 hover:!opacity-100 cursor-grab">
                ${getIcon('GripVertical', 'w-4 h-4')}
            </div>
        ` : ''

        // Rating Badge (Specific for Ranking View)
        let ratingBadge = ''
        if (isRanking) {
            const rating = track.rating || 0
            const ratingClass = this.getRatingClass(rating)
            if (rating > 0) {
                ratingBadge = `
                 <span class="badge ${ratingClass === 'excellent' ? 'badge-success' :
                        ratingClass === 'great' ? 'badge-primary' :
                            ratingClass === 'good' ? 'badge-warning' : 'badge-neutral'} ml-2">
                    ⭐ ${rating}
                 </span>`
            } else {
                ratingBadge = `<span class="badge badge-neutral opacity-50 ml-2">-</span>`
            }
        }

        // Action Buttons
        const actionButtons = actions.map(btn => `
            <button class="p-1 text-gray-400 hover:text-white hover:bg-white/10 rounded transition-colors ${btn.class || ''}"
                title="${escapeHtml(btn.label)}"
                data-action="${btn.action}"
                data-id="${track.id}"
                data-playlist-index="${playlistIndex}"
                data-track-index="${trackIndex}">
                ${getIcon(btn.icon, 'w-4 h-4')}
            </button>
        `).join('')

        return `
        <div 
            class="track-row flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors group relative ${draggable ? 'pl-8' : ''}"
            data-id="${track.id}"
            data-playlist-index="${playlistIndex}"
            data-track-index="${trackIndex}"
        >
            ${dragHandle}

            <!-- Position -->
            ${positionContent}

            <!-- Info -->
            <div class="flex-1 min-w-0 flex flex-col justify-center">
                <div class="flex items-center gap-2">
                    <span class="font-medium text-sm truncate text-white" title="${escapeHtml(track.title)}">
                        ${escapeHtml(track.title)}
                    </span>
                    ${!isRanking ? badges.primary : ''}
                    ${!isRanking ? badges.secondary : ''}
                </div>
                
                ${variant === 'detailed' ? `
                    <div class="text-xs text-muted truncate">
                        ${escapeHtml(track.artist)} • ${escapeHtml(track.album || '')}
                    </div>
                ` : ''}
            </div>

            <!-- Rating (Ranking Mode) -->
            ${ratingBadge}

            <!-- Actions (Hover) -->
            <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                ${actionButtons}
            </div>

            <!-- Duration -->
            <div class="text-xs text-muted font-mono w-12 text-right">
                ${duration}
            </div>
        </div>
        `
    }

    /**
     * Build badge HTML logic
     * Ported from TrackItem.js
     * @private
     */
    static buildBadges({ primaryRanking, track }) {
        const acclaimRank = track.rank
        const acclaimRating = track.rating
        const spotifyRank = track.spotifyRank
        const spotifyPopularity = track.spotifyPopularity

        const hasAcclaimRank = acclaimRank && acclaimRank < 999
        const hasAcclaimRating = acclaimRating && acclaimRating > 0
        const hasSpotifyRank = spotifyRank && spotifyRank < 999
        const hasSpotifyPop = spotifyPopularity != null && spotifyPopularity > -1

        // Acclaim badge (orange)
        const acclaimBadge = hasAcclaimRank
            ? `<span class="inline-flex items-center justify-center w-5 h-5 rounded-full bg-brand-orange/10 text-brand-orange text-[10px] font-bold border border-brand-orange/20" title="Acclaim Rank">#${acclaimRank}</span>`
            : hasAcclaimRating
                ? `<span class="flex items-center gap-0.5 text-[10px] font-bold text-brand-orange" title="Acclaim Rating">★${acclaimRating}</span>`
                : ''

        // Spotify badge (green)
        const spotifyBadge = hasSpotifyRank
            ? `<span class="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#1DB954]/10 text-[#1DB954] text-[10px] font-bold border border-[#1DB954]/20" title="Spotify Rank">#${spotifyRank}</span>`
            : hasSpotifyPop
                ? `<span class="text-[10px] font-bold text-[#1DB954]" title="Spotify Popularity">${spotifyPopularity}%</span>`
                : ''

        if (primaryRanking === 'spotify') {
            return { primary: spotifyBadge, secondary: acclaimBadge }
        } else {
            return { primary: acclaimBadge, secondary: spotifyBadge }
        }
    }

    static formatDuration(seconds) {
        if (!seconds || seconds <= 0) return '0:00'
        const mins = Math.floor(seconds / 60)
        const secs = Math.floor(seconds % 60)
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    static getRatingClass(rating) {
        if (rating >= 90) return 'excellent'
        if (rating >= 80) return 'great'
        if (rating >= 70) return 'good'
        return 'fair'
    }
}
