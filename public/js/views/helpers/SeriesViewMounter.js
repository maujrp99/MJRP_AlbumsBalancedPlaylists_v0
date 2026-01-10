/**
 * SeriesViewMounter.js
 * 
 * Factory responsible for instantiating and mounting the main sub-components
 * of the SeriesView (Header, Toolbar, Grid).
 * Reduces component glue code in the main View.
 */
import SeriesHeader from '../../components/series/SeriesHeader.js';
import SeriesToolbar from '../../components/series/SeriesToolbar.js';
import SeriesGridRenderer from '../../components/series/SeriesGridRenderer.js';
import { SeriesProgressBar } from '../../components/series/SeriesProgressBar.js';
import { albumsStore } from '../../stores/albums.js';
import { albumSeriesStore } from '../../stores/albumSeries.js';
import { router } from '../../router.js';
import { getUniqueArtists as getUniqueArtistsFn } from '../../services/SeriesFilterService.js';
import { escapeHtml } from '../../utils/stringUtils.js';

export class SeriesViewMounter {
    /**
     * Mount all main components
     * @param {SeriesView} view - The parent view instance
     * @returns {Object} map of mounted components { header, toolbar, grid, inlineProgress }
     */
    static async mountAll(view) {
        const header = await this.mountHeader(view);
        const { toolbar, inlineProgress } = await this.mountToolbar(view);
        const grid = await this.mountGrid(view);

        return { header, toolbar, grid, inlineProgress };
    }

    static async mountHeader(view) {
        const mount = document.getElementById('series-header-mount');
        if (!mount) return null;

        const activeSeries = albumSeriesStore.getActiveSeries();
        const albums = albumsStore.getAlbums();
        const pageTitle = view.currentScope === 'ALL'
            ? 'All Albums Series'
            : (activeSeries ? escapeHtml(activeSeries.name) : 'Albums');

        const header = new SeriesHeader({
            container: mount,
            props: {
                pageTitle,
                albumCount: albums.length,
                onGeneratePlaylists: () => {
                    const activeSeries = albumSeriesStore.getActiveSeries();
                    if (activeSeries) {
                        router.navigate(`/blend?seriesId=${activeSeries.id}`);
                    } else {
                        router.navigate('/blend');
                    }
                }
            }
        });
        header.mount();
        return header;
    }

    static async mountToolbar(view) {
        const mount = document.getElementById('series-toolbar-mount');
        if (!mount) return { toolbar: null, inlineProgress: null };

        const albums = albumsStore.getAlbums();
        const activeSeries = albumSeriesStore.getActiveSeries();
        const allSeries = albumSeriesStore.getSeries();

        const { searchQuery, filters, viewMode } = view.controller.getState();

        const toolbar = new SeriesToolbar({
            container: mount,
            props: {
                searchQuery,
                filters,
                viewMode,
                artists: getUniqueArtistsFn(albums),
                seriesList: allSeries,
                activeSeries,
                onSearch: (q) => view.handleSearch(q),
                onSeriesChange: (v) => view.handleSeriesChange(v),
                onArtistFilter: (v) => view.handleFilter('artist', v),
                onYearFilter: (v) => view.handleFilter('year', v),
                onSourceFilter: (v) => view.handleFilter('source', v),
                onRefresh: () => view.handleRefresh(),
                onToggleView: () => view.handleToggleView()
            }
        });
        toolbar.mount();

        // Setup inline progress bar
        const inlineProgress = new SeriesProgressBar('loading-progress-container');
        inlineProgress.mount();

        return { toolbar, inlineProgress };
    }

    static async mountGrid(view) {
        const mount = document.getElementById('series-grid-mount');
        if (!mount) return null;

        const allSeries = albumSeriesStore.getSeries();

        const grid = new SeriesGridRenderer({
            container: mount,
            props: {
                items: [], // Initial empty, updated by controller
                layout: view.viewMode === 'compact' ? 'grid' : 'list',
                scope: view.currentScope,
                seriesList: allSeries,
                context: { searchQuery: view.searchQuery, filters: view.filters } // view properties might be stale, controller has state
            }
        });
        grid.mount();

        // Show empty state if needed (handled by view logic usually, but here just initial)
        view.updateEmptyState(0);

        return grid;
    }
}
