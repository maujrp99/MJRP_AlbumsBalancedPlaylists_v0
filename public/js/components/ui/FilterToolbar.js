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
 * - filtersInSheet: boolean (optional) - on the phone, only the search stays on the screen and a
 *   «Filters» button (with how many are on) opens a sheet with the rest (F76, components/ui/FilterSheet.js);
 *   the filters that are on show as chips that remove themselves. The computer is not touched.
 */

import Component from '../base/Component.js';
import { getIcon } from '../Icons.js';
import { escapeHtml } from '../../utils/stringUtils.js';
import { isPhone, onPhoneChange } from '../../utils/isPhone.js';
import { SafeDOM } from '../../utils/SafeDOM.js';
import { activeFilters, clearFilters, openFilterSheet } from './FilterSheet.js';

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
        this._renderPhoneBar();
    }

    onMount() {
        // Turning the phone, or a window resized across the line, mounts or takes off the phone's bar
        this._stopHearingPhone = onPhoneChange(() => this._renderPhoneBar());
    }

    onUnmount() {
        this._stopHearingPhone?.();
        this._filterSheet?.sheet.close();
        this._filterSheet = null;
    }

    /** The phone's bar: the «Filters» button beside the search, and the chips of the filters on. */
    _renderPhoneBar() {
        const row = this.container.querySelector('.filters-row');
        const wanted = Boolean(this.props.filtersInSheet) && isPhone();
        const section = this.container.querySelector('.filters-section');
        section?.classList.toggle('filters-section--sheet', wanted);
        if (!wanted) {
            this.container.querySelectorAll('.filters-phone').forEach(element => element.remove());
            return;
        }
        let button = this.container.querySelector('.filters-phone-button');
        if (!button) {
            button = SafeDOM.button({ type: 'button', className: 'filters-phone filters-phone-button', 'aria-haspopup': 'dialog' });
            button.addEventListener('click', () => this._openSheet());
            row.appendChild(button);
        }
        const on = activeFilters(this.props.filterGroups);
        SafeDOM.replaceChildren(button, [
            SafeDOM.fromHTML(getIcon('Layers', 'filters-phone-button__icon')),
            SafeDOM.span({}, 'Filters'),
            on.length > 0 ? SafeDOM.span({ className: 'filters-phone-button__count' }, String(on.length)) : null
        ].filter(Boolean));
        button.setAttribute('aria-label', on.length > 0 ? `Filters, ${on.length} on` : 'Filters');
        button.classList.toggle('is-on', on.length > 0);
        this._renderChips(on);
    }

    /** One chip per filter on, «Artist: Rush ✕», that turns it off; «Clear all» with two or more. */
    _renderChips(on) {
        this.container.querySelector('.filters-chips')?.remove();
        if (on.length === 0) return;
        const chips = on.map(({ group, name, value }) => {
            const chip = SafeDOM.button({ type: 'button', className: 'filters-chip', 'aria-label': `Remove the filter ${name}: ${value}` }, [
                SafeDOM.span({ className: 'filters-chip__text' }, `${name}: ${value}`),
                SafeDOM.fromHTML(getIcon('X', 'filters-chip__x'))
            ]);
            chip.addEventListener('click', () => group.onChange?.('all'));
            return chip;
        });
        if (on.length > 1) {
            const clear = SafeDOM.button({ type: 'button', className: 'filters-chips__clear' }, 'Clear all');
            clear.addEventListener('click', () => clearFilters(this.props.filterGroups));
            chips.push(clear);
        }
        this.container.querySelector('.filters-section')?.appendChild(SafeDOM.div({ className: 'filters-phone filters-chips' }, chips));
    }

    _openSheet() {
        if (this._filterSheet?.sheet.isOpen()) return;
        this._filterSheet = openFilterSheet(() => this.props, () => { this._filterSheet = null; });
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
        this._filterSheet?.sync(); // the open sheet of the phone shows what changed

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
