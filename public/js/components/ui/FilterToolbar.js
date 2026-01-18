/**
 * FilterToolbar.js
 * 
 * Generic Toolbar for Search, Filter, Sort, and View Actions.
 * Designed to be reusable across different Views (SavedPlaylists, Series, etc).
 * 
 * Props:
 * - searchQuery: string
 * - onSearch: function(value)
 * - sortOptions: Array<{value, label}>
 * - currentSort: string
 * - onSort: function(value)
 * - filterGroups: Array<{
 *      id: string,
 *      label: string, // Default label (e.g. "All Artists")
 *      value: string,
 *      options: Array<{value, label}>,
 *      onChange: function(value),
 *      icon: string (optional)
 *   }>
 * - viewMode: 'compact' | 'expanded' (optional)
 * - onToggleView: function (optional)
 * - onRefresh: function (optional)
 */

import Component from '../base/Component.js';
import { getIcon } from '../Icons.js';

export default class FilterToolbar extends Component {
    constructor(props) {
        super(props);
    }

    render() {
        const {
            searchQuery = '',
            sortOptions = [],
            currentSort = '',
            filterGroups = [],
            viewMode = null,
            extraActions = [] // Extra buttons if needed
        } = this.props;

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
                            id="genericSearch"
                            placeholder="Search..."
                            class="form-control pl-10 w-full"
                            value="${this.escapeHtml(searchQuery)}"
                        />
                    </div>

                    <!-- Dynamic Filter Groups -->
                    ${filterGroups.map(group => this.renderFilterGroup(group)).join('')}

                    <!-- Sort Dropdown (if options provided) -->
                    ${sortOptions.length > 0 ? this.renderSortDropdown(sortOptions, currentSort) : ''}

                    <!-- Refresh Action -->
                    ${this.props.onRefresh ? `
                        <button id="genericRefresh" class="btn btn-warning whitespace-nowrap flex items-center gap-2" title="Reload">
                            ${getIcon('RefreshCw', 'w-4 h-4')} Refresh
                        </button>
                    ` : ''}

                    <!-- View Mode Toggles -->
                    ${viewMode ? this.renderViewToggles(viewMode) : ''}

                </div>
            </div>
        `;

        this.bindEvents();
    }

    renderFilterGroup(group) {
        return `
            <div class="filter-dropdown relative min-w-[160px]">
                <select id="filter-${group.id}" class="form-control appearance-none cursor-pointer pr-8 text-sm">
                    <option value="all">${this.escapeHtml(group.label)}</option>
                    ${group.options.map(opt => `
                        <option value="${this.escapeHtml(opt.value)}" ${String(group.value) === String(opt.value) ? 'selected' : ''}>
                            ${this.escapeHtml(opt.label)}
                        </option>
                    `).join('')}
                </select>
                <span class="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                    ${getIcon(group.icon || 'ChevronDown', 'w-4 h-4')}
                </span>
            </div>
        `;
    }

    renderSortDropdown(options, current) {
        return `
            <div class="sort-dropdown relative">
                <select id="genericSort" class="form-control appearance-none cursor-pointer pr-8 bg-brand-dark/30 border-white/10 text-xs py-1">
                    ${options.map(opt => `
                        <option value="${opt.value}" ${current === opt.value ? 'selected' : ''}>${this.escapeHtml(opt.label)}</option>
                    `).join('')}
                </select>
                <span class="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                     ${getIcon('ChevronDown', 'w-3 h-3')}
                </span>
            </div>
        `;
    }

    renderViewToggles(viewMode) {
        return `
            <div class="flex items-center gap-2">
                <button 
                    id="viewModeGrid" 
                    class="p-2 rounded-lg transition-all border border-transparent ${viewMode === 'compact' ? 'bg-brand-orange text-white shadow-lg shadow-brand-orange/20 scale-105 active:scale-95' : 'bg-brand-dark/50 text-gray-400 hover:text-white hover:bg-white/10 hover:border-white/10'}"
                    title="Grid View"
                >
                    ${getIcon('Grid', 'w-5 h-5')}
                </button>
                <button 
                    id="viewModeList" 
                    class="p-2 rounded-lg transition-all border border-transparent ${viewMode !== 'compact' ? 'bg-brand-orange text-white shadow-lg shadow-brand-orange/20 scale-105 active:scale-95' : 'bg-brand-dark/50 text-gray-400 hover:text-white hover:bg-white/10 hover:border-white/10'}"
                    title="List View"
                >
                    ${getIcon('List', 'w-5 h-5')}
                </button>
            </div>
        `;
    }

    bindEvents() {
        // Search
        const search = this.container.querySelector('#genericSearch');
        if (search && this.props.onSearch) {
            search.addEventListener('input', (e) => this.props.onSearch(e.target.value));
        }

        // Filters
        this.props.filterGroups?.forEach(group => {
            const select = this.container.querySelector(`#filter-${group.id}`);
            if (select && group.onChange) {
                select.addEventListener('change', (e) => group.onChange(e.target.value));
            }
        });

        // Sort
        const sort = this.container.querySelector('#genericSort');
        if (sort && this.props.onSort) {
            sort.addEventListener('change', (e) => this.props.onSort(e.target.value));
        }

        // Refresh
        const refresh = this.container.querySelector('#genericRefresh');
        if (refresh && this.props.onRefresh) {
            refresh.addEventListener('click', this.props.onRefresh);
        }

        // View Toggles
        const gridBtn = this.container.querySelector('#viewModeGrid');
        const listBtn = this.container.querySelector('#viewModeList');

        if (gridBtn && this.props.onToggleView) {
            gridBtn.addEventListener('click', () => {
                if (this.props.viewMode !== 'compact') this.props.onToggleView();
            });
        }
        if (listBtn && this.props.onToggleView) {
            listBtn.addEventListener('click', () => {
                if (this.props.viewMode === 'compact') this.props.onToggleView();
            });
        }
    }

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}
