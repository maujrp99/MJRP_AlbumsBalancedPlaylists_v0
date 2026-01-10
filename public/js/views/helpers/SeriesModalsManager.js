/**
 * SeriesModalsManager.js
 * 
 * Manages the mounting and interaction with series-related modals (Edit/Delete).
 * Encapsulates the wiring between SeriesModals component and the View/Controller.
 */
import SeriesModals from '../../components/series/SeriesModals.js';
import { albumsStore } from '../../stores/albums.js';
import { router } from '../../router.js';
import { escapeHtml } from '../../utils/stringUtils.js';

export class SeriesModalsManager {
    constructor(view) {
        this.view = view;
        this.modalsComponent = null;
    }

    /**
     * Mount the SeriesModals component
     * @param {HTMLElement} container - The container element to mount into
     */
    mount(container) {
        if (!container) return;

        this.modalsComponent = new SeriesModals({
            onSeriesUpdated: (seriesId) => this.handleSeriesUpdated(seriesId),
            onSeriesDeleted: (seriesId) => this.handleSeriesDeleted(seriesId),
            escapeHtml: escapeHtml
        });

        container.innerHTML = this.modalsComponent.render();
        this.modalsComponent.mount(container);
    }

    handleSeriesUpdated(seriesId) {
        // ARCH-6: Invalidate cache to prevent stale data
        albumsStore.clearAlbumSeries(seriesId);
        albumsStore.clearAlbumSeries('ALL_SERIES_VIEW');

        if (this.view.updateHeader) {
            this.view.updateHeader();
        }

        if (this.view.controller) {
            this.view.controller.loadScope(this.view.currentScope, this.view.targetSeriesId, true);
        }
    }

    handleSeriesDeleted(seriesId) {
        // ARCH-6: Invalidate cache
        albumsStore.clearAlbumSeries(seriesId);
        albumsStore.clearAlbumSeries('ALL_SERIES_VIEW');

        if (this.view.targetSeriesId === seriesId) {
            router.navigate('/albums');
        } else if (this.view.refreshGrid) {
            this.view.refreshGrid();
        }
    }

    openEdit(seriesId) {
        if (this.modalsComponent) {
            this.modalsComponent.openEdit(seriesId);
        }
    }

    openDelete(seriesId) {
        if (this.modalsComponent) {
            this.modalsComponent.openDelete(seriesId);
        }
    }

    unmount() {
        if (this.modalsComponent && typeof this.modalsComponent.unmount === 'function') {
            this.modalsComponent.unmount();
        }
    }
}
