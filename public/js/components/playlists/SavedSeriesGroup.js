/**
 * SavedSeriesGroup.js
 *
 * One series on the saved playlists list: its header with the actions (Add, Open Series,
 * Delete All), its batches, and, when its playlists could not be read, a notice with "try again".
 * It draws the entry it is given (stores/savedPlaylists.js) and asks for nothing.
 */
import { SafeDOM } from '../../utils/SafeDOM.js';
import { getIcon } from '../Icons.js';
import { SavedPlaylistCard } from './SavedPlaylistCard.js';
import { SeriesPlaylistsStatus } from '../../models/savedPlaylists.js';

export class SavedSeriesGroup {
    /**
     * @param {Object} options
     * @param {Object} options.group - { series, status, batches, thumbnails, error }
     * @param {Object} options.handlers - { onNavigate, onOpenSeries, onDeleteAll, onEditBatch, onDeleteBatch, onOpenPlaylist, onRetry }
     */
    constructor({ group, handlers }) {
        this.group = group;
        this.handlers = handlers;
    }

    render() {
        const batches = this.group.batches || [];
        const failed = this.group.status === SeriesPlaylistsStatus.FAILED;
        if (batches.length === 0 && !failed) return null;

        const seriesId = this.group.series.id;

        return SafeDOM.div({
            className: 'series-group glass-panel p-6 rounded-xl animate-scale-in',
            dataset: { seriesId, status: this.group.status }
        }, [
            this.renderHeader(batches.length > 0),
            failed ? this.renderFailure(batches.length > 0) : null,
            SafeDOM.fragment(batches.map(batch => this.renderBatch(batch, seriesId)))
        ]);
    }

    renderHeader(hasPlaylists) {
        const seriesId = this.group.series.id;
        const seriesName = this.group.series.name;

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
            hasPlaylists ? SafeDOM.button({
                className: 'btn btn-ghost btn-sm text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-colors',
                title: 'Delete all playlists in this series',
                onClick: () => this.handlers.onDeleteAll(seriesId, seriesName)
            }, SafeDOM.fromHTML(getIcon('Trash', 'w-4 h-4'))) : null
        ]);

        return SafeDOM.div({
            className: 'group-header flex flex-col md:flex-row justify-between items-start md:items-center mb-6 border-b border-white/10 pb-4'
        }, [headerTitle, buttons]);
    }

    /** The playlists of this series could not be read: say so here, with a way to ask again. */
    renderFailure(showingOlder) {
        const text = showingOlder
            ? 'The playlists of this series could not be updated. What you see may be out of date.'
            : 'The playlists of this series could not be read.';
        return SafeDOM.div({ className: 'series-failed flex items-center gap-3 text-red-400 mb-4', role: 'alert' }, [
            SafeDOM.span({}, text),
            SafeDOM.button({
                className: 'btn btn-secondary btn-sm',
                onClick: () => this.handlers.onRetry(this.group.series.id)
            }, 'Try again')
        ]);
    }

    renderBatch(batch, seriesId) {
        const card = new SavedPlaylistCard({
            batch,
            seriesId,
            thumbnails: this.group.thumbnails || [],
            onEdit: this.handlers.onEditBatch,
            onDelete: this.handlers.onDeleteBatch,
            onOpenPlaylistModal: this.handlers.onOpenPlaylist
        });

        return card.render();
    }
}
