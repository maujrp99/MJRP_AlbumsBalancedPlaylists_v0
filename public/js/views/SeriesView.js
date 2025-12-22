/**
 * SeriesView.js (Formerly AlbumsView)
 * 
 * V3 "Thin Orchestrator".
 * Responsibility: Mounts Components and delegates events to Controller.
 * 
 * NOW extends BaseView for proper Router integration.
 */

import { BaseView } from './BaseView.js';
import SeriesHeader from '../components/series/SeriesHeader.js';
import SeriesFilterBar from '../components/series/SeriesFilterBar.js';
import SeriesGridRenderer from '../components/series/SeriesGridRenderer.js';

export default class SeriesView extends BaseView {
    constructor(controller) {
        super();
        this.controller = controller;
        this.components = {};
    }

    /**
     * Render Method - Must return HTML string for the router
     */
    async render(params) {
        console.log("SeriesView Rendering... 🚀", params);

        // Return the shell HTML that will be populated by mount()
        return `
            <div id="series-view-layout" class="flex flex-col h-screen bg-gray-900 text-white">
                <!-- Header Mount -->
                <header id="series-header-mount" class="p-4 border-b border-gray-800 bg-gray-900/95 backdrop-blur z-20 sticky top-0 shadow-md"></header>
                
                <main class="flex-1 overflow-hidden flex relative">
                    <!-- Sidebar (Filters/Nav) -->
                    <aside class="w-72 bg-gray-950 hidden md:flex flex-col border-r border-gray-800 z-10">
                        <div id="series-sidebar-mount" class="flex-1 p-5 overflow-y-auto"></div>
                    </aside>
                    
                    <!-- Main Grid -->
                    <section id="series-grid-mount" class="flex-1 p-4 md:p-6 overflow-y-auto relative scroll-smooth bg-gradient-to-b from-gray-900 to-black"></section>
                </main>
                
                <!-- Blending Overlay Mount Point -->
                <div id="blending-menu-mount"></div>
                
                <!-- Toast/Modal Mount Points -->
                <div id="modal-container"></div>
            </div>
        `;
    }

    /**
     * Mount Method - Called after render, sets up components and events
     */
    async mount(params) {
        console.log("SeriesView Mounting Components... 🔧", params);

        // Initialize Sub-Components
        await this.initComponents();

        // Initial Data Load (Mock for S12 Phase 3 Verification)
        this.components.header.update({
            metadata: {
                title: "V3 Series Demo",
                description: "Architecture Refactor in Progress - Phase 3",
                stats: { count: 3, duration: "2h 15m" }
            }
        });

        this.components.grid.update({
            items: [
                { id: 1, title: "Dark Side of the Moon", artist: "Pink Floyd", coverUrl: "https://upload.wikimedia.org/wikipedia/en/3/3b/Dark_Side_of_the_Moon.png", releaseDate: "1973-03-01" },
                { id: 2, title: "OK Computer", artist: "Radiohead", coverUrl: "https://upload.wikimedia.org/wikipedia/en/b/ba/Radioheadokcomputer.png", releaseDate: "1997-05-21" },
                { id: 3, title: "Abbey Road", artist: "The Beatles", coverUrl: "https://upload.wikimedia.org/wikipedia/en/4/42/Beatles_-_Abbey_Road.jpg", releaseDate: "1969-09-26" }
            ],
            layout: 'grid'
        });
    }

    /**
     * Mounts the child components into the shell
     */
    async initComponents() {
        // 1. Header
        const headerMount = document.getElementById('series-header-mount');
        if (headerMount) {
            this.components.header = new SeriesHeader({
                container: headerMount,
                props: { metadata: null }
            });
            this.components.header.mount();
        }

        // 2. Sidebar (Filter Bar)
        const sidebarMount = document.getElementById('series-sidebar-mount');
        if (sidebarMount) {
            this.components.filters = new SeriesFilterBar({
                container: sidebarMount,
                props: {
                    onSearch: (q) => this.controller?.handleSearch(q),
                    onSort: (s) => this.controller?.handleFilter(s)
                }
            });
            this.components.filters.mount();
        }

        // 3. Grid Renderer
        const gridMount = document.getElementById('series-grid-mount');
        if (gridMount) {
            this.components.grid = new SeriesGridRenderer({
                container: gridMount,
                props: { items: [], layout: 'grid' }
            });
            this.components.grid.mount();
        }

        console.log("Components Initialized & Mounted ✅");
    }

    /**
     * Destroy Method - Cleanup when navigating away
     */
    destroy() {
        console.log("SeriesView Destroying... 💤");

        // Unmount all components
        Object.values(this.components).forEach(component => {
            if (component && typeof component.unmount === 'function') {
                component.unmount();
            }
        });
        this.components = {};

        // Call parent cleanup
        super.destroy();
    }

    /**
     * Update Method - Called when stores notify
     */
    update(state) {
        console.log("SeriesView Updating with State:", state);
        if (state?.series && this.components.header) {
            this.components.header.update({ metadata: state.series });
        }
        if (state?.items && this.components.grid) {
            this.components.grid.update({ items: state.items });
        }
    }
}
