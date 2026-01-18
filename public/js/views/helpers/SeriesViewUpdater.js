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


    updateToolbar(state, currentScope, controller) {
        if (!this.components.toolbar) return;

        const { searchQuery, filters, viewMode, seriesSortMode } = state;
        const activeSeries = albumSeriesStore.getActiveSeries();
        const allSeries = albumSeriesStore.getSeries();
        const albums = albumsStore.getAlbums();

        // 1. Regenerate Options
        const artists = getUniqueArtists(albums);
        const seriesOptions = allSeries.map(s => ({ value: s.id, label: s.name }));
        const artistOptions = artists.map(a => ({ value: a, label: a }));

        const yearOptions = [
            { value: 'all', label: 'All Years' },
            { value: '1960s', label: '1960s' },
            { value: '1970s', label: '1970s' },
            { value: '1980s', label: '1980s' },
            { value: '1990s', label: '1990s' },
            { value: '2000s', label: '2000s+' }
        ];

        const sourceOptions = [
            { value: 'all', label: 'All Sources' },
            { value: 'user', label: 'My Ranking' },
            { value: 'pending', label: 'Pending' },
            { value: 'acclaim', label: 'BestEverAlbums' },
            { value: 'popularity', label: 'Popularity' },
            { value: 'ai', label: 'AI Enriched' }
        ];

        // 2. Safety Check
        if (!controller) {
            console.warn('[SeriesViewUpdater] Controller missing in updateToolbar');
            return;
        }

        // 3. Reconstruct Filter Groups
        const filterGroups = [
            {
                id: 'series',
                label: 'All Series',
                // FIX #160: Respect currentScope to ensure dropdown syncs with "Soft Navigation"
                value: (currentScope === 'ALL') ? 'all' : (activeSeries ? activeSeries.id : 'all'),
                options: seriesOptions,
                onChange: (v) => {
                    const scopeType = v === 'all' ? 'ALL' : 'SINGLE';
                    const seriesId = v === 'all' ? null : v;
                    controller.loadScope(scopeType, seriesId, false);
                },
                icon: 'Layers'
            },
            {
                id: 'artist',
                label: 'All Artists',
                value: filters.artist || 'all',
                options: artistOptions,
                onChange: (v) => controller.handleFilterChange('artist', v),
                icon: 'Mic'
            },
            {
                id: 'year',
                label: 'All Years',
                value: filters.year || 'all',
                options: yearOptions,
                onChange: (v) => controller.handleFilterChange('year', v),
                icon: 'Calendar'
            },
            {
                id: 'source',
                label: 'All Sources',
                value: filters.source || 'all',
                options: sourceOptions,
                onChange: (v) => controller.handleFilterChange('source', v),
                icon: 'Database'
            }
        ];

        // 4. Update Component
        this.components.toolbar.update({
            searchQuery,
            viewMode,
            currentSort: seriesSortMode,
            filterGroups
        });
    }
}
