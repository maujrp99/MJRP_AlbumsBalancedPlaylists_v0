/**
 * PlaylistsDragBoard.js
 * 
 * Kanban-style board for managing Playlists.
 * Displays multiple playlists side-by-side or in a grid.
 * Allows dragging tracks between playlists.
 */
import Component from '../base/Component.js';
import SeriesDragDrop from '../series/SeriesDragDrop.js';

export default class PlaylistsDragBoard extends Component {
    /**
     * @param {Object} props
     * @param {Array} props.playlists - Array of Playlist objects
     * @param {Function} props.onTrackMove - ({ fromPlaylist, toPlaylist, trackId, newIndex }) => void
     */
    constructor(props) {
        super(props);
        this.dragInstances = [];
    }

    render() {
        const { playlists = [] } = this.props;

        if (playlists.length === 0) {
            this.container.innerHTML = `
                <div class="flex flex-col items-center justify-center h-full text-gray-500">
                    <i class="fas fa-music text-4xl mb-3"></i>
                    <p>No playlists generated yet. Try blending a series!</p>
                </div>
            `;
            return;
        }

        const columnsHTML = playlists.map(playlist => this.renderPlaylistColumn(playlist)).join('');

        this.container.innerHTML = `
            <div class="flex flex-nowrap overflow-x-auto gap-4 h-full p-4 pb-8 items-start snap-x">
                ${columnsHTML}
            </div>
        `;

        this.initDragAndDrop();
    }

    renderPlaylistColumn(playlist) {
        const tracksHTML = playlist.tracks.map((track, index) => `
            <div class="track-card bg-gray-800 p-3 rounded mb-2 cursor-grab active:cursor-grabbing hover:bg-gray-750 transition-colors border border-gray-700 shadow-sm group" 
                 data-id="${track.id}"
                 data-index="${index}">
                
                <div class="flex justify-between items-start">
                    <div>
                        <div class="font-medium text-sm text-white line-clamp-1 group-hover:text-green-400 transition-colors">${track.title}</div>
                        <div class="text-xs text-gray-400 line-clamp-1">${track.artist}</div>
                    </div>
                    <div class="text-xs font-mono text-gray-500">${this.formatDuration(track.durationMs)}</div>
                </div>

                <!-- Meta Badges -->
                <div class="flex gap-1 mt-2">
                     ${track.isDeepCut ? '<span class="px-1.5 py-0.5 bg-blue-900/50 text-blue-300 text-[10px] rounded uppercase tracking-wider">Deep Cut</span>' : ''}
                     ${track.rating ? `<span class="px-1.5 py-0.5 bg-gray-700 text-gray-300 text-[10px] rounded"><i class="fas fa-star text-yellow-500/50 mr-1"></i>${track.rating}</span>` : ''}
                </div>
            </div>
        `).join('');

        return `
            <div class="playlist-column min-w-[320px] w-[320px] bg-gray-900 rounded-xl flex flex-col max-h-full border border-gray-800 shadow-xl snap-center" data-playlist-id="${playlist.id}">
                <!-- Header -->
                <div class="p-4 border-b border-gray-800 bg-gray-900/50 sticky top-0 z-10 backdrop-blur rounded-t-xl">
                    <div class="flex justify-between items-center mb-1">
                        <h3 class="font-bold text-white truncate" title="${playlist.name}">${playlist.name}</h3>
                        <span class="text-xs text-gray-400 font-mono">${this.formatDuration(playlist.totalDurationMs)}</span>
                    </div>
                    <div class="text-xs text-gray-500 flex justify-between">
                        <span>${playlist.tracks.length} tracks</span>
                        <span>Drag to reorder</span>
                    </div>
                </div>

                <!-- Tracks Container -->
                <div class="playlist-tracks p-3 overflow-y-auto flex-1 custom-scrollbar min-h-[100px]" data-playlist-id="${playlist.id}">
                    ${tracksHTML}
                </div>
            </div>
        `;
    }

    formatDuration(ms) {
        if (!ms) return '0:00';
        const minutes = Math.floor(ms / 60000);
        const seconds = ((ms % 60000) / 1000).toFixed(0);
        return `${minutes}:${seconds.padStart(2, '0')}`;
    }

    initDragAndDrop() {
        // Find all track containers
        const containers = this.container.querySelectorAll('.playlist-tracks');

        // Cleanup old instances
        this.dragInstances.forEach(instance => instance.unmount());
        this.dragInstances = [];

        containers.forEach(container => {
            // We use SeriesDragDrop but configured for this context
            // Alternatively, we could instantiate Sortable directly here for the "Shared Group" logic which is complex

            // For now, let's assume SeriesDragDrop can handle basic lists, 
            // but for cross-list dragging, we need the Sortable 'group' option.
            // SeriesDragDrop as implemented in S12 is simple. 
            // We might need to implement the Sortable logic directly here for the "Kanban" features.

            if (window.Sortable) {
                const sortable = new Sortable(container, {
                    group: 'playlists', // Shared group for cross-column drag
                    animation: 150,
                    ghostClass: 'bg-green-500/10',
                    delay: 100,
                    delayOnTouchOnly: true,
                    onEnd: (evt) => {
                        const { item, from, to, oldIndex, newIndex } = evt;
                        if (from === to && oldIndex === newIndex) return;

                        const fromPlaylistId = from.dataset.playlistId;
                        const toPlaylistId = to.dataset.playlistId;
                        const trackId = item.dataset.id;

                        this.props.onTrackMove?.({
                            fromPlaylistId,
                            toPlaylistId,
                            trackId,
                            newIndex
                        });
                    }
                });
                // We store the sortable instance to destroy it later
                this.dragInstances.push({ unmount: () => sortable.destroy() });
            }
        });
    }

    onUnmount() {
        this.dragInstances.forEach(instance => instance.unmount());
        this.dragInstances = [];
    }
}
