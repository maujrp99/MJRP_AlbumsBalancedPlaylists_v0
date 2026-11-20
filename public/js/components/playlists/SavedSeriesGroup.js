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
import { SeriesPlaylistsStatus, batchTotals } from '../../models/savedPlaylists.js';
import { isPhone } from '../../utils/isPhone.js';

/** «3 batches · 18 playlists»: what a closed series holds, said on the phone. */
export function seriesSummary(batches = []) {
    const playlists = batches.reduce((sum, batch) => sum + batchTotals(batch).playlists, 0);
    const batchWord = batches.length === 1 ? 'batch' : 'batches';
    return `${batches.length} ${batchWord} · ${playlists} playlist${playlists === 1 ? '' : 's'}`;
}

export class SavedSeriesGroup {
    /**
     * @param {Object} options
     * @param {Object} options.group - { series, status, batches, thumbnails, error }
     * @param {Object} options.handlers - { onNavigate, onOpenSeries, onDeleteAll, onEditBatch, onDeleteBatch, onOpenPlaylist, onRetry }
     * @param {boolean} [options.open] - on the phone, whether the batches show (F76: closed by default)
     * @param {Function} [options.onToggle] - (seriesId, open) => void: the phone opened or closed the series
     */
    constructor({ group, handlers, open = false, onToggle = () => { } }) {
        this.group = group;
        this.handlers = handlers;
        this.open = open;
        this.onToggle = onToggle;
    }

    render() {
        const batches = this.group.batches || [];
        const failed = this.group.status === SeriesPlaylistsStatus.FAILED;
        if (batches.length === 0 && !failed) return null;

        const seriesId = this.group.series.id;
        // The batches, in a box of their own: a plain block on the computer; on the phone it is
        // closed until the series is opened, so the page is a list of series, not of every batch
        const batchesBox = SafeDOM.div({
            className: 'saved-series-batches',
            id: `savedSeriesBatches_${seriesId}`
        }, batches.map(batch => this.renderBatch(batch, seriesId)));
        const phone = isPhone();
        if (phone && !this.open) batchesBox.hidden = true;

        return SafeDOM.div({
            className: 'series-group glass-panel p-6 rounded-xl animate-scale-in',
            dataset: { seriesId, status: this.group.status }
        }, [
            this.renderHeader(batches.length > 0, phone ? this.renderToggle(batches, batchesBox) : null),
            failed ? this.renderFailure(batches.length > 0) : null,
            batchesBox
        ]);
    }

    /** The phone's «open the series» row: what it holds, and a chevron that turns when open. */
    renderToggle(batches, batchesBox) {
        const toggle = SafeDOM.button({
            type: 'button',
            className: 'saved-series-toggle md:hidden',
            'aria-expanded': String(!batchesBox.hidden),
            'aria-controls': batchesBox.id
        }, [
            SafeDOM.fromHTML(getIcon('ChevronRight', 'saved-series-toggle__chevron')),
            SafeDOM.span({ className: 'saved-series-toggle__text' }, seriesSummary(batches))
        ]);
        toggle.addEventListener('click', () => {
            batchesBox.hidden = !batchesBox.hidden;
            toggle.setAttribute('aria-expanded', String(!batchesBox.hidden));
            this.onToggle(this.group.series.id, !batchesBox.hidden);
        });
        return toggle;
    }

    renderHeader(hasPlaylists, phoneToggle = null) {
        const seriesId = this.group.series.id;
        const seriesName = this.group.series.name;

        const headerTitle = SafeDOM.div({ className: 'mb-4 md:mb-0' }, [
            SafeDOM.h2({ className: 'text-2xl font-bold text-accent-primary flex items-center gap-2' }, [
                SafeDOM.fromHTML(getIcon('Layers', 'w-6 h-6')),
                SafeDOM.text(' ' + seriesName)
            ]),
            SafeDOM.span({ className: 'saved-series-id text-xs text-muted font-mono bg-black/30 px-2 py-1 rounded ml-8' },
                `ID: ${seriesId.slice(0, 8)}...`
            ),
            phoneToggle
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
                'aria-label': `Delete all playlists in ${seriesName}`,
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
