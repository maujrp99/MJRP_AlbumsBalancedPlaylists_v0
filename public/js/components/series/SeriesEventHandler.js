/**
 * SeriesEventHandler.js
 * 
 * V3 Component: Event Delegation for Card Actions
 * Refactored in Sprint 16 to use DialogService and SafeDOM Modals
 */

import Component from '../base/Component.js';
import { albumsStore } from '../../stores/albums.js';
import { app, auth, db } from '../../firebase-init.js';
import { albumSeriesStore } from '../../stores/albumSeries.js';
import { showViewAlbumModal } from '../ViewAlbumModal.js';
import { toast } from '../Toast.js';
import { dialogService } from '../../services/DialogService.js';
import { InventoryAddModal } from '../InventoryAddModal.js';
import { UserRankModal } from '../ranking/UserRankModal.js';  // Sprint 20
import { AlbumCardRenderer } from '../ui/AlbumCardRenderer.js';
import { getSeriesService } from '../../services/SeriesService.js';  // FIX #154

export default class SeriesEventHandler extends Component {
    /**
     * @param {Object} config
     * @param {HTMLElement} config.container - The container to attach listeners to
     * @param {Object} config.props
     * @param {Function} config.props.onEditSeries - Callback for edit series
     * @param {Function} config.props.onDeleteSeries - Callback for delete series
     * @param {Function} config.props.onAlbumRemoved - Callback after album removal
     * @param {Function} config.props.onRefetchMetadata - Callback for refetch
     */
    constructor(config) {
        super(config);
        this.handleClick = this.handleClick.bind(this);
    }

    /**
     * No render needed - this is a behavior-only component
     */
    render() {
        // Pure event handler, no DOM output
    }

    /**
     * Attach event listeners
     */
    mount() {
        if (!this.container) return;
        this.container.addEventListener('click', this.handleClick);
    }

    /**
     * Clean up event listeners
     */
    unmount() {
        if (!this.container) return;
        this.container.removeEventListener('click', this.handleClick);
    }

    /**
     * Main event handler with delegation
     */
    async handleClick(e) {
        // 1. Check for sort header click FIRST (delegation)
        const sortHeader = e.target.closest('[data-sort]');
        if (sortHeader) {
            e.preventDefault(); // Safety
            e.stopPropagation();
            this.handleTableSort(sortHeader);
            return;
        }

        const target = e.target.closest('[data-action]');
        if (!target) return;

        e.preventDefault(); // FIX: Prevent default browser action (navigation)
        e.stopPropagation();

        const action = target.dataset.action;
        const albumId = target.dataset.albumId || target.dataset.id;
        const seriesId = target.dataset.seriesId;

        // Handle series actions first
        if (seriesId) {
            e.stopPropagation();
            await this.handleSeriesAction(action, seriesId);
            return;
        }

        // Album actions require albumId
        if (!albumId) return;

        e.stopPropagation();
        await this.handleAlbumAction(action, albumId, target);
    }

    /**
     * Handle Table Sort Delegation (Sprint 20 Fix)
     * Re-renders the static table HTML with new sort parameters
     */
    handleTableSort(header) {
        const tableRoot = header.closest('.tracks-table-root');
        // Search for both patterns to be robust across different card variants
        const albumCard = header.closest('[data-album-id], [data-id]');
        const albumId = albumCard?.dataset.albumId || albumCard?.dataset.id;

        if (!albumId) {
            console.warn('[SeriesEventHandler] Sort failed: No album context found');
            return;
        }

        const field = header.dataset.sort;
        const currentDirection = header.dataset.direction || 'asc';
        const newDirection = currentDirection === 'asc' ? 'desc' : 'asc'; // Toggle

        // Get album
        const album = albumsStore.getAlbums().find(a => a.id === albumId);
        if (!album) return;

        console.log(`[SeriesEventHandler] Sorting album ${albumId} by ${field} (${newDirection})`);

        // Re-render table HTML
        // Note: We need to update the entire container to ensure event delegation still works 
        // and visual state is consistent.
        // AlbumCardRenderer.renderDetailedTable returns the OUTER HTML of the table/wrapper.

        // Import Renderer dynamically to avoid circular dependency if possible, 
        // or ensure it's imported at top (it's not).
        // We need to import AlbumCardRenderer at the top of this file.
        // Wait, I haven't imported AlbumCardRenderer in this file properly yet!

        // I will add the import in a separate block if needed, but for now assuming logic here.
        // Actually, let's use the global class if available or import it.
        // I need to add `import { AlbumCardRenderer } from '../ui/AlbumCardRenderer.js';`

        // Re-render table HTML
        const newTableHTML = AlbumCardRenderer.renderDetailedTable(album, {
            sortField: field,
            sortDirection: newDirection
        });

        // Find container to replace
        if (tableRoot && tableRoot.parentNode) {
            tableRoot.outerHTML = newTableHTML;
        }
    }

    /**
     * Handle series-level actions (edit, delete)
     */
    async handleSeriesAction(action, seriesId) {
        const { onEditSeries, onDeleteSeries } = this.props;

        switch (action) {
            case 'edit-series':
                if (onEditSeries) onEditSeries(seriesId);
                break;
            case 'delete-series':
                if (onDeleteSeries) onDeleteSeries(seriesId);
                break;
        }
    }

    /**
     * Handle album-level actions (view, add to inventory, remove)
     */
    async handleAlbumAction(action, albumId, targetElement = null) {
        // Find album in store
        const album = albumsStore.getAlbums().find(a => a.id === albumId);

        if (!album) {
            console.warn('[SeriesEventHandler] Album not found:', albumId);
            return;
        }

        switch (action) {
            case 'view-modal':
                showViewAlbumModal(album); // Verified SafeDOM
                break;

            case 'add-to-inventory':
                InventoryAddModal.open(album, () => {
                    console.log('[SeriesEventHandler] Album added to inventory:', album.title);
                });
                break;

            case 'remove-album':
                await this.handleRemoveAlbum(album, targetElement);
                break;

            // Sprint 20: User Ranking
            case 'rank-album':
                this.handleRankAlbum(album);
                break;

            // Sprint 22: Refetch Metadata
            case 'refetch-metadata':
                const { onRefetchMetadata } = this.props;
                if (onRefetchMetadata) onRefetchMetadata(album);
                break;
        }
    }

    /**
     * Remove album from series with confirmation
     */
    async handleRemoveAlbum(album, targetElement = null) {
        const confirmed = await dialogService.confirm({
            title: 'Remove Album?',
            message: `Are you sure you want to remove "${album.title} - ${album.artist}" from this series?`,
            confirmText: 'Remove',
            variant: 'danger'
        })

        if (!confirmed) return;

        try {
            const urlParams = new URLSearchParams(window.location.search);
            let seriesId = urlParams.get('seriesId');

            // Fix for All Series View: Try to find series context from DOM if not in URL
            if (!seriesId && targetElement) {
                const seriesGroup = targetElement.closest('[data-series-id]');
                if (seriesGroup) {
                    seriesId = seriesGroup.dataset.seriesId;
                    console.log(`[SeriesEventHandler] Resolved series context from DOM: ${seriesId}`);
                }
            }

            // 1. Remove from series (Persistence) - FIX #154: Use SeriesService, not store
            const seriesService = getSeriesService(db, null, auth.currentUser?.uid);
            await seriesService.removeAlbumFromSeries(seriesId, album);

            // 2. Remove from local view store (Immediate UI Feedback)
            albumsStore.removeAlbum(album.id);

            // 3. Success Toast
            toast.success('Album removed from series');

            // 4. Notify parent if callback provided
            const { onAlbumRemoved } = this.props;
            if (onAlbumRemoved) onAlbumRemoved(album);
        } catch (err) {
            console.error('[SeriesEventHandler] Failed to remove album:', err);

            // Checking for specific matching error to trigger manual fallback
            if (err.message.includes('Could not find album query in series')) {
                // Get series and its queries
                const urlParams = new URLSearchParams(window.location.search);
                let seriesId = urlParams.get('seriesId');
                if (!seriesId && targetElement) {
                    const seriesGroup = targetElement.closest('[data-series-id]');
                    if (seriesGroup) seriesId = seriesGroup.dataset.seriesId;
                }

                const series = albumSeriesStore.getById(seriesId) || albumSeriesStore.getActiveSeries();

                if (series && series.albumQueries) {
                    // Normalize queries for display
                    const options = series.albumQueries.map(q => {
                        return typeof q === 'string' ? q : (q.title || JSON.stringify(q))
                    });

                    // Prompt user manually (using prompt for now as DialogService doesn't have a "Select" modal yet, 
                    // but we can use prompt with a list instructions or implement a SelectModal later.
                    // For now, let's use a standard prompt asking for the exact string to remove, pre-filled with nothing.)

                    // Actually, let's just ask if they want to FORCE remove the matching query if we can find partials.
                    // But since we already failed partials in store...

                    // Let's use `window.prompt` as a last resort fallback MVP
                    // Or reuse InputModal via DialogService.prompt

                    const manualQuery = await dialogService.prompt({
                        title: 'Manual Removal Required',
                        message: `We couldn't automatically match this album to a record in your series. \n\nPlease type the exact name/query to remove from the list below:\n\n${options.slice(0, 10).join('\n')}${options.length > 10 ? '\n...' : ''}`,
                        defaultValue: album.title,
                        confirmText: 'Remove Query'
                    });

                    if (manualQuery) {
                        try {
                            // Try to remove the manually entered string directly
                            // We need a store method for "remove specific query string" 
                            // OR we assume the store's removeAlbumFromSeries will match this if we pass a "fake" album 
                            // with this title? No, removeAlbumFromSeries matches against Queries.
                            // If I pass an ID-less album object with title = manualQuery, it might match exact string.

                            // FIX #154: Use SeriesService for consistent method access
                            const seriesService = getSeriesService(db, null, auth.currentUser?.uid);
                            await seriesService.removeAlbumFromSeries(seriesId, { title: manualQuery, artist: '' });
                            albumsStore.removeAlbum(album.id);
                            toast.success('Album removed manually');
                            const { onAlbumRemoved } = this.props;
                            if (onAlbumRemoved) onAlbumRemoved(album);
                            return;

                        } catch (manualErr) {
                            toast.error('Manual removal failed: ' + manualErr.message);
                        }
                    }
                    return;
                }
            }

            toast.error('Failed to remove album: ' + err.message);
        }
    }

    /**
     * Sprint 20: Open User Ranking Modal
     * @param {Object} album - Album to rank
     */
    handleRankAlbum(album) {
        // Get current user ID (from actual auth state)
        const userId = auth.currentUser?.uid || 'anonymous-user';

        const modal = new UserRankModal({
            album,
            userId,
            onSave: (rankings) => {
                // 1. Update local album object state immediately for UI consistency
                // Use the new Model method to ensure all track lists are updated
                album.setUserRankings(rankings);

                toast.success(`Rankings saved for "${album.title}"`);
                console.log('[V2] [SeriesEventHandler] Rankings saved and local state updated:', rankings);

                // 2. Trigger re-render
                const { onAlbumRemoved } = this.props;
                if (onAlbumRemoved) {
                    console.log('[V2] [SeriesEventHandler] Triggering onAlbumRemoved (refresh)');
                    onAlbumRemoved();
                }
            },
            onClose: () => {
                console.log('[SeriesEventHandler] Rank modal closed');
            }
        });

        modal.show();
    }
}
