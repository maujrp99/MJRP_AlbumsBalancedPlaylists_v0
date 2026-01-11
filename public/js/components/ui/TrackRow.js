/**
 * Universal TrackRow Component (SafeDOM Version)
 * 
 * Standardizes track list items across the application.
 * Replaces: TrackItem.js (Components), manual track HTML (SavedPlaylists, Rankings).
 * 
 * Sprint 15 Phase 3: Refactored to use SafeDOM for zero innerHTML.
 * 
 * @module components/ui/TrackRow
 * @since Sprint 15 (ARCH-12)
 */

import { SafeDOM } from '../../utils/SafeDOM.js'
import { getIcon } from '../Icons.js'

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
     * Render the TrackRow as a DOM Node
     * @param {TrackRowProps} props
     * @returns {HTMLElement} DOM Node
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

        // --- Drag Handle ---
        let dragHandleEl = null
        if (draggable) {
            dragHandleEl = SafeDOM.div({
                className: 'track-drag-handle absolute left-2 top-1/2 -translate-y-1/2 text-muted opacity-0 group-hover:opacity-50 hover:!opacity-100 cursor-grab'
            })
            dragHandleEl.innerHTML = getIcon('GripVertical', 'w-4 h-4')
        }

        // --- Position / Index (Line 1) ---
        let positionEl
        if (isRanking && index <= 3) {
            const medal = index === 1 ? '🥇' : index === 2 ? '🥈' : '🥉'
            positionEl = SafeDOM.span({ className: 'text-xl w-6 text-center shrink-0' }, medal)
        } else {
            positionEl = SafeDOM.span({ className: 'text-muted font-bold text-sm w-6 text-center shrink-0' }, String(index))
        }

        // --- Title (Line 1) --- 
        // No truncate as requested
        const titleEl = SafeDOM.span({
            className: 'font-medium text-sm text-white',
            title: track.title
        }, track.title)

        // --- Duration (Line 1) ---
        const durationEl = SafeDOM.div({
            className: 'text-xs text-muted font-mono ml-auto pl-2 shrink-0'
        }, duration)

        // --- Line 1 Container ---
        const line1 = SafeDOM.div({ className: 'flex items-center w-full' }, [
            positionEl,
            SafeDOM.div({ className: 'ml-2 flex-1' }, titleEl),
            durationEl
        ])

        // --- Badges (Line 2) ---
        const badges = this.buildBadges({ primaryRanking, track })

        // Rating Badge (treat as part of BEA info in Line 2)
        // Rating is already handled in buildBadges
        // User requested right alignment under duration
        const line2 = SafeDOM.div({ className: 'flex items-center gap-2 mt-0.5 justify-end text-xs w-full' }, [
            badges.primaryEl,
            badges.secondaryEl
        ].filter(Boolean))


        // --- Actions (Absolute/Overlay) ---
        // Actions traditionally float to the right. 
        // Let's keep them absolute or floating to not mess with the flow?
        // Or put them at end of Line 1?
        // Usually actions appear on hover.
        const actionButtons = actions.map(btn => {
            const buttonEl = SafeDOM.button({
                className: `p-1 text-gray-400 hover:text-white hover:bg-white/10 rounded transition-colors ${btn.class || ''}`,
                title: btn.label,
                dataset: {
                    action: btn.action,
                    id: track.id,
                    playlistIndex: playlistIndex,
                    trackIndex: trackIndex
                }
            })
            buttonEl.innerHTML = getIcon(btn.icon, 'w-4 h-4')
            return buttonEl
        })

        const actionsContainer = SafeDOM.div({
            className: 'absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 rounded px-1'
        }, actionButtons)


        // --- Main Container ---
        const contentContainer = SafeDOM.div({ className: 'flex flex-col flex-1 min-w-0 py-1' }, [
            line1,
            line2
        ])

        const rowClasses = `track-row flex items-start gap-0 p-2 rounded-lg hover:bg-white/5 transition-colors group relative ${draggable ? 'pl-8' : ''}`

        const row = SafeDOM.div({
            className: rowClasses,
            dataset: {
                id: track.id,
                playlistIndex: playlistIndex,
                trackIndex: trackIndex
            }
        }, [
            dragHandleEl,
            contentContainer,
            actionsContainer
        ])

        return row
    }

    /**
     * Build badge elements
     * @private
     */
    static buildBadges({ primaryRanking, track }) {
        const acclaimRank = track.rank || track.acclaimRank
        const acclaimRating = track.rating
        const spotifyRank = track.spotifyRank
        const spotifyPopularity = track.spotifyPopularity




        const hasAcclaimRank = acclaimRank && acclaimRank < 999
        const hasAcclaimRating = acclaimRating && acclaimRating > 0
        const hasSpotifyRank = spotifyRank && spotifyRank < 999
        const hasSpotifyPop = spotifyPopularity != null && spotifyPopularity > -1

        // Acclaim badge (orange)
        const acclaimItems = []

        if (hasAcclaimRank) {
            acclaimItems.push(SafeDOM.span({
                className: 'inline-flex items-center justify-center w-5 h-5 rounded-full bg-brand-orange/10 text-brand-orange text-[10px] font-bold border border-brand-orange/20',
                title: 'BestEverAlbums Rank'
            }, `#${acclaimRank}`))
        }

        if (hasAcclaimRating) {
            acclaimItems.push(SafeDOM.span({
                className: 'flex items-center gap-0.5 text-[10px] font-bold text-brand-orange',
                title: 'BestEverAlbums Rating'
            }, `★${acclaimRating}`))
        }

        let acclaimBadgeEl = null
        if (acclaimItems.length > 0) {
            acclaimBadgeEl = SafeDOM.span({ className: 'flex items-center gap-1' }, acclaimItems)
        }

        // Spotify badge (green)
        let spotifyBadgeEl = null
        if (hasSpotifyRank) {
            spotifyBadgeEl = SafeDOM.span({
                className: 'inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#1DB954]/10 text-[#1DB954] text-[10px] font-bold border border-[#1DB954]/20',
                title: 'Spotify Rank'
            }, `#${spotifyRank}`)
        } else if (hasSpotifyPop) {
            spotifyBadgeEl = SafeDOM.span({
                className: 'text-[10px] font-bold text-[#1DB954]',
                title: 'Spotify Popularity'
            }, `${spotifyPopularity}%`)
        }

        if (primaryRanking === 'spotify') {
            return { primaryEl: spotifyBadgeEl, secondaryEl: acclaimBadgeEl }
        } else {
            return { primaryEl: acclaimBadgeEl, secondaryEl: spotifyBadgeEl }
        }
    }

    /**
     * Backwards-compatible HTML string renderer
     * Use this when you need HTML string (for template literals or innerHTML)
     * @param {TrackRowProps} props
     * @returns {string} HTML string
     */
    static renderHTML(props) {
        const el = this.render(props)
        return el.outerHTML
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
