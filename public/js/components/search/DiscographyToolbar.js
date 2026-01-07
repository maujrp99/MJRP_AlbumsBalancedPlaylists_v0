/**
 * DiscographyToolbar
 * 
 * Renders filter controls for the Discography Grid.
 * Emits 'filter-change' events when user toggles buttons.
 * 
 * ARCH-18: Added item counters and Uncategorized filter
 */
import { getIcon } from '../Icons.js';

export class DiscographyToolbar {
    constructor(options = {}) {
        this.container = null;
        this.onFilterChange = options.onFilterChange || (() => { });
        this.activeFilters = {
            types: ['Album'], // Default to Albums only
            editions: ['standard', 'remaster']
        };
        // ARCH-18: Album counts for each type
        this.counts = {
            Album: 0,
            Single: 0,
            EP: 0,
            Compilation: 0,
            Live: 0,
            Uncategorized: 0
        };
    }

    /**
     * ARCH-18: Update the counts displayed on type buttons
     * @param {Object} counts - { Album: n, Single: n, EP: n, Compilation: n, Live: n, Uncategorized: n }
     */
    setCounts(counts) {
        this.counts = { ...this.counts, ...counts };
        if (this.container) {
            this._refresh();
        }
    }

    render() {
        return `
            <div class="discography-toolbar glass-panel p-4 mb-6 animate-fade-in-down">
                <div class="flex flex-col md:flex-row gap-4 justify-between items-center">
                    
                    <!-- Type Filters -->
                    <div class="flex flex-wrap gap-2">
                        <span class="text-xs font-bold text-gray-500 uppercase tracking-wider self-center mr-2">Show:</span>
                        ${this._renderTypeBtn('Album', 'Albums')}
                        ${this._renderTypeBtn('EP', 'EPs')}
                        ${this._renderTypeBtn('Single', 'Singles')}
                        ${this._renderTypeBtn('Compilation', 'Compendiums')}
                        ${this._renderTypeBtn('Live', 'Live')}
                        ${this._renderTypeBtn('Uncategorized', '?')}
                    </div>

                    <!-- Edition Filters -->
                    <div class="flex flex-wrap gap-2 border-l border-white/10 pl-0 md:pl-4">
                        ${this._renderEditionToggle('standard', 'Standard')}
                        ${this._renderEditionToggle('remaster', 'Remasters')}
                        ${this._renderEditionToggle('deluxe', 'Deluxe')}
                    </div>

                </div>
            </div>
        `;
    }

    _renderTypeBtn(type, label) {
        const isActive = this.activeFilters.types.includes(type);
        // Match Top Nav Active State (Flame Gradient)
        const activeClass = isActive
            ? 'bg-flame-gradient text-white shadow-lg shadow-brand-orange/20 border-white/20'
            : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white border-transparent hover:border-white/10';

        // ARCH-18: Icons for types (including new EP and Uncategorized)
        let icon = 'Disc';
        if (type === 'Single') icon = 'Music';
        if (type === 'EP') icon = 'Disc3';
        if (type === 'Live') icon = 'Mic';
        if (type === 'Compilation') icon = 'Layers';
        if (type === 'Uncategorized') icon = 'HelpCircle';

        // ARCH-18: Get count for this type
        const count = this.counts[type] || 0;
        const countDisplay = count > 0 ? ` (${count})` : '';

        return `
            <button 
                class="btn btn-sm ${activeClass} border transition-all duration-300 flex items-center gap-2 group transform hover:scale-105"
                data-type="${type}"
                onclick="window.handleDiscographyType('${type}')"
            >
                ${getIcon(icon, `w-3 h-3 ${isActive ? 'text-white' : 'text-gray-500 group-hover:text-white'}`)}
                ${label}${countDisplay}
            </button>
        `;
    }

    _renderEditionToggle(edition, label) {
        const isActive = this.activeFilters.editions.includes(edition);
        const icon = isActive ? 'Check' : 'Circle';
        const colorClass = isActive ? 'text-green-400' : 'text-gray-500';

        return `
            <button 
                class="text-xs font-medium flex items-center gap-1.5 px-2 py-1 rounded hover:bg-white/5 transition-colors ${isActive ? 'text-white' : 'text-gray-400'}"
                data-edition="${edition}"
                onclick="window.handleDiscographyEdition('${edition}')"
            >
                ${getIcon(icon, `w-3 h-3 ${colorClass}`)}
                ${label}
            </button>
        `;
    }

    mount(container) {
        this.container = container;
        this.container.innerHTML = this.render();

        // Bind global handlers (hacky but effective for simple V3 injections)
        window.handleDiscographyType = (type) => this.toggleType(type);
        window.handleDiscographyEdition = (edition) => this.toggleEdition(edition);
    }

    toggleType(type) {
        if (this.activeFilters.types.includes(type)) {
            this.activeFilters.types = this.activeFilters.types.filter(t => t !== type);
        } else {
            this.activeFilters.types.push(type);
        }
        this._refresh();
    }

    toggleEdition(edition) {
        if (this.activeFilters.editions.includes(edition)) {
            this.activeFilters.editions = this.activeFilters.editions.filter(e => e !== edition);
        } else {
            this.activeFilters.editions.push(edition);
        }
        this._refresh();
    }

    _refresh() {
        if (this.container) {
            this.container.innerHTML = this.render();
            // Re-bind listeners not needed as using window globals, but emitting event is key
            this.onFilterChange(this.activeFilters);
        }
    }
}
