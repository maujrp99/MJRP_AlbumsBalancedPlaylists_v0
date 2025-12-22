/**
 * SeriesView.js
 * 
 * V3 "Thin Orchestrator" - Extends BaseView
 * 
 * Responsibilities:
 * - Shell HTML generation (render)
 * - Component mounting (mount)
 * - DOM event delegation to Controller
 * - Lazy loading / infinite scroll for albums grid
 * 
 * DOES NOT: Contains business logic. That lives in SeriesController.
 */

import { BaseView } from './BaseView.js';
import { db } from '../app.js';

// Components
import SeriesHeader from '../components/series/SeriesHeader.js';
import SeriesFilterBar from '../components/series/SeriesFilterBar.js';
import SeriesGridRenderer from '../components/series/SeriesGridRenderer.js';

// Lazy Loading Config
const LAZY_LOAD_CONFIG = {
    initialBatchSize: 10,       // Load first 10 items (show quickly)
    batchSize: 10,              // Load 10 more on scroll
    rootMargin: '200px',        // Trigger 200px before reaching bottom
};

export default class SeriesView extends BaseView {
    constructor(controller) {
        super();
        this.controller = controller;
        this.components = {};

        // Lazy loading state
        this.displayedCount = 0;
        this.allItems = [];
        this.loadMoreObserver = null;
    }

    /**
     * Render - Returns shell HTML
     */
    async render(params) {
        console.log('[SeriesView] Rendering shell...', params);

        return `
            <div id="series-view-layout" class="flex flex-col min-h-screen bg-gray-900 text-white">
                <!-- Header Mount Point -->
                <header id="series-header-mount" class="sticky top-0 z-30 bg-gray-900/95 backdrop-blur border-b border-gray-800 shadow-lg">
                    <div class="animate-pulse h-20 bg-gray-800/50"></div>
                </header>

                <div class="flex flex-1 overflow-hidden">
                    <!-- Sidebar (Filters) - Desktop -->
                    <aside id="series-sidebar" class="w-64 bg-gray-950 hidden lg:flex flex-col border-r border-gray-800">
                        <div id="series-filter-mount" class="flex-1 p-4 overflow-y-auto"></div>
                    </aside>

                    <!-- Main Content Area -->
                    <main class="flex-1 overflow-y-auto scroll-smooth" id="series-main-scroll">
                        <!-- Mobile Filter Toggle -->
                        <div class="lg:hidden p-4 border-b border-gray-800">
                            <button id="mobile-filter-toggle" class="btn btn-ghost w-full flex items-center justify-center gap-2">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 010 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h10a1 1 0 010 2H4a1 1 0 01-1-1zM3 16a1 1 0 011-1h7a1 1 0 010 2H4a1 1 0 01-1-1z"/>
                                </svg>
                                Filters & Sort
                            </button>
                        </div>

                        <!-- Albums Grid -->
                        <section id="series-grid-mount" class="p-4 md:p-6">
                            <!-- GridRenderer will populate this -->
                            <div class="grid-skeleton grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                                ${this.renderSkeletonCards(12)}
                            </div>
                        </section>

                        <!-- Load More Sentinel (for IntersectionObserver) -->
                        <div id="load-more-sentinel" class="h-20 flex items-center justify-center">
                            <div id="load-more-spinner" class="hidden">
                                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
                            </div>
                        </div>
                    </main>
                </div>

                <!-- Mobile Filter Drawer -->
                <div id="mobile-filter-drawer" class="fixed inset-0 z-50 hidden">
                    <div class="absolute inset-0 bg-black/60" id="mobile-filter-backdrop"></div>
                    <div class="absolute right-0 top-0 h-full w-80 bg-gray-900 p-4 shadow-xl">
                        <div id="mobile-filter-content"></div>
                    </div>
                </div>

                <!-- Toast Container -->
                <div id="toast-container" class="fixed bottom-4 right-4 z-50"></div>
            </div>
        `;
    }

    /**
     * Generate skeleton card placeholders
     */
    renderSkeletonCards(count) {
        return Array(count).fill(0).map(() => `
            <div class="animate-pulse">
                <div class="aspect-square bg-gray-800 rounded-lg mb-2"></div>
                <div class="h-4 bg-gray-800 rounded w-3/4 mb-1"></div>
                <div class="h-3 bg-gray-800 rounded w-1/2"></div>
            </div>
        `).join('');
    }

    /**
     * Mount - Initialize components and controller
     */
    async mount(params) {
        console.log('[SeriesView] Mounting components...', params);

        // Link controller to view
        this.controller.setView(this);
        this.controller.init(db, this);

        // Mount sub-components
        await this.initComponents();

        // Setup lazy loading
        this.setupLazyLoading();

        // Setup mobile filter toggle
        this.setupMobileFilters();

        // Determine scope from URL params
        const seriesId = params?.query?.seriesId || params?.seriesId;
        const scopeType = seriesId ? 'SINGLE' : 'ALL';

        // Load data via controller
        await this.controller.loadScope(scopeType, seriesId);
    }

    /**
     * Initialize child components
     */
    async initComponents() {
        // Header
        const headerMount = document.getElementById('series-header-mount');
        if (headerMount) {
            this.components.header = new SeriesHeader({
                container: headerMount,
                props: { metadata: null }
            });
            this.components.header.mount();
        }

        // Filter Bar (Sidebar)
        const filterMount = document.getElementById('series-filter-mount');
        if (filterMount) {
            this.components.filters = new SeriesFilterBar({
                container: filterMount,
                props: {
                    onSearch: (q) => this.controller.handleSearch(q),
                    onSort: (s) => this.controller.handleSort(s)
                }
            });
            this.components.filters.mount();
        }

        // Grid Renderer
        const gridMount = document.getElementById('series-grid-mount');
        if (gridMount) {
            this.components.grid = new SeriesGridRenderer({
                container: gridMount,
                props: { items: [], layout: 'grid' }
            });
            this.components.grid.mount();
        }

        console.log('[SeriesView] Components mounted ✅');
    }

    /**
     * Setup IntersectionObserver for lazy loading
     */
    setupLazyLoading() {
        const sentinel = document.getElementById('load-more-sentinel');
        if (!sentinel) return;

        this.loadMoreObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && this.displayedCount < this.allItems.length) {
                    this.loadMoreItems();
                }
            });
        }, {
            root: document.getElementById('series-main-scroll'),
            rootMargin: LAZY_LOAD_CONFIG.rootMargin
        });

        this.loadMoreObserver.observe(sentinel);
    }

    /**
     * Load more items (called by IntersectionObserver)
     */
    loadMoreItems() {
        if (this.displayedCount >= this.allItems.length) return;

        const spinner = document.getElementById('load-more-spinner');
        if (spinner) spinner.classList.remove('hidden');

        // Simulate small delay for UX
        setTimeout(() => {
            const nextBatch = this.allItems.slice(
                this.displayedCount,
                this.displayedCount + LAZY_LOAD_CONFIG.batchSize
            );

            this.displayedCount += nextBatch.length;

            // Append to grid
            if (this.components.grid) {
                this.components.grid.appendItems(nextBatch);
            }

            if (spinner) spinner.classList.add('hidden');
            console.log(`[SeriesView] Lazy loaded: ${this.displayedCount}/${this.allItems.length}`);
        }, 100);
    }

    /**
     * Setup mobile filter drawer toggle
     */
    setupMobileFilters() {
        const toggle = document.getElementById('mobile-filter-toggle');
        const drawer = document.getElementById('mobile-filter-drawer');
        const backdrop = document.getElementById('mobile-filter-backdrop');

        if (toggle && drawer) {
            toggle.addEventListener('click', () => drawer.classList.remove('hidden'));
            backdrop?.addEventListener('click', () => drawer.classList.add('hidden'));
        }
    }

    // =========================================
    // VIEW UPDATE METHODS (called by Controller)
    // =========================================

    /**
     * Update loading state
     */
    setLoading(isLoading) {
        const gridMount = document.getElementById('series-grid-mount');
        if (!gridMount) return;

        if (isLoading) {
            gridMount.innerHTML = `
                <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    ${this.renderSkeletonCards(LAZY_LOAD_CONFIG.initialBatchSize)}
                </div>
            `;
        }
    }

    /**
     * Update albums (with lazy loading support)
     */
    updateAlbums(albums) {
        console.log('[SeriesView] updateAlbums:', albums?.length);

        this.allItems = albums || [];
        this.displayedCount = 0;

        // Load initial batch
        const initialBatch = this.allItems.slice(0, LAZY_LOAD_CONFIG.initialBatchSize);
        this.displayedCount = initialBatch.length;

        if (this.components.grid) {
            this.components.grid.update({ items: initialBatch, layout: 'grid' });
        }

        // Update sentinel visibility
        const sentinel = document.getElementById('load-more-sentinel');
        if (sentinel) {
            sentinel.style.display = this.allItems.length > this.displayedCount ? 'flex' : 'none';
        }
    }

    /**
     * Update loading progress
     */
    updateProgress(progress) {
        // TODO: Use InlineProgress component
        console.log(`[SeriesView] Progress: ${progress.current}/${progress.total} - ${progress.label || ''}`);
    }

    /**
     * Update header info
     */
    updateHeader(data) {
        if (this.components.header) {
            this.components.header.update({
                metadata: {
                    title: data.title,
                    description: data.description,
                    stats: { count: this.allItems.length }
                }
            });
        }
    }

    /**
     * Destroy - Cleanup
     */
    destroy() {
        console.log('[SeriesView] Destroying...');

        // Disconnect observer
        if (this.loadMoreObserver) {
            this.loadMoreObserver.disconnect();
            this.loadMoreObserver = null;
        }

        // Unmount components
        Object.values(this.components).forEach(c => {
            if (c && typeof c.unmount === 'function') c.unmount();
        });
        this.components = {};

        super.destroy();
    }
}
