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
        // FIX #158: Soft reload for Edit Series prevents flash
        // remove clearAlbumSeries calls
        if (this.view.controller) {
            this.view.controller.loadScope(this.view.currentScope, this.view.targetSeriesId, true);
        }
    }

    handleSeriesDeleted(seriesId) {
        // ARCH-6: Invalidate cache (Granular update handled by Service/Store now)
        // albumsStore.clearAlbumSeries(seriesId); // Service does this
        // albumsStore.clearAlbumSeries('ALL_SERIES_VIEW'); // Service does this granularly

        if (this.view.targetSeriesId === seriesId) {
            router.navigate('/albums');
        }
        // FIX #158: No need to reload scope manually anymore.
        // The store update (removeAlbumsBySeriesIdFromContext) will trigger reactivity.
        // Calling loadScope or refreshGrid caused the "No albums" flash because it cleared view before loading.
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
