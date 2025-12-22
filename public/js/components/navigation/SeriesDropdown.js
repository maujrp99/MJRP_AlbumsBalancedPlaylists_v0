/**
 * SeriesDropdown.js
 * 
 * V3 Architecture - Modular Navigation Component
 * 
 * Responsibility: Render and manage Series dropdown in TopNav
 * - Entity type selection (Albums, Artists, Genres, Tracks, Playlists)
 * - Open/close state management
 * - Close on click outside
 */

import { getIcon } from '../Icons.js';

export class SeriesDropdown {
    constructor(options = {}) {
        this.currentPath = options.currentPath || window.location.pathname;
        this.onNavigate = options.onNavigate || (() => { });
        this.isOpen = false;

        // Series entity types with routes and availability
        this.entityTypes = [
            { label: 'Albums', route: '/albums', icon: 'Disc', available: true },
            { label: 'Artists', route: '/artists', icon: 'User', available: false },
            { label: 'Genres', route: '/genres', icon: 'Tag', available: false },
            { label: 'Tracks', route: '/tracks', icon: 'Music', available: false },
            { type: 'separator' },
            { label: 'Playlists', route: '/playlist-series', icon: 'List', available: true }
        ];

        // Bind methods
        this.handleOutsideClick = this.handleOutsideClick.bind(this);
    }

    /**
     * Get current active entity label
     */
    getActiveLabel() {
        for (const entity of this.entityTypes) {
            if (entity.type === 'separator') continue;
            if (this.currentPath.startsWith(entity.route)) {
                return entity.label;
            }
        }
        return 'Series';
    }

    /**
     * Render dropdown HTML
     */
    render() {
        const activeLabel = this.getActiveLabel();
        const isSeriesActive = this.entityTypes.some(e =>
            e.type !== 'separator' && this.currentPath.startsWith(e.route)
        );

        return `
            <div class="relative" id="seriesDropdownContainer">
                <button 
                    id="seriesDropdownBtn"
                    class="nav-link-glow text-sm font-semibold uppercase tracking-wider px-3 py-1.5 rounded-lg transition-all duration-300 flex items-center gap-1 ${isSeriesActive ? 'text-accent-primary bg-white/5' : 'text-muted'}"
                >
                    ${activeLabel}
                    ${getIcon('ChevronDown', `w-4 h-4 transition-transform duration-200 ${this.isOpen ? 'rotate-180' : ''}`)}
                </button>
                
                <div 
                    id="seriesDropdownMenu"
                    class="absolute top-full left-0 mt-2 w-48 glass-panel rounded-xl shadow-xl py-2 transition-all duration-200 ${this.isOpen ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible -translate-y-2'}"
                >
                    ${this.renderItems()}
                </div>
            </div>
        `;
    }

    /**
     * Render dropdown items
     */
    renderItems() {
        return this.entityTypes.map(entity => {
            if (entity.type === 'separator') {
                return `<div class="border-t border-white/10 my-2"></div>`;
            }

            const isActive = this.currentPath.startsWith(entity.route);
            const isDisabled = !entity.available;

            return `
                <a 
                    href="${entity.route}"
                    class="flex items-center gap-3 px-4 py-2 text-sm transition-all duration-200 ${isActive
                    ? 'text-accent-primary bg-white/10'
                    : isDisabled
                        ? 'text-muted/50 cursor-not-allowed'
                        : 'text-muted hover:text-white hover:bg-white/5'
                }"
                    data-link
                    ${isDisabled ? '' : ''}
                >
                    ${getIcon(entity.icon, 'w-4 h-4')}
                    <span class="flex-1">${entity.label}</span>
                    ${isActive ? getIcon('Check', 'w-4 h-4 text-accent-primary') : ''}
                    ${isDisabled ? '<span class="text-xs text-muted/50">Soon</span>' : ''}
                </a>
            `;
        }).join('');
    }

    /**
     * Attach event listeners
     */
    attachListeners() {
        const btn = document.getElementById('seriesDropdownBtn');
        const menu = document.getElementById('seriesDropdownMenu');
        const container = document.getElementById('seriesDropdownContainer');

        if (btn) {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggle();
            });
        }

        // Close on link click
        if (menu) {
            menu.querySelectorAll('a[data-link]').forEach(link => {
                link.addEventListener('click', (e) => {
                    // Don't navigate for disabled items
                    const entity = this.entityTypes.find(et => et.route === link.getAttribute('href'));
                    if (entity && !entity.available) {
                        e.preventDefault();
                        return;
                    }
                    this.close();
                });
            });
        }

        // Close on outside click
        document.addEventListener('click', this.handleOutsideClick);
    }

    /**
     * Handle click outside dropdown
     */
    handleOutsideClick(e) {
        const container = document.getElementById('seriesDropdownContainer');
        if (container && !container.contains(e.target)) {
            this.close();
        }
    }

    /**
     * Toggle dropdown
     */
    toggle() {
        this.isOpen ? this.close() : this.open();
    }

    /**
     * Open dropdown
     */
    open() {
        this.isOpen = true;
        this.updateDOM();
    }

    /**
     * Close dropdown
     */
    close() {
        this.isOpen = false;
        this.updateDOM();
    }

    /**
     * Update DOM to reflect state
     */
    updateDOM() {
        const menu = document.getElementById('seriesDropdownMenu');
        const chevron = document.querySelector('#seriesDropdownBtn svg');

        if (menu) {
            if (this.isOpen) {
                menu.classList.remove('opacity-0', 'invisible', '-translate-y-2');
                menu.classList.add('opacity-100', 'visible', 'translate-y-0');
            } else {
                menu.classList.add('opacity-0', 'invisible', '-translate-y-2');
                menu.classList.remove('opacity-100', 'visible', 'translate-y-0');
            }
        }

        if (chevron) {
            if (this.isOpen) {
                chevron.classList.add('rotate-180');
            } else {
                chevron.classList.remove('rotate-180');
            }
        }
    }

    /**
     * Cleanup
     */
    destroy() {
        document.removeEventListener('click', this.handleOutsideClick);
    }
}

export default SeriesDropdown;
