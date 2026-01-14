/**
 * UserRankModal
 * 
 * Modal component for drag-and-drop ranking of album tracks.
 * Shows tracks with BEA/Spotify ranks for reference while user reorders.
 * 
 * Uses SortableJS for drag-and-drop functionality.
 * Color: Incandescent Blue (#0EA5E9 / sky-500)
 * 
 * @module components/ranking/UserRankModal
 * @since Sprint 20
 */

import Sortable from 'sortablejs'
import { SafeDOM } from '../../utils/SafeDOM.js'
import { getIcon } from '../Icons.js'
import { userRankingRepository } from '../../repositories/UserRankingRepository.js'
import { escapeHtml } from '../../utils/stringUtils.js'

/**
 * @typedef {Object} UserRankModalOptions
 * @property {Object} album - Album object with tracks
 * @property {string} userId - Current user ID
 * @property {Function} onSave - Callback after successful save
 * @property {Function} onClose - Callback when modal closes
 */

export class UserRankModal {
    /**
     * @param {UserRankModalOptions} options
     */
    constructor({ album, userId, onSave, onClose }) {
        this.album = album
        this.userId = userId
        this.onSave = onSave
        this.onClose = onClose

        // Clone tracks and sort by original position
        this.tracks = [...(album.tracks || [])].sort((a, b) =>
            (a.position || 0) - (b.position || 0)
        )

        // Track the user's ranking order (will be modified by drag-and-drop)
        this.rankedOrder = [...this.tracks]

        this.modalElement = null
        this.sortableInstance = null
    }

    /**
     * Check if device is mobile
     * @returns {boolean}
     */
    get isMobile() {
        return window.innerWidth <= 768
    }

    /**
     * Render and show the modal
     */
    show() {
        this.modalElement = this._render()
        document.body.appendChild(this.modalElement)

        // Initialize drag-and-drop after DOM is ready
        requestAnimationFrame(() => {
            this._initDragDrop()
        })

        // Add escape key listener
        this._escapeHandler = (e) => {
            if (e.key === 'Escape') this.close()
        }
        document.addEventListener('keydown', this._escapeHandler)
    }

    /**
     * Close and cleanup modal
     */
    close() {
        if (this.sortableInstance) {
            this.sortableInstance.destroy()
            this.sortableInstance = null
        }

        if (this.modalElement) {
            this.modalElement.remove()
            this.modalElement = null
        }

        document.removeEventListener('keydown', this._escapeHandler)

        if (this.onClose) {
            this.onClose()
        }
    }

    /**
     * Save the current ranking order
     */
    async save() {
        const rankings = this.rankedOrder.map((track, index) => ({
            trackTitle: track.title,
            userRank: index + 1  // 1-based ranking
        }))

        const success = await userRankingRepository.saveRanking(
            this.userId,
            this.album.id,
            {
                albumTitle: this.album.title,
                artistName: this.album.artist,
                rankings
            }
        )

        if (success) {
            console.log('[UserRankModal] Ranking saved successfully')

            // Show success feedback
            this._showToast('Ranking saved!')

            // Close modal after short delay
            setTimeout(() => {
                this.close()
                if (this.onSave) {
                    this.onSave(rankings)
                }
            }, 500)
        } else {
            this._showToast('Failed to save. Please try again.', 'error')
        }
    }

    /**
     * Reset to original album order
     */
    reset() {
        this.rankedOrder = [...this.tracks]
        this._updateTrackList()
    }

    /**
     * Render the modal DOM structure
     * @returns {HTMLElement}
     * @private
     */
    _render() {
        const overlay = SafeDOM.div({
            className: 'fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm',
            onClick: (e) => {
                if (e.target === overlay) this.close()
            }
        })

        const baseClasses = 'glass-panel flex flex-col'
        const desktopClasses = 'w-full max-w-2xl max-h-[85vh] rounded-2xl border border-white/10 shadow-2xl m-4'
        const mobileClasses = 'fullscreen-modal'

        const modal = SafeDOM.div({
            className: `${baseClasses} ${this.isMobile ? mobileClasses : desktopClasses}`
        })

        // Header
        const header = SafeDOM.div({
            className: 'flex items-center justify-between p-4 border-b border-white/10'
        }, [
            SafeDOM.button({
                className: 'flex items-center gap-2 text-white/60 hover:text-white transition-colors',
                onClick: () => this.close()
            }, [
                SafeDOM.fromHTML(getIcon('ChevronLeft', 'w-5 h-5')),
                SafeDOM.span({}, 'Back')
            ]),
            SafeDOM.div({ className: 'flex items-center gap-2' }, [
                SafeDOM.button({
                    className: 'px-4 py-2 text-sm text-white/60 hover:text-white transition-colors',
                    onClick: () => this.reset()
                }, [
                    SafeDOM.fromHTML(getIcon('RotateCcw', 'w-4 h-4 inline mr-1')),
                    SafeDOM.text('Reset')
                ]),
                SafeDOM.button({
                    className: 'px-4 py-2 text-sm bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors font-medium',
                    onClick: () => this.save()
                }, [
                    SafeDOM.fromHTML(getIcon('Save', 'w-4 h-4 inline mr-1')),
                    SafeDOM.text('Save')
                ])
            ])
        ])

        // Title section
        const titleSection = SafeDOM.div({ className: 'p-4 border-b border-white/5' }, [
            SafeDOM.div({ className: 'flex items-center gap-2 text-sky-500' }, [
                SafeDOM.fromHTML(getIcon('Music', 'w-5 h-5')),
                SafeDOM.span({ className: 'text-lg font-bold' }, 'Rank Your Album')
            ]),
            SafeDOM.div({ className: 'text-white/60 text-sm mt-1' },
                `${escapeHtml(this.album.title)} - ${escapeHtml(this.album.artist)}`)
        ])

        // Instructions
        const instructions = SafeDOM.div({
            className: 'px-4 py-2 text-sm text-white/50'
        }, 'Drag tracks to set your personal ranking:')

        // Track list container
        const trackListContainer = SafeDOM.div({
            id: 'rank-track-list',
            className: 'flex-1 overflow-y-auto p-4 space-y-2'
        })

        // Render tracks
        this.rankedOrder.forEach((track, index) => {
            trackListContainer.appendChild(this._renderTrackItem(track, index))
        })

        // Footer tip
        const footer = SafeDOM.div({
            className: 'p-4 border-t border-white/10 text-xs text-white/40'
        }, [
            SafeDOM.span({ className: 'text-sky-500' }, '💡 '),
            SafeDOM.text('BEA and Spotify ranks shown for reference. Your ranking will be used in "Top Tracks by My Own Ranking" recipe.')
        ])

        modal.appendChild(header)
        modal.appendChild(titleSection)
        modal.appendChild(instructions)
        modal.appendChild(trackListContainer)
        modal.appendChild(footer)
        overlay.appendChild(modal)

        return overlay
    }

    /**
     * Render a single track item
     * @param {Object} track
     * @param {number} index
     * @returns {HTMLElement}
     * @private
     */
    _renderTrackItem(track, index) {
        const hasRank = track.rank && track.rank < 999
        const hasSpotifyRank = track.spotifyRank && track.spotifyRank < 999

        const item = SafeDOM.div({
            className: 'flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/5 ' +
                'hover:bg-white/10 hover:border-white/10 transition-colors cursor-grab group',
            'data-track-id': track.id || track.title
        })

        // Drag handle
        const dragHandle = SafeDOM.div({
            className: 'text-white/30 group-hover:text-white/60 transition-colors'
        }, SafeDOM.fromHTML(getIcon('GripVertical', 'w-5 h-5')))

        // Rank number (user's order)
        const rankNum = SafeDOM.div({
            className: 'w-8 h-8 flex items-center justify-center rounded-full ' +
                'bg-sky-500/10 text-sky-500 text-sm font-bold border border-sky-500/20'
        }, String(index + 1))

        // Track info
        const trackInfo = SafeDOM.div({ className: 'flex-1 min-w-0' }, [
            SafeDOM.div({ className: 'font-medium text-white truncate text-sm' },
                escapeHtml(track.title)),
            SafeDOM.div({ className: 'text-xs text-white/40 truncate' },
                escapeHtml(track.artist || this.album.artist))
        ])

        // Reference badges (BEA and Spotify)
        const badges = SafeDOM.div({ className: 'flex items-center gap-2 flex-shrink-0' })

        if (hasRank) {
            badges.appendChild(SafeDOM.span({
                className: 'text-xs text-brand-orange',
                title: 'BestEverAlbums Rank'
            }, `#${track.rank} BEA`))
        }

        if (hasSpotifyRank) {
            badges.appendChild(SafeDOM.span({
                className: 'text-xs text-[#1DB954]',
                title: 'Spotify Rank'
            }, `#${track.spotifyRank} SPFY`))
        }

        // Duration
        const duration = this._formatDuration(track.duration)
        const durationEl = SafeDOM.div({
            className: 'text-xs text-white/40 font-mono w-12 text-right'
        }, duration)

        item.appendChild(dragHandle)
        item.appendChild(rankNum)
        item.appendChild(trackInfo)
        item.appendChild(badges)
        item.appendChild(durationEl)

        return item
    }

    /**
     * Format duration in mm:ss
     * @private
     */
    _formatDuration(ms) {
        if (!ms || ms <= 0) return '--:--'
        const totalSeconds = Math.floor(ms / 1000)
        const minutes = Math.floor(totalSeconds / 60)
        const seconds = totalSeconds % 60
        return `${minutes}:${seconds.toString().padStart(2, '0')}`
    }

    /**
     * Initialize SortableJS drag-and-drop
     * @private
     */
    _initDragDrop() {
        const listEl = document.getElementById('rank-track-list')
        if (!listEl) return

        this.sortableInstance = Sortable.create(listEl, {
            animation: 150,
            ghostClass: 'opacity-50',
            // Note: SortableJS class options can only have single class names
            // Using fallback style via onChoose/onUnchoose instead
            dragClass: 'cursor-grabbing',
            handle: '.group', // Whole item is draggable
            onChoose: (evt) => {
                // Add ring highlight manually (supports multiple classes)
                evt.item.classList.add('ring-2', 'ring-sky-500')
            },
            onUnchoose: (evt) => {
                // Remove ring highlight
                evt.item.classList.remove('ring-2', 'ring-sky-500')
            },
            onEnd: (evt) => {
                // Remove any lingering ring classes
                evt.item.classList.remove('ring-2', 'ring-sky-500')

                // Update ranked order based on new DOM order
                const items = listEl.querySelectorAll('[data-track-id]')
                this.rankedOrder = Array.from(items).map(item => {
                    const trackId = item.getAttribute('data-track-id')
                    return this.tracks.find(t => (t.id || t.title) === trackId)
                }).filter(Boolean)

                // Update rank numbers
                this._updateRankNumbers()
            }
        })
    }

    /**
     * Update rank numbers after reorder
     * @private
     */
    _updateRankNumbers() {
        const listEl = document.getElementById('rank-track-list')
        if (!listEl) return

        const items = listEl.querySelectorAll('[data-track-id]')
        items.forEach((item, index) => {
            const rankEl = item.querySelector('.bg-sky-500\\/10')
            if (rankEl) {
                rankEl.textContent = String(index + 1)
            }
        })
    }

    /**
     * Re-render the entire track list (for reset)
     * @private
     */
    _updateTrackList() {
        const listEl = document.getElementById('rank-track-list')
        if (!listEl) return

        SafeDOM.clear(listEl)
        this.rankedOrder.forEach((track, index) => {
            listEl.appendChild(this._renderTrackItem(track, index))
        })
    }

    /**
     * Show a toast notification
     * @param {string} message
     * @param {'success'|'error'} type
     * @private
     */
    _showToast(message, type = 'success') {
        const toast = SafeDOM.div({
            className: `fixed bottom-4 right-4 px-4 py-2 rounded-lg text-sm font-medium z-[60] 
                       ${type === 'error' ? 'bg-red-500 text-white' : 'bg-sky-500 text-white'}
                       animate-in slide-in-from-bottom-4`
        }, message)

        document.body.appendChild(toast)
        setTimeout(() => toast.remove(), 2000)
    }
}
