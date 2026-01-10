/**
 * SavedPlaylistCard.js
 * 
 * Extracted from SavedPlaylistsView.js (Sprint 19 Track A)
 * Renders a single batch card with collapse/expand functionality.
 */
import { SafeDOM } from '../../utils/SafeDOM.js';
import { getIcon } from '../Icons.js';
import { AlbumCascade } from '../common/AlbumCascade.js';
import { SavedPlaylistRow } from './SavedPlaylistRow.js';

export class SavedPlaylistCard {
    constructor(options) {
        this.batch = options.batch;
        this.seriesId = options.seriesId;
        this.thumbnails = options.thumbnails || [];
        this.onEdit = options.onEdit;
        this.onDelete = options.onDelete;
        this.onOpenPlaylistModal = options.onOpenPlaylistModal;
        this.formatDuration = options.formatDuration || (() => '0m');
        this.countUniqueAlbums = options.countUniqueAlbums || (() => 0);
    }

    render() {
        const { playlists, name: batchName, savedAt: createdAt } = this.batch;

        const playlistCount = playlists.length;
        const totalTracks = playlists.reduce((sum, p) => sum + (p.tracks?.length || 0), 0);
        const albumCount = this.countUniqueAlbums(playlists);
        const dateStr = new Date(createdAt).toLocaleDateString();

        const allTracks = playlists.map(p => p.tracks || []).flat();
        const totalDuration = this.formatDuration(allTracks);

        // Cascade
        const cascadeNode = AlbumCascade.renderNode(this.thumbnails);

        // Info Block
        const infoBlock = SafeDOM.div({}, [
            SafeDOM.h3({ className: 'font-bold text-xl text-white tracking-tight' }, batchName),
            SafeDOM.div({ className: 'flex items-center gap-3 text-sm text-muted mt-1' }, [
                SafeDOM.span({ className: 'flex items-center gap-1' }, [SafeDOM.fromHTML(getIcon('List', 'w-3 h-3')), ` ${playlistCount} playlists`]),
                SafeDOM.span({ className: 'flex items-center gap-1' }, [SafeDOM.fromHTML(getIcon('Music', 'w-3 h-3')), ` ${totalTracks} tracks`]),
                SafeDOM.span({ className: 'flex items-center gap-1' }, [SafeDOM.fromHTML(getIcon('Disc', 'w-3 h-3')), ` ${albumCount} albums`]),
                SafeDOM.span({ className: 'flex items-center gap-1 font-mono' }, [SafeDOM.fromHTML(getIcon('Clock', 'w-3 h-3')), ` ${totalDuration}`]),
                SafeDOM.span({ className: 'flex items-center gap-1' }, [SafeDOM.fromHTML(getIcon('Calendar', 'w-3 h-3')), ` ${dateStr}`])
            ])
        ]);

        // Buttons
        const buttons = SafeDOM.div({ className: 'batch-card-buttons flex items-center gap-2' }, [
            SafeDOM.button({
                className: 'btn btn-secondary btn-sm flex items-center gap-2 hover:bg-white/20 transition-all shadow-md',
                title: 'Edit this batch',
                onClick: (e) => {
                    e.stopPropagation();
                    if (this.onEdit) this.onEdit(this.seriesId, batchName, createdAt);
                }
            }, [SafeDOM.fromHTML(getIcon('Edit', 'w-4 h-4')), ' Edit Batch']),
            SafeDOM.button({
                className: 'btn btn-ghost btn-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors',
                title: 'Delete entire batch',
                onClick: (e) => {
                    e.stopPropagation();
                    if (this.onDelete) this.onDelete(this.seriesId, batchName, playlistCount);
                }
            }, SafeDOM.fromHTML(getIcon('Trash', 'w-4 h-4')))
        ]);

        // Collapse logic
        const playlistsContainer = SafeDOM.div({ className: 'batch-playlists divide-y divide-white/5 bg-black/20 hidden' });
        const iconSpan = SafeDOM.span({ className: 'collapse-icon text-muted transition-transform duration-200' });
        iconSpan.appendChild(SafeDOM.fromHTML(getIcon('ChevronRight', 'w-5 h-5')));

        const card = SafeDOM.div({
            className: 'batch-group-card bg-surface rounded-xl border border-white/10 overflow-hidden mb-6 transition-all duration-300 hover:border-brand-orange/30',
            dataset: { seriesId: this.seriesId, batchName, collapsed: 'true' }
        });

        const toggleCollapse = () => {
            const isHidden = playlistsContainer.classList.contains('hidden');
            if (isHidden) {
                playlistsContainer.classList.remove('hidden');
                iconSpan.style.transform = 'rotate(90deg)';
                card.dataset.collapsed = 'false';
            } else {
                playlistsContainer.classList.add('hidden');
                iconSpan.style.transform = 'rotate(0deg)';
                card.dataset.collapsed = 'true';
            }
        };

        const batchHeader = SafeDOM.div({
            className: 'batch-header p-5 bg-gradient-to-r from-white/5 to-transparent border-b border-white/10 cursor-pointer',
            onClick: toggleCollapse
        }, [
            SafeDOM.div({ className: 'flex items-center justify-between' }, [
                SafeDOM.div({ className: 'flex items-center gap-4' }, [
                    iconSpan,
                    cascadeNode,
                    infoBlock
                ]),
                buttons
            ])
        ]);

        // Playlists Rows
        if (playlists.length > 0) {
            playlists.forEach((p, idx) => {
                const row = new SavedPlaylistRow({
                    playlist: p,
                    seriesId: this.seriesId,
                    index: idx,
                    formatDuration: this.formatDuration,
                    onOpenModal: this.onOpenPlaylistModal
                });
                playlistsContainer.appendChild(row.render());
            });
        } else {
            playlistsContainer.appendChild(SafeDOM.div({
                className: 'p-6 text-center text-muted italic'
            }, 'No playlists in this batch'));
        }

        card.appendChild(batchHeader);
        card.appendChild(playlistsContainer);

        return card;
    }
}
