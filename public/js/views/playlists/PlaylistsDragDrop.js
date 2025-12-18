/**
 * PlaylistsDragDrop
 * SortableJS drag-and-drop configuration for playlists
 * Part of Sprint 10 refactoring (PlaylistsView modularization)
 */

import Sortable from 'sortablejs'
import { playlistsStore } from '../../stores/playlists.js'

/**
 * Initialize drag-and-drop for playlist containers
 * @param {Object} view - View instance with container property
 * @returns {Array} Array of Sortable instances for cleanup
 */
export function setupDragAndDrop(view) {
    // Clean up old instances
    if (view.sortables) {
        view.sortables.forEach(s => s.destroy())
    }
    const sortables = []

    // Initialize Sortable on all playlist containers
    const containers = view.container.querySelectorAll('.playlist-tracks')

    containers.forEach(container => {
        const sortable = new Sortable(container, {
            group: 'shared-playlists', // Allow dragging between lists
            animation: 150,
            delay: 100, // Slight delay to prevent accidental drags on touch
            delayOnTouchOnly: true,
            touchStartThreshold: 3, // Tolerance for touch
            ghostClass: 'bg-white/5',
            dragClass: 'opacity-100',
            handle: '.track-item', // Make the whole item draggable

            // Haptic feedback on drag start
            onStart: () => {
                view.isDragging = true // Prevent re-render during drag
                if ('vibrate' in navigator) {
                    navigator.vibrate(50) // Short pulse when picking up
                }
            },

            onEnd: (evt) => {
                // Haptic feedback on drop
                if ('vibrate' in navigator) {
                    navigator.vibrate([20, 30, 20]) // Double pulse pattern when dropping
                }

                const { from, to, oldIndex, newIndex } = evt

                // If dropped outside or no change
                if (!to || (from === to && oldIndex === newIndex)) {
                    view.isDragging = false
                    return
                }

                const fromPlaylistIndex = parseInt(from.dataset.playlistIndex)
                const toPlaylistIndex = parseInt(to.dataset.playlistIndex)

                if (from === to) {
                    // Reorder within same playlist
                    console.log(`[Sortable] Reorder in playlist ${fromPlaylistIndex}: ${oldIndex} -> ${newIndex}`)
                    playlistsStore.reorderTrack(fromPlaylistIndex, oldIndex, newIndex)
                } else {
                    // Move to different playlist
                    console.log(`[Sortable] Move ${fromPlaylistIndex}->${toPlaylistIndex}: ${oldIndex} -> ${newIndex}`)
                    playlistsStore.moveTrack(fromPlaylistIndex, toPlaylistIndex, oldIndex, newIndex)
                }

                // Re-enable re-render AFTER store update is processed
                requestAnimationFrame(() => {
                    view.isDragging = false
                    // Trigger deferred update to refresh track counts/durations
                    view.update()
                })
            }
        })
        sortables.push(sortable)
    })

    return sortables
}
