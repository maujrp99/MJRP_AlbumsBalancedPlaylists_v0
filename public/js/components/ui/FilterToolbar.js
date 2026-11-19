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
import { escapeHtml } from '../../utils/stringUtils.js';

export default class FilterToolbar extends Component {
    constructor(props) {
        super(props);
    }

    /**
     * The search field is drawn once and stays the same element for as long as the toolbar lives:
     * redrawing it on every update took the cursor away after each letter (UAT-179).
     * The other controls are redrawn only when what they show has changed.
     */
    render() {
        if (!this.container.querySelector('#genericSearch')) {
            this.container.innerHTML = `
            <div class="filters-section glass-panel p-4 mb-6 fade-in relative">
                <div class="filters-row flex flex-wrap gap-3 items-center">
                    <div class="search-bar relative flex-1 min-w-[200px]">
                        <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                            ${getIcon('Search', 'w-5 h-5')}
                        </span>
                        <input
                            type="search"
                            id="genericSearch"
                            placeholder="Search..."
                            class="form-control pl-10 w-full"
                        />
                    </div>
                    <div class="filters-controls contents"></div>
                </div>
            </div>`;
            this._controlsSignature = null;
            const search = this.container.querySelector('#genericSearch');
            search.value = this.props.searchQuery || '';
            search.addEventListener('input', (e) => this.props.onSearch?.(e.target.value));
        }

        this._syncSearch();
        this._renderControls();
    }

    /** Bring the field in line with the state, unless the person is typing in it. */
    _syncSearch() {
        const search = this.container.querySelector('#genericSearch');
        const wanted = this.props.searchQuery || '';
        if (search && document.activeElement !== search && search.value !== wanted) search.value = wanted;
    }

    /** What the controls beside the search show; they are redrawn only when this changes. */
    _controlsState() {
        const { sortOptions = [], currentSort = '', filterGroups = [], viewMode = null } = this.props;
        return JSON.stringify({
            currentSort,
            viewMode,
            refresh: !!this.props.onRefresh,
            sort: sortOptions.map(option => [option.value, option.label]),
            groups: filterGroups.map(group => [group.id, group.label, String(group.value), group.options.map(option => [option.value, option.label])])
        });
    }

    _renderControls() {
        const signature = this._controlsState();
        if (signature === this._controlsSignature) return;
        this._controlsSignature = signature;

        const {
            sortOptions = [],
            currentSort = '',
            filterGroups = [],
            viewMode = null
        } = this.props;

        this.container.querySelector('.filters-controls').innerHTML = `
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
        // Filters: the handler is looked up when the person changes the control, so it is always the
        // one of the latest props even though the control itself was not redrawn
        this.props.filterGroups?.forEach(group => {
            const select = this.container.querySelector(`#filter-${group.id}`);
            if (select) {
                select.addEventListener('change', (e) => {
                    const current = this.props.filterGroups?.find(item => item.id === group.id);
                    current?.onChange?.(e.target.value);
                });
            }
        });

        // Sort
        const sort = this.container.querySelector('#genericSort');
        if (sort) {
            sort.addEventListener('change', (e) => this.props.onSort?.(e.target.value));
        }

        // Refresh
        const refresh = this.container.querySelector('#genericRefresh');
        if (refresh) {
            refresh.addEventListener('click', () => this.props.onRefresh?.());
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
        return escapeHtml(text);
    }
}
