/**
 * SeriesView.js (Formerly AlbumsView)
 * 
 * V3 "Thin Orchestrator".
 * Responsibility: Mounts Components and delegates events to Controller.
 */

import Component from '../components/base/Component.js';

export default class SeriesView {
    constructor(controller) {
        this.controller = controller;
        this.components = {};
        this.container = document.getElementById('app'); // Main mounting point
    }

    /**
     * Main Entry Point
     */
    async mount() {
        console.log("SeriesView Mounting... 🚀");
        this.renderShell();

        // Initialize Sub-Components
        await this.initComponents();
    }

    /**
     * Renders the static layout shell (Header, Sidebar, Main Content Area)
     */
    renderShell() {
        this.container.innerHTML = `
            <div id="series-view-layout" class="flex flex-col h-screen bg-gray-900 text-white">
                <header id="series-header-mount" class="p-4 border-b border-gray-800"></header>
                
                <main class="flex-1 overflow-hidden flex">
                    <!-- Sidebar (Filters/Nav) -->
                    <aside id="series-sidebar-mount" class="w-64 bg-gray-950 hidden md:block p-4 overflow-y-auto"></aside>
                    
                    <!-- Main Grid -->
                    <section id="series-grid-mount" class="flex-1 p-4 overflow-y-auto relative"></section>
                </main>
                
                <!-- Blending Overlay Mount Point -->
                <div id="blending-menu-mount"></div>
            </div>
        `;
    }

    /**
     * mounts the child components into the shell
     */
    async initComponents() {
        // Placeholder for Component Mounting
        // this.components.header = new SeriesHeader({ container: document.getElementById('series-header-mount') });
        // this.components.header.mount();

        console.log("Components Initialized (Placeholders)");
    }

    update(state) {
        console.log("SeriesView Updating with State:", state);
        // Propagate updates to components
        // Object.values(this.components).forEach(comp => comp.update(state));
    }
}
