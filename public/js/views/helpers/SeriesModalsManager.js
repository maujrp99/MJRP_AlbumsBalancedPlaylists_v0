/**
 * SeriesModalsManager.js
 * 
 * Manages the mounting and interaction with series-related modals (Edit/Delete).
 * Encapsulates the wiring between SeriesModals component and the View/Controller.
 */
import SeriesModals from '../../components/series/SeriesModals.js';
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

    /**
     * A series was edited and saved. The load is asked for the same scope again, not from scratch:
     * it reconciles, so an album added loads, an album removed leaves and every other album and
     * every other series stays as it is (UAT-191). The new name is drawn by the same call.
     */
    handleSeriesUpdated(seriesId) {
        if (this.view.controller) {
            this.view.controller.requestLoad(false);
        }
    }

    handleSeriesDeleted(seriesId) {
        if (this.view.targetSeriesId === seriesId) {
            router.navigate('/albums');
        }
        // Nothing to reload: the series left the list, the controller reconciles the load and the
        // albums of that series leave the screen with it.
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
