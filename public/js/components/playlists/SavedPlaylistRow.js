/**
 * SavedPlaylistRow.js
 *
 * Extracted from SavedPlaylistsView.js (Sprint 19 Track A)
 * One playlist of a batch. Closed, it shows its name, how many tracks and how long; its tracks
 * are drawn the first time the row is opened, not before (F61).
 */
import { SafeDOM } from '../../utils/SafeDOM.js';
import { getIcon } from '../Icons.js';
import { TrackRow } from '../ui/TrackRow.js';
import { batchTotals, formatMinutes } from '../../models/savedPlaylists.js';

export class SavedPlaylistRow {
    constructor(options) {
        this.playlist = options.playlist;
        this.seriesId = options.seriesId;
        this.index = options.index;
        this.onOpenModal = options.onOpenModal;
    }

    render() {
        const { playlist, seriesId, index } = this;
        const totals = batchTotals({ playlists: [playlist] });

        const icon = SafeDOM.div({ className: 'w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-muted group-hover:text-brand-orange group-hover:bg-brand-orange/10 transition-colors' });
        icon.appendChild(SafeDOM.fromHTML(getIcon('Disc', 'w-4 h-4')));

        const info = SafeDOM.div({}, [
            SafeDOM.div({ className: 'font-medium text-white group-hover:text-brand-orange transition-colors' }, playlist.name),
            SafeDOM.div({ className: 'text-xs text-muted font-mono mt-0.5' }, `${totals.tracks} tracks • ${formatMinutes(totals.durationSeconds)}`)
        ]);

        const expandIcon = SafeDOM.span({ className: 'expand-icon text-muted transition-transform duration-200' });
        expandIcon.appendChild(SafeDOM.fromHTML(getIcon('ChevronRight', 'w-4 h-4')));

        const leftSide = SafeDOM.div({ className: 'flex items-center gap-4' }, [
            expandIcon,
            icon,
            info
        ]);

        const viewBtn = SafeDOM.button({
            className: 'btn btn-ghost btn-sm text-muted hover:text-white',
            title: 'View Details',
            onClick: (e) => {
                e.stopPropagation();
                if (this.onOpenModal) this.onOpenModal(seriesId, playlist.id);
            }
        }, SafeDOM.fromHTML(getIcon('Eye', 'w-4 h-4')));

        const buttons = SafeDOM.div({ className: 'playlist-row-buttons flex items-center [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-200' }, [viewBtn]);

        const tracksList = SafeDOM.div({ className: 'playlist-tracks-list hidden bg-black/30 pl-16 pr-4 py-2' });

        const toggleTracks = () => {
            const opening = tracksList.classList.contains('hidden');
            if (opening) this.fillTracks(tracksList);
            tracksList.classList.toggle('hidden', !opening);
            expandIcon.style.transform = opening ? 'rotate(90deg)' : 'rotate(0deg)';
        };

        const row = SafeDOM.div({
            className: 'playlist-row p-4 flex items-center justify-between hover:bg-white/5 transition-colors group cursor-pointer',
            onClick: toggleTracks,
            dataset: { playlistId: playlist.id }
        }, [leftSide, buttons]);

        return SafeDOM.div({
            className: 'playlist-row-wrapper',
            dataset: { playlistIndex: index }
        }, [row, tracksList]);
    }

    /** Draw the tracks of the playlist, once: the first time the row is opened. */
    fillTracks(container) {
        if (container.dataset.filled === 'true') return;
        container.dataset.filled = 'true';

        const tracks = this.playlist.tracks || [];
        if (tracks.length === 0) {
            container.appendChild(SafeDOM.div({ className: 'text-sm text-muted italic py-2' }, 'No tracks'));
            return;
        }
        tracks.forEach((track, i) => {
            container.appendChild(TrackRow.render({
                track,
                index: i + 1,
                variant: 'detailed',
                playlistIndex: -1,
                trackIndex: i
            }));
        });
    }
}
