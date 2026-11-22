/**
 * SavedPlaylistCard.js
 *
 * Extracted from SavedPlaylistsView.js (Sprint 19 Track A)
 * One batch on the saved playlists list. Closed, it shows the totals of the batch; its playlists
 * are drawn the first time the card is opened, not before (F61: nothing the list does not show
 * is built up front).
 */
import { SafeDOM } from '../../utils/SafeDOM.js';
import { getIcon } from '../Icons.js';
import { AlbumCascade } from '../common/AlbumCascade.js';
import { SavedPlaylistRow } from './SavedPlaylistRow.js';
import { SavedPlaylistActions } from './SavedPlaylistActions.js';
import { batchTotals, formatMinutes, toMillis } from '../../models/savedPlaylists.js';

export class SavedPlaylistCard {
    constructor(options) {
        this.batch = options.batch;
        this.seriesId = options.seriesId;
        this.thumbnails = options.thumbnails || [];
        this.onEdit = options.onEdit;
        this.onDelete = options.onDelete;
        this.onOpenPlaylistModal = options.onOpenPlaylistModal;
        this.onExportBatch = options.onExportBatch; // (batch): export all its playlists (F90)
        this.onExportPlaylist = options.onExportPlaylist; // (batch, playlist, index): export one (F90)
    }

    render() {
        const { name: batchName, savedAt: createdAt } = this.batch;
        const totals = batchTotals(this.batch);

        const buttons = SavedPlaylistActions.renderBatchActions({
            seriesId: this.seriesId,
            batchName,
            createdAt,
            playlistCount: totals.playlists,
            onEdit: this.onEdit,
            onExport: () => this.onExportBatch?.(this.batch),
            onDelete: this.onDelete
        });

        const playlistsContainer = SafeDOM.div({ className: 'batch-playlists divide-y divide-white/5 bg-black/20 hidden' });
        const iconSpan = SafeDOM.span({ className: 'collapse-icon text-muted transition-transform duration-200' });
        iconSpan.appendChild(SafeDOM.fromHTML(getIcon('ChevronRight', 'w-5 h-5')));

        const card = SafeDOM.div({
            className: 'batch-group-card bg-surface rounded-xl border border-white/10 overflow-hidden mb-6 transition-all duration-300 hover:border-brand-orange/30',
            dataset: { seriesId: this.seriesId, batchName, collapsed: 'true' }
        });

        const toggleCollapse = () => {
            const opening = playlistsContainer.classList.contains('hidden');
            if (opening) this.fillPlaylists(playlistsContainer);
            playlistsContainer.classList.toggle('hidden', !opening);
            iconSpan.style.transform = opening ? 'rotate(90deg)' : 'rotate(0deg)';
            card.dataset.collapsed = opening ? 'false' : 'true';
        };

        const batchHeader = SafeDOM.div({
            className: 'batch-header p-5 bg-gradient-to-r from-white/5 to-transparent border-b border-white/10 cursor-pointer',
            onClick: toggleCollapse
        }, [
            SafeDOM.div({ className: 'flex items-center justify-between' }, [
                SafeDOM.div({ className: 'flex items-center gap-4' }, [
                    iconSpan,
                    AlbumCascade.renderNode(this.thumbnails),
                    this.renderInfo(batchName, totals, createdAt)
                ]),
                buttons
            ])
        ]);

        card.appendChild(batchHeader);
        card.appendChild(playlistsContainer);

        return card;
    }

    renderInfo(batchName, totals, createdAt) {
        const dateStr = createdAt ? new Date(toMillis(createdAt)).toLocaleDateString() : '';
        const fact = (icon, text, className = 'flex items-center gap-1') =>
            SafeDOM.span({ className }, [SafeDOM.fromHTML(getIcon(icon, 'w-3 h-3')), ` ${text}`]);

        return SafeDOM.div({ className: 'batch-info' }, [
            SafeDOM.h3({ className: 'font-bold text-xl text-white tracking-tight' }, batchName),
            SafeDOM.div({ className: 'flex items-center gap-3 text-sm text-muted mt-1' }, [
                fact('List', `${totals.playlists} playlists`),
                fact('Music', `${totals.tracks} tracks`),
                fact('Disc', `${totals.albums} albums`),
                fact('Clock', formatMinutes(totals.durationSeconds), 'flex items-center gap-1 font-mono'),
                fact('Calendar', dateStr)
            ])
        ]);
    }

    /** Draw the playlists of the batch, once: the first time the card is opened. */
    fillPlaylists(container) {
        if (container.dataset.filled === 'true') return;
        container.dataset.filled = 'true';

        const { playlists } = this.batch;
        if (playlists.length === 0) {
            container.appendChild(SafeDOM.div({ className: 'p-6 text-center text-muted italic' }, 'No playlists in this batch'));
            return;
        }
        playlists.forEach((playlist, index) => {
            const row = new SavedPlaylistRow({
                playlist,
                seriesId: this.seriesId,
                index,
                onOpenModal: this.onOpenPlaylistModal,
                onExport: (item, at) => this.onExportPlaylist?.(this.batch, item, at)
            });
            container.appendChild(row.render());
        });
    }
}
