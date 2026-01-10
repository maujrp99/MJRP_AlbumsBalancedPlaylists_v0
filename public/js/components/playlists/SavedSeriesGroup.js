/**
 * SavedSeriesGroup.js
 * 
 * Renders a group of playlist batches belonging to a specific Series.
 * Includes the header with actions (Add, Open Series, Delete All) and the list of batches.
 */
import { SafeDOM } from '../../utils/SafeDOM.js';
import { getIcon } from '../Icons.js';
import { SavedPlaylistCard } from './SavedPlaylistCard.js';

export class SavedSeriesGroup {
    constructor({ group, handlers, helpers }) {
        this.group = group;
        this.handlers = handlers; // { onNavigate, onOpenSeries, onDeleteAll, onEditBatch, onDeleteBatch, onOpenPlaylist }
        this.helpers = helpers;   // { getThumbnails, formatDuration, countUniqueAlbums }
    }

    render() {
        if (!this.group.playlists || this.group.playlists.length === 0) return null;

        const seriesId = this.group.series.id;
        const seriesName = this.group.series.name;

        // Header Structure
        const headerTitle = SafeDOM.div({ className: 'mb-4 md:mb-0' }, [
            SafeDOM.h2({ className: 'text-2xl font-bold text-accent-primary flex items-center gap-2' }, [
                SafeDOM.fromHTML(getIcon('Layers', 'w-6 h-6')),
                SafeDOM.text(' ' + seriesName)
            ]),
            SafeDOM.span({ className: 'text-xs text-muted font-mono bg-black/30 px-2 py-1 rounded ml-8' },
                `ID: ${seriesId.slice(0, 8)}...`
            )
        ]);

        const buttons = SafeDOM.div({ className: 'flex gap-2' }, [
            SafeDOM.button({
                className: 'btn btn-primary btn-sm flex items-center gap-1 group-hover:bg-accent-primary group-hover:text-white transition-colors',
                onClick: () => this.handlers.onNavigate()
            }, [
                SafeDOM.fromHTML(getIcon('Plus', 'w-4 h-4')),
                ' Add Playlists'
            ]),
            SafeDOM.button({
                className: 'btn btn-secondary btn-sm group-hover:bg-white/10 transition-colors',
                onClick: () => this.handlers.onOpenSeries(seriesId)
            }, [
                'Open Albums Series ',
                SafeDOM.fromHTML(getIcon('ArrowLeft', 'w-4 h-4 rotate-180 ml-1'))
            ]),
            SafeDOM.button({
                className: 'btn btn-ghost btn-sm text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-colors',
                title: 'Delete all playlists in this series',
                onClick: () => this.handlers.onDeleteAll(seriesId, seriesName)
            }, SafeDOM.fromHTML(getIcon('Trash', 'w-4 h-4')))
        ]);

        const header = SafeDOM.div({
            className: 'group-header flex flex-col md:flex-row justify-between items-start md:items-center mb-6 border-b border-white/10 pb-4'
        }, [headerTitle, buttons]);

        // Batches List
        const batchesContainer = SafeDOM.fragment(
            this.group.batches.map(batch => this.renderBatch(batch, seriesId))
        );

        return SafeDOM.div({ className: 'series-group glass-panel p-6 rounded-xl animate-scale-in' }, [
            header,
            batchesContainer
        ]);
    }

    renderBatch(batch, seriesId) {
        const thumbnails = this.helpers.getThumbnails(seriesId);

        const card = new SavedPlaylistCard({
            batch,
            seriesId,
            thumbnails,
            onEdit: this.handlers.onEditBatch,
            onDelete: this.handlers.onDeleteBatch,
            onOpenPlaylistModal: this.handlers.onOpenPlaylist,
            formatDuration: this.helpers.formatDuration,
            countUniqueAlbums: this.helpers.countUniqueAlbums
        });

        return card.render();
    }
}
