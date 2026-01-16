/**
 * SeriesViewUpdater.js
 * 
 * Handles all DOM and Component state updates for SeriesView.
 * Separates "Logic" (Controller) from "View Updates" (This).
 */
import { albumSeriesStore } from '../../stores/albumSeries.js';
import { albumsStore } from '../../stores/albums.js';
import { escapeHtml } from '../../utils/stringUtils.js';
import { SeriesEmptyState } from '../../components/series/SeriesEmptyState.js';
import { SafeDOM } from '../../utils/SafeDOM.js';

import { getUniqueArtists } from '../../services/SeriesFilterService.js';

export class SeriesViewUpdater {
    constructor(components) {
        this.components = components; // { header, toolbar, grid } - FIX #152B: inlineProgress removed
    }

    updateHeader(currentScope) {
        if (!this.components.header) return;

        const activeSeries = albumSeriesStore.getActiveSeries();
        const albums = albumsStore.getAlbums();
        const pageTitle = currentScope === 'ALL'
            ? 'All Albums Series'
            : (activeSeries ? escapeHtml(activeSeries.name) : 'Albums');

        this.components.header.update({
            pageTitle,
            albumCount: albums.length
        });
    }

    /**
     * Revised updateHeader signature to accept full payload
     */
    updateHeaderPayload(data) {
        // FIX #153: Guard against undefined data to prevent TypeError
        if (!this.components.header || !data) return;

        this.components.header.update({
            pageTitle: data.title,
            albumCount: data.description // reuse or separate
        });

        // Critical: Update Grid with Sorted Series
        if (this.components.grid && data.seriesList) {
            this.components.grid.update({
                seriesList: data.seriesList
            });
        }
    }

    updateGrid(albums, viewMode, currentScope, filters, searchQuery, sortedSeriesList = null, isLoading = false) {
        if (!this.components.grid) return;

        // ARCH-FIX: Use sorted list if provided (from Controller), otherwise fallback to store (unsorted)
        const seriesList = sortedSeriesList || albumSeriesStore.getSeries();

        this.components.grid.update({
            items: albums,
            layout: viewMode === 'compact' ? 'grid' : 'list',
            scope: currentScope,
            seriesList: seriesList,
            context: { searchQuery, filters },
            isLoading: isLoading // FIX #152: Pass isLoading to GridRenderer
        });
    }

    // FIX #152B: updateLoading and updateProgress removed - skeletons provide loading feedback

    updateEmptyState(containerId, albumCount, isLoading) {
        const container = document.getElementById(containerId);
        if (!container) return;

        SafeDOM.clear(container);

        if (albumCount === 0 && !isLoading) {
            const emptyState = new SeriesEmptyState({
                message: 'No albums in library',
                subMessage: 'Create a series from the home page to get started',
                ctaText: 'Go to Home',
                ctaHref: '/home'
            });
            emptyState.mount(container);
        }
    }


    updateToolbar(state, currentScope) {
        if (!this.components.toolbar) return;

        const { searchQuery, filters, viewMode } = state;
        const activeSeries = albumSeriesStore.getActiveSeries();
        const allSeries = albumSeriesStore.getSeries();
        const albums = albumsStore.getAlbums();

        // Regenerate dynamic options
        const artists = getUniqueArtists(albums);

        // Update toolbar with synchronized state
        this.components.toolbar.update({
            searchQuery,
            filters,
            viewMode,
            activeSeries: currentScope === 'ALL' ? null : activeSeries,
            seriesList: allSeries,
            seriesSortMode: state.seriesSortMode, // Sync sort state
            artists
        });
    }
}
