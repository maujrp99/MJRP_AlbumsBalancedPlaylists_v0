/**
 * SeriesViewHandlers.js
 * 
 * Extracted from SeriesView.js (Sprint 19 Track A)
 * Contains event handler logic to reduce SeriesView LOC.
 */
import { router } from '../../router.js';
import { albumSeriesStore } from '../../stores/albumSeries.js';

/**
 * Handle series dropdown change
 * @param {SeriesView} view - The view instance
 * @param {string} value - Selected series ID or 'all'
 */
export function handleSeriesChange(view, value) {
    const seriesId = value === 'all' ? null : value;
    const scopeType = seriesId ? 'SINGLE' : 'ALL';

    if (view.controller) {
        view.controller.loadScope(scopeType, seriesId);
    }

    const url = seriesId ? `/albums?seriesId=${seriesId}` : '/albums';
    window.history.replaceState({}, '', url);

    view.currentScope = scopeType;
    view.targetSeriesId = seriesId;
}

/**
 * Handle view mode toggle
 * @param {SeriesView} view - The view instance
 */
export function handleToggleView(view) {
    view.viewMode = view.viewMode === 'compact' ? 'expanded' : 'compact';
    localStorage.setItem('albumsViewMode', view.viewMode);

    view.mountToolbar();
    view.refreshGrid();
}

/**
 * Handle generate playlists navigation
 * @param {SeriesView} view - The view instance
 */
export function handleGeneratePlaylists(view) {
    const activeSeries = albumSeriesStore.getActiveSeries();
    if (activeSeries) {
        router.navigate(`/playlists?seriesId=${activeSeries.id}`);
    } else {
        router.navigate('/playlists');
    }
}

/**
 * Handle refresh request
 * @param {SeriesView} view - The view instance
 */
export function handleRefresh(view) {
    if (view.controller) {
        view.controller.loadScope(view.currentScope, view.targetSeriesId, true);
    }
}
