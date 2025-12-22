/**
 * SeriesToolbar.js
 * 
 * Component: Search bar + All filters + Action buttons
 * Migrated from AlbumsView filter section
 */
import Component from '../base/Component.js';
import { getIcon } from '../Icons.js';
import { albumSeriesStore } from '../../stores/albumSeries.js';

export default class SeriesToolbar extends Component {
    constructor(props) {
        super(props);
        // Props: onSearch, onSeriesChange, onArtistFilter, onYearFilter, onSourceFilter, onRefresh, onToggleView
        // Props: artists (unique list), viewMode, activeSeries, filters
    }

    render() {
        const {
            searchQuery = '',
            artists = [],
            activeSeries = null,
            filters = { artist: 'all', year: 'all', source: 'all' },
            viewMode = 'compact',
            seriesList = []  // Accept from props instead of store
        } = this.props;

        const allSeries = seriesList.length > 0 ? seriesList : albumSeriesStore.getSeries();

        const viewBtnClass = viewMode === 'compact'
            ? 'tech-btn-secondary px-4 py-2 flex items-center gap-2'
            : 'tech-btn-secondary px-4 py-2 flex items-center gap-2';
        const viewBtnLabel = viewMode === 'compact' ? 'View Compact' : 'View Expanded';
        const viewBtnIcon = viewMode === 'compact' ? 'Grid3X3' : 'List';

        this.container.innerHTML = `
            <div class="filters-section glass-panel p-4 mb-6 fade-in relative">
                <div class="filters-row flex flex-wrap gap-3 items-center">
                    
                    <!-- Search -->
                    <div class="search-bar relative flex-1 min-w-[200px]">
                        <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                            ${getIcon('Search', 'w-5 h-5')}
                        </span>
                        <input
                            type="search"
                            id="albumSearch"
                            placeholder="Search albums..."
                            class="form-control pl-10 w-full"
                            value="${searchQuery}"
                        />
                    </div>

                    <!-- Series Filter -->
                    <div class="series-dropdown relative min-w-[200px]">
                        <select id="seriesFilter" class="form-control appearance-none cursor-pointer pr-8 text-accent-primary font-bold bg-brand-dark/50 border-accent-primary/30">
                            <option value="all" ${!activeSeries ? 'selected' : ''}>All Series</option>
                            ${allSeries.map(s => `
                                <option value="${s.id}" ${activeSeries?.id === s.id ? 'selected' : ''}>
                                    ${this.escapeHtml(s.name)}
                                </option>
                            `).join('')}
                        </select>
                        <span class="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-accent-primary">
                            ${getIcon('Layers', 'w-4 h-4')}
                        </span>
                    </div>

                    <!-- Artist Filter -->
                    <div class="filter-dropdown relative">
                        <select id="artistFilter" class="form-control appearance-none cursor-pointer pr-8">
                            <option value="all">All Artists</option>
                            ${artists.map(artist => `
                                <option value="${this.escapeHtml(artist)}" ${filters.artist === artist ? 'selected' : ''}>
                                    ${this.escapeHtml(artist)}
                                </option>
                            `).join('')}
                        </select>
                        <span class="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                            ${getIcon('ChevronDown', 'w-4 h-4')}
                        </span>
                    </div>

                    <!-- Year Filter -->
                    <div class="filter-dropdown relative">
                        <select id="yearFilter" class="form-control appearance-none cursor-pointer pr-8">
                            <option value="all">All Years</option>
                            <option value="1960s" ${filters.year === '1960s' ? 'selected' : ''}>1960s</option>
                            <option value="1970s" ${filters.year === '1970s' ? 'selected' : ''}>1970s</option>
                            <option value="1980s" ${filters.year === '1980s' ? 'selected' : ''}>1980s</option>
                            <option value="1990s" ${filters.year === '1990s' ? 'selected' : ''}>1990s</option>
                            <option value="2000s" ${filters.year === '2000s' ? 'selected' : ''}>2000s+</option>
                        </select>
                        <span class="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                            ${getIcon('ChevronDown', 'w-4 h-4')}
                        </span>
                    </div>

                    <!-- Source Filter -->
                    <div class="filter-dropdown relative">
                        <select id="sourceFilter" class="form-control appearance-none cursor-pointer pr-8">
                            <option value="all">All Sources</option>
                            <option value="pending" ${filters.source === 'pending' ? 'selected' : ''}>Pending</option>
                            <option value="acclaim" ${filters.source === 'acclaim' ? 'selected' : ''}>Acclaim</option>
                            <option value="popularity" ${filters.source === 'popularity' ? 'selected' : ''}>Popularity</option>
                            <option value="ai" ${filters.source === 'ai' ? 'selected' : ''}>AI Enriched</option>
                        </select>
                        <span class="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                            ${getIcon('ChevronDown', 'w-4 h-4')}
                        </span>
                    </div>

                    <!-- Refresh -->
                    <button id="refreshAlbums" class="btn btn-warning whitespace-nowrap flex items-center gap-2" title="Reload (skip cache)">
                        ${getIcon('RefreshCw', 'w-4 h-4')} Refresh
                    </button>

                    <!-- View Mode -->
                    <button id="toggleViewMode" class="${viewBtnClass}">
                        ${getIcon(viewBtnIcon, 'w-5 h-5')} ${viewBtnLabel}
                    </button>
                </div>

                <!-- Progress container -->
                <div id="loading-progress-container" class="w-full mt-4 empty:hidden"></div>
            </div>
        `;

        this.bindEvents();
    }

    bindEvents() {
        const { onSearch, onSeriesChange, onArtistFilter, onYearFilter, onSourceFilter, onRefresh, onToggleView } = this.props;

        // Search
        const search = this.container.querySelector('#albumSearch');
        if (search && onSearch) {
            search.addEventListener('input', (e) => onSearch(e.target.value));
        }

        // Series
        const series = this.container.querySelector('#seriesFilter');
        if (series && onSeriesChange) {
            series.addEventListener('change', (e) => onSeriesChange(e.target.value));
        }

        // Artist
        const artist = this.container.querySelector('#artistFilter');
        if (artist && onArtistFilter) {
            artist.addEventListener('change', (e) => onArtistFilter(e.target.value));
        }

        // Year
        const year = this.container.querySelector('#yearFilter');
        if (year && onYearFilter) {
            year.addEventListener('change', (e) => onYearFilter(e.target.value));
        }

        // Source
        const source = this.container.querySelector('#sourceFilter');
        if (source && onSourceFilter) {
            source.addEventListener('change', (e) => onSourceFilter(e.target.value));
        }

        // Refresh
        const refresh = this.container.querySelector('#refreshAlbums');
        if (refresh && onRefresh) {
            refresh.addEventListener('click', onRefresh);
        }

        // View toggle
        const toggle = this.container.querySelector('#toggleViewMode');
        if (toggle && onToggleView) {
            toggle.addEventListener('click', onToggleView);
        }
    }

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}
