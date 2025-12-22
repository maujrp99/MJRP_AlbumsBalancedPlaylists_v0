/**
 * SeriesController.js
 * 
 * The Brain of the V3 Architecture.
 * Responsible for:
 * 1. Orchestrating Data Stores (Albums, Artists, Playlists).
 * 2. Handling Business Logic (Filtering, Sorting, Blending).
 * 3. Routing User Actions to State Changes.
 * 
 * It DOES NOT manipulate the DOM directly. It calls View methods.
 */

import { albumStore } from '../stores/albums.js';

export default class SeriesController {
    constructor() {
        this.state = {
            activeSeries: null,
            filterMode: 'all',
            searchQuery: '',
            viewMode: 'grid' // 'grid' | 'list'
        };

        // Bind context
        this.handleSearch = this.handleSearch.bind(this);
        this.handleFilter = this.handleFilter.bind(this);
    }

    /**
     * Initialize the controller
     */
    init() {
        console.log("SeriesController Initialized 🧠");
        // TODO: Subscribe to stores
    }

    /**
     * Loads a specific series (Album, Artist, or Genre)
     * @param {string} type 
     * @param {string} id 
     */
    async loadSeries(type, id) {
        console.log(`Loading Series: ${type} / ${id}`);
        // TODO: Implement fetching logic
        this.state.activeSeries = { type, id };
        return []; // Return mock for now
    }

    handleSearch(query) {
        this.state.searchQuery = query;
        console.log("Search:", query);
        // TODO: Trigger View Update
    }

    handleFilter(filter) {
        this.state.filterMode = filter;
        console.log("Filter:", filter);
        // TODO: Trigger View Update
    }
}
