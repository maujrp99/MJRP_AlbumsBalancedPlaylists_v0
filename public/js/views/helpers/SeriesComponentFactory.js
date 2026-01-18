/**
 * SeriesComponentFactory.js
 * 
 * Central factory for creating and configuring SeriesView sub-components.
 * Handles all props mapping and component instantiation.
 */
import SeriesHeader from '../../components/series/SeriesHeader.js';
import FilterToolbar from '../../components/ui/FilterToolbar.js';
import SeriesGridRenderer from '../../components/series/SeriesGridRenderer.js';
// FIX #152B: SeriesProgressBar removed - skeletons replace progress bar
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
        const { searchQuery, filters, viewMode, seriesSortMode } = controller.getState();

        // 1. Prepare Options
        const seriesOptions = allSeries.map(s => ({ value: s.id, label: s.name }));
        const artistOptions = getUniqueArtistsFn(albums).map(a => ({ value: a, label: a }));

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

        const sortOptions = [
            { value: 'count_asc', label: '# of Albums (↑)' },
            { value: 'count_desc', label: '# of Albums (↓)' },
            { value: 'alpha', label: 'Name (A-Z)' },
            { value: 'alpha_desc', label: 'Name (Z-A)' },
            { value: 'recent_desc', label: 'Newest' },
            { value: 'recent_asc', label: 'Oldest' }
        ];

        // 2. Instantiate FilterToolbar
        const toolbar = new FilterToolbar({
            container,
            props: {
                searchQuery,
                onSearch: (q) => controller.handleSearch(q),

                sortOptions,
                currentSort: seriesSortMode,
                onSort: (key) => controller.handleSort(key),

                filterGroups: [
                    {
                        id: 'series',
                        label: 'All Albums Series',
                        value: activeSeries ? activeSeries.id : 'all',
                        options: seriesOptions,
                        onChange: (v) => {
                            const scopeType = v === 'all' ? 'ALL' : 'SINGLE';
                            const seriesId = v === 'all' ? null : v;
                            // FIX #159: Use controller directly to prevent full view reset
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
                ],

                viewMode,
                onToggleView: () => {
                    const newMode = view.viewMode === 'compact' ? 'expanded' : 'compact';
                    controller.handleViewModeChange(newMode);
                },

                onRefresh: () => controller.loadScope(view.currentScope, view.targetSeriesId, true)
            }
        });

        toolbar.mount();
        // Adding explicit render call to be consistent with SavedPlaylistsView verification findings
        // assuming Component.mount logic is identical across usage.
        if (typeof toolbar.render === 'function') {
            toolbar.render();
        }

        return toolbar;
    }

    // FIX #152B: createProgressBar removed - skeletons replace progress bar as loading feedback

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
