/**
 * SeriesViewUpdater.js
 * 
 * Handles all DOM and Component state updates for SeriesView.
 * Separates "Logic" (Controller) from "View Updates" (This).
 */
import { albumSeriesStore } from '../../stores/albumSeries.js';
import { albumsStore } from '../../stores/albums.js';
import { decodeEntities } from '../../models/text.js';
import { SeriesEmptyState } from '../../components/series/SeriesEmptyState.js';
import { SeriesLoadingState } from '../../components/series/SeriesLoadingState.js';
import { ListState } from '../../models/albumsListState.js';
import { SafeDOM } from '../../utils/SafeDOM.js';

import { listArtists } from '../../models/seriesFilter.js';

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
            : (activeSeries ? decodeEntities(activeSeries.name) : 'Albums');

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
            albumCount: data.description, // reuse or separate
            seriesId: data.activeSeriesId || null
        });

        // Critical: Update Grid with Sorted Series
        if (this.components.grid && data.seriesList) {
            this.components.grid.update({
                seriesList: data.seriesList
            });
        }
    }

    updateGrid(albums, viewMode, currentScope, filters, searchQuery, sortedSeriesList = null, isLoading = false, seriesStates = null, expandedSeriesIds = []) {
        if (!this.components.grid) return;

        // ARCH-FIX: Use sorted list if provided (from Controller), otherwise fallback to store (unsorted)
        const seriesList = sortedSeriesList || albumSeriesStore.getSeries();

        this.components.grid.update({
            items: albums,
            layout: viewMode === 'compact' ? 'grid' : 'list',
            scope: currentScope,
            seriesList: seriesList,
            context: { searchQuery, filters },
            isLoading: isLoading, // FIX #152: Pass isLoading to GridRenderer
            pageBounded: true, // the list is already cut to a page: draw every series, no lazy blocks
            seriesStates, // the load state of each series, derived by the load store
            expandedSeriesIds // the series the person opened whole (past the first 12 albums)
        });
    }

    // FIX #152B: updateLoading and updateProgress removed - skeletons provide loading feedback

    /**
     * @param {string} containerId
     * @param {number} albumCount
     * @param {boolean} isLoading - the albums are loading
     * @param {'loading'|'empty'|'list'} [listState] - F79: while the series are being read the
     *        list area says it is loading, instead of the empty state; the grid goes invisible (keeping its space)
     */
    updateEmptyState(containerId, albumCount, isLoading, listState = ListState.LIST) {
        const container = document.getElementById(containerId);
        if (!container) return;

        SafeDOM.clear(container);

        const grid = document.getElementById('series-grid-mount');
        // invisible, not removed: it keeps its space, so the empty card or the list replaces the loading state without a jump
        if (grid) grid.style.visibility = listState === ListState.LOADING ? 'hidden' : '';

        if (listState === ListState.LOADING) {
            new SeriesLoadingState({ gridHeight: grid ? grid.offsetHeight : 0 }).mount(container);
            return;
        }

        if (albumCount === 0 && !isLoading) {
            const emptyState = new SeriesEmptyState({
                message: 'No albums in library',
                subMessage: 'Create a series from the home page to get started',
                ctaText: 'Go and create!',
                ctaHref: '/start'
            });
            emptyState.mount(container);
        }
    }


    updateToolbar(state, currentScope, controller) {
        if (!this.components.toolbar) return;

        const { searchQuery, filters, viewMode, seriesSortMode } = state;
        const activeSeries = albumSeriesStore.getActiveSeries();
        const allSeries = albumSeriesStore.getSeries();
        // 1. Regenerate Options - the artists come from the series themselves, so the list is the
        //    same whatever page is on screen and whatever has loaded so far
        const artists = listArtists(allSeries);
        const seriesOptions = allSeries.map(s => ({ value: s.id, label: decodeEntities(s.name) }));
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
