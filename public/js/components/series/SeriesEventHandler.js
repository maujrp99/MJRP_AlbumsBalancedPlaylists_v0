/**
 * SeriesEventHandler.js
 * 
 * V3 Component: Event Delegation for Card Actions
 * 
 * Following Clean Architecture principles:
 * - Single Responsibility: Handles all card-level user interactions
 * - Dependency Inversion: Depends on abstractions (callbacks) not concrete implementations
 * - Open/Closed: New actions can be added without modifying existing code
 * 
 * This component is responsible for:
 * - Album actions: view-modal, add-to-inventory, remove-album
 * - Series actions: edit-series, delete-series
 * - Event delegation pattern for dynamically rendered content
 */

import Component from '../base/Component.js';
import { albumsStore } from '../../stores/albums.js';
import { albumSeriesStore } from '../../stores/albumSeries.js';
import { showViewAlbumModal } from '../ViewAlbumModal.js';
import { toast } from '../Toast.js';

export default class SeriesEventHandler extends Component {
    /**
     * @param {Object} config
     * @param {HTMLElement} config.container - The container to attach listeners to
     * @param {Object} config.props
     * @param {Function} config.props.onEditSeries - Callback for edit series
     * @param {Function} config.props.onDeleteSeries - Callback for delete series
     * @param {Function} config.props.onAlbumRemoved - Callback after album removal
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
        const target = e.target.closest('[data-action]');
        if (!target) return;

        const action = target.dataset.action;
        const albumId = target.dataset.albumId;
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

        await this.handleAlbumAction(action, albumId);
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
    async handleAlbumAction(action, albumId) {
        // Find album in store
        const album = albumsStore.getAlbums().find(a => a.id === albumId);

        if (!album) {
            console.warn('[SeriesEventHandler] Album not found:', albumId);
            return;
        }

        switch (action) {
            case 'view-modal':
                showViewAlbumModal(album);
                break;

            case 'add-to-inventory':
                await this.handleAddToInventory(album);
                break;

            case 'remove-album':
                await this.handleRemoveAlbum(album);
                break;
        }
    }

    /**
     * Add album to inventory via modal
     */
    async handleAddToInventory(album) {
        try {
            const { showAddToInventoryModal } = await import('../InventoryModals.js');
            showAddToInventoryModal(album, () => {
                // Optional success callback - modal handles toast
                console.log('[SeriesEventHandler] Album added to inventory:', album.title);
            });
        } catch (err) {
            console.error('[SeriesEventHandler] Failed to load inventory modal:', err);
            toast.error('Failed to open inventory modal');
        }
    }

    /**
     * Remove album from series with confirmation
     */
    async handleRemoveAlbum(album) {
        try {
            const { showDeleteAlbumModal } = await import('../Modals.js');

            showDeleteAlbumModal(
                album.id,
                `${album.title} - ${album.artist}`,
                async () => {
                    try {
                        const urlParams = new URLSearchParams(window.location.search);
                        const seriesId = urlParams.get('seriesId');

                        // 1. Remove from series (Persistence)
                        await albumSeriesStore.removeAlbumFromSeries(album, seriesId);

                        // 2. Remove from local view store (Immediate UI Feedback)
                        albumsStore.removeAlbum(album.id);

                        // 3. Success Toast
                        toast.success('Album removed from series');

                        // 4. Notify parent if callback provided
                        const { onAlbumRemoved } = this.props;
                        if (onAlbumRemoved) onAlbumRemoved(album);
                    } catch (err) {
                        console.error('[SeriesEventHandler] Failed to remove album:', err);
                        toast.error('Failed to remove album: ' + err.message);
                    }
                }
            );
        } catch (err) {
            console.error('[SeriesEventHandler] Failed to load delete modal:', err);
            toast.error('Failed to open delete confirmation');
        }
    }
}
