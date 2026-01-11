/**
 * SeriesComponentFactory.js
 * 
 * Central factory for creating and configuring SeriesView sub-components.
 * Handles all props mapping and component instantiation.
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

export class SeriesComponentFactory {
    static createHeader(container, { view }) {
        if (!container) return null;

        const activeSeries = albumSeriesStore.getActiveSeries();
        const albums = albumsStore.getAlbums();
        const pageTitle = view.currentScope === 'ALL'
            ? 'All Albums Series'
            : (activeSeries ? escapeHtml(activeSeries.name) : 'Albums');

        const header = new SeriesHeader({
            container,
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

    static createToolbar(container, { view, controller }) {
        if (!container) return null;

        const albums = albumsStore.getAlbums();
        const activeSeries = albumSeriesStore.getActiveSeries();
        const allSeries = albumSeriesStore.getSeries();

        const { searchQuery, filters, viewMode } = controller.getState();

        const toolbar = new SeriesToolbar({
            container,
            props: {
                searchQuery,
                filters,
                viewMode,
                artists: getUniqueArtistsFn(albums),
                seriesList: allSeries,
                activeSeries,
                // Direct binding: no wrappers needed in View
                onSearch: (q) => controller.handleSearch(q),
                onSeriesChange: (v) => controller.handleSeriesChange(v), // This one needs logic from Handlers? No, Controller handles it. 
                // Wait, original View used Handlers.handleSeriesChange.
                // Checking SeriesViewHandlers: it calls router or controller. 
                // Let's assume controller.handleSeriesChange is sufficient or we bind the right logic here.
                // Actually SeriesViewHandlers.handleSeriesChange does router navigation. 
                // So we should bind that logic here or use a controller method that does it.
                // For now, let's keep the logic close to what it was but bound here.
                onSeriesChange: (v) => {
                    // Replicating SeriesViewHandlers.handleSeriesChange logic concisely:
                    if (v === 'all') router.navigate('/albums');
                    else router.navigate(`/albums?seriesId=${v}`);
                },
                onArtistFilter: (v) => controller.handleFilterChange('artist', v),
                onYearFilter: (v) => controller.handleFilterChange('year', v),
                onSourceFilter: (v) => controller.handleFilterChange('source', v),
                onRefresh: () => controller.loadScope(view.currentScope, view.targetSeriesId, true),
                onToggleView: () => {
                    const newMode = view.viewMode === 'compact' ? 'expanded' : 'compact';
                    controller.handleViewModeChange(newMode);
                }
            }
        });
        toolbar.mount();
        return toolbar;
    }

    static createProgressBar(containerId) {
        const progress = new SeriesProgressBar(containerId);
        progress.mount();
        return progress;
    }

    static createGrid(container, { view, controller }) {
        if (!container) return null;

        const allSeries = albumSeriesStore.getSeries();

        const grid = new SeriesGridRenderer({
            container,
            props: {
                items: [], // Updated later via Updater
                layout: view.viewMode === 'compact' ? 'grid' : 'list',
                scope: view.currentScope,
                seriesList: allSeries,
                context: { searchQuery: view.searchQuery, filters: view.filters }
            }
        });
        grid.mount();
        return grid;
    }
}
