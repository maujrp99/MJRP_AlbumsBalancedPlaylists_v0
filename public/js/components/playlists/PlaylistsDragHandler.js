import Sortable from 'sortablejs'
import { playlistsStore } from '../../stores/playlists.js'

/**
 * PlaylistsDragHandler
 * 
 * Manages Drag and Drop interactions for PlaylistsView.
 * Wraps SortableJS logic to keep View clean.
 */
export class PlaylistsDragHandler {
    constructor(viewContext) {
        this.view = viewContext
        this.sortables = []
        this.isDragging = false
    }

    /**
     * Initialize Sortable on all playlist containers
     * @param {HTMLElement} container - The main view container
     */
    setup(container) {
        // Clean up old instances
        this.destroy()

        if (!container) return

        const trackLists = container.querySelectorAll('.playlist-tracks')

        trackLists.forEach(list => {
            const sortable = new Sortable(list, {
                group: 'shared-tracks', // Allow dragging between playlists
                animation: 150,
                ghostClass: 'bg-white/5',
                dragClass: 'opacity-100',
                handle: '.track-row', // Updated to match TrackRow component (Sprint 17.75)
                delay: 100, // Slight delay to prevent accidental drags on touch
                delayOnTouchOnly: true,
                touchStartThreshold: 3,

                onStart: () => {
                    this.isDragging = true
                    if (this.view) this.view.isDragging = true
                    document.body.classList.add('grabbing')
                },

                onEnd: (evt) => {
                    this.isDragging = false
                    if (this.view) this.view.isDragging = false
                    document.body.classList.remove('grabbing')

                    const fromPlaylistIndex = parseInt(evt.from.closest('[data-playlist-index]')?.dataset?.playlistIndex)
                    const toPlaylistIndex = parseInt(evt.to.closest('[data-playlist-index]')?.dataset?.playlistIndex)
                    const oldIndex = evt.oldIndex
                    const newIndex = evt.newIndex

                    // Validate indices
                    if (isNaN(fromPlaylistIndex) || isNaN(toPlaylistIndex)) {
                        console.warn('[DragHandler] Invalid playlist indices', { fromPlaylistIndex, toPlaylistIndex })
                        return
                    }

                    // Perform move via store
                    // Note: Store update will trigger view.update(), re-rendering the grid
                    playlistsStore.moveTrack(fromPlaylistIndex, toPlaylistIndex, oldIndex, newIndex)
                }
            })

            this.sortables.push(sortable)
        })
    }

    destroy() {
        this.sortables.forEach(s => s.destroy())
        this.sortables = []
        this.isDragging = false
    }
}
