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
import { formatDuration } from '../../utils/duration.js'
import { SafeDOM } from '../../utils/SafeDOM.js'
import { getIcon } from '../Icons.js'
import { isPhone, onPhoneChange } from '../../utils/isPhone.js'
import { confirmDiscard, renderPhoneRow, renderPhoneWindow, RANK_PHONE_TEXT } from './rankWindowPhone.js'
import { ConfirmModal } from '../ui/modals/ConfirmModal.js'
import { BaseModal } from '../ui/BaseModal.js'

/** How long the window's own notice stays: a plain one, and one that offers a way back. */
const TOAST_MS = 2000
const TOAST_WITH_ACTION_MS = 5000

/**
 * @typedef {Object} UserRankModalOptions
 * @property {Object} album - Album object with tracks
 * @property {Function} onSubmit - (rankings) => Promise<boolean>: saves the ranking. The modal only
 *   shows and reports; who saves and what the screen does next belongs to whoever opened it.
 * @property {Function} onSave - Callback after successful save
 * @property {Function} onClose - Callback when modal closes
 */

export class UserRankModal {
    /**
     * @param {UserRankModalOptions} options
     */
    constructor({ album, onSubmit, onSave, onClose }) {
        this.album = album
        this.onSubmit = onSubmit
        this.onSave = onSave
        this.onClose = onClose

        // Clone tracks and sort by original position
        this.tracks = [...(album.tracks || [])].sort((a, b) =>
            (a.position || 0) - (b.position || 0)
        )

        // The order on screen (changed by drag-and-drop). It starts from the ranking the album
        // already has, so reopening shows what was saved (UAT-187); tracks without a rank come
        // after, in the order of the record. Reset is what goes back to the order of the record.
        const isRanked = (track) => track.userRank !== null && track.userRank !== undefined
        this.rankedOrder = [
            ...this.tracks.filter(isRanked).sort((a, b) => a.userRank - b.userRank),
            ...this.tracks.filter(track => !isRanked(track))
        ]

        // The order as it was when the window opened (or last saved): what «changed» is measured against
        this.savedOrder = this._orderKey()

        this.modalElement = null
        this.sortableInstance = null
        // The phone (F76): the track picked to move without dragging, and the «Move to…» sheet
        this.pickedId = null
        this._sheet = null
    }

    /**
     * Check if device is mobile
     * @returns {boolean}
     */
    get isMobile() {
        return window.innerWidth <= 899
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
            if (e.key === 'Escape' && !this._sheet && !this._asking) this.requestClose()
        }
        document.addEventListener('keydown', this._escapeHandler)
        // The window is drawn for the phone or for the computer: drawn again when that changes
        this._stopPhone = onPhoneChange(() => this._redraw())
    }

    /** Draws the window again, in the same order (the screen became, or stopped being, a phone). */
    _redraw() {
        if (!this.modalElement) return
        this.sortableInstance?.destroy()
        this.sortableInstance = null
        this._sheet?.close()
        const fresh = this._render()
        this.modalElement.replaceWith(fresh)
        this.modalElement = fresh
        requestAnimationFrame(() => this._initDragDrop())
    }

    /**
     * Moves a track of the order on screen from one place to another (0-based; a place past the
     * ends is the end). The phone's buttons move tracks with it; dragging changes the order itself.
     * @returns {boolean} whether the order changed
     */
    moveTrack(from, to) {
        const last = this.rankedOrder.length - 1
        const target = Math.max(0, Math.min(last, to))
        if (from < 0 || from > last || target === from) return false
        const [track] = this.rankedOrder.splice(from, 1)
        this.rankedOrder.splice(target, 0, track)
        this._updateTrackList()
        return true
    }

    /** The order on screen, as one string of track ids (to compare with the order saved). */
    _orderKey() {
        return this.rankedOrder.map(track => track.id || track.title).join('\u0000')
    }

    /** Whether the order on screen differs from the one the window opened with (or last saved). */
    hasUnsavedChanges() {
        return this._orderKey() !== this.savedOrder
    }

    /**
     * Back and Escape. On the phone, an order changed and not saved is not thrown away in silence:
     * a sheet asks first (F76, recheck N6). On the computer, and with nothing changed, it closes.
     */
    requestClose() {
        if (this._asking) return
        if (!this.hasUnsavedChanges()) return this.close()
        if (this.phone) return confirmDiscard(this)
        this._askDiscard()
    }

    /**
     * The computer's question (UAT-224): the app's confirmation window (the component, not the
     * dialog service: this window only shows and reports), with the phone's words.
     * One question at a time; «Keep editing» leaves the window and its order as they were.
     */
    _askDiscard() {
        this._asking = true
        const answer = (discard) => {
            BaseModal.unmount(question)
            document.removeEventListener('keydown', onKey)
            this._asking = false
            if (discard) this.close()
        }
        // Escape is «Keep editing», as in every confirmation window of the app
        const onKey = (e) => { if (e.key === 'Escape') answer(false) }
        const question = ConfirmModal.render({
            title: RANK_PHONE_TEXT.discardTitle,
            message: RANK_PHONE_TEXT.discardNote,
            confirmText: RANK_PHONE_TEXT.discard,
            cancelText: RANK_PHONE_TEXT.keepEditing,
            variant: 'danger',
            onConfirm: () => answer(true),
            onCancel: () => answer(false)
        })
        BaseModal.mount(question)
        document.addEventListener('keydown', onKey)
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
        this._stopPhone?.()
        this._sheet?.close()

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

        let success = false
        try {
            success = this.onSubmit ? await this.onSubmit(rankings) : false
        } catch (error) {
            console.error('[UserRankModal] saving the ranking failed:', error)
        }

        if (success) {
            console.log('[UserRankModal] Ranking saved successfully')
            this.savedOrder = this._orderKey()

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
        this.phone = isPhone()
        if (this.phone) return renderPhoneWindow(this)

        const overlay = SafeDOM.div({
            // rank-window: the name the phone's stylesheet and scroll hold know this window by (F76)
            className: 'rank-window fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm',
            onClick: (e) => {
                if (e.target === overlay) this.requestClose()
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
                onClick: () => this.requestClose()
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
                `${this.album.title} - ${this.album.artist}`) // a text node: nothing to escape
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
        if (this.phone) return renderPhoneRow(this, track, index)
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
                'bg-sky-500/10 text-sky-500 text-sm font-bold border border-sky-500/20',
            dataset: { role: 'rank-number' }
        }, String(index + 1))

        // Track info
        const trackInfo = SafeDOM.div({ className: 'flex-1 min-w-0' }, [
            SafeDOM.div({ className: 'font-medium text-white truncate text-sm' },
                track.title),
            SafeDOM.div({ className: 'text-xs text-white/40 truncate' },
                track.artist || this.album.artist)
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
        const duration = formatDuration(track.duration)
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
            // The whole item on the computer; on the phone only the handle, so a finger elsewhere scrolls
            handle: this.phone ? '.rank-row__handle' : '.group',
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
            const rankEl = item.querySelector('[data-role="rank-number"]')
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
    _showToast(message, type = 'success', action = null) {
        // rank-toast: the phone puts it below the top of the window (css/mobile/ranking.css)
        const toast = SafeDOM.div({
            className: `rank-toast fixed bottom-4 right-4 px-4 py-2 rounded-lg text-sm font-medium z-[60] 
                       ${type === 'error' ? 'bg-red-500 text-white' : 'bg-sky-500 text-white'}
                       animate-in slide-in-from-bottom-4`,
            role: 'status'
        }, message)
        if (action) {
            toast.appendChild(SafeDOM.button({
                className: 'rank-toast__action',
                onClick: () => {
                    toast.remove()
                    action.run()
                }
            }, action.label))
        }

        document.body.appendChild(toast)
        setTimeout(() => toast.remove(), action ? TOAST_WITH_ACTION_MS : TOAST_MS)
    }
}
