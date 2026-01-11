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
        this.components = components; // { header, toolbar, grid, inlineProgress }
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

    updateGrid(albums, viewMode, currentScope, filters, searchQuery) {
        if (!this.components.grid) return;

        const allSeries = albumSeriesStore.getSeries();

        this.components.grid.update({
            items: albums,
            layout: viewMode === 'compact' ? 'grid' : 'list',
            scope: currentScope,
            seriesList: allSeries,
            context: { searchQuery, filters }
        });
    }

    updateLoading(isLoading) {
        if (this.components.inlineProgress) {
            isLoading ? this.components.inlineProgress.start() : this.components.inlineProgress.finish();
        }
    }

    updateProgress({ current, total, label }) {
        if (this.components.inlineProgress) {
            this.components.inlineProgress.update(current, total, label);
        }
    }

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
            artists
        });
    }
}
