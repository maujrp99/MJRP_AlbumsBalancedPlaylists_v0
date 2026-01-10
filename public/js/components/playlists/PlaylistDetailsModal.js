/**
 * PlaylistDetailsModal.js
 * 
 * A standalone component for displaying the details of a playlist (tracks, duration, etc.)
 * in a modal dialog. Extracted from SavedPlaylistsView.
 */
import { BaseModal } from '../ui/BaseModal.js';
import { TrackRow } from '../ui/TrackRow.js';
import { SafeDOM } from '../../utils/SafeDOM.js';

export class PlaylistDetailsModal {
    /**
     * Open the playlist details modal
     * @param {Object} playlist - The playlist object containing name, tracks, etc.
     */
    static open(playlist) {
        if (!playlist) return;

        const trackCount = playlist.tracks?.length || 0;
        const totalSeconds = (playlist.tracks || []).reduce((acc, t) => acc + (t.duration || 0), 0);
        const durationStr = TrackRow.formatDuration(totalSeconds);

        // SafeDOM Content Construction
        const header = SafeDOM.div({ className: 'mb-4 text-xs text-muted flex gap-3 border-b border-white/10 pb-4' }, [
            SafeDOM.span({}, [SafeDOM.span({ className: 'text-white font-bold' }, trackCount), ' tracks']),
            SafeDOM.span({}, [SafeDOM.span({ className: 'text-white font-bold' }, durationStr), ' duration'])
        ]);

        const listContainer = SafeDOM.div({ className: 'space-y-1' });

        // Append tracks
        const tracks = playlist.tracks || [];
        tracks.forEach((t, i) => {
            const row = TrackRow.render({
                track: t,
                index: i + 1,
                variant: 'compact',
                actions: []
            });
            listContainer.appendChild(row);
        });

        const content = SafeDOM.div({}, [header, listContainer]);

        // Footer
        const closeModal = () => {
            BaseModal.unmount('playlist-modal');
        };

        const manualFooter = SafeDOM.div({ className: 'flex justify-end' }, [
            SafeDOM.button({
                className: 'btn btn-secondary',
                onClick: closeModal
            }, 'Close')
        ]);

        const modal = BaseModal.render({
            id: 'playlist-modal',
            title: playlist.name,
            content: content,
            footer: manualFooter,
            size: 'lg',
            onClose: closeModal
        });

        BaseModal.mount(modal);
    }
}
