/**
 * SavedPlaylistActions.js
 * 
 * Extracted from SavedPlaylistsView.js (Sprint 19 Track A)
 * Renders action buttons for playlist batches and series.
 */
import { SafeDOM } from '../../utils/SafeDOM.js';
import { getIcon } from '../Icons.js';

export class SavedPlaylistActions {
    /**
     * Render batch action buttons (Edit, Export, Delete)
     * @param {Object} options
     * @param {string} options.seriesId
     * @param {string} options.batchName
     * @param {Date} options.createdAt
     * @param {number} options.playlistCount
     * @param {Function} options.onEdit
     * @param {Function} [options.onExport] - export all the playlists of the batch (F90)
     * @param {Function} options.onDelete
     * @returns {HTMLElement}
     */
    static renderBatchActions({ seriesId, batchName, createdAt, playlistCount, onEdit, onExport, onDelete }) {
        return SafeDOM.div({ className: 'batch-card-buttons flex items-center gap-2' }, [
            SafeDOM.button({
                className: 'btn btn-secondary btn-sm flex items-center gap-2 hover:bg-white/20 transition-all shadow-md',
                title: 'Edit this batch',
                'aria-label': `Edit batch ${batchName}`,
                onClick: (e) => {
                    e.stopPropagation();
                    if (onEdit) onEdit(seriesId, batchName, createdAt);
                }
            }, [SafeDOM.fromHTML(getIcon('Edit', 'w-4 h-4')), ' Edit Batch']),
            SafeDOM.button({
                className: 'btn btn-secondary btn-sm flex items-center gap-2 hover:bg-white/20 transition-all shadow-md',
                title: 'Export all the playlists of this batch',
                'aria-label': `Export batch ${batchName}`,
                onClick: (e) => {
                    e.stopPropagation();
                    if (onExport) onExport();
                }
            }, [SafeDOM.fromHTML(getIcon('Share', 'w-4 h-4')), ' Export']),
            SafeDOM.button({
                className: 'btn btn-ghost btn-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors',
                title: 'Delete entire batch',
                'aria-label': `Delete batch ${batchName}`,
                onClick: (e) => {
                    e.stopPropagation();
                    if (onDelete) onDelete(seriesId, batchName, playlistCount);
                }
            }, [
                SafeDOM.fromHTML(getIcon('Trash', 'w-4 h-4')),
                // the phone names the action beside the icon (no hover there to explain it)
                SafeDOM.span({ className: 'md:hidden' }, 'Delete')
            ])
        ]);
    }

    /**
     * Render series header action buttons (Add, Open Series, Delete All)
     * @param {Object} options
     * @param {Object} options.series
     * @param {Function} options.onAddPlaylists
     * @param {Function} options.onOpenSeries
     * @param {Function} options.onDeleteAll
     * @returns {HTMLElement}
     */
    static renderSeriesActions({ series, onAddPlaylists, onOpenSeries, onDeleteAll }) {
        return SafeDOM.div({ className: 'flex gap-2' }, [
            SafeDOM.button({
                className: 'btn btn-primary btn-sm flex items-center gap-1 group-hover:bg-accent-primary group-hover:text-white transition-colors',
                onClick: () => onAddPlaylists && onAddPlaylists()
            }, [
                SafeDOM.fromHTML(getIcon('Plus', 'w-4 h-4')),
                ' Add Playlists'
            ]),
            SafeDOM.button({
                className: 'btn btn-secondary btn-sm group-hover:bg-white/10 transition-colors',
                onClick: () => onOpenSeries && onOpenSeries(series.id)
            }, [
                'Open Albums Series ',
                SafeDOM.fromHTML(getIcon('ArrowLeft', 'w-4 h-4 rotate-180 ml-1'))
            ]),
            SafeDOM.button({
                className: 'btn btn-ghost btn-sm text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-colors',
                title: 'Delete all playlists in this series',
                onClick: () => onDeleteAll && onDeleteAll(series.id, series.name)
            }, SafeDOM.fromHTML(getIcon('Trash', 'w-4 h-4')))
        ]);
    }

    /**
     * Render playlist row action button (View Details)
     * @param {Object} options
     * @param {string} options.seriesId
     * @param {string} options.playlistId
     * @param {Function} options.onViewDetails
     * @returns {HTMLElement}
     */
    static renderRowActions({ seriesId, playlistId, onViewDetails }) {
        return SafeDOM.div({
            className: 'playlist-row-buttons flex items-center [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-200'
        }, [
            SafeDOM.button({
                className: 'btn btn-ghost btn-sm text-muted hover:text-white',
                title: 'View Details',
                onClick: (e) => {
                    e.stopPropagation();
                    if (onViewDetails) onViewDetails(seriesId, playlistId);
                }
            }, SafeDOM.fromHTML(getIcon('Eye', 'w-4 h-4')))
        ]);
    }
}
